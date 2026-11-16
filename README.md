# MOCHI LAB — 3D Soft Touch

**Interactive WebGL 3D mochi** with surface dents, fingertip contact shadows, studio highlights and multi-touch deformation. Replaces the earlier 2D rendering on the same GitHub Pages site.

## Open

https://easylearnfromtw.github.io/Fatboynowadays/

## Gestures

- **Single finger: press and hold.** A true geometric depression forms under the fingertip, with local cavity shadow and a raised reflective rim.
- **Single finger: drag.** Move the held patch to pull the 3D surface.
- **Two or more fingers:** stretch, pinch and twist simultaneously.
- **Release:** spring-damped soft return, with inertia influenced by elasticity and viscosity sliders.
- **Flavours:** peach, taro and matcha lighting palettes.
- **Reset:** restores the original 3D shape.

## Implementation

- `index.html`: responsive interface, controls and a soft blurred floor-contact shadow.
- `mochi-3d.js`: dependency-free WebGL 3D surface renderer. A closed UV-sphere-like ellipsoid uses **3D mesh vertex displacement**, per-frame surface-normal recomputation, a cavity ambient-occlusion shader and studio-style diffuse/specular lighting.
- Uses Pointer Events and pointer capture for multi-finger touch, mouse and pen input.
- Rendering uses raw WebGL 1.0. Modern iOS Safari, Android Chrome and desktop browsers with WebGL enabled can run it without a bundler. A static 2D illustration is shown if WebGL is unavailable.

The simulation is an interactive approximation of a soft viscoelastic object, not a calibrated finite-element physics model.

## Version history

The original historical shadow-puppet storytelling site 《千年之重》 and the earlier Canvas 2D mochi implementation are preserved in Git history. Artwork assets from earlier work were not deleted.
