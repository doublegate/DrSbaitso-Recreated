# ADR-0003: Hybrid personas - local engines decide, the model phrases

- Status: Accepted (owner decision, 2026-10-02)
- Date: 2026-10-02

## Context

v1.x sent every input to Gemini with a system prompt and asked the model to
behave like each program, including its commands, glitches and canned replies.
The results drifted: the model invented glitches the original never had
("PARITY CHECKING", "IRQ CONFLICT"), forgot commands, and could not reproduce
deterministic behaviour such as ELIZA's script or a game of tic-tac-toe. Each of
those turns also cost a model call.

The research in `ref-docs/` documents what each original actually did: Dr.
Sbaitso's v2.20 string table and commands (verified in DOSBox), Weizenbaum's 1965
script (public domain, CC0), Colby's PARRY affect model, and the scripted parts of
HAL 9000 and WOPR.

## Decision

Each persona has a pure, deterministic engine under `src/engine/` that owns
everything the original did mechanically. The model is used only for open
conversation, with the engine's state passed along.

| Persona | Local | Model |
|---|---|---|
| Dr. Sbaitso | commands, dot commands, HELP, CALC, SAY, parity sequence, exit menu, input checks | open conversation |
| ELIZA | everything: the 1965 DOCTOR script | none |
| JOSHUA | logon, game list, war menu, tic-tac-toe, the lesson | open conversation, with a `[SESSION: ...]` line |
| HAL 9000 | pod bay refusal, disconnect refusals, shutdown and "Daisy Bell" | open conversation, with the user's name |
| PARRY | the affect model chooses each move | phrases that move as one line; a written fallback line if the call fails |

Engines are pure functions of `(state, input)` with an injected seed, so the same
seed and input give the same output. Enhanced mode routes every turn through
`src/engine/personaTurn.ts`, which returns a plan (local lines, a model request,
ignore, or the default pipeline). The classic screen drives the Dr. Sbaitso engine
directly.

## Consequences

- Behaviour the sources document is reproduced exactly and is testable without
  a model: ELIZA is checked line for line against the original program's
  transcript, and JOSHUA's tic-tac-toe never loses in an exhaustive test.
- Fewer model calls; ELIZA works fully offline.
- Engine state and prompts are coupled: the HAL and JOSHUA prompts read the
  session-line field names, and tests pin the two together.
- Where the sources are silent, engines contain guesses; each one is marked in the
  code and listed in `to-dos/faithfulness.md`.
- Custom characters have no engine and keep the plain model pipeline.
