
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

const soundConfig = {
    html5: true,
    onloaderror: (id: any, error: any) => {
        console.error(`Howler Load Error [${id}]:`, error);
    },
    onplayerror: (id: any, error: any) => {
        console.warn(`Howler Play Error [${id}]:`, error);
    }
};

const sounds: Record<SoundName, any> = {
    attack_phase: new Howl({ src: ['sounds/attack_phase.mp3'], ...soundConfig }),
    conscript_mag: new Howl({ src: ['sounds/conscript_mag.mp3'], ...soundConfig }),
    conscript_phy: new Howl({ src: ['sounds/conscript_phy.mp3'], ...soundConfig }),
    damage_sm: new Howl({ src: ['sounds/damage_sm.mp3'], ...soundConfig }),
    damage_md: new Howl({ src: ['sounds/damage_md.mp3'], ...soundConfig }),
    damage_lg: new Howl({ src: ['sounds/damage_lg.mp3'], ...soundConfig }),
    destroy: new Howl({ src: ['sounds/destroy.mp3'], ...soundConfig }),
    draw: new Howl({ src: ['sounds/draw.mp3'], ...soundConfig }),
    game_over: new Howl({ src: ['sounds/game_over.mp3'], ...soundConfig }),
    king: new Howl({ src: ['sounds/king.mp3'], ...soundConfig }),
    menu_click: new Howl({ src: ['sounds/menu_click.mp3'], ...soundConfig }),
    play_resource: new Howl({ src: ['sounds/play_resource.mp3'], ...soundConfig }),
    queen: new Howl({ src: ['sounds/queen.mp3'], ...soundConfig }),
    swap_resource: new Howl({ src: ['sounds/swap_resource.mp3'], ...soundConfig }),
    tactic: new Howl({ src: ['sounds/tactic.mp3'], ...soundConfig }),
    turn_start: new Howl({ src: ['sounds/turn_start.mp3'], ...soundConfig }),
};

export const playSound = (name: SoundName) => {
    try {
        sounds[name].play();
    } catch (e) {
        console.warn("Sound play failed", e);
    }
};
