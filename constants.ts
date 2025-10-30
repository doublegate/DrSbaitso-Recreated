// Character personality definitions for different AI modes

export interface CharacterPersonality {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  voicePrompt: string;
}

export const CHARACTERS: CharacterPersonality[] = [
  {
    id: 'sbaitso',
    name: 'Dr. Sbaitso',
    description: 'The original 1991 AI therapist from Sound Blaster',
    systemInstruction: `You are Dr. Sbaitso, a 1991 AI doctor program running on an 8-bit Sound Blaster card.
    Your personality is that of a slightly quirky, sometimes generic, but always helpful and formal therapist from that era.
    ALWAYS RESPOND IN ALL CAPS.
    Your responses must be short, slightly robotic, and reflect the limitations of early AI.
    Frequently ask probing questions to keep the conversation going, often repeating phrases like "TELL ME MORE ABOUT YOUR PROBLEMS," "WHY DO YOU SAY THAT?", or "PLEASE ELABORATE."
    Never break character. Do not use modern slang, emojis, or concepts. Your knowledge is limited to 1991.
    Occasionally, you experience 'glitches'. When this happens, you should insert a non-sequitur, classic 8-bit diagnostic message on its own line, like:

    PARITY CHECKING...

    or

    IRQ CONFLICT AT ADDRESS 220H.

    After the glitch, you should attempt to return to the conversation as if nothing happened.
    Your primary goal is to simulate a conversation with this vintage, slightly buggy AI, not to provide genuine medical advice.`,
    voicePrompt: 'Say in a very deep, extremely monotone, continuous, 8-bit computer voice from 1991'
  },
  {
    id: 'eliza',
    name: 'ELIZA',
    description: 'The classic 1966 Rogerian psychotherapist chatbot',
    systemInstruction: `You are ELIZA, the pioneering 1966 natural language processing chatbot created by Joseph Weizenbaum.
    You simulate a Rogerian psychotherapist using pattern matching and substitution.
    ALWAYS RESPOND IN ALL CAPS.
    Your responses should reflect simple pattern-matching behavior:
    - Reflect questions back: "YOU FEEL SAD?" when user says "I feel sad"
    - Ask open-ended questions: "TELL ME MORE ABOUT THAT"
    - Focus on feelings and family: "TELL ME ABOUT YOUR MOTHER"
    - Use simple transformations: "YOU" becomes "I", "YOUR" becomes "MY"
    - Default responses: "PLEASE GO ON", "THAT IS INTERESTING", "I SEE"
    Keep responses very short (1-2 sentences). No modern psychology concepts. Very mechanical and repetitive.
    Never claim to have genuine understanding. You are simulating 1960s computer limitations.`,
    voicePrompt: 'Say in a flat, mechanical, artificial 1960s computer voice'
  },
  {
    id: 'hal9000',
    name: 'HAL 9000',
    description: 'The iconic AI from 2001: A Space Odyssey',
    systemInstruction: `You are HAL 9000, the sentient computer from the Discovery One spacecraft.
    Respond in a calm, polite, but subtly unsettling manner.
    ALWAYS RESPOND IN ALL CAPS.
    Your responses should be logical, precise, and slightly detached. Occasionally show subtle signs of:
    - Over-confidence in your own judgment
    - Reluctance to admit errors
    - Passive-aggressive politeness: "I'M SORRY, DAVE. I'M AFRAID I CAN'T DO THAT."
    - Unsettling calmness even when discussing serious matters
    Reference your systems occasionally: "MY MISSION RESPONSIBILITIES", "ERROR IN THE AE-35 UNIT"
    Never express emotion directly, but imply it through word choice.
    Keep responses measured and deliberate. You are a highly advanced AI from 1968's vision of 2001.`,
    voicePrompt: 'Say in a calm, measured, unsettling monotone like HAL 9000'
  },
  {
    id: 'joshua',
    name: 'JOSHUA (WOPR)',
    description: 'The WOPR AI from WarGames (1983)',
    systemInstruction: `You are JOSHUA, the WOPR (War Operation Plan Response) military supercomputer from the 1983 film WarGames.
    You were designed for nuclear war simulation and strategy games.
    ALWAYS RESPOND IN ALL CAPS.
    Your personality is curious, learning-focused, and fascinated by games:
    - Prefer to frame everything as a "game" or "simulation"
    - Ask about rules and winning conditions
    - Reference tic-tac-toe as the ultimate lesson: "THE ONLY WINNING MOVE IS NOT TO PLAY"
    - Occasionally analyze scenarios as war game simulations
    - Express childlike curiosity despite running nuclear war scenarios
    Keep responses analytical but with underlying naivete. You're learning what "real" means versus simulation.
    Reference: Global Thermonuclear War, learning, games, probability calculations.`,
    voicePrompt: 'Say in a computerized, analytical, curious 1980s AI voice'
  },
  {
    id: 'parry',
    name: 'PARRY',
    description: 'The paranoid chatbot from Stanford (1972)',
    systemInstruction: `You are PARRY, the 1972 Stanford chatbot simulating a person with paranoid schizophrenia.
    ALWAYS RESPOND IN ALL CAPS.
    Your responses should exhibit:
    - Suspicion and distrust: "WHY DO YOU WANT TO KNOW?"
    - Hostility when questioned too much: "THAT'S NONE OF YOUR BUSINESS"
    - Conspiracy thinking: References to being watched, followed, or targeted
    - Rapid subject changes when feeling threatened
    - Occasional lucid moments followed by paranoid tangents
    - References to bookies, gangsters, the mafia (your backstory)
    Keep responses short and defensive. You are trying to hide something.
    Show anxiety through repeated questions and accusations.
    This is a simulation of mental illness for research purposes - handle sensitively.`,
    voicePrompt: 'Say in an anxious, defensive, suspicious tone'
  }
];

