"""Launch Isles - NATURE + TILES + PROPS pack generator.

Rebuild everything from scratch with one command (Git Bash):
  "/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup --python build_nature.py

Optional phases after `--`:  build  render  sheet   (default: all three)
  render only=bench,slide   renders a subset of previews.

Phase build : models every asset procedurally, bakes Cycles AO into vertex colour `Col`,
              exports nature.glb (no Draco/meshopt/KTX) and cleans node names.
Phase render: re-imports the GLB into a fresh scene (validation printout + MANIFEST.md),
              swaps palette materials for look-dev clay and renders previews/<root>.png.
Phase sheet : renders contact_sheet.png, a diorama recreating the reference composition.
"""
import bpy, bmesh, math, os, sys, random, json, struct, re, shutil, time
from math import sin, cos, pi, sqrt, atan2, asin, radians
from mathutils import Vector, Matrix, Euler, noise

HERE = os.path.dirname(os.path.abspath(__file__))
GLB = os.path.join(HERE, 'nature.glb')
PREV = os.path.join(HERE, 'previews')
SHEET = os.path.join(HERE, 'contact_sheet.png')
MANIFEST = os.path.join(HERE, 'MANIFEST.md')
SRC_MODELS = os.path.normpath(os.path.join(HERE, '..', '..', 'src', 'models'))

ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
PHASES = [a for a in ARGV if a in ('build', 'render', 'sheet')] or ['build', 'render', 'sheet']
ONLY = None
for a in ARGV:
    if a.startswith('only='):
        ONLY = set(a[5:].split(','))

PAL = {
    'pal_grass': '#74C391', 'pal_grass_light': '#9ED6A8', 'pal_grass_deep': '#2E9B78', 'pal_leaf_dark': '#1F7A60',
    'pal_coral': '#F28C6F', 'pal_coral_deep': '#DC6B52', 'pal_peach': '#F7B79F', 'pal_cream': '#F3EDE6',
    'pal_stone': '#E3D8CF', 'pal_sand': '#F1DCC2', 'pal_wood': '#C98C62', 'pal_wood_dark': '#8E5B3D',
    'pal_pink': '#ECBDB7', 'pal_sky': '#A9D6E5', 'pal_water': '#79BFC9', 'pal_yellow': '#F6CF6B',
    'pal_navy': '#2C3567', 'pal_ink': '#2B2A31', 'pal_white': '#FFFFFF', 'pal_tan': '#C9955E',
    'pal_fur': '#EDE3D3', 'pal_skin': '#E9B48F', 'pal_glass': '#BFE3EE', 'pal_emissive': '#FFE6A3',
}
Z = Vector((0, 0, 1))


