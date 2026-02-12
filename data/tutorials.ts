
import { TutorialStep, TutorialLessonConfig, Card, Phase, Rank, Suit, Color } from '../types';
import { createDeck, createTutorialCard } from '../utils/cards';
import { generateId } from '../utils/core';
import { CARD_VALUES } from '../constants';

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        instructionText: "Welcome to Battle! Let's start by choosing 3 cards from your hand to turn into Resources. High value cards make good resources.",
        highlightElementId: 'tut-10-♠',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-10-♠',
        allowedInteractionIds: ['tut-10-♠', 'tut-9-♠', 'tut-8-♠', 'tut-7-♦'] 
    },
];

export const LESSON_1_STEPS: TutorialStep[] = [
    {
        id: 'l1-intro',
        instructionText: "Welcome to Battle! This game uses a standard 52-card deck. The goal is to build an army by 'Conscripting' Soldiers and reducing your opponent's Life to zero!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l1-life',
        instructionText: "Each player begins the game with 20 Life. Don't let yours hit zero!",
        highlightElementId: 'bottom-life-total',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l1-resources',
        instructionText: "Use your Resources to Conscript Soldiers from your hand. You pay Resources by Tapping them (turning them sideways).",
        highlightElementId: 'resource-container-0', // ID depends on Player ID (0)
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l1-play-3',
        instructionText: "You have 4 Resources. That's enough to Conscript this 3 of Spades! A Soldier's value is its cost AND attack power. Drag it to the board!",
        highlightElementId: 'tut-3-♠',
        highlightMode: 'OUTLINE',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-3-♠',
        allowedInteractionIds: ['tut-3-♠']
    },
    {
        id: 'l1-spectrum-expl',
        instructionText: "You've Conscripted the 3! Notice it went into the black part of the board. This is because its a \"Physical\" Soldier! Black cards (Spades and Clubs) are Physical, while red cards (Diamonds and Hearts) are Magical. Physical and Magical Soldiers can't fight each other! This is called the Spectrum!",
        highlightElementId: 'lane-black-0', // Target the black lane container
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l1-play-ace',
        instructionText: "We should Conscript a Magical Soldier, too. Aces are also Soldiers, and they only cost 1 to Conscript. Play this Ace of Hearts!",
        highlightElementId: 'tut-A-♥',
        highlightMode: 'OUTLINE',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-A-♥',
        allowedInteractionIds: ['tut-A-♥']
    },
    {
        id: 'l1-conclusion',
        instructionText: "Great! Now you've got Soldiers in both \"lanes\", one of each Spectrum. We'll be ready for whatever the opponent throws at us!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    }
];

export const LESSON_2_STEPS: TutorialStep[] = [
    {
        id: 'l2-intro',
        instructionText: "Let's learn about combat! In Battle, you attack by selecting Soldiers on your field and sending them into battle by Tapping them.",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l2-enter-atk',
        instructionText: "Let's attack! To declare an attack, first select the Attack Phase button under the Actions menu.",
        highlightElementId: 'btn-attack-phase',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-attack-phase',
        allowedInteractionIds: ['btn-attack-phase']
    },
    {
        id: 'l2-declare-2c',
        instructionText: "Now that we're in the attack phase, click on Soldiers to declare them as attackers. This time, let's attack with just your 2 of Clubs.",
        highlightElementId: 'tut-2-♣',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-2-♣',
        allowedInteractionIds: ['tut-2-♣']
    },
    {
        id: 'l2-confirm-atk',
        instructionText: "Finally, to lock in your selection, click \"Confirm Attackers\".",
        highlightElementId: 'btn-confirm-attackers',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-confirm-attackers',
        allowedInteractionIds: ['btn-confirm-attackers']
    },
    {
        id: 'l2-block-watch',
        instructionText: "Once you've declared attackers, your opponent gets a chance to choose defenders. Physical and Magical Soldiers cannot defend against each other, so your opponent's 5 can't help in this fight. Your opponent is defending with his own 2! Let's watch the battle!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l2-trade-expl',
        instructionText: "The Soldiers had the same value, so they were both killed in battle. This is called a Trade.",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l2-play-6',
        instructionText: "You're able to continue playing cards after you attack. We have exactly 6 Resources, so let's Conscript this 6 to keep up the pressure!",
        highlightElementId: 'tut-6-♠',
        highlightMode: 'MASK',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-6-♠',
        allowedInteractionIds: ['tut-6-♠']
    },
    {
        id: 'l2-sick-expl',
        instructionText: "Notice the \"zZ\" icon. Soldiers you Conscript take a turn to arrive at the battlefield, so they can't attack on the same turn. However, they can still be used to defend against attacks.",
        highlightElementId: 'tut-6-♠',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l2-end-turn',
        instructionText: "We can't do anything else, so now let's end our turn. Click the End Turn button.",
        highlightElementId: 'btn-end-turn',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-end-turn-modal-confirm',
        allowedInteractionIds: ['btn-end-turn', 'btn-end-turn-modal-confirm']
    },
    {
        id: 'l2-defend-drag',
        instructionText: "Incoming attack!! You don't have much Life left, so we must defend. Drag your 4 onto the attacking 5 to declare it as that card's defender.",
        highlightElementId: 'tut-5-♥',
        highlightMode: 'OUTLINE',
        requiredAction: 'DECLARE_BLOCK',
        targetId: 'tut-4-♥',
        allowedInteractionIds: ['tut-4-♥', 'tut-5-♥']
    },
    {
        id: 'l2-defend-confirm',
        instructionText: "To lock in your defense, click \"Confirm Blocks\".",
        highlightElementId: 'btn-confirm-blocks',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-confirm-blocks',
        allowedInteractionIds: ['btn-confirm-blocks']
    },
    {
        id: 'l2-result-expl',
        instructionText: "In combat, the Soldier with the higher value Kills the other Soldier, sending it to the Graveyard. You may have lost a Soldier, but you protected your Life total so you could live to fight another day!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l2-atk-2',
        instructionText: "It's our turn again. Let's attack!",
        highlightElementId: 'btn-attack-phase',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-attack-phase',
        allowedInteractionIds: ['btn-attack-phase']
    },
    {
        id: 'l2-atk-6',
        instructionText: "Your opponent has no Physical Soliders to defend with; He's a sitting duck! Let's attack with our 6.",
        highlightElementId: 'tut-6-♠',
        highlightMode: 'OUTLINE',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-6-♠',
        allowedInteractionIds: ['tut-6-♠']
    },
    {
        id: 'l2-win',
        instructionText: "Your opponent has no Physical Soliders to defend with; He's a sitting duck! Let's attack with our 6.", // Reuse text for the confirm step
        highlightElementId: 'btn-confirm-attackers',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-confirm-attackers',
        allowedInteractionIds: ['btn-confirm-attackers']
    },
    {
        id: 'l2-finish',
        instructionText: "You did it! When Soldiers are left undefended, they attack directly, dealing their value in damage to your opponent's Life total. That last attack brought your opponent's Life to 0, meaning you win the game!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    }
];

const getRandomCards = (count: number): Card[] => {
    return createDeck().slice(0, count);
};

export const TUTORIAL_LESSONS: TutorialLessonConfig[] = [
    { 
        id: 'lesson-1', 
        title: 'Lesson 1: The Basics', 
        subtitle: 'Conscripting & The Spectrum', 
        steps: LESSON_1_STEPS,
        setup: {
            p1Hand: [
                createTutorialCard(Rank.Three, Suit.Spades),
                createTutorialCard(Rank.Ten, Suit.Diamonds),
                createTutorialCard(Rank.Ace, Suit.Hearts)
            ],
            p1Resources: [
                createTutorialCard(Rank.Ten, Suit.Spades),
                createTutorialCard(Rank.Nine, Suit.Clubs),
                createTutorialCard(Rank.Eight, Suit.Diamonds),
                createTutorialCard(Rank.Seven, Suit.Spades)
            ],
            p2Hand: [],
            phase: Phase.MAIN
        }
    },
    { 
        id: 'lesson-2', 
        title: 'Lesson 2: Combat', 
        subtitle: 'Attacking & Blocking', 
        steps: LESSON_2_STEPS,
        setup: {
            p1Hand: [createTutorialCard(Rank.Six, Suit.Spades)],
            p1Resources: getRandomCards(6),
            p1Field: [createTutorialCard(Rank.Four, Suit.Hearts), createTutorialCard(Rank.Two, Suit.Clubs)],
            p1Life: 5,
            p2Hand: [],
            p2Field: [createTutorialCard(Rank.Five, Suit.Hearts), createTutorialCard(Rank.Two, Suit.Spades)],
            p2Life: 6,
            phase: Phase.MAIN
        }
    }, 
    { id: 'lesson-3', title: 'Lesson 3: Tactics', subtitle: 'Face Cards & Abilities', steps: [] }
];
