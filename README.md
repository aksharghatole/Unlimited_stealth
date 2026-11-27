# UMBRA: Protocol Zero

A top-down atmospheric stealth-horror game. Escape a mysterious laboratory as a test subject. Escape the scripted prologue, then infiltrate five seeded procedural sectors with increasing patrol counts. Each run generates a new layout.

## Run locally

No dependencies or build step. From the repository root, run `python -m http.server 8000` and open http://localhost:8000 in a desktop browser.

## Controls

- Begin protocol: click the start button.
- Break restraints: move the mouse until the objective advances.
- Move: WASD or arrow keys; hold Shift to sprint.
- Hide: hold C (or Ctrl), remain still and out of sight.
- Interact: E near the keycard desk or amber access card. Reach the unlocked exit or green elevator.
- Restart using the button after escaping or being detected.

Keyboard and mouse are currently required. Touch controls are future work. The ALERT meter rises while a patrol sees you; break line of sight before it fills.

## Tests

Run `node --test` using Node.js 20 or later. No npm dependencies are required.
