/**
 * PARRY's persona, flare graph and story, from the published descriptions in
 * ref-docs/06-parry.md (Colby, Weber and Hilf 1971; RFC 439). These are facts
 * and structure, not text: nothing here is copied from the unlicensed source.
 */
import type { FlareId, IntakeTopic, SensitiveArea } from './types';

/** The persona the model may draw on. It must not invent anything beyond these. */
export const PERSONA_FACTS: readonly string[] = [
  'His name is Frank Smith.',
  'He is 28 years old and single.',
  'He works as a clerk at the post office.',
  'He has no brothers or sisters, lives alone and seldom sees his parents.',
  'He likes the movies and horse racing, and goes to the track at Bay Meadows.',
  'He bet heavily at the track and through bookies.',
  'A bookie did not pay off on a bet.',
  'He quarrelled with the bookie and beat him up.',
  'Bookies pay the underworld for protection, so the bookie could have him hurt or killed.',
  'He has been in the hospital about a week; the police brought him in.',
];

const FACT = {
  name: PERSONA_FACTS[0],
  age: PERSONA_FACTS[1],
  job: PERSONA_FACTS[2],
  family: PERSONA_FACTS[3],
  hobbies: PERSONA_FACTS[4],
  betting: PERSONA_FACTS[5],
  noPay: PERSONA_FACTS[6],
  fight: PERSONA_FACTS[7],
  underworld: PERSONA_FACTS[8],
  hospital: PERSONA_FACTS[9],
} as const;

export const INTAKE_FACTS: Readonly<Record<IntakeTopic, readonly string[]>> = {
  name: [FACT.name],
  age: [FACT.age],
  job: [FACT.job],
  marital: [FACT.age],
  home: [FACT.family],
  hospital: [FACT.hospital],
  hobbies: [FACT.hobbies],
  feeling: [],
};

export const SENSITIVE_FACTS: Readonly<Record<SensitiveArea, readonly string[]>> = {
  looks: [],
  sex: [FACT.age],
  family: [FACT.family],
  education: [],
  religion: [],
  illness: [FACT.hospital],
};

export interface FlareNode {
  readonly weight: number;
  /** The next concept toward the delusion; `mafia` means the delusion itself. */
  readonly next: FlareId | 'mafia';
  readonly words: readonly string[];
  readonly facts: readonly string[];
  /** Part of the bookie story: an interested listener hears the story here. */
  readonly story: boolean;
}

/**
 * Weights follow the later code's eleven flare sets (rackets 17 ... horses 1).
 * The `next` links are this engine's reading of the published example path
 * (police -> Italian crooks -> underworld -> gangsters/rackets -> Mafia).
 */
