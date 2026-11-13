# 千年之重 · Fatboy Nowadays

A scroll-driven, original 2D shadow-puppet storytelling website about humanity's history of weight management and a personal weight-loss journey.

## Live site
When GitHub Pages is enabled, visit https://easylearnfromtw.github.io/Fatboynowadays/

## Current stage · v0.4
- **Act I:** no window or desk; layered historical scene and gentle looping character movements.
- **Act II:** the camera keeps pulling back through three newly approved paper-cut shadow-theatre ribbon cloud assets (back, mid, front), each with independent scroll-driven parallax.
- **Act III:** the camera keeps pulling back; the theatre window, lanterns, and tabletop enter only at the end.
- Native vertical scrolling controls one continuous outward camera pullback across all three acts: drag/scroll forward or backward; no GIF frame stepping, reverse zoom or mandatory autoplay.
- Responsive mobile-first layout, no frameworks, no external fonts, no backend, and no build process.
- Original approved theatre illustration is used for the background. This is still a static artwork; individual character rigging, page turning, nodding, and hair animation are future enhancements.
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
Scene and character artwork are iterated one by one after review. The original stage illustration and decorative cloud layers have been approved. Character rigging and remaining chapters are planned for future approval. Historical claims will be fact-checked and sourced before the full timeline is published.

## Approved cloud assets (v0.4)
- `assets/cloud-back.webp`: pale gold-lined cut-paper distant cloud band, derived from 淡雅金边云山皮影装饰带
- `assets/cloud-mid.webp`: layered pink-lilac traditional ruyi paper-cut ribbon, derived from 霓彩如意云纹剪纸长带
- `assets/cloud-front.webp`: elaborate gold-edged paper-cut foreground cloud, derived from 華麗金邊雲山剪紙長卷

The original painted stage remains unchanged. These are real transparent WebP image layers rather than mist/fog or GIF frames. Cloud movements track scroll progress and reverse when scrolling upward. The cloud imagery is decorative; historically accurate shadow-puppet character articulation will be developed separately.
