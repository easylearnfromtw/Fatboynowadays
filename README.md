# MOCHI LAB — 3D Tear & Heal

A touch-responsive 3D mochi with **single-finger dents, contact shadows, multi-finger elastic stretching, physical separation and self-rebonding**.

## Try it

https://easylearnfromtw.github.io/Fatboynowadays/

This is a GitHub Pages static website using `index.html` and `mochi-3d.js`. GitHub Pages publishing must be enabled in the repository settings.

## Gestures

- **Press and hold:** The 3D surface sinks inward. The dent receives its own contact shadow and a softly reflective rim.
- **Drag one finger:** Tug the dough beyond its tensile limit to tear it.
- **Stretch with two fingers:** Pull apart until the object snaps into **two independently rendered, movable 3D pieces**.
- **After tearing:** Drag the pieces toward one another or release them; the unheld pieces attract until their edges meet and the pieces rebond into one object.
- **Elasticity:** Controls snap-back and tear threshold; greater elasticity allows a longer stretch before rupture.
- **Viscosity:** Controls resistance and how quickly the dough settles after release.
- **Reset:** Restores a single undamaged mochi.

The tear/rebond process uses a stylized physically inspired model rather than a continuum-mechanics simulation. Detached pieces are closed 3D meshes, not a literal mesh topology fracture with torn interior surfaces.

## Color Library · Numbered Color Atlas

Tap **色盤 COLOR ATLAS** to open a fan-deck-inspired library with **20 original colors** across five color families: Rose, Violet, Green, Neutral, Blue. Filter by family and tap a large swatch to change the 3D material. Each color has an original code (`ML-101`–`ML-504`), English name and Chinese name.

The visual organization is inspired by professional printed color catalogs; **ML codes are original and are not official Pantone references or calibrated Pantone matches.**

## Technology

- Native WebGL 1.0, realtime vertex deformation, dynamically recalculated mesh normals, ambient occlusion inside fingertip cavities, specular studio highlights and CSS floor shadow.
- Pointer Events, multitouch capture, spring-damped deformation, threshold-based separation and independent piece attraction.
- Mobile-first layout, no framework, build step, server or external JavaScript dependencies.
- If WebGL is not supported, a noninteractive Canvas 2D fallback drawing is displayed.

## Older versions

The previous scrolling shadow-puppet site 《千年之重》 and the earlier 2D mochi experiment remain accessible through Git history. Original asset directories were not deleted.
