
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
    private activeSounds: Set<HTMLAudioElement> = new Set();
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
        console.log(`[Audio] Initialized ${this.blobUrls.size} sounds.`);
    }

    private async loadSound(name: SoundName) {
        const url = this.getSoundUrl(name);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${url}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            
            // Force MIME type to audio/mpeg. 
            // Itch.io/Servers sometimes return incorrect content-types (e.g. text/plain or octet-stream)
            // which causes the browser to fail playing the Blob or treat it as a download stream.
            const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
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
            
            // Keep track of the audio element to prevent Garbage Collection 
            // from stopping the sound prematurely.
            this.activeSounds.add(audio);
            
            audio.onended = () => {
                this.activeSounds.delete(audio);
            };

            // Play and catch any interaction/autoplay errors
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.warn(`[Audio] Play blocked for ${name}:`, e);
                    this.activeSounds.delete(audio);
                });
            }
        } else {
            // console.warn(`[Audio] Sound not found: ${name}`);
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
