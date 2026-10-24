# Slendytubbies 2D — Web Port

This repository is the target for a browser-playable port of **Slendytubbies 2D**.

## Current source build

The provided archive, `slendytubbies-2d-64bit.rar`, contains a Windows Unity player (`Slendytubbies 2D.exe`) and its `Slendytubbies 2D_Data` directory. It does **not** contain a Unity WebGL build (`index.html`, `Build/*.wasm`, `Build/*.data`, and loader/framework files).

A Windows `.exe` cannot be run directly on GitHub Pages. The game must be exported again from its original Unity project with **WebGL** as the target, or recreated/ported to browser technologies. The Windows player archive alone is not enough to create a faithful WebGL export.

## Next steps

1. Obtain the original Unity project (including scenes, scripts, packages, and source assets).
2. Open it in a compatible Unity version and install the WebGL Build Support module.
3. Test the project in Unity's WebGL player, resolving any plugins or networking features that WebGL does not support.
4. Export the WebGL build.
5. Copy the generated `index.html`, `Build/`, and `TemplateData/` files into this repository (or configure the build output folder as the site root).
6. Enable GitHub Pages for the `main` branch and root folder.

## Controls

See the original game's `Controls-Controles.txt` when available. Browser controls will be documented here after the web build is playable.

## Status

**Not yet playable in the browser.** This repository currently documents the required porting path; it does not claim that the Windows executable has been converted.