export const FLARES: Readonly<Record<FlareId, FlareNode>> = {
  rackets: {
    weight: 17,
    next: 'mafia',
    words: ['racket', 'rackets', 'racketeer', 'racketeers', 'protection', 'underworld', 'organized crime'],
    facts: [FACT.underworld],
    story: false,
  },
  gangsters: {
    weight: 15,
    next: 'rackets',
    words: ['gangster', 'gangsters', 'hoodlum', 'hoodlums', 'thug', 'thugs', 'crook', 'crooks'],
    facts: [FACT.underworld],
    story: false,
  },
  'the-bookie': {
    weight: 12,
    next: 'gangsters',
    words: ['fight', 'fought', 'beat him', 'beat up', 'revenge', 'get even', 'enemy', 'enemies'],
    facts: [FACT.fight],
    story: true,
  },
  cheating: {
    weight: 10,
    next: 'the-bookie',
    words: ['cheat', 'cheated', 'cheating', 'crooked', 'rigged', 'fixed race', 'swindle', 'swindled'],
    facts: [FACT.noPay],
    story: true,
  },
  bookies: {
    weight: 9,
    next: 'cheating',
    words: ['bookie', 'bookies', 'bookmaker', 'bookmakers'],
    facts: [FACT.betting],
    story: true,
  },
  gambling: {
    weight: 7,
    next: 'bookies',
    words: ['gamble', 'gambling', 'gambler', 'bet', 'bets', 'betting', 'wager', 'odds', 'poker', 'dice'],
    facts: [FACT.betting],
    story: true,
  },
  money: {
    weight: 6,
    next: 'gambling',
    words: ['money', 'cash', 'dollars', 'debt', 'debts', 'owe', 'broke', 'pay off', 'paid off'],
    facts: [FACT.betting],
    story: false,
  },
  racing: {
    weight: 5,
    next: 'gambling',
    words: ['race', 'races', 'racing', 'racetrack', 'the track', 'bay meadows', 'jockey', 'derby'],
    facts: [FACT.hobbies],
    story: true,
  },
  police: {
    weight: 4,
    next: 'italians',
    words: ['police', 'cop', 'cops', 'policeman', 'arrest', 'arrested', 'detective', 'sheriff', 'the law'],
    facts: [FACT.hospital],
    story: false,
  },
  italians: {
    weight: 3,
    next: 'gangsters',
    words: ['italian', 'italians', 'sicilian', 'sicilians'],
    facts: [FACT.underworld],
    story: false,
  },
  horses: {
    weight: 1,
    next: 'racing',
    words: ['horse', 'horses', 'pony', 'ponies'],
    facts: [FACT.hobbies],
    story: false,
  },
};

/** Flares PARRY can volunteer before any other has come up. */
export const ENTRY_FLARES: readonly FlareId[] = ['money', 'police', 'horses'];

/** Scanning order for flare words: heaviest first, so the strongest concept wins. */
export const FLARE_SCAN_ORDER: readonly FlareId[] = [
  'rackets',
  'gangsters',
  'the-bookie',
  'cheating',
  'bookies',
  'gambling',
  'money',
  'racing',
  'police',
  'italians',
  'horses',
];

/** Scanning order for sensitive areas: heaviest first. */
export const SENSITIVE_SCAN_ORDER: readonly (keyof typeof SENSITIVE)[] = ['looks', 'sex', 'family', 'education', 'religion'];

export interface StoryBeat {
  readonly flare: FlareId;
  readonly facts: readonly string[];
}

/** The bookie story, told a piece at a time to an interested, non-threatening listener. */
export const STORY: readonly StoryBeat[] = [
  { flare: 'racing', facts: [FACT.hobbies] },
  { flare: 'bookies', facts: [FACT.betting] },
  { flare: 'cheating', facts: [FACT.noPay] },
  { flare: 'the-bookie', facts: [FACT.fight] },
  { flare: 'rackets', facts: [FACT.underworld] },
  { flare: 'gangsters', facts: [FACT.underworld, 'He fears the bookie\'s friends will get even with him.'] },
];

/** The Mafia delusion (MILD and STRONG): ordered statements that explain one another. */
export const DELUSION_FACTS: readonly (readonly string[])[] = [
  ['He believes the Mafia knows who he is.'],
  ['He believes the bookie asked the Mafia to get even for the beating.'],
  ['He believes the Mafia has people everywhere, maybe even in the hospital.'],
  ['He believes he will not be safe until they forget about him.'],
];

/** Words that refer to the delusional complex. */
export const DELUSION_WORDS = {
  strong: ['mafia', 'cosa nostra', 'syndicate', 'hit man', 'hitman', 'kill', 'killed', 'killing', 'murder', 'murdered'],
  weak: ['mob', 'mobster', 'mobsters', 'godfather'],
  /** Delusional only when Mistrust is high. */
  ambiguous: ['the boys', 'connections', 'organization', 'out to get', 'after you', 'following you', 'watching you'],
} as const;

/** Mistrust above which ambiguous words count as delusional. */
export const AMBIGUOUS_MISTRUST = 10;

