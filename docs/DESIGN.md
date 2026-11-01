# Launch Isles: design

An open-world 3D portfolio for Mehfooz-ur-Rehman. Visitors play as a small clay version of Mehfooz and wander a soft pastel archipelago in any order. Everything he has built is a place you can walk into, and almost everything in the world can be used: sit on a bench, ride a swing, go down a slide, kick a ball, ring the school bell, launch a paper boat. The story is told by the world, not by walls of text.

Reference look: the owner's image of a pastel clay diorama (hexagonal islands on calm blue water, rounded trees in mint and coral, white plinths, a pink wall, soft shadows, matte materials).

## What makes it ours (not a copy)
- **No vehicle.** A person on foot, who interacts with the world like a person.
- **"From idea to launch" is the core mechanic.** Each project starts as an empty plot with a glowing idea seed. Walk up and hold the action button: the district is drawn as a blueprint, scaffolding appears, then it pops into full clay colour. The three build stages are captioned with his real process: *Deconstruct the real workflow* (blueprint), *Rapid MVP* (scaffold), *Hardened scale* (finished). You literally launch his projects.
- **The blueprint-to-clay shader.** A world-space height mask sweeps up each building: above the line it is a glowing blueprint grid on transparent blue, below it is finished matte clay, with a bright seam between them. Nobody else's portfolio looks like this moment.
- **Tota the parrot.** In Pakistan the fortune-teller's parrot picks your card. Here, a small green clay parrot is the guide. It flies ahead to a place you have not visited yet, perches, and offers one short line. It never forces a route; if you ignore it, it keeps you company.
- **The GitHub Garden.** His real GitHub contribution calendar (fetched at build time) is planted as a garden: one small tile per day for the past year, with a plant whose height and bloom follow that day's contributions. Walk through a year of his work. His real public repositories are books on the shelves of a little library kiosk next to it.
- **Pakistani details, in pastel.** A school bell and a yellow school van at Schooliee, a bazaar with striped awnings and chai cups at Karobari, a cricket pitch with stumps you can knock over, kites on the hill, a crescent-and-star pennant on the flagpole.

## The character
- A chibi clay Mehfooz, about 1.1 m tall: dark cap, short dark hair, full dark beard, tan jacket with a cream fur collar, navy tee, dark trousers, white sneakers. Big head (about 40% of height), short limbs, rounded everything. Matches his illustrated portrait.
- Animations: idle (breathing, occasional look-around), walk, run, jump, fall/land, wave, interact (reach), sit, swing (seated sway), slide (sitting, arms up), kick, cheer, typing (at his desk), and a lean on a railing.
- Small life: dust puffs when running, footstep sounds that change on grass, sand, wood and stone, a splash ring when stepping into shallow water, a little bounce on landing, head turns toward nearby interactables and NPCs.

## Controls
- **Keyboard:** WASD or arrows to move, Shift to run, Space to jump, E or Enter to interact (hold to launch a project), Esc to close panels, M for the map, C for classic view.
- **Mouse:** click the ground to walk there (with steering around obstacles); click an interactable to walk to it and use it. Drag to orbit the camera a little; wheel to zoom within limits.
- **Touch:** on-screen joystick on the left, action and jump buttons on the right, tap-to-walk anywhere, pinch to zoom.
- **Never stuck:** a "Classic view" button opens the whole portfolio as a clean scrolling page, for visitors who do not want to play.

## Camera
Diorama camera like the reference: a long lens (about 28 degree field of view), high three-quarter angle, following the character with damping and a small lead in the direction of travel. It eases in when you interact and frames the thing you use (sitting on a bench looks out to sea; the slide gets a side view). Gentle limits so the world always reads as a model.

## The map (all reachable in any order)
Hexagonal islands (pointy-top hex tiles, 2 m circumradius) on pastel water, joined by bridges and stepping stones. Shallow water near shores is wadeable; deep water is not (soft invisible boundary, and Tota calls you back).

