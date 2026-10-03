import { describe, it, expect } from 'vitest';
import { createElizaState, elizaRespond, ELIZA_NOMATCH_REPLIES, ELIZA_OPENER, type ElizaState } from '@/engine/eliza';

/** Feed inputs in order from a fresh (or given) state; return every reply. */
function converse(inputs: readonly string[], state: ElizaState = createElizaState()) {
  const replies: string[] = [];
  for (const input of inputs) {
    const step = elizaRespond(state, input);
    state = step.state;
    replies.push(step.reply);
  }
  return { replies, state };
}

/**
 * The original MAD-SLIP ELIZA running .TAPE. 100 on CTSS under the s709
 * emulator (eliza-ctss, etc/running-eliza.txt, CC0), prompted with the
 * "Men are all alike" inputs. CTSS prints punctuation as its own token
 * ("REALLY , EVERYONE"); this engine attaches it ("REALLY, EVERYONE").
 */
const CTSS_TAPE_100_CONVERSATION: readonly (readonly [string, string])[] = [
  ['Men are all alike.', 'DID YOU THINK THEY MIGHT NOT BE ALL ALIKE'],
  ["They're always bugging us about something or other.", 'CAN YOU THINK OF A SPECIFIC EXAMPLE'],
  ['Well, my boyfriend made me come here.', 'YOUR BOYFRIEND MADE YOU COME HERE'],
  ['He says I am depressed much of the time.', 'IS IT BECAUSE YOU ARE DEPRESSED MUCH OF THE TIME THAT YOU CAME TO ME'],
  ["It's true. I am unhappy.", 'HOW LONG HAVE YOU BEEN UNHAPPY'],
  ['I need some help, that much seems certain.', 'YOU SAY YOU NEED SOME HELP'],
  ['Perhaps I could learn to get along with my mother.', "YOU DON'T SEEM QUITE CERTAIN"],
  ['My mother takes care of me.', 'TELL ME MORE ABOUT YOUR FAMILY'],
  ['My father.', 'WHO ELSE IN YOUR FAMILY'],
  ['You are like my father in some ways.', 'WHAT MAKES YOU THINK I AM LIKE YOUR FATHER IN SOME WAYS'],
  [
    "You are not very aggressive, but I think you don't want me to notice that.",
    'DOES IT PLEASE YOU TO BELIEVE I AM NOT VERY AGGRESSIVE',
  ],
  ["You don't argue with me.", "WHY DO YOU THINK I DON'T ARGUE WITH YOU"],
  ['You are afraid of me.', 'DID YOUR PARENTS AM AFRAID OF YOU'],
  ['My father is afraid of everybody.', 'REALLY, EVERYONE'],
  ['Bullies.', 'DOES THAT HAVE ANYTHING TO DO WITH THE FACT THAT YOUR BOYFRIEND MADE YOU COME HERE'],
];

/**
 * Anthony Hay's CC0 test_michie_1968_convo (src/eliza.cpp) against
 * .TAPE. 100: alignment turns, the conversation quoted by Donald Michie
 * (1968), then Hay's follow-up checks.
 */
