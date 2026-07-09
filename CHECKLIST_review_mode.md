# Review Mode checklist

Use this after pulling Review Mode changes. Do **not** edit `content/slides.js` or hero assets for this check.

## A. Normal mode (no regression)

- [ ] Open `/` or `/?v=pr4` **without** `review` / `contact`
- [ ] Scroll works; ambient / free scroll feel unchanged
- [ ] No Review HUD in the bottom-right
- [ ] Arrow keys do **not** hijack slide navigation
- [ ] Hero video still scrubs with scroll (prerender default)

## B. Review Mode enable

- [ ] Open `/?review=1`
- [ ] Body has stable freeze (no ambient glow / tail animation)
- [ ] Review HUD visible bottom-right
- [ ] HUD shows: slide, source, group, pageType, renderAt, progress
- [ ] `/?review=1&v=pr4` behaves the same (`v` ignored by logic)

## C. Keyboard

With `?review=1` focused on the page (not an input):

- [ ] `↓` → next slide; HUD slide number increments
- [ ] `↑` → previous slide
- [ ] `Home` → slide `01 / 32`, source matches slide 1
- [ ] `End` → slide `32 / 32`
- [ ] `R` → re-seeks current keyframe (no crash; progress stable)
- [ ] `H` → HUD hides; `H` again → HUD shows

## D. Stable keyframes

- [ ] Slide 1 shows hero title hold (not a blank intermediate)
- [ ] Slide 2 shows anti-chatbot / street copy peak
- [ ] Slides 3–32 each land on a readable card for that number
- [ ] Stepping does not leave ambient motion running

## E. Contact / capture path

- [ ] Open `/?contact=1` → stable mode on, **no** HUD
- [ ] In DevTools: `window.__demoReady === true`
- [ ] `window.goToSlide(5)` returns progress/seconds and updates scene
- [ ] `window.__reviewMode.enabled === true`

## F. Contact sheet script

```bash
npm run contact-sheet
# or
node scripts/capture-contact-sheet.mjs
```

- [ ] Does not crash if Playwright browser missing (tries `/usr/bin/chromium` or system Chrome)
- [ ] Writes `artifacts/contact-sheet/slide-01.png` … `slide-32.png` (32 files)
- [ ] Writes `artifacts/contact-sheet/contact-sheet.html` and `contact-sheet.png`
- [ ] JSON stdout includes `"captures": 32` and a `browserMode` string
- [ ] Exit code `0` when page has no console errors

## G. Guardrails (must remain true)

- [ ] `content/slides.js` git-diff empty (or only intentional copy work — not this feature)
- [ ] Hero MP4 path still `assets/video/hero-prerender-oneshot.mp4`
- [ ] No new public marketing promises / CTA copy added for Review Mode
- [ ] Modes still available: default prerender, `?photo=1`, `?webgl=1`, `?edit=1`, `?debug=1`

## H. Remote design review

- [ ] Share URL pattern: `https://<deploy>/?review=1&v=pr4`
- [ ] Reviewer can step slides without editing files
- [ ] Optional: hide HUD (`H`) before a clean frame grab

---

### Quick smoke (local)

```bash
# terminal 1
python3 -m http.server 4174 --bind 127.0.0.1

# browser
open 'http://127.0.0.1:4174/?review=1&v=pr4'

# terminal 2
node scripts/capture-contact-sheet.mjs http://127.0.0.1:4174/
```
