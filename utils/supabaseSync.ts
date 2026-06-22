import { getSupabase } from './supabaseClient';
import { ProgressionData, saveProgression, processDailyRollover } from './progression';
import { saveCampaign } from './campaign';

// helper to calculate total cumulative experience representation
export function getCumulativeXp(level: number, xp: number): number {
  let total = xp;
  for (let i = 1; i < level; i++) {
    total += i * 500; // using standard formula from getXpNeeded (level * 500)
  }
  return total;
}

const activeSyncs = new Map<string, Promise<{ syncedData: ProgressionData; source: 'local' | 'cloud' }>>();

export async function syncUserData(
  userId: string, 
  localData: ProgressionData
): Promise<{ syncedData: ProgressionData; source: 'local' | 'cloud' }> {
  // Prevent concurrent synchronization processes for the same user ID
  const activePromise = activeSyncs.get(userId);
  if (activePromise) {
    console.log(`[Sync] Re-using already running synchronization promise for user ${userId}.`);
    return activePromise;
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }

  const currentSyncProcess = (async (): Promise<{ syncedData: ProgressionData; source: 'local' | 'cloud' }> => {
    // Fetch cloud data for the user
    const { data: cloudRow, error: fetchError } = await supabase
      .from('battle_card_game_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching game data from cloud:', fetchError);
      if (fetchError.message?.includes('relation "battle_card_game_data" does not exist') || fetchError.code === '42P01') {
        throw new Error("Missing Supabase Table! Please execute the SQL commands found in 'supabase_schema.sql' in your Supabase SQL Editor to initialize the 'battle_card_game_data' database table.");
      }
      throw fetchError;
    }

    if (!cloudRow) {
      // If no data exists on the DB, sync the current local data to the cloud
      console.log('No cloud data exists. Syncing local data to the cloud...');
      const { error: insertError } = await supabase
        .from('battle_card_game_data')
        .upsert({
          user_id: userId,
          level: localData.level,
          xp: localData.xp,
          gold: localData.gold,
          campaign_cleared: localData.campaignState?.areasCleared || 0,
          campaign_streak: localData.campaignState?.currentWinStreak || 0,
          campaign_best: localData.campaignState?.bestWinStreak || 0,
          progression_data: localData,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error upserting local data to cloud:', insertError);
        throw insertError;
      }

      return { syncedData: localData, source: 'local' };
    } else {
      // There is existing cloud data! Let's resolve the desync
      const cloudProgRaw: ProgressionData = cloudRow.progression_data;
      const cloudProg = processDailyRollover(cloudProgRaw);

      let campaignChangedOnCloud = false;
      const hasLocalCampaign = !!localData.campaignState;
      const hasCloudCampaign = !!cloudProg.campaignState;

      if (hasLocalCampaign || hasCloudCampaign) {
        // Merge campaign statistics (Highest Cleared, Streak, and Best)
        const localCleared = localData.campaignState?.areasCleared || 0;
        const localStreak = localData.campaignState?.currentWinStreak || 0;
        const localBest = localData.campaignState?.bestWinStreak || 0;

        const cloudCleared = cloudProg.campaignState?.areasCleared || 0;
        const cloudStreak = cloudProg.campaignState?.currentWinStreak || 0;
        const cloudBest = cloudProg.campaignState?.bestWinStreak || 0;

        const maxCleared = Math.max(localCleared, cloudCleared);
        const maxStreak = Math.max(localStreak, cloudStreak);
        const maxBest = Math.max(localBest, cloudBest);

        // Ensure localData campaignState has the maximums merged
        if (localData.campaignState) {
          if (
            localData.campaignState.areasCleared !== maxCleared ||
            localData.campaignState.currentWinStreak !== maxStreak ||
            localData.campaignState.bestWinStreak !== maxBest
          ) {
            localData.campaignState = {
              ...localData.campaignState,
              areasCleared: maxCleared,
              currentWinStreak: maxStreak,
              bestWinStreak: maxBest
            };
          }
        } else {
          localData.campaignState = {
            nodes: cloudProg.campaignState?.nodes || [],
            currentNodeIndex: cloudProg.campaignState?.currentNodeIndex || 0,
            rulesFormat: cloudProg.campaignState?.rulesFormat || 'STREET',
            theme: cloudProg.campaignState?.theme || 'GRASSLANDS',
            details: cloudProg.campaignState?.details || [],
            areasCleared: maxCleared,
            currentWinStreak: maxStreak,
            bestWinStreak: maxBest
          };
        }

        // Ensure cloudProg campaignState has the maximums merged
        if (cloudProg.campaignState) {
          if (
            cloudProg.campaignState.areasCleared !== maxCleared ||
            cloudProg.campaignState.currentWinStreak !== maxStreak ||
            cloudProg.campaignState.bestWinStreak !== maxBest
          ) {
            cloudProg.campaignState = {
              ...cloudProg.campaignState,
              areasCleared: maxCleared,
              currentWinStreak: maxStreak,
              bestWinStreak: maxBest
            };
            campaignChangedOnCloud = true;
          }
        } else {
          cloudProg.campaignState = {
            nodes: localData.campaignState?.nodes || [],
            currentNodeIndex: localData.campaignState?.currentNodeIndex || 0,
            rulesFormat: localData.campaignState?.rulesFormat || 'STREET',
            theme: localData.campaignState?.theme || 'GRASSLANDS',
            details: localData.campaignState?.details || [],
            areasCleared: maxCleared,
            currentWinStreak: maxStreak,
            bestWinStreak: maxBest
          };
          campaignChangedOnCloud = true;
        }

        if (campaignChangedOnCloud) {
          console.log('[Sync] Campaign stats were higher locally. Cloud campaign stats bumped to match local max values.');
        }
      }
      
      const localTotalXp = getCumulativeXp(localData.level, localData.xp);
      const cloudTotalXp = getCumulativeXp(cloudProg.level, cloudProg.xp);
 
      console.log(`Local XP: ${localTotalXp} (Level ${localData.level}), Cloud XP: ${cloudTotalXp} (Level ${cloudProg.level})`);
 
      const getCosmeticsCount = (data: ProgressionData) => {
        return (data.unlockedCardBacks?.length || 0) + (data.unlockedCardFaces?.length || 0);
      };
 
      let localIsBetter = false;
      if (localTotalXp > cloudTotalXp) {
        localIsBetter = true;
      } else if (localTotalXp < cloudTotalXp) {
        localIsBetter = false;
      } else {
        // Total XP is identical. Let's apply tiebreaker logic!
        const localCosmetics = getCosmeticsCount(localData);
        const cloudCosmetics = getCosmeticsCount(cloudProg);
        console.log(`[Sync Tiebreaker] XP is identical (${localTotalXp}). Comparing cosmetics: Local has ${localCosmetics}, Cloud has ${cloudCosmetics}`);
        
        if (localCosmetics > cloudCosmetics) {
          localIsBetter = true;
        } else if (localCosmetics < cloudCosmetics) {
          localIsBetter = false;
        } else {
          // Cosmetics are identical. Check Gold.
          console.log(`[Sync Tiebreaker] Cosmetics counts are identical. Comparing gold: Local has ${localData.gold}, Cloud has ${cloudProg.gold}`);
          if (localData.gold > cloudProg.gold) {
            localIsBetter = true;
          } else {
            localIsBetter = false; // Default to cloud/local (cloud if tie)
          }
        }
      }
 
      if (localIsBetter) {
        // Local is prioritized, sync local to cloud (overwriting cloud)
        console.log('Local progression is chosen. Overwriting cloud data...');
        const { error: updateError } = await supabase
          .from('battle_card_game_data')
          .update({
            level: localData.level,
            xp: localData.xp,
            gold: localData.gold,
            campaign_cleared: localData.campaignState?.areasCleared || 0,
            campaign_streak: localData.campaignState?.currentWinStreak || 0,
            campaign_best: localData.campaignState?.bestWinStreak || 0,
            progression_data: localData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
 
        if (updateError) {
          console.error('Error updating cloud data with local progression:', updateError);
          throw updateError;
        }
 
        if (localData.campaignState) {
          saveCampaign(localData.campaignState);
        }
        return { syncedData: localData, source: 'local' };
      } else {
        // Cloud is prioritized (or completely identical), use the cloud data (overwriting local)
        console.log('Cloud progression is chosen (or identical). Overwriting local data...');
        
        // If daily checklist rollover/streak updates occurred, or highest recorded campaign values were lower than local (campaignChangedOnCloud is true)
        if (JSON.stringify(cloudProg) !== JSON.stringify(cloudProgRaw) || campaignChangedOnCloud) {
          console.log('[Sync] Saving processed real-time rollover / campaign updates to the cloud database...');
          try {
            await supabase
              .from('battle_card_game_data')
              .update({
                level: cloudProg.level,
                xp: cloudProg.xp,
                gold: cloudProg.gold,
                campaign_cleared: cloudProg.campaignState?.areasCleared || 0,
                campaign_streak: cloudProg.campaignState?.currentWinStreak || 0,
                campaign_best: cloudProg.campaignState?.bestWinStreak || 0,
                progression_data: cloudProg,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userId);
          } catch (updateDbError) {
            console.error('[Sync] Failed to write processed real-time rollover / campaign back to cloud:', updateDbError);
          }
        }
 
        saveProgression(cloudProg); // Saves cloud progression to local storage
        if (cloudProg.campaignState) {
          saveCampaign(cloudProg.campaignState);
        }
        return { syncedData: cloudProg, source: 'cloud' };
      }
    }
  })();

  activeSyncs.set(userId, currentSyncProcess);

  try {
    return await currentSyncProcess;
  } finally {
    activeSyncs.delete(userId);
  }
}

// Function to push standard progress updates to cloud whenever local progression changes
export async function pushProgressionUpdate(userId: string, currentData: ProgressionData) {
  const supabase = getSupabase();
  if (!supabase) {
    console.log("[Sync Debug] pushProgressionUpdate called but supabase is null.");
    return;
  }

  console.log(`[Sync Debug] Pushing progression update for user ${userId}:`, currentData);

  try {
    const { error } = await supabase
      .from('battle_card_game_data')
      .upsert({
        user_id: userId,
        level: currentData.level,
        xp: currentData.xp,
        gold: currentData.gold,
        campaign_cleared: currentData.campaignState?.areasCleared || 0,
        campaign_streak: currentData.campaignState?.currentWinStreak || 0,
        campaign_best: currentData.campaignState?.bestWinStreak || 0,
        progression_data: currentData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Sync Debug] Error in pushProgressionUpdate:', error);
    } else {
      console.log('[Sync Debug] Successfully pushed progression update.');
    }
  } catch (err) {
    console.error('[Sync Debug] Caught exception in pushProgressionUpdate:', err);
  }
}
