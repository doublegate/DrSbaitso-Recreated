# Third-party notices

## IBM VGA 9x16 web font

- File: `public/fonts/Web437_IBM_VGA_9x16.woff` (unmodified)
- From: The Ultimate Oldschool PC Font Pack v2.2 by VileR, <https://int10h.org/oldschool-pc-fonts/>
- License: Creative Commons Attribution-ShareAlike 4.0 International
  (full text in `public/fonts/LICENSE-oldschool-pc-font-pack.txt`)

The font keeps its own licence; the MIT licence of this project does not apply
to it.

## ELIZA DOCTOR script (1965) and HASH algorithm

- File: `src/engine/eliza/doctorScript1965.ts` holds the DOCTOR script `.TAPE. 100`
  by Joseph Weizenbaum (MIT), verbatim. It was printed in March 1965 after the
  MAD-SLIP ELIZA source and found in Weizenbaum's papers at MIT in 2021.
- From: Rupert Lane, eliza-ctss, `eliza/src/ELIZA/tape.100`,
  <https://github.com/rupertl/eliza-ctss> (commit `2d9ab10`).
- License: Creative Commons CC0 1.0 Universal (public domain dedication), granted
  by Weizenbaum's estate for the printout. <https://creativecommons.org/publicdomain/zero/1.0/>
- Credit, as a courtesy: Joseph Weizenbaum; Jeff Shrager and Myles Crowley
  (discovery); Anthony Hay, Arthur Schwarz and Rupert Lane (transcription and
  reconstruction).

`src/engine/eliza/hash.ts`, `match.ts` and `engine.ts` port behaviour from Anthony
Hay's C++ ELIZA, <https://github.com/anthay/ELIZA> (`src/eliza.cpp`), which is CC0 1.0.
This includes the SLIP `HASH` routine and its BCD encoding, the YMATCH-style matcher
and the input clean-up. Some of its test vectors are reused in `test/engine/eliza/`.

The **1966 CACM version** of the DOCTOR script (the appendix to Weizenbaum's
*Communications of the ACM* paper) is still under ACM copyright. It is **not**
included in this project.

## Dr. Sbaitso

Dr. Sbaitso was created by Creative Labs (1990-1992). This project is an
unofficial, independent recreation and contains none of the original program's
code, data or speech engine. Short quotations of the original's on-screen text
appear in `ref-docs/` for research purposes.