const HAY_MICHIE_1968: readonly (readonly [string, string])[] = [
  ['i', 'YOU SAY YOU'],
  ['i am', 'IS IT BECAUSE YOU ARE THAT YOU CAME TO ME'],
  ['i am', 'HOW LONG HAVE YOU BEEN'],
  ['yes', 'YOU SEEM QUITE POSITIVE'],
  ['yes', 'YOU ARE SURE'],
  ['yes', 'I SEE'],
  ['i feel', 'TELL ME MORE ABOUT SUCH FEELINGS'],
  ['no', "ARE YOU SAYING 'NO' JUST TO BE NEGATIVE"],
  ['no', 'YOU ARE BEING A BIT NEGATIVE'],
  ['because', 'IS THAT THE REAL REASON'],
  ['because', "DON'T ANY OTHER REASONS COME TO MIND"],
  ['because', 'DOES THAT REASON SEEM TO EXPLAIN ANYTHING ELSE'],
  ['I wish I had my baggage.', 'CAN YOU ELABORATE ON THAT'],
  [
    'I am not quite clear as to what sort of elaboration is wanted.',
    'DO YOU BELIEVE IT NORMAL TO BE NOT QUITE CLEAR AS TO WHAT SORT OF ELABORATION IS WANTED',
  ],
  ['Yes, quite normal.', 'I UNDERSTAND'],
  ['I have lost my baggage.', 'DO YOU SAY YOU HAVE LOST YOUR BAGGAGE FOR SOME SPECIAL REASON'],
  ['I feel lost without it.', 'DO YOU OFTEN FEEL LOST WITHOUT IT'],
  ['No, this is the first time.', 'WHY NOT'],
  ['Because I normally do not lose my things.', 'WHAT OTHER REASONS MIGHT THERE BE'],
  ['My mother trained me not to lose things.', 'TELL ME MORE ABOUT YOUR FAMILY'],
  ['I have lost my baggage.', "THAT'S QUITE INTERESTING"],
  ['I have lost my baggage.', 'YOU SAY YOU HAVE LOST YOUR BAGGAGE'],
  ['did you ever lose me', 'WHY DO YOU THINK I EVER LOSE YOU'],
  ['did you ever lose me', 'DID YOUR PARENTS EVER LOSE YOU'],
];

describe('golden conversations (.TAPE. 100)', () => {
  it('opens with the script greeting', () => {
    expect(ELIZA_OPENER).toBe(
      'HOW DO YOU DO. I AM THE DOCTOR. PLEASE SIT DOWN AT THE TYPEWRITER AND TELL ME YOUR PROBLEM.',
    );
  });

  it('reproduces the original program on emulated CTSS, line for line', () => {
    const { replies } = converse(CTSS_TAPE_100_CONVERSATION.map(([input]) => input));
    expect(replies).toEqual(CTSS_TAPE_100_CONVERSATION.map(([, reply]) => reply));
  });

  it("reproduces Hay's Michie 1968 conversation test", () => {
    const { replies } = converse(HAY_MICHIE_1968.map(([input]) => input));
    expect(replies).toEqual(HAY_MICHIE_1968.map(([, reply]) => reply));
  });
});

