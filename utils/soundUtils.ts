
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
    private soundDataUris: Map<SoundName, string> = new Map();
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

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        // Chunking to avoid stack overflow on large files
        const chunk = 8192; 
        for (let i = 0; i < len; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + chunk, len))));
        }
        return window.btoa(binary);
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

        console.log("[Audio] Starting Base64 load...");
        await Promise.all(soundFiles.map(name => this.loadSound(name)));
        console.log(`[Audio] Loaded ${this.soundDataUris.size} sounds.`);
    }

    private async loadSound(name: SoundName) {
        const url = this.getSoundUrl(name);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${url}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            
            // Check magic bytes for HTML (Soft 404 detection)
            // '<' is 60, '!' is 33, 'd' is 100
            const header = new Uint8Array(arrayBuffer.slice(0, 4));
            if (header[0] === 60 || (header[0] === 239 && header[1] === 187 && header[2] === 191 && header[3] === 60)) {
                 // 60 = '<', or UTF-8 BOM + '<'
                 throw new Error(`Detected HTML content in ${url}`);
            }

            const base64 = this.arrayBufferToBase64(arrayBuffer);
            const dataUri = `data:audio/mp3;base64,${base64}`;
            
            this.soundDataUris.set(name, dataUri);

        } catch (error) {
            console.warn(`[Audio] Failed to load '${name}':`, error);
        }
    }

    public prime() {
        this.init();
    }

    public play(name: SoundName) {
        const uri = this.soundDataUris.get(name);
        if (uri) {
            const audio = new Audio(uri);
            audio.volume = this.sfxVolume;
            
            this.activeSounds.add(audio);
            
            audio.onended = () => {
                this.activeSounds.delete(audio);
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    // console.warn(`[Audio] Play blocked for ${name}:`, e);
                    this.activeSounds.delete(audio);
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
