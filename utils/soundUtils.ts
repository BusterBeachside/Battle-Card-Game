
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

class AudioManager {
    private static instance: AudioManager;
    private sounds: Map<SoundName, HTMLAudioElement> = new Map();
    private sfxVolume = 0.5;
    private musicVolume = 0.5;
    private initialized = false;

    private constructor() {}

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private getSoundUrl(name: string): string {
        return `sounds/${name}.mp3`;
    }

    public init() {
        if (this.initialized) return;
        this.initialized = true;

        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        // Detection for Itch.io environment to enable CORS only where needed/supported.
        // Itch CDN (hwcdn.net) often requires CORS or behaves better with it, 
        // while local previews fail with it.
        const isItchEnvironment = window.location.hostname.includes('itch.io') || window.location.hostname.includes('hwcdn.net');
        console.log(`[Audio] Initializing. Environment: ${isItchEnvironment ? 'Itch/Prod' : 'Dev/Preview'}`);

        soundFiles.forEach(name => {
            const url = this.getSoundUrl(name);
            const audio = new Audio(url);
            
            if (isItchEnvironment) {
                audio.crossOrigin = "anonymous";
            }
            
            audio.preload = 'auto';
            
            // Optional: attach error handlers to debug specific files
            audio.onerror = (e) => {
                if (typeof e === 'string') {
                    console.warn(`[Audio] Error loading ${name}:`, e);
                } else {
                    const target = e.target as HTMLAudioElement;
                    console.warn(`[Audio] Error loading ${name}:`, target.error);
                }
            };

            this.sounds.set(name, audio);
        });
    }

    public prime() {
        this.init();
    }

    public play(name: SoundName) {
        if (!this.initialized) this.init();

        const original = this.sounds.get(name);
        if (original) {
            // We clone the node to allow overlapping sounds
            // cloneNode(true) copies attributes like src and crossOrigin
            const sound = original.cloneNode(true) as HTMLAudioElement;
            sound.volume = this.sfxVolume;
            
            // Explicitly set crossOrigin on clone if original had it, just to be safe
            if (original.crossOrigin) {
                sound.crossOrigin = original.crossOrigin;
            }

            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // Ignore "NotAllowedError" (user hasn't interacted yet)
                    // and "AbortError" (sound stopped before finishing)
                    if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
                        console.warn(`[Audio] Playback failed for ${name}:`, error);
                    }
                });
            }
        } else {
            console.warn(`[Audio] Sound not found: ${name}`);
        }
    }

    public setSfxVolume(v: number) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
    }

    public setMusicVolume(v: number) {
        this.musicVolume = Math.max(0, Math.min(1, v));
    }
}

// Export singleton wrappers
export const playSound = (name: SoundName) => {
    AudioManager.getInstance().play(name);
};

export const primeAudio = () => {
    AudioManager.getInstance().prime();
};

export const setGlobalSfxVolume = (v: number) => {
    AudioManager.getInstance().setSfxVolume(v);
};

export const setGlobalMusicVolume = (v: number) => {
    AudioManager.getInstance().setMusicVolume(v);
};
