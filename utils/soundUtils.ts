
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
    private lastPlayed: Map<SoundName, number> = new Map();
    private readonly COOLDOWNS: Record<SoundName, number> = {
        menu_click: 75,
        attack_phase: 100,
        conscript_mag: 100,
        conscript_phy: 100,
        damage_sm: 80,
        damage_md: 80,
        damage_lg: 80,
        destroy: 80,
        draw: 40,
        game_over: 200,
        king: 100,
        play_resource: 80,
        queen: 100,
        swap_resource: 80,
        tactic: 100,
        turn_start: 100
    };

    private constructor() {}

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private getSoundUrl(name: string): string {
        return `./sounds/${name}.mp3`;
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
            
            try {
                const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
                this.buffers.set(name, audioBuffer);
            } catch (decodeErr: any) {
                 console.warn(`[Audio] Decode error for ${name}:`, decodeErr.message);
            }
        } catch (error) {
            console.warn(`[Audio] Network error loading sound: ${name}`, error);
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

        // Apply sound specific cooldown limits to prevent overlaying wall-of-sound stacking/clipping
        const now = Date.now();
        const lastPlay = this.lastPlayed.get(name) || 0;
        const cooldown = this.COOLDOWNS[name] || 0;
        if (now - lastPlay < cooldown) {
            return;
        }
        this.lastPlayed.set(name, now);

        // Auto-resume context if suspended
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
