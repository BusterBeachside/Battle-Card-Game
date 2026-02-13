
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

    private init() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        soundFiles.forEach(name => {
            // Use strict relative path. 
            // In Vite with base: './', 'sounds/name.mp3' resolves relative to index.html.
            // This works for AI Studio Preview, Itch.io, and Localhost.
            const src = `sounds/${name}.mp3`;
            
            const audio = new Audio(src);
            audio.preload = 'auto'; // Hint browser to download
            audio.volume = this.sfxVolume;

            // Log failures without crashing
            audio.addEventListener('error', (e) => {
                const err = audio.error;
                // Code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED (404 Not Found or Bad Format)
                if (err && process.env.NODE_ENV === 'development') {
                    console.warn(`NativeAudioManager: Failed to load '${name}' (Code: ${err.code}). Path: ${audio.src}`);
                }
            });

            this.sounds.set(name, audio);
        });
    }

    public prime() {
        // Trigger a load on all sounds.
        // We do not play() here to avoid "NotSupportedError" spam if the file is still 404ing or loading.
        // The click interaction on the Title Screen is sufficient to unlock AudioContext if we were using it,
        // but for HTML5 Audio, standard interaction is usually enough when we actually call play().
        console.log("NativeAudioManager: Priming audio...");
        this.sounds.forEach((audio) => {
            if (audio.readyState === 0) {
                audio.load();
            }
        });
    }

    public play(name: SoundName) {
        const audio = this.sounds.get(name);
        if (!audio) return;

        audio.volume = this.sfxVolume;
        
        // Resetting currentTime allows rapid replay of the same sound (e.g. drawing multiple cards)
        if (audio.readyState >= 1) { // HAVE_METADATA or greater
             audio.currentTime = 0;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Ignore interruption errors (happens when spamming sounds) or not-supported (loading)
                if (error.name !== 'AbortError' && error.name !== 'NotSupportedError') {
                    console.warn(`NativeAudioManager: Play error for ${name}:`, error);
                }
            });
        }
    }

    public setSfxVolume(v: number) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
        this.sounds.forEach(audio => audio.volume = this.sfxVolume);
    }

    public setMusicVolume(v: number) {
        this.musicVolume = Math.max(0, Math.min(1, v));
        // Placeholder for future music
    }
}

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