1. **Home Island (spawn, centre).** His studio hut under a coral tree, with a desk, laptop and a mug (interact: he sits and types; the About card opens with his story and highlights). Giant clay garden numbers in the lawn: "6+" years shipping, "400+" projects built. A tall billboard with his portrait. A bench facing the sea. The welcome signpost points to every island.
2. **Schooliee Campus.** A small school building with a bell (ring it), a flagpole, a yellow school van, a playground with **a slide and swings** (usable), a fee-challan noticeboard. Launch plot.
3. **Karobari Bazaar.** A short bazaar street with striped awnings, crates of produce, a chai stall, and a phone on a stand that plays a voice-note bubble; when launched, a storefront pops up in seconds ("Shop to live storefront in under 2 minutes"). Launch plot.
4. **WhatsApp Gateway Post Office.** A round post office with a pigeon loft; paper-plane messages fly from it in a loop. Interact to send a burst. Launch plot.
5. **LeadProfit Harbour.** A small dock and warehouse with stacked crates, a little crane, and a live price board that ticks. Launch plot.
6. **DSME Globals Tower.** A short glass-and-white office tower with a rotating globe sculpture out front and a plaza bench. Launch plot.
7. **Mobile Ecosystems Park.** A park where giant clay phones stand like monoliths showing app screens, a signal tower with pulsing rings, and a **seesaw**. Launch plot.
8. **Services Bazaar (market square).** Four stalls, one per service, each with its own sign and object: WhatsApp AI (a talking chat-bubble canopy), SaaS & ERPs (a dashboard screen), Mobile apps (a phone rack), Desktop & automation (a monitor and cables). Walk up: the stall awning opens and the service card offers "Hire me for this".
9. **Timeline Hill.** A winding path up a small hill with milestone flags: 2019 Virtual University (BSCS), 2020 CrazyBeings Studios, 2020 Devscot, 2023 LeadProfit, 2024 Schooliee, 2025 Karobari, and the summit flag "Today". Kites fly over the top. Each flag shows its role card.
10. **GitHub Garden and Library.** The contribution calendar garden described above, plus a kiosk with his public repositories as books (interact: a shelf panel with the real repo names, languages and stars, linking to GitHub).
11. **Toolshed.** A garden shed whose shelves hold labelled crates of his stack (Web & UI, Mobile & desktop, Backend & data, AI & automation).
12. **The Park of Voices (testimonials).** Benches with three clay townsfolk. Sit next to one and they speak their testimonial in a bubble.
13. **Cricket Pitch.** Stumps and a ball. Kick the ball into the stumps to knock them over (a small celebration and a "Howzat!" bubble).
14. **Lighthouse Pier (contact).** A lighthouse at the end of a pier with a mailbox. Interact with the mailbox to open the contact card (email and phone with copy buttons, WhatsApp, LinkedIn, GitHub, Instagram, Facebook). Fold and launch a paper boat that sails away with "Let's build yours". Once all six projects are launched, the lighthouse lamp turns on and a short fireworks moment plays.

## Progress and wayfinding
- A small HUD chip: "Launched 2 / 6". A compact island map (M) with visited places ticked.
- Collectible "idea bulbs" hidden around the world (behind the hut, under the slide, at the top of Timeline Hill, and so on); each one reveals a fun fact from his profile.
- Signposts with clay arrows at every crossing. Tota flies to the nearest unvisited place when you stand still for a while.

## Content rules
- Every fact comes from `shared/content.js` and the build-time GitHub data. No invented metrics, clients or quotes.
- Cards are short: a title, one result line, three chips, and buttons ("Open case study", "Visit"). Long text lives in the case-study panel and the classic view.
- Real screenshots appear on in-world billboards (Schooliee, DSME, LeadProfit) and in case-study panels.

## Look (see ASSETS.md for the art bible)
Pastel clay: matte materials, generous bevels, soft shadows, baked ambient occlusion, a pastel sky that fades to a pink horizon, calm water with soft foam rings around every island, drifting clouds, and a gentle tilt-shift feel from the long lens. Day only for now; a sunset toggle is a stretch goal.

## Sound
All synthesized with Web Audio (no audio files): soft surf, occasional birds, footsteps by surface, pops and chimes on interactions, a warm chord when a project launches, a little fanfare at the finale. Off until the visitor presses Start; a mute toggle in the HUD.

## Technical plan
- Vite + Three.js r171, GSAP for tweens. Custom systems, no physics engine: a 2D collision world on the XZ plane (circles, boxes, hex footprints), ground height from tile tops, slopes on Timeline Hill from a height function.
- Assets from Blender as GLB packs with named roots and palette-named materials; the engine swaps in shared clay materials (consistency and the blueprint shader in one place). AO baked into vertex colours.
- Shadows from one directional light with a tight frustum that follows the player; instanced vegetation; frustum culling; a render budget aimed at 60 fps on integrated graphics; phones get lower resolution, fewer instances and no post effects.
- Runs inside a claude.ai artifact: GLBs inlined and parsed in memory with `loadGLB`, no network calls, GitHub data baked into a JSON module at build time.
