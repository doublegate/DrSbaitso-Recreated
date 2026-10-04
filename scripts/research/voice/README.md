# Voice measurement scripts

These scripts measured the original Dr. Sbaitso voice for the findings in
[ref-docs/02-voice-and-audio.md](../../../ref-docs/02-voice-and-audio.md), which set the
vintage chain in `src/utils/vintageAudioProcessing.ts` and the pronunciation rules applied
before TTS. They are research tools, not part of the app, the build or the test suite. They
were salvaged from the v2.0 research scratch so the measurements can be reproduced.

| Script | What it measures |
|---|---|
| `an.py` | F0 (median, p10, p90), spectral-band shares, centroid and RMS of 8-bit WAV captures |
| `contour.py` | Frame-by-frame pitch contour, voicing strength and pause lengths of a capture |
| `bands.py` | Engine output level per frequency band for both tone settings, plus 8-bit code usage |
| `sweep.py` | Duration, median F0, centroid and level across the engine's pitch, speed, tone, volume and gender settings |
| `dsplog.py` | Sound Blaster DSP commands and DMA block sizes issued while speaking (confirms 8475 Hz) |
| `eq.py` | Which spellings the engine renders byte-identically (abbreviations, numbers, initialisms) |
| `dtw.py` | Which respelling sounds closest to a reference word (DTW over cepstral features) |

## Requirements

- Python 3.10+ with `numpy` and `scipy`.
- For `bands`, `sweep`, `dsplog`, `eq` and `dtw`: a local clone of
  <https://github.com/joshknnd1982/smoothTalker-sbaitso> (an emulation of the SmoothTalker 3.5
  engine), pointed to by `SMOOTHTALKER_DIR` (default `./st`). This project does not
  redistribute that repository or its `engine.bin`; check its own licence and NOTICE before
  using it.
- For `an` and `contour`: 8-bit unsigned WAV recordings of the original program. They were made
  in DOSBox with your own copy. **Captures of the original are not committed.** They are
  recordings of Creative Labs' software, so they follow the rule ADR-0006 sets for the original
  binaries: research use only. The `.gitignore` keeps WAVs here out of git.

```bash
python3 -m venv .venv && .venv/bin/pip install numpy scipy
git clone https://github.com/joshknnd1982/smoothTalker-sbaitso /path/to/st
SMOOTHTALKER_DIR=/path/to/st .venv/bin/python scripts/research/voice/sweep.py
.venv/bin/python scripts/research/voice/an.py /path/to/capture.wav
```
