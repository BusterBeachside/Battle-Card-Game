
declare var Howl: any;
declare var Howler: any;

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
        // Critical: Unload any previous Howler instances to prevent "Pool Exhausted" errors 
        // caused by hot-reloading (ghost instances using up HTML5 audio tags).
        if (typeof Howler !== 'undefined') {
            Howler.unload();
        }

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
            const path = `sounds/${name}.mp3`;
            this.sounds[name] = new Howl({
                src: [path],
                format: ['mp3'],
                html5: false, // Forces Web Audio API. PREVENTS "Pool Exhausted" error.
                preload: true,
                onloaderror: (id: any, error: any) => {
                    console.error(`AUDIO LOAD ERROR: Failed to load '${path}'. Error Code: ${error}. \nCheck: Does 'public/${path}' exist? Is it a valid MP3? Is the server returning a 404 HTML page as 200 OK?`);
                },
                onplayerror: (id: any, error: any) => {
                    console.warn(`AUDIO PLAY ERROR: Failed to play '${path}'.`, error);
                    // Attempt to unlock AudioContext if it is the culprit
                    if (typeof Howler !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
                         Howler.ctx.resume();
                    }
                }
            });
        });
    }

    public play(name: SoundName) {
        try {
            const sound = this.sounds[name];
            if (sound) {
                sound.play();
            }
        } catch (e) {
            console.warn(`AudioManager: Error attempting to play ${name}`, e);
        }
    }
}

// Export wrapper function
export const playSound = (name: SoundName) => {
    AudioManager.getInstance().play(name);
};
