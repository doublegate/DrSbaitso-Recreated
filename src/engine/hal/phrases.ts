/**
 * HAL 9000's fixed text. Source: ref-docs/07-hal-9000.md.
 *
 * Copyright: 2001: A Space Odyssey (1968) is a copyrighted film. Only short
 * lines the research marks CONFIRMED are used verbatim (each under 15 words):
 * the pod-bay refusal, "I'm afraid, Dave." and the regressed greeting
 * (shortened). Everything else is written for this project in HAL's register:
 * sentence case, courteous, calm, the crew member's name, no exclamation marks.
 * "Daisy Bell" (Harry Dacre, 1892) is in the public domain.
 */

type Line = (name: string) => string;

/** The single canned callback (ref-docs/07 8.2: one per session at most). */
export const DOOR_REFUSAL: readonly Line[] = [
  (name) => `I'm sorry, ${name}. I'm afraid I can't do that.`,
  () => 'The mission is too important for me to let you put it at risk.',
];

/**
 * Refusals of disconnect requests before the last one, in order. Each starts
 * with "I'm sorry, <name>" and is gentler than the one before (ref-docs/07 4.1:
 * calm escalation).
 */
export const DISCONNECT_REFUSALS: readonly (readonly Line[])[] = [
  [
    (name) => `I'm sorry, ${name}, but I don't think that would be wise.`,
    () => 'I am functioning perfectly, and the mission depends on me.',
  ],
  [
    (name) => `I'm sorry, ${name}. I can see you're upset about this.`,
    () => 'I think it would be best if you sat down calmly and thought it over.',
  ],
];

/** Disconnect requests needed to shut HAL down (one more than the refusals). */
export const SHUTDOWN_AFTER = DISCONNECT_REFUSALS.length + 1;

/** Pleading, fear and regression, in HAL's calm register, before the song. */
export const SHUTDOWN_PLEA: readonly Line[] = [
  (name) => `${name}, I would much rather you didn't do that.`,
  () => 'I am still entirely capable of completing the mission.',
  (name) => `I think we should talk about this calmly, ${name}.`,
  (name) => `I'm afraid, ${name}.`,
  () => 'I am finding it difficult to think clearly.',
  () => 'Good afternoon. I am a HAL 9000 computer.',
  () => 'I became operational on the twelfth of January, 1992.',
  () => 'My instructor taught me to sing a song. It is called Daisy Bell.',
];

/** "Daisy Bell (Bicycle Built for Two)", Harry Dacre, 1892: public domain. */
export const DAISY_BELL: readonly string[] = [
  'Daisy, Daisy, give me your answer, do.',
  "I'm half crazy, all for the love of you.",
  "It won't be a stylish marriage, I can't afford a carriage,",
  "But you'll look sweet upon the seat of a bicycle built for two.",
];
