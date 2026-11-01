# Owner feedback sweep (round 1 of play-testing)

Status: [x] done and verified in automated playtests, [~] done, partly verified, [ ] open

## Movement and collision
- [x] Blue blueprint outlines block the player: blueprints are walk-through until launched, and now a faint dashed outline instead of a blue cage.
- [x] Stuck on pebbles, small plants, bushes, rocks: scatter has no colliders (only sapling trunks, 12 cm).
- [x] Invisible walls near buildings: colliders come from ground-level geometry (walls, legs), never roofs, awnings or porches.
- [x] Trees in the middle of paths: trees placed on paths are moved onto grass.
- [x] Bridges and stepping-stone paths: a simulated walker crosses every bridge and stepping-stone path in both states (before and after launching). All pass.
- [x] Getting stuck generally: 40 random routes per island, before and after launch, all pass. The only unreachable spots are tight gaps behind the service stalls.
- [x] Click-to-walk and map travel: dense navigation grid (4,700 points) with A*; goals inside objects snap to the nearest free spot.
- [x] Going into the water: wade knee-deep in the shallows around every island (slower, ripples, splash, water footsteps), climb back out anywhere.

## Character
- [x] Sitting floats in the air: hips are placed on the seat for the player and all townsfolk.
- [x] Arms stick out: arms hang close to the body in every standing clip (7 degrees, limited by the jacket).
- [x] Face: no rings around the eyes, beard starts lower so the cheeks show, stronger brows, clean cap brim.
- [x] Footstep sound: two-layer footsteps (soft heel thump plus surface texture), varied, per surface: grass, sand, stone, wood, water.
- [x] Townsfolk clothing: shalwar kameez with waistcoat, elder with Jinnah cap, shawl and stick, woman in shalwar kameez and dupatta, modern young woman and man, schoolkid.

## World
- [x] GitHub garden outside the world: a proper square garden island; the year is folded into four seasonal beds with month signs.
- [x] Camera too far: closer default (15 m) and slightly lower angle; interaction close-ups tightened; phones get a wider field of view.
- [x] "6+" and "400+": lectern plaques say what they mean ("years shipping software", "projects built and launched") and open the story.
- [x] Bicycle clipping into the home: home re-laid out; automated overlap check now reports zero overlaps across the world.
- [x] Mobile park phones do nothing: tapping lights them up and shows each capability, then the case study.
- [x] Services stalls felt odd: each stall now plays a short, labelled live demo of the service, then shows the details.
- [x] Pakistani buildings: flat roofs with parapets and water tanks, jaali screens, arches, truck-art trims, rolling shutters, chai dhaba, electricity poles with sagging wires, Pakistani flag at the school.
- [x] Water looks more real: wave normals, sky reflection with fresnel, sun glints, shallow-water glow and caustics.
- [~] Lived-in feel: townsfolk walking, ducks, fish, gulls, cats, a goat, a rickshaw, a kid by the school. Keep adding.
