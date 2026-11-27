# UMBRA: Protocol Zero

A top-down atmospheric stealth-horror game. Escape a mysterious laboratory as a test subject. The current build is a playable prologue; procedural facility floors are planned.

## Run locally

No dependencies or build step. From the repository root, run `python -m http.server 8000` and open http://localhost:8000 in a desktop browser.

## Controls

- Begin protocol: click the start button.
- Break restraints: move the mouse until the objective advances.
- Move: WASD or arrow keys; hold Shift to sprint.
- Hide: hold C (or Ctrl), remain still and out of sight.
- Interact: E near the keycard desk. Reach the unlocked exit.
- Restart using the button after escaping or being detected.

Keyboard and mouse are currently required. Touch controls and additional floors are future work.

## Tests

Run `node --test` using Node.js 20 or later. No npm dependencies are required.
