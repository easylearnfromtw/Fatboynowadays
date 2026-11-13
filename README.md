# 千年之重 · Fatboy Nowadays

A scroll-driven, original 2D shadow-puppet storytelling website about humanity's history of weight management and a personal weight-loss journey.

## Live site
When GitHub Pages is enabled, visit https://easylearnfromtw.github.io/Fatboynowadays/

## Current stage · v0.9
- **Act I:** no window or desk; layered historical scene and gentle looping character movements.
- **Act II:** two approved cut-paper shadow-theatre panels enter from the left and right, gather at centre and pause there; all motion follows native scroll, including reverse movement.
- **Act III:** the two paper-cut panels retreat toward their respective sides while the camera continues pulling out, revealing the entire original theatre image.
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

## Approved side-curtain assets (v0.5)

- `assets/curtain-left.webp` — original pastel lilac / blush / embossed-gold left paper-cut puppet scenery with cloud, lantern and floral motifs.
- `assets/curtain-right.webp` — complementary right paper-cut scenery, designed to extend toward the centre.
- In Act II, the paired scenery panels converge from opposite sides (`p=.34–.64`) and stay gathered until `p=.72`; in Act III (`p=.72–.96`) they withdraw to reveal the complete stage. Scroll position is the sole animation clock, so the panels stop with the finger and reverse on upward scrolling.
- Prior three long ribbon-cloud image assets are retained in the repository for comparison and rollback, but are no longer rendered on the page.

## Japan chapter layered scene (v0.6 preview)

A fully separate Japanese-stage prototype has been inserted after the original three-act shadow-cloud prologue. It retains the original artwork and camera. Scroll down through the main site to reach the new shoji-opening scene, then to the existing historical overview. Components are separate SVG files (background, dry garden, left and right shoji, cherry blossoms, lantern, kimono heroine, fan, tea table) under `japan-preview/`. The elements have scroll-controlled parallax and a door-opening transition, reversible with native browser scrolling. A self-contained separate review page is at `/japan-preview/`. This is **technical layered art**, not approved final illustrated characters; five evidence-grounded historical case studies will be authored after art review.

## Japan approved artwork update (v0.7)

The Japanese chapter and `/japan-preview/` now use the exact approved generated ukiyo-e illustration at `assets/japan-approved.webp` instead of the provisional SVG character, dry garden, and furniture. The portrait composition is preserved with a responsive stage: phone viewport shows the tall artwork, desktop positions it as a tall central image with a text area beside it. A matched pair of shoji-screen panels parts horizontally in response to native vertical scrolling; scroll position also controls the slow pullback and separate paper-cut overlays derived from this **same original illustration**: cherry blossom canopy, foreground petals, and tea table. These layers move subtly to provide real element-level depth without replacing the approved artwork. A few lightweight petal details are independent. Main three-part opening remains unchanged. The character is *not yet* an independently joint-rigged puppet; detailed arm, hair, facial and fan animation remains future work. The five verified Japan-history stories are not yet published.

## First-act picture-frame visibility (v0.8)

- The opening camera still **pulls outward** continuously across the three native scroll segments, but no longer crops off the original image's carved frame on desktop (1.16→1.10→1.05→1.00 scale).
- Portrait phone/tablet views retain a cinematic image crop and display actual side-post and crest fragments extracted from the exact approved original artwork (`assets/original-window-{left,right,crest}.webp`). The frame remains visible at scroll progress 0 instead of waiting until the final reveal.
- The paired cloud curtains, main picture, and Japanese chapter are preserved. No alternative artwork or framework dependency is introduced.

## Cloud-first full rectangular window (v0.9)
- Act I starts with the approved original image cropped in: no separate frame overlay, outward pullback `2.15→1.98`.
- Act II: approved left/right paper-cut clouds converge. The clouds part fully by normalized scroll progress `p=.87`.
- Act III: **only after** the cloud pieces have parted, an entire four-sided rectangular picture window (top/bottom/left/right) appears over `p=.89→1.0`, and scrolls backward reversibly.
- The four frame assets `assets/original-window-{top,bottom,left,right}.webp` are cropped from the original approved illustration; both portrait and desktop layouts show the full rectangular shape. The Japanese-stage chapter and independent scene preview are unchanged.
