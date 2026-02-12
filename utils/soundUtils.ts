
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
    html5: true
};

const sounds: Record<SoundName, any> = {
    attack_phase: new Howl({ src: ['sounds/attack_phase.wav'], ...soundConfig }),
    conscript_mag: new Howl({ src: ['sounds/conscript_mag.wav'], ...soundConfig }),
    conscript_phy: new Howl({ src: ['sounds/conscript_phy.wav'], ...soundConfig }),
    damage_sm: new Howl({ src: ['sounds/damage_sm.wav'], ...soundConfig }),
    damage_md: new Howl({ src: ['sounds/damage_md.wav'], ...soundConfig }),
    damage_lg: new Howl({ src: ['sounds/damage_lg.wav'], ...soundConfig }),
    destroy: new Howl({ src: ['sounds/destroy.wav'], ...soundConfig }),
    draw: new Howl({ src: ['sounds/draw.wav'], ...soundConfig }),
    game_over: new Howl({ src: ['sounds/game_over.wav'], ...soundConfig }),
    king: new Howl({ src: ['sounds/king.wav'], ...soundConfig }),
    menu_click: new Howl({ src: ['sounds/menu_click.wav'], ...soundConfig }),
    play_resource: new Howl({ src: ['sounds/play_resource.wav'], ...soundConfig }),
    queen: new Howl({ src: ['sounds/queen.wav'], ...soundConfig }),
    swap_resource: new Howl({ src: ['sounds/swap_resource.wav'], ...soundConfig }),
    tactic: new Howl({ src: ['sounds/tactic.wav'], ...soundConfig }),
    turn_start: new Howl({ src: ['sounds/turn_start.wav'], ...soundConfig }),
};

export const playSound = (name: SoundName) => {
    try {
        sounds[name].play();
    } catch (e) {
        console.warn("Sound play failed", e);
    }
};
