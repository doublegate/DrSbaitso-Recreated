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

// Onboarding tutorial steps (Enhanced mode).
// Targets are `[data-tour-id]` hooks rendered by EnhancedApp; a step whose
// target is absent is shown centred. No step requires an action: the tutorial
// overlay is modal, so the page underneath cannot be clicked or typed into.
import type { OnboardingStep } from './types';
import { shortcutLabel } from './utils/shortcuts';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Dr. Sbaitso Recreated!',
    content: 'The 1991 Sound Blaster AI therapist, recreated for the web. This short tour points out the main controls of the enhanced interface.',
    skipable: true
  },
  {
    id: 'characters',
    title: 'AI Personalities',
    content: 'Five personalities from computing history are built in: Dr. Sbaitso (1991), ELIZA (1966), HAL 9000 (1968), JOSHUA/WOPR (1983) and PARRY (1972). The highlighted character button opens the Character Creator, where you can design your own.',
    target: '[data-tour-id="character-selection"]',
    skipable: true
  },
  {
    id: 'first-message',
    title: 'Start a Conversation',
    content: 'Type on the input line at the bottom of the screen and press Enter to send. Dr. Sbaitso answers in ALL CAPS, with his synthesized voice.',
    target: '[data-tour-id="chat-input"]',
    skipable: true
  },
  {
    id: 'audio',
    title: 'Audio Mode',
    content: `Choose how authentic the voice sounds, from modern to ultra lo-fi Sound Blaster. Press ${shortcutLabel('cycleAudioMode')} to cycle modes. Tick SAVE HISTORY to keep conversations in this browser for search, replay and insights.`,
    target: '[data-tour-id="audio-settings"]',
    skipable: true
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: `Every shortcut is Alt+Shift plus a letter:\n• ${shortcutLabel('insights')} - Conversation insights\n• ${shortcutLabel('voiceInput')} - Voice input\n• ${shortcutLabel('cycleAudioMode')} - Cycle audio quality\n• ${shortcutLabel('accessibility')} - Accessibility settings\n• ${shortcutLabel('tutorial')} - Show this tutorial again\n• ${shortcutLabel('switchMode')} - Switch to the classic screen\n\nEach menu item lists its shortcut.`,
    target: '[data-tour-id="settings-panel"]',
    skipable: true
  },
  {
    id: 'voice-control',
    title: 'Voice Input',
    content: `Talk instead of typing: use the microphone button or press ${shortcutLabel('voiceInput')}. Voice input needs a browser with the Web Speech API (Chrome, Edge or Safari).`,
    target: '[data-tour-id="voice-input"]',
    skipable: true
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    content: `Built for everyone:\n• Full keyboard navigation (Tab, Enter, Escape)\n• Screen reader announcements\n• High contrast mode\n• Adjustable font size\n• Reduced motion\n\nPress ${shortcutLabel('accessibility')}, or open Accessibility in the highlighted SETTINGS menu.`,
    target: '[data-tour-id="theme-button"]',
    skipable: true
  },
  {
    id: 'advanced-features',
    title: 'More to Explore',
    content: '• Theme customizer - your own retro colour schemes\n• Search - find past messages (needs SAVE HISTORY)\n• Export - save the conversation as text, Markdown, JSON or HTML, or print it to PDF\n• Sound packs - your own sounds for app events\n\nSearch and Export are in the highlighted CONVERSATION menu; the rest are under VISUALS, SOUND and SETTINGS.',
    target: '[data-tour-id="session-panel"]',
    skipable: true
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    content: `That is the tour. Press ${shortcutLabel('tutorial')} any time to see it again.\n\nReady to experience retro AI therapy?`,
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
