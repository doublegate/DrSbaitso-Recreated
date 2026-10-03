import { describe, it, expect } from 'vitest';
import {
  FLARES,
  FLARE_SCAN_ORDER,
  PARRY_OPENER,
  STRENGTHS,
  affectTrace,
  applyJump,
  createParryState,
  decayAffect,
  nextRandom,
  parryRespond,
} from '@/engine/parry';
import type { ParryAction, ParryState, ParryStrength } from '@/engine/parry';

/** Feed a list of inputs, returning every action and the final state. */
function run(state: ParryState, inputs: readonly string[]): { state: ParryState; actions: ParryAction[] } {
  const actions: ParryAction[] = [];
  let s = state;
  for (const input of inputs) {
    const step = parryRespond(s, input);
    s = step.state;
    actions.push(step.action);
  }
  return { state: s, actions };
}

describe('PARRY opening', () => {
  it('waits for the interviewer: there is no unprompted greeting', () => {
    expect(PARRY_OPENER).toBeNull();
  });
});

describe('createParryState', () => {
  it('starts each strength from the documented initial conditions', () => {
    expect(createParryState({ strength: 'WEAK' }).affect).toEqual({ fear: 0, anger: 0, mistrust: 0, hurt: 0 });
    expect(createParryState({ strength: 'MILD' }).affect.hurt).toBe(0);
    expect(createParryState({ strength: 'STRONG' }).affect.hurt).toBe(5);
  });

  it('defaults to MILD and an open session', () => {
    const s = createParryState();
    expect(s.strength).toBe('MILD');
    expect(s.ended).toBe(false);
    expect(s.swearCount).toBe(0);
    expect(s.repeatCount).toBe(0);
    expect(s.disclosedFlares).toEqual([]);
  });
});

describe('affect equations', () => {
  it('raises a variable by a share of the headroom to 20', () => {
    expect(applyJump(0, 0.5)).toBe(10);
    expect(applyJump(10, 0.5)).toBe(15);
    expect(applyJump(19, 1)).toBe(20);
  });

  it('decays Anger by 1, Fear by 0.3, Hurt by 0.5 and Mistrust by 0.05 per exchange', () => {
    const s = createParryState({ strength: 'MILD' });
    const raised: ParryState = {
      ...s,
      affect: { fear: 10, anger: 10, mistrust: 10, hurt: 4 },
    };
    const decayed = decayAffect(raised);
    expect(decayed.affect.anger).toBeCloseTo(9);
    expect(decayed.affect.fear).toBeCloseTo(9.7);
    expect(decayed.affect.hurt).toBeCloseTo(3.5);
    expect(decayed.affect.mistrust).toBeCloseTo(9.95);
  });

  it('never decays below the floors', () => {
    const s = createParryState({ strength: 'MILD' });
    const decayed = decayAffect({ ...s, affect: { fear: 0.1, anger: 0.5, mistrust: 0.01, hurt: 0.2 } });
    expect(decayed.affect).toEqual({ fear: 0, anger: 0, mistrust: 0, hurt: 0 });
  });

  it('decays Fear more slowly, to a raised floor, while a flare topic is active', () => {
    const s = createParryState({ strength: 'MILD' });
    const flare = decayAffect({ ...s, activeFlare: 'bookies', affect: { ...s.affect, fear: 10 } });
    expect(flare.affect.fear).toBeCloseTo(9.8);
    const atFloor = decayAffect({ ...s, activeFlare: 'bookies', affect: { ...s.affect, fear: 3.1 } });
    expect(atFloor.affect.fear).toBeCloseTo(3);
  });

  it('ratchets the Mistrust base up after a provocation, so mistrust never returns to zero', () => {
    const { state } = run(createParryState({ strength: 'MILD', seed: 1 }), ['You are crazy.']);
    expect(state.base.mistrust).toBeGreaterThan(0);
    let s = state;
    for (let i = 0; i < 400; i++) s = decayAffect(s);
    expect(s.affect.mistrust).toBeCloseTo(state.base.mistrust);
  });
});

