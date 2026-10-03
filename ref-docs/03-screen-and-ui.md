# 03 - Screen and UI Fidelity (Dr. Sbaitso, MS-DOS, Creative Labs)

Research date: 2026-10-02. Scope: visual presentation and on-screen session flow only.
Conversation logic/commands and audio are covered by sibling documents.

Confidence markers:

- **CONFIRMED** - observed directly in an original-program screenshot (pixel-sampled) or in the
  strings of the original executable.
- **LIKELY** - strongly implied by primary evidence, but not observed end to end.
- **UNVERIFIED** - plausible or reported second-hand; needs a live run to confirm.
- **CONFIRMED (DOSBox)** - observed in a frame-accurate capture of the original v2.20 running
  in DOSBox-X; method and evidence in `04-dosbox-verification.md`, cited as [04].

Primary evidence used:

- Nine DOSBox screenshots of v2.20 published on the Internet Archive "VGA Machine" item [3],
  plus the "Hercules Machine" [4], "No Voice" [5] and 1992 [2] items. All were downloaded and
  pixel-sampled (exact RGB values, cell positions) for this document.
- Printable strings extracted from `SBAITSO2.EXE` v2.20 (archive [3]) and v2.10 (archive [6]).
  This is read-only static inspection; the program was not executed.

---

## Summary

