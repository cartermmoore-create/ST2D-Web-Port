# Slendytubbies 2D — Web Port

This repository now contains a **playable, code-built browser recreation** of the core Slendytubbies 2D-style exploration loop.

## Play it

Open the published GitHub Pages site once the Pages workflow finishes deploying. The page runs in a modern browser and does not require a download or server-side runtime.

## Gameplay included

- Top-down dark forest map with a moving camera
- Flashlight cone and low-visibility atmosphere
- Ten custards to find
- A creature that follows the player
- Sprint stamina, pause/restart, a mini-map and win/lose states
- Keyboard controls and touch buttons on compatible devices
- Procedural canvas graphics; no external images or libraries are required

## Controls

| Action | Input |
|---|---|
| Move | WASD or arrow keys |
| Run | Hold Shift |
| Toggle flashlight | Space |
| Toggle map | M |
| Pause | Esc |

On touch devices, use the on-screen directional pad and action buttons.

## Important: what this port is

The supplied `slendytubbies-2d-64bit.rar` is a **compiled Windows Unity player**, not the original Unity project and not a WebGL build. A Windows executable and its data folder cannot simply be converted into a browser build. A faithful conversion of the original game requires the Unity project (scenes, scripts, project settings and dependencies) so it can be built using Unity's WebGL target.

Therefore, the current site is an original, code-built browser recreation of the core gameplay idea. It is **not** the original Unity game, does not include the original game assets, and does not yet reproduce every original mode or feature. If the original Unity project or a Unity WebGL export becomes available, it can replace this prototype.

## Deployment

A GitHub Actions workflow is included at `.github/workflows/pages.yml`. In the repository's Settings → Pages, set the deployment source to **GitHub Actions** if it is not already enabled. Each push to `main` triggers deployment.
