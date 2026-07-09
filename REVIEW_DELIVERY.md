# Review Mode delivery

Delivery snapshot only. No copy / hero / design-direction changes in this pass.

## Commit

| Item | Value |
|------|--------|
| **当前 commit hash (main HEAD)** | `4494f0c75584bbf2c5943b4264778ae0b4be2c2b` |
| **Short** | `4494f0c` |
| **Branch** | `main` (pushed to `origin/main`) |
| **Review Mode 功能 commit** | `49c7fd8faccbd7eaad7320bd4922a1ec31c859f9` |
| **Vercel 部署对应** | `49c7fd8`（Review Mode 代码；本文件为后续 delivery 记录） |

## Guardrails

| Check | Result |
|-------|--------|
| 是否改动 `content/slides.js` | **否** |
| 是否改动 hero 视频 | **否** |
| 是否改动设计方向 | **否** |

## Vercel

| Role | URL |
|------|-----|
| **Production (alias)** | https://metal-ai-os-scroll-landing-v3-onesh.vercel.app |
| **Production deployment** | https://metal-ai-os-scroll-landing-v3-oneshot-98jv9i799.vercel.app |
| **Inspect** | https://vercel.com/maxmet-s-projectsa/metal-ai-os-scroll-landing-v3-oneshot/6KsihNFLQwu5cRC7K65GNAPXz5n5 |

Deployed with `vercel --prod` from local tree at commit `49c7fd8`.

## Review / Contact URLs

Use the stable Production alias:

| Mode | URL |
|------|-----|
| **Review Mode** | https://metal-ai-os-scroll-landing-v3-onesh.vercel.app/?review=1&v=pr4 |
| **Contact Mode** | https://metal-ai-os-scroll-landing-v3-onesh.vercel.app/?contact=1&v=pr4 |

Same query strings on the deployment host:

| Mode | URL |
|------|-----|
| Review | https://metal-ai-os-scroll-landing-v3-oneshot-98jv9i799.vercel.app/?review=1&v=pr4 |
| Contact | https://metal-ai-os-scroll-landing-v3-oneshot-98jv9i799.vercel.app/?contact=1&v=pr4 |

## Contact sheet (local)

Command:

```bash
node scripts/capture-contact-sheet.mjs
```

Result (this run):

| Item | Path / value |
|------|----------------|
| **contact-sheet.png** | `artifacts/contact-sheet/contact-sheet.png` |
| **contact-sheet.html** | `artifacts/contact-sheet/contact-sheet.html` |
| **32 slide PNGs** | `artifacts/contact-sheet/slide-01.png` … `slide-32.png` |
| **captures** | `32` |
| **warnings / pageErrors** | none |
| **browserMode** | `playwright-bundled` |

Absolute root:

```text
/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v3-oneshot/artifacts/contact-sheet/
```

## main branch confirmation

- `origin/main` includes Review Mode at `49c7fd8` (`is-review`, `goToSlide`, review HUD, contact-sheet Chromium fallback).
- GitHub: https://github.com/metalmax0908-create/metal-ai-os-scroll-landing-v3-oneshot
