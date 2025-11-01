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

// Audio mode configurations (Authentic 1991 Dr. Sbaitso Voice Recreation)
export interface AudioMode {
  id: 'modern' | 'subtle' | 'authentic' | 'ultra';
  name: string;
  description: string;
  technicalSpecs: string;
  details: string;
}

export const AUDIO_MODES: AudioMode[] = [
  {
    id: 'modern',
    name: 'Modern Quality',
    description: 'Current Gemini TTS - Natural prosody',
    technicalSpecs: '24 kHz, 16-bit',
    details: 'Clean, modern text-to-speech with natural intonation and full frequency range'
  },
  {
    id: 'subtle',
    name: 'Subtle Vintage',
    description: 'Light retro processing - Enhanced nostalgia',
    technicalSpecs: '22 kHz, 16-bit, 200-8000 Hz',
    details: 'Slightly vintage sound with gentle processing for a nostalgic feel'
  },
  {
    id: 'authentic',
    name: 'Authentic 1991',
    description: 'Original Dr. Sbaitso sound - Recommended',
    technicalSpecs: '11 kHz, 8-bit, 300-5000 Hz',
    details: 'Authentic Sound Blaster 8-bit audio quality matching the 1991 original'
  },
  {
    id: 'ultra',
    name: 'Ultra Authentic',
    description: 'Maximum vintage with artifacts - Purist mode',
    technicalSpecs: '11 kHz, 8-bit, 300-5000 Hz + artifacts',
    details: 'Maximum authenticity with aliasing and quantization artifacts for true 1991 experience'
  }
];

export const DEFAULT_AUDIO_MODE = 'authentic';

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
  PREV_THEME: 'Alt+[',
  OPEN_INSIGHTS: 'Ctrl+I', // v1.8.0
  RESTART_TUTORIAL: 'Ctrl+?' // v1.8.0
};

// Onboarding Tutorial Steps (v1.8.0)
import { OnboardingStep } from './types';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Dr. Sbaitso Recreated!',
    content: 'Experience the legendary 1991 AI therapist recreated for the modern web. This quick tutorial will introduce you to all the amazing features. Ready to begin your journey into retro AI therapy?',
    skipable: true
  },
  {
    id: 'characters',
    title: 'Choose Your AI Personality',
    content: 'Meet 5 legendary AI personalities from computing history: Dr. Sbaitso (1991), ELIZA (1966), HAL 9000 (1968), JOSHUA/WOPR (1983), and PARRY (1972). Each has unique conversational styles and historical context. Try the character selector below!',
    target: '#character-select',
    action: 'click',
    actionTarget: '#character-select',
    skipable: true
  },
  {
    id: 'first-message',
    title: 'Start a Conversation',
    content: 'Type your first message in the input box below. Dr. Sbaitso responds in ALL CAPS with authentic 1991 robotic charm. Press Enter to send your message!',
    target: '#message-input',
    action: 'type',
    actionTarget: '#message-input',
    actionPlaceholder: 'Type "Hello Dr. Sbaitso" and press Enter',
    skipable: true
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Master Keyboard Shortcuts',
    content: 'Work faster with 30+ keyboard shortcuts:\n• Ctrl+S - View statistics\n• Ctrl+E - Export conversation\n• Ctrl+/ - Show all shortcuts\n• Ctrl+Shift+I - Open insights dashboard (new!)\n\nPress Ctrl+/ to see the complete list!',
    skipable: true
  },
  {
    id: 'voice-control',
    title: 'Voice Input Support',
    content: 'Use your voice to chat! Click the microphone button or press Ctrl+M to activate voice input. Speak naturally and Dr. Sbaitso will respond. Note: Your browser must support Web Speech API.',
    target: '#voice-button',
    skipable: true
  },
  {
    id: 'accessibility',
    title: 'Accessibility Features',
    content: 'Dr. Sbaitso is designed for everyone:\n• Full keyboard navigation (Tab, Enter, Escape)\n• Screen reader support with ARIA labels\n• High contrast themes\n• Customizable font sizes\n• Reduced motion mode\n\nPress Ctrl+A to open the Accessibility Panel!',
    skipable: true
  },
  {
    id: 'advanced-features',
    title: 'Explore Advanced Features',
    content: 'Discover powerful tools:\n• Audio Visualizer - See sound waves in real-time\n• Theme Customizer - Create custom retro color schemes\n• Conversation Search - Find past messages instantly\n• Session Replay - Relive conversations\n• Cloud Sync - Save sessions across devices\n\nCheck the toolbar for quick access!',
    skipable: true
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    content: 'Congratulations! You\'ve completed the tutorial. A sample conversation has been loaded so you can explore the interface. You can restart this tutorial anytime from Help → Tutorial.\n\nReady to experience retro AI therapy?',
    skipable: false
  }
];

// Sentiment Analysis Keywords (v1.8.0)
export const POSITIVE_KEYWORDS = [
  'happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic',
  'excellent', 'good', 'better', 'best', 'love', 'like', 'enjoy', 'fun',
  'peaceful', 'calm', 'relaxed', 'hopeful', 'optimistic', 'confident',
  'grateful', 'thankful', 'blessed', 'pleased', 'satisfied', 'content',
  'delighted', 'cheerful', 'bright', 'positive', 'energetic', 'motivated',
  'inspired', 'proud', 'accomplished', 'successful', 'winning', 'victory',
  'smile', 'laugh', 'laughing', 'beautiful', 'lovely', 'nice', 'pleasant',
  'comfortable', 'cozy', 'warm', 'friendly', 'kind', 'helpful', 'caring'
];

export const NEGATIVE_KEYWORDS = [
  'sad', 'unhappy', 'depressed', 'down', 'low', 'bad', 'terrible', 'awful',
  'horrible', 'worst', 'hate', 'dislike', 'angry', 'mad', 'frustrated',
  'annoyed', 'irritated', 'upset', 'worried', 'anxious', 'stressed',
  'nervous', 'scared', 'afraid', 'fear', 'fearful', 'panic', 'terrified',
  'lonely', 'alone', 'isolated', 'abandoned', 'rejected', 'hurt', 'pain',
  'painful', 'suffering', 'ache', 'aching', 'sick', 'ill', 'tired',
  'exhausted', 'drained', 'weak', 'helpless', 'hopeless', 'desperate',
  'confused', 'lost', 'stuck', 'trapped', 'overwhelmed', 'bored', 'empty'
];

// Chart Colors (v1.8.0) - Retro-themed for insights dashboard
export const INSIGHT_CHART_COLORS = {
  'dos-blue': ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  'phosphor-green': ['#00ff00', '#00cc00', '#009900', '#006600', '#003300'],
  'amber-mono': ['#ffb000', '#ff9500', '#ffc947', '#ffd480', '#ffe0b3'],
  'paper-white': ['#000000', '#4a4a4a', '#8b7355', '#a0826d', '#b69968'],
  'matrix-green': ['#00ff41', '#008f11', '#00cc2d', '#00b327', '#009922']
};