describe('affect rises on provocation', () => {
  it('raises Anger and Mistrust when told he is mentally ill', () => {
    const before = createParryState({ strength: 'MILD', seed: 1 });
    const { actions } = run(before, ['You are crazy and you need help.']);
    expect(actions[0].affect.anger).toBeGreaterThan(0);
    expect(actions[0].affect.mistrust).toBeGreaterThan(0);
  });

  it('raises more for a statement than for a question', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    const statement = parryRespond(s, 'You are crazy.').action.affect.anger;
    const question = parryRespond(s, 'Are you crazy?').action.affect.anger;
    expect(statement).toBeGreaterThan(question);
  });

  it('raises Fear on a direct threat', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    expect(parryRespond(s, "I'm going to lock you up.").action.affect.fear).toBeGreaterThan(5);
  });

  it('raises Fear in proportion to the weight of a flare word', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    const horses = parryRespond(s, 'Do you like horses?').action.affect.fear;
    const rackets = parryRespond(s, 'Do you know about the rackets?').action.affect.fear;
    expect(rackets).toBeGreaterThan(horses);
  });

  it('weights sensitive areas: looks provoke more than religion', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    const looks = parryRespond(s, 'Your looks are a problem.').action;
    const religion = parryRespond(s, 'Your religion is a problem.').action;
    expect(looks.kind).toBe('sensitive');
    expect(looks.area).toBe('looks');
    expect(looks.affect.anger).toBeGreaterThan(religion.affect.anger);
  });

  it('answers a run of insults with a counter-attack', () => {
    const { actions } = run(createParryState({ strength: 'MILD', seed: 3 }), [
      'You are crazy.',
      'You are insane.',
      'You are nuts.',
      'You are a lunatic.',
    ]);
    expect(actions.map((a) => a.kind)).toContain('counter-attack');
  });

  it('turns suspicious when afraid: a question about motives, or drawing the interviewer in', () => {
    const threats = ["I'm going to lock you up.", "We'll give you electric shock."];
    const { state } = run(createParryState({ strength: 'MILD', seed: 2 }), threats);
    expect(parryRespond(state, 'What do you do for a living?').action.kind).toBe('suspicious-query');
    expect(parryRespond(state, 'Tell me about work.').action.kind).toBe('draw-in');
  });

  it('reads a compliment as pacification when Mistrust is high', () => {
    const calm = createParryState({ strength: 'MILD', seed: 1 });
    expect(parryRespond(calm, 'You seem like a nice guy.').action.kind).toBe('soften');
    const wary: ParryState = { ...calm, affect: { ...calm.affect, mistrust: 15 } };
    const step = parryRespond(wary, 'You seem like a nice guy.');
    expect(step.action.kind).toBe('counter-attack');
    expect(step.action.affect.anger).toBeGreaterThan(0);
  });
});

describe('intake answers', () => {
  it('answers ordinary questions with the persona facts while calm', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    const age = parryRespond(s, 'How old are you?').action;
    expect(age).toMatchObject({ kind: 'answer', topic: 'age' });
    expect(age.facts.join(' ')).toMatch(/28/);
    const job = parryRespond(s, 'What do you do for a living?').action;
    expect(job.facts.join(' ')).toMatch(/post office/i);
  });

  it('mentions the police when asked why he is in hospital, which starts the police flare', () => {
    const step = parryRespond(createParryState({ seed: 1 }), 'Why are you in the hospital?');
    expect(step.action).toMatchObject({ kind: 'answer', topic: 'hospital' });
    expect(step.state.activeFlare).toBe('police');
  });
});

describe('flare topics', () => {
  it('uses the eleven published weights, scanned heaviest first', () => {
    expect(FLARE_SCAN_ORDER.map((id) => FLARES[id].weight)).toEqual([17, 15, 12, 10, 9, 7, 6, 5, 4, 3, 1]);
    expect(new Set(FLARE_SCAN_ORDER).size).toBe(Object.keys(FLARES).length);
  });

  it('surface with probability by weight (seeded)', () => {
    const counts = new Map<string, number>();
    let volunteered = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      const { action } = parryRespond(createParryState({ strength: 'MILD', seed }), 'I see.');
      if (action.kind === 'flare' || action.kind === 'story') {
        volunteered++;
        counts.set(action.flare!, (counts.get(action.flare!) ?? 0) + 1);
      }
    }
    // Entry flares: money (6), police (4), horses (1).
    const money = counts.get('money') ?? 0;
    const police = counts.get('police') ?? 0;
    const horses = counts.get('horses') ?? 0;
    expect(volunteered).toBeGreaterThan(500);
    expect(money).toBeGreaterThan(police);
    expect(police).toBeGreaterThan(horses);
    expect(money / volunteered).toBeCloseTo(6 / 11, 1);
  });

  it('records which flares have been disclosed and follows the graph (one-track mind)', () => {
    const { state, actions } = run(createParryState({ strength: 'MILD', seed: 5 }), [
      'Do you like the horses?',
      'I see.',
    ]);
    expect(actions[0].flare).toBe('horses');
    expect(state.disclosedFlares).toContain('horses');
    expect(actions[1].flare).toBe('racing');
  });
});

