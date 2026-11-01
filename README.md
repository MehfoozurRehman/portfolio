# Launch Isles: Mehfooz-ur-Rehman's portfolio

A playable 3D portfolio. Visitors walk a small character (me) around a pastel clay world. Every island is something I built. You can launch the projects, sit on the benches, take the slide, wade into the shallows, and say hello at the lighthouse. There is a GitHub Garden that grows from my real contribution calendar. A **Classic view** button shows the same content as a plain, accessible page.

Live: https://mehfooz-ur-rehman.web.app (archives: v9 https://mehfoozurrehmanv9.web.app, v8 https://mehfoozurrehmanv8.web.app)

## Stack

- **Three.js r171** for rendering, with a custom water shader, a day/golden/night cycle, adaptive post-processing and instanced scatter.
- **GSAP** for camera moves and UI motion.
- **Vite 6** for the static build, served from Firebase Hosting.
- **Blender 5** for the asset packs (`src/models/*.glb`), built headless from the Python scripts in `blender/`.

## How it works

- `src/world/`: hex-tile islands, buildings, props, ambient life (townsfolk in shalwar kameez, ducks, a rickshaw…), the GitHub Garden.
- `src/game/`: player controller (coyote time, jump buffering, seats sampled from the sit clip), 2D collision against ground footprints, a dense A* navigation grid for click-to-walk, interactions and demos.
- `src/ui/`: HUD, panels, map, touch controls, Classic view.
- `src/shared/content.js`: all portfolio content (projects, services, story, links).
- `src/data/github.json`: refreshed before every build by `scripts/fetch-github.mjs`. If GitHub can't be reached, the existing file is kept.

## Commands

```bash
pnpm install
pnpm dev            # local dev server
pnpm build          # refresh GitHub data + production build to dist/
pnpm preview        # serve dist/
pnpm generate:cv    # rebuild public/cv.pdf from scripts/cv-content.mjs
node tools/shoot.mjs dist shots/check --scenario tools/tests/check.json --wait 0   # headless playtest
```

The playtest needs a local Chrome or Edge (puppeteer-core). `check.json` runs the layout overlap check and random walk-reachability routes through the `window.__game` test hook.

## Deploy

Pushing to `main` builds and deploys through `.github/workflows/firebase-hosting-merge.yml`. A daily scheduled rebuild keeps the GitHub Garden current. To deploy by hand:

```bash
pnpm build && firebase deploy --only hosting --project mehfooz-ur-rehman
```

`firebase.json` deploys to the main site and the v9 archive. The v8 (Astro) and older archives are not in the config, so deploys never touch them.

Design notes are in `docs/DESIGN.md`, asset notes in `docs/ASSETS.md`, and the play-test sweep in `docs/FIXLIST.md`.
