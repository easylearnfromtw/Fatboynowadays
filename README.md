# MOCHI LAB — Soft Matter Playground (v3)

A mobile-first 3D tactile playground. The main GitHub Pages website is a static `index.html` with two dependency-free scripts: `mochi-3d.js` and `mochi-ui.js`.

**Live URL (requires GitHub Pages publishing to be enabled):**  
https://easylearnfromtw.github.io/Fatboynowadays/

## What's interactive

1. **Single-finger press:** The mesh indents under your fingertip. Its normals update in real time for concave lighting and cavity shadows.
2. **Pull → neck → rupture → recoil → reunion:** With sufficiently high tension, the mesh first stretches and pinches into a neck, then splits into two independently rendered closed 3D fragments. The split includes thin filaments, particles, an initial elastic snap, damped bouncing, a pause, then slow autonomous movement back toward the other piece. Contact triggers re-bonding. **Fragment volumes depend on pull strength and grip asymmetry.**
3. **Multi-touch:** Each finger can control a different surface patch or detached fragment; movement of one finger does not suppress other fingers.
4. **Tactile materials:**
   - **Classic mochi:** Glossy, springy, stretchy, snaps at high tension, and fuses again.
   - **Crunchy slime:** Embedded bead-like shader detail, faster snap and crunchy granular audio.
   - **Paper clay:** Matte textured surface, imprints remain after release, lower elongation before fracture.
   - **Bubble:** Iridescent soap-film shading and a pop/deflate/re-form animation.
   - **Bubble wrap:** Procedural cell grid with individual press-to-pop blisters (recent 20 cells retained) and distinct pop sounds.
5. **Elasticity / viscosity sliders:** Tunable strength, stretch threshold, drag and recovery.
6. **Numbered color archive:** 20 custom ML-101…ML-504 swatches, grouped by hue and inspired by professional printed color catalogs. **These are original ML identifiers, not official Pantone color specifications or certified Pantone matches.**

## Sensory permissions, cookies and browser support

- Audio uses **Web Audio-generated effects**, and haptics uses `navigator.vibrate` when supported.
- Both are **off by default** unless prior consent is present. When someone attempts to enable them, a permission/consent dialog is shown.
- On consent, a first-party `mochi_sensory` cookie stores only sound/vibration settings for 180 days (SameSite=Lax; Secure on HTTPS). Declining does not set the preference cookie; settings can be changed later.
- **iOS Safari generally does not support the Vibration API**, so the switch is disabled there when the API is unavailable. Sound playback also follows user gesture, system mute and browser restrictions.
- No third-party tracking or microphone recording.

## Interface and photography

- An Apple-inspired translucent **bottom sheet** with blurred background opens by tapping the dock or swiping it upward. Swipe the grab handle down or tap the dismiss control to close.
- Material settings and color archive live inside the sheet; the 3D object remains touchable outside it.
- Camera buttons compose the current WebGL scene, fiber effects, floor shadow, material label and color code into a **1080 × 1350 PNG**. Preview, save or share; modern iOS Share Sheet support depends on browser capability.
- Playground text is CSS non-selectable, iOS gesture zoom is prevented where web controls permit, and the viewport requests a fixed zoom scale. This does **not** suppress OS accessibility zoom.

## Technical approach and limitations

- WebGL 1.0 closed ellipsoidal mesh with per-frame geometric displacement, recomputed vertex normals, cavity shader, procedural material effects and 2D transient particle overlay.
- Stylized fracture, recoil and re-bonding rather than a calibrated rheology model, true finite-element fracture simulation or actual physics-constrained topology changes.
- No build tools, external library or analytics. Hosted as a static GitHub Pages site.
- If WebGL is not available, the fallback is a static 2D rendering rather than full interactivity.
- UI JavaScript syntax and repository file linkage can be checked statically, but device-specific rendering and deployment still require real-browser verification.

## History

The former 2D mochi page and the original interactive historical project 《千年之重》 remain in the Git commit history. Legacy illustration files were not removed.
