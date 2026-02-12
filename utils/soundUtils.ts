
declare var Howl: any;

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
    private sounds: Record<SoundName, any>;

    private constructor() {
        this.sounds = {} as Record<SoundName, any>;
        this.init();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private init() {
        const soundFiles: SoundName[] = [
            'attack_phase',
            'conscript_mag',
            'conscript_phy',
            'damage_sm',
            'damage_md',
            'damage_lg',
            'destroy',
            'draw',
            'game_over',
            'king',
            'menu_click',
            'play_resource',
            'queen',
            'swap_resource',
            'tactic',
            'turn_start'
        ];

        soundFiles.forEach(name => {
            this.sounds[name] = new Howl({
                src: [`sounds/${name}.mp3`],
                html5: false, // FALSE forces Web Audio API, preventing "Pool Exhausted" errors
                preload: true,
                onloaderror: function(id: any, error: any) {
                    // @ts-ignore
                    console.error(`Howler Load Error - Path: ${this._src}`, error);
                },
                onplayerror: function(id: any, error: any) {
                    // @ts-ignore
                    console.warn(`Howler Play Error - Path: ${this._src}`, error);
                }
            });
        });
    }

    public play(name: SoundName) {
        try {
            const sound = this.sounds[name];
            if (sound) {
                // Resetting seek ensures the sound restarts if played rapidly
                if (sound.playing()) {
                    sound.seek(0);
                }
                sound.play();
            }
        } catch (e) {
            console.warn(`Failed to play sound: ${name}`, e);
        }
    }
}

// Initialize the singleton instance immediately
const audioManager = AudioManager.getInstance();

export const playSound = (name: SoundName) => {
    audioManager.play(name);
};