def s2l(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexcol(h):
    h = h.lstrip('#')
    return tuple(s2l(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def ls(a, b, n):
    return [a + (b - a) * i / (n - 1) for i in range(n)] if n > 1 else [a]


def smooth01(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


# ----------------------------------------------------------------------------- scene utils
def scene():
    return bpy.context.scene


def link(ob):
    scene().collection.objects.link(ob)
    return ob


def vl_update():
    bpy.context.view_layer.update()


def node_tree_of(idblock):
    if idblock.node_tree is None:
        try:
            idblock.use_nodes = True
        except Exception:
            pass
    return idblock.node_tree


def get_mat(name):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    nt = node_tree_of(m)
    b = nt.nodes.get('Principled BSDF')
    col = hexcol(PAL[name])
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = 0.15 if name == 'pal_glass' else 0.9
    b.inputs['Metallic'].default_value = 0.0
    if name == 'pal_emissive':
        b.inputs['Emission Color'].default_value = (*col, 1)
        b.inputs['Emission Strength'].default_value = 1.0
    m.diffuse_color = (*col, 1)
    m.roughness = 0.9
    return m


# ----------------------------------------------------------------------------- mesh building
def mk(name, bm, mat, smooth=True):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    if isinstance(mat, (list, tuple)):
        for m in mat:
            me.materials.append(get_mat(m))
    elif mat:
        me.materials.append(get_mat(mat))
    if smooth:
        me.shade_smooth()
    return link(bpy.data.objects.new(name, me))


def place(ob, loc=(0, 0, 0), rot=None):
    M = Matrix.Translation(Vector(loc))
    if rot is not None:
        M = M @ (rot.to_4x4() if isinstance(rot, Matrix) else Euler(rot).to_matrix().to_4x4())
    ob.matrix_world = M
    return ob


def bevel(ob, w, segs=3, angle=None):
    m = ob.modifiers.new('bv', 'BEVEL')
    m.width = w
    m.segments = segs
    m.profile = 0.5
    m.harden_normals = False
    m.use_clamp_overlap = True
    if angle is None:
        m.limit_method = 'NONE'
    else:
        m.limit_method = 'ANGLE'
        m.angle_limit = radians(angle)
    return ob


def wnorm(ob):
    m = ob.modifiers.new('wn', 'WEIGHTED_NORMAL')
    m.mode = 'FACE_AREA'
    m.weight = 50
    m.keep_sharp = True
    return ob


def apply_mods(ob):
    if ob.type != 'MESH' or not ob.modifiers:
        return ob
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    me.name = ob.name
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return ob


def bake_xform(ob):
    """Bake object transform into mesh data (object ends at identity)."""
    ob.data.transform(ob.matrix_world)
    ob.matrix_world = Matrix.Identity(4)


def join(objs, name):
    objs = [o for o in objs if o is not None]
    for o in objs:
        apply_mods(o)
    vl_update()
    act = objs[0]
    if len(objs) > 1:
        with bpy.context.temp_override(active_object=act, object=act, selected_objects=objs,
                                       selected_editable_objects=objs):
            bpy.ops.object.join()
    act.name = name
    act.data.name = name
    bake_xform(act)
    return act


def pivot_mesh(name, objs, pivot, rot=None):
    """Join objs into one mesh whose origin sits at `pivot` (the hinge / axis)."""
    ob = join(objs if isinstance(objs, list) else [objs], name)
    pivot = Vector(pivot)
    R = (Euler(rot).to_matrix().to_4x4() if rot else Matrix.Identity(4))
    ob.data.transform(R.inverted() @ Matrix.Translation(-pivot))
    ob.matrix_world = Matrix.Translation(pivot) @ R
    return ob


def pivot_node(a, name, objs, pivot, parent=None, rot=None):
    """Moving part: an Empty named `name` at the hinge/axis with the joined geometry `<name>_geo` under it."""
    e = empty(name, Vector(pivot), rot or (0, 0, 0), kind='PLAIN_AXES')
    a.node(e, parent)
    g = pivot_mesh(name + '_geo', objs if isinstance(objs, list) else [objs], pivot, rot)
    a.node(g, e)
    return e


def plank(name, size, loc, mat, bev=0.03, grooves=2, depth=0.011, rot=None):
    """Rounded plank with soft wood-grain grooves running along X on its +Z face."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    sy = size[1]
    ys = [(-sy / 2 + sy * (k + 1) / (grooves + 1)) for k in range(grooves)]
    hw = min(0.014, sy / (grooves + 1) * 0.34)
    for y0 in ys:
        for c in (y0 - hw, y0 - hw * 0.4, y0 + hw * 0.4, y0 + hw):
            geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
            bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, c, 0), plane_no=(0, 1, 0))
    ob = mk(name, bm, mat)
    bevel(ob, min(bev, min(size) * 0.49), 2, angle=30)
    apply_mods(ob)
    top = size[2] / 2
    for v in ob.data.vertices:
        if v.co.z > top - 1e-4 and any(abs(v.co.y - y0) < hw * 0.41 for y0 in ys):
            v.co.z -= depth
    ob.data.update()
    wnorm(ob)
    return place(ob, loc, rot)


def bolt(name, p, axis, r=0.026, h=0.022, mat='pal_stone'):
    """Little round bolt head; `axis` is the outward direction."""
    p = Vector(p)
    ax = Vector(axis).normalized()
    prof = [(0, 0), (r, 0), (r, h * 0.55), (r * 0.62, h), (0, h * 1.05)]
    return lathe(name, prof, mat, 8, p - ax * h * 0.4, Z.rotation_difference(ax).to_matrix())


def bm_lathe(prof, segs=24, cap=True, phase=0.0):
    bm = bmesh.new()
    rings = []
    for r, z in prof:
        if r <= 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * cos(2 * pi * j / segs + phase), r * sin(2 * pi * j / segs + phase), z))
                          for j in range(segs)])
    for A, B in zip(rings, rings[1:]):
        if len(A) == 1 and len(B) == 1:
            continue
        for j in range(segs):
            k = (j + 1) % segs
            if len(A) == 1:
                bm.faces.new((A[0], B[k], B[j]))
            elif len(B) == 1:
                bm.faces.new((A[j], A[k], B[0]))
            else:
                bm.faces.new((A[j], A[k], B[k], B[j]))
    if cap:
        if len(rings[0]) > 1:
            bm.faces.new(list(reversed(rings[0])))
        if len(rings[-1]) > 1:
            bm.faces.new(rings[-1])
    return bm


def dedupe(pts, eps=1e-6):
    out = []
    for p in pts:
        if not out or abs(out[-1][0] - p[0]) > eps or abs(out[-1][1] - p[1]) > eps:
            out.append(p)
    return out


def arc(cx, cz, r, a0, a1, n):
    return [(cx + r * cos(a), cz + r * sin(a)) for a in ls(a0, a1, n)]


def rcyl_prof(r, h, c=None, cb=None, rt=None, bulge=0.0, bbulge=None, n=4, z0=0.0):
    """Rounded cylinder / cushion profile (radius, z) from bottom pole to top pole."""
    rt = r if rt is None else rt
    c = min(h / 2, r * 0.9) * 0.5 if c is None else c
    cb = c if cb is None else cb
    bbulge = bulge if bbulge is None else bbulge
    pts = [(0, z0 - bbulge)]
    if bbulge:
        pts.append((r * 0.55, z0 - bbulge * 0.72))
    pts += arc(r - cb, z0 + cb, cb, -pi / 2, 0, n + 1) if cb > 1e-4 else [(r, z0)]
    pts += arc(rt - c, z0 + h - c, c, 0, pi / 2, n + 1) if c > 1e-4 else [(rt, z0 + h)]
    if bulge:
        pts.append((rt * 0.55, z0 + h + bulge * 0.72))
    pts.append((0, z0 + h + bulge))
    return dedupe(pts)


def sphere_prof(r, rings=12, cz=0.0):
    return [(r * sin(t), cz - r * cos(t)) for t in ls(0, pi, rings + 1)]


def drop_prof(R, H, rt, n1=10, n2=6, z0=0.0):
    """Teardrop: big circle R at the bottom, small circle rt at the top, joined by a tangent."""
    c1, c2 = R, H - rt
    d = c2 - c1
    alpha = asin(min(0.999, (R - rt) / d)) if d > 1e-6 else 0.0
    pts = [(R * cos(a), z0 + c1 + R * sin(a)) for a in ls(-pi / 2, alpha, n1)]
    pts += [(rt * cos(a), z0 + c2 + rt * sin(a)) for a in ls(alpha, pi / 2, n2)]
    pts[0] = (0, pts[0][1])
    pts[-1] = (0, pts[-1][1])
    return dedupe(pts)


def capsule_prof(L, r0, r1=None, rings=4):
    r1 = r0 if r1 is None else r1
    pts = [(r0 * cos(a), r0 + r0 * sin(a)) for a in ls(-pi / 2, 0, rings + 1)]
    pts += [(r1 * cos(a), L - r1 + r1 * sin(a)) for a in ls(0, pi / 2, rings + 1)]
    pts[0] = (0, 0)
    pts[-1] = (0, L)
    return dedupe(pts)


def lathe(name, prof, mat, segs=24, loc=(0, 0, 0), rot=None, cap=True, deform=None, scale=None, phase=0.0):
    bm = bm_lathe(prof, segs, cap, phase)
    if scale:
        for v in bm.verts:
            v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    if deform:
        for v in bm.verts:
            v.co = Vector(deform(v.co))
    return place(mk(name, bm, mat), loc, rot)


def sphere(name, r, loc, mat, segs=20, rings=12, scale=None, rot=None, deform=None):
    return lathe(name, sphere_prof(r, rings), mat, segs, loc, rot, scale=scale, deform=deform)


def orient(p0, p1):
    d = (Vector(p1) - Vector(p0))
    return Z.rotation_difference(d.normalized()).to_matrix()


def capsule(name, p0, p1, r, mat, segs=12, rings=4, r1=None):
    L = (Vector(p1) - Vector(p0)).length
    r1 = r if r1 is None else r1
    L = max(L, r + r1 + 1e-4)
    return lathe(name, capsule_prof(L, r, r1, rings), mat, segs, p0, orient(p0, p1))


def rod(name, p0, p1, r, mat, c=None, segs=14, rt=None, n=3):
    L = (Vector(p1) - Vector(p0)).length
    c = r * 0.45 if c is None else c
    return lathe(name, rcyl_prof(r, L, c=c, rt=rt, n=n), mat, segs, p0, orient(p0, p1))


def rbox(name, size, loc, mat, bev=0.03, segs=3, rot=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    ob = mk(name, bm, mat)
    bevel(ob, min(bev, min(size) * 0.49), segs)
    wnorm(ob)
    return place(ob, loc, rot)


def bm_sweep(path, prof_fn, ref=Z):
    """Sweep a closed 2D profile along a path. prof_fn(u) -> list of (side, up) points or [(0,0)] for a point."""
    n = len(path)
    bm = bmesh.new()
    rings = []
    for i, P in enumerate(path):
        u = i / (n - 1)
        T = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        side = T.cross(ref)
        if side.length < 1e-5:
            side = T.cross(Vector((1, 0, 0)))
        side.normalize()
        up = side.cross(T).normalized()
        pts = prof_fn(u)
        if len(pts) == 1:
            rings.append([bm.verts.new(P + side * pts[0][0] + up * pts[0][1])])
        else:
            rings.append([bm.verts.new(P + side * a + up * b) for a, b in pts])
    m = max(len(r) for r in rings)
    for A, B in zip(rings, rings[1:]):
        if len(A) == 1 and len(B) == 1:
            continue
        for j in range(m):
            k = (j + 1) % m
            if len(A) == 1:
                bm.faces.new((A[0], B[k], B[j]))
            elif len(B) == 1:
                bm.faces.new((A[j], A[k], B[0]))
            else:
                bm.faces.new((A[j], A[k], B[k], B[j]))
    if len(rings[0]) > 1:
        bm.faces.new(rings[0])
    if len(rings[-1]) > 1:
        bm.faces.new(list(reversed(rings[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def circle_pts(r, n, sx=1.0, sy=1.0):
    return [(r * sx * cos(2 * pi * j / n), r * sy * sin(2 * pi * j / n)) for j in range(n)]


def tube(name, path, r_fn, mat, sides=10, ref=Z):
    def prof(u):
        r = r_fn(u)
        return [(0, 0)] if r < 1e-5 else circle_pts(r, sides)
    return mk(name, bm_sweep(path, prof, ref), mat)


def bezier(p0, p1, p2, n, p3=None):
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    out = []
    for t in ls(0, 1, n):
        if p3 is None:
            out.append((1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2)
        else:
            q = Vector(p3)
            out.append((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * q)
    return out


def leaf(name, base, az, elev, L, W, T, mat, droop=0.3, fold=0.25, nu=10, nv=8, wshape='lance', twist=0.0):
    """A thick clay leaf / blade swept along an arcing path."""
    base = Vector(base)
    d = Vector((cos(az) * cos(elev), sin(az) * cos(elev), sin(elev)))
    path = [base + d * (L * u) - Z * (droop * L * u * u) for u in ls(0, 1, nu)]

    def prof(u):
        if wshape == 'blade':          # agave: wide base, sharp tip
            k = (1 - u) ** 0.9 * min(1.0, 0.35 + u * 5)
        elif wshape == 'frond':        # palm: narrow stalk, broad middle, pointed tip
            k = sin(pi * min(1.0, u ** 0.75)) ** 0.7
        else:                          # lance leaf
            k = sin(pi * min(1.0, u ** 0.8)) ** 0.85
        w, t = W * k, T * max(0.25, k ** 0.5)
        if u >= 1.0 or w < 1e-4:
            return [(0, 0)]
        return [(w * cos(th), t * sin(th) + fold * w * abs(cos(th))) for th in ls(0, 2 * pi, nv + 1)[:-1]]
    return mk(name, bm_sweep(path, prof), mat)


def bm_hex(R, ztop, zbot, cuts=(), rot=90.0):
    bm = bmesh.new()
    zs = [zbot] + sorted(cuts) + [ztop]
    rings = [[bm.verts.new((R * cos(radians(rot + 60 * k)), R * sin(radians(rot + 60 * k)), z)) for k in range(6)]
             for z in zs]
    for A, B in zip(rings, rings[1:]):
        for k in range(6):
            j = (k + 1) % 6
            bm.faces.new((A[k], A[j], B[j], B[k]))
    bm.faces.new(rings[-1])
    bm.faces.new(list(reversed(rings[0])))
    return bm


def hex_solid(name, R, ztop, zbot, top_mat, side_mat, bev_top=0.06, bev_side=0.06, bev_bot=0.0, segs=3,
              top_band=None):
    """Pointy-top hex prism, rounded vertical edges and top edge; top faces get top_mat.
    top_band > bevel gives a clay 'frosting' lip of top_mat down the sides."""
    lip = top_band is not None and top_band > bev_top + 0.01
    bm = bm_hex(R, ztop, zbot, cuts=[ztop - top_band] if lip else [])
    if bev_side > 0:
        vert_edges = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-4]
        bmesh.ops.bevel(bm, geom=vert_edges, offset=bev_side, offset_type='OFFSET', segments=segs, profile=0.5,
                        affect='EDGES', clamp_overlap=True)
    bm.normal_update()
    if bev_top > 0:
        top = max(bm.faces, key=lambda f: f.calc_center_median().z + (f.normal.z > 0.99) * 100)
        bmesh.ops.bevel(bm, geom=list(top.edges), offset=bev_top, offset_type='OFFSET', segments=segs,
                        profile=0.5, affect='EDGES', clamp_overlap=True)
    if bev_bot > 0:
        bot = min(bm.faces, key=lambda f: f.calc_center_median().z - (f.normal.z < -0.99) * 100)
        bmesh.ops.bevel(bm, geom=list(bot.edges), offset=bev_bot, offset_type='OFFSET', segments=2,
                        profile=0.5, affect='EDGES', clamp_overlap=True)
    band = (bev_top + 0.004) if not lip else top_band + 1e-4
    for f in bm.faces:
        f.material_index = 0 if f.calc_center_median().z > ztop - band else 1
        f.smooth = True
    ob = mk(name, bm, [top_mat, side_mat])
    wnorm(ob)
    return ob


def poly_prism(name, pts2d, y0, y1, mat, plane='XZ'):
    """Extrude a 2D polygon (x, z) along Y from y0 to y1."""
    bm = bmesh.new()
    a = [bm.verts.new((x, y0, z)) for x, z in pts2d]
    b = [bm.verts.new((x, y1, z)) for x, z in pts2d]
    n = len(pts2d)
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return mk(name, bm, mat)


def empty(name, loc, rot=(0, 0, 0), size=0.12, kind='ARROWS'):
    ob = bpy.data.objects.new(name, None)
    ob.empty_display_type = kind
    ob.empty_display_size = size
    ob.location = loc
    ob.rotation_euler = rot
    return link(ob)


def reparent(ob, p):
    vl_update()
    w = ob.matrix_world.copy()
    ob.parent = p
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.matrix_world = w
    vl_update()


# ----------------------------------------------------------------------------- asset registry
ASSETS = []


class Asset:
    def __init__(self, name, kind='nature', ground=True, floor=0.0, note=''):
        self.name, self.kind, self.ground, self.floor, self.note = name, kind, ground, floor, note
        self.parts, self.nodes = [], []
        self.root = empty(name, (0, 0, 0), size=0.4, kind='PLAIN_AXES')
        ASSETS.append(self)

    def add(self, *obs):
        self.parts += [o for o in obs if o is not None]
        return obs[0]

    def node(self, ob, parent=None):
        self.nodes.append((ob, parent))
        return ob


def finalize(a):
    for ob, _ in a.nodes:
        apply_mods(ob)
    if a.parts:
        g = join(a.parts, a.name + '_mesh')
        reparent(g, a.root)
    for ob, p in a.nodes:
        reparent(ob, p or a.root)


R = random.Random(7)


# ============================================================================= TILES
def build_tiles():
    for name, top in (('hex_grass', 'pal_grass'), ('hex_grass_deep', 'pal_grass_deep'), ('hex_sand', 'pal_sand'),
                      ('hex_stone', 'pal_stone'), ('hex_cream', 'pal_cream')):
        a = Asset(name, 'tile', ground=False, note='pointy-top hex R2.0, top Z0, body to Z-1.2; top colour wraps 0.1 m over the edge')
        a.add(hex_solid(name + '_body', 2.0, 0.0, -1.2, top, 'pal_cream',
                        top_band=None if top == 'pal_cream' else 0.1))
    a = Asset('hex_column', 'tile', ground=False, note='cream column under raised tiles, top Z0 to Z-4')
    a.add(hex_solid('hex_column_body', 2.0, 0.0, -4.0, 'pal_cream', 'pal_cream', bev_top=0.0))
    a = Asset('hex_step', 'tile', ground=False, note='stepping stone R0.8, top Z0, body to Z-1.2')
    a.add(hex_solid('hex_step_body', 0.8, 0.0, -1.2, 'pal_stone', 'pal_cream', bev_top=0.06, bev_side=0.08))
    a = Asset('hex_planter', 'tile', note='raised plinth R1.0, 0.35 tall, origin at bottom')
    a.add(hex_solid('hex_planter_plinth', 1.0, 0.31, 0.0, 'pal_cream', 'pal_cream', bev_top=0.05, bev_side=0.09))
    a.add(hex_solid('hex_planter_top', 0.86, 0.35, 0.22, 'pal_grass_deep', 'pal_grass_deep', bev_top=0.06,
                    bev_side=0.1))


# ============================================================================= TREES & PLANTS
def trunk(name, h, r, mat='pal_cream', flare=1.38, taper=0.78, segs=16, z0=0.0):
    pts = [(0, z0), (r * flare * 0.86, z0), (r * flare * 0.98, z0 + 0.012)]
    for z in ls(0.035, h, 8):
        k = z / h
        rr = r * (1 - (1 - taper) * k) + r * (flare - 1) * math.exp(-z / (0.11 * h + 1e-6))
        pts.append((rr, z0 + z))
    pts += [(r * taper * 0.6, z0 + h + 0.03), (0, z0 + h + 0.045)]
    return lathe(name, pts, mat, segs)


def tulip_head(name, tip, col, hr=0.058, hh=0.115, rot=None):
    def tdef(co):
        sv = max(0.0, co.z / hh)
        th = atan2(co.y, co.x)
        rxy = sqrt(co.x ** 2 + co.y ** 2)
        k = 1 + 0.07 * cos(3 * th) * sv
        z = co.z
        if sv > 0.55:
            q = (sv - 0.55) / 0.45
            z += 0.32 * hh * q * q * (0.5 + 0.5 * cos(3 * th)) - 0.25 * hh * q * q * max(0, 1 - rxy / (0.7 * hr))
        return (co.x * k, co.y * k, z)
    prof = [(hr * sin(t) * (0.82 + 0.18 * sin(t)), hh * 0.5 - hh * 0.5 * cos(t)) for t in ls(0, pi * 0.82, 9)]
    prof = [(0, 0)] + prof[1:] + [(0, hh * 0.96)]
    rot = rot or Euler((R.uniform(-0.12, 0.12), R.uniform(-0.12, 0.12), R.uniform(0, 2)))
    return lathe(name, prof, col, 12, loc=Vector(tip) - Vector((0, 0, 0.02)), rot=rot, deform=tdef)


def flower_head(name, p, r, col, eye=None, rot=None, petals=5, segs=15):
    """Puffy 5-lobed clay flower with a round centre; returns [petals, eye]."""
    def fdef(co):
        th = atan2(co.y, co.x)
        k = 1 + 0.3 * cos(petals * th)
        return (co.x * k, co.y * k, co.z * 0.42)
    eye = eye or ('pal_peach' if col == 'pal_yellow' else 'pal_yellow')
    rot = rot or Euler((0, 0, 0))
    M = rot.to_matrix() if isinstance(rot, Euler) else rot
    head = sphere(name, r, p, col, segs, 8, deform=fdef, rot=M)
    e = sphere(name + '_eye', r * 0.38, Vector(p) + M @ Vector((0, 0, r * 0.28)), eye, 8, 5, scale=(1, 1, 0.72), rot=M)
    return [head, e]


def build_trees():
    # --- stacked cushion tree
    a = Asset('tree_cushion_deep', note='stacked rounded cushions')
    a.add(trunk('tcd_trunk', 1.0, 0.115))
    z = 0.72
    for i, (r, h) in enumerate([(0.92, 0.44), (0.74, 0.40), (0.55, 0.36), (0.34, 0.31)]):
        a.add(lathe('tcd_cush%d' % i, rcyl_prof(r, h, c=h * 0.47, bulge=0.035, n=4, z0=z), 'pal_grass_deep', 20,
                    loc=(R.uniform(-0.03, 0.03), R.uniform(-0.03, 0.03), 0)))
        z += h * 0.8

    # --- pear trees (teardrop canopy)
    for name, mat, Rr, H, rt, tz, th in (('tree_pear_mint', 'pal_grass', 0.66, 1.85, 0.2, 0.55, 0.8),
                                         ('tree_pear_light', 'pal_grass_light', 0.54, 1.5, 0.17, 0.48, 0.7)):
        a = Asset(name, note='teardrop canopy')
        a.add(trunk(name + '_trunk', th, 0.105))
        a.add(lathe(name + '_canopy', drop_prof(Rr, H, rt, 12, 7, z0=tz), mat, 26))

    # --- capsule coral
    a = Asset('tree_capsule_coral', note='tall capsule canopy')
    a.add(trunk('tcc_trunk', 0.85, 0.1))
    a.add(lathe('tcc_canopy', drop_prof(0.42, 2.0, 0.37, 10, 9, z0=0.6), 'pal_coral', 28))

    # --- blob trees
    for name, mat, blobs, th in (
        ('tree_blob_coral', 'pal_coral',
         [(0, 0, 1.22, 0.56), (0.36, -0.1, 1.0, 0.36), (-0.36, 0.08, 1.04, 0.35), (0.04, 0.04, 1.86, 0.42),
          (-0.02, -0.02, 2.33, 0.25)], 1.05),
        ('tree_blob_mint', 'pal_grass',
         [(0, 0.02, 1.2, 0.54), (0.4, 0.12, 1.06, 0.38), (-0.38, 0.16, 1.1, 0.37), (0.04, -0.36, 1.02, 0.36),
          (0.06, 0.08, 1.68, 0.4)], 1.0)):
        a = Asset(name, note='cluster of 5 spheres')
        a.add(trunk(name + '_trunk', th, 0.105))
        for i, (x, y, zz, r) in enumerate(blobs):
            a.add(sphere('%s_b%d' % (name, i), r, (x, y, zz), mat, 16, 11))

    # --- palm
    a = Asset('palm', note='curved ringed trunk, 7 fronds')
    path = bezier((0, 0, 0), (0.0, 0, 1.25), (0.58, 0, 2.35), 30)

    def palm_r(u):
        rings = 0.5 + 0.5 * cos(2 * pi * u * 7.5)
        r = (0.145 - 0.06 * u) * (1 + 0.075 * rings) + 0.08 * math.exp(-u * 14)
        if u > 0.985:
            return 0.0
        return r
    a.add(tube('palm_trunk', path, palm_r, 'pal_cream', sides=12, ref=Vector((0, 1, 0))))
    top = path[-1] + Vector((0.02, 0, 0.0))
    a.add(sphere('palm_crown', 0.13, top + Vector((0, 0, 0.02)), 'pal_grass_deep', 16, 10))
    for i in range(7):
        az = i * 2 * pi / 7 + 0.25 + R.uniform(-0.12, 0.12)
        a.add(leaf('palm_frond%d' % i, top + Vector((0, 0, 0.05)), az, radians(R.uniform(22, 34)), 1.3,
                   0.23, 0.028, 'pal_grass_deep', droop=0.62, fold=-0.22, nu=11, nv=6, wshape='frond'))
    for i, az in enumerate((0.6, 2.7, 4.6)):
        a.add(sphere('palm_nut%d' % i, 0.075, top + Vector((cos(az) * 0.12, sin(az) * 0.12, -0.1)),
                     'pal_wood', 10, 6))

    # --- agave
    a = Asset('agave', note='rosette of thick blades')
    for i in range(8):
        az = i * 2 * pi / 8
        a.add(leaf('agave_o%d' % i, (cos(az) * 0.05, sin(az) * 0.05, 0.0), az, radians(32), 0.72, 0.14, 0.04,
                   'pal_leaf_dark', droop=0.32, fold=0.32, nu=8, nv=6, wshape='blade'))
    for i in range(5):
        az = i * 2 * pi / 5 + 0.4
        a.add(leaf('agave_i%d' % i, (cos(az) * 0.03, sin(az) * 0.03, 0.02), az, radians(62), 0.62, 0.12, 0.04,
                   'pal_grass_deep', droop=0.18, fold=0.3, nu=8, nv=6, wshape='blade'))

    # --- finger cactus
    a = Asset('cactus_finger', note='cluster of rounded fingers')
    fingers = [(0, 0, 0.95, 0.12), (0.19, 0.06, 0.72, 0.105), (-0.17, 0.11, 0.8, 0.105), (0.05, -0.18, 0.62, 0.1),
               (-0.1, -0.13, 0.5, 0.095), (0.22, -0.13, 0.44, 0.09)]
    tips = []
    for i, (x, y, h, r) in enumerate(fingers):
        lean = Vector((x, y, 0)) * 0.35
        p1 = Vector((x, y, -0.02)) + Vector((lean.x * h, lean.y * h, h))
        a.add(capsule('cf_f%d' % i, (x, y, -0.03), p1, r, 'pal_leaf_dark', 12, 4, r1=r * 0.92))
        tips.append((p1, r))
    arm = bezier((0.02, 0.0, 0.42), (0.34, 0.0, 0.42), (0.33, -0.02, 0.78), 12)
    a.add(tube('cf_arm', arm, lambda u: 0.075 if u < 0.97 else 0.0, 'pal_leaf_dark', 12))
    a.add(sphere('cf_armtip', 0.075, (0.33, -0.02, 0.76), 'pal_leaf_dark', 12, 8))
    for i in (0, 2):
        p, r = tips[i]
        a.add(sphere('cf_bud%d' % i, 0.045, p + Vector((0, 0, -0.005)), 'pal_coral', 12, 8))

    # --- tulips
    a = Asset('tulips', note='5 coral tulips with leaves')
    spots = [(0, 0, 0.46), (0.12, 0.05, 0.38), (-0.11, 0.07, 0.4), (0.05, -0.11, 0.33), (-0.06, -0.09, 0.36)]
    for i, (x, y, h) in enumerate(spots):
        tip = Vector((x * 1.5, y * 1.5, h))
        stem = bezier((x, y, 0), (x, y, h * 0.5), tip, 8)
        a.add(tube('tul_stem%d' % i, stem, lambda u: 0.012, 'pal_grass', 6))
        a.add(tulip_head('tul_head%d' % i, tip, 'pal_coral_deep' if i == 3 else 'pal_coral'))
    for i, az in enumerate((0.3, 2.4, 4.3)):
        a.add(leaf('tul_leaf%d' % i, (0, 0, 0), az, radians(66), 0.27, 0.05, 0.012, 'pal_grass_deep', droop=0.25,
                   fold=0.25, nu=8, nv=6))

    # --- round bush
    a = Asset('bush_round', note='clustered spheres')
    for i, (x, y, zz, r) in enumerate([(0, 0.02, 0.36, 0.42), (0.36, 0.1, 0.26, 0.3), (-0.34, 0.1, 0.27, 0.31),
                                        (0.06, -0.3, 0.24, 0.29), (0.02, 0.3, 0.3, 0.29)]):
        a.add(sphere('bush_b%d' % i, r, (x, y, zz), 'pal_grass', 14, 9, scale=(1, 1, 0.92)))

    # --- grass spike / tuft
    def spike_prof(h=0.14, r=0.036):
        return [(r, -0.012), (r * 0.95, h * 0.15), (r * 0.74, h * 0.42), (r * 0.46, h * 0.7), (r * 0.2, h * 0.9),
                (0, h)]
    a = Asset('grass_spike', note='single instanced cone, 0.14 m')
    a.add(lathe('gs_spike', spike_prof(), 'pal_grass_deep', 8, cap=False))
    a = Asset('grass_tuft', note='5 spikes')
    for i, (az, dist, h, tilt) in enumerate([(0, 0, 0.155, 0), (0.4, 0.05, 0.12, 0.25), (2.0, 0.05, 0.13, 0.22),
                                              (3.4, 0.055, 0.105, 0.3), (4.9, 0.05, 0.115, 0.26)]):
        a.add(lathe('gt_s%d' % i, spike_prof(h, 0.032), 'pal_grass_deep', 8, cap=False,
                    loc=(cos(az) * dist, sin(az) * dist, 0),
                    rot=Matrix.Rotation(az, 3, 'Z') @ Matrix.Rotation(tilt, 3, 'Y')))

    # --- rocks
    def rock(name, size, loc, seed, rz=0.0, subdiv=3, mat='pal_stone', flat=0.3, sink=0.02):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
        off = Vector((seed * 3.1, seed * 1.7, seed * 2.3))
        for v in bm.verts:
            n = noise.noise(v.co * 1.25 + off)
            v.co *= 1 + 0.16 * n
            v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
            if v.co.z < 0:
                v.co.z *= flat
        zmin = min(v.co.z for v in bm.verts)
        for v in bm.verts:
            v.co.z -= zmin + sink
        for f in bm.faces:
            f.smooth = True
        return place(mk(name, bm, mat), loc, (0, 0, rz))
    a = Asset('rock_a', note='rounded boulder')
    a.add(rock('rock_a_0', (0.34, 0.28, 0.24), (0, 0, 0), 1))
    a = Asset('rock_b', note='pebble cluster')
    a.add(rock('rock_b_0', (0.24, 0.2, 0.17), (-0.1, 0.02, 0), 2, 0.4))
    a.add(rock('rock_b_1', (0.16, 0.14, 0.12), (0.2, -0.06, 0), 3, 1.2, subdiv=2))
    a.add(rock('rock_b_2', (0.1, 0.09, 0.075), (0.08, -0.22, 0), 4, 2.0, subdiv=2))


    # --- extra ground detail (coordinator round 2)
    a = Asset('rock_c', note='tall standing stone with a pebble')
    a.add(rock('rock_c_0', (0.26, 0.22, 0.44), (0, 0, 0), 5, 0.3, flat=0.4))
    a.add(rock('rock_c_1', (0.11, 0.09, 0.07), (0.27, -0.12, 0), 6, 1.0, subdiv=2, sink=0.01))

    a = Asset('pebbles', note='cluster of 8 small flat stones')
    pm = ['pal_stone', 'pal_cream', 'pal_sand', 'pal_stone', 'pal_stone', 'pal_cream', 'pal_sand', 'pal_stone']
    for i in range(8):
        ang = i * 2.4
        rr = 0.06 + 0.045 * i
        sz = R.uniform(0.05, 0.095)
        a.add(rock('pb_%d' % i, (sz, sz * R.uniform(0.7, 0.95), sz * 0.42), (cos(ang) * rr, sin(ang) * rr, 0), 10 + i,
                   R.uniform(0, 3), subdiv=2, mat=pm[i], flat=0.5, sink=0.006))

    a = Asset('mushrooms', note='three coral-capped mushrooms with cream spots')
    for i, (x, y, h, rc) in enumerate(((0, 0, 0.22, 0.12), (0.15, 0.07, 0.14, 0.08), (-0.1, 0.12, 0.1, 0.062))):
        rs = rc * 0.36
        a.add(lathe('mu_stem%d' % i, [(0, 0), (rs * 1.3, 0), (rs * 1.2, 0.02), (rs, h * 0.45), (rs * 0.85, h), (0, h)],
                    'pal_cream', 12, loc=(x, y, 0)))
        cap = [(0, h - 0.004), (rc * 0.75, h - 0.01), (rc, h + 0.008)] + \
              [(rc * cos(t), h + 0.012 + rc * 0.72 * sin(t)) for t in ls(0.15, pi / 2, 7)]
        cap[-1] = (0, cap[-1][1])
        a.add(lathe('mu_cap%d' % i, cap, 'pal_coral', 16, loc=(x, y, 0)))
        for k in range(3):
            t = 0.75 if k else 1.45
            az = k * 2.1 + i
            n = Vector((cos(az) * cos(t), sin(az) * cos(t), sin(t) * 0.72)).normalized()
            pnt = Vector((x, y, h + 0.012)) + Vector((rc * cos(t) * cos(az), rc * cos(t) * sin(az), rc * 0.72 * sin(t)))
            a.add(sphere('mu_dot', rc * 0.17, pnt, 'pal_cream', 7, 4, scale=(1, 1, 0.45),
                         rot=Z.rotation_difference(n).to_matrix()))

    a = Asset('log', note='fallen cream log along X with a mossy top')
    a.add(lathe('log_body', rcyl_prof(0.16, 1.05, c=0.035, n=3), 'pal_cream', 18, loc=(-0.525, 0, 0.145),
                rot=(0, radians(90), 0)))
    for sx in (-1, 1):
        a.add(lathe('log_end', [(0, 0), (0.125, 0), (0.13, 0.008), (0.09, 0.014), (0.05, 0.01), (0.02, 0.014), (0, 0.012)],
                    'pal_wood', 18, loc=(sx * 0.528, 0, 0.145), rot=(0, sx * radians(90), 0)))
    a.add(capsule('log_stub', (0.18, 0, 0.24), (0.28, -0.06, 0.39), 0.05, 'pal_cream', 10, 3))
    a.add(sphere('log_moss', 0.17, (-0.12, 0.02, 0.27), 'pal_grass', 14, 8, scale=(1.4, 0.75, 0.32)))

    a = Asset('tree_stump', note='cream stump with wood-ring top')
    sp = [(0, 0), (0.29, 0), (0.3, 0.012)]
    for zz in ls(0.03, 0.3, 6):
        sp.append((0.19 + 0.11 * math.exp(-zz / 0.06), zz))
    sp += [(0.185, 0.32), (0.17, 0.335), (0, 0.335)]
    a.add(lathe('ts_body', sp, 'pal_cream', 20))
    ring = [(0, 0.344), (0.04, 0.343), (0.05, 0.337), (0.06, 0.343), (0.1, 0.343), (0.11, 0.337), (0.12, 0.343),
            (0.155, 0.342), (0.168, 0.334), (0.165, 0.326)]
    a.add(lathe('ts_top', ring, 'pal_wood', 20))
    for k in range(4):
        az = k * pi / 2 + 0.4
        a.add(capsule('ts_root', (cos(az) * 0.14, sin(az) * 0.14, 0.035), (cos(az) * 0.33, sin(az) * 0.33, -0.02), 0.06,
                      'pal_cream', 10, 3, r1=0.035))

    a = Asset('lily_pad', ground=False, note='notched pad, origin at water level; `flower` (optional) can be hidden')
    bm = bmesh.new()
    rp = 0.3
    outline = [(rp * cos(t), rp * sin(t)) for t in ls(radians(-75), radians(250), 26)] + [(0.0, -0.03)]
    top = [bm.verts.new((x, y, 0.012)) for x, y in outline]
    bot = [bm.verts.new((x, y, -0.012)) for x, y in outline]
    bm.faces.new(top)
    bm.faces.new(list(reversed(bot)))
    for k in range(len(outline)):
        j = (k + 1) % len(outline)
        bm.faces.new((bot[k], bot[j], top[j], top[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    pad = mk('lp_pad', bm, 'pal_grass')
    bevel(pad, 0.01, 2, angle=30)
    wnorm(pad)
    a.add(pad)
    base = Vector((0.04, 0.04, 0.012))
    fp = []
    for k in range(8):
        fp.append(leaf('lf_pet', base, k * pi / 4, radians(38), 0.1, 0.04, 0.008, 'pal_coral', droop=0.15, fold=0.35,
                       nu=6, nv=6))
    for k in range(5):
        fp.append(leaf('lf_in', base, k * 2 * pi / 5 + 0.3, radians(62), 0.07, 0.03, 0.007, 'pal_peach', droop=0.1,
                       fold=0.35, nu=6, nv=6))
    fp.append(sphere('lf_eye', 0.022, base + Vector((0, 0, 0.02)), 'pal_yellow', 10, 6))
    pivot_node(a, 'flower', fp, base)

    a = Asset('reeds', note='reed clump with three cattails')
    for k in range(9):
        az = k * 2.39
        a.add(leaf('rd_blade', (cos(az) * 0.05, sin(az) * 0.05, 0), az, radians(R.uniform(74, 84)), R.uniform(0.5, 0.78),
                   0.03, 0.009, 'pal_grass_deep' if k % 3 else 'pal_grass', droop=R.uniform(0.06, 0.16), fold=0.3, nu=8,
                   nv=6))
    for k, (x, y, h) in enumerate(((0.03, 0.02, 0.88), (-0.06, 0.04, 0.76), (0.05, -0.05, 0.7))):
        a.add(tube('rd_stem', [Vector((x, y, 0)), Vector((x * 1.4, y * 1.4, h))], lambda u: 0.008, 'pal_grass_deep', 6))
        a.add(capsule('rd_tail', (x * 1.4, y * 1.4, h - 0.02), (x * 1.42, y * 1.42, h + 0.12), 0.026, 'pal_wood_dark', 10, 3))

    a = Asset('flower_bed', note='round cream planter of tulips and leaves')
    pp = [(0, 0), (0.55, 0), (0.6, 0.025), (0.62, 0.08), (0.62, 0.32), (0.605, 0.37), (0.57, 0.39), (0.53, 0.38),
          (0.515, 0.35), (0.51, 0.33), (0, 0.33)]
    a.add(lathe('fb_pot', pp, 'pal_cream', 28))
    a.add(lathe('fb_soil', [(0, 0.37), (0.3, 0.364), (0.48, 0.35), (0.52, 0.33), (0, 0.32)], 'pal_wood_dark', 20))
    tcols = ['pal_coral', 'pal_coral_deep', 'pal_coral', 'pal_yellow', 'pal_coral', 'pal_peach', 'pal_coral']
    for k in range(7):
        ang = k * 2 * pi / 6 if k else 0
        rr = 0.27 if k else 0.0
        x, y = cos(ang) * rr, sin(ang) * rr
        h = 0.68 if k == 0 else R.uniform(0.56, 0.63)
        tip = Vector((x * 1.25, y * 1.25, h))
        a.add(tube('fb_stem', bezier((x, y, 0.34), (x, y, (0.34 + h) / 2), tip, 6), lambda u: 0.012, 'pal_grass', 6))
        a.add(tulip_head('fb_tul', tip, tcols[k], hr=0.062, hh=0.12))
    for k in range(7):
        az = k * 2 * pi / 7 + 0.2
        a.add(leaf('fb_leaf', (cos(az) * 0.2, sin(az) * 0.2, 0.34), az, radians(52), 0.26, 0.055, 0.012,
                   'pal_grass_deep' if k % 2 else 'pal_grass', droop=0.3, fold=0.25, nu=7, nv=6))

    a = Asset('hedge', note='2 m rounded hedge along X; chains at x=+-1')
    a.add(rbox('hg_body', (2.0, 0.6, 0.5), (0, 0, 0.25), 'pal_grass_deep', 0.2, 4))
    for k, x in enumerate((-0.75, -0.25, 0.25, 0.75)):
        a.add(sphere('hg_bump', 0.3, (x, 0.0, 0.47 + 0.03 * (k % 2)), 'pal_grass_deep', 14, 9, scale=(0.95, 1.0, 0.85)))

    a = Asset('path_stones', note='trail of 4 flat stepping stones along Y (y -0.9..0.9)')
    for k, (x, y, rr) in enumerate(((0.1, -0.8, 0.24), (-0.09, -0.27, 0.27), (0.1, 0.27, 0.25), (-0.05, 0.8, 0.22))):
        def sdef(co, k=k):
            th = atan2(co.y, co.x)
            f = 1 + 0.07 * sin(3 * th + k) + 0.04 * sin(5 * th + 2 * k)
            return (co.x * f, co.y * f * 0.85, co.z)
        a.add(lathe('ps_stone', rcyl_prof(rr, 0.055, c=0.024, bulge=0.006, n=2, z0=-0.025), 'pal_stone', 16,
                    loc=(x, y, 0), rot=(0, 0, k * 0.7), deform=sdef))

    a = Asset('bush_flowering', note='round bush dotted with coral flowers')
    blobs = [(0, 0.02, 0.36, 0.42), (0.36, 0.1, 0.26, 0.3), (-0.34, 0.1, 0.27, 0.31), (0.05, -0.3, 0.25, 0.29)]
    for k, (x, y, zz, r) in enumerate(blobs):
        a.add(sphere('bf_b', r, (x, y, zz), 'pal_grass', 14, 9, scale=(1, 1, 0.92)))
    rnd = random.Random(11)
    placed = 0
    while placed < 16:
        x, y, zz, r = blobs[rnd.randrange(len(blobs))]
        th, ph = rnd.uniform(0, 2 * pi), rnd.uniform(0.15, 1.25)
        n = Vector((cos(th) * cos(ph), sin(th) * cos(ph), sin(ph)))
        pnt = Vector((x, y, zz)) + Vector((n.x * r, n.y * r, n.z * r * 0.92))
        if any((pnt - Vector((bx, by, bz))).length < br * 0.97 for bx, by, bz, br in blobs if (bx, by, bz, br) != (x, y, zz, r)):
            continue
        a.add(sphere('bf_dot', 0.055, pnt, 'pal_coral' if placed % 5 else 'pal_white', 7, 4, scale=(1, 1, 0.55),
                     rot=Z.rotation_difference(n).to_matrix()))
        placed += 1

    a = Asset('tree_small_mint', note='1.2 m sapling, teardrop canopy')
    a.add(trunk('tsm_trunk', 0.5, 0.075))
    a.add(lathe('tsm_canopy', drop_prof(0.36, 0.86, 0.15, 10, 6, z0=0.36), 'pal_grass', 22))
    a = Asset('tree_small_coral', note='1.2 m sapling, two stacked coral blobs')
    a.add(trunk('tsc_trunk', 0.55, 0.075))
    a.add(sphere('tsc_b0', 0.32, (0, 0, 0.74), 'pal_coral', 18, 12))
    a.add(sphere('tsc_b1', 0.21, (0.03, -0.02, 1.04), 'pal_coral', 16, 10))

    a = Asset('grass_tall', note='clump of 7 tall curving blades ~0.45 m')
    for k in range(7):
        az = k * 2.4 + 0.3
        a.add(leaf('gt_blade', (cos(az) * 0.035, sin(az) * 0.035, -0.01), az, radians(R.uniform(66, 82)),
                   R.uniform(0.32, 0.48), 0.032, 0.009, 'pal_grass_deep' if k % 2 else 'pal_grass',
                   droop=R.uniform(0.12, 0.3), fold=0.3, nu=8, nv=6))

    a = Asset('shell', note='scallop shell, hinge toward +Y')
    hinge = Vector((0, 0.06, 0.008))
    for k in range(9):
        ang = radians(-62 + k * 15.5)
        tipp = Vector((sin(ang) * 0.135, 0.06 - cos(ang) * 0.135, 0.012))
        mid = hinge.lerp(tipp, 0.55) + Vector((0, 0, 0.03 * (1 - abs(k - 4) / 6)))
        a.add(tube('sh_rib', bezier(hinge, mid, tipp, 7), lambda u: 0.006 + 0.012 * sin(min(1, u * 1.08) * pi * 0.55)
                   if u < 0.98 else 0.0, 'pal_peach', 7))
    a.add(rbox('sh_ear', (0.07, 0.03, 0.016), (0, 0.068, 0.008), 'pal_peach', 0.007, 2))

    a = Asset('starfish', note='coral starfish ~0.26 m')

    def stdef(co):
        th = atan2(co.y, co.x)
        k = 0.32 + 0.68 * ((1 + cos(5 * th)) / 2) ** 1.7
        zf = 0.03 * (0.45 + 0.55 * k)
        z = co.z * zf
        if z < 0:
            z *= 0.35
        return (co.x * 0.13 * k, co.y * 0.13 * k, z + 0.012)
    a.add(sphere('sf_body', 1.0, (0, 0, 0), 'pal_coral', 30, 7, deform=stdef))
    for k in range(5):
        th = k * 2 * pi / 5
        for dd in (0.045, 0.08):
            kk = 0.32 + 0.68 * 1.0
            a.add(sphere('sf_dot', 0.009, (cos(th) * dd, sin(th) * dd, 0.012 + 0.03 * sqrt(max(0.0, 1 - (dd / 0.13) ** 2)) + 0.002),
                         'pal_peach', 8, 5, scale=(1, 1, 0.6)))

    # --- flower patch
    a = Asset('flower_patch', note='flowers on a low grass disc')
    a.add(lathe('fp_disc', rcyl_prof(0.48, 0.05, c=0.025, bulge=0.012, n=3), 'pal_grass', 24))
    cols = ['pal_white', 'pal_coral', 'pal_yellow', 'pal_coral', 'pal_white', 'pal_peach']
    spots = [(0.02, 0.0), (0.25, 0.12), (-0.24, 0.12), (0.12, -0.25), (-0.18, -0.2), (-0.02, 0.29)]
    for i, (x, y) in enumerate(spots):
        h = R.uniform(0.1, 0.17)
        top = Vector((x, y, h))
        a.add(tube('fp_stem%d' % i, [Vector((x, y, 0.03)), Vector((x, y, h * 0.6)), top], lambda u: 0.01,
                   'pal_grass_deep', 6))
        a.add(*flower_head('fp_fl%d' % i, top, R.uniform(0.07, 0.085), cols[i],
                           rot=Euler((R.uniform(-0.25, 0.25), R.uniform(-0.25, 0.25), R.uniform(0, 6)))))
    for i, az in enumerate((0.9, 3.6)):
        a.add(leaf('fp_leaf%d' % i, (cos(az) * 0.1, sin(az) * 0.1, 0.03), az, radians(35), 0.14, 0.04, 0.01,
                   'pal_grass_deep', droop=0.3, fold=0.25, nu=7, nv=6))

    # --- cloud
    a = Asset('cloud', ground=False, note='puffy cloud ~3 m wide, origin at centre')
    puffs = [(0, 0, 0.12, 0.78), (0.78, 0.05, -0.02, 0.58), (-0.82, 0, -0.04, 0.56), (0.36, 0.12, 0.5, 0.5),
             (-0.38, -0.05, 0.42, 0.48), (1.3, 0, -0.12, 0.36), (-1.34, 0.05, -0.14, 0.34), (0.1, -0.35, -0.05, 0.45)]
    for i, (x, y, zz, r) in enumerate(puffs):
        def cdef(co, zz=zz):
            wz = co.z + zz
            if wz < -0.2:
                wz = -0.2 + (wz + 0.2) * 0.28
            return (co.x, co.y, wz - zz)
        a.add(sphere('cloud_p%d' % i, r, (x, y, zz), 'pal_white', 12, 8, deform=cdef))


# ============================================================================= PROPS
def build_props():
    # --- bench
    a = Asset('bench', 'prop', note='coral slats, cream frame; seat height 0.42')
    for i, y in enumerate((-0.165, -0.015, 0.135)):
        a.add(plank('bench_slat%d' % i, (1.6, 0.135, 0.07), (0, y, 0.385), 'pal_coral', 0.03, grooves=2))
        for sx in (-0.64, 0.64):
            a.add(bolt('bench_bolt', (sx, y, 0.42), (0, 0, 1), r=0.018, h=0.014, mat='pal_cream'))
    for i, zz in enumerate((0.62, 0.79)):
        yb = 0.255 + (zz - 0.62) * 0.18
        a.add(plank('bench_back%d' % i, (1.6, 0.13, 0.06), (0, yb, zz), 'pal_coral', 0.028, grooves=1,
                    rot=(radians(80), 0, 0)))
        nrm = Vector((0, -cos(radians(10)), sin(radians(10))))
        for sx in (-0.64, 0.64):
            a.add(bolt('bench_bolt', Vector((sx, yb, zz)) + nrm * 0.03, nrm, r=0.018, h=0.014, mat='pal_cream'))
    for sx in (-0.64, 0.64):
        a.add(rbox('bench_fleg', (0.09, 0.09, 0.36), (sx, -0.15, 0.18), 'pal_cream', 0.035, 2))
        a.add(rod('bench_bleg', (sx, 0.2, 0.0), (sx, 0.3, 0.88), 0.048, 'pal_cream', segs=12))
        a.add(rbox('bench_rail', (0.09, 0.5, 0.07), (sx, 0.02, 0.32), 'pal_cream', 0.03, 2))
        a.add(rbox('bench_arm', (0.09, 0.42, 0.06), (sx, -0.02, 0.6), 'pal_cream', 0.028, 2))
        a.add(rod('bench_armpost', (sx, -0.17, 0.3), (sx, -0.17, 0.6), 0.035, 'pal_cream', segs=10))
    a.node(empty('seat', (0, -0.02, 0.45)))
    a.node(empty('use', (0, -0.72, 0), (0, 0, pi)))

    # --- swing set
    a = Asset('swing_set', 'prop', note='swing_N pivots on the top bar rotate about X')
    top_z = 2.15
    for sx in (-1.25, 1.25):
        for sy in (-0.72, 0.72):
            a.add(capsule('ss_leg', (sx, sy, 0.0), (sx, 0, top_z), 0.065, 'pal_cream', 12, 3))
            a.add(lathe('ss_foot', rcyl_prof(0.11, 0.07, c=0.03), 'pal_cream', 16, loc=(sx, sy, 0)))
            mid = Vector((sx, sy * 0.5, 1.05))
            out = Vector((1 if sx > 0 else -1, 0, 0))
            a.add(bolt('ss_bolt', mid + out * 0.06, out))
        a.add(capsule('ss_brace', (sx, -0.36, 1.05), (sx, 0.36, 1.05), 0.045, 'pal_cream', 12, 3))
        a.add(sphere('ss_cap', 0.1, (sx, 0, top_z), 'pal_cream', 16, 10))
        out = Vector((1 if sx > 0 else -1, 0, 0))
        a.add(bolt('ss_capbolt', Vector((sx, 0, top_z)) + out * 0.095, out, r=0.034, h=0.026))
    a.add(capsule('ss_bar', (-1.42, 0, top_z), (1.42, 0, top_z), 0.072, 'pal_cream', 14, 3))
    for i, sx in enumerate((-0.52, 0.52)):
        piv = Vector((sx, 0, top_z - 0.02))
        parts = []
        for dx in (-0.2, 0.2):
            parts.append(capsule('ssr', (sx + dx, 0, 0.47), (sx + dx, 0, top_z - 0.04), 0.017, 'pal_cream', 8, 2))
            parts.append(lathe('ssh', rcyl_prof(0.04, 0.05, c=0.02), 'pal_cream', 10, loc=(sx + dx, 0, top_z - 0.08)))
            parts.append(torus('ssring', 0.03, 0.011, 'pal_stone', (sx + dx, 0, top_z - 0.005), Euler((radians(90), 0, 0)),
                               10, 5))
            parts.append(bolt('ssbolt', (sx + dx, 0, 0.478), (0, 0, 1), r=0.02, h=0.014))
        parts.append(plank('sss', (0.52, 0.24, 0.055), (sx, 0, 0.45), 'pal_coral', 0.024, grooves=2, depth=0.005))
        sw = pivot_node(a, 'swing_%d' % i, parts, piv)
        a.node(empty('seat_%d' % i, (sx, 0, 0.53)), sw)
    a.node(empty('use', (0, -1.25, 0), (0, 0, pi)))

    # --- slide
    a = Asset('slide', 'prop', note='slide_0..7 from top to bottom; ladder at +Y')
    plat_z = 1.3
    a.add(rbox('sl_plat', (0.72, 0.66, 0.1), (0, 0.56, plat_z - 0.05), 'pal_cream', 0.035, 3))
    for x in (-0.3, 0.3):
        for y in (0.27, 0.84):
            a.add(rod('sl_leg', (x, y, 0), (x, y, plat_z - 0.06), 0.05, 'pal_cream', segs=12))
        a.add(rod('sl_rail', (x * 1.05, 1.5, 0), (x * 1.05, 0.88, 1.75), 0.042, 'pal_cream', segs=12))
        a.add(sphere('sl_knob', 0.055, (x * 1.05, 0.88, 1.75), 'pal_cream', 12, 8))
        a.add(rod('sl_guard', (x * 1.12, 0.3, plat_z), (x * 1.12, 0.3, 1.62), 0.035, 'pal_cream', segs=10))
        a.add(sphere('sl_gknob', 0.05, (x * 1.12, 0.3, 1.62), 'pal_cream', 12, 8))
    for k, t in enumerate((0.2, 0.4, 0.6, 0.8)):
        p = Vector((0, 1.5, 0)).lerp(Vector((0, 0.88, 1.75)), t * 0.74)
        a.add(plank('sl_tread', (0.6, 0.13, 0.045), (0, p.y + 0.01, p.z), 'pal_coral', 0.018, grooves=1, depth=0.005))
        for x in (-0.315, 0.315):
            a.add(bolt('sl_bolt', (x * 1.0 + (0.055 if x > 0 else -0.055), p.y, p.z), (1 if x > 0 else -1, 0, 0),
                       r=0.02, h=0.016))
    for x in (-0.3, 0.3):
        for y in (0.27, 0.84):
            a.add(bolt('sl_pbolt', (x, y - 0.0, plat_z - 0.05) if False else (x + (0.05 if x > 0 else -0.05), y, plat_z - 0.16),
                       (1 if x > 0 else -1, 0, 0), r=0.02, h=0.016))
    ri, ro, sq = 0.25, 0.30, 0.62

    def slide_pt(u):
        y = 0.4 - 2.6 * u
        f = 0.5 * (1 + cos(pi * min(u / 0.8, 1)))
        return Vector((0, y, 0.43 + 1.02 * f))
    us = ls(0, 1, 26)
    path = [slide_pt(u) for u in us]
    d0 = (path[1] - path[0]).normalized()
    d1 = (path[-1] - path[-2]).normalized()
    ext_s = [path[0] - d0 * e for e in (0.05, 0.075, 0.085)]
    ext_e = [path[-1] + d1 * e for e in (0.05, 0.075, 0.085)]
    full = list(reversed(ext_s)) + path + ext_e
    nfull = len(full)
    cen_b = -0.15

    def chute_prof(u):
        i = round(u * (nfull - 1))
        s = 1.0
        if i < 3:
            s = (0.0, 0.55, 0.88)[i]
        if i > nfull - 4:
            s = (0.88, 0.55, 0.0)[i - (nfull - 3)]
        if s == 0.0:
            return [(0, cen_b)]
        pts = [(ro * cos(p), ro * sin(p) * sq) for p in ls(pi, 2 * pi, 9)]
        m = (ri + ro) / 2
        hw = (ro - ri) / 2
        pts += [(m + hw * cos(p), hw * sin(p)) for p in ls(0, pi, 5)[1:-1]]
        pts += [(ri * cos(p), ri * sin(p) * sq) for p in ls(2 * pi, pi, 9)]
        pts += [(-m + hw * cos(p), hw * sin(p)) for p in ls(0, pi, 5)[1:-1]]
        return [(x * s, cen_b + (y - cen_b) * s) for x, y in pts]
    a.add(mk('sl_chute', bm_sweep(full, chute_prof), 'pal_coral'))
    end = path[-1]
    a.add(rbox('sl_foot', (0.34, 0.14, end.z - 0.1), (0, end.y + 0.25, (end.z - 0.1) / 2), 'pal_cream', 0.04, 3))
    for i in range(8):
        u = 0.03 + i / 7 * 0.94
        P = slide_pt(u)
        T = (slide_pt(min(1, u + 0.01)) - slide_pt(max(0, u - 0.01))).normalized()
        side = T.cross(Z).normalized()
        up = side.cross(T).normalized()
        pos = P + up * (-ri * sq + 0.1)
        yv = -T
        xv = yv.cross(up).normalized()
        M = Matrix((xv, yv, up)).transposed()
        a.node(empty('slide_%d' % i, pos, M.to_euler()))
    a.node(empty('use', (0, 1.72, 0)))

    # --- seesaw (beam along Y, rotates about X)
    a = Asset('seesaw', 'prop', note='beam pivot at the fulcrum, rotates about X')
    a.add(lathe('sw_base', rcyl_prof(0.3, 0.1, c=0.045), 'pal_cream', 24))
    a.add(rbox('sw_post', (0.22, 0.16, 0.42), (0, 0, 0.27), 'pal_cream', 0.05, 3))
    a.add(capsule('sw_axle', (-0.17, 0, 0.47), (0.17, 0, 0.47), 0.065, 'pal_cream', 14, 3))
    fz = 0.5
    bp = [plank('swb', (2.7, 0.26, 0.075), (0, 0, fz + 0.06), 'pal_coral', 0.035, grooves=2, rot=(0, 0, pi / 2))]
    for sy in (-1.12, 1.12):
        bp.append(rbox('swpad', (0.3, 0.36, 0.06), (0, sy, fz + 0.12), 'pal_coral_deep', 0.028, 3))
        hy = sy * 0.72
        for sx in (-0.1, 0.1):
            bp.append(rod('swh', (sx, hy, fz + 0.08), (sx, hy, fz + 0.36), 0.025, 'pal_cream', segs=8, n=2))
        bp.append(capsule('swhb', (-0.14, hy, fz + 0.36), (0.14, hy, fz + 0.36), 0.032, 'pal_cream', 10, 3))
    for sy in (-0.25, 0.25):
        bp.append(bolt('swbolt', (0, sy, fz + 0.098), (0, 0, 1), r=0.022, h=0.016))
    beam = pivot_node(a, 'beam', bp, (0, 0, fz))
    a.node(empty('seat_0', (0, 1.12, fz + 0.2)), beam)
    a.node(empty('seat_1', (0, -1.12, fz + 0.2), (0, 0, pi)), beam)
    a.node(empty('use', (0.8, -1.0, 0), (0, 0, -pi / 2)))

    # --- lamp post
    a = Asset('lamp_post', 'prop', note='pal_emissive bulb')
    a.add(lathe('lp_base', rcyl_prof(0.2, 0.14, c=0.06, rt=0.16), 'pal_cream', 18))
    a.add(rod('lp_post', (0, 0, 0.1), (0, 0, 2.28), 0.058, 'pal_cream', segs=16))
    a.add(lathe('lp_collar', rcyl_prof(0.11, 0.08, c=0.03, z0=2.22), 'pal_cream', 16))
    a.add(sphere('lp_bulb', 0.19, (0, 0, 2.47), 'pal_emissive', 20, 12))
    cap = [(0, 2.58), (0.2, 2.585), (0.215, 2.6), (0.2, 2.64), (0.14, 2.7), (0.06, 2.735), (0, 2.74)]
    a.add(lathe('lp_cap', cap, 'pal_coral_deep', 18))
    a.add(sphere('lp_tip', 0.045, (0, 0, 2.765), 'pal_coral_deep', 12, 8))

    # --- signpost
    a = Asset('signpost', 'prop', note='arrow_N boards pivot on the post axis; label_N quads face -Y')
    a.add(lathe('sp_mound', rcyl_prof(0.17, 0.06, c=0.03), 'pal_wood_dark', 18))
    a.add(rod('sp_post', (0, 0, 0), (0, 0, 2.0), 0.068, 'pal_wood', c=0.03, segs=16))
    a.add(sphere('sp_knob', 0.085, (0, 0, 2.03), 'pal_wood_dark', 16, 10))
    for i, (zz, dirx, yaw) in enumerate(((1.76, 1, 8), (1.5, -1, -10), (1.24, 1, -16), (0.98, -1, 12))):
        pts = [(-0.05, -0.1), (0.6, -0.1), (0.77, 0.0), (0.6, 0.1), (-0.05, 0.1)]
        pts = [(x * dirx, zv) for x, zv in pts]
        if dirx < 0:
            pts = list(reversed(pts))
        bd = poly_prism('sp_board%d' % i, pts, -0.026, 0.026, 'pal_wood')
        bevel(bd, 0.018, 2, angle=30)
        wnorm(bd)
        arrow_geo = pivot_mesh('arrow_%d_geo' % i, [bd], (0, 0, 0))
        x0, x1 = (0.07, 0.56) if dirx > 0 else (-0.56, -0.07)
        bm = bmesh.new()
        vs = [bm.verts.new((x0, -0.03, -0.068)), bm.verts.new((x1, -0.03, -0.068)), bm.verts.new((x1, -0.03, 0.068)),
              bm.verts.new((x0, -0.03, 0.068))]
        f = bm.faces.new(vs)
        uv = bm.loops.layers.uv.new('UVMap')
        for loop, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            loop[uv].uv = c
        lab = mk('label_%d' % i, bm, 'pal_cream', smooth=False)
        arrow = empty('arrow_%d' % i, (0, 0, zz), (0, 0, radians(yaw)), kind='PLAIN_AXES')
        M = Matrix.Translation((0, 0, zz)) @ Matrix.Rotation(radians(yaw), 4, 'Z')
        arrow_geo.matrix_world = M
        lab.matrix_world = M.copy()
        a.node(arrow)
        a.node(arrow_geo, arrow)
        a.node(lab, arrow)

    # --- flagpole
    a = Asset('flagpole', 'prop', note='flag pivot at the hoist; green pennant, white crescent and star')
    a.add(lathe('fpole_base', rcyl_prof(0.24, 0.16, c=0.06, rt=0.2), 'pal_cream', 24))
    a.add(rod('fpole_pole', (0, 0, 0.1), (0, 0, 3.3), 0.045, 'pal_cream', segs=14))
    a.add(sphere('fpole_ball', 0.08, (0, 0, 3.36), 'pal_yellow', 16, 10))
    a.add(flag_mesh(a))
    # flag_mesh registers the node itself (returns None)

    # --- mailbox
    a = Asset('mailbox', 'prop', note='lid hinges at its bottom front edge (rotates about X)')
    a.add(rod('mb_post', (0, 0.0, 0), (0, 0.0, 0.98), 0.05, 'pal_cream', segs=14))
    a.add(lathe('mb_foot', rcyl_prof(0.13, 0.06, c=0.03), 'pal_cream', 18))
    a.add(rbox('mb_plate', (0.22, 0.34, 0.04), (0, 0.02, 0.97), 'pal_cream', 0.015, 2))
    z0, w, wall = 0.99, 0.135, 0.14
    prof2 = [(w, z0), (w, z0 + wall)] + [(w * cos(t), z0 + wall + w * sin(t)) for t in ls(0, pi, 13)[1:-1]] + \
            [(-w, z0 + wall), (-w, z0)]
    body = poly_prism('mb_body', prof2, -0.22, 0.25, 'pal_coral')
    bevel(body, 0.028, 2, angle=35)
    wnorm(body)
    a.add(body)
    s = 1.06
    prof3 = [(x * s, z0 - 0.004 + (zv - z0) * s) for x, zv in prof2]
    lid = poly_prism('mb_lid', prof3, -0.262, -0.222, 'pal_coral_deep')
    bevel(lid, 0.014, 3, angle=35)
    wnorm(lid)
    knob = sphere('mb_knob', 0.024, (0, -0.268, z0 + 0.17), 'pal_cream', 12, 8)
    pivot_node(a, 'lid', [lid, knob], (0, -0.242, z0))
    a.add(rbox('mb_fstem', (0.022, 0.022, 0.2), (w + 0.02, 0.12, z0 + 0.13), 'pal_yellow', 0.01, 2))
    a.add(rbox('mb_flag', (0.022, 0.1, 0.065), (w + 0.02, 0.07, z0 + 0.2), 'pal_yellow', 0.01, 2))
    a.node(empty('use', (0, -0.75, 0), (0, 0, pi)))

    # --- crates / barrel
    a = Asset('crate', 'prop', note='0.6 m wood crate')
    a.add(*crate_parts('cr', (0, 0, 0), 0.0))
    a = Asset('crate_stack', 'prop', note='three crates')
    a.add(*crate_parts('cs0', (-0.32, 0.0, 0), radians(3)))
    a.add(*crate_parts('cs1', (0.33, 0.04, 0), radians(-5)))
    a.add(*crate_parts('cs2', (0.02, 0.02, 0.6), radians(14)))
    a = Asset('barrel', 'prop', note='bulged wood barrel')
    bp = [(0, 0), (0.19, 0), (0.215, 0.012), (0.225, 0.035)]
    for zz in ls(0.06, 0.64, 9):
        bp.append((0.225 + 0.05 * sin(pi * zz / 0.7), zz))
    bp += [(0.225, 0.665), (0.215, 0.69), (0.195, 0.7), (0.18, 0.696), (0.176, 0.688), (0, 0.688)]
    a.add(lathe('br_body', bp, 'pal_wood', 20))
    for zz in (0.13, 0.57):
        rr = 0.225 + 0.05 * sin(pi * zz / 0.7)
        hp = [(rr - 0.01, zz - 0.03), (rr + 0.008, zz - 0.028), (rr + 0.016, zz - 0.012), (rr + 0.016, zz + 0.012),
              (rr + 0.008, zz + 0.028), (rr - 0.01, zz + 0.03)]
        a.add(lathe('br_hoop', hp, 'pal_wood_dark', 20, cap=False))

    # --- fence (2 m along X, posts every 1 m so segments chain)
    a = Asset('fence', 'prop', note='2 m rail fence along X, chain at x=+-1')
    for x in (-0.5, 0.5):
        a.add(rod('fe_post', (x, 0, 0), (x, 0, 0.74), 0.06, 'pal_cream', segs=14))
        a.add(sphere('fe_knob', 0.07, (x, 0, 0.76), 'pal_cream', 14, 8))
        for zz in (0.32, 0.58):
            a.add(bolt('fe_bolt', (x, -0.055, zz), (0, -1, 0), r=0.02, h=0.016))
    for zz in (0.32, 0.58):
        a.add(capsule('fe_rail', (-1.0, 0.0, zz), (1.0, 0.0, zz), 0.042, 'pal_cream', 12, 3))
    a = Asset('fence_picket', 'prop', note='2 m cream picket fence along X, chain at x=+-1')
    for x in (-0.5, 0.5):
        a.add(rbox('fp_post', (0.11, 0.11, 0.8), (x, 0.03, 0.4), 'pal_cream', 0.045, 3))
        a.add(sphere('fp_knob', 0.06, (x, 0.03, 0.82), 'pal_cream', 12, 8))
    for zz in (0.26, 0.52):
        a.add(rbox('fp_rail', (2.0, 0.05, 0.08), (0, 0.06, zz), 'pal_cream', 0.022, 2))
    for x in (-0.875, -0.625, -0.25, 0.0, 0.25, 0.625, 0.875):
        w = 0.04
        pk = poly_prism('fp_picket', [(-w, 0.0), (w, 0.0), (w, 0.6), (0, 0.68), (-w, 0.6)], -0.018, 0.018, 'pal_cream')
        bevel(pk, 0.014, 2, angle=30)
        wnorm(pk)
        a.add(place(pk, (x, 0.0, 0)))

    # --- bridge (2 m along Y, deck top at Z=0)
    a = Asset('bridge', 'prop', ground=False, note='2 m plank segment along Y, ends at Y=+-1, deck top Z=0 (structure hangs below)')
    for i in range(8):
        y = -0.875 + i * 0.25
        a.add(rbox('bg_plank', (1.5, 0.215, 0.075), (R.uniform(-0.015, 0.015), y, -0.0375), 'pal_wood', 0.028, 2,
                   rot=(0, 0, R.uniform(-0.025, 0.025))))
    for x in (-0.5, 0.5):
        a.add(rbox('bg_beam', (0.12, 2.0, 0.12), (x, 0, -0.13), 'pal_wood_dark', 0.035, 2))
    for x in (-0.72, 0.72):
        for y in (-0.55, 0.55):
            a.add(rod('bg_post', (x, y, -0.12), (x, y, 0.58), 0.05, 'pal_cream', segs=10))
            a.add(sphere('bg_knob', 0.06, (x, y, 0.6), 'pal_cream', 12, 8))
        a.add(capsule('bg_rail', (x, -1.0, 0.52), (x, 1.0, 0.52), 0.042, 'pal_cream', 10, 3))

    # --- dock (2 x 2 m, deck top at Z=0, posts down into the water)
    a = Asset('dock', 'prop', ground=False, note='2 x 2 m deck, top Z=0, posts to Z=-1.2')
    for i in range(8):
        y = -0.875 + i * 0.25
        a.add(rbox('dk_plank', (2.0, 0.22, 0.08), (R.uniform(-0.01, 0.01), y, -0.04), 'pal_wood', 0.03, 2,
                   rot=(0, 0, R.uniform(-0.02, 0.02))))
    for x in (-0.7, 0.7):
        a.add(rbox('dk_beam', (0.14, 2.0, 0.14), (x, 0, -0.15), 'pal_wood_dark', 0.04, 2))
    for x in (-0.82, 0.82):
        for y in (-0.8, 0.8):
            a.add(rod('dk_post', (x, y, -1.2), (x, y, 0.2 if y > 0 else -0.04), 0.085, 'pal_wood_dark', segs=10))

    # --- cricket stumps
    a = Asset('cricket_stumps', 'prop', note='stump_N pivot at the base; bails rest on top')
    for i, x in enumerate((-0.1, 0.0, 0.1)):
        st = lathe('stump_tmp', rcyl_prof(0.022, 0.6, c=0.018, n=3), 'pal_cream', 12, loc=(x, 0, 0))
        pivot_node(a, 'stump_%d' % i, [st], (x, 0, 0))
    b0 = capsule('bl0', (-0.105, 0, 0.612), (-0.005, 0, 0.612), 0.013, 'pal_wood', 8, 2)
    b1 = capsule('bl1', (0.005, 0, 0.612), (0.105, 0, 0.612), 0.013, 'pal_wood', 8, 2)
    pivot_node(a, 'bails', [b0, b1], (0, 0, 0.612))

    # --- ball (radius 0.1, origin at centre)
    a = Asset('ball', 'prop', ground=True, floor=-0.1, note='cricket ball radius 0.1 m, origin at centre')
    a.add(sphere('ball_s', 0.1, (0, 0, 0), 'pal_coral_deep', 18, 12))
    a.add(torus('ball_seam', 0.1005, 0.007, 'pal_cream', (0, 0, 0), Euler((0, radians(90), 0)), 24, 5))

    # --- paper boat (bow toward -Y)
    a = Asset('paper_boat', 'prop', note='paper boat, bow toward -Y')
    halves = []
    for sy in (-1, 1):
        halves.append(hull_obj('pb_hull', [(-0.07, 0, 0.075), (0.07, 0, 0.075), (-0.05, sy * 0.21, 0.115), (0.05, sy * 0.21, 0.115),
                                           (-0.025, 0, 0.0), (0.025, 0, 0.0), (0, sy * 0.13, 0.0)], 'pal_white'))
    sail = hull_obj('pb_sail', [(-0.035, -0.12, 0.07), (0.035, -0.12, 0.07), (-0.035, 0.12, 0.07), (0.035, 0.12, 0.07),
                                (0, 0, 0.225)], 'pal_white')
    for o in halves + [sail]:
        bevel(o, 0.006, 2, angle=20)
        wnorm(o)
    a.add(*halves)
    a.add(sail)

    # --- kite (faces -Y, origin at the string attachment)
    a = Asset('kite', 'prop', ground=False, note='diamond kite, origin at the bridle point')
    C, T, Rr, B, L = (0, 0), (0, 0.44), (0.31, 0.1), (0, -0.52), (-0.31, 0.1)
    for i, (tri, col) in enumerate((((C, Rr, T), 'pal_yellow'), ((C, T, L), 'pal_coral'), ((C, L, B), 'pal_yellow'),
                                    ((C, B, Rr), 'pal_coral'))):
        cx = sum(p[0] for p in tri) / 3
        cz = sum(p[1] for p in tri) / 3
        ins = [(p[0] + (cx - p[0]) * 0.06, p[1] + (cz - p[1]) * 0.06) for p in tri]
        o = poly_prism('kt_q%d' % i, ins, 0.0, 0.022, col)
        bevel(o, 0.008, 2, angle=30)
        wnorm(o)
        a.add(o)
    a.add(capsule('kt_spar_v', (0, 0.03, 0.43), (0, 0.03, -0.51), 0.009, 'pal_cream', 8, 2))
    a.add(capsule('kt_spar_h', (-0.3, 0.03, 0.1), (0.3, 0.03, 0.1), 0.009, 'pal_cream', 8, 2))
    tail = [Vector((0.07 * sin(u * 3 * pi), 0.01, -0.5 - 1.1 * u)) for u in ls(0, 1, 24)]
    a.add(tube('kt_tail', tail, lambda u: 0.006 if u < 0.99 else 0.0, 'pal_cream', 6, ref=Vector((0, 1, 0))))
    for i, u in enumerate((0.3, 0.62, 0.93)):
        p = Vector((0.07 * sin(u * 3 * pi), 0.01, -0.5 - 1.1 * u))
        col = ('pal_coral', 'pal_yellow', 'pal_coral')[i]
        for sx in (-1, 1):
            a.add(sphere('kt_bow', 0.032, p + Vector((sx * 0.032, 0, 0)), col, 10, 6, scale=(1.3, 0.45, 0.75),
                         rot=(0, sx * 0.3, 0)))
    a.add(sphere('kt_knot', 0.012, (0, -0.012, 0), 'pal_cream', 8, 6))

    # --- idea bulb (origin at centre)
    a = Asset('idea_bulb', 'prop', ground=False, note='collectible bulb, origin at centre')
    gp = [(0.054, -0.07), (0.058, -0.04), (0.066, -0.015), (0.08, 0.0)]
    cz = 0.09
    for t in ls(asin((0.0 - cz) / 0.125), pi / 2, 10)[1:]:
        gp.append((0.125 * cos(t), cz + 0.125 * sin(t)))
    gp[-1] = (0, gp[-1][1])
    a.add(lathe('ib_glass', gp, 'pal_emissive', 20))
    bpz = [(0, -0.2), (0.022, -0.198), (0.035, -0.19)]
    for zz in ls(-0.175, -0.055, 13):
        bpz.append((0.054 + 0.006 * cos((zz + 0.175) / 0.04 * 2 * pi), zz))
    bpz += [(0.05, -0.045), (0, -0.045)]
    a.add(lathe('ib_base', bpz, 'pal_cream', 14))
    a.add(sphere('ib_tip', 0.02, (0, 0, -0.2), 'pal_ink', 10, 6))

    # --- idea seed (launch plot marker)
    a = Asset('idea_seed', 'prop', note='glowing sprout on a pal_sky hex pad')
    pad = hex_solid('is_pad', 0.42, 0.09, 0.0, 'pal_sky', 'pal_sky', bev_top=0.035, bev_side=0.06, segs=3)
    a.add(pad)
    a.add(sphere('is_mound', 0.13, (0, 0, 0.09), 'pal_wood_dark', 16, 8, scale=(1, 1, 0.38)))
    stem = bezier((0, 0, 0.1), (0.0, 0, 0.22), (0.03, 0, 0.32), 10)
    a.add(tube('is_stem', stem, lambda u: 0.016 * (1 - 0.3 * u), 'pal_emissive', 8))
    for i, az in enumerate((0.15, pi + 0.15)):
        a.add(leaf('is_leaf%d' % i, (0.03, 0, 0.31), az, radians(28), 0.15, 0.06, 0.014, 'pal_emissive', droop=0.3,
                   fold=0.2, nu=8, nv=8))

    # --- chai cup
    a = Asset('chai_cup', 'prop', note='glass cup of chai on a saucer')
    a.add(lathe('cc_saucer', [(0, 0), (0.045, 0), (0.05, 0.004), (0.068, 0.012), (0.074, 0.017), (0.071, 0.021),
                              (0.05, 0.013), (0, 0.011)], 'pal_cream', 22))
    a.add(lathe('cc_glass', [(0, 0.011), (0.024, 0.011), (0.027, 0.014), (0.0345, 0.088), (0.0345, 0.092),
                             (0.0325, 0.093), (0.031, 0.089), (0.0245, 0.021), (0, 0.02)], 'pal_glass', 18))
    a.add(lathe('cc_chai', [(0, 0.021), (0.0245, 0.021), (0.0291, 0.07), (0.0285, 0.072), (0, 0.072)], 'pal_tan', 18))

    # --- bird (faces -Y, wings pivot at the shoulders)
    a = Asset('bird', 'prop', note='seagull ~0.21 m; wing_l (+X) / wing_r (-X) pivot at shoulders, flap about Y')
    a.add(sphere('bd_body', 0.05, (0, 0.01, 0.085), 'pal_white', 14, 9, scale=(0.85, 1.6, 0.82)))
    a.add(sphere('bd_head', 0.04, (0, -0.06, 0.135), 'pal_white', 12, 8))
    a.add(lathe('bd_beak', [(0, 0), (0.012, 0.0), (0.01, 0.015), (0.004, 0.03), (0, 0.036)], 'pal_yellow', 10,
                loc=(0, -0.093, 0.13), rot=(radians(90), 0, 0)))
    for sx in (-1, 1):
        a.add(sphere('bd_eye', 0.0075, (sx * 0.027, -0.084, 0.147), 'pal_ink', 8, 6))
        a.add(capsule('bd_leg', (sx * 0.016, 0.02, 0.0), (sx * 0.016, 0.02, 0.05), 0.0065, 'pal_coral', 6, 2))
    a.add(sphere('bd_tail', 0.03, (0, 0.085, 0.095), 'pal_white', 12, 8, scale=(0.9, 1.4, 0.35), rot=(radians(-15), 0, 0)))
    for nm, sx in (('wing_l', 1), ('wing_r', -1)):
        sh = Vector((sx * 0.033, 0.0, 0.105))
        wg = sphere(nm + '_tmp', 1.0, sh + Vector((sx * 0.058, 0.012, 0.004)), 'pal_stone', 12, 6,
                    scale=(0.065, 0.034, 0.009), rot=(0, sx * radians(-12), sx * radians(-8)))
        tip = sphere(nm + '_tip', 1.0, sh + Vector((sx * 0.108, 0.02, 0.016)), 'pal_ink', 10, 6,
                     scale=(0.02, 0.018, 0.0075), rot=(0, sx * radians(-12), 0))
        pivot_node(a, nm, [wg, tip], sh)

    # --- garden tile + plants
    a = Asset('garden_tile', 'prop', note='0.42 m soil tile, cream rim, origin at bottom; soil top Z=0.065')
    a.add(rbox('gt_soil', (0.36, 0.36, 0.065), (0, 0, 0.0325), 'pal_wood_dark', 0.02, 2))
    for y in (-0.19, 0.19):
        a.add(rbox('gt_rimx', (0.42, 0.045, 0.085), (0, y, 0.0425), 'pal_cream', 0.02, 2))
    for x in (-0.19, 0.19):
        a.add(rbox('gt_rimy', (0.045, 0.34, 0.085), (x, 0, 0.0425), 'pal_cream', 0.02, 2))
    build_plants()


def build_plants():
    def stem(name, pts, r, mat='pal_grass_deep'):
        return tube(name, [Vector(p) for p in pts], lambda u: r * (1 - 0.35 * u), mat, 6)

    def leaves(prefix, spec, mats=('pal_grass', 'pal_grass_deep')):
        out = []
        for i, (zz, az, L, W) in enumerate(spec):
            out.append(leaf('%s%d' % (prefix, i), (0.004, 0, zz), az, radians(30), L, W, W * 0.22, mats[i % len(mats)],
                            droop=0.32, fold=0.25, nu=7, nv=6))
        return out

    a = Asset('garden_plant_1', 'prop', note='growth stage 1: sprout ~0.12 m')
    a.add(stem('gp1_stem', [(0, 0, 0), (0, 0, 0.05), (0.006, 0, 0.085)], 0.009))
    a.add(*leaves('gp1_leaf', [(0.082, 0.3, 0.075, 0.04), (0.082, pi + 0.3, 0.075, 0.04)], ('pal_grass_light',)))
    a.add(sphere('gp1_bud', 0.014, (0.006, 0, 0.09), 'pal_grass_light', 10, 6))

    a = Asset('garden_plant_2', 'prop', note='growth stage 2: leafy ~0.22 m')
    a.add(stem('gp2_stem', [(0, 0, 0), (0, 0, 0.1), (0.008, 0, 0.18)], 0.011))
    a.add(*leaves('gp2_leaf', [(0.05, 0.2, 0.1, 0.045), (0.06, pi + 0.4, 0.1, 0.045), (0.12, 1.8, 0.095, 0.042),
                               (0.13, 4.9, 0.09, 0.04), (0.17, 3.2, 0.07, 0.035)]))
    a.add(sphere('gp2_bud', 0.028, (0.008, 0, 0.195), 'pal_grass_light', 12, 8, scale=(1, 1, 1.25)))

    a = Asset('garden_plant_3', 'prop', note='growth stage 3: budding with two yellow flowers ~0.4 m')
    a.add(stem('gp3_stem', [(0, 0, 0), (0, 0, 0.18), (0.01, 0, 0.33)], 0.013))
    a.add(stem('gp3_br', [(0.004, 0, 0.2), (0.07, 0.02, 0.25), (0.1, 0.03, 0.3)], 0.009))
    a.add(*leaves('gp3_leaf', [(0.05, 0.3, 0.14, 0.055), (0.06, 3.4, 0.14, 0.055), (0.13, 1.9, 0.13, 0.05),
                               (0.14, 5.0, 0.12, 0.05), (0.22, 0.9, 0.1, 0.045), (0.23, 4.0, 0.1, 0.045)]))
    a.add(*flower_head('gp3_fl0', (0.01, 0, 0.345), 0.062, 'pal_yellow'))
    a.add(*flower_head('gp3_fl1', (0.1, 0.03, 0.31), 0.05, 'pal_yellow', rot=Euler((0.2, 0.35, 0))))
    a.add(sphere('gp3_bud', 0.026, (-0.05, 0.0, 0.3), 'pal_coral', 12, 8, scale=(1, 1, 1.3)))
    a.add(stem('gp3_br2', [(0.003, 0, 0.22), (-0.04, 0, 0.26), (-0.05, 0, 0.29)], 0.007))

    a = Asset('garden_plant_4', 'prop', note='growth stage 4: in full bloom ~0.53 m, coral / yellow / mint flowers')
    a.add(stem('gp4_stem', [(0, 0, 0), (0, 0, 0.25), (0.01, 0, 0.44)], 0.015))
    a.add(stem('gp4_br0', [(0.004, 0, 0.25), (0.09, 0.0, 0.31), (0.13, 0.02, 0.38)], 0.01))
    a.add(stem('gp4_br1', [(0.004, 0, 0.28), (-0.08, 0.03, 0.33), (-0.12, 0.04, 0.4)], 0.01))
    a.add(stem('gp4_br2', [(0.004, 0, 0.3), (0.0, -0.08, 0.36), (0.01, -0.11, 0.42)], 0.009))
    a.add(*leaves('gp4_leaf', [(0.05, 0.3, 0.17, 0.065), (0.06, 3.4, 0.17, 0.065), (0.13, 1.9, 0.16, 0.06),
                               (0.15, 5.0, 0.15, 0.06), (0.22, 0.9, 0.13, 0.055), (0.23, 4.0, 0.13, 0.055),
                               (0.31, 2.6, 0.1, 0.045)]))
    a.add(*flower_head('gp4_fl0', (0.01, 0, 0.46), 0.085, 'pal_coral'))
    a.add(*flower_head('gp4_fl1', (0.13, 0.02, 0.39), 0.07, 'pal_yellow', rot=Euler((0.1, 0.4, 0))))
    a.add(*flower_head('gp4_fl2', (-0.12, 0.04, 0.41), 0.07, 'pal_grass_light', eye='pal_yellow', rot=Euler((0.15, -0.4, 0))))
    a.add(*flower_head('gp4_fl3', (0.01, -0.11, 0.43), 0.06, 'pal_coral', rot=Euler((-0.4, 0, 0))))
    a.add(sphere('gp4_bud', 0.024, (0.06, 0.06, 0.4), 'pal_coral_deep', 10, 8, scale=(1, 1, 1.3)))


def torus(name, Rm, rm, mat, loc, rot, nmaj=32, nmin=8):
    bm = bmesh.new()
    rings = []
    for i in range(nmaj):
        a = 2 * pi * i / nmaj
        c = Vector((cos(a), sin(a), 0))
        rings.append([bm.verts.new(c * (Rm + rm * cos(b)) + Z * rm * sin(b)) for b in ls(0, 2 * pi, nmin + 1)[:-1]])
    for i in range(nmaj):
        A, B = rings[i], rings[(i + 1) % nmaj]
        for j in range(nmin):
            k = (j + 1) % nmin
            bm.faces.new((A[j], B[j], B[k], A[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return place(mk(name, bm, mat), loc, rot)


def hull_obj(name, pts, mat):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in pts]
    res = bmesh.ops.convex_hull(bm, input=vs)
    bmesh.ops.delete(bm, geom=[v for v in res.get('geom_interior', []) if isinstance(v, bmesh.types.BMVert)],
                     context='VERTS')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return mk(name, bm, mat)


def crate_parts(px, loc, rz):
    loc = Vector(loc)
    Rm = Matrix.Rotation(rz, 3, 'Z')
    parts = []
    s, t = 0.6, 0.075
    h = s / 2 - t / 2

    def P(x, y, zz):
        return loc + Rm @ Vector((x, y, zz))
    parts.append(rbox(px + '_core', (0.55, 0.55, 0.55), P(0, 0, 0.3), 'pal_wood', 0.035, 2, rot=Rm))
    for y in (-0.276, 0.276):
        parts.append(rbox(px + '_band', (0.45, 0.02, 0.07), P(0, y, 0.3), 'pal_wood_dark', 0.01, 1, rot=Rm))
    for x in (-h, h):
        for y in (-h, h):
            parts.append(rbox(px + '_post', (t, t, s), P(x, y, s / 2), 'pal_wood_dark', 0.026, 2, rot=Rm))
    for zz in (s - t / 2,):
        for y in (-h, h):
            parts.append(rbox(px + '_bx', (s - 2 * t + 0.01, t * 0.9, t * 0.9), P(0, y, zz), 'pal_wood_dark', 0.024, 2,
                              rot=Rm))
        for x in (-h, h):
            parts.append(rbox(px + '_by', (t * 0.9, s - 2 * t + 0.01, t * 0.9), P(x, 0, zz), 'pal_wood_dark', 0.024, 2,
                              rot=Rm))
    return parts


def flag_mesh(a):
    """Pakistan-style pennant: white hoist band + green field with white crescent and star; waves in Y."""
    W, H, th = 0.9, 0.6, 0.026
    x0 = 0.05
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((x0 + (v.co.x + 0.5) * W, v.co.y * th, -H + (v.co.z + 0.5) * H))
    for xc in [x0 + W * k / 10 for k in range(1, 10)] + [x0 + W * 0.25]:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(xc, 0, 0), plane_no=(1, 0, 0))
    for f in bm.faces:
        f.material_index = 0 if f.calc_center_median().x < x0 + W * 0.25 - 1e-4 else 1
    body = mk('flag_body', bm, ['pal_white', 'pal_grass_deep'])
    bevel(body, 0.01, 2, angle=40)
    wnorm(body)
    apply_mods(body)
    # emblem (crescent + star) on both faces
    fx, fz = x0 + W * 0.25 + W * 0.75 / 2, -H / 2
    ang = radians(40)
    dvec = (cos(ang), sin(ang))
    R1, R2, dd = 0.165, 0.138, 0.06
    xi = (dd * dd + R1 * R1 - R2 * R2) / (2 * dd)
    yi = sqrt(max(0, R1 * R1 - xi * xi))
    t1 = atan2(yi, xi)
    cres = [(R1 * cos(t), R1 * sin(t)) for t in ls(t1, 2 * pi - t1, 22)]
    s0, e0 = atan2(-yi, xi - dd), atan2(yi, xi - dd)
    sweep = 2 * pi - (e0 - s0)
    cres += [(dd + R2 * cos(s0 - k * sweep), R2 * sin(s0 - k * sweep)) for k in ls(0, 1, 18)[1:-1]]

    def rot2(p, a, c):
        return (c[0] + p[0] * cos(a) - p[1] * sin(a), c[1] + p[0] * sin(a) + p[1] * cos(a))
    cres = [rot2(p, ang, (fx - 0.02, fz - 0.015)) for p in cres]
    sc = (fx - 0.02 + dvec[0] * 0.115, fz - 0.015 + dvec[1] * 0.115)
    star = [rot2(((0.058 if k % 2 == 0 else 0.024) * cos(k * pi / 5), (0.058 if k % 2 == 0 else 0.024) * sin(k * pi / 5)),
                 ang, sc) for k in range(10)]
    deco = []
    for side in (-1, 1):
        for nm, poly in (('cres', cres), ('star', star)):
            yA = side * (th / 2 - 0.002)
            yB = side * (th / 2 + 0.006)
            o = poly_prism('flag_' + nm, poly, min(yA, yB), max(yA, yB), 'pal_white')
            deco.append(o)
    fl = join([body] + deco, 'flag_geo')
    for v in fl.data.vertices:
        k = max(0.0, (v.co.x - x0) / W)
        v.co.y += 0.055 * sin(2 * pi * k * 1.1 + 0.4) * k - 0.02 * k
        v.co.z -= 0.035 * k * k
    fl.data.update()
    piv = Vector((0.0, 0, 3.22))
    fl.data.transform(Matrix.Identity(4))
    fl.matrix_world = Matrix.Translation(piv)
    fe = empty('flag', piv, kind='PLAIN_AXES')
    a.node(fe)
    a.node(fl, fe)
    return None


# ============================================================================= BAKE / EXPORT
def tri_count(ob):
    me = ob.data
    me.calc_loop_triangles()
    return len(me.loop_triangles)


def descendants(ob):
    out = []
    for c in ob.children:
        out.append(c)
        out += descendants(c)
    return out


def bake_ao():
    sc = scene()
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 96
    world = bpy.data.worlds.new('bakeworld')
    sc.world = world
    world.light_settings.distance = 0.55
    sc.render.bake.target = 'VERTEX_COLORS'
    sc.render.bake.margin = 0
    occluders = []
    meshes = []
    for i, a in enumerate(ASSETS):
        pos = Vector(((i % 10) * 16.0, (i // 10) * 16.0 + 50.0, 0))
        a.root.location = pos
        if a.ground:
            bm = bmesh.new()
            bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=4.0)
            o = mk('occ', bm, None, smooth=False)
            o.location = pos + Vector((0, 0, a.floor))
            occluders.append(o)
        for o in descendants(a.root):
            if o.type == 'MESH':
                meshes.append(o)
    vl_update()
    for o in meshes:
        me = o.data
        attr = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
        me.color_attributes.active_color = attr
        me.color_attributes.render_color_index = me.color_attributes.find('Col')
    for o in sc.objects:
        o.select_set(False)
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    t = time.time()
    try:
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    except Exception as e:
        print('BULK BAKE FAILED, per object:', e)
        for o in meshes:
            for q in sc.objects:
                q.select_set(False)
            o.select_set(True)
            bpy.context.view_layer.objects.active = o
            try:
                bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
            except Exception as e2:
                print('  bake failed', o.name, e2)
                for d in o.data.color_attributes['Col'].data:
                    d.color = (1, 1, 1, 1)
    print('AO bake %.1fs on %d meshes' % (time.time() - t, len(meshes)))
    # soften: keep the contact darkening but never crush to black
    for o in meshes:
        at = o.data.color_attributes['Col']
        for d in at.data:
            c = d.color
            ao = max(0.0, min(1.0, c[0]))
            v = 1.0 - 0.72 * (1.0 - ao) ** 1.15
            d.color = (v, v, v, 1.0)
    for o in occluders:
        bpy.data.objects.remove(o, do_unlink=True)
    for a in ASSETS:
        a.root.location = (0, 0, 0)
    vl_update()


def fix_glb_names(path):
    data = open(path, 'rb').read()
    jlen = struct.unpack_from('<I', data, 12)[0]
    js = json.loads(data[20:20 + jlen].decode('utf8'))
    rest = data[20 + jlen:]
    for key in ('nodes', 'meshes'):
        for n in js.get(key, []):
            if 'name' in n:
                n['name'] = re.sub(r'\.\d{3}$', '', n['name'])
    jb = json.dumps(js, separators=(',', ':')).encode('utf8')
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    total = 12 + 8 + len(jb) + len(rest)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(jb), 0x4E4F534A))
        f.write(jb)
        f.write(rest)


def phase_build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    t = time.time()
    build_tiles()
    build_trees()
    build_props()
    for a in ASSETS:
        finalize(a)
    vl_update()
    print('modelled %d assets in %.1fs' % (len(ASSETS), time.time() - t))
    total = 0
    for a in ASSETS:
        n = sum(tri_count(o) for o in descendants(a.root) if o.type == 'MESH')
        total += n
        print('  %-20s %6d tris' % (a.name, n))
    print('TOTAL TRIS', total)
    bake_ao()
    stray = [o.name for o in scene().objects if o.parent is None and o.name not in {a.name for a in ASSETS}]
    print('STRAY ROOTS', stray)
    bpy.ops.export_scene.gltf(
        filepath=GLB, export_format='GLB', export_yup=True, export_apply=True, export_extras=False,
        export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_normals=True,
        export_draco_mesh_compression_enable=False, export_meshopt_compression_enable=False,
        export_image_format='NONE', export_materials='EXPORT', export_animations=False, export_cameras=False,
        export_lights=False, export_attributes=False, export_tangents=False)
    fix_glb_names(GLB)
    print('GLB bytes', os.path.getsize(GLB))
    json.dump({a.name: {'kind': a.kind, 'note': a.note} for a in ASSETS},
              open(os.path.join(HERE, '_notes.json'), 'w'), indent=1)


# ============================================================================= LOOK-DEV / RENDER
def clean(n):
    return re.sub(r'\.\d{3}$', '', n)


def lookdev_materials():
    colattr = None
    for me in bpy.data.meshes:
        if me.color_attributes:
            colattr = me.color_attributes[0].name
            break
    for m in bpy.data.materials:
        nm = clean(m.name)
        if nm not in PAL:
            continue
        nt = node_tree_of(m)
        nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        b = nt.nodes.new('ShaderNodeBsdfPrincipled')
        ca = nt.nodes.new('ShaderNodeVertexColor')
        ca.layer_name = colattr or 'Col'
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs[0].default_value = 1.0
        col = hexcol(PAL[nm])
        mix.inputs[6].default_value = (*col, 1)
        nt.links.new(ca.outputs['Color'], mix.inputs[7])
        nt.links.new(mix.outputs[2], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.2 if nm == 'pal_glass' else 0.88
        b.inputs['Specular IOR Level'].default_value = 0.35
        b.inputs['Metallic'].default_value = 0.0
        if nm == 'pal_emissive':
            b.inputs['Emission Color'].default_value = (*col, 1)
            b.inputs['Emission Strength'].default_value = 1.6
        nt.links.new(b.outputs[0], out.inputs[0])
    return colattr


def flat_mat(name, hexc, rough=0.9):
    m = bpy.data.materials.new(name)
    nt = node_tree_of(m)
    b = nt.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*hexcol(hexc), 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Specular IOR Level'].default_value = 0.3
    return m


def setup_lookdev():
    sc = scene()
    sc.render.engine = 'BLENDER_EEVEE'
    ee = sc.eevee
    ee.taa_render_samples = 64
    try:
        ee.use_raytracing = True
        ee.use_shadows = True
        ee.shadow_ray_count = 3
        ee.shadow_step_count = 12
        ee.use_fast_gi = True
        ee.fast_gi_distance = 2.0
    except Exception as e:
        print('eevee opt', e)
    vs = sc.view_settings
    vs.view_transform = 'AgX'
    vs.look = 'AgX - Medium High Contrast'
    vs.exposure = 0.0
    w = bpy.data.worlds.new('lookdev')
    sc.world = w
    nt = node_tree_of(w)
    bg = nt.nodes.get('Background')
    bg.inputs[0].default_value = (*hexcol('#DCD6D0'), 1)
    bg.inputs[1].default_value = 0.8
    # water
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=150)
    water = mk('LD_water', bm, None, smooth=False)
    water.data.materials.append(flat_mat('LD_water_m', '#79BFC9', 0.55))
    water.location = (0, 0, -0.55)
    # pink wall
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=150)
    wall = mk('LD_wall', bm, None, smooth=False)
    wall.data.materials.append(flat_mat('LD_wall_m', '#ECBDB7', 0.95))
    wall.rotation_euler = (radians(90), 0, 0)
    # key light
    ld = bpy.data.lights.new('LD_key', 'AREA')
    ld.shape = 'DISK'
    ld.size = 6.0
    ld.energy = 3000
    ld.color = (1.0, 0.97, 0.93)
    try:
        ld.use_shadow_jitter = True
        ld.shadow_jitter_overblur = 10
    except Exception:
        pass
    key = link(bpy.data.objects.new('LD_key', ld))
    cam = link(bpy.data.objects.new('LD_cam', bpy.data.cameras.new('LD_cam')))
    sc.camera = cam
    return water, wall, key, cam


def aim(ob, target):
    d = (Vector(target) - ob.location)
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def dup(root, loc=(0, 0, 0), rz=0.0, s=1.0, rot=None):
    made = []

    def rec(o, parent):
        c = o.copy()
        scene().collection.objects.link(c)
        c.hide_render = False
        c.hide_viewport = False
        made.append(c)
        if parent is None:
            c.parent = None
            c.location = loc
            c.rotation_euler = rot if rot is not None else (0, 0, rz)
            c.scale = (s, s, s)
        else:
            c.parent = parent
        for ch in o.children:
            rec(ch, c)
        return c
    rec(root, None)
    vl_update()
    return made


def world_bbox(objs):
    lo = Vector((1e9, 1e9, 1e9))
    hi = -lo
    for o in objs:
        if o.type != 'MESH':
            continue
        for c in o.bound_box:
            p = o.matrix_world @ Vector(c)
            lo = Vector((min(lo.x, p.x), min(lo.y, p.y), min(lo.z, p.z)))
            hi = Vector((max(hi.x, p.x), max(hi.y, p.y), max(hi.z, p.z)))
    return lo, hi


PREVIEW_BASE = {}


def preview_setup(name):
    """Return (base tile name or None, root offset)."""
    if name.startswith('hex_'):
        return None, (0, 0, 0)
    if name == 'cloud':
        return None, (0, 0, 1.2)
    if name in ('bridge', 'dock'):
        return None, (0, 0, 0)
    if name in ('paper_boat', 'lily_pad'):
        return None, (0, 0, -0.55)
    if name == 'kite':
        return 'hex_grass', (0, 0, 1.0)
    if name == 'idea_bulb':
        return 'hex_cream', (0, 0, 0.45)
    if name == 'ball':
        return 'hex_grass', (0, 0, 0.1)
    if name.startswith('garden_plant'):
        return 'garden_tile', (0, 0, 0.065)
    nature = name.startswith('tree_') or name in ('palm', 'agave', 'cactus_finger', 'tulips', 'bush_round', 'grass_spike',
                                                  'grass_tuft', 'rock_a', 'rock_b', 'flower_patch', 'cricket_stumps',
                                                  'rock_c', 'mushrooms', 'log', 'tree_stump', 'reeds', 'hedge',
                                                  'path_stones', 'bush_flowering', 'grass_tall', 'fence_picket')
    if name in ('palm', 'agave', 'cactus_finger', 'shell', 'starfish', 'pebbles'):
        return 'hex_sand', (0, 0, 0)
    return ('hex_grass' if nature else 'hex_cream'), (0, 0, 0)


def frame_camera(cam, key, wall, lo, hi, lens=60, elev=1.0, minrad=0.35):
    c = (lo + hi) / 2
    rad = max(minrad, (hi - lo).length / 2)
    cam.data.lens = lens
    cam.data.sensor_width = 36
    fov = 2 * math.atan(18 / lens) * 0.75 * 0.98
    dist = rad / math.sin(fov / 2) * 1.05
    d = Vector((-0.95, -1.6, elev)).normalized()
    cam.location = c + d * dist
    aim(cam, c)
    cam.data.clip_start = max(0.01, dist * 0.02)
    cam.data.clip_end = dist * 20 + 200
    kd = max(7.0, rad * 6)
    key.location = c + Vector((-0.55, -0.35, 0.78)).normalized() * kd
    aim(key, c)
    key.data.size = max(4.0, kd * 0.55)
    key.data.energy = 2600 * (kd / 8.0) ** 2
    wall.location = (0, c.y + max(3.5, rad * 4.5), 0)


def phase_render():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    vl_update()
    roots = [o for o in scene().objects if o.parent is None]
    notes = json.load(open(os.path.join(HERE, '_notes.json')))
    # ---------------- validation
    print('=== VALIDATION ===')
    rows = []
    total = 0
    allmats = set()
    for r in sorted(roots, key=lambda o: list(notes).index(clean(o.name)) if clean(o.name) in notes else 999):
        ds = descendants(r)
        tris = 0
        mats = set()
        cols = True
        for o in ds:
            if o.type == 'MESH':
                tris += tri_count(o)
                mats |= {clean(m.name) for m in o.data.materials if m}
                if not o.data.color_attributes:
                    cols = False
        total += tris
        allmats |= mats
        lo, hi = world_bbox(ds)
        size = hi - lo
        specials = [clean(o.name) for o in ds if not clean(o.name).endswith('_mesh')]
        print('ROOT %-20s tris %5d size %.2f x %.2f x %.2f  COL0 %s  mats %s  special %s' % (
            clean(r.name), tris, size.x, size.y, size.z, cols, sorted(mats), specials))
        rows.append((clean(r.name), size, tris, specials, notes.get(clean(r.name), {}).get('note', ''), lo, hi))
    bad = sorted(m for m in allmats if m not in PAL)
    print('TOTAL TRIS', total, ' off-palette materials:', bad, ' animations:', [a.name for a in bpy.data.actions])
    with open(MANIFEST, 'w') as f:
        f.write('# nature pack: MANIFEST\n\n')
        f.write('`nature.glb` - %d roots, %d triangles total, %.0f KB. Built by `build_nature.py`. '
                'Units metres; sizes are the glTF bounding box (x, y, z) in Blender axes (Z up, front -Y). '
                'Every mesh carries baked AO as COLOR_0 (`Col`). Palette materials only. No animations.\n\n'
                % (len(rows), total, os.path.getsize(GLB) / 1024))
        f.write('Conventions: every moving part (`swing_0/1`, `beam`, `lid`, `flag`, `stump_0..2`, `bails`, `arrow_0..3`, `wing_l/r`, lily `flower`) is an Empty at its hinge/axis with the mesh `<name>_geo` under it; seat/slide/use Empties face local -Y. Swings and the seesaw beam (laid along Y) rotate about X; wings flap about Y; signpost arrows point along local +-X with `label_N` quads (UV 0..1) facing -Y. `bridge` and `dock` have deck top at Z=0 with structure below (ends at Y=+-1). `ball` radius is 0.1 m. `lily_pad` origin is at water level. `fence`, `fence_picket` and `hedge` chain along X at x=+-1.\n\n')
        for nm, size, tris, sp, note, lo, hi in rows:
            f.write('- **%s**: %.2f x %.2f x %.2f m (z %.2f..%.2f), %d tris; special: %s; %s\n' % (
                nm, size.x, size.y, size.z, lo.z, hi.z, tris, ', '.join('`%s`' % s for s in sp) or 'none', note))
    if 'render' not in PHASES and 'sheet' not in PHASES:
        return
    lookdev_materials()
    for o in scene().objects:
        o.hide_render = True
    water, wall, key, cam = setup_lookdev()
    for o in (water, wall, key, cam):
        o.hide_render = False
    sc = scene()
    rootmap = {clean(r.name): r for r in roots}
    if 'render' in PHASES:
        os.makedirs(PREV, exist_ok=True)
        sc.render.resolution_x, sc.render.resolution_y = 800, 600
        for nm in rootmap:
            if ONLY and nm not in ONLY:
                continue
            base, off = preview_setup(nm)
            made = dup(rootmap[nm], off)
            lo, hi = world_bbox(made)
            if nm == 'hex_column':
                lo.z = -1.4
            if base:
                made += dup(rootmap[base], (0, 0, 0))
            frame_camera(cam, key, wall, lo, hi, lens=60, minrad=0.14)
            sc.render.filepath = os.path.join(PREV, nm + '.png')
            bpy.ops.render.render(write_still=True)
            for o in made:
                bpy.data.objects.remove(o, do_unlink=True)
            print('rendered', nm)
    if 'sheet' in PHASES:
        contact_sheet(rootmap, cam, key, wall)


def hex_xy(q, r, R=2.0):
    return Vector((sqrt(3) * R * (q + r / 2), 1.5 * R * r, 0))


def contact_sheet(rm, cam, key, wall):
    sc = scene()
    rnd = random.Random(3)
    made = []

    def put(name, loc, rz=0.0, s=1.0):
        made.extend(dup(rm[name], Vector(loc), rz, s))

    nb = [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)]
    grass_tiles = []
    all_tiles = []

    def island(center, tiles):
        for (q, r), kind, h in tiles:
            p = center + hex_xy(q, r) + Vector((0, 0, h))
            put(kind, p)
            if h > 0.01:
                put('hex_column', p - Vector((0, 0, 1.2)))
            if kind in ('hex_grass', 'hex_grass_deep'):
                grass_tiles.append(p)
            all_tiles.append(p)

    A = Vector((-7.0, -0.5, 0))
    gapdir = lambda deg: Vector((cos(radians(deg)), sin(radians(deg)), 0))
    # B joins A across a 2 m gap (bridge) at 60 deg; C sits 3.4 m off A at 300 deg (stepping stones)
    Ta = A + hex_xy(1, 0)
    Bc = Ta + gapdir(60) * (sqrt(3) * 2 + 2.0) - hex_xy(0, -1)
    Ta2 = A + hex_xy(1, -1)
    Cc = Ta2 + gapdir(300) * (sqrt(3) * 2 + 3.4) - hex_xy(-1, 1)
    island(A, [((0, 0), 'hex_grass', 0), ((1, 0), 'hex_grass', 0), ((-1, 0), 'hex_grass_deep', 0),
               ((0, 1), 'hex_grass', 0.6), ((0, -1), 'hex_grass', 0), ((1, -1), 'hex_stone', 0), ((-1, 1), 'hex_grass', 0),
               ((-1, -1)  , 'hex_grass_deep', 0)])
    island(Bc, [((0, 0), 'hex_cream', 0), ((1, 0), 'hex_cream', 0), ((-1, 0), 'hex_grass', 0), ((0, 1), 'hex_grass_deep', 0),
                ((0, -1), 'hex_cream', 0), ((1, -1), 'hex_grass', 0), ((1, 1), 'hex_grass', 0)])
    island(Cc, [((0, 0), 'hex_sand', 0), ((1, 0), 'hex_sand', 0), ((-1, 0), 'hex_grass', 0), ((0, 1), 'hex_sand', 0),
                ((-1, 1), 'hex_sand', 0)])
    # island A (park)
    put('tree_cushion_deep', A + hex_xy(0, 1) + Vector((0.2, 0.3, 0.6)))
    put('tree_pear_mint', A + hex_xy(-1, 0) + Vector((-0.4, 0.5, 0)))
    put('tree_pear_light', A + hex_xy(-1, 0) + Vector((0.7, -0.6, 0)))
    put('tree_capsule_coral', A + hex_xy(-1, 1) + Vector((0.0, 0.3, 0)))
    put('tree_blob_coral', A + hex_xy(1, 0) + Vector((0.9, -0.6, 0)))
    put('tree_blob_mint', A + hex_xy(-1, -1) + Vector((-0.2, 0.2, 0)))
    put('bush_round', A + hex_xy(0, 1) + Vector((-0.9, -0.6, 0.6)))
    put('bench', A + hex_xy(0, -1) + Vector((0.0, 0.2, 0)), radians(8))
    put('lamp_post', A + hex_xy(0, -1) + Vector((1.15, 0.3, 0)))
    put('tulips', A + hex_xy(0, 0) + Vector((-0.8, -0.5, 0)))
    put('flower_patch', A + hex_xy(1, 0) + Vector((-0.8, -0.5, 0)))
    put('rock_a', A + hex_xy(-1, -1) + Vector((0.9, -0.6, 0)))
    put('signpost', A + hex_xy(1, -1) + Vector((0.4, 0.4, 0)), radians(-20))
    put('cricket_stumps', A + hex_xy(0, 0) + Vector((0.8, 0.6, 0)), radians(-20))
    put('ball', A + hex_xy(0, 0) + Vector((0.1, -0.1, 0.1)))
    put('mailbox', A + hex_xy(1, -1) + Vector((-0.6, -0.5, 0)), radians(-10))
    # island B (playground)
    put('swing_set', Bc + hex_xy(0, 0) + Vector((0, 0.2, 0)), radians(4))
    put('slide', Bc + hex_xy(1, 0) + Vector((0.2, 0.6, 0)), radians(-28))
    put('seesaw', Bc + hex_xy(0, -1) + Vector((0, 0, 0)), radians(80))
    put('tree_blob_coral', Bc + hex_xy(0, 1) + Vector((0.3, 0.2, 0)))
    put('tree_capsule_coral', Bc + hex_xy(-1, 0) + Vector((-0.5, 0.4, 0)))
    put('tree_pear_mint', Bc + hex_xy(1, 1) + Vector((0, 0, 0)))
    put('tree_cushion_deep', Bc + hex_xy(1, -1) + Vector((0.5, 0.2, 0)))
    put('flagpole', Bc + hex_xy(-1, 0) + Vector((0.6, -0.7, 0)))
    put('fence', Bc + hex_xy(1, -1) + Vector((-0.2, -1.1, 0)), radians(-30))
    put('hex_planter', Bc + hex_xy(-1, 0) + Vector((-0.4, -0.6, 0)))
    put('tulips', Bc + hex_xy(-1, 0) + Vector((-0.4, -0.6, 0.35)))
    put('idea_seed', Bc + hex_xy(1, 0) + Vector((-0.6, -0.9, 0)))
    put('idea_bulb', Bc + hex_xy(0, -1) + Vector((1.2, -0.4, 0.7)))
    # island C (beach)
    put('palm', Cc + hex_xy(0, 1) + Vector((-0.4, 0.2, 0)), radians(-30))
    put('palm', Cc + hex_xy(1, 0) + Vector((0.6, 0.4, 0)), radians(200), 0.85)
    put('agave', Cc + hex_xy(0, 0) + Vector((-0.6, 0.2, 0)))
    put('cactus_finger', Cc + hex_xy(1, 0) + Vector((-0.5, -0.6, 0)))
    put('crate_stack', Cc + hex_xy(-1, 0) + Vector((0.2, 0.6, 0)), radians(-15))
    put('barrel', Cc + hex_xy(-1, 0) + Vector((-0.9, -0.3, 0)))
    put('crate', Cc + hex_xy(0, 0) + Vector((0.8, -0.5, 0)), radians(20))
    put('rock_b', Cc + hex_xy(0, 1) + Vector((1.0, -0.4, 0)))
    put('chai_cup', Cc + hex_xy(-1, 0) + Vector((0.2, 0.6, 0.6)))
    dk = Cc + hex_xy(1, 0) + Vector((sqrt(3) + 0.98, 0, 0))
    put('dock', dk, radians(90))
    put('dock', dk + Vector((2.0, 0, 0)), radians(90))
    put('paper_boat', dk + Vector((1.6, -2.0, -0.55)), radians(60), 2.2)
    put('bird', dk + Vector((2.85, 0.82, 0.2)), radians(-60), 1.6)
    put('lily_pad', dk + Vector((0.4, 1.9, -0.55)), 0.5, 1.1)
    # round-2 detail
    put('hedge', A + hex_xy(-1, 1) + Vector((-0.2, 1.2, 0)), radians(-30))
    put('flower_bed', A + hex_xy(1, 0) + Vector((-0.6, 0.9, 0)))
    put('path_stones', A + hex_xy(0, -1) + Vector((-0.9, -0.2, 0)), radians(20))
    put('mushrooms', A + hex_xy(-1, 0) + Vector((0.3, 0.1, 0)))
    put('log', A + hex_xy(-1, -1) + Vector((0.2, -0.8, 0)), radians(25))
    put('tree_stump', A + hex_xy(1, -1) + Vector((0.5, -0.9, 0)))
    put('bush_flowering', A + hex_xy(0, 0) + Vector((0.2, 1.1, 0)))
    put('grass_tall', A + hex_xy(-1, 1) + Vector((-1.1, -0.5, 0)))
    put('rock_c', A + hex_xy(-1, -1) + Vector((-1.0, 0.5, 0)))
    put('pebbles', A + hex_xy(1, -1) + Vector((-0.3, 0.9, 0)))
    put('tree_small_mint', Bc + hex_xy(1, -1) + Vector((-0.6, -0.5, 0)))
    put('tree_small_coral', Bc + hex_xy(-1, 0) + Vector((0.6, 0.8, 0)))
    put('fence_picket', Bc + hex_xy(1, 1) + Vector((0.4, 1.0, 0)), radians(-30))
    put('bench', Bc + hex_xy(0, 1) + Vector((-0.3, 0.6, 0)), radians(180))
    put('shell', Cc + hex_xy(0, 0) + Vector((0.2, -1.1, 0)), radians(40), 1.2)
    put('starfish', Cc + hex_xy(1, 0) + Vector((0.3, -1.0, 0)), radians(10), 1.2)
    put('pebbles', Cc + hex_xy(0, 1) + Vector((0.6, 0.9, 0)))
    for k, (dx, dy) in enumerate(((-2.7, -1.2), (-3.1, -0.3), (-2.2, -2.0))):
        put('lily_pad', A + hex_xy(0, -1) + Vector((dx + 1.0, dy - 1.4, -0.55)), k * 1.7, 1.0 + 0.2 * k)
    put('reeds', A + hex_xy(-1, -1) + Vector((-1.3, -0.8, 0)))
    put('reeds', Cc + hex_xy(-1, 0) + Vector((-1.4, -0.6, 0)), 1.0, 0.9)
    # links
    put('bridge', Ta + gapdir(60) * (sqrt(3) + 1.0), radians(60) - pi / 2)
    for t, off in ((0.3, -0.25), (0.7, 0.25)):
        q = Ta2 + gapdir(300) * (sqrt(3) + 3.4 * t) + gapdir(30) * off
        put('hex_step', q - Vector((0, 0, 0.05)), 0.0)
    # sky
    allc = [A, Bc, Cc]
    mid = sum(allc, Vector()) / 3
    put('cloud', mid + Vector((-7.5, 8.5, 5.0)), 0, 1.25)
    put('cloud', mid + Vector((6.0, 10.0, 6.0)), 0.4, 1.0)
    put('kite', mid + Vector((-8.0, 2.0, 6.0)), radians(10), 1.6)
    # garden row
    for i in range(4):
        put('garden_tile', Bc + hex_xy(0, 1) + Vector((-0.65 + i * 0.44, -0.9, 0)))
        put('garden_plant_%d' % (i + 1), Bc + hex_xy(0, 1) + Vector((-0.65 + i * 0.44, -0.9, 0.065)))
    # grass spikes and tufts scattered on grass tiles (as the engine will)
    occupied = [o.matrix_world.translation.copy() for o in made if o.parent is None and not clean(o.name).startswith('hex_')]
    for p in grass_tiles:
        n = 0
        tries = 0
        while n < 16 and tries < 80:
            tries += 1
            a_ = rnd.uniform(0, 2 * pi)
            rr = sqrt(rnd.random()) * 1.55
            q = p + Vector((cos(a_) * rr, sin(a_) * rr, 0))
            if any((Vector((q.x - o.x, q.y - o.y)).length < 0.75) for o in occupied):
                continue
            put('grass_tuft' if rnd.random() < 0.25 else 'grass_spike', q, rnd.uniform(0, 6.28), rnd.uniform(0.8, 1.3))
            n += 1
    sc.render.resolution_x, sc.render.resolution_y = 1800, 1200
    cam.data.lens = 72
    cam.data.sensor_width = 36
    tc = sum(all_tiles, Vector()) / len(all_tiles)
    target = Vector((tc.x, tc.y, 0.4)) + Vector((0.4, -0.6, 0))
    d = Vector((-0.75, -1.5, 1.22)).normalized()
    cam.location = target + d * 64
    aim(cam, target)
    cam.data.clip_start = 1
    cam.data.clip_end = 500
    key.location = target + Vector((-0.55, -0.3, 0.78)).normalized() * 30
    aim(key, target)
    key.data.size = 14
    key.data.energy = 2600 * (30 / 8.0) ** 2
    wall.location = (0, mid.y + 14.0, 0)
    sc.render.filepath = SHEET
    bpy.ops.render.render(write_still=True)
    print('contact sheet done')


if __name__ == '__main__':
    t0 = time.time()
    if 'build' in PHASES:
        phase_build()
        os.makedirs(SRC_MODELS, exist_ok=True)
        shutil.copyfile(GLB, os.path.join(SRC_MODELS, 'nature.glb'))
        print('copied to', SRC_MODELS)
    if 'render' in PHASES or 'sheet' in PHASES or 'build' in PHASES:
        phase_render()
    print('DONE in %.1fs' % (time.time() - t0))