describe('elizaRespond', () => {
  it('never prints a question mark and always answers in capitals', () => {
    const { replies } = converse(['What is your name?', 'Why?', 'How are you?', 'Can I go?', 'Are you mad?', 'is it?']);
    for (const reply of replies) {
      expect(reply).not.toContain('?');
      expect(reply).toBe(reply.toUpperCase());
      expect(reply.length).toBeGreaterThan(0);
    }
  });

  it('is pure: the input state is not modified and replays are identical', () => {
    const start = createElizaState();
    const snapshot = JSON.stringify(start);
    const a = converse(['my dog bit me', 'yes', 'xyzzy', 'xyzzy'], start);
    const b = converse(['my dog bit me', 'yes', 'xyzzy', 'xyzzy'], start);
    expect(JSON.stringify(start)).toBe(snapshot);
    expect(a).toEqual(b);
    // state survives a JSON round trip (it can be persisted with the session)
    const restored = JSON.parse(JSON.stringify(a.state)) as ElizaState;
    expect(elizaRespond(restored, 'yes')).toEqual(elizaRespond(a.state, 'yes'));
  });

  describe('LIMIT counter', () => {
    it('starts at 1 and is advanced to 2 by the first input, cycling 2 3 4 1', () => {
      const limits: number[] = [];
      let state = createElizaState();
      expect(state.limit).toBe(1);
      for (let i = 0; i < 6; i++) {
        state = elizaRespond(state, 'xyzzy').state;
        limits.push(state.limit);
      }
      expect(limits).toEqual([2, 3, 4, 1, 2, 3]);
    });
  });

  describe('keyword selection', () => {
    it('keeps only the highest-ranked keyword; ties go to the first one found', () => {
      // MY (0) then EVERYBODY (2): the rank-2 keyword wins
      expect(elizaRespond(createElizaState(), 'my father is afraid of everybody').reply).toBe('REALLY, EVERYONE');
      // PERHAPS, I and MY are all rank 0: PERHAPS came first
      expect(elizaRespond(createElizaState(), 'perhaps I love my dog').reply).toBe("YOU DON'T SEEM QUITE CERTAIN");
      // IF is rank 3 and beats ALWAYS (1)
      expect(elizaRespond(createElizaState(), 'I always fail if I try').reply).toBe(
        'DO YOU THINK ITS LIKELY THAT YOU TRY',
      );
    });

    it('follows rule-level links to another keyword', () => {
      expect(elizaRespond(createElizaState(), 'how does it work').reply).toBe('WHY DO YOU ASK');
      expect(elizaRespond(createElizaState(), 'maybe').reply).toBe("YOU DON'T SEEM QUITE CERTAIN");
      // WHY tries its own rules first, then links to WHAT
      expect(elizaRespond(createElizaState(), "why don't you help me").reply).toBe("DO YOU BELIEVE I DON'T HELP YOU");
      expect(elizaRespond(createElizaState(), 'why is the sky blue').reply).toBe('WHY DO YOU ASK');
    });

    it('shares the reassembly cursor of a linked keyword', () => {
      const { replies } = converse(['what now', 'how so', 'when then']);
      expect(replies).toEqual([
        'WHY DO YOU ASK',
        'DOES THAT QUESTION INTEREST YOU',
        'WHAT IS IT YOU REALLY WANT TO KNOW',
      ]);
    });
  });

  describe('delimiters (period, comma and BUT)', () => {
    it('discards the clause before a delimiter when it holds no keyword', () => {
      expect(elizaRespond(createElizaState(), 'Hello there, I am sad').reply).toBe(
        'IS IT BECAUSE YOU ARE SAD THAT YOU CAME TO ME',
      );
    });

    it('discards everything after a delimiter once a keyword is found', () => {
      expect(elizaRespond(createElizaState(), 'I am sad but you are happy').reply).toBe(
        'IS IT BECAUSE YOU ARE SAD THAT YOU CAME TO ME',
      );
    });

    it('treats BUT as a delimiter (1965 source line 000660)', () => {
      expect(elizaRespond(createElizaState(), 'nothing much but I am sad').reply).toBe(
        'IS IT BECAUSE YOU ARE SAD THAT YOU CAME TO ME',
      );
    });

    it('treats ? and ! as periods', () => {
      expect(elizaRespond(createElizaState(), 'Really? I am tired!').reply).toBe(
        'IS IT BECAUSE YOU ARE TIRED THAT YOU CAME TO ME',
      );
    });
  });

  describe('decomposition and reassembly', () => {
    it('applies the I/YOU, MY/YOUR, AM/ARE, ME/YOU substitutions', () => {
      expect(elizaRespond(createElizaState(), 'you hate me').reply).toBe('WHY DO YOU THINK I HATE YOU');
    });

    it('matches a DLIST family word after YOUR', () => {
      expect(elizaRespond(createElizaState(), 'my sister is mean').reply).toBe('TELL ME MORE ABOUT YOUR FAMILY');
    });

    it('cycles reassemblies per decomposition rule and wraps around', () => {
      const { replies } = converse(['yes', 'yes', 'yes', 'yes', 'yes']);
      expect(replies).toEqual([
        'YOU SEEM QUITE POSITIVE',
        'YOU ARE SURE',
        'I SEE',
        'I UNDERSTAND',
        'YOU SEEM QUITE POSITIVE',
      ]);
    });

    it('keeps a separate cursor for each decomposition of a keyword', () => {
      const { replies } = converse(['I am sad', 'I feel sad', 'I am tired']);
      expect(replies).toEqual([
        'IS IT BECAUSE YOU ARE SAD THAT YOU CAME TO ME',
        'TELL ME MORE ABOUT SUCH FEELINGS',
        'HOW LONG HAVE YOU BEEN TIRED',
      ]);
    });

    it('prints the built-in NOMACH message chosen by LIMIT when no rule matches', () => {
      // CAN only has (0 CAN I 0) and (0 CAN YOU 0); "CAN WE" matches neither
      const { replies } = converse(['can we', 'can we', 'can we', 'can we']);
      // LIMIT is 2, 3, 4, 1 on these turns
      expect(replies).toEqual([
        ELIZA_NOMATCH_REPLIES[1],
        ELIZA_NOMATCH_REPLIES[2],
        ELIZA_NOMATCH_REPLIES[3],
        ELIZA_NOMATCH_REPLIES[0],
      ]);
      expect(ELIZA_NOMATCH_REPLIES).toEqual(['PLEASE CONTINUE', 'HMMM', 'GO ON, PLEASE', 'I SEE']);
    });
  });

  describe('NONE fallback', () => {
    it('cycles the four content-free remarks when no keyword is found', () => {
      const { replies } = converse(['xyzzy', 'plugh', 'xyzzy', 'plugh', 'xyzzy']);
      expect(replies).toEqual([
        'I AM NOT SURE I UNDERSTAND YOU FULLY',
        'PLEASE GO ON',
        'WHAT DOES THAT SUGGEST TO YOU',
        'DO YOU FEEL STRONGLY ABOUT DISCUSSING SUCH THINGS',
        'I AM NOT SURE I UNDERSTAND YOU FULLY',
      ]);
    });

    it('answers blank input with the NONE rule', () => {
      expect(elizaRespond(createElizaState(), '   ').reply).toBe('I AM NOT SURE I UNDERSTAND YOU FULLY');
    });
  });

  describe('MEMORY', () => {
    it.each([
      ['purpose', 'EARLIER YOU SAID YOUR PURPOSE'],
      ['devonshire', 'LETS DISCUSS FURTHER WHY YOUR DEVONSHIRE'],
      ['predicament', 'DOES THAT HAVE ANYTHING TO DO WITH THE FACT THAT YOUR PREDICAMENT'],
      ['gloucestershire', 'BUT YOUR GLOUCESTERSHIRE'],
    ])('chooses the memory form by hashing the last word: my %s', (word, memory) => {
      // inputs 1-3 run with LIMIT 2, 3, 4; the third has no keyword
      const { replies } = converse([`my ${word}`, 'xyzzy', 'xyzzy']);
      expect(replies[0]).toBe(`YOUR ${word.toUpperCase()}`);
      expect(replies[1]).toBe('I AM NOT SURE I UNDERSTAND YOU FULLY');
      expect(replies[2]).toBe(memory);
    });

    it('recalls only when LIMIT is 4 and the input has no keyword', () => {
      // LIMIT: 2 (memory made), 3, 4 (keyword present: no recall), 1, 2, 3, 4 (recall)
      const { replies, state } = converse(['my purpose', 'xyzzy', 'yes', 'xyzzy', 'xyzzy', 'xyzzy', 'xyzzy']);
      expect(replies[2]).toBe('YOU SEEM QUITE POSITIVE');
      expect(replies.slice(3, 6)).toEqual([
        'PLEASE GO ON',
        'WHAT DOES THAT SUGGEST TO YOU',
        'DO YOU FEEL STRONGLY ABOUT DISCUSSING SUCH THINGS',
      ]);
      expect(replies[6]).toBe('EARLIER YOU SAID YOUR PURPOSE');
      expect(state.memories).toEqual([]);
    });

    it('queues memories first in, first out', () => {
      const { replies } = converse(['my purpose', 'my devonshire', 'xyzzy', 'a', 'b', 'c', 'd']);
      expect(replies[2]).toBe('EARLIER YOU SAID YOUR PURPOSE');
      expect(replies[6]).toBe('LETS DISCUSS FURTHER WHY YOUR DEVONSHIRE');
    });

    it('lays down a memory only when MY is the chosen keyword', () => {
      expect(converse(['I love my dog']).state.memories).toEqual([]);
      expect(converse(['my dog loves me']).state.memories).toHaveLength(1);
    });
  });
});
