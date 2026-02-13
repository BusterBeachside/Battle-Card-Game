
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
    private audioContext: AudioContext | null = null;
    private sfxGainNode: GainNode | null = null;
    private buffers: Map<SoundName, AudioBuffer> = new Map();
    private isInitialized = false;
    private sfxVolume = 0.5;
    private musicVolume = 0.5;

    private constructor() {
        // Lazy init
    }

    public static getInstance(): NativeAudioManager {
        if (!NativeAudioManager.instance) {
            NativeAudioManager.instance = new NativeAudioManager();
        }
        return NativeAudioManager.instance;
    }

    private getContext(): AudioContext {
        if (!this.audioContext) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass();
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.gain.value = this.sfxVolume;
            this.sfxGainNode.connect(this.audioContext.destination);
        }
        return this.audioContext;
    }

    private getSoundUrl(name: string): string {
        // Simple relative path is the most robust for Vite + Public folder.
        // This resolves relative to index.html location.
        // We remove the leading ./ to be cleaner, though ./sounds works too.
        return `sounds/${name}.mp3`;
    }

    public async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        const ctx = this.getContext();

        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        // Load all sounds
        await Promise.all(soundFiles.map(name => this.loadSound(name, ctx)));
    }

    private async loadSound(name: SoundName, ctx: AudioContext) {
        const url = this.getSoundUrl(name);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                // Determine if it's a 404 or other network error
                throw new Error(`HTTP ${response.status} fetching ${url}`);
            }

            // SAFETY CHECK: Verify we didn't get an HTML 404 page (Soft 404)
            // Itch.io often serves a generic HTML 404 page with status 200 or 404
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error(`Server returned HTML (Soft 404) instead of Audio for ${url}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            
            // Decode the audio
            // This is where "EncodingError" usually happens if the data is corrupt or HTML
            try {
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                this.buffers.set(name, audioBuffer);
            } catch (decodeError) {
                console.error(`[Audio] Decode error for ${name}:`, decodeError);
            }

        } catch (error) {
            console.warn(`[Audio] Failed to load '${name}':`, error);
        }
    }

    public prime() {
        // Initialize context and resume if suspended (browser autoplay policy)
        const ctx = this.getContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.error("Audio Context resume failed", e));
        }
        // Start loading sounds if not already doing so
        this.init();
    }

    public play(name: SoundName) {
        if (!this.audioContext || !this.sfxGainNode) return;
        
        // Ensure context is running
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }

        const buffer = this.buffers.get(name);
        if (buffer) {
            try {
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.sfxGainNode);
                source.start(0);
            } catch (e) {
                console.warn(`Error playing sound ${name}`, e);
            }
        }
    }

    public setSfxVolume(v: number) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.sfxVolume;
        }
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
