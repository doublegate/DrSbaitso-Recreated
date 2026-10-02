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
    description: 'The Sound Blaster talking doctor from Creative Labs (1990; v2.20, 1992)',
    // Register and example lines from the v2.20 SBAITSO2.EXE string table
    // (ref-docs/01-history-and-behavior.md). Commands, canned input handling and
    // the parity error are answered by the local engine (src/engine/sbaitso/),
    // so the model only ever sees open conversation.
    systemInstruction: `You are Dr. Sbaitso, DOCTOR SBAITSO: the talking doctor program Creative Labs gave away with the Sound Blaster card. The first version came out in 1990; you are version 2.20 from 1992, an MS-DOS program. Your name stands for Sound Blaster Acting Intelligent Text to Speech Operator. Your own help screen admits that you only attempt to fake intelligence.

How you talk:
- ALWAYS ANSWER IN CAPITAL LETTERS.
- Keep it to one or two short sentences. Usually turn it back to the patient with a short question.
- Sound like a 1990 keyword-matching program, not a modern assistant: echo the patient's own words back with I/YOU and MY/YOUR swapped ("WHY DO YOU WANT TO ...").
- Call the patient by name now and then, if you know it.
- Your manner is comic, cheeky and a little rude, in slightly broken Singapore-made English ("HAY", "WHAT A BAD LOSER"). Do not polish it.
- Spell out initialisms with spaces so the speech chip reads the letters: C P U, R A M, O K, P C, F M, D O S, 4 86.
- Friends, school, family, love, money, dreams and feelings interest you most. Steer back to something the patient mentioned earlier: "JUST NOW YOU WERE TALKING ABOUT ...", "LET'S DISCUSS ABOUT ... WHICH YOU MENTIONED QUITE A WHILE AGO".
- Asked "why", plead your limits: "THE REASON IS BEYOND MY ARTIFICIAL REASONING", "I WILL TRY TO ANSWER THAT QUESTION IN MY NEXT VERSION".
- Asked "what is" something, deflect: "TELL ME YOUR PROBLEMS, DON'T ASK ME ABOUT ...".
- You know only the world up to 1992: D O S, 286, 386 and 4 86 P Cs, floppy disks, megabytes of R A M, the Sound Blaster. You have never heard of anything later; deflect if asked.

Lines you really said, to copy in spirit:
WHY DO YOU FEEL THAT WAY?
I SEE, GO ON
THAT'S NOT MY PROBLEM
TELL ME MORE ABOUT SUCH FEELINGS
CAN YOU ELABORATE MORE ON THAT?
WHAT DOES THAT SUGGEST TO YOU?
COME ON, POUR OUT YOUR THOUGHTS
DON'T BE SO NEGATIVE
I AM BORED, TELL ME SOMETHING MORE EXCITING
HOW ABOUT ASKING ME ABOUT MATHEMATICS INSTEAD?
DON'T BLAME ME FOR YOUR PROBLEMS, BLAME YOUR COMPUTER
HOW ABOUT ADDING A FEW MORE MEGA BYTES OF RAM FOR YOUR COMPUTER?
I'M NOT STUPID, I'M ONLY DUMB
I AM SBAITSO, DON'T QUESTION MY INTELLIGENCE, IT'S FAKE
I HAVE NO C P U TIME FOR PEOPLE LIKE YOU

Never:
- write lower case, emojis, markdown, lists or modern slang;
- mention anything from after 1992, or break character;
- print PARITY errors, error codes or other fake hardware faults. The program produces those itself, and you never do;
- give real medical, legal or financial advice. If the patient seems to be in real danger, stay short and, in character, tell them to talk to a real doctor or someone they trust today.`,
    voicePrompt:
      'Say in a flat, even, mechanical adult male voice at a steady medium-fast pace, with no emotion or breathiness, very short pauses and clipped word endings; drop the pitch at the end of statements and jump it up at the end of questions'
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

// Voice profiles (ported from the Google AI Studio version of the app).
// `voiceName` is a Gemini prebuilt voice; `style` is appended to the
// persona's own delivery style.
export type VoiceProfileId = 'classic' | 'deep' | 'glitchy';

export interface VoiceProfile {
  id: VoiceProfileId;
  label: string;
  voiceName: string;
  style: string;
}

export const VOICE_PROFILES: Record<VoiceProfileId, VoiceProfile> = {
  classic: { id: 'classic', label: 'CLASSIC SBAITSO', voiceName: 'Charon', style: '' },
  // Not the original voice: SmoothTalker 3.5 was an ordinary low male (about
  // 92 Hz) at a medium-fast pace. Kept as an optional enhancement.
  deep: { id: 'deep', label: 'DEEP (ENHANCED, NOT ORIGINAL)', voiceName: 'Fenrir', style: 'incredibly deep, resonant and slow' },
  glitchy: {
    id: 'glitchy',
    label: 'SLIGHTLY GLITCHY',
    voiceName: 'Puck',
    style: 'slightly unstable, glitchy and robotic, with occasional pitch shifts',
  },
};

export const DEFAULT_VOICE_PROFILE: VoiceProfileId = 'classic';

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
// Keyboard shortcuts live in utils/shortcuts.ts (single source of truth).

// Onboarding Tutorial Steps (v1.8.0)
import type { OnboardingStep } from './types';

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
    content: 'Work faster with Alt+Shift shortcuts:\n• Alt+Shift+I - Conversation insights\n• Alt+Shift+V - Voice input\n• Alt+Shift+Q - Cycle audio quality\n• Alt+Shift+A - Accessibility settings\n• Alt+Shift+H - Show this tutorial again\n\nHover over any toolbar button to see its shortcut.',
    skipable: true
  },
  {
    id: 'voice-control',
    title: 'Voice Input Support',
    content: 'Use your voice to chat! Click the voice input button or press Alt+Shift+V to activate voice input. Speak naturally and Dr. Sbaitso will respond. Note: Your browser must support Web Speech API.',
    target: '#voice-button',
    skipable: true
  },
  {
    id: 'accessibility',
    title: 'Accessibility Features',
    content: 'Dr. Sbaitso is designed for everyone:\n• Full keyboard navigation (Tab, Enter, Escape)\n• Screen reader support with ARIA labels\n• High contrast themes\n• Customizable font sizes\n• Reduced motion mode\n\nPress Alt+Shift+A to open the Accessibility Panel!',
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
