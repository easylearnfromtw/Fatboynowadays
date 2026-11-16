# MOCHI LAB — A Little Softer

A playful, mobile-first digital mochi you can **stretch, press, squish and release**. Multiple fingers can grip the same soft body simultaneously, with spring-based deformation and a soft rebound after release.

## Live site

https://easylearnfromtw.github.io/Fatboynowadays/

GitHub Pages must be enabled for the repository's main branch, root directory. Pages deployment status is managed by GitHub.

## Interactions

- Drag one finger (or a mouse) to deform the mochi.
- Use two or more fingers to pull the material apart, squeeze it together or twist its shape.
- Long-press to create a soft dimple; release for momentum and wobble.
- Change **elasticity** and **viscosity** using the sliders.
- Pick between **peach, taro and matcha** palettes.
- Tap **重新揉捏** to reset the material.

## Implementation

This is a standalone `index.html` — no dependencies, bundler, installation or backend.

The physics model uses a concentric particle mesh with radial, ring and diagonal distance constraints, pinned pointer contacts, a lightweight area-preservation pass and momentum damping. Drawing uses Canvas 2D gradient shading, dynamic outlines, tracked surface highlights and touch dimples. Pointer Events support simultaneous touches, mouse drag and pen input.

Open `index.html` locally in a modern browser to try it.

## Earlier project

The previous scroll-driven visual history site 《千年之重》 was replaced in the main branch in November 2026 at the owner's request. Its original `index.html`, illustrations and history remain available in Git commit history; the existing asset folders were not deleted.
