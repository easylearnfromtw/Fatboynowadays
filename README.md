# 千年之重 · Fatboy Nowadays

A scroll-driven, original 2D shadow-puppet storytelling website about humanity's history of weight management and a personal weight-loss journey.

## Live site
When GitHub Pages is enabled, visit https://easylearnfromtw.github.io/Fatboynowadays/

## Current stage · v0.2
- **Act I:** no window or desk; layered historical scene and gentle looping character movements.
- **Act II:** continuous zoom and passing pastel clouds.
- **Act III:** the camera pulls back and the theatre window, lanterns, and tabletop enter the scene.
- Native vertical scrolling controls the camera directly: drag/scroll forward or backward; no GIF frame stepping and no mandatory autoplay.
- Responsive mobile-first layout, no frameworks, no external fonts, no backend, and no build process.
- Independent SVG parts animate subtle reading, nodding, hair movement and walking.
- A history overview follows the opening; the complete history and personal chapters are planned for later.

## Local preview
Open \`index.html\` in a modern browser, or run a static web server:

\`\`\`sh
python3 -m http.server 8000
\`\`\`

Then open http://localhost:8000.

## Design
Pastel lilac \`#CDBBEF\`, pink \`#F6D6E6\`, yellow \`#F5E8A8\`, blue \`#BFE3F4\`, warm white \`#FAFAF7\`, ink \`#1A1A1A\`. Original fantasy-inspired shadow-theatre visuals; no characters or UI assets copied from third-party games.

## Performance / accessibility
Animated scenes rely on requestAnimationFrame, passive scroll listeners, SVG and composited transforms. With \`prefers-reduced-motion\`, decorative idle loops stop; scroll-driven navigation continues so the story remains usable. The scrolling narrative is accessible without tap-only gestures.

## Art direction
Scene and character artwork are iterated one by one after review. Current illustration and puppet motions are **vector prototypes**, not final approved art layers. Historical claims will be fact-checked and sourced before the full timeline is published.
