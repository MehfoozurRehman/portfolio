# character pack: MANIFEST

File: `character.glb` (1874 KB, glTF binary, no Draco / meshopt / KTX). 39852 triangles in total. AO baked into COLOR_0 (`Col`).
Copied to `world/src/models/character.glb`.

Rebuild: `"/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup --python build_character.py -- all`

## Roots

| root | size x, y, z (m) | triangles | bones | special children | notes |
|---|---|---|---|---|---|
| `player` | 1.29, 0.34, 1.67 | 10973 | 23 | none | Mehfooz, stylised adult (1.65 m). Children: `player_rig` (armature) > `player_mesh` (skinned). Rest pose is an A-pose; play `player_idle` by default. |
| `parrot` | 0.18, 0.28, 0.36 | 2436 | 8 | none | Tota the parrot (0.35 m). Children: `parrot_rig` > `parrot_mesh`. Origin at the feet (perch point). |
| `npc_a` | 1.29, 0.32, 1.65 | 5076 | 23 | none | Young man in a sky-blue shalwar kameez with a dark sadri waistcoat and chappals, short hair, neat beard. Owns the `npc_*` clips. Children: `npc_a_rig` > `npc_a_mesh`. |
| `npc_b` | 1.29, 0.32, 1.66 | 4875 | 23 | none | Elder: cream shalwar kameez, brown shawl, Jinnah cap, grey beard, glasses; walking stick in the left hand (separate skinned child mesh `stick`). Children: `npc_b_rig` > `npc_b_mesh`. |
| `npc_c` | 1.29, 0.34, 1.65 | 4672 | 23 | none | Young woman in a coral shalwar kameez with a mustard dupatta over the shoulders and a long braid. Children: `npc_c_rig` > `npc_c_mesh`. |
| `npc_d` | 1.29, 0.34, 1.66 | 4134 | 23 | none | Young woman in modern clothes: dusty-rose kurti, jeans, sneakers, shoulder bag. Children: `npc_d_rig` > `npc_d_mesh`. |
| `npc_e` | 1.29, 0.32, 1.66 | 3657 | 23 | none | Young man in modern clothes: sage hoodie, jeans, sneakers, phone in the left hand. Children: `npc_e_rig` > `npc_e_mesh`. |
| `npc_f` | 1.02, 0.35, 1.34 | 3945 | 23 | none | School kid (about 1.30 m): light-blue uniform shirt, navy trousers, school bag. Same skeleton; the `npc_f` root carries a 0.79 scale. Children: `npc_f_rig` > `npc_f_mesh`. |

## Skeletons

Humanoid (player and npc_a..npc_f: identical bone names and rest pose, 23 bones): `root`, `hips`, `spine`, `chest`, `neck`, `head`, `eyes`, `shoulder_L`, `upper_arm_L`, `lower_arm_L`, `hand_L`, `fingers_L`, `upper_leg_L`, `lower_leg_L`, `foot_L`, `shoulder_R`, `upper_arm_R`, `lower_arm_R`, `hand_R`, `fingers_R`, `upper_leg_R`, `lower_leg_R`, `foot_R`.

Parrot (8 bones): `root`, `body`, `head`, `beak`, `eyes`, `wing_L`, `wing_R`, `tail`.

- `root` never moves. `hips` (or `body` on the parrot) carries the only translation channel, so every clip is in place (no root motion).
- `eyes` is animated by scale only (blinks). `head` is the bone to turn for look-at. `fingers_*` curl the hands.
- glTF node names must be unique, so three.js GLTFLoader renames the duplicate bones of the 2nd to 4th humanoid (`hips_1`, `hips_2`...). To share clips: after loading, inside each character root strip `/_\d+$/` from bone names, and strip it from the node part of every clip track name too (`hips_3.quaternion` -> `hips.quaternion`). Then any `player_*` or `npc_*` clip drives any of the four humanoids.
- Seated clips (`player_sit`, `player_type`, `player_swing`, `player_slide`, `npc_sit`, `npc_talk`): feet stay on the ground at the origin, the hip joints are at 0.54 m and the seat contact (bottom of the trousers) at 0.46 m. Place the root so the seat surface is 0.46 m above it, directly under the hips, facing -Y; the knees reach 0.37 m forward and the feet rest 0.40 m forward.
- `player_type`: hands at 0.77 m above the floor and 0.36 m in front of the origin (desk top about 0.73 m).
- `player_lean`: forearms on a railing 1.0 m high, 0.45 m in front of the origin.
- `player_swing`: hands hold the chains at x = +/-0.22 m, 1.02 m above the origin.
- Natural ground speed of the in-place cycles at 1x: walk 1.00 m/s, run 2.57 m/s, npc_walk 0.92 m/s. Set the clip timeScale to (speed / natural speed) to avoid foot sliding.

## Animations (30 fps)

