# Review Mode

Remote design review + per-slide stable screenshots for  
`metal-ai-os-scroll-landing-v3-oneshot`.

Does **not** change:

- `content/slides.js` copy
- hero video / plate assets
- design direction
- normal (non-review) scroll behaviour

---

## Enable

| URL | Effect |
|-----|--------|
| `?review=1` | Review Mode: HUD, keyboard, stable keyframes, ambient off |
| `?review=1&v=pr4` | Same; `v` is cache-bust only |
| `?contact=1` | Same stable path as review; HUD hidden (for capture) |
| `?review=1&contact=1` | Explicit capture profile used by the contact-sheet script |

Normal share / Production URLs without these params are unchanged.

Example:

```text
https://<host>/?review=1&v=pr4
http://127.0.0.1:4174/?review=1
```

---

## Review HUD (bottom-right)

Shown only when `?review=1` and **not** `?contact=1`.

| Field | Meaning |
|-------|---------|
| **slide** | `NN / 32` target slide number |
| **source** | Manifest source id (`S01`, `D01`, …) |
| **group** | Scene group (`H0`, `C1`, …) |
| **pageType** | Manifest page type |
| **renderAt** | Current forced time in seconds (`progress × 32`) |
| **progress** | Scroll progress `0–100%` |

Press **H** to hide / show the HUD.

---

## Keyboard

Active only in Review / Contact mode (ignored when focus is in an input).

| Key | Action |
|-----|--------|
| `↓` / `PageDown` | Next slide (stable keyframe) |
| `↑` / `PageUp` | Previous slide |
| `Home` | Slide 1 |
| `End` | Slide 32 |
| `R` | Re-apply current slide keyframe |
| `H` | Toggle HUD |

---

## Stable screenshot mode

When `review=1` or `contact=1`:

1. CSS ambient motion (glow / tail / glass sweep) is disabled and opacity forced to `0`
2. Signal-canvas particle drift uses a frozen phase (no progress-linked float)
3. Each `goToSlide(n)` lands on a **stable keyframe**:
   - Slide 1: hero title hold peak  
   - Slide 2: street one-liner peak  
   - Slides 3–32: discrete ladder sample `index / 31`

Normal mode (no query flag) keeps ambient + free scroll as before.

---

## Programmatic API (page)

| API | Description |
|-----|-------------|
| `window.goToSlide(n)` | Jump to slide `n` (1-based); returns `{ index, number, progress, seconds }` |
| `window.renderAt(seconds)` | Existing scrub API (still works) |
| `window.__slideManifest` | `{ slides, sceneGroups, templates }` |
| `window.__reviewMode` | `{ enabled, contact, stable, targetIndex, hudVisible }` |
| `window.__demoReady` | `true` when first paint path is ready |

---

## Contact sheet

### Script (recommended)

```bash
npm run contact-sheet
# or
node scripts/capture-contact-sheet.mjs
# optional existing server:
node scripts/capture-contact-sheet.mjs http://127.0.0.1:4174/
```

Output:

```text
artifacts/contact-sheet/
  slide-01.png … slide-32.png
  contact-sheet.html
  contact-sheet.png
```

### Browser launch fallback

1. Playwright bundled Chromium  
2. System executables, including **`/usr/bin/chromium`**, Chrome.app on macOS, etc.  
3. Env overrides: `CHROMIUM_PATH` or `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

If Playwright’s browser package is missing, the script **does not die immediately** — it tries system Chromium. Only if all options fail does it exit with install instructions.

### URL mode

Opening `?contact=1` alone enables the same stable freeze + `goToSlide` path without drawing the HUD (useful for manual full-page captures).

---

## Remote review workflow

1. Deploy / tunnel the static site (existing Vercel / local + cloudflared is fine).
2. Share `https://…/?review=1&v=pr4`.
3. Reviewer uses arrow keys to step slides; HUD shows source / group / type.
4. For a full contact sheet locally: `npm run contact-sheet`.
5. Optional: hide HUD with **H** before a manual screenshot.

---

## Files touched by this feature

| Path | Role |
|------|------|
| `index.html` | `?review` / `?contact` flags, HUD, keys, stable freeze, `goToSlide` |
| `scripts/capture-contact-sheet.mjs` | 32-slide capture + Chromium fallback |
| `REVIEW_MODE.md` | This doc |
| `CHECKLIST_review_mode.md` | Verification checklist |

Not modified: `content/slides.js`, hero MP4 / plates, marketing copy.