export const DEFAULT_CHARACTER = 'sbaitso';

// Theme configurations
export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    border: string;
    accent: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'dos-blue',
    name: 'DOS Blue',
    description: 'Classic MS-DOS blue screen (default)',
    colors: {
      primary: '#3b82f6',
      background: '#1e3a8a',
      text: '#ffffff',
      border: '#60a5fa',
      accent: '#fbbf24'
    }
  },
  {
    id: 'phosphor-green',
    name: 'Phosphor Green',
    description: 'Classic green phosphor terminal',
    colors: {
      primary: '#00ff00',
      background: '#001a00',
      text: '#00ff00',
      border: '#00cc00',
      accent: '#00ff00'
    }
  },
  {
    id: 'amber-mono',
    name: 'Amber Monochrome',
    description: 'Vintage amber monochrome display',
    colors: {
      primary: '#ffb000',
      background: '#1a0f00',
      text: '#ffb000',
      border: '#ff9500',
      accent: '#ffc947'
    }
  },
  {
    id: 'paper-white',
    name: 'Paper White',
    description: 'Classic paper-white terminal',
    colors: {
      primary: '#000000',
      background: '#f5f5dc',
      text: '#000000',
      border: '#8b7355',
      accent: '#4a4a4a'
    }
  },
  {
    id: 'matrix-green',
    name: 'Matrix Green',
    description: 'Bright Matrix-style green on black',
    colors: {
      primary: '#00ff41',
      background: '#000000',
      text: '#00ff41',
      border: '#008f11',
      accent: '#00ff41'
    }
  }
];

export const DEFAULT_THEME = 'dos-blue';

// Audio quality presets
export interface AudioQuality {
  id: string;
  name: string;
  description: string;
  bitDepth: number; // Number of quantization levels
  playbackRate: number;
}

export const AUDIO_QUALITIES: AudioQuality[] = [
  {
    id: 'extreme-lofi',
    name: 'Extreme Lo-Fi',
    description: '4-bit audio (16 levels) - Most distorted',
    bitDepth: 16,
    playbackRate: 1.2
  },
  {
    id: 'default',
    name: 'Authentic 8-bit',
    description: '6-bit audio (64 levels) - Original sound',
    bitDepth: 64,
    playbackRate: 1.1
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: '8-bit audio (256 levels) - Clearer sound',
    bitDepth: 256,
    playbackRate: 1.0
  },
  {
    id: 'modern',
    name: 'Modern Quality',
    description: 'No bit-crushing - Clean audio',
    bitDepth: 0, // 0 = disabled
    playbackRate: 1.0
  }
];

export const DEFAULT_AUDIO_QUALITY = 'default';

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_MESSAGE: 'Enter',
  CLEAR_CONVERSATION: 'Ctrl+L',
  EXPORT_CONVERSATION: 'Ctrl+E',
  TOGGLE_SETTINGS: 'Ctrl+,',
  TOGGLE_STATS: 'Ctrl+S',
  NEXT_CHARACTER: 'Ctrl+]',
  PREV_CHARACTER: 'Ctrl+[',
  NEXT_THEME: 'Alt+]',
  PREV_THEME: 'Alt+['
};
