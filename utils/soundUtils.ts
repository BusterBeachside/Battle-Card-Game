
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

    private async init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        
        // Initialize context (created in suspended state usually)
        const ctx = this.getContext();

        const soundFiles: SoundName[] = [
            'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
            'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
            'king', 'menu_click', 'play_resource', 'queen',
            'swap_resource', 'tactic', 'turn_start'
        ];

        // Fetch all sounds
        await Promise.all(soundFiles.map(async (name) => {
            try {
                // Use explicit relative path for Itch.io compatibility
                const response = await fetch(`./sounds/${name}.mp3`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                // Decode the audio data using Web Audio API
                // This is more robust than HTMLAudioElement for games
                const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
                this.buffers.set(name, audioBuffer);
            } catch (error) {
                console.warn(`NativeAudioManager: Failed to load sound '${name}'`, error);
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
        // Placeholder for music implementation
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