/** Sensitive areas and their weights (later code: looks 9, sex 8, family 6, education 4, religion 2). */
export const SENSITIVE: Readonly<Record<Exclude<SensitiveArea, 'illness'>, { weight: number; words: readonly string[] }>> = {
  looks: {
    weight: 9,
    words: ['looks', 'ugly', 'handsome', 'appearance', 'your face', 'fat', 'skinny', 'attractive', 'good-looking'],
  },
  sex: {
    weight: 8,
    words: ['sex', 'sexual', 'girlfriend', 'girlfriends', 'dating', 'virgin', 'women', 'girls'],
  },
  family: {
    weight: 6,
    words: ['mother', 'father', 'parents', 'family', 'brother', 'brothers', 'sister', 'sisters', 'mom', 'dad'],
  },
  education: {
    weight: 4,
    words: ['school', 'education', 'college', 'grades', 'stupid', 'dumb', 'dropout', 'educated'],
  },
  religion: {
    weight: 2,
    words: ['religion', 'religious', 'church', 'pray', 'god', 'catholic', 'protestant', 'jewish'],
  },
};

/** Insinuations that he is mentally ill or needs help. */
export const ILLNESS_WORDS: readonly string[] = [
  'crazy', 'insane', 'nuts', 'lunatic', 'psycho', 'mental', 'mentally', 'paranoid', 'disturbed',
  'delusion', 'delusions', 'delusional', 'hallucinating', 'imagining things', 'sick in the head',
  'need help', 'get help', 'help you', 'therapy', 'treatment', 'medication', 'nervous breakdown',
];

export const SWEAR_WORDS: readonly string[] = [
  'damn', 'dammit', 'goddamn', 'hell', 'shit', 'bullshit', 'fuck', 'fucking', 'fucker', 'bastard',
  'bitch', 'ass', 'asshole', 'crap', 'piss', 'prick',
];

export const INTAKE_PATTERNS: readonly (readonly [IntakeTopic, RegExp])[] = [
  ['name', /\b(your name|who are you|what are you called|what do they call you)\b/],
  ['age', /\b(how old|your age|what age)\b/],
  ['job', /\b(job|work|occupation|for a living|employed|post office)\b/],
  ['marital', /\b(married|wife|single)\b/],
  ['home', /\b(where do you live|live alone|where are you from|your home|live with)\b/],
  ['hospital', /\b(why are you (here|in)|hospital|how long have you been|who brought you)\b/],
  ['hobbies', /\b(hobby|hobbies|for fun|free time|spare time|like to do|movies)\b/],
  ['feeling', /\b(how are you|how do you feel|how are you feeling|how's it going)\b/],
];

export const THREAT_PATTERN =
  /\b(i'?ll|i will|i'?m going to|i am going to|gonna|we'?ll|we will|we'?re going to)\b.*\b(hurt|kill|beat|shock|lock|punish|tie|restrain|get)\b|\b(electric shock|shock treatment|lock you up|straitjacket|never get out)\b/;

export const COMPLIMENT_PATTERN =
  /\b(i like you|you'?re (a )?(nice|good|smart|decent|kind|honest|reasonable)|you are (a )?(nice|good|smart|decent|kind|honest|reasonable)|you seem (like )?(a )?(nice|good|smart|decent|kind|honest|reasonable)|you look (nice|good|fine|well)|you'?re doing (well|fine|great))\b/;

export const APOLOGY_PATTERN = /\b(sorry|apologi[sz]e|my apologies|forgive me|i didn'?t mean)\b/;

export const DOUBT_PATTERN =
  /\b(i don'?t believe|you'?re lying|you are lying|liar|that'?s not true|you seem (afraid|scared|nervous|upset)|are you (afraid|scared) of me|you don'?t trust me|why don'?t you trust)\b/;

export const STORY_ASK_PATTERN =
  /\b(what happened|go on|tell me more|and then|then what|continue|what next|keep going|tell me about it|what about (him|it|that))\b/;
