# App Icons

The icons use the original program's own look: the v2.20 screen's DOS blue, a
double-line frame like its banner box, yellow title text in the IBM VGA 9x16 font
(the font the app bundles), and the `>` prompt with an underline cursor.

| File | Purpose | Content |
|---|---|---|
| `public/icons/icon-<n>x<n>.png` (72-512) | `any` | Framed title: SOUND BLASTER / DR / SBAITSO / `>_` |
| `public/icons/icon-maskable-192x192.png`, `-512x512.png` | `maskable` | The same text without the frame, scaled into the central safe zone on a full-bleed background |
| `public/icons/icon-16x16.png`, `-32x32.png`, `public/favicon.ico` | favicon | A yellow `S` in a white frame (16, 32 and 48 px in the ICO) |
| `public/icons/icon-base.svg` | reference | The `any` artwork as SVG |

Colours are the original palette (`ref-docs/03-screen-and-ui.md`): background
`#0000AA`, text `#FFFFFF`, title and prompt `#FFFF55`.

## Regenerating

```bash
node scripts/generate-icons.mjs
```

The script renders each icon in Chromium (Playwright, already a dev dependency)
with the bundled font embedded, so the output does not depend on fonts installed
on the machine. Edit the SVG templates in the script, not the PNGs.

`public/manifest.json` lists the `any` and `maskable` files separately; a maskable
icon must keep its content inside the central 80% circle, which the frame would
not survive.
