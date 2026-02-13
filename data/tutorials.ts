
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

export const LESSON_3_STEPS: TutorialStep[] = [
    {
        id: 'l3-intro',
        instructionText: "Resources are your army's lifeblood. Every card you play has a Resource cost. Let's learn how to gain Resources!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l3-sel-1',
        instructionText: "At the beginning of the game, each player draws 8 cards. You must then choose 3 of those cards as your starting Resources. Select the 4, the 9, and the 10.",
        highlightElementId: 'tut-4-♥',
        highlightMode: 'OUTLINE',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-4-♥',
        allowedInteractionIds: ['tut-4-♥', 'tut-9-♠', 'tut-10-♠']
    },
    {
        id: 'l3-sel-2',
        instructionText: "Good. Now select the 9 of Spades.",
        highlightElementId: 'tut-9-♠',
        highlightMode: 'OUTLINE',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-9-♠',
        allowedInteractionIds: ['tut-9-♠', 'tut-10-♠']
    },
    {
        id: 'l3-sel-3',
        instructionText: "And the 10 of Spades.",
        highlightElementId: 'tut-10-♠',
        highlightMode: 'OUTLINE',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-10-♠',
        allowedInteractionIds: ['tut-10-♠']
    },
    {
        id: 'l3-confirm-res',
        instructionText: "Click Confirm to send these cards to your Resources.",
        highlightElementId: 'btn-confirm-init',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-confirm-init',
        allowedInteractionIds: ['btn-confirm-init']
    },
    {
        id: 'l3-p2-turn-1-expl',
        instructionText: "At the start of every turn, the turn player draws a card. After that comes the Resource Step, but on the first turn of the game, that step gets skipped. Since Player 2 went first this time, they get to draw a card, but don't get to add a Resource.",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l3-p1-resource',
        instructionText: "It's your turn! You automatically drew a card (6 of Spades). Now it's your Resource Step! You can either Add & Draw or Swap. Early game, gaining resources is better. Click 'Add & Draw'!",
        highlightElementId: 'btn-add-resource',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-add-resource',
        allowedInteractionIds: ['btn-add-resource']
    },
    {
        id: 'l3-p1-add-select',
        instructionText: "It's useful to Resource high-value cards at the beginning. Click the 6 in your hand to add it to your Resources.",
        highlightElementId: 'tut-6-♠',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-6-♠',
        allowedInteractionIds: ['tut-6-♠']
    },
    {
        id: 'l3-p1-conscript',
        instructionText: "Now you have enough Resources to Conscript the 4 in your hand! Drag it onto the field.",
        highlightElementId: 'tut-4-♠',
        highlightMode: 'OUTLINE',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-4-♠',
        allowedInteractionIds: ['tut-4-♠']
    },
    {
        id: 'l3-p1-end',
        instructionText: "Great Resource management. Time to pass turn.",
        highlightElementId: 'btn-end-turn',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-end-turn-modal-confirm',
        allowedInteractionIds: ['btn-end-turn', 'btn-end-turn-modal-confirm']
    },
    {
        id: 'l3-p2-watch',
        instructionText: "Player 2 is taking their turn...",
        highlightMode: 'NONE',
        requiredAction: 'NONE'
    },
    {
        id: 'l3-p2-result',
        instructionText: "Your opponent drew a card and chose to Resource and Draw. Now they have their own 4, but it's Magical!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l3-swap-intro',
        instructionText: "Your opponent has a Magical Soldier on the field, but you don't have any Magical Soldiers of your own to summon. But wait, you have a Magical 4 in your Resources! This is where Resource Swap comes in handy. Click the \"Swap Resource\" button.",
        highlightElementId: 'btn-swap-resource',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-swap-resource',
        allowedInteractionIds: ['btn-swap-resource']
    },
    {
        id: 'l3-swap-hand',
        instructionText: "First, select the card in your hand to swap (7 of Spades).",
        highlightElementId: 'tut-7-♠',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-7-♠',
        allowedInteractionIds: ['tut-7-♠']
    },
    {
        id: 'l3-swap-res',
        instructionText: "Then, select the card you want from your Resources, and the swap will happen!",
        highlightElementId: 'tut-4-♥',
        highlightMode: 'OUTLINE',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-4-♥',
        allowedInteractionIds: ['tut-4-♥']
    },
    {
        id: 'l3-play-mag-4',
        instructionText: "Great, now we have a magical Soldier to defend with! Notice that Resource Swapping comes at a cost: You skip gaining your Resource for the turn! Let's Conscript that defender.",
        highlightElementId: 'tut-4-♥',
        highlightMode: 'OUTLINE',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-4-♥',
        allowedInteractionIds: ['tut-4-♥']
    },
    {
        id: 'l3-finish',
        instructionText: "Your opponent will think twice about attacking now! An important note about the Resource Step: Resources max out at 10. Once you've reached that, all of your future Resource Steps get skipped! Make sure to Swap out cards you want to keep before you reach 10!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    }
];

export const LESSON_4_STEPS: TutorialStep[] = [
    {
        id: 'l4-intro',
        instructionText: "In Battle, Face Cards are called Tactics and have special effects. Aces also have a special \"Wildcard\" effect. Let's learn about them!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l4-p2-attack',
        instructionText: "First, let's cover Aces. They count as a 1, meaning they only cost 1 to Conscript and only deal 1 damage when they attack. But in battle, they're a Wildcard! This means they can kill ANY enemy Soldier! Let's defend against your opponent's attack with our Ace.",
        highlightElementId: 'tut-A-♠',
        highlightMode: 'OUTLINE',
        requiredAction: 'DECLARE_BLOCK',
        targetId: 'tut-A-♠',
        allowedInteractionIds: ['tut-A-♠', 'tut-10-♠']
    },
    {
        id: 'l4-confirm-block',
        instructionText: "Confirm your block to proceed to combat.",
        highlightElementId: 'btn-confirm-blocks',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-confirm-blocks',
        allowedInteractionIds: ['btn-confirm-blocks']
    },
    {
        id: 'l4-ace-expl',
        instructionText: "Great! Our Wildcard destroyed your opponent's powerful 10! Of course, the Ace only counts as a 1, so the 10 also defeated it. Thinking about when to attack and defend is key. Aces require a lot of strategy to use effectively!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    },
    {
        id: 'l4-p1-turn',
        instructionText: "You drew a Jack. In Battle, this is called a Tactic card! The Jack is simple: It costs 2 Resources and allows you to draw 2 cards. Let's play it.",
        highlightElementId: 'tut-J-♠',
        highlightMode: 'MASK',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-J-♠',
        allowedInteractionIds: ['tut-J-♠']
    },
    {
        id: 'l4-play-queen',
        instructionText: "The next Tactic is the Queen. She is the only card in the game that allows interaction between the Spectrums. It costs 3 Resources, and can be attached to any Soldier on the field to change that Soldier into whatever Spectrum the Queen is! With that in mind, let's attach our Queen of Clubs to the opponent's 9 of Diamonds. This will permanently move it to the Physical Spectrum!",
        highlightElementId: 'tut-Q-♣',
        highlightMode: 'OUTLINE',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-Q-♣',
        allowedInteractionIds: ['tut-Q-♣', 'tut-9-♦']
    },
    {
        id: 'l4-play-king',
        instructionText: "Finally, we have the powerful King. He costs 4 Resources and allows you to instantly kill any Soldier, as long as its the same Spectrum as the King! Since this King is Magical, let's use it to destroy our opponent's last remaining 10 of Hearts!",
        highlightElementId: 'tut-K-♦',
        highlightMode: 'OUTLINE',
        requiredAction: 'PLAY_CARD',
        targetId: 'tut-K-♦',
        allowedInteractionIds: ['tut-K-♦', 'tut-10-♥']
    },
    {
        id: 'l4-attack-phase',
        instructionText: "Using your powerful Tactics, you've completely removed all of the threats in your opponent's Magical lane. Now we can attack freely with our 8 for game!!",
        highlightElementId: 'btn-attack-phase',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-attack-phase',
        allowedInteractionIds: ['btn-attack-phase']
    },
    {
        id: 'l4-attack-8',
        instructionText: "Select the 8 of Hearts to attack.",
        highlightElementId: 'tut-8-♥',
        highlightMode: 'OUTLINE',
        requiredAction: 'CLICK_CARD',
        targetId: 'tut-8-♥',
        allowedInteractionIds: ['tut-8-♥']
    },
    {
        id: 'l4-confirm-attack',
        instructionText: "Confirm your attack to win the game!",
        highlightElementId: 'btn-confirm-attackers',
        highlightMode: 'MASK',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-confirm-attackers',
        allowedInteractionIds: ['btn-confirm-attackers']
    },
    {
        id: 'l4-win',
        instructionText: "Great work! If you ever have trouble remembering the cost or effect of Aces and Tactics, hovering over them in your hand will reveal their cost, and each card has reminder text written on them. Remember, \"Aces Wild\", \"Jacks Draw 2\", \"Queens Shift Spectrum\", and \"Kings Execute\"! And with that, you've completed the basic tutorial. Get out there and Battle!",
        highlightMode: 'NONE',
        requiredAction: 'CLICK_UI_BUTTON',
        targetId: 'btn-tutorial-next',
        allowedInteractionIds: ['btn-tutorial-next']
    }
];

const getRandomCards = (count: number): Card[] => {
    return createDeck().slice(0, count);
};

// Safe deck for Lesson 4 (No J/Q/K/A) to prevent collision with rigged deck
const getSafeRandomCards = (count: number): Card[] => {
    return createDeck().filter(c => 
        !['J','Q','K','A'].includes(c.rank)
    ).slice(0, count);
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
    { 
        id: 'lesson-3', 
        title: 'Lesson 3: Resources', 
        subtitle: 'Adding & Swapping', 
        steps: LESSON_3_STEPS,
        setup: {
            p1Hand: [
                createTutorialCard(Rank.Four, Suit.Hearts),
                createTutorialCard(Rank.Four, Suit.Spades),
                createTutorialCard(Rank.Nine, Suit.Spades),
                createTutorialCard(Rank.Ten, Suit.Spades),
                createTutorialCard(Rank.Eight, Suit.Clubs),
                createTutorialCard(Rank.Eight, Suit.Hearts),
                createTutorialCard(Rank.Nine, Suit.Diamonds),
                createTutorialCard(Rank.Seven, Suit.Spades) // Target for swap
            ],
            p1Resources: [], // Empty start
            p2Hand: getRandomCards(8), // P2 will discard randoms
            p2Resources: [], // Empty start
            phase: Phase.INIT_SELECT,
            startingPlayerId: 1 // Player 2 goes first
        }
    },
    {
        id: 'lesson-4',
        title: 'Lesson 4: Tactics & Aces',
        subtitle: 'Learn about cards with special abilities',
        steps: LESSON_4_STEPS,
        setup: {
            p1Life: 10,
            p2Life: 8,
            p1Resources: getSafeRandomCards(10),
            p2Resources: getSafeRandomCards(10),
            p1Field: [
                createTutorialCard(Rank.Ace, Suit.Spades),
                createTutorialCard(Rank.Eight, Suit.Hearts)
            ],
            p1Hand: [],
            p2Field: [
                createTutorialCard(Rank.Ten, Suit.Spades),
                createTutorialCard(Rank.Nine, Suit.Diamonds),
                createTutorialCard(Rank.Ten, Suit.Hearts)
            ],
            p2Hand: [],
            phase: Phase.MAIN,
            startingPlayerId: 1 // Player 2 goes first
        }
    }
];