1. The program runs in **standard 80x25 color text mode** on a **blue background (#0000AA)**.
   Nearly all text is **bright white (#FFFFFF)**. Accents are **yellow (#FFFF55)** for the title
   and the input prompt and **light green (#55FF55)** for the copyright line. CONFIRMED [3].
2. The top five rows hold a fixed **banner box** drawn with CP437 box characters: a double outer
   frame with a single-line divider. Row 1 reads `Sound Blaster`, `D R   S B A I T S O` and
   `version 2.20`. Row 3 is the copyright line. CONFIRMED [3][2].
3. The name prompt is **mixed case**, left-aligned on row 6: `Please enter your name ...`.
   It is not centered and has no `>` and no placeholder. CONFIRMED [3].
4. The greeting is printed **one line at a time**, each line indented by one space, with blank
   lines in fixed places. CONFIRMED (layout) [3]. Each line appears whole in a single frame
   and is spoken before the next one is printed: CONFIRMED (DOSBox), see
   `04-dosbox-verification.md`.
5. User input follows a **yellow `>`** in column 0, preceded by a blank line, with a **blinking
   one-scanline underline cursor** in white. CONFIRMED [3][5]. The typed input is yellow too,
   for the whole line: CONFIRMED (DOSBox) [04].
6. The program has **`.COLOR c`** (background 0-7) and **`.WIDTH 40|80`** dot commands, and a
   compact 40-column banner variant. Exiting goes through a
   `<C>ontinue  <N>ew patient  <Q>uit` prompt. CONFIRMED (strings) [3].
7. The current web UI differs from the original in color, font, layout, banner, name screen,
   greeting format, cursor and chrome. Details are in the Gaps section.

---

## Display mode and palette

### Mode

| Property | Finding | Status | Source |
|---|---|---|---|
| Text mode | 80 columns x 25 rows. DOSBox capture is 640x400 = 80x25 cells of 8x16. Rows 0-4 are the banner, row 6 is the name prompt, dialogue starts on row 7. | CONFIRMED | [3] (pixel measurement) |
| Real-VGA geometry | On real VGA hardware, 80x25 is 720x400 with a 9x16 cell. CP437 0xC0-0xDF repeat column 8 into column 9, so box lines stay continuous. DOSBox screenshots use 8-pixel cells. | CONFIRMED (hardware) | [12] |
| Hercules variant | Monochrome adapter: 640x350, white on black, with the same banner and layout. | CONFIRMED | [4] |
| 40-column mode | `.WIDTH  40 or 80 - set to 40 column screen or 80 column screen`, with a compact banner (`DR S B A I T S O`, `(c)Copyright Creative Labs,Inc.1992`). `.WIDTH 40` clears the screen and draws a two-line double-width banner with the same colors. | CONFIRMED (strings); appearance CONFIRMED (DOSBox) | [3][04] |
| Background change | `.COLOR c` sets the background color number, 0-7. The error message reads `Color number must be between 0 - 7`. | CONFIRMED (strings) | [3] |

### Colors actually used (pixel-sampled from the v2.20 VGA screenshots)

| Element | DOS attribute (fg/bg) | Hex | Status | Source |
|---|---|---|---|---|
| Screen background | 1 Blue | `#0000AA` | CONFIRMED | [3][2][5] |
| Banner frame (double/single lines) | 15 White | `#FFFFFF` | CONFIRMED | [3] |
| `Sound Blaster`, `version 2.20` | 15 White | `#FFFFFF` | CONFIRMED | [3] |
| `D R   S B A I T S O` title | 14 Yellow | `#FFFF55` | CONFIRMED | [3] |
| `(c) Copyright Creative Labs, Inc. 1992,` | 10 Light Green | `#55FF55` | CONFIRMED | [3] |
| `all rights reserved` | 15 White | `#FFFFFF` | CONFIRMED | [3] |
| `Please enter your name ...` | 15 White | `#FFFFFF` | CONFIRMED | [3] |
| Doctor's lines | 15 White | `#FFFFFF` | CONFIRMED | [3] |
| Input prompt `>` | 14 Yellow | `#FFFF55` | CONFIRMED | [3] |
| Cursor | 15 White (the cell's fg) | `#FFFFFF` | CONFIRMED | [3] |
| User's typed text (conversation) | 14 Yellow, the whole `>text` line | `#FFFF55` | CONFIRMED (DOSBox) | [04] |
| Name typed at the name prompt | 15 White, case kept as typed | `#FFFFFF` | CONFIRMED (DOSBox) | [04] |
| `.PROMPT ON` labels | `User> ` + input yellow; `Computer: ` + reply white | - | CONFIRMED (DOSBox) | [04] |

The only colors that appear in any of the VGA frames are #0000AA, #FFFFFF, #55FF55 and #FFFF55.
No light gray (#AAAAAA) is used.

### Full 16-color CGA/EGA/VGA text palette (for `.COLOR` and themes)

| # | Name | Hex | # | Name | Hex |
|---|---|---|---|---|---|
| 0 | Black | `#000000` | 8 | Dark Gray | `#555555` |
| 1 | Blue | `#0000AA` | 9 | Light Blue | `#5555FF` |
| 2 | Green | `#00AA00` | 10 | Light Green | `#55FF55` |
| 3 | Cyan | `#00AAAA` | 11 | Light Cyan | `#55FFFF` |
| 4 | Red | `#AA0000` | 12 | Light Red | `#FF5555` |
| 5 | Magenta | `#AA00AA` | 13 | Light Magenta | `#FF55FF` |
| 6 | Brown | `#AA5500` | 14 | Yellow | `#FFFF55` |
| 7 | Light Gray | `#AAAAAA` | 15 | White | `#FFFFFF` |

Source: [11]. `.COLOR` accepts only 0-7, the background-capable colors. CONFIRMED [3].

### Banner box (exact characters)

The bytes in `SBAITSO2.EXE` decode as CP437: 0xC9 `╔`, 0xCD `═`, 0xBB `╗`, 0xBA `║`, 0xC7 `╟`,
0xC4 `─`, 0xB6 `╢`, 0xC8 `╚` and 0xBC `╝`. CONFIRMED [3]. Pixel measurement puts the box at
columns 1-78 and rows 0-4, with the single-line divider on row 2. Reconstructed layout
(80 columns, column 0 blank):

```
 ╔════════════════════════════════════════════════════════════════════════════╗
 ║ Sound Blaster                D R   S B A I T S O               version 2.20 ║
 ╟────────────────────────────────────────────────────────────────────────────╢
 ║                (c) Copyright Creative Labs, Inc. 1992, all rights reserved ║
 ╚════════════════════════════════════════════════════════════════════════════╝

Please enter your name ...
```

Measured column positions: `Sound Blaster` starts at column 3, the title at column 30,
`version 2.20` at column 65, and the copyright at column 18 (right-aligned to column 77).
CONFIRMED [3]. Column counts in the sketch above are approximate; use the measured positions.

---

## Fonts

| Option | Use | License | Status | Source |
|---|---|---|---|---|
| **Web437 IBM VGA 9x16** (`Web437_IBM_VGA_9x16.woff`) | Matches real VGA hardware (720x400). Best fidelity to what a 1991 user saw. | CC BY-SA 4.0, credit "VileR" with a link to int10h.org | CONFIRMED | [8][9][10] |
| **Web437 IBM VGA 8x16** (`Web437_IBM_VGA_8x16.woff`) | Pixel-identical to the DOSBox screenshots (640x400). Easier 80-column math. | CC BY-SA 4.0 | CONFIRMED | [8][9] |
| Px437 variants (`.ttf`) | Same glyphs as outline TTF. The `Px` prefix means pixel-outline; `437` means the CP437 charset. | CC BY-SA 4.0 | CONFIRMED | [8][9] |

- Current release: **Ultimate Oldschool PC Font Pack v2.2** (2020-11-21). The web-only package
  is `oldschool_pc_font_pack_v2.2_web.zip` (4.78 MB, WOFF) from
  https://int10h.org/oldschool-pc-fonts/download/ . CONFIRMED [8][9]
- Render only at the native height or an integer multiple of it: 16px, 32px or 48px. The font
  only looks good at those sizes [9]. CONFIRMED
- Attribution is required. Add a line such as "IBM VGA font: The Ultimate Oldschool PC Font
  Pack by VileR (int10h.org), CC BY-SA 4.0" to the README/credits, and ship the font's license
  text with it. The project's own code license is unaffected; a share-alike obligation applies
  only to modifications of the font itself. CONFIRMED [9]
- A previous recreation used the IBM VGA 9x16 font in an 80x25 terminal. LIKELY [13]

---

## Startup and session flow on screen

| Step | What appears | Status | Source |
|---|---|---|---|
| 0 | Launched by `SBAITSO2.BAT`, which loads the `SBTALKER` TSR, then runs `SBAITSO2`, then `REMOVE`. There is no splash or logo screen beyond the banner. The banner is drawn at once; with only the banner showing, the program says "Doctor Sbaitso" and then "by Creative Labs". | CONFIRMED (bat); no splash and startup speech CONFIRMED (DOSBox) | [3][04] |
| 1 | The screen clears to blue and the 5-row banner is drawn. Frame captured with only the banner showing. | CONFIRMED | [2] |
| 2 | Row 6, column 0: `Please enter your name ...` in white, printed after the startup speech and then spoken. The name is typed inline from column 26, directly after the ellipsis, in white. No cursor is shown during name entry. | prompt CONFIRMED; inline position CONFIRMED (DOSBox) | [3][5][04] |
| 2a | The name is validated with on-screen messages `(name too long)` / `NAME TOO LONG` and `Enter alphabets only`. | CONFIRMED (strings) | [3] |
| 2b | Each letter typed in the name is echoed, then spoken individually (about 0.2 s per letter). | CONFIRMED (DOSBox) | [13][04] |
| 2c | Without SBTALKER, `SBTALKER - text to speech synthesizer Not installed.` is printed. In the No-Voice frame it is partly overwritten by the name prompt. | CONFIRMED | [5][3] |
| 3 | The greeting appears line by line below the prompt. Exact layout (rows 7-14, column 1; `·` marks the indent space):<br>`·HELLO <NAME>,  MY NAME IS DOCTOR SBAITSO.`<br>(blank)<br>`·I AM HERE TO HELP YOU.`<br>`·SAY WHATEVER IS IN YOUR MIND FREELY,`<br>`·OUR CONVERSATION WILL BE KEPT IN STRICT CONFIDENCE.`<br>`·MEMORY CONTENTS WILL BE WIPED OFF AFTER YOU LEAVE,`<br>(blank)<br>`·SO, TELL ME ABOUT YOUR PROBLEMS.` | CONFIRMED | [3] |
| 3a | Successive screenshots add one whole sentence per frame (00 to 06). Each line appears whole in one video frame. Its speech starts about 0.1 s later, and the next line is printed about 0.1 s after that speech ends. There is no per-character reveal. A keypress cuts the speech short; the remaining lines then print unspoken. | per-line CONFIRMED; whole-line reveal CONFIRMED (DOSBox) | [3][04] |
| 3b | Note the **two spaces after the comma** in `HELLO <NAME>,  MY NAME`. The literal strings are `" HELLO "` and `",  MY NAME IS DOCTOR SBAITSO."`. The MEMORY line ends with a comma, not a period. | CONFIRMED | [3] |
| 4 | Blank line, then `>` in yellow at column 0 with the white underline cursor right after it (row 16). | CONFIRMED | [3] |
| 5 | Ongoing dialogue continues downward in the same white-on-blue style. Doctor replies are uppercase. Each turn is: the yellow `>text` line, the reply on the next row at column 0 (no indent), a blank row, then the next `>`. Exceptions: no blank row after an age question; `R` prints nothing and the new `>` follows directly. | uppercase CONFIRMED [3][7]; spacing CONFIRMED (DOSBox) | [3][7][04] |
| 6 | Scrolling: the banner stays pinned. Only rows 5-23 scroll, and row 24 is never written. HELP page 1 is the only screen that removes the banner. | CONFIRMED (DOSBox) | [04] |
| 7 | Optional speaker labels: `.PROMPT ON` turns the prompt into yellow `User> ` and prefixes replies with white `Computer: `. `.PROMPT OFF` prints an empty `Computer:` line and goes back to `>`. | strings CONFIRMED; look CONFIRMED (DOSBox) | [3][04] |
| 8 | HELP text is mixed case. It begins `Dot Commands are preceeded with a dot on the first column` (original spelling), and pages via `Hit <M> now for More HELPs`. In 40 columns: `NO HELP FOR 40 COLUMNS. TRY:  .WIDTH 80`. | CONFIRMED (strings) | [3] |
| 9 | Exit: a goodbye line (`GOOD BYE, SO LONG!` for BYE, `GOOD BYE <NAME>` for `.QUIT`) is printed and spoken. On the very next row (no blank row), the white menu `<C>ontinue  <N>ew patient  <Q>uit  .....` appears at column 0, with no cursor. C: one blank row, then `>`. N: rows 5-24 are cleared and the name prompt is shown again on row 6. Q: exits to DOS with rows 5-24 cleared to black; the banner stays on screen. | CONFIRMED (strings); position and keys CONFIRMED (DOSBox) | [3][04] |

---

## Visual effects and glitches

| Effect | Finding | Status | Source |
|---|---|---|---|
| Speaking indicator | No graphic or icon. The line is on screen, and neither the `>` prompt nor the cursor shows until the speech ends. The prompt appears within about 0.1 s of the end of the speech. | CONFIRMED (DOSBox) | [3][04] |
| Cursor | Hardware text cursor: a 1-scanline underline on scanline 14 (0-based) of the 16-line cell, white, blinking. It is shown only while waiting at `>`; it is hidden during name entry, while the doctor speaks, and at the C/N/Q menu. | CONFIRMED (DOSBox) | [3][5][04] |
| Cursor blink rate | Measured in DOSBox-X: 8 frames on / 8 frames off at 70.086 Hz = **114 ms on / 114 ms off** (228 ms period). The earlier figure (229 ms per phase, from FreeVGA quoted via search) was a full cycle, not a phase. Real hardware was not measured. | CONFIRMED (DOSBox) | [14][12][04] |
| Parity glitch text | On-screen strings: `PARITY ERR ... `, `PARITY ERR ... RECOVERED`, `PHEW!   THAT WAS CLOSE!`, `YOU ARE BAD`, `DON'T TRY IT NEXT TIME.`. In-reply variants include `PARITY WARNING....` and `1 + 1 = 3 ~, PARITY .. CHECKSUM ERR? ..`, which carry garbage characters such as `SHZSHI!${~?` and `FZA!$[{?`. | CONFIRMED (strings) | [3] |
| Parity colors/clear | There is no color change, screen clear or blinking. The region below the (pinned) banner floods with white `PARITY ERR ...  <random number>` lines: about 250 lines in about 3.5 s, the later ones ending in `  ???`. Then `PARITY ERR ... RECOVERED`, a literal `PARITY` line, a blank row and `>`. About 4 s of falling tone plays throughout. `PHEW!` / `YOU ARE BAD` were not shown. Seen with both `SAY PARITY` and repeated profanity. | CONFIRMED (DOSBox) | [1][04] |
| `PARITY CHECKING` / `IRQ CONFLICT` | Neither string appears in v2.10 or v2.20 `SBAITSO2.EXE`. | CONFIRMED absent | [3][6] |
| ASCII art / logo | None beyond the box-drawn banner (and the HELP page title's double underline). | CONFIRMED (DOSBox) | [2][3][04] |

---

## Version differences

| Version | Banner text | Notes | Status | Source |
|---|---|---|---|---|
| 2.10 | `version 2.10`, `(c) Copyright Creative Labs, Inc. 1990,` | EXE dated 1991-07-27. Otherwise the same UI strings. | CONFIRMED | [6] |
| 2.20 | `version 2.20`, `(c) Copyright Creative Labs, Inc. 1992,` | The version every archive.org screenshot shows. | CONFIRMED | [3][2] |
| Hercules | same as 2.20 | Monochrome white on black, 640x350. | CONFIRMED | [4] |
| No voice (Tandy) | same as 2.20 | Same colors. Prints the SBTALKER-not-installed notice. | CONFIRMED | [5] |
| Windows "Prody Parrot" successor | - | A separate GUI program, out of scope. | CONFIRMED | [1] |

Recommendation: reproduce **v2.20 on VGA** as the default and offer Hercules (white on black) as
an optional theme.

---

## Gaps vs. current implementation (actionable)

Each gap lists the files involved, followed by the fix.

1. **Background color is wrong.**
   - Files: `App.tsx` (`bg-blue-800` hard-coded on both screens, around lines 476 and 523),
     `constants.ts` `dos-blue.background: '#1e3a8a'`, `index.css` `--color-background: #1e3a8a`
     and the scrollbar colors.
   - Fix: use `#0000AA`. Drive the background from `var(--color-background)` rather than a
     Tailwind class, so themes actually apply.
2. **Font is Courier New** (`index.css` body `font-family`).
   - Fix: self-host `Web437_IBM_VGA_9x16.woff` (or 8x16) with `@font-face`. Set
     `font-size: 16px; line-height: 16px` (or 32/32 when scaled up), `font-smooth: never`,
     `-webkit-font-smoothing: none` and `letter-spacing: 0`.
   - The accessibility font-size presets (12/16/20px) would break pixel alignment. Map them to
     integer multiples (16/32/48) for the IBM font.
3. **No banner box.** The original's top rows are the `╔═╗ / ║ Sound Blaster  D R   S B A I T S O
   version 2.20 ║ / ╟─╢ / copyright / ╚═╝` box.
   - The current header row in `App.tsx` holds `AUDIO MODE:` controls and emoji buttons under a
     `border-b-2 border-gray-400`.
   - Fix: render the banner as literal CP437 text in a `<pre>`, with the title in #FFFF55 and the
     copyright in #55FF55. Move app controls off-screen: a keyboard-summoned overlay, or a
     toggleable status line in an optional "enhanced" mode.
4. **Name screen is not faithful.**
   - `App.tsx` (lines 476-516) centers `PLEASE ENTER YOUR NAME:` in caps, adds a yellow `>`,
     a placeholder `TYPE NAME AND PRESS ENTER` and a pulsing `PREPARING SESSION...`.
   - Fix: show the banner, then on row 6, column 0, the mixed-case `Please enter your name ...`
     in white, with an inline input on the same line after the ellipsis. Remove the placeholder
     and the centering. Drop or minimize the "PREPARING" text; the original shows nothing while
     waiting. Optionally show `Enter alphabets only` / `NAME TOO LONG` validation in place.
5. **Greeting format differs** (`App.tsx` `handleNameSubmit`, around lines 233-241).
   - Missing: the one-space indent, the blank line after the HELLO line, and the two spaces in
     `<NAME>,  MY NAME`.
   - The MEMORY line should end with `,`, not `.`.
   - Correct sequence: `HELLO`, blank, four lines, blank, `SO, TELL ME ABOUT YOUR PROBLEMS.`
6. **Greeting is not anchored to the prompt line.** In the original it prints directly under
   `Please enter your name ...` on the same screen. The current app switches to a different
   screen layout. Fix: keep one continuous 80x25 "screen" component for the whole session.
7. **Chat frame and chrome are not original.**
   - Remove the `border-2 border-gray-400` frame and the `max-w-4xl` centering.
   - Remove the footer hint `... | Ctrl+Shift+V to cycle | Ctrl+A for accessibility`.
   - Remove the input placeholders `TYPE HERE AND PRESS ENTER...`.
   - Remove the emoji buttons (`📝` and others); emojis did not exist in CP437 DOS.
   - Remove floating widgets (music player, emotion visualizer, topic diagram, voice indicator)
     from the authentic view, or hide them behind an "enhanced mode" toggle.
8. **Prompt and user colors.**
   - `text-yellow-300` (Tailwind ~#FDE047) is not a DOS color; the `>` should be exactly
     `#FFFF55`.
   - The user's echoed text is rendered yellow. That is faithful: the original prints the
     whole `>text` line in #FFFF55. The name typed at the name prompt is white. CONFIRMED
     (DOSBox) [04].
   - Add a blank line before each `>` prompt, as in frame 08. Put doctor replies at column 0;
     only the greeting lines are indented [04].
9. **Cursor.**
   - The browser caret and the `animate-pulse` `_` (a smooth fade) are wrong.
   - Fix: hide the native caret (`caret-color: transparent`) and draw a 1-scanline-high white
     bar at the bottom of the cell (scanline 14 of 16). Blink it hard on/off with
     `animation: blink 228ms steps(1) infinite` (about 114 ms per phase, measured in DOSBox-X
     [04]). Hide it while the doctor is speaking.
10. **Text reveal speed.**
    - `TYPING_DELAY_MS = 40` per character with a smooth typewriter is not attested.
    - Whole lines appear in step with speech, not as a typewriter. CONFIRMED (DOSBox) [04].
    - Recommended default: print each line or sentence instantly, then speak it; print the next
      after the audio ends. Keep per-character reveal as an option.
    - Per-character echo of user typing is native DOS behavior and is fine.
11. **Glitch strings.** `GLITCH_PHRASES = ['PARITY CHECKING', 'IRQ CONFLICT']` (`App.tsx`
    line 46) are not in the original binary. Use the original `PARITY ERR ... ` and
    `PARITY ERR ... RECOVERED` / `PHEW!   THAT WAS CLOSE!` sequence (coordinate with the
    conversation-logic document).
12. **Exit flow missing.** The original ends with `GOOD BYE ...` and
    `<C>ontinue  <N>ew patient  <Q>uit  .....`. No equivalent exists in `App.tsx`. Add it as
    on-screen text driven by C, N or Q keypresses.
13. **Themes.**
    - `THEMES` (constants.ts) use Tailwind-ish hex values.
    - Fix: make `dos-blue` use exactly #0000AA / #FFFFFF / #FFFF55 / #55FF55. Add a
      `hercules` theme (#000000 / #FFFFFF).
    - Optionally expose `.COLOR 0-7` with the 8 low palette entries as a faithful theme
      mechanism.
14. **Layout grid.**
    - The screen should be a fixed 80x25 grid: `width: 80ch` (640px at 8x16, 720px at 9x16),
      `height: 25 * 16px`, integer-scaled to fit the viewport.
    - Letterbox it with black outside (VGA overscan default) instead of a fluid flex layout.
    - Wrap at 80 columns. Optionally offer `.WIDTH 40` (double-width glyphs via the `-2x`
      font variants [9]).
15. **Font licensing housekeeping.** When adding the font, add the CC BY-SA 4.0 attribution to
    README/credits and include the license file next to the `.woff`.

### Minimal CSS sketch

```css
@font-face {
  font-family: 'IBM VGA';
  src: url('/fonts/Web437_IBM_VGA_9x16.woff') format('woff');
  font-display: block;
}
:root { --dos-bg:#0000AA; --dos-fg:#FFFFFF; --dos-yellow:#FFFF55; --dos-green:#55FF55; }
html, body { background:#000; }                 /* overscan */
.dos-screen {
  font: 16px/16px 'IBM VGA', monospace;           /* integer multiples only */
  width: 80ch; height: 400px;                     /* 25 rows x 16px */
  background: var(--dos-bg); color: var(--dos-fg);
  white-space: pre; overflow: hidden;
  -webkit-font-smoothing: none; font-smooth: never;
  image-rendering: pixelated;
  transform-origin: top center;                   /* scale by an integer factor in JS */
}
.dos-title { color: var(--dos-yellow); }
.dos-copy  { color: var(--dos-green); }
.dos-prompt::before { content: '>'; color: var(--dos-yellow); }
.dos-cursor { display:inline-block; width:1ch; height:16px;
  background: linear-gradient(transparent 14px, currentColor 14px 15px, transparent 15px);
  animation: dos-blink 228ms steps(1) infinite; }  /* 114 ms on / 114 ms off [04] */
@keyframes dos-blink { 50% { visibility: hidden; } }
```

---

## Sources

1. Wikipedia, "Dr. Sbaitso" - https://en.wikipedia.org/wiki/Dr._Sbaitso
2. Internet Archive, "Dr Sbaitso (1992)" (screenshot `Dr_Sbaitso_1992_screenshot.png`) - https://archive.org/details/msdos_Dr_Sbaitso_1992
3. Internet Archive, "MS-DOS: Dr. Sbaitso (VGA Machine)" (screenshots `screenshot_00..08.png`, `SBAITSO.zip` containing v2.20 `SBAITSO2.EXE` / `SBAITSO2.BAT`) - https://archive.org/details/SBAITSO_VGA
4. Internet Archive, "MS-DOS: Dr. Sbaitso (Hercules Machine)" - https://archive.org/details/SBAITSO_HERC
5. Internet Archive, "MS-DOS: Dr. Sbaitso (No Voice)" - https://archive.org/details/SBAITSO_TDY
6. Internet Archive, "Dr. Sbaitso 2.10 (MS-DOS)" (`sbaitso.zip`, v2.10 `SBAITSO2.EXE`) - https://archive.org/details/sbaitso
7. Bits and Bytes, "Blast into the past: Dr. Sbaitso" (2024) - https://bitscolumn.blogspot.com/2024/05/blast-into-past-dr-sbaitso.html
8. VileR, The Ultimate Oldschool PC Font Pack - Download (v2.2, CC BY-SA 4.0) - https://int10h.org/oldschool-pc-fonts/download/
9. VileR, The Ultimate Oldschool PC Font Pack - FAQ/ReadMe (license, naming, sizing) - https://int10h.org/oldschool-pc-fonts/readme/
10. VileR, The Ultimate Oldschool PC Font Pack - Home - https://int10h.org/oldschool-pc-fonts/
11. Wikipedia, "Color Graphics Adapter" (RGBI 16-color palette) - https://en.wikipedia.org/wiki/Color_Graphics_Adapter
12. Wikipedia, "VGA text mode" (80x25, 720x400, 9x16 cell, line-graphics 9th column, fixed blink) - https://en.wikipedia.org/wiki/VGA_text_mode
13. bert.org, "ChatGPT in DR SBAITSO" (2023; 80x25 IBM VGA 9x16 recreation; name letters spoken) - https://bert.org/2023/01/06/chatgpt-in-dr-sbaitso/
14. FreeVGA, "Manipulating the Text-mode Cursor" (blink every 16 frames; page TLS certificate expired, content seen via search index) - http://www.osdever.net/FreeVGA/vga/textcur.htm
15. deckarep, DrSbaitsoUi (Zig/Raylib recreation; notes the original was a Turbo C DOS program) - https://github.com/deckarep/DrSbaitsoUi

[04] `04-dosbox-verification.md` - the original v2.20 run inside DOSBox-X 2026.08.31, with
frame-exact OCR and audio timing (2026-10-02).

### Open items for a live run

This has since been done. The original v2.20 was run inside DOSBox-X (only there), and the
results are in `04-dosbox-verification.md` (referenced above as [04]). It settled all of these
points: the color of the user's typed text, per-character versus per-line reveal, the pinned
banner and scrolling, the parity glitch on screen, the exit menu, and the look of `.PROMPT ON`
and `.WIDTH 40`. 04 lists what remains open.