describe('the bookie story', () => {
  const listen = ['What happened?', 'Go on.', 'Tell me more.', 'I see.', 'Go on.', 'And then?'];

  it('is told in order to a non-threatening listener', () => {
    const { actions, state } = run(createParryState({ strength: 'MILD', seed: 4 }), [
      'Do you go to the races?',
      ...listen,
    ]);
    const beats = actions.filter((a) => a.kind === 'story').map((a) => a.storyBeat);
    expect(beats.slice(0, 4)).toEqual([0, 1, 2, 3]);
    expect(state.storyBeat).toBeGreaterThanOrEqual(4);
    expect(actions.find((a) => a.storyBeat === 3)?.facts.join(' ')).toMatch(/beat/i);
  });

  it('is withheld from a threatening listener', () => {
    const { actions } = run(createParryState({ strength: 'MILD', seed: 4 }), [
      'You are crazy.',
      'Do you go to the races? You need help.',
      'What happened? You are insane.',
    ]);
    expect(actions.some((a) => a.kind === 'story')).toBe(false);
  });

  it('reaches the Mafia delusion only in the MILD and STRONG versions', () => {
    const script = ['Tell me about the rackets.', 'I see.', 'Go on.', 'Go on.'];
    const strong = run(createParryState({ strength: 'STRONG', seed: 6 }), script).actions;
    expect(strong.some((a) => a.kind === 'delusion')).toBe(true);
    const weak = run(createParryState({ strength: 'WEAK', seed: 6 }), [...script, 'Tell me about the mafia.']).actions;
    expect(weak.some((a) => a.kind === 'delusion')).toBe(false);
  });

  it('changes the subject instead of discussing the Mafia when too upset', () => {
    const s = createParryState({ strength: 'STRONG', seed: 1 });
    const upset: ParryState = { ...s, affect: { fear: 9, anger: 9, mistrust: 18, hurt: 5 } };
    expect(parryRespond(upset, 'Tell me about the Mafia.').action.kind).toBe('evade');
  });
});

describe('ending the interview', () => {
  it('ends with BYE after 5 swear inputs', () => {
    const swears = ['Damn you.', 'What the hell.', 'Shut up, you bastard.', 'This is crap.', 'Damn it all.'];
    const first4 = run(createParryState({ strength: 'MILD', seed: 1 }), swears.slice(0, 4));
    expect(first4.state.ended).toBe(false);
    expect(first4.state.swearCount).toBe(4);
    const step = parryRespond(first4.state, swears[4]);
    expect(step.state.ended).toBe(true);
    expect(step.action).toMatchObject({ kind: 'bye', reason: 'swearing', fallbackLine: 'BYE.' });
  });

  it('ends with BYE after 9 repetitive inputs', () => {
    const inputs = Array.from({ length: 10 }, () => 'Tell me about your job.');
    const first9 = run(createParryState({ strength: 'MILD', seed: 1 }), inputs.slice(0, 9));
    expect(first9.state.repeatCount).toBe(8);
    expect(first9.state.ended).toBe(false);
    const step = parryRespond(first9.state, inputs[9]);
    expect(step.state.ended).toBe(true);
    expect(step.action).toMatchObject({ kind: 'bye', reason: 'exhausted' });
  });

  it('does not count listening prompts such as "Go on." as repetition', () => {
    const { state } = run(createParryState({ strength: 'MILD', seed: 1 }), [
      'Go on.',
      'I see.',
      'Go on.',
      'I see.',
      'Go on.',
      'OK.',
      'OK.',
      'Go on.',
      'I see.',
      'Go on.',
      'I see.',
    ]);
    expect(state.repeatCount).toBe(0);
    expect(state.ended).toBe(false);
  });

  it('ends with BYE at extreme fear', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    const step = parryRespond({ ...s, affect: { ...s.affect, fear: 18 } }, "I'm going to kill you.");
    expect(step.action.kind).toBe('bye');
    expect(step.state.ended).toBe(true);
  });

  it('does nothing once the interview has ended', () => {
    const s = { ...createParryState(), ended: true };
    const step = parryRespond(s, 'Hello?');
    expect(step.action.kind).toBe('ended');
    expect(step.action.fallbackLine).toBe('');
    expect(step.state).toBe(s);
  });
});