| clip | frames | seconds | loop | on |
|---|---|---|---|---|
| `player_idle` | 0-120 | 4.00 | yes | `player_rig` |
| `player_walk` | 0-24 | 0.80 | yes | `player_rig` |
| `player_run` | 0-16 | 0.53 | yes | `player_rig` |
| `player_jump` | 0-16 | 0.53 | once | `player_rig` |
| `player_fall` | 0-20 | 0.67 | yes | `player_rig` |
| `player_land` | 0-14 | 0.47 | once | `player_rig` |
| `player_wave` | 0-48 | 1.60 | once | `player_rig` |
| `player_interact` | 0-30 | 1.00 | once | `player_rig` |
| `player_sit` | 0-90 | 3.00 | yes | `player_rig` |
| `player_swing` | 0-60 | 2.00 | yes | `player_rig` |
| `player_slide` | 0-30 | 1.00 | yes | `player_rig` |
| `player_kick` | 0-24 | 0.80 | once | `player_rig` |
| `player_cheer` | 0-40 | 1.33 | yes | `player_rig` |
| `player_type` | 0-32 | 1.07 | yes | `player_rig` |
| `player_lean` | 0-90 | 3.00 | yes | `player_rig` |
| `npc_idle` | 0-120 | 4.00 | yes | `npc_a_rig` |
| `npc_walk` | 0-26 | 0.87 | yes | `npc_a_rig` |
| `npc_sit` | 0-90 | 3.00 | yes | `npc_a_rig` |
| `npc_talk` | 0-96 | 3.20 | yes | `npc_a_rig` |
| `npc_wave` | 0-48 | 1.60 | once | `npc_a_rig` |
| `parrot_idle` | 0-90 | 3.00 | yes | `parrot_rig` |
| `parrot_fly` | 0-12 | 0.40 | yes | `parrot_rig` |
| `parrot_hop` | 0-18 | 0.60 | once | `parrot_rig` |
| `parrot_talk` | 0-24 | 0.80 | yes | `parrot_rig` |

## Materials

`pal_coral`, `pal_coral_deep`, `pal_cream`, `pal_fur`, `pal_grass`, `pal_grass_deep`, `pal_grass_light`, `pal_ink`, `pal_kameez_a`, `pal_kameez_b`, `pal_kameez_c`, `pal_kameez_d`, `pal_navy`, `pal_peach`, `pal_pink`, `pal_skin`, `pal_sky`, `pal_stone`, `pal_tan`, `pal_white`, `pal_wood`, `pal_wood_dark`, `pal_yellow`

Palette-adjacent cloth colours added for the townsfolk (map them to shared clay materials like the other `pal_*`): `pal_kameez_a` #D9A3A0, `pal_kameez_b` #A9C2A2, `pal_kameez_c` #A7C7DD, `pal_kameez_d` #DDB85E (dusty rose, sage, sky, mustard).

## Townsfolk notes

- `npc_b` has a second skinned mesh named `stick` (walking stick, bound to `hand_L`) under `npc_b_rig`.
- `npc_f` (kid) uses the same skeleton; its root Empty carries a uniform scale of 0.79, so keep the root scale when cloning. All clips work unchanged; its seated contact height is 0.36 m.
- Kameez/kurti skirts are weighted partly to the thighs so they follow walking and sitting.

## Validation (read back from the exported GLB)

```
roots: npc_a, npc_b, npc_c, npc_d, npc_e, npc_f, parrot, player
mesh npc_a_mesh   tris= 5076 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_skin,pal_ink,pal_white,pal_wood_dark,pal_coral_deep,pal_kameez_c,pal_cream
mesh npc_b_mesh   tris= 4875 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_wood,pal_stone,pal_white,pal_wood_dark,pal_ink,pal_coral_deep,pal_cream
mesh stick        tris=   84 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_wood_dark
mesh npc_c_mesh   tris= 4672 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_peach,pal_ink,pal_white,pal_wood_dark,pal_coral_deep,pal_coral,pal_cream,pal_kameez_d
mesh npc_d_mesh   tris= 4134 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_skin,pal_wood_dark,pal_white,pal_ink,pal_coral_deep,pal_kameez_a,pal_navy,pal_cream,pal_kameez_d
mesh npc_e_mesh   tris= 3657 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_wood,pal_ink,pal_white,pal_wood_dark,pal_coral_deep,pal_kameez_b,pal_navy,pal_cream,pal_sky
mesh npc_f_mesh   tris= 3945 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_skin,pal_ink,pal_white,pal_wood_dark,pal_coral_deep,pal_sky,pal_navy,pal_cream,pal_coral
mesh parrot_mesh  tris= 2436 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_grass,pal_grass_light,pal_coral,pal_coral_deep,pal_white,pal_ink,pal_grass_deep,pal_pink,pal_yellow
mesh player_mesh  tris=10973 attrs=COLOR_0,JOINTS_0,NORMAL,POSITION,WEIGHTS_0 mats=pal_skin,pal_ink,pal_white,pal_wood_dark,pal_coral,pal_navy,pal_tan,pal_fur,pal_cream
skin npc_a_rig  joints=23
skin npc_b_rig  joints=23
skin npc_c_rig  joints=23
skin npc_d_rig  joints=23
skin npc_e_rig  joints=23
skin npc_f_rig  joints=23
skin parrot_rig joints=8
skin player_rig joints=23
anim npc_idle         4.000s channels=69
anim npc_walk         0.867s channels=69
anim npc_sit          3.000s channels=69
anim npc_talk         3.200s channels=69
anim npc_wave         1.600s channels=69
anim parrot_idle      3.000s channels=24
anim parrot_fly       0.400s channels=24
anim parrot_hop       0.600s channels=24
anim parrot_talk      0.800s channels=24
anim player_idle      4.000s channels=69
anim player_walk      0.800s channels=69
anim player_run       0.533s channels=69
anim player_jump      0.533s channels=69
anim player_fall      0.667s channels=69
anim player_land      0.467s channels=69
anim player_wave      1.600s channels=69
anim player_interact  1.000s channels=69
anim player_sit       3.000s channels=69
anim player_swing     2.000s channels=69
anim player_slide     1.000s channels=69
anim player_kick      0.800s channels=69
anim player_cheer     1.333s channels=69
anim player_type      1.067s channels=69
anim player_lean      3.000s channels=69
extensionsUsed: []
```
