
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
                // Absolute path relative to root
                const response = await fetch(`/sounds/${name}.mp3`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} for /sounds/${name}.mp3`);
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
        });
    }

    public play(name: SoundName) {
        const audio = this.sounds.get(name);
        if (audio) {
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
}

// Export singleton accessors
export const playSound = (name: SoundName) => {
    NativeAudioManager.getInstance().play(name);
};

export const primeAudio = () => {
    NativeAudioManager.getInstance().prime();
};
