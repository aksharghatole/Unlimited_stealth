# UMBRA: Protocol Zero

A top-down atmospheric stealth-horror game. Escape a mysterious laboratory as a test subject. Escape the scripted prologue, then infiltrate five seeded procedural sectors with increasing patrol counts. Each run generates a new layout.

## Run locally

No dependencies or build step. From the repository root, run `python -m http.server 8000` and open http://localhost:8000 in a desktop browser.

## Presentation

Six industrial palettes, procedural character sprites, smoothly following camera, wall-clipped security beams, and restrained event accents. Reduced-motion system preferences disable camera easing, animated dust and CSS animations. Visuals are generated with Canvas; no external art assets are required.

## Controls

- Begin protocol: click the start button.
- Break restraints: move the mouse until the objective advances.
- Move: WASD or arrow keys; hold Shift to sprint.
- Hide: hold C (or Ctrl). Crouch on teal vent grates to conceal yourself from distant patrols.
- Distraction: Q emits a noise at your current position, drawing the nearest available guard within range. Move away immediately; 12-second recharge.
- Interact: E near the keycard desk or amber access card. Reach the unlocked exit or green elevator.
- Restart using the button after escaping or being detected.

Keyboard and mouse are currently required. Touch controls are future work. Patrols build suspicion, then chase, search the last known location, and return to their routes. Being caught ends the run. Sweeping cameras appear from sector two and summon guards when their alert fills. Break line of sight and use vents to evade pursuit.

## Tests

Run `node --test` using Node.js 20 or later. No npm dependencies are required.
