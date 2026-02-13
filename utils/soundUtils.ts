
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
        this.init();
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
        // Robustly construct path. If we are at .../index.html, we need to go to .../sounds/
        // new URL('sounds/foo.mp3', document.baseURI) handles this correctly by stripping the filename from the base.
        try {
            return new URL(`sounds/${name}.mp3`, document.baseURI || window.location.href).href;
        } catch (e) {
            // Fallback for environments where URL construction might fail (unlikely in modern browsers)
            return `./sounds/${name}.mp3`;
        }
    }

    private async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        const ctx = this.getContext();

        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        // Fetch all sounds in parallel, but handle errors individually
        await Promise.all(soundFiles.map(async (name) => {
            const url = this.getSoundUrl(name);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                // CRITICAL CHECK: Verify we didn't get a Soft 404 (HTML page)
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    throw new Error(`Server returned HTML instead of Audio. Path is likely wrong: ${url}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                
                // Decode
                try {
                    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                    this.buffers.set(name, audioBuffer);
                } catch (decodeErr) {
                    console.error(`Failed to decode ${name} from ${url}. The file might be corrupted or not an MP3.`);
                }

            } catch (error) {
                console.warn(`NativeAudioManager: Failed to load sound '${name}' from '${url}'`, error);
            }
        }));
    }

    public prime() {
        const ctx = this.getContext();
        // Resume if suspended (browser autoplay policy requirement)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.error("Audio Context resume failed", e));
        }
    }

    public play(name: SoundName) {
        if (!this.audioContext || !this.sfxGainNode) return;
        
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
