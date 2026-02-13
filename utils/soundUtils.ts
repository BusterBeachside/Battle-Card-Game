
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
    private soundTemplates: Map<SoundName, HTMLAudioElement> = new Map();
    private isInitialized = false;
    private sfxVolume = 0.5;
    private musicVolume = 0.5; // Placeholder for future music

    private constructor() {
        this.init();
    }

    public static getInstance(): NativeAudioManager {
        if (!NativeAudioManager.instance) {
            NativeAudioManager.instance = new NativeAudioManager();
        }
        return NativeAudioManager.instance;
    }

    private getSoundUrl(name: string): string {
        // Use simple relative path. This resolves relative to the index.html location.
        // This is robust for Itch.io (where index.html is in a subfolder) and Preview.
        return `./sounds/${name}.mp3`;
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

        soundFiles.forEach((name) => {
            const url = this.getSoundUrl(name);
            const audio = new Audio();
            audio.src = url;
            audio.preload = 'auto'; // Hint to browser to download immediately
            
            // Error handling for debugging
            audio.onerror = (e) => {
                console.warn(`[Audio] Failed to load ${name} at ${url}`, e);
            };

            this.soundTemplates.set(name, audio);
        });
    }

    public prime() {
        // user interaction unlock
        this.soundTemplates.forEach(audio => {
            // We just access the object to ensure it's "alive"
            // Some browsers require a play() call within a user gesture to unlock audio
            // We can try playing and immediately pausing/resetting silent volume
            // But usually just initializing them is enough for sound effects later.
        });
    }

    public play(name: SoundName) {
        const template = this.soundTemplates.get(name);
        if (template) {
            // Clone the node to allow overlapping sounds (polyphony)
            // If the template hasn't loaded yet, the clone will try to load from the same src.
            const sound = template.cloneNode() as HTMLAudioElement;
            sound.volume = this.sfxVolume;
            
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // This catches "user didn't interact with document first" errors
                    // or 404s if the file is truly missing
                    // console.warn(`[Audio] Playback failed for ${name}:`, error);
                });
            }
        }
    }

    public setSfxVolume(v: number) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
    }

    public setMusicVolume(v: number) {
        this.musicVolume = Math.max(0, Math.min(1, v));
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
