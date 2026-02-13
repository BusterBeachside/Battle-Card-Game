
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
    private blobUrls: Map<SoundName, string> = new Map();
    private isInitialized = false;
    private sfxVolume = 0.5;
    private musicVolume = 0.5;

    private constructor() {}

    public static getInstance(): NativeAudioManager {
        if (!NativeAudioManager.instance) {
            NativeAudioManager.instance = new NativeAudioManager();
        }
        return NativeAudioManager.instance;
    }

    private getSoundUrl(name: string): string {
        return `sounds/${name}.mp3`;
    }

    public async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        await Promise.all(soundFiles.map(name => this.loadSound(name)));
    }

    private async loadSound(name: SoundName) {
        const url = this.getSoundUrl(name);

        try {
            // Fetch the file as a Blob.
            // This is more robust than 'new Audio(url)' for hosted games (Itch.io)
            // because it downloads the full file first, avoiding Range request issues,
            // and bypasses WebAudio 'decodeAudioData' strictness which causes EncodingErrors.
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${url}`);
            }

            const blob = await response.blob();
            
            // Safety Check: Ensure we didn't get an HTML error page (Soft 404)
            if (blob.type.includes('text/html')) {
                throw new Error(`Server returned HTML instead of Audio for ${url}`);
            }

            const blobUrl = URL.createObjectURL(blob);
            this.blobUrls.set(name, blobUrl);

        } catch (error) {
            console.warn(`[Audio] Failed to load '${name}':`, error);
        }
    }

    public prime() {
        this.init();
    }

    public play(name: SoundName) {
        const url = this.blobUrls.get(name);
        if (url) {
            const audio = new Audio(url);
            audio.volume = this.sfxVolume;
            // Play and catch any interaction/autoplay errors silently
            audio.play().catch(e => {
                // console.warn('Audio play prevented', e);
            });
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
