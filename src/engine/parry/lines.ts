/**
 * The local fallback line bank. Every line here was written for this project
 * in PARRY's register (short, plain, guarded, a working man of 1971); none is
 * taken from Colby's papers, RFC 439 or the unlicensed archived source.
 * "BYE." is the one exception: it is the documented exit word.
 */
import type { FlareId, IntakeTopic, SensitiveArea } from './types';

export const BYE_LINE = 'BYE.';

export const INTAKE_LINES: Readonly<Record<IntakeTopic, readonly string[]>> = {
  name: ['FRANK SMITH.', "IT'S FRANK. FRANK SMITH."],
  age: ["I'M 28.", 'TWENTY-EIGHT.'],
  job: ['I WORK AT THE POST OFFICE. I SORT MAIL.', "I'M A CLERK AT THE POST OFFICE."],
  marital: ["NO, I'M NOT MARRIED.", "I'M SINGLE."],
  home: ['I LIVE BY MYSELF.', 'I HAVE MY OWN PLACE. I LIVE ALONE.'],
  hospital: ['THE COPS BROUGHT ME IN. ABOUT A WEEK AGO.', "I'VE BEEN IN HERE A WEEK. THE POLICE PUT ME HERE."],
  hobbies: ['I GO TO THE MOVIES. AND THE TRACK.', 'I LIKE THE HORSE RACES.'],
  feeling: ['OK.', "I'M ALL RIGHT.", 'A LITTLE TIRED.'],
};

export const FLARE_LINES: Readonly<Record<FlareId, readonly string[]>> = {
  horses: ['I LIKE HORSES. GOOD ANIMALS.', 'HORSES ARE HONEST. MORE THAN PEOPLE.'],
  racing: ['I GO TO BAY MEADOWS A LOT.', 'THE RACES ARE THE ONLY PLACE I RELAX.'],
  police: ["THE POLICE DON'T DO THEIR JOB.", 'COPS NEVER GO AFTER THE ONES THEY SHOULD.'],
  // A hint about specific crooks, never a remark about a group of people.
  italians: ['COPS LOOK THE OTHER WAY FOR CERTAIN PEOPLE.', 'SOME CROOKS NEVER GET PICKED UP. YOU KNOW WHY?'],
  money: ['A GUY STILL OWES ME MONEY.', 'MONEY MAKES PEOPLE DO DIRTY THINGS.'],
  gambling: ['I PUT A LOT ON THE HORSES.', 'I BET. EVERYBODY BETS.'],
  bookies: ['A BOOKIE WILL SELL YOU OUT EVERY TIME.', 'I USED TO BET THROUGH A BOOKIE.'],
  cheating: ['SOME PEOPLE CHEAT AND GET AWAY WITH IT.', 'I KNOW WHEN SOMEBODY IS CHEATING ME.'],
  'the-bookie': ['I HAD SOME TROUBLE WITH A GUY.', 'THERE WAS A FIGHT. I DID WHAT I HAD TO.'],
  gangsters: ['THERE ARE HOODS OUT THERE YOU DO NOT CROSS.', 'SOME PEOPLE HAVE FRIENDS IN BAD PLACES.'],
  rackets: ['THE RACKETS RUN MORE THAN YOU THINK.', 'BOOKIES PAY FOR PROTECTION. YOU KNOW THAT?'],
};

export const STORY_LINES: readonly (readonly string[])[] = [
  ['I GO TO THE TRACK AT BAY MEADOWS.', 'I SPEND MY WEEKENDS AT THE RACES.'],
  ['I PLACED BETS WITH A BOOKIE.', 'I HAD A BOOKIE I BET WITH.'],
  ["HE WOULDN'T PAY ME WHAT I WON.", 'I WON, AND HE TRIED TO STIFF ME.'],
  ['SO I WENT AFTER HIM. I BEAT HIM UP.', 'I LOST MY TEMPER AND LET HIM HAVE IT.'],
  ['A BOOKIE PAYS THE UNDERWORLD TO PROTECT HIM.', 'GUYS LIKE THAT HAVE PROTECTION.'],
  ['HIS FRIENDS COULD COME AFTER ME.', 'THEY COULD HAVE ME HURT. OR WORSE.'],
];

