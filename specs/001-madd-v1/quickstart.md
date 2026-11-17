# Quickstart — validate Tuhfa v1

## Prerequisites
Node 24+, npm 10+, Git. Optional: Chrome for Lighthouse.

## Setup
```bash
npm ci
npx playwright install chromium
```

## Gates (all must pass — same as CI)
```bash
npm run lint
npm run typecheck
npm run test:unit
npm run validate        # schema + Quran verification + ambiguity + spot indexes
npm run build
npm run test:e2e        # Playwright, 390x844 + 360x740
```

## Manual check (390×844)
1. `npm run dev` → open the printed URL, DevTools device toolbar 390×844.
2. Welcome screen shows «نقطة» and the Sheikh credit → «يلا نبدأ».
3. Path: Madd open, other chapters «قريبًا». Tap the first Madd node.
4. Teach card → «فهمت، يلا نتمرّن» → answer one wrong on purpose → red feedback with an example → it
   comes back later → finish → stars, XP, accuracy, «نقطة» celebrates.
5. Settings → teacher mode on → every node open; play one checkpoint.
6. «راجع» → «راجع غلطاتي» lists the concept you missed.
7. «المكتبة» → lesson 7 → «📄 شوف الصفحة من الكتاب» opens and zooms; tree scrolls sideways inside its box.
8. «حسابي» → export code → clear site data → import → same stars/XP/streak.
9. DevTools → Network offline → reload → play a lesson.

## Live
After merge to `main`: https://ahmedgaid.github.io/tuhfa/