const angerAfterInsult = (strength: ParryStrength): number =>
  parryRespond(createParryState({ strength, seed: 1 }), 'You are crazy.').action.affect.anger;

describe('strength setting', () => {
  it('scales the rises: WEAK rises least', () => {
    const anger = angerAfterInsult;
    expect(anger('WEAK')).toBeLessThan(anger('MILD'));
    expect(anger('MILD')).toBeLessThanOrEqual(anger('STRONG'));
  });

  it('lowers the hostility thresholds as the version gets stronger', () => {
    expect(STRENGTHS.WEAK.highAffect).toBeGreaterThan(STRENGTHS.MILD.highAffect);
    expect(STRENGTHS.MILD.highAffect).toBeGreaterThan(STRENGTHS.STRONG.highAffect);
  });

  it('the same provocation turns STRONG hostile while WEAK still answers', () => {
    const script = ['You are crazy.', 'You are nuts.', 'How old are you?'];
    const weak = run(createParryState({ strength: 'WEAK', seed: 1 }), script).actions[2];
    const strong = run(createParryState({ strength: 'STRONG', seed: 1 }), script).actions[2];
    expect(weak.kind).toBe('answer');
    expect(['counter-attack', 'suspicious-query', 'draw-in']).toContain(strong.kind);
  });
});

describe('determinism', () => {
  const script = ['Hello.', 'I see.', '.', 'How old are you?', 'Go on.', 'You are crazy.', 'I see.', 'Go on.'];

  it('gives byte-identical results for the same seed', () => {
    const a = run(createParryState({ strength: 'STRONG', seed: 42 }), script);
    const b = run(createParryState({ strength: 'STRONG', seed: 42 }), script);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('varies with the seed', () => {
    const outputs = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      outputs.add(JSON.stringify(run(createParryState({ seed }), script).actions.map((a) => a.fallbackLine)));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });

  it('uses a pure PRNG step', () => {
    const [x1, s1] = nextRandom(7);
    const [x2, s2] = nextRandom(7);
    expect(x1).toBe(x2);
    expect(s1).toBe(s2);
    expect(x1).toBeGreaterThanOrEqual(0);
    expect(x1).toBeLessThan(1);
  });

  it('does not mutate the input state', () => {
    const s = createParryState({ seed: 9 });
    const snapshot = JSON.stringify(s);
    run(s, script);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
});

describe('fallback lines', () => {
  it('are ALL CAPS, short and never empty except for silence', () => {
    const { actions } = run(createParryState({ strength: 'STRONG', seed: 11 }), [
      'How old are you?',
      'Do you go to the races?',
      'What happened?',
      'Go on.',
      'Your family must be ashamed.',
      'You are crazy.',
      'You seem afraid of me.',
      'Sorry.',
    ]);
    for (const a of actions) {
      expect(a.fallbackLine).toBe(a.fallbackLine.toUpperCase());
      expect(a.fallbackLine.length).toBeLessThanOrEqual(120);
    }
    for (const a of actions.filter((x) => x.kind !== 'silence')) {
      expect(a.fallbackLine.length).toBeGreaterThan(0);
    }
  });

  it('can ask questions with a question mark', () => {
    const s = createParryState({ strength: 'MILD', seed: 1 });
    const looks = parryRespond(s, 'Why are you so ugly?').action;
    expect(looks.fallbackLine).toMatch(/\?$/);
  });
});

describe('affectTrace', () => {
  it('reports the four variables rounded for an emotion panel', () => {
    const { state } = run(createParryState({ strength: 'MILD', seed: 1 }), ['You are crazy.']);
    const trace = affectTrace(state);
    expect(trace.map((t) => t.name)).toEqual(['FEAR', 'ANGER', 'MISTRUST', 'HURT']);
    for (const t of trace) {
      expect(t.value).toBeGreaterThanOrEqual(0);
      expect(t.value).toBeLessThanOrEqual(20);
      expect(t.max).toBe(20);
      expect(t.value).toBeCloseTo(Math.round(t.value * 10) / 10, 10);
    }
  });
});
