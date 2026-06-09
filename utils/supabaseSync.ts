import { getSupabase } from './supabaseClient';
import { ProgressionData, saveProgression } from './progression';

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
      const cloudProg: ProgressionData = cloudRow.progression_data;
      
      const localTotalXp = getCumulativeXp(localData.level, localData.xp);
      const cloudTotalXp = getCumulativeXp(cloudProg.level, cloudProg.xp);

      console.log(`Local XP: ${localTotalXp} (Level ${localData.level}), Cloud XP: ${cloudTotalXp} (Level ${cloudProg.level})`);

      if (localTotalXp > cloudTotalXp) {
        // Local has higher XP, sync local to cloud (overwriting cloud)
        console.log('Local has higher XP. Overwriting cloud data...');
        const { error: updateError } = await supabase
          .from('battle_card_game_data')
          .update({
            level: localData.level,
            xp: localData.xp,
            gold: localData.gold,
            progression_data: localData,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating cloud data with local progression:', updateError);
          throw updateError;
        }

        return { syncedData: localData, source: 'local' };
      } else {
        // Cloud has higher (or equal) XP, use the cloud data (overwriting local)
        console.log('Cloud has higher or equal XP. Overwriting local data...');
        saveProgression(cloudProg); // Saves cloud progression to local storage
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
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('battle_card_game_data')
      .upsert({
        user_id: userId,
        level: currentData.level,
        xp: currentData.xp,
        gold: currentData.gold,
        progression_data: currentData,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error pushing progression update to cloud:', error);
    }
  } catch (err) {
    console.error('Failed to push progression update:', err);
  }
}
