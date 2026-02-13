
export type SoundName = 
    | 'attack_phase'
    | 'conscript_mag'
    | 'conscript_phy'
    | 'damage_sm'
    | 'damage_md'
    | 'damage_lg'
    | 'destroy'
    | 'draw'
    | 'game_over'
    | 'king'
    | 'menu_click'
    | 'play_resource'
    | 'queen'
    | 'swap_resource'
    | 'tactic'
    | 'turn_start';

class NativeAudioManager {
    private static instance: NativeAudioManager;
    private sounds: Map<SoundName, HTMLAudioElement> = new Map();
    private isInitialized = false;
    private sfxVolume = 0.5;
    private musicVolume = 0.5;

    private constructor() {
        this.init();
    }

    public static getInstance(): NativeAudioManager {
        if (!NativeAudioManager.instance) {
            NativeAudioManager.instance = new NativeAudioManager();
        }
        return NativeAudioManager.instance;
    }

    private async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        // Fetch all sounds in parallel
        await Promise.all(soundFiles.map(async (name) => {
            try {
                let audioPath: string;
                try {
                    // Robust base URL detection: use document.baseURI if available (handles <base> tags), 
                    // otherwise fall back to window.location.href.
                    const baseUrl = document.baseURI || window.location.href;
                    
                    // Construct absolute URL relative to the base. 
                    // This handles scenarios like Itch.io where the game is in a subdirectory.
                    audioPath = new URL(`sounds/${name}.mp3`, baseUrl).href;
                } catch (e) {
                    // Fallback: If URL construction fails (e.g. strictly opaque origin), use simple relative path.
                    // This relies on the browser's fetch capability to resolve it.
                    console.warn(`NativeAudioManager: URL construction failed for ${name}, using relative path.`);
                    audioPath = `sounds/${name}.mp3`;
                }

                const response = await fetch(audioPath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} for ${audioPath}`);
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                
                const audio = new Audio(url);
                // Preload settings
                audio.preload = 'auto';
                
                this.sounds.set(name, audio);
            } catch (error) {
                console.error(`NativeAudioManager: Failed to load sound '${name}'`, error);
            }
        }));
    }

    public prime() {
        console.log("NativeAudioManager: Priming audio engine...");
        this.sounds.forEach((audio, name) => {
            // Check readyState to ensure audio is loaded before attempting interaction
            // readyState > 0 means HAVE_METADATA or higher
            if (audio.readyState > 0) {
                // Attempt to play and immediately pause to unlock the audio element for this user session
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        audio.pause();
                        audio.currentTime = 0;
                    }).catch(error => {
                        // This is expected if the user hasn't interacted yet, but this function 
                        // should be called FROM a click handler, so it should work.
                        console.warn(`NativeAudioManager: Priming failed for ${name}.`, error);
                    });
                }
            } else {
                console.warn(`NativeAudioManager: Skipped priming '${name}' - audio not ready.`);
            }
        });
    }

    public play(name: SoundName) {
        const audio = this.sounds.get(name);
        if (audio) {
            audio.volume = this.sfxVolume;
            // Reset position to allow replaying
            if (!audio.paused) {
                audio.currentTime = 0;
            } else {
                audio.currentTime = 0;
                audio.play().catch(e => {
                    console.warn(`NativeAudioManager: Play interrupted for ${name}`, e);
                });
            }
        } else {
            // Sound might still be loading or failed
            console.debug(`NativeAudioManager: Sound '${name}' not ready or missing.`);
        }
    }

    public setSfxVolume(v: number) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
    }

    public setMusicVolume(v: number) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        // Placeholder for future music implementation
    }
}

// Export singleton accessors
export const playSound = (name: SoundName) => {
    NativeAudioManager.getInstance().play(name);
};

export const primeAudio = () => {
    NativeAudioManager.getInstance().prime();
};

export const setGlobalSfxVolume = (v: number) => {
    NativeAudioManager.getInstance().setSfxVolume(v);
};

export const setGlobalMusicVolume = (v: number) => {
    NativeAudioManager.getInstance().setMusicVolume(v);
};
