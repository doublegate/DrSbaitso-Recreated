# Salvage manifest

Files rescued from the volatile `/tmp` into this repository (tmp-salvage). `/tmp` is a tmpfs
here, and systemd-tmpfiles also deletes untouched files after 10 days.

## 2026-10-04: voice measurement scripts

Source: this project's Claude Code session scratchpad
(`/tmp/claude-1000/<project-slug>/<session>/scratchpad/`). The dry run found 313 strong
candidates; 7 were salvaged. The source hash is of the original file. Each copy gains a
docstring, and the engine path is now read from `SMOOTHTALKER_DIR`; the logic is unchanged.

| Source | Destination | Source SHA-256 (16) |
|---|---|---|
| `<session scratchpad>/an.py` | `scripts/research/voice/an.py` | `f664d79a59137330` |
| `<session scratchpad>/bands.py` | `scripts/research/voice/bands.py` | `54712f44f53a77a8` |
| `<session scratchpad>/contour.py` | `scripts/research/voice/contour.py` | `d6a612315f6fd447` |
| `<session scratchpad>/dtw.py` | `scripts/research/voice/dtw.py` | `dfbe8a920850c27f` |
| `<session scratchpad>/eq.py` | `scripts/research/voice/eq.py` | `f011706d6071b983` |
| `<session scratchpad>/dsplog.py` | `scripts/research/voice/dsplog.py` | `dab4e72b8c76399d` |
| `<session scratchpad>/sweep.py` | `scripts/research/voice/sweep.py` | `15a5aa721d23bcec` |

Deliberately not salvaged:

- **Original Creative Labs program material:** the SBAITSO, SBTALKER and SBTEST files, the disk
  image, the `.strings` dumps and the DOSBox captures. ADR-0006 says the original material is
  for research only and never committed.
- **Third-party documents:** the research PDFs and their text dumps (Colby 1971, the AIM
  memos, Weizenbaum's papers), the ELIZA articles and sources from the anthay/ELIZA and
  rupertl/eliza-ctss repositories, and the font archive. They are copyrighted and
  re-downloadable; the font is already bundled with its licence.
- **Regenerable output:** logs, gate outputs, screenshots, TTS WAV renders, review JSON dumps,
  `dist/` builds, pre-edit file snapshots (their history is in git), and one-off edit scripts
  that were already applied.
- **A copy of the old 1.x production bundle that held the leaked, since-rotated API key.** It
  was deleted from the scratchpad, not salvaged.
