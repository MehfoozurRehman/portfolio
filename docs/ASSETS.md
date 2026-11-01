# Launch Isles: art bible and asset spec

Read `DESIGN.md` first for what the world is. This file is the contract every asset must meet so that three builders working in parallel produce one coherent world. The reference image is a pastel clay diorama: rounded, matte, soft, toy-like, calm.

## Style rules
- **Clay, not low-poly.** Every edge is rounded: bevel modifier (width 0.02 to 0.08 m depending on size, 3 or more segments, harden normals off) plus smooth shading (Shade Auto Smooth 40 degrees or smooth with weighted normals). No faceted spheres: use enough segments (UV spheres 24x16 or more, cylinders 24 or more sides for anything bigger than 0.3 m).
- **Toy proportions.** Chunky, simplified shapes with clear silhouettes; slightly exaggerated (fat trunks, round canopies, thick bench slats). Details are big and few.
- **Matte.** Roughness 0.85 to 1.0, metalness 0, except glass (the DSME tower windows: roughness 0.15) and the lighthouse lamp.
- **Palette only.** Use ONLY these materials, named exactly as below (the engine replaces each by name with a shared clay material, so names matter more than the colour you set). Set the Base Color to the hex so previews look right.

| Material name | Hex | Use |
|---|---|---|
| `pal_grass` | #74C391 | grass tops, leaves (mid) |
| `pal_grass_light` | #9ED6A8 | light leaves, highlights |
| `pal_grass_deep` | #2E9B78 | deep leaves, dark tile tops |
| `pal_leaf_dark` | #1F7A60 | darkest foliage, agave |
| `pal_coral` | #F28C6F | coral trees, benches, slide, accents |
| `pal_coral_deep` | #DC6B52 | shaded coral, roofs |
| `pal_peach` | #F7B79F | skin-adjacent warm, flowers centre |
| `pal_cream` | #F3EDE6 | plinths, tile sides, white objects |
| `pal_stone` | #E3D8CF | paths, steps, sand-stone |
| `pal_sand` | #F1DCC2 | beaches, sand tiles |
| `pal_wood` | #C98C62 | wood (crates, dock, doors) |
| `pal_wood_dark` | #8E5B3D | dark wood, trunks (if not cream) |
| `pal_pink` | #ECBDB7 | walls, the pink sea wall, pink accents |
| `pal_sky` | #A9D6E5 | light blue accents, glass tint |
| `pal_water` | #79BFC9 | water-coloured props (fountain basin) |
| `pal_yellow` | #F6CF6B | school van, bulbs, flags, kites |
| `pal_navy` | #2C3567 | navy (his tee), signage text plates |
| `pal_ink` | #2B2A31 | dark details: cap, beard, hair, tyres, eyes |
| `pal_white` | #FFFFFF | eyes, paper, the paper boat |
| `pal_tan` | #C9955E | his jacket |
| `pal_fur` | #EDE3D3 | his fur collar |
| `pal_skin` | #E9B48F | his skin |
| `pal_glass` | #BFE3EE | glass (roughness 0.15) |
| `pal_emissive` | #FFE6A3 | lamp bulbs, lighthouse lamp (engine makes it glow) |

- Tree trunks in the reference are cream-white (`pal_cream`), canopies are mint, deep green or coral. Follow that.
- Ground cover: little cone grass spikes in `pal_grass_deep` scattered on tile tops (instanced by the engine, so you only provide one or two spike meshes).

## Units, axes, pivots
- 1 Blender unit = 1 metre. Blender Z is up. The exporter converts to Y-up glTF.
- **Front faces Blender -Y.** (The engine treats that as the asset's front.)
- Pivot (object origin) at the **bottom centre** of the footprint, on Z = 0, unless noted.
- Scale reference: the player character is an adult of 1.65 m (he is 26; stylised adult proportions, never chibi). Benches seat height 0.42 m, length 1.6 m. Doors 2.0 m tall. Counters 0.95 m, desks 0.75 m, railings 1.0 m. Trees 2.2 to 4.5 m. Buildings 3 to 9 m tall.
- **Hex tiles are pointy-top** (a vertex points along Blender +Y and -Y), circumradius **2.0 m** (flat-to-flat width 3.464 m). Tile top surface at Z = 0, tile body extends down to Z = -1.2 (below the water line; water sits at Z = -0.55). Tile top edge bevel 0.06 m.

## Pack format
- Each pack is ONE `.glb` containing many assets. Each asset is a **root object (an Empty) named exactly as listed**, with its meshes parented under it, all at the world origin (the engine positions copies). Do not leave stray objects at the root.
- Special named child meshes the engine looks for:
  - `screen`: a flat quad with UVs 0..1 filling it, for billboards, phone faces, laptop screens (engine puts the real screenshot on it). Use material `pal_white`.
  - `label`: a flat quad with UVs 0..1 for signs (engine draws text on it). Use `pal_cream`.
  - `seat` (Empty): where the character sits, at hip height, facing the way the character should face (-Y forward).
  - `use` (Empty): where the character stands to interact, facing the object.
  - `slide_path`: a curve or an ordered set of Empties `slide_0`..`slide_N` from top to bottom of a slide.
  - `bell`, `lid`, `stump_0..2`, `door`, `flag` etc.: separately named moving parts with their pivots at the hinge or axis point, so the engine can animate them.
- **AO:** bake ambient occlusion into a vertex colour attribute named `Col` (Cycles bake, target vertex colors, 64 samples or more) so it exports as COLOR_0. White = unoccluded. If baking a part fails, fill it with white.
- **Export settings:** glTF Binary, +Y up, apply modifiers, include custom properties off, vertex colours on, materials export, **no Draco, no meshopt, no KTX** (they cannot be decoded inside the artifact), no textures unless listed. Animations: export actions as named animations (NLA tracks or "all actions"), sampling rate 24 or 30.
- **Budgets:** character pack under 12k triangles and 40 bones; nature + props pack under 90k triangles; buildings pack under 160k triangles. Each GLB under 3 MB.

## Self-review (mandatory)
- For every asset, render a preview in Blender (EEVEE, 800x600) in a shared look-dev scene that matches the reference: pale pink backdrop (#ECBDB7) wall behind, light blue water plane (#79BFC9), soft key light from upper left with soft shadows (area light, size 4 m or more), world colour a light warm grey (strength around 0.8), filmic/AgX with medium contrast. Three-quarter view from the front left.
- Also render one **contact sheet** of the whole pack together on hex tiles.
- Read your renders. If something looks faceted, plasticky, too detailed, off-palette, or not "toy clay", fix it and re-render. At least three rounds.
- Validate the GLB after export: re-import it into a fresh Blender scene with a script and print the root names, triangle counts per root, material names, and animation names. All names must match this spec.

## Deliverables layout
Put everything in `world/assets/<pack>/`:
- `build_<pack>.py` (the generator script; must rebuild the pack from scratch with one command)
- `<pack>.glb`
- `previews/*.png` and `contact_sheet.png`
- `MANIFEST.md`: one line per root: name, size in metres (x, y, z), triangle count, named special children, and notes.
When your pack is exported and validated, copy the final `<pack>.glb` to `world/src/models/<pack>.glb`.
