
import { Howl } from 'howler';

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

const sounds: Record<SoundName, Howl> = {
    attack_phase: new Howl({ src: ['./sounds/attack_phase.wav'] }),
    conscript_mag: new Howl({ src: ['./sounds/conscript_mag.wav'] }),
    conscript_phy: new Howl({ src: ['./sounds/conscript_phy.wav'] }),
    damage_sm: new Howl({ src: ['./sounds/damage_sm.wav'] }),
    damage_md: new Howl({ src: ['./sounds/damage_md.wav'] }),
    damage_lg: new Howl({ src: ['./sounds/damage_lg.wav'] }),
    destroy: new Howl({ src: ['./sounds/destroy.wav'] }),
    draw: new Howl({ src: ['./sounds/draw.wav'] }),
    game_over: new Howl({ src: ['./sounds/game_over.wav'] }),
    king: new Howl({ src: ['./sounds/king.wav'] }),
    menu_click: new Howl({ src: ['./sounds/menu_click.wav'] }),
    play_resource: new Howl({ src: ['./sounds/play_resource.wav'] }),
    queen: new Howl({ src: ['./sounds/queen.wav'] }),
    swap_resource: new Howl({ src: ['./sounds/swap_resource.wav'] }),
    tactic: new Howl({ src: ['./sounds/tactic.wav'] }),
    turn_start: new Howl({ src: ['./sounds/turn_start.wav'] }),
};

export const playSound = (name: SoundName) => {
    try {
        sounds[name].play();
    } catch (e) {
        console.warn("Sound play failed", e);
    }
};