export const DELUSION_LINES: readonly (readonly string[])[] = [
  ['THE MAFIA KNOWS WHO I AM.', 'I THINK THE MAFIA HAS MY NAME.'],
  ['THE BOOKIE WENT TO THEM ABOUT ME.', 'HE ASKED THEM TO SQUARE THINGS FOR HIM.'],
  ['THEY HAVE PEOPLE EVERYWHERE. MAYBE IN HERE.', "HOW DO I KNOW ONE OF THEM ISN'T ON THIS WARD?"],
  ["I WON'T BE SAFE UNTIL THEY FORGET ME.", "THEY DON'T FORGET. THAT'S THE THING."],
];

export const SENSITIVE_LINES: Readonly<
  Record<SensitiveArea, { statement: readonly string[]; question: readonly string[] }>
> = {
  looks: {
    statement: ['LEAVE MY LOOKS OUT OF IT.', "THERE'S NOTHING WRONG WITH HOW I LOOK."],
    question: ["WHAT'S IT TO YOU HOW I LOOK?", 'WHY DO YOU CARE WHAT I LOOK LIKE?'],
  },
  sex: {
    statement: ["THAT'S PRIVATE.", "THAT'S MY BUSINESS."],
    question: ['WHY DO YOU WANT TO KNOW THAT?', 'WHAT KIND OF QUESTION IS THAT?'],
  },
  family: {
    statement: ['LEAVE MY FAMILY OUT OF THIS.', "I DON'T SEE MY FOLKS MUCH. SO WHAT."],
    question: ['WHAT DO MY PARENTS HAVE TO DO WITH IT?', 'WHY ARE YOU ASKING ABOUT MY FAMILY?'],
  },
  education: {
    statement: ["I'M NOT STUPID.", 'I KNOW AS MUCH AS THE NEXT GUY.'],
    question: ['WHY, DO I SEEM DUMB TO YOU?', 'WHAT DOES SCHOOL HAVE TO DO WITH ANYTHING?'],
  },
  religion: {
    statement: ["I DON'T TALK RELIGION.", 'I KEEP THAT TO MYSELF.'],
    question: ['WHY DO YOU WANT TO KNOW WHAT I BELIEVE?', 'WHAT DOES THAT MATTER?'],
  },
  illness: {
    statement: ["THERE'S NOTHING WRONG WITH MY HEAD.", 'I GOT PUT IN HERE BY MISTAKE.'],
    question: ['DO I LOOK CRAZY TO YOU?', 'WHY WOULD I NEED HELP?'],
  },
};

export const KIND_LINES = {
  evade: ['CAN WE GET OFF THIS?', 'NEVER MIND THAT.', 'DROP IT.'],
  refuse: ["I'M NOT GOING INTO THAT.", "THAT'S NONE OF YOUR CONCERN.", "I DON'T WANT TO GET INTO IT."],
  suspiciousQuery: ['WHY DO YOU WANT TO KNOW?', 'WHO PUT YOU UP TO THIS?', 'WHAT ARE YOU REALLY AFTER?'],
  drawIn: ["YOU'RE ONE OF THEM, AREN'T YOU?", 'I THINK YOU KNOW MORE THAN YOU SAY.', 'SOMEBODY SENT YOU.'],
  counterAttack: [
    "YOU'VE GOT A LOT OF NERVE.",
    "WHO DO YOU THINK YOU'RE TALKING TO?",
    "YOU DON'T KNOW A THING ABOUT ME.",
  ],
  soften: ['MAYBE YOU MEAN WELL.', "YOU'RE NOT LIKE THE REST OF THEM.", 'OK. I GUESS YOU ARE LISTENING.'],
  defend: ["I'M TELLING YOU HOW IT IS.", 'WHY WOULD I MAKE IT UP?', "I'M NOT SCARED OF YOU."],
  noncommittal: ['MAYBE.', 'I DUNNO.', 'COULD BE.', 'SO?'],
} as const;
