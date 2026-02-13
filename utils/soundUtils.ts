
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
    private context: AudioContext | null = null;
    private buffers: Map<SoundName, AudioBuffer> = new Map();
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
        
        try {
            // Support for standard and webkit audio contexts
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContextClass();
            this.initialized = true;

            const soundFiles: SoundName[] = [
                'attack_phase', 'conscript_mag', 'conscript_phy', 'damage_sm',
                'damage_md', 'damage_lg', 'destroy', 'draw', 'game_over',
                'king', 'menu_click', 'play_resource', 'queen',
                'swap_resource', 'tactic', 'turn_start'
            ];

            console.log("[Audio] Initializing Web Audio API Manager...");

            soundFiles.forEach(name => {
                this.loadSound(name);
            });
        } catch (e) {
            console.warn("[Audio] Web Audio API is not supported in this browser.", e);
        }
    }

    private async loadSound(name: SoundName) {
        if (!this.context) return;
        
        const url = this.getSoundUrl(name);
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`[Audio] Failed to fetch sound: ${name} (${response.status})`);
                return;
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
        } catch (error) {
            console.warn(`[Audio] Error decoding sound: ${name}`, error);
        }
    }

    public prime() {
        this.init();
        if (this.context && this.context.state === 'suspended') {
            this.context.resume().catch(e => console.warn("[Audio] Failed to resume context:", e));
        }
    }

    public play(name: SoundName) {
        if (!this.initialized) this.init();
        if (!this.context) return;

        // Auto-resume context if suspended (common browser policy)
        if (this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }

        const buffer = this.buffers.get(name);
        if (buffer) {
            try {
                const source = this.context.createBufferSource();
                source.buffer = buffer;
                
                const gainNode = this.context.createGain();
                gainNode.gain.value = this.sfxVolume;
                
                source.connect(gainNode);
                gainNode.connect(this.context.destination);
                
                source.start(0);
            } catch (e) {
                console.warn(`[Audio] Playback failed for ${name}:`, e);
            }
        } else {
            // Sound hasn't loaded yet or failed to load
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
