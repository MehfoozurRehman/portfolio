"""Launch Isles - DETAILS pack generator (ambient life and storytelling props).

Rebuild everything from scratch with one command (Git Bash):
  "/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup --python build_details.py

Optional phases after `--`:  build  render  sheet   (default: all three)
  render only=duck,rickshaw   renders a subset of previews.

Phase build : models every asset procedurally, bakes Cycles AO into vertex colour `Col`,
              exports details.glb (no Draco/meshopt/KTX), cleans node names, copies to world/src/models.
Phase render: re-imports the GLB (validation printout + MANIFEST.md), borrows hex tiles and a few
              props from ../nature/nature.glb for staging, renders previews/<root>.png.
Phase sheet : renders contact_sheet.png (a bazaar corner and a pond/lagoon side).
"""
import bpy, bmesh, math, os, sys, random, json, struct, re, shutil, time
from math import sin, cos, pi, sqrt, atan2, asin, radians
from mathutils import Vector, Matrix, Euler, noise

HERE = os.path.dirname(os.path.abspath(__file__))
GLB = os.path.join(HERE, 'details.glb')
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


def plank(name, size, loc, mat, bev=0.03, grooves=2, depth=0.0065, rot=None):
    """Rounded plank with soft wood-grain grooves running along X on its +Z face."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    sy = size[1]
    ys = [(-sy / 2 + sy * (k + 1) / (grooves + 1)) for k in range(grooves)]
    hw = min(0.012, sy / (grooves + 1) * 0.3)
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
    def __init__(self, name, kind='details', ground=True, floor=0.0, note=''):
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



# ============================================================================= DETAILS: extra helpers
from math import copysign

RX90 = (pi / 2, 0, 0)          # local XY slab -> standing in XZ (thickness along -Y)
RYZ = (pi / 2, 0, pi / 2)      # local XY slab -> standing in YZ (local x->Y, y->Z, z->X)


def ell(name, loc, rad, mat, segs=16, rings=10, rot=None):
    if not isinstance(rad, (tuple, list)):
        rad = (rad, rad, rad)
    f = min(1.0, 0.6 + 3.5 * max(rad))          # adaptive resolution: tiny spheres get fewer segments
    segs, rings = max(8, int(round(segs * f / 2)) * 2), max(min(5, rings), int(round(rings * f)))
    return sphere(name, 1.0, loc, mat, segs, rings, scale=rad, rot=rot)


def rod(name, p0, p1, r, mat, c=None, segs=14, rt=None, n=2):
    L = (Vector(p1) - Vector(p0)).length
    c = r * 0.45 if c is None else c
    return lathe(name, rcyl_prof(r, L, c=c, rt=rt, n=n), mat, segs, p0, orient(p0, p1))


_rcyl_base = rcyl_prof


def rcyl_prof(r, h, c=None, cb=None, rt=None, bulge=0.0, bbulge=None, n=3, z0=0.0):
    return _rcyl_base(r, h, c, cb, rt, bulge, bbulge, n, z0)


_rbox_base = rbox


def rbox(name, size, loc, mat, bev=0.03, segs=3, rot=None):
    if max(size) < 0.6:
        segs = min(segs, 2)
    return _rbox_base(name, size, loc, mat, bev, segs, rot)


def cone(name, p0, p1, r0, r1, mat, segs=12, rings=3):
    return capsule(name, p0, p1, r0, mat, segs, rings, r1=r1)


def mkp(name, bm, matfn, smooth=True):
    names = []
    for f in bm.faces:
        n = matfn(f.calc_center_median())
        if n not in names:
            names.append(n)
        f.material_index = names.index(n)
    return mk(name, bm, names, smooth)


def bands(*spec):
    mats, zs = spec[0::2], spec[1::2]

    def fn(c):
        return mats[sum(1 for z in zs if c.z > z)]
    return fn


def lathe_p(name, prof, matfn, segs=24, loc=(0, 0, 0), rot=None, scale=None, deform=None, phase=0.0):
    bm = bm_lathe(prof, segs, True, phase)
    names = []
    for f in bm.faces:
        n = matfn(f.calc_center_median())
        if n not in names:
            names.append(n)
        f.material_index = names.index(n)
    if scale:
        for v in bm.verts:
            v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2]))
    if deform:
        for v in bm.verts:
            v.co = Vector(deform(v.co))
    return place(mk(name, bm, names), loc, rot)


def ellipse_pts(rx, ry, n=24, cx=0.0, cy=0.0, rot=0.0):
    out = []
    for j in range(n):
        t = 2 * pi * j / n
        x, y = rx * cos(t), ry * sin(t)
        out.append((cx + x * cos(rot) - y * sin(rot), cy + x * sin(rot) + y * cos(rot)))
    return out


def rrect_pts(w, h, r, n=5, cx=0.0, cy=0.0):
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4)
    out = []
    for (qx, qy, a0) in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, pi / 2), (-w / 2 + r, -h / 2 + r, pi),
                         (w / 2 - r, -h / 2 + r, 1.5 * pi)):
        for a in ls(a0, a0 + pi / 2, n):
            out.append((cx + qx + r * cos(a), cy + qy + r * sin(a)))
    return dedupe(out)


def slab(name, pts, z0, z1, mat, bev=0.01, segs=2, loc=(0, 0, 0), rot=None):
    bm = bmesh.new()
    a = [bm.verts.new((x, y, z0)) for x, y in pts]
    b = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    ob = mk(name, bm, mat)
    if bev > 0:
        bevel(ob, bev, segs, angle=60)
    wnorm(ob)
    return place(ob, loc, rot)


def vslab(name, pts_xz, y0, y1, mat, bev=0.01, segs=2, loc=(0, 0, 0)):
    """Slab standing in the XZ plane, thickness from y0 to y1 (relative to loc)."""
    return slab(name, pts_xz, -y1, -y0, mat, bev, segs, loc, RX90)


def xslab(name, pts_yz, x0, x1, mat, bev=0.01, segs=2, loc=(0, 0, 0)):
    """Slab standing in the YZ plane, thickness from x0 to x1."""
    return slab(name, pts_yz, x0, x1, mat, bev, segs, loc, RYZ)


def quad_uv(name, w, h, loc, rot, mat):
    """Flat quad in local XZ, normal -Y, UVs 0..1 (u along +X, v along +Z)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new((-w / 2, 0, -h / 2)), bm.verts.new((w / 2, 0, -h / 2)), bm.verts.new((w / 2, 0, h / 2)),
          bm.verts.new((-w / 2, 0, h / 2))]
    f = bm.faces.new(vs)
    for l, t in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
        l[uv].uv = t
    ob = mk(name, bm, mat, smooth=False)
    return place(ob, loc, rot)


def xform(objs, M):
    for o in objs:
        if o is not None:
            o.matrix_world = M @ o.matrix_world
    return objs


def wheel(px, c, R, rt, tyre='pal_ink', hub='pal_cream', spokes=0, spoke_mat='pal_cream', sr=0.01, nmaj=22):
    c = Vector(c)
    parts = [torus(px + '_tyre', R, rt, tyre, c, (0, pi / 2, 0), nmaj, 6)]
    parts.append(lathe(px + '_hub', rcyl_prof(max(0.03, R * 0.22), rt * 1.9, c=rt * 0.6, z0=-rt * 0.95, n=2), hub, 12, c,
                       (0, pi / 2, 0)))
    for k in range(spokes):
        a = 2 * pi * k / spokes
        d = Vector((0, cos(a), sin(a)))
        parts.append(rod(px + '_sp', c + d * R * 0.2, c + d * (R - rt * 0.5), sr, spoke_mat, segs=5, n=1))
    return parts


def arc_path(c, R, a0, a1, n, x=0.0):
    c = Vector(c)
    return [c + Vector((x, R * cos(a), R * sin(a))) for a in ls(a0, a1, n)]


def u_curve(hw, depth, n, e=0.5):
    """Half-rounded U cross-section from left rim (-hw, 0) to right rim (hw, 0), arc-length resampled."""
    dense = []
    for k in range(241):
        a = pi * k / 240
        ca, sa = cos(a), sin(a)
        dense.append((-hw * copysign(abs(ca) ** e, ca), -depth * abs(sa) ** e))
    acc = [0.0]
    for p, q in zip(dense, dense[1:]):
        acc.append(acc[-1] + sqrt((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2))
    out = []
    j = 0
    for i in range(n):
        s = acc[-1] * i / (n - 1)
        while j < len(acc) - 2 and acc[j + 1] < s:
            j += 1
        t = (s - acc[j]) / max(1e-9, acc[j + 1] - acc[j])
        out.append((dense[j][0] + (dense[j + 1][0] - dense[j][0]) * t, dense[j][1] + (dense[j + 1][1] - dense[j][1]) * t))
    return out


def boat_hull(name, L, W, D, rim, sheer, th, outer, low, inner, rimmat, low_z=0.0, nsec=20, npts=17, stern_w=0.6,
              bow_lift=0.06):
    def wf(t):
        if t < 0.5:
            return max(0.03, sin(pi / 2 * t / 0.5) ** 0.7)
        return 1 - (1 - stern_w) * ((t - 0.5) / 0.5) ** 2

    def zr(t):
        return rim + sheer * (2 * t - 1) ** 2 + bow_lift * max(0.0, 1 - t / 0.3)

    def dep(t):
        rake = 0.3 + 0.7 * smooth01(t / 0.32)
        return D * (1 - 0.3 * abs(2 * t - 1) ** 2.5) * rake + (zr(t) - rim)

    bm = bmesh.new()
    rings = []
    for i in range(nsec):
        t = i / (nsec - 1)
        t = 0.5 - 0.5 * cos(pi * t)
        y = -L / 2 + L * t
        hw = W / 2 * wf(t)
        z0 = zr(t)
        tt = min(th, hw * 0.45)
        o = u_curve(hw, dep(t), npts)
        inn = u_curve(hw - tt, dep(t) - tt, npts)
        ring = [(x, y, z0 + z) for x, z in o]
        ring.append((hw - tt / 2, y, z0 + tt * 0.45))
        ring += [(x, y, z0 + z) for x, z in reversed(inn)]
        ring.append((-hw + tt / 2, y, z0 + tt * 0.45))
        rings.append([bm.verts.new(p) for p in ring])
    m = len(rings[0])
    for A, B in zip(rings, rings[1:]):
        for j in range(m):
            k = (j + 1) % m
            f = bm.faces.new((A[j], A[k], B[k], B[j]))
            if j < npts - 1:
                f.material_index = 1 if f.calc_center_median().z < low_z else 0
            elif npts - 1 <= j <= npts or j >= 2 * npts:
                f.material_index = 3
            else:
                f.material_index = 2
    f0 = bm.faces.new(rings[0])
    f0.material_index = 0
    f1 = bm.faces.new(list(reversed(rings[-1])))
    f1.material_index = 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    ob = mk(name, bm, [outer, low, inner, rimmat])
    info = {'hw': lambda t: W / 2 * wf(t), 'zr': zr, 'dep': dep}
    return ob, info


def sail(name, A, B, C, bulge, th, mat, n=8, side=Vector((1, 0, 0))):
    A, B, C = Vector(A), Vector(B), Vector(C)
    bm = bmesh.new()
    idx = {}
    for i in range(n + 1):
        for j in range(n + 1 - i):
            a, b, c = 1 - (i + j) / n, j / n, i / n
            p = A * a + B * b + C * c + side * (bulge * 27 * a * b * c * 0.5 + bulge * 4 * b * (1 - b) * 0.25)
            idx[(i, j)] = bm.verts.new(p)
    for i in range(n):
        for j in range(n - i):
            bm.faces.new((idx[(i, j)], idx[(i, j + 1)], idx[(i + 1, j)]))
            if j < n - i - 1:
                bm.faces.new((idx[(i, j + 1)], idx[(i + 1, j + 1)], idx[(i + 1, j)]))
    ob = mk(name, bm, mat)
    s = ob.modifiers.new('so', 'SOLIDIFY')
    s.thickness = th
    s.offset = 0.0
    bevel(ob, th * 0.45, 2, angle=50)
    return ob


def canopy(name, R, H, npan, mats, z0, rings=7, per=4, scallop=0.05, th=0.03):
    """Striped umbrella / awning dome, panels alternate through mats; scalloped rim."""
    bm = bmesh.new()
    nseg = npan * per
    apex = bm.verts.new((0, 0, z0 + H))
    grid = []
    for i in range(1, rings + 1):
        t = i / rings
        row = []
        for j in range(nseg):
            a = 2 * pi * j / nseg
            frac = (j % per) / per
            dip = sin(pi * frac)
            r = R * t * (1 - 0.035 * dip * t)
            z = z0 + H * (1 - t ** 1.6) + scallop * dip * t ** 6 - 0.012 * dip * t
            row.append(bm.verts.new((r * cos(a), r * sin(a), z)))
        grid.append(row)
    for j in range(nseg):
        k = (j + 1) % nseg
        f = bm.faces.new((apex, grid[0][j], grid[0][k]))
        f.material_index = (j // per) % len(mats)
    for A, B in zip(grid, grid[1:]):
        for j in range(nseg):
            k = (j + 1) % nseg
            f = bm.faces.new((A[j], B[j], B[k], A[k]))
            f.material_index = (j // per) % len(mats)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:
        if f.normal.z < 0:
            f.normal_flip()
    uniq = list(dict.fromkeys(mats))
    remap = [uniq.index(m) for m in mats]
    for f in bm.faces:
        f.material_index = remap[f.material_index]
    ob = mk(name, bm, uniq)
    s = ob.modifiers.new('so', 'SOLIDIFY')
    s.thickness = th
    s.offset = -1.0
    bevel(ob, th * 0.45, 2, angle=50)
    return ob


def squircle(name, size, loc, mat, e=0.4, segs=28, rings=18, rot=None):
    bm = bm_lathe(sphere_prof(1.0, rings), segs)

    def f(c):
        return copysign(abs(c) ** e, c)
    for v in bm.verts:
        v.co = Vector((f(v.co.x) * size[0], f(v.co.y) * size[1], f(v.co.z) * size[2]))
    return place(mk(name, bm, mat), loc, rot)


def catenary(L, sag, n):
    return [Vector((L * i / (n - 1), 0, -sag * (1 - (2 * i / (n - 1) - 1) ** 2))) for i in range(n)]


def fruit(px, loc, kind, rnd=None, s=1.0):
    loc = Vector(loc)
    if kind == 'orange':
        return [ell(px + '_or', loc, 0.045 * s, 'pal_coral', 8, 4)]
    if kind == 'mango':
        return [ell(px + '_mg', loc, (0.04 * s, 0.055 * s, 0.038 * s), 'pal_yellow', 8, 4,
                    rot=(0, 0, rnd.uniform(0, pi) if rnd else 0))]
    if kind == 'guava':
        return [ell(px + '_gv', loc, 0.042 * s, 'pal_grass_light', 8, 4)]
    if kind == 'apple':
        return [ell(px + '_ap', loc, (0.044 * s, 0.044 * s, 0.04 * s), 'pal_coral_deep', 8, 4)]
    return []


def pile(px, center, kind, rows, spacing, rnd, s=1.0):
    """Pyramid pile of fruit; rows = base edge count."""
    out = []
    c = Vector(center)
    z = 0.0
    for lvl in range(rows):
        n = rows - lvl
        off = (n - 1) * spacing / 2
        for i in range(n):
            for j in range(n):
                p = c + Vector((i * spacing - off + rnd.uniform(-0.004, 0.004),
                                j * spacing * 0.9 - off * 0.9 + rnd.uniform(-0.004, 0.004), z))
                out += fruit(px, p, kind, rnd, s)
        z += spacing * 0.72
    return out


def eye_pair(px, center, dx, r, outward=Vector((0, -1, 0)), hl=True):
    out = []
    for sx in (-1, 1):
        e = Vector(center) + Vector((sx * dx, 0, 0))
        out.append(ell(px + '_eye', e, r, 'pal_ink', 10, 7))
        if hl:
            out.append(ell(px + '_hl', e + outward * r * 0.75 + Vector((sx * r * 0.2, 0, r * 0.35)), r * 0.32,
                           'pal_white', 6, 4))
    return out


RD = random.Random(11)


# ============================================================================= WATER LIFE
def build_water():
    # ---- duck / duckling (origin at waterline; body dips 3 cm)
    for name, s, body, wing, note in (('duck', 0.75, 'pal_white', 'pal_cream',
                                        'white clay duck ~0.3 m; origin at waterline; `head` pivots at the neck'),
                                       ('duckling', 0.42, 'pal_yellow', 'pal_yellow',
                                        'yellow duckling; origin at waterline; `head` pivots at the neck')):
        a = Asset(name, ground=False, note=note)
        zc = 0.035 * s
        a.add(ell(name + '_body', (0, 0.01 * s, zc), (0.105 * s, 0.15 * s, 0.085 * s), body, 26, 16))
        a.add(ell(name + '_chest', (0, -0.075 * s, zc + 0.02 * s), (0.085 * s, 0.075 * s, 0.078 * s), body, 22, 14))
        a.add(cone(name + '_tail', (0, 0.09 * s, zc + 0.025 * s), (0, 0.195 * s, zc + 0.1 * s), 0.065 * s, 0.014 * s,
                   body, 14, 3))
        for sx in (-1, 1):
            a.add(ell(name + '_wing', (sx * 0.088 * s, 0.045 * s, zc + 0.04 * s), (0.032 * s, 0.1 * s, 0.048 * s), wing,
                      14, 8, rot=(radians(-14), 0, sx * radians(-7))))
        neck = Vector((0, -0.085 * s, zc + 0.06 * s))
        hc = Vector((0, -0.115 * s, zc + 0.165 * s))
        hp = [ell(name + '_neck', (0, -0.095 * s, zc + 0.1 * s), (0.048 * s, 0.048 * s, 0.07 * s), body, 14, 8),
              ell(name + '_skull', hc, (0.066 * s, 0.064 * s, 0.062 * s), body, 20, 12),
              ell(name + '_beak', hc + Vector((0, -0.072 * s, -0.014 * s)), (0.036 * s, 0.042 * s, 0.015 * s),
                  'pal_coral', 14, 8)]
        hp += eye_pair(name, hc + Vector((0, -0.048 * s, 0.014 * s)), 0.036 * s, 0.0115 * s)
        for sx in (-1, 1):
            hp.append(ell(name + '_cheek', hc + Vector((sx * 0.045 * s, -0.032 * s, -0.02 * s)),
                          (0.006 * s, 0.014 * s, 0.009 * s), 'pal_peach', 8, 6, rot=(0, 0, sx * 0.6)))
        a.node(pivot_mesh('head', hp, neck))

    # ---- fish (origin at centre)
    a = Asset('fish', ground=False, note='coral fish 0.28 m incl. tail; origin at body centre; head toward -Y')
    Lb, Rm = 0.19, 0.06
    prof = [(0, -Lb / 2)]
    for t in ls(0.04, 0.96, 13):
        r = Rm * sqrt(max(0.0, sin(pi * t))) * (0.5 + 0.5 * t)
        prof.append((r, -Lb / 2 + Lb * t))
    prof.append((0, Lb / 2))
    a.add(lathe_p('fish_body', prof, lambda c: 'pal_peach' if c.y < -0.02 else 'pal_coral', 18, (0, 0, 0), RX90,
                  scale=(0.62, 1, 1)))
    for sz in (-1, 1):
        a.add(ell('fish_tail', (0, 0.128, sz * 0.026), (0.007, 0.052, 0.022), 'pal_coral_deep', 12, 8,
                  rot=(sz * radians(38), 0, 0)))
    a.add(ell('fish_dorsal', (0, 0.0, 0.05), (0.007, 0.05, 0.022), 'pal_coral_deep', 12, 8, rot=(radians(-12), 0, 0)))
    for sx in (-1, 1):
        a.add(ell('fish_pec', (sx * 0.03, -0.02, -0.018), (0.004, 0.026, 0.012), 'pal_coral_deep', 10, 6,
                  rot=(radians(20), 0, sx * radians(25))))
        e = Vector((sx * 0.023, -0.058, 0.012))
        a.add(ell('fish_eyew', e, 0.0105, 'pal_white', 10, 7))
        a.add(ell('fish_eye', e + Vector((sx * 0.006, -0.002, 0)), 0.0062, 'pal_ink', 8, 6))
    a.add(torus('fish_lip', 0.008, 0.0035, 'pal_coral_deep', (0, -0.094, -0.004), (pi / 2, 0, 0), 10, 5))

    # ---- rowboat (origin at waterline centre)
    a = Asset('rowboat', ground=False, note='cream-and-coral rowboat 2.4 m; origin at waterline centre; bow at -Y')
    hull, hi = boat_hull('rb_hull', 2.4, 1.05, 0.46, 0.3, 0.07, 0.06, 'pal_cream', 'pal_coral', 'pal_wood',
                         'pal_coral', low_z=0.05)
    a.add(hull)
    # rub rail along the outer rim
    for sx in (-1, 1):
        path = []
        for t in ls(0.03, 0.995, 26):
            tt = 0.5 - 0.5 * cos(pi * t)
            path.append(Vector((sx * (hi['hw'](tt) + 0.008), -1.2 + 2.4 * tt, hi['zr'](tt) - 0.045)))
        a.add(tube('rb_rail', path, lambda u: 0.024, 'pal_coral', sides=8))
    # floor boards and thwarts
    for y, w in ((-0.35, 0.22), (0.45, 0.24)):
        t = (y + 1.2) / 2.4
        hw = hi['hw'](t) - 0.05
        a.add(rbox('rb_thwart', (hw * 2, w, 0.05), (0, y, hi['zr'](t) - 0.13), 'pal_wood', 0.02, 2))
    for x in (-0.16, 0, 0.16):
        a.add(rbox('rb_floor', (0.13, 1.5, 0.03), (x, 0.05, 0.3 - 0.46 + 0.075), 'pal_wood_dark', 0.012, 2))
    # oars resting inside
    for sx in (-1, 1):
        p0 = Vector((sx * 0.2, -0.8, 0.21))
        p1 = Vector((sx * 0.13, 0.75, 0.24))
        a.add(rod('rb_oar', p0, p1, 0.022, 'pal_wood', segs=10))
        d = (p1 - p0).normalized()
        a.add(ell('rb_blade', p1 + d * 0.13, (0.075, 0.17, 0.016), 'pal_coral', 14, 8,
                  rot=Vector((0, 1, 0)).rotation_difference(d).to_matrix()))
        a.add(rod('rb_grip', p0 - d * 0.02, p0 + d * 0.13, 0.027, 'pal_cream', segs=10))
        t = (0.05 + 1.2) / 2.4
        a.add(torus('rb_oarlock', 0.04, 0.012, 'pal_cream', (sx * (hi['hw'](t) - 0.01), 0.05, hi['zr'](t) + 0.03),
                    (0, pi / 2, 0), 14, 6))
    # bow ring with a little rope
    bz = hi['zr'](0.04)
    a.add(torus('rb_ring', 0.05, 0.013, 'pal_coral_deep', (0, -1.13, bz + 0.03), (pi / 2, 0, 0), 14, 6))
    a.add(tube('rb_rope', bezier((0, -1.1, bz + 0.0), (0.15, -0.95, bz + 0.05), (0.1, -0.7, 0.12), 10),
               lambda u: 0.016, 'pal_sand', sides=7))
    a.add(ell('rb_cushion', (0, 0.45, hi['zr'](0.69) - 0.08), (0.28, 0.1, 0.035), 'pal_coral', 16, 8))

    # ---- toy sailboat (origin at waterline centre)
    a = Asset('sailboat_toy', ground=False, note='toy sailboat 1.6 m long; origin at waterline centre; bow at -Y')
    hull, hi = boat_hull('sb_hull', 1.6, 0.62, 0.3, 0.2, 0.05, 0.045, 'pal_sky', 'pal_navy', 'pal_cream', 'pal_cream',
                         low_z=0.0, nsec=18, npts=15, stern_w=0.55, bow_lift=0.05)
    a.add(hull)
    a.add(rbox('sb_deck', (0.42, 0.5, 0.04), (0, 0.32, 0.16), 'pal_wood', 0.015, 2))
    a.add(rod('sb_mast', (0, -0.1, 0.0), (0, -0.1, 1.62), 0.025, 'pal_cream', segs=12))
    a.add(rod('sb_boom', (0, -0.08, 0.4), (0, 0.62, 0.4), 0.02, 'pal_wood', segs=10))
    a.add(sail('sb_main', (0, -0.06, 0.45), (0, 0.6, 0.45), (0, -0.06, 1.55), 0.09, 0.022, 'pal_white'))
    a.add(sail('sb_jib', (0, -0.14, 0.42), (0, -0.14, 1.3), (0, -0.72, 0.36), 0.07, 0.022, 'pal_coral',
               side=Vector((-1, 0, 0))))
    a.add(vslab('sb_flag', [(0, 0), (0.2, -0.04), (0, -0.09)], -0.008, 0.008, 'pal_yellow', 0.005,
                loc=(0, -0.1, 1.72)))
    a.add(ell('sb_top', (0, -0.1, 1.64), 0.035, 'pal_coral', 10, 7))
    for sx in (-1, 1):
        a.add(ell('sb_port', (sx * 0.283, -0.25, 0.12), (0.006, 0.035, 0.035), 'pal_cream', 10, 6))

    # ---- buoy (origin at waterline)
    a = Asset('buoy', ground=False, note='coral and cream buoy; origin at waterline (float 0.3 m below)')
    prof = [(0, -0.32), (0.1, -0.31), (0.22, -0.24), (0.33, -0.1), (0.37, 0.02), (0.36, 0.1), (0.31, 0.18),
            (0.2, 0.24), (0.15, 0.28), (0.13, 0.4), (0.12, 0.62), (0.15, 0.66), (0.16, 0.72), (0.12, 0.75), (0, 0.76)]
    a.add(lathe_p('buoy_body', prof, bands('pal_coral', 0.06, 'pal_cream', 0.2, 'pal_coral', 0.42, 'pal_cream', 0.6,
                                           'pal_coral'), 28))
    a.add(torus('buoy_fender', 0.36, 0.035, 'pal_cream', (0, 0, 0.06), None, 32, 8))
    for k in range(3):
        an = 2 * pi * k / 3
        a.add(rod('buoy_cage', (0.1 * cos(an), 0.1 * sin(an), 0.74), (0.035 * cos(an), 0.035 * sin(an), 0.96), 0.014,
                  'pal_cream', segs=8))
    a.add(ell('buoy_lamp', (0, 0, 0.86), 0.07, 'pal_emissive', 14, 9))
    a.add(ell('buoy_cap', (0, 0, 0.965), (0.06, 0.06, 0.025), 'pal_coral_deep', 12, 6))

    # ---- lily cluster (origin at waterline)
    a = Asset('lily_cluster', ground=False, note='3 lily pads and a lotus flower; origin at waterline')
    pads = [((0.0, 0.0), 0.23, 0.3, 'pal_grass'), ((0.34, 0.16), 0.17, 2.4, 'pal_grass_light'),
            ((-0.12, 0.33), 0.14, 4.3, 'pal_grass')]
    for (cx, cy), r, rot, m in pads:
        pts = [(0, 0)]
        for t in ls(0.28, 2 * pi - 0.28, 22):
            pts.append((r * cos(t + rot), r * sin(t + rot)))
        a.add(slab('lily_pad', pts, -0.01, 0.018, m, 0.009, 2, loc=(cx, cy, 0)))
        a.add(rod('lily_vein', (cx, cy, 0.015), (cx + r * 0.7 * cos(rot + pi), cy + r * 0.7 * sin(rot + pi), 0.015),
                  0.006, 'pal_grass_deep', segs=6, n=1))
    fc = Vector((0.03, -0.02, 0.02))
    for k in range(8):
        an = 2 * pi * k / 8
        a.add(ell('lily_petal', fc + Vector((cos(an), sin(an), 0)) * 0.045 + Vector((0, 0, 0.02)), (0.024, 0.055, 0.013),
                  'pal_pink', 10, 6, rot=(radians(28), 0, an - pi / 2)))
    for k in range(6):
        an = 2 * pi * k / 6 + 0.4
        a.add(ell('lily_petal2', fc + Vector((cos(an), sin(an), 0)) * 0.024 + Vector((0, 0, 0.04)), (0.017, 0.038, 0.011),
                  'pal_peach', 10, 6, rot=(radians(55), 0, an - pi / 2)))
    a.add(ell('lily_heart', fc + Vector((0, 0, 0.05)), (0.022, 0.022, 0.014), 'pal_yellow', 12, 7))
    a.add(rod('lily_stalk', (0.2, 0.42, -0.02), (0.22, 0.44, 0.12), 0.008, 'pal_grass_deep', segs=6, n=1))
    a.add(lathe('lily_bud', drop_prof(0.03, 0.09, 0.006, 8, 5), 'pal_pink', 12, (0.22, 0.44, 0.11)))


# ============================================================================= FLYERS
def build_flyers():
    # ---- butterfly (origin at centre), wings hinge on the body axis (Y)
    a = Asset('butterfly', ground=False, note='0.12 m wingspan; origin at centre; `wing_l` (+X) / `wing_r` (-X) '
                                               'hinge on the body axis (rotate about Y)')
    a.add(capsule('bf_body', (0, 0.024, 0), (0, -0.02, 0.002), 0.0055, 'pal_ink', 8, 3))
    a.add(ell('bf_head', (0, -0.024, 0.003), 0.0065, 'pal_ink', 8, 6))
    for sx in (-1, 1):
        a.add(tube('bf_ant', bezier((sx * 0.002, -0.028, 0.006), (sx * 0.006, -0.04, 0.016), (sx * 0.014, -0.045, 0.02),
                                    6), lambda u: 0.0011, 'pal_ink', sides=5))
        a.add(ell('bf_antb', (sx * 0.014, -0.045, 0.02), 0.0024, 'pal_ink', 6, 4))
        parts = [slab('bf_fore', ellipse_pts(0.032, 0.021, 20, sx * 0.03, -0.011, sx * 0.35), -0.0018, 0.0018,
                      'pal_yellow', 0.0012, 1),
                 slab('bf_hind', ellipse_pts(0.021, 0.018, 18, sx * 0.022, 0.016, -sx * 0.4), -0.0016, 0.0016,
                      'pal_coral', 0.0012, 1),
                 slab('bf_spot', ellipse_pts(0.009, 0.007, 12, sx * 0.037, -0.014, 0), 0.0012, 0.0028, 'pal_coral',
                      0.0008, 1),
                 slab('bf_spot2', ellipse_pts(0.006, 0.005, 10, sx * 0.022, 0.019, 0), 0.001, 0.0026, 'pal_yellow',
                      0.0008, 1)]
        xform(parts, Matrix.Rotation(sx * radians(-22), 4, 'Y'))
        a.node(pivot_mesh('wing_l' if sx > 0 else 'wing_r', parts, (0, 0, 0)))

    # ---- seagull (origin at centre)
    a = Asset('seagull', ground=False, note='seagull, body 0.35 m; origin at centre; `wing_l` (+X) / `wing_r` (-X) '
                                             'pivot at the shoulder (rotate about Y)')
    a.add(ell('sg_body', (0, 0.01, 0), (0.068, 0.15, 0.066), 'pal_white', 20, 12))
    hc = Vector((0, -0.125, 0.05))
    a.add(ell('sg_head', hc, (0.05, 0.055, 0.05), 'pal_white', 18, 11))
    a.add(cone('sg_beak', hc + Vector((0, -0.04, -0.006)), hc + Vector((0, -0.105, -0.016)), 0.016, 0.006,
               'pal_yellow', 10, 3))
    a.add(ell('sg_beakdot', hc + Vector((0, -0.092, -0.022)), 0.006, 'pal_coral', 6, 4))
    for p in eye_pair('sg', hc + Vector((0, -0.032, 0.014)), 0.03, 0.008):
        a.add(p)
    a.add(ell('sg_tail', (0, 0.17, 0.012), (0.05, 0.07, 0.012), 'pal_stone', 12, 6, rot=(radians(-8), 0, 0)))
    a.add(ell('sg_tailtip', (0, 0.215, 0.018), (0.035, 0.03, 0.01), 'pal_ink', 10, 6))
    for sx in (-1, 1):
        a.add(ell('sg_foot', (sx * 0.022, 0.11, -0.055), (0.014, 0.03, 0.01), 'pal_coral', 8, 6))
        sh = Vector((sx * 0.035, -0.01, 0.02))
        outline = [(0.0, -0.06), (0.12, -0.075), (0.25, -0.06), (0.36, -0.02), (0.42, 0.03), (0.33, 0.05), (0.2, 0.065),
                   (0.08, 0.07), (0.0, 0.06)]
        tip = [(0.3, -0.04), (0.36, -0.02), (0.425, 0.03), (0.34, 0.052), (0.29, 0.055)]
        w = slab('sg_wing', [(sx * x, y) for x, y in outline], -0.009, 0.009, 'pal_stone', 0.007, 2, loc=sh)
        t = slab('sg_tip', [(sx * x, y) for x, y in tip], -0.0105, 0.0105, 'pal_ink', 0.007, 2, loc=sh)
        parts = [w, t]
        for o in parts:
            for v in o.data.vertices:
                ax = abs(v.co.x)
                v.co.z += 0.06 * sin(min(1.0, ax / 0.42) * pi * 0.9) - 0.05 * (ax / 0.42) ** 2.2
        xform(parts, Matrix.Translation(sh) @ Matrix.Rotation(sx * radians(-8), 4, 'Y') @ Matrix.Translation(-sh))
        a.node(pivot_mesh('wing_l' if sx > 0 else 'wing_r', parts, sh))

    # ---- bird kite (origin at kite centre)
    a = Asset('kite_bird', ground=False, note='bird-shaped kite 1.2 m wide; origin at the kite centre (bridle point); '
                                               'faces -Y; ribbon tail hangs down')
    a.add(vslab('kb_body', ellipse_pts(0.14, 0.3, 24), -0.012, 0.012, 'pal_coral', 0.008))
    a.add(vslab('kb_head', ellipse_pts(0.12, 0.11, 22, 0, 0.33), -0.013, 0.013, 'pal_coral', 0.008))
    a.add(vslab('kb_beak', [(-0.035, 0.39), (0.035, 0.39), (0.0, 0.48)], -0.01, 0.01, 'pal_yellow', 0.007))
    for sx in (-1, 1):
        wing = [(0.06, 0.13), (0.3, 0.22), (0.5, 0.31), (0.6, 0.29), (0.55, 0.16), (0.32, 0.02), (0.07, -0.06)]
        a.add(vslab('kb_wing', [(sx * x, z) for x, z in wing], -0.01, 0.01, 'pal_yellow', 0.008))
        for k, (x, z) in enumerate(((0.5, 0.24), (0.42, 0.14), (0.32, 0.06))):
            a.add(vslab('kb_feather', ellipse_pts(0.065, 0.03, 12, sx * x, z, sx * 0.55), -0.016, 0.0, 'pal_coral_deep',
                        0.006))
        a.add(vslab('kb_tail', ellipse_pts(0.045, 0.15, 18, sx * 0.06, -0.36, -sx * 0.35), -0.011, 0.011,
                    'pal_coral_deep', 0.007))
        e = Vector((sx * 0.042, -0.014, 0.34))
        a.add(ell('kb_eyew', e, (0.028, 0.008, 0.028), 'pal_white', 12, 6))
        a.add(ell('kb_eye', e + Vector((sx * 0.004, -0.006, 0.0)), (0.014, 0.006, 0.014), 'pal_ink', 10, 6))
    a.add(rod('kb_spar_v', (0, 0.02, -0.3), (0, 0.02, 0.4), 0.009, 'pal_wood', segs=6))
    a.add(rod('kb_spar_h', (-0.56, 0.02, 0.24), (0.56, 0.02, 0.24), 0.009, 'pal_wood', segs=6))
    path = [Vector((0.04 * sin(t * 3 * pi), 0.02 * sin(t * 2 * pi), -0.42 - 0.9 * t)) for t in ls(0, 1, 18)]
    a.add(tube('kb_ribbon', path, lambda u: 0.009, 'pal_sky', sides=6))
    for k, mat in enumerate(('pal_coral', 'pal_yellow', 'pal_coral')):
        p = path[4 + k * 5]
        for sx in (-1, 1):
            a.add(ell('kb_bow', p + Vector((sx * 0.035, 0, 0)), (0.035, 0.008, 0.02), mat, 10, 6,
                      rot=(0, sx * 0.3, 0)))
    a.add(tube('kb_string', [Vector((0, -0.03, 0.0)), Vector((0, -0.2, -0.15)), Vector((0, -0.38, -0.32))],
               lambda u: 0.004, 'pal_white', sides=5))


# ============================================================================= STREET LIFE
def build_rickshaw():
    a = Asset('rickshaw', note='chingchi motor-rickshaw 2.6 m, parked; coral and mint with a canopy; front at -Y')
    MINT, COR, CRM = 'pal_grass_light', 'pal_coral', 'pal_cream'
    # wheels
    fw = Vector((0, -1.06, 0.25))
    a.add(*wheel('rk_fw', fw, 0.19, 0.07, hub=CRM, spokes=0))
    for sx in (-1, 1):
        a.add(*wheel('rk_rw', (sx * 0.64, 0.62, 0.25), 0.19, 0.07, hub=CRM))
        a.add(tube('rk_rfender', arc_path((sx * 0.64, 0.62, 0.25), 0.3, radians(170), radians(10), 14),
                   lambda u: 0.05, COR, sides=8, ref=Vector((1, 0, 0))))
    a.add(tube('rk_ffender', arc_path(fw, 0.3, radians(160), radians(30), 12), lambda u: 0.045, COR, sides=8,
               ref=Vector((1, 0, 0))))
    # fork, front shield, headlamp
    for sx in (-1, 1):
        a.add(rod('rk_fork', fw + Vector((sx * 0.07, 0, 0)), (sx * 0.06, -0.9, 0.78), 0.03, CRM, segs=10))
    a.add(ell('rk_shield', (0, -0.88, 0.78), (0.22, 0.11, 0.3), MINT, 22, 12, rot=(radians(-12), 0, 0)))
    a.add(ell('rk_shield_trim', (0, -0.9, 0.62), (0.2, 0.1, 0.05), CRM, 18, 8))
    a.add(lathe('rk_lampcup', rcyl_prof(0.085, 0.07, c=0.03), CRM, 18, (0, -0.96, 0.92), (pi / 2, 0, 0)))
    a.add(ell('rk_lamp', (0, -1.03, 0.92), (0.07, 0.03, 0.07), 'pal_emissive', 16, 8))
    for sx in (-1, 1):
        a.add(ell('rk_ind', (sx * 0.16, -0.97, 0.88), 0.03, 'pal_yellow', 10, 7))
    # handlebar + mirrors
    hb = [Vector((-0.36, -0.78, 1.04)), Vector((-0.15, -0.86, 1.0)), Vector((0.15, -0.86, 1.0)), Vector((0.36, -0.78, 1.04))]
    a.add(tube('rk_bar', bezier(hb[0], hb[1] * 1.0 + Vector((0, -0.04, -0.03)), hb[3], 14), lambda u: 0.02,
               'pal_ink', sides=8))
    for sx in (-1, 1):
        a.add(capsule('rk_grip', (sx * 0.3, -0.8, 1.03), (sx * 0.42, -0.76, 1.05), 0.03, COR, 10, 3))
        a.add(rod('rk_mstalk', (sx * 0.24, -0.82, 1.02), (sx * 0.3, -0.84, 1.22), 0.011, 'pal_ink', segs=6))
        a.add(lathe('rk_mirror', rcyl_prof(0.06, 0.025, c=0.012, n=2), CRM, 12, (sx * 0.31, -0.83, 1.25), (pi / 2, 0, 0)))
    # motorbike body, seat, engine, footboard
    a.add(ell('rk_tank', (0, -0.55, 0.68), (0.17, 0.34, 0.13), MINT, 20, 12, rot=(radians(-8), 0, 0)))
    a.add(ell('rk_tankstripe', (0, -0.55, 0.705), (0.175, 0.2, 0.06), CRM, 18, 8, rot=(radians(-8), 0, 0)))
    a.add(rbox('rk_seat', (0.3, 0.42, 0.12), (0, -0.22, 0.8), 'pal_coral_deep', 0.05, 2))
    a.add(rbox('rk_engine', (0.32, 0.4, 0.26), (0, -0.48, 0.36), 'pal_stone', 0.06, 2))
    a.add(rod('rk_exhaust', (0.18, -0.4, 0.3), (0.2, 0.25, 0.28), 0.035, 'pal_ink', segs=10))
    a.add(rbox('rk_footboard', (0.62, 0.4, 0.05), (0, -0.4, 0.27), CRM, 0.02, 2))
    # cabin
    a.add(rbox('rk_floor', (1.34, 1.28, 0.1), (0, 0.56, 0.47), MINT, 0.04, 2))
    a.add(rbox('rk_chassis', (0.18, 1.1, 0.12), (0, 0.15, 0.38), 'pal_ink', 0.04, 2))
    for sx in (-1, 1):
        a.add(rbox('rk_side', (0.07, 1.24, 0.34), (sx * 0.64, 0.56, 0.69), MINT, 0.03, 2))
        a.add(rbox('rk_sidetrim', (0.08, 1.26, 0.05), (sx * 0.645, 0.56, 0.86), CRM, 0.02, 2))
        for k, (y, m) in enumerate(((0.2, 'pal_yellow'), (0.56, COR), (0.92, 'pal_yellow'))):
            a.add(ell('rk_flower', (sx * 0.68, y, 0.68), (0.012, 0.075, 0.075), m, 14, 6))
            a.add(ell('rk_flowerc', (sx * 0.69, y, 0.68), (0.01, 0.03, 0.03), CRM, 10, 5))
    a.add(rbox('rk_back', (1.34, 0.08, 0.5), (0, 1.17, 0.77), MINT, 0.035, 2))
    a.add(rbox('rk_backtrim', (1.36, 0.09, 0.06), (0, 1.17, 1.02), CRM, 0.025, 2))
    a.add(rbox('rk_front', (1.2, 0.07, 0.3), (0, -0.06, 0.66), MINT, 0.03, 2))
    for sx in (-1, 1):
        a.add(ell('rk_tail', (sx * 0.5, 1.22, 0.8), (0.05, 0.02, 0.035), 'pal_coral_deep', 10, 6))
    a.add(rbox('rk_plate', (0.36, 0.03, 0.14), (0, 1.22, 0.62), CRM, 0.015, 2))
    # seats facing each other
    a.add(rbox('rk_bench', (1.12, 0.4, 0.11), (0, 0.85, 0.64), 'pal_coral', 0.05, 2))
    a.add(rbox('rk_backrest', (1.12, 0.1, 0.36), (0, 1.08, 0.88), 'pal_coral', 0.05, 2))
    a.add(rbox('rk_bench2', (1.12, 0.34, 0.1), (0, 0.18, 0.62), 'pal_coral', 0.045, 2))
    a.add(rbox('rk_backrest2', (1.12, 0.09, 0.3), (0, 0.0, 0.84), 'pal_coral', 0.045, 2))
    # canopy: poles, puffy roof, pom-pom fringe
    for sx in (-1, 1):
        for y in (-0.02, 1.14):
            a.add(rod('rk_pole', (sx * 0.6, y, 0.8), (sx * 0.6, y, 1.78), 0.024, CRM, segs=10))
    a.add(squircle('rk_roof', (0.76, 0.74, 0.1), (0, 0.55, 1.84), COR, e=0.35, segs=24, rings=12))
    a.add(squircle('rk_roofband', (0.78, 0.76, 0.035), (0, 0.55, 1.77), CRM, e=0.3, segs=24, rings=6))
    a.add(rod('rk_roofnose', (-0.45, -0.17, 1.8), (0.45, -0.17, 1.8), 0.04, COR, segs=10))
    poms = []
    for i, x in enumerate(ls(-0.66, 0.66, 7)):
        poms.append(((x, -0.24, 1.69), ('pal_yellow', 'pal_cream', 'pal_coral_deep')[i % 3]))
    for sx in (-1, 1):
        for i, y in enumerate(ls(0.0, 1.1, 5)):
            poms.append(((sx * 0.8, y, 1.69), ('pal_cream', 'pal_yellow')[i % 2]))
    for p, m in poms:
        a.add(ell('rk_pom', Vector(p) + Vector((0, 0, 0.03)), (0.034, 0.034, 0.04), m, 8, 5))
    a.add(ell('rk_horn', (0.16, -0.85, 1.06), (0.035, 0.05, 0.035), 'pal_yellow', 10, 7))


def build_bicycle(name, lean):
    a = Asset(name, note=('bicycle leaning 13 deg on its kickstand side; ' if lean else 'bicycle, upright; ')
                         + 'cream frame, coral seat; front at -Y; origin between the tyre contact points')
    objs = []
    R = 0.34
    fw, rw = Vector((0, -0.54, R)), Vector((0, 0.52, R))
    for px, c in (('fw', fw), ('rw', rw)):
        objs += wheel('bk_' + px, c, R - 0.035, 0.035, hub='pal_cream', spokes=6, spoke_mat='pal_cream', sr=0.006,
                      nmaj=24)
        objs.append(tube('bk_guard', arc_path(c, R + 0.03, radians(150 if px == 'rw' else 160),
                                              radians(20 if px == 'rw' else 30), 14),
                         lambda u: 0.022, 'pal_coral', sides=8, ref=Vector((1, 0, 0))))
    bb = Vector((0, 0.06, 0.3))
    st = Vector((0, 0.24, 0.82))
    ht, hb_ = Vector((0, -0.4, 0.86)), Vector((0, -0.44, 0.68))
    F = 'pal_cream'
    objs.append(rod('bk_seattube', bb, st, 0.024, F, segs=8))
    objs.append(tube('bk_down', bezier(bb, Vector((0, -0.2, 0.36)), hb_, 12), lambda u: 0.026, F, sides=8))
    objs.append(rod('bk_top', st + Vector((0, -0.02, -0.08)), ht + Vector((0, 0, -0.04)), 0.02, F, segs=8))
    objs.append(rod('bk_head', hb_, ht + Vector((0, 0.0, 0.04)), 0.03, F, segs=8))
    for sx in (-1, 1):
        objs.append(rod('bk_chain', bb + Vector((sx * 0.03, 0, 0)), rw + Vector((sx * 0.045, 0, 0)), 0.014, F, segs=8))
        objs.append(rod('bk_stay', st + Vector((sx * 0.02, 0, -0.08)), rw + Vector((sx * 0.045, 0, 0)), 0.013, F, segs=8))
        objs.append(rod('bk_fork', hb_ + Vector((sx * 0.03, 0, 0)), fw + Vector((sx * 0.045, 0, 0)), 0.016, F, segs=8))
    objs.append(rod('bk_post', st, st + Vector((0, 0.03, 0.1)), 0.016, 'pal_ink', segs=8))
    objs.append(ell('bk_seat', st + Vector((0, 0.03, 0.13)), (0.08, 0.13, 0.04), 'pal_coral', 16, 8))
    objs.append(rod('bk_stem', ht, ht + Vector((0, 0.04, 0.12)), 0.018, 'pal_ink', segs=8))
    bar = [ht + Vector((-0.28, 0.14, 0.14)), ht + Vector((0, -0.06, 0.12)), ht + Vector((0.28, 0.14, 0.14))]
    objs.append(tube('bk_bar', bezier(bar[0], bar[1], bar[2], 12), lambda u: 0.016, F, sides=8))
    for sx in (-1, 1):
        objs.append(capsule('bk_grip', ht + Vector((sx * 0.22, 0.09, 0.14)), ht + Vector((sx * 0.3, 0.16, 0.14)), 0.024,
                            'pal_coral', 10, 3))
    objs.append(ell('bk_bell', ht + Vector((0.1, 0.0, 0.17)), 0.022, 'pal_yellow', 10, 6))
    # crank, pedals
    objs.append(lathe('bk_ring', rcyl_prof(0.09, 0.02, c=0.008, z0=-0.01), 'pal_coral', 20, bb + Vector((0.05, 0, 0)),
                      (0, pi / 2, 0)))
    for sx, ang in ((1, 0.5), (-1, 0.5 + pi)):
        e = bb + Vector((sx * 0.07, 0.15 * cos(ang), 0.15 * sin(ang)))
        objs.append(rod('bk_crank', bb + Vector((sx * 0.07, 0, 0)), e, 0.014, 'pal_ink', segs=6))
        objs.append(rbox('bk_pedal', (0.09, 0.05, 0.022), e + Vector((sx * 0.05, 0, 0)), 'pal_ink', 0.01, 2))
    # front basket with flowers
    bc = Vector((0, -0.6, 0.86))
    objs.append(lathe('bk_basket', [(0, 0), (0.13, 0), (0.15, 0.02), (0.165, 0.17), (0.145, 0.17), (0.13, 0.035),
                                    (0, 0.035)], 'pal_wood', 20, bc))
    objs.append(torus('bk_basket_rim', 0.158, 0.014, 'pal_wood_dark', bc + Vector((0, 0, 0.17)), None, 24, 6))
    for k, (dx, dy, m) in enumerate(((-0.05, 0.02, 'pal_coral'), (0.05, -0.03, 'pal_yellow'), (0.0, 0.06, 'pal_pink'))):
        objs.append(ell('bk_flower', bc + Vector((dx, dy, 0.2)), 0.045, m, 10, 7))
    objs.append(ell('bk_leaf', bc + Vector((0.03, 0.05, 0.19)), (0.05, 0.025, 0.02), 'pal_grass', 10, 6))
    objs.append(rod('bk_lampbr', ht + Vector((0, -0.02, -0.04)), ht + Vector((0, -0.09, -0.06)), 0.01, 'pal_ink', segs=6))
    objs.append(ell('bk_lamp', ht + Vector((0, -0.11, -0.06)), (0.035, 0.03, 0.035), 'pal_emissive', 10, 7))
    objs.append(rbox('bk_rack', (0.14, 0.3, 0.025), rw + Vector((0, -0.05, 0.33)), 'pal_coral', 0.01, 2))
    for sx in (-1, 1):
        objs.append(rod('bk_rackst', rw + Vector((sx * 0.06, 0.06, 0.32)), rw + Vector((sx * 0.045, 0, 0)), 0.009,
                        'pal_coral', segs=6))
    if lean:
        stand_end = Vector((-0.2, 0.42, 0.0))
    else:
        stand_end = Vector((-0.06, 0.38, 0.06))
    objs.append(rod('bk_stand', bb + Vector((-0.04, 0.1, 0)), stand_end, 0.011, 'pal_ink', segs=6))
    if lean:
        xform(objs, Matrix.Rotation(radians(-13), 4, 'Y'))
    a.add(*objs)


def build_cart():
    a = Asset('fruit_cart', note='wooden handcart with striped umbrella and fruit piles; handles toward +Y')
    rnd = random.Random(5)
    W_, L_, z = 0.84, 1.3, 0.72
    a.add(rbox('fc_bed', (W_, L_, 0.08), (0, 0, z), 'pal_wood', 0.025, 2))
    for sx in (-1, 1):
        a.add(rbox('fc_rimx', (0.05, L_ + 0.04, 0.12), (sx * (W_ / 2 + 0.005), 0, z + 0.07), 'pal_wood_dark', 0.02, 2))
    for sy in (-1, 1):
        a.add(rbox('fc_rimy', (W_ + 0.06, 0.05, 0.12), (0, sy * (L_ / 2 + 0.005), z + 0.07), 'pal_wood_dark', 0.02, 2))
    a.add(rbox('fc_skirt', (W_ - 0.06, L_ - 0.1, 0.16), (0, 0, z - 0.11), 'pal_coral', 0.03, 2))
    for sx in (-1, 1):
        a.add(*wheel('fc_wheel', (sx * 0.5, 0.12, 0.3), 0.27, 0.035, tyre='pal_wood_dark', hub='pal_wood', spokes=6,
                     spoke_mat='pal_wood', sr=0.016))
        a.add(rod('fc_handle', (sx * 0.3, L_ / 2 - 0.1, z - 0.02), (sx * 0.3, L_ / 2 + 0.55, z + 0.08), 0.025,
                  'pal_wood', segs=8))
        a.add(capsule('fc_grip', (sx * 0.3, L_ / 2 + 0.45, z + 0.065), (sx * 0.3, L_ / 2 + 0.62, z + 0.09), 0.033,
                      'pal_cream', 10, 3))
        a.add(rod('fc_leg', (sx * 0.32, -L_ / 2 + 0.12, z - 0.02), (sx * 0.34, -L_ / 2 + 0.1, 0.0), 0.028,
                  'pal_wood_dark', segs=8))
    a.add(rod('fc_axle', (-0.5, 0.12, 0.3), (0.5, 0.12, 0.3), 0.022, 'pal_wood_dark', segs=8))
    # fruit
    top = z + 0.04
    for px, kind, c, rows, sp in (('fc_or', 'orange', (-0.2, -0.38, top + 0.045), 3, 0.09),
                                  ('fc_gv', 'guava', (0.2, -0.38, top + 0.042), 3, 0.086),
                                  ('fc_ap', 'apple', (-0.2, 0.05, top + 0.042), 3, 0.088),
                                  ('fc_mg', 'mango', (0.2, 0.05, top + 0.04), 3, 0.09)):
        a.add(*pile(px, c, kind, rows, sp, rnd))
    # bananas
    for k in range(4):
        x0 = -0.12 + k * 0.06
        a.add(tube('fc_banana', bezier((x0, 0.33, top + 0.04), (x0 + 0.01, 0.43, top + 0.1), (x0, 0.52, top + 0.05), 8),
                   lambda u: 0.028 * sin(pi * min(1, max(0.08, u))) ** 0.5, 'pal_yellow', sides=8))
    a.add(ell('fc_melon', (0.18, 0.43, top + 0.09), (0.12, 0.16, 0.1), 'pal_grass_deep', 16, 10))
    a.add(lathe('fc_melonhalf', [(0, 0), (0.09, 0.0), (0.105, 0.03), (0.1, 0.05), (0, 0.05)], 'pal_grass_deep', 16,
                (0.24, 0.24, top), None))
    a.add(lathe('fc_melonin', [(0, 0.05), (0.092, 0.05), (0.092, 0.06), (0, 0.06)], 'pal_coral', 16, (0.24, 0.24, top)))
    # umbrella
    a.add(rod('fc_pole', (-0.36, 0.5, z), (-0.36, 0.5, 2.25), 0.025, 'pal_cream', segs=10))
    can = canopy('fc_umb', 0.95, 0.36, 8, ['pal_coral', 'pal_cream'], 1.9, rings=5, per=3, scallop=0.05)
    place(can, (-0.36, 0.5, 0))
    a.add(can)
    a.add(ell('fc_finial', (-0.36, 0.5, 2.3), 0.04, 'pal_coral_deep', 10, 7))
    a.add(rbox('fc_sign', (0.34, 0.03, 0.18), (0, -L_ / 2 - 0.03, z - 0.05), 'pal_cream', 0.012, 2))


def build_small_street():
    # ---- chai set
    a = Asset('chai_set', note='kettle and four glass chai cups on a round tray, 0.46 m')
    a.add(lathe_p('cs_tray', [(0, 0), (0.21, 0), (0.23, 0.01), (0.235, 0.035), (0.215, 0.035), (0.205, 0.016),
                              (0, 0.016)], lambda c: 'pal_coral' if c.z > 0.012 and (c.x * c.x + c.y * c.y) > 0.039
                  else 'pal_cream', 32))
    kc = Vector((-0.06, 0.04, 0.016))
    a.add(lathe_p('cs_kettle', [(0, 0), (0.07, 0), (0.095, 0.03), (0.1, 0.07), (0.085, 0.11), (0.05, 0.135),
                                (0.045, 0.145), (0, 0.15)], bands('pal_coral', 0.11, 'pal_cream'), 24, kc))
    a.add(ell('cs_knob', kc + Vector((0, 0, 0.16)), (0.02, 0.02, 0.016), 'pal_coral_deep', 10, 6))
    a.add(tube('cs_spout', bezier(kc + Vector((0.07, -0.05, 0.05)), kc + Vector((0.12, -0.1, 0.07)),
                                  kc + Vector((0.14, -0.13, 0.13)), 8), lambda u: 0.018 - 0.008 * u, 'pal_coral', sides=8))
    a.add(tube('cs_handle', bezier(kc + Vector((-0.06, 0.04, 0.12)), kc + Vector((0.0, 0.0, 0.26)),
                                   kc + Vector((0.06, -0.04, 0.12)), 12), lambda u: 0.009, 'pal_ink', sides=6))
    for k, (x, y) in enumerate(((0.1, -0.08), (0.14, 0.04), (0.05, 0.14), (-0.08, -0.13))):
        c = Vector((x, y, 0.016))
        a.add(lathe_p('cs_cup', [(0, 0), (0.026, 0), (0.03, 0.006), (0.036, 0.075), (0.031, 0.075), (0.027, 0.06),
                                 (0, 0.06)], lambda cc: 'pal_glass' if cc.z > 0.058 else 'pal_tan', 16, c))
        a.add(torus('cs_band', 0.034, 0.003, 'pal_glass', c + Vector((0, 0, 0.035)), None, 16, 4))
    a.add(lathe('cs_plate', [(0, 0), (0.06, 0), (0.07, 0.012), (0, 0.012)], 'pal_cream', 18, (-0.05, -0.12, 0.016)))
    for k in range(3):
        a.add(rbox('cs_rusk', (0.055, 0.025, 0.018), (-0.05 + (k - 1) * 0.018, -0.12, 0.04 + k * 0.004), 'pal_yellow',
                   0.008, 2, rot=(0, radians(70), radians(10 + 20 * k))))

    # ---- charpai
    a = Asset('charpai', note='woven cot 2.0 x 1.0 m, painted legs; `seat` on the -Y long side facing -Y')
    for sx in (-1, 1):
        for sy in (-1, 1):
            a.add(lathe_p('cp_leg', [(0, 0), (0.05, 0), (0.06, 0.04), (0.045, 0.1), (0.07, 0.17), (0.07, 0.22),
                                     (0.045, 0.28), (0.06, 0.34), (0.06, 0.46), (0.04, 0.5), (0, 0.5)],
                          bands('pal_wood', 0.15, 'pal_coral', 0.24, 'pal_yellow', 0.3, 'pal_coral', 0.35, 'pal_wood'), 12,
                          (sx * 0.95, sy * 0.47, 0)))
    for sy in (-1, 1):
        a.add(rod('cp_rail', (-0.97, sy * 0.47, 0.41), (0.97, sy * 0.47, 0.41), 0.042, 'pal_wood', segs=12))
    for sx in (-1, 1):
        a.add(rod('cp_rail', (sx * 0.95, -0.49, 0.41), (sx * 0.95, 0.49, 0.41), 0.042, 'pal_wood', segs=12))
    A_ = 0.008
    px, py = 1.64 / 7, 0.68 / 3
    for i, y in enumerate(ls(-0.34, 0.34, 4)):
        path = []
        for x in ls(-0.91, 0.91, 25):
            sag = -0.03 * (1 - (x / 0.92) ** 2) * (1 - (y / 0.47) ** 2)
            path.append(Vector((x, y, 0.43 + sag + A_ * cos(pi * (x + 0.82) / px) * (-1) ** i)))
        a.add(mk('cp_wx', bm_sweep(path, lambda u: ellipse_pts(0.09, 0.011, 6)), 'pal_coral'))
    for j, x in enumerate(ls(-0.82, 0.82, 8)):
        path = []
        for y in ls(-0.44, 0.44, 18):
            sag = -0.03 * (1 - (x / 0.92) ** 2) * (1 - (y / 0.47) ** 2)
            path.append(Vector((x, y, 0.43 + sag - A_ * cos(pi * (y + 0.34) / py) * (-1) ** j)))
        a.add(mk('cp_wy', bm_sweep(path, lambda u: ellipse_pts(0.095, 0.011, 6)), 'pal_cream'))
    a.add(rbox('cp_quilt', (0.42, 0.85, 0.09), (0.7, 0.0, 0.47), 'pal_sky', 0.04, 3))
    a.add(ell('cp_pillow', (0.72, 0.0, 0.55), (0.14, 0.26, 0.06), 'pal_white', 16, 8))
    a.node(empty('seat', (-0.2, -0.3, 0.48)))

    # ---- string lights / bunting (origin at left end, right end at x=+4)
    a = Asset('string_lights', ground=False, note='4 m sagging string with 13 pal_emissive bulbs; origin at the left '
                                                   'anchor, right anchor at (4, 0, 0); hangs 0.45 m')
    path = catenary(4.0, 0.42, 40)
    a.add(tube('sl_cord', path, lambda u: 0.009, 'pal_ink', sides=6))
    for k in range(13):
        t = (k + 0.5) / 13
        p = Vector((4 * t, 0, -0.42 * (1 - (2 * t - 1) ** 2)))
        a.add(rod('sl_cap', p + Vector((0, 0, 0.0)), p + Vector((0, 0, -0.045)), 0.017, 'pal_cream', segs=8, n=1))
        a.add(ell('sl_bulb', p + Vector((0, 0, -0.09)), (0.045, 0.045, 0.052), 'pal_emissive', 10, 6))
    for x in (0.0, 4.0):
        a.add(ell('sl_hook', (x, 0, 0), 0.025, 'pal_cream', 8, 6))

    a = Asset('bunting', ground=False, note='4 m string of 14 triangle flags in palette colours; origin at the left '
                                             'anchor, right anchor at (4, 0, 0)')
    path = catenary(4.0, 0.35, 40)
    a.add(tube('bt_cord', path, lambda u: 0.009, 'pal_cream', sides=6))
    cols = ['pal_coral', 'pal_yellow', 'pal_grass_light', 'pal_sky', 'pal_pink', 'pal_cream', 'pal_coral_deep']
    for k in range(14):
        t = (k + 0.5) / 14
        p = Vector((4 * t, 0, -0.35 * (1 - (2 * t - 1) ** 2)))
        slope = 0.35 * 2 * (2 * t - 1) * 2 / 4
        f = vslab('bt_flag', [(-0.11, 0.0), (0.11, 0.0), (0.0, -0.24)], -0.008, 0.008, cols[k % len(cols)], 0.006,
                  loc=p)
        xform([f], Matrix.Translation(p) @ Matrix.Rotation(atan2(slope, 1), 4, 'Y') @ Matrix.Translation(-p))
        a.add(f)
    for x in (0.0, 4.0):
        a.add(ell('bt_hook', (x, 0, 0), 0.025, 'pal_cream', 8, 6))

    # ---- potted plants
    a = Asset('potted_plant_a', note='tall leafy plant in a terracotta-coral pot, 0.95 m')
    a.add(lathe_p('ppa_pot', [(0, 0), (0.15, 0), (0.17, 0.02), (0.2, 0.3), (0.235, 0.31), (0.24, 0.37), (0.21, 0.38),
                              (0.2, 0.35), (0, 0.35)], bands('pal_coral_deep', 0.295, 'pal_coral'), 24))
    a.add(lathe('ppa_soil', [(0, 0.34), (0.2, 0.34), (0.2, 0.355), (0, 0.36)], 'pal_wood_dark', 20))
    for i in range(9):
        az = i * 2 * pi / 9 + RD.uniform(-0.2, 0.2)
        a.add(leaf('ppa_leaf', (cos(az) * 0.03, sin(az) * 0.03, 0.34), az, radians(RD.uniform(58, 76)),
                   RD.uniform(0.45, 0.6), 0.075, 0.022, ('pal_grass', 'pal_grass_deep', 'pal_leaf_dark')[i % 3],
                   droop=0.25, fold=0.25, nu=8, nv=6))
    a = Asset('potted_plant_b', note='round shrub with coral flowers in a squat terracotta-coral pot, 0.65 m')
    a.add(lathe_p('ppb_pot', [(0, 0), (0.16, 0), (0.2, 0.04), (0.22, 0.15), (0.2, 0.24), (0.215, 0.26), (0.2, 0.28),
                              (0.18, 0.26), (0, 0.26)], bands('pal_coral', 0.1, 'pal_cream', 0.14, 'pal_coral'), 24))
    for k, (x, y, zz, r, m) in enumerate(((0, 0, 0.44, 0.2, 'pal_grass'), (0.12, -0.06, 0.36, 0.13, 'pal_grass_light'),
                                          (-0.12, 0.05, 0.37, 0.13, 'pal_grass'), (0.0, 0.08, 0.55, 0.12, 'pal_grass_light'))):
        a.add(ell('ppb_bush', (x, y, zz), r, m, 18, 11))
    for k in range(6):
        az = k * 2 * pi / 6 + 0.3
        p = Vector((cos(az) * 0.17, sin(az) * 0.15, 0.46 + 0.06 * sin(3 * az)))
        a.add(ell('ppb_flower', p, 0.035, ('pal_coral', 'pal_pink', 'pal_yellow')[k % 3], 10, 6))

    # ---- water cooler
    a = Asset('water_cooler', note='street water cooler (sabeel) on a stand, tap at front (-Y), 1.35 m')
    for sx in (-1, 1):
        for sy in (-1, 1):
            a.add(rod('wc_leg', (sx * 0.22, sy * 0.22, 0), (sx * 0.2, sy * 0.2, 0.62), 0.028, 'pal_cream', segs=10))
    a.add(rbox('wc_shelf', (0.56, 0.56, 0.05), (0, 0, 0.62), 'pal_cream', 0.02, 2))
    a.add(rbox('wc_lowshelf', (0.48, 0.48, 0.03), (0, 0, 0.18), 'pal_cream', 0.012, 2))
    a.add(lathe_p('wc_tank', rcyl_prof(0.26, 0.56, c=0.07, z0=0.645), bands('pal_sky', 0.78, 'pal_cream', 0.82, 'pal_sky',
                                                                          1.08, 'pal_cream'), 28))
    a.add(lathe('wc_lid', [(0, 0), (0.2, 0), (0.18, 0.05), (0.1, 0.08), (0, 0.085)], 'pal_cream', 24, (0, 0, 1.2)))
    a.add(ell('wc_knob', (0, 0, 1.3), (0.04, 0.04, 0.03), 'pal_coral', 10, 6))
    a.add(rod('wc_tap', (0, -0.24, 0.74), (0, -0.33, 0.74), 0.022, 'pal_coral', segs=10))
    a.add(rod('wc_spout', (0, -0.33, 0.745), (0, -0.335, 0.7), 0.017, 'pal_coral', segs=8, n=1))
    a.add(capsule('wc_handle', (-0.04, -0.31, 0.78), (0.04, -0.31, 0.78), 0.012, 'pal_coral_deep', 8, 2))
    a.add(ell('wc_badge', (0, -0.258, 0.95), (0.08, 0.012, 0.08), 'pal_coral', 16, 6))
    a.add(ell('wc_badgec', (0, -0.268, 0.95), (0.035, 0.008, 0.035), 'pal_yellow', 12, 5))
    a.add(lathe('wc_cup', [(0, 0), (0.03, 0), (0.038, 0.08), (0.032, 0.08), (0.026, 0.01), (0, 0.01)], 'pal_cream', 14,
                (0.17, -0.18, 0.645)))
    a.add(tube('wc_chain', bezier((0.17, -0.2, 0.72), (0.22, -0.26, 0.7), (0.2, -0.24, 0.9), 8), lambda u: 0.006,
               'pal_ink', sides=5))
    a.add(lathe('wc_tray', [(0, 0), (0.09, 0), (0.1, 0.03), (0.085, 0.03), (0.08, 0.01), (0, 0.01)], 'pal_cream', 16,
                (0, -0.33, 0.645)))

    # ---- cricket bat (standing upright on its toe)
    a = Asset('cricket_bat', note='cricket bat standing upright on its toe, 0.86 m; face toward -Y')
    blade = slab('cb_blade', rrect_pts(0.11, 0.56, 0.03, 4), -0.022, 0.012, 'pal_sand', 0.012, 3, loc=(0, 0, 0.28),
                 rot=RX90)
    a.add(blade)
    a.add(ell('cb_spine', (0, 0.012, 0.26), (0.035, 0.022, 0.24), 'pal_sand', 14, 10))
    a.add(ell('cb_shoulder', (0, 0.0, 0.56), (0.05, 0.02, 0.03), 'pal_sand', 12, 6))
    a.add(rod('cb_handle', (0, 0.0, 0.56), (0, 0.0, 0.86), 0.018, 'pal_coral', segs=10))
    for zz in ls(0.6, 0.82, 5):
        a.add(torus('cb_grip', 0.019, 0.004, 'pal_coral_deep', (0, 0, zz), None, 12, 4))
    a.add(ell('cb_knob', (0, 0, 0.865), (0.022, 0.022, 0.012), 'pal_coral_deep', 10, 6))
    a.add(rbox('cb_sticker', (0.08, 0.006, 0.09), (0, -0.0125, 0.47), 'pal_navy', 0.004, 1))
    a.add(rbox('cb_sticker2', (0.06, 0.006, 0.025), (0, -0.0135, 0.47), 'pal_yellow', 0.004, 1))

    # ---- kids beach ball
    a = Asset('kids_ball', note='beach ball 0.36 m, six coloured gores; origin at its bottom')
    gores = ['pal_coral', 'pal_white', 'pal_yellow', 'pal_white', 'pal_sky', 'pal_white']

    def ballmat(c):
        if abs(c.z - 0.18) > 0.165:
            return 'pal_white'
        g = int(((atan2(c.y, c.x) + pi) / (2 * pi)) * 6) % 6
        return gores[g]
    a.add(lathe_p('kb_ball', sphere_prof(0.18, 16, cz=0.18), ballmat, 30))
    a.add(ell('kb_valve', (0.0, 0.0, 0.362), (0.025, 0.025, 0.01), 'pal_coral', 10, 5))


def build_story_props():
    # ---- parcel
    a = Asset('parcel', note='cardboard box 0.42 x 0.32 x 0.28 m with tape and a shipping tag')
    a.add(rbox('pc_box', (0.42, 0.32, 0.28), (0, 0, 0.14), 'pal_tan', 0.022, 3))
    a.add(rbox('pc_tape', (0.07, 0.33, 0.008), (0, 0, 0.282), 'pal_sand', 0.003, 1))
    for sy in (-1, 1):
        a.add(rbox('pc_tape_s', (0.07, 0.008, 0.12), (0, sy * 0.163, 0.22), 'pal_sand', 0.003, 1))
    a.add(rbox('pc_tag', (0.13, 0.09, 0.006), (0.12, -0.06, 0.283), 'pal_white', 0.004, 1, rot=(0, 0, 0.1)))
    for k in range(3):
        a.add(rbox('pc_line', (0.08 - k * 0.015, 0.009, 0.003), (0.115, -0.08 + k * 0.02, 0.287), 'pal_ink', 0.0015, 1,
                   rot=(0, 0, 0.1)))
    a.add(rbox('pc_sticker', (0.006, 0.08, 0.08), (-0.211, 0.05, 0.15), 'pal_coral', 0.003, 1))

    # ---- mail sack
    a = Asset('mail_sack', note='canvas mail sack 0.65 m with envelopes poking out')
    prof = [(0, 0), (0.18, 0), (0.25, 0.06), (0.27, 0.18), (0.25, 0.33), (0.18, 0.45), (0.1, 0.5), (0.08, 0.52),
            (0.09, 0.56), (0.13, 0.6), (0.12, 0.62), (0, 0.6)]

    def lump(c):
        n = noise.noise(Vector((c.x * 6, c.y * 6, c.z * 6)))
        k = 1 + 0.07 * n
        return (c.x * k + 0.03 * c.z, c.y * k * 0.9, c.z)
    a.add(lathe('ms_sack', prof, 'pal_fur', 24, deform=lump))
    a.add(torus('ms_tie', 0.09, 0.022, 'pal_wood', (0.016, 0, 0.515), (0.0, 0.08, 0), 18, 7))
    a.add(ell('ms_patch', (0.012, -0.235, 0.24), (0.11, 0.025, 0.09), 'pal_coral', 16, 8))
    a.add(vslab('ms_env', [(-0.05, -0.03), (0.05, -0.03), (0.05, 0.03), (-0.05, 0.03)], -0.035, -0.025, 'pal_white',
                0.004, loc=(0.012, -0.235, 0.24)))
    a.add(vslab('ms_flap', [(-0.05, 0.03), (0.05, 0.03), (0.0, -0.005)], -0.04, -0.034, 'pal_white', 0.003,
                loc=(0.012, -0.235, 0.24)))
    for k, (dx, ang, m) in enumerate(((-0.03, -0.25, 'pal_white'), (0.02, 0.1, 'pal_cream'), (0.05, 0.35, 'pal_white'))):
        e = rbox('ms_letter', (0.14, 0.01, 0.1), (dx + 0.02, (k - 1) * 0.02, 0.64), m, 0.005, 1,
                 rot=(0, ang, (k - 1) * 0.3))
        a.add(e)
    a.add(rbox('ms_stamp', (0.03, 0.012, 0.03), (0.075, 0.015, 0.67), 'pal_coral', 0.004, 1, rot=(0, 0.35, 0.3)))

    # ---- laptop with screen
    a = Asset('laptop_open', note='small open laptop 0.36 m; `screen` quad on the lid faces -Y (tilted back 15 deg)')
    a.add(rbox('lt_base', (0.36, 0.25, 0.02), (0, 0, 0.011), 'pal_cream', 0.008, 2))
    a.add(rbox('lt_keys', (0.3, 0.115, 0.004), (0, 0.02, 0.022), 'pal_navy', 0.002, 1))
    a.add(rbox('lt_pad', (0.1, 0.06, 0.003), (0, -0.085, 0.0215), 'pal_stone', 0.0015, 1))
    tilt = Matrix.Translation((0, 0.118, 0.02)) @ Matrix.Rotation(radians(-15), 4, 'X')
    lid = [rbox('lt_lid', (0.36, 0.014, 0.24), (0, 0.007, 0.12), 'pal_coral', 0.007, 2),
           rbox('lt_bezel', (0.345, 0.004, 0.225), (0, -0.001, 0.122), 'pal_ink', 0.002, 1),
           ell('lt_logo', (0, 0.0145, 0.13), (0.025, 0.003, 0.025), 'pal_cream', 10, 4)]
    xform(lid, tilt)
    a.add(*lid)
    scr = quad_uv('screen', 0.32, 0.195, (0, -0.0035, 0.125), None, 'pal_white')
    xform([scr], tilt)
    a.node(scr)
    a.add(rod('lt_hinge', (-0.15, 0.118, 0.02), (0.15, 0.118, 0.02), 0.009, 'pal_stone', segs=8))

    # ---- giant phone sculpture
    a = Asset('phone_giant', note='1.2 m phone sculpture on a plinth, leaning back 6 deg; `screen` quad faces -Y')
    a.add(rbox('pg_plinth', (0.8, 0.42, 0.12), (0, 0, 0.06), 'pal_cream', 0.045, 3))
    a.add(rbox('pg_plinth2', (0.7, 0.34, 0.04), (0, 0, 0.13), 'pal_stone', 0.018, 2))
    M = Matrix.Translation((0, 0.02, 0.14)) @ Matrix.Rotation(radians(-6), 4, 'X')
    body = [vslab('pg_body', rrect_pts(0.58, 1.06, 0.12, 6, 0, 0.53), -0.06, 0.06, 'pal_coral', 0.035, 3),
            vslab('pg_bezel', rrect_pts(0.53, 1.01, 0.1, 6, 0, 0.53), -0.071, -0.05, 'pal_ink', 0.008, 2),
            ell('pg_cam', (0, -0.072, 0.98), (0.016, 0.006, 0.016), 'pal_navy', 10, 5),
            rbox('pg_btn', (0.02, 0.05, 0.12), (0.295, 0, 0.75), 'pal_coral_deep', 0.009, 2),
            rbox('pg_btn2', (0.02, 0.05, 0.07), (-0.295, 0, 0.8), 'pal_coral_deep', 0.009, 2),
            ell('pg_camback', (0.17, 0.065, 0.9), (0.06, 0.012, 0.06), 'pal_ink', 14, 6)]
    xform(body, M)
    a.add(*body)
    scr = quad_uv('screen', 0.47, 0.88, (0, -0.0725, 0.52), None, 'pal_white')
    xform([scr], M)
    a.node(scr)

    # ---- app balloon (origin at the string end)
    a = Asset('app_balloon', ground=False, note='rounded-square app-icon balloon, coral, 1.75 m tall; origin at the '
                                                 'bottom of the string (tie point)')
    bc = Vector((0, 0, 1.52))
    a.add(squircle('ab_balloon', (0.27, 0.17, 0.27), bc, 'pal_coral', e=0.42, segs=28, rings=18))
    star = []
    for k in range(8):
        r = 0.1 if k % 2 == 0 else 0.032
        an = pi / 2 + k * pi / 4
        star.append((r * cos(an), r * sin(an)))
    a.add(vslab('ab_glyph', star, -0.02, 0.0, 'pal_white', 0.008, loc=bc + Vector((-0.01, -0.165, 0.01))))
    a.add(vslab('ab_glyph2', ellipse_pts(0.028, 0.028, 14, 0.1, 0.1), -0.016, 0.0, 'pal_white', 0.006,
                loc=bc + Vector((-0.01, -0.158, 0.01))))
    a.add(ell('ab_shine', bc + Vector((-0.15, -0.11, 0.15)), (0.04, 0.02, 0.05), 'pal_peach', 10, 6,
              rot=(0, 0, -0.6)))
    a.add(cone('ab_knot', bc + Vector((0, 0, -0.29)), bc + Vector((0, 0, -0.24)), 0.025, 0.04, 'pal_coral_deep', 10, 2))
    a.add(tube('ab_string', bezier((0, 0, 0.0), (0.12, 0.05, 0.5), (-0.1, -0.03, 0.9), 22, (0, 0, bc.z - 0.28)),
               lambda u: 0.006, 'pal_white', sides=5))
    a.add(ell('ab_weight', (0, 0, 0.0), (0.03, 0.03, 0.02), 'pal_coral_deep', 8, 5))

    # ---- fruit crate
    a = Asset('crate_fruit', note='shallow wooden crate 0.52 x 0.38 x 0.3 m heaped with oranges')
    rnd = random.Random(9)
    W_, D_, H_ = 0.52, 0.38, 0.22
    a.add(rbox('cf_bottom', (W_, D_, 0.03), (0, 0, 0.02), 'pal_wood', 0.01, 2))
    for zz in (0.07, 0.17):
        for sy in (-1, 1):
            a.add(rbox('cf_slat', (W_, 0.025, 0.07), (0, sy * D_ / 2, zz), 'pal_wood', 0.01, 2))
        for sx in (-1, 1):
            a.add(rbox('cf_slat', (0.025, D_, 0.07), (sx * W_ / 2, 0, zz), 'pal_wood', 0.01, 2))
    for sx in (-1, 1):
        for sy in (-1, 1):
            a.add(rbox('cf_post', (0.045, 0.045, H_ + 0.02), (sx * (W_ / 2 - 0.005), sy * (D_ / 2 - 0.005), (H_ + 0.02) / 2),
                       'pal_wood_dark', 0.012, 2))
    a.add(rbox('cf_fill', (W_ - 0.05, D_ - 0.05, 0.12), (0, 0, 0.1), 'pal_wood_dark', 0.02, 1))
    for i in range(5):
        for j in range(4):
            x = -0.2 + i * 0.1 + rnd.uniform(-0.01, 0.01)
            y = -0.135 + j * 0.09 + rnd.uniform(-0.01, 0.01)
            a.add(*fruit('cf', (x, y, 0.2 + 0.015 * (1 - abs(x) * 3)), 'orange', rnd, 1.08))
    for (x, y) in ((-0.1, -0.05), (0.0, 0.04), (0.1, -0.04), (-0.05, 0.08), (0.06, 0.08)):
        a.add(*fruit('cf', (x, y, 0.27), 'orange', rnd, 1.08))
    a.add(ell('cf_leaf', (0.02, -0.02, 0.32), (0.045, 0.02, 0.012), 'pal_grass', 10, 6, rot=(0.2, 0, 0.5)))

    # ---- grain sack
    a = Asset('sack_grain', note='open burlap sack of grain with a scoop, 0.55 m')
    prof = [(0, 0), (0.17, 0), (0.23, 0.05), (0.25, 0.18), (0.24, 0.34), (0.22, 0.42), (0.25, 0.45), (0.25, 0.5),
            (0.21, 0.5), (0.2, 0.46), (0, 0.46)]
    a.add(lathe_p('sg_sack', prof, bands('pal_sand', 0.22, 'pal_coral', 0.27, 'pal_sand'), 24,
                  deform=lambda c: (c.x * (1 + 0.04 * noise.noise(c * 7)), c.y * (1 + 0.04 * noise.noise(c * 7 + Vector((3, 1, 2))))
                                    , c.z)))
    a.add(torus('sg_roll', 0.235, 0.03, 'pal_sand', (0, 0, 0.47), None, 28, 7))
    a.add(lathe('sg_grain', [(0, 0.44), (0.21, 0.44), (0.18, 0.5), (0.1, 0.545), (0, 0.56)], 'pal_yellow', 22))
    a.add(lathe('sg_scoop', [(0, 0), (0.05, 0), (0.055, 0.07), (0.045, 0.07), (0.04, 0.01), (0, 0.01)], 'pal_cream', 14,
                (0.06, -0.04, 0.5), (radians(-35), radians(20), 0)))
    a.add(rod('sg_scoop_h', (0.06, -0.06, 0.53), (0.12, -0.16, 0.62), 0.014, 'pal_wood', segs=6))

    # ---- small barrel
    a = Asset('barrel_small', note='small wooden barrel 0.52 m with coral hoops and a lid')
    prof = [(0, 0), (0.17, 0), (0.185, 0.015)]
    for z in ls(0.03, 0.49, 9):
        k = (z - 0.26) / 0.26
        prof.append((0.2 - 0.03 * k * k, z))
    prof += [(0.168, 0.505), (0.15, 0.51), (0, 0.51)]
    a.add(lathe_p('bs_body', prof, lambda c: 'pal_wood_dark' if c.z > 0.5 else 'pal_wood', 24))
    for zz in (0.07, 0.44):
        a.add(torus('bs_hoop', 0.2 - 0.03 * ((zz - 0.26) / 0.26) ** 2 + 0.004, 0.016, 'pal_coral_deep', (0, 0, zz), None, 28, 6))
    a.add(torus('bs_hoopm', 0.204, 0.012, 'pal_coral', (0, 0, 0.26), None, 28, 6))
    a.add(rbox('bs_lid', (0.26, 0.04, 0.02), (0, 0, 0.52), 'pal_wood_dark', 0.008, 2))

    # ---- bollard
    a = Asset('bollard', note='harbour bollard 0.55 m, cream with a coral cap and a rope loop')
    a.add(lathe_p('bo_body', [(0, 0), (0.2, 0), (0.21, 0.04), (0.17, 0.07), (0.13, 0.12), (0.12, 0.32), (0.14, 0.38),
                              (0.2, 0.42), (0.21, 0.47), (0.17, 0.52), (0.09, 0.55), (0, 0.555)],
                  bands('pal_cream', 0.395, 'pal_coral'), 24))
    a.add(torus('bo_rope', 0.135, 0.028, 'pal_sand', (0, 0, 0.2), (0.12, 0, 0), 24, 7))
    a.add(tube('bo_rope_end', bezier((0.0, -0.14, 0.2), (0.05, -0.3, 0.12), (0.16, -0.42, 0.03), 8), lambda u: 0.026,
               'pal_sand', sides=7))

    # ---- rope coil
    a = Asset('rope_coil', note='coiled rope 0.5 m across with a loose end')
    path = []
    turns = 3.0
    n = 84
    for i in range(n):
        u = i / (n - 1)
        an = 2 * pi * turns * u
        r = 0.19 - 0.012 * u
        path.append(Vector((r * cos(an), r * sin(an), 0.032 + 0.06 * turns * u)))
    tail = bezier(path[-1], path[-1] + Vector((0.12, -0.05, 0.05)), Vector((0.32, -0.25, 0.03)), 10)
    path = path + tail[1:]
    a.add(tube('rc_rope', path, lambda u: 0.032 * (1 + 0.1 * sin(u * 260)) if u < 0.985 else 0.03, 'pal_sand', sides=8))
    a.add(torus('rc_whip', 0.03, 0.012, 'pal_coral', path[-2], (0, pi / 2, -0.6), 12, 5))

    # ---- hanging lantern (origin at the hook)
    a = Asset('lantern', ground=False, note='hanging lantern 0.45 m with pal_emissive glass; origin at the hang point '
                                             '(top of the ring), body hangs below')
    a.add(torus('ln_ring', 0.035, 0.01, 'pal_ink', (0, 0, -0.035), (pi / 2, 0, 0), 14, 6))
    a.add(lathe('ln_cap', [(0, -0.12), (0.13, -0.12), (0.14, -0.115), (0.11, -0.095), (0.04, -0.07), (0.03, -0.065),
                           (0, -0.065)], 'pal_coral', 24))
    a.add(lathe('ln_glass', [(0, -0.34), (0.08, -0.34), (0.11, -0.28), (0.115, -0.21), (0.1, -0.14), (0.085, -0.12),
                             (0, -0.12)], 'pal_emissive', 24))
    for k in range(6):
        an = 2 * pi * k / 6
        path = [Vector((r * cos(an), r * sin(an), z)) for r, z in ((0.085, -0.122), (0.104, -0.14), (0.12, -0.21),
                                                                   (0.114, -0.28), (0.083, -0.34))]
        a.add(tube('ln_rib', path, lambda u: 0.007, 'pal_cream', sides=5))
    a.add(lathe('ln_base', [(0, -0.38), (0.04, -0.38), (0.09, -0.355), (0.095, -0.34), (0, -0.335)], 'pal_coral', 20))
    a.add(capsule('ln_tassel', (0, 0, -0.45), (0, 0, -0.38), 0.016, 'pal_yellow', 8, 2, r1=0.008))

    # ---- double street lamp
    a = Asset('street_lamp_double', note='3.3 m double street lamp, cream post, two pal_emissive globes on curled arms')
    a.add(lathe_p('sd_base', [(0, 0), (0.22, 0), (0.23, 0.04), (0.17, 0.1), (0.12, 0.3), (0.13, 0.34), (0.09, 0.38),
                              (0, 0.38)], bands('pal_stone', 0.32, 'pal_coral'), 24))
    a.add(lathe('sd_post', [(0, 0.36), (0.075, 0.36), (0.06, 1.2), (0.05, 2.6), (0.05, 2.75), (0, 2.75)], 'pal_cream',
                16))
    for zz in (1.0, 2.62):
        a.add(torus('sd_ring', 0.062 if zz < 2 else 0.054, 0.02, 'pal_coral', (0, 0, zz), None, 20, 6))
    for sx in (-1, 1):
        arm = bezier((0, 0, 2.55), (sx * 0.25, 0, 2.95), (sx * 0.62, 0, 2.95), 14, (sx * 0.7, 0, 2.82))
        a.add(tube('sd_arm', arm, lambda u: 0.03, 'pal_cream', sides=8))
        curl = [Vector((sx * (0.16 + 0.07 * cos(t)), 0, 2.7 + 0.07 * sin(t))) for t in ls(0, 1.7 * pi, 12)]
        a.add(tube('sd_curl', curl, lambda u: 0.018, 'pal_cream', sides=6))
        hc = Vector((sx * 0.7, 0, 2.8))
        a.add(lathe('sd_cap', [(0, -0.02), (0.15, -0.02), (0.16, -0.005), (0.07, 0.07), (0, 0.08)], 'pal_coral', 20, hc))
        a.add(ell('sd_globe', hc + Vector((0, 0, -0.15)), (0.14, 0.14, 0.15), 'pal_emissive', 20, 12))
        a.add(ell('sd_tip', hc + Vector((0, 0, -0.31)), 0.03, 'pal_coral', 10, 6))
    a.add(ell('sd_finial', (0, 0, 2.86), 0.07, 'pal_coral', 14, 9))
    a.add(cone('sd_spike', (0, 0, 2.9), (0, 0, 3.05), 0.04, 0.008, 'pal_coral', 10, 2))


def build_leisure():
    # ---- picnic bench
    a = Asset('bench_picnic', note='picnic table 1.6 m with attached benches; `seat` on the -Y bench facing the table '
                                    '(+Y)')
    for i, y in enumerate(ls(-0.27, 0.27, 3)):
        a.add(rbox('bp_top', (1.6, 0.17, 0.055), (0, y, 0.74), 'pal_wood', 0.022, 3))
    for sy in (-1, 1):
        for y in (sy * 0.53, sy * 0.68):
            a.add(rbox('bp_bench', (1.5, 0.13, 0.05), (0, y, 0.42), 'pal_coral', 0.02, 3))
    for sx in (-0.6, 0.6):
        for sy in (-1, 1):
            a.add(rod('bp_leg', (sx, sy * 0.72, 0.0), (sx, sy * 0.1, 0.72), 0.04, 'pal_cream', segs=12))
        a.add(rod('bp_cross', (sx, -0.78, 0.37), (sx, 0.78, 0.37), 0.035, 'pal_cream', segs=12))
        a.add(rbox('bp_cleat', (0.07, 0.8, 0.05), (sx, 0, 0.69), 'pal_cream', 0.02, 2))
    a.node(empty('seat', (0, -0.6, 0.46), (0, 0, pi)))

    # ---- beach umbrella
    a = Asset('umbrella_beach', note='beach umbrella 2.3 m, coral and cream stripes, slight tilt')
    tilt = Matrix.Rotation(radians(7), 4, 'X')
    parts = [rod('ub_pole', (0, 0, 0), (0, 0, 2.15), 0.03, 'pal_cream', segs=12),
             rod('ub_band', (0, 0, 1.1), (0, 0, 1.2), 0.04, 'pal_coral', segs=12)]
    can = canopy('ub_canopy', 1.0, 0.38, 8, ['pal_coral', 'pal_cream'], 1.82, rings=6, per=4, scallop=0.06)
    parts.append(can)
    parts.append(ell('ub_finial', (0, 0, 2.24), 0.05, 'pal_coral_deep', 12, 7))
    xform(parts, tilt)
    a.add(*parts)
    a.add(lathe('ub_mound', [(0, 0), (0.14, 0), (0.08, 0.05), (0, 0.06)], 'pal_sand', 16))

    # ---- sun lounger
    a = Asset('sun_lounger', note='wooden sun lounger 1.85 m with striped cushions; feet at -Y, backrest at +Y')
    for sx in (-1, 1):
        a.add(rod('sl_rail', (sx * 0.3, -0.9, 0.28), (sx * 0.3, 0.45, 0.28), 0.032, 'pal_wood', segs=10))
        for y in (-0.82, 0.38):
            a.add(rod('sl_leg', (sx * 0.3, y, 0.0), (sx * 0.3, y, 0.28), 0.03, 'pal_wood', segs=10))
        a.add(rod('sl_back', (sx * 0.3, 0.45, 0.28), (sx * 0.3, 0.9, 0.78), 0.03, 'pal_wood', segs=10))
        a.add(rod('sl_prop', (sx * 0.3, 0.38, 0.28), (sx * 0.3, 0.72, 0.58), 0.022, 'pal_wood_dark', segs=8))
    for k, y in enumerate(ls(-0.72, 0.28, 3)):
        a.add(rbox('sl_pad', (0.56, 0.33, 0.08), (0, y, 0.34), ('pal_coral', 'pal_cream', 'pal_coral')[k], 0.035, 3))
    bk = Matrix.Translation((0, 0.46, 0.33)) @ Matrix.Rotation(radians(48), 4, 'X')
    bp = [rbox('sl_bpad', (0.56, 0.33, 0.08), (0, 0.18, 0.0), 'pal_cream', 0.035, 3),
          rbox('sl_bpad2', (0.56, 0.3, 0.08), (0, 0.5, 0.0), 'pal_coral', 0.035, 3),
          ell('sl_pillow', (0, 0.6, 0.08), (0.22, 0.1, 0.06), 'pal_white', 14, 8)]
    xform(bp, bk)
    a.add(*bp)
    a.add(rbox('sl_towel', (0.4, 0.3, 0.025), (0.0, -0.3, 0.39), 'pal_sky', 0.01, 2, rot=(0, 0, 0.1)))

    # ---- rounded bin
    a = Asset('bin', note='rounded street bin 0.9 m, mint with a cream lid and coral flap')
    a.add(lathe_p('bn_body', [(0, 0), (0.2, 0), (0.22, 0.03), (0.25, 0.4), (0.26, 0.72), (0.24, 0.75), (0, 0.75)],
                  bands('pal_cream', 0.06, 'pal_grass', 0.42, 'pal_cream', 0.48, 'pal_grass'), 26))
    a.add(lathe('bn_lid', [(0, 0.74), (0.28, 0.74), (0.285, 0.77), (0.24, 0.86), (0.12, 0.9), (0, 0.905)], 'pal_cream',
                26))
    a.add(rbox('bn_flap', (0.26, 0.05, 0.1), (0, -0.25, 0.81), 'pal_coral', 0.02, 2, rot=(radians(-28), 0, 0)))
    a.add(ell('bn_knob', (0, 0, 0.92), (0.05, 0.05, 0.03), 'pal_coral', 12, 6))
    a.add(ell('bn_leaf', (0, -0.245, 0.27), (0.05, 0.012, 0.07), 'pal_white', 12, 6, rot=(0, 0.5, 0)))

    # ---- notice pillar
    a = Asset('notice_pillar', note='round advertising pillar 2.6 m; `label` quad on the front board faces -Y')
    a.add(lathe_p('np_base', [(0, 0), (0.52, 0), (0.53, 0.04), (0.5, 0.2), (0.45, 0.22), (0, 0.22)],
                  lambda c: 'pal_stone', 32))
    a.add(lathe('np_body', [(0, 0.2), (0.42, 0.2), (0.42, 2.12), (0, 2.12)], 'pal_pink', 32))
    a.add(lathe('np_cornice', [(0, 2.1), (0.45, 2.1), (0.5, 2.14), (0.5, 2.2), (0.46, 2.22), (0, 2.22)], 'pal_coral', 32))
    a.add(lathe('np_dome', [(0, 2.2), (0.44, 2.2), (0.4, 2.32), (0.26, 2.46), (0.08, 2.52), (0, 2.53)], 'pal_coral_deep',
                32))
    a.add(ell('np_finial', (0, 0, 2.6), 0.07, 'pal_yellow', 12, 8))
    for k, (an, z0, z1, m) in enumerate(((0.9, 0.5, 1.4, 'pal_yellow'), (2.2, 0.7, 1.9, 'pal_sky'),
                                          (3.5, 0.4, 1.3, 'pal_pink'), (4.4, 1.2, 1.95, 'pal_grass_light'),
                                          (5.6, 0.45, 1.1, 'pal_peach'))):
        prof = [(0.418, z0), (0.432, z0 + 0.005), (0.432, z1 - 0.005), (0.418, z1)]
        bm = bmesh.new()
        rings_ = []
        for t in ls(-0.42, 0.42, 9):
            rings_.append([bm.verts.new((r * cos(an + t), r * sin(an + t), z)) for r, z in prof])
        for A, B in zip(rings_, rings_[1:]):
            for j in range(3):
                bm.faces.new((A[j], A[j + 1], B[j + 1], B[j]))
        bm.faces.new(rings_[0])
        bm.faces.new(list(reversed(rings_[-1])))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        a.add(mk('np_poster', bm, m))
    a.add(rbox('np_board', (0.62, 0.1, 0.82), (0, -0.4, 1.25), 'pal_coral', 0.03, 3))
    a.node(quad_uv('label', 0.54, 0.74, (0, -0.452, 1.25), None, 'pal_cream'))

    # ---- bus stop
    a = Asset('bus_stop', note='small bus shelter 2.6 x 1.3 m; `label` quad on the roof fascia faces -Y; `seat` on the '
                                'bench facing -Y')
    for sx in (-1.15, 1.15):
        for y in (-0.45, 0.5):
            a.add(rod('bs_post', (sx, y, 0), (sx, y, 2.28), 0.045, 'pal_cream', segs=12))
    a.add(squircle('bs_roof', (1.35, 0.72, 0.09), (0, 0.02, 2.36), 'pal_coral', e=0.3, segs=28, rings=12))
    a.add(rbox('bs_fascia', (1.6, 0.08, 0.32), (0, -0.66, 2.2), 'pal_navy', 0.035, 3))
    a.node(quad_uv('label', 1.46, 0.24, (0, -0.702, 2.2), None, 'pal_cream'))
    a.add(rbox('bs_backglass', (2.24, 0.04, 1.35), (0, 0.5, 1.25), 'pal_glass', 0.015, 2))
    a.add(rbox('bs_backframe', (2.3, 0.07, 0.07), (0, 0.5, 0.56), 'pal_cream', 0.025, 2))
    a.add(rbox('bs_backframe2', (2.3, 0.07, 0.07), (0, 0.5, 1.94), 'pal_cream', 0.025, 2))
    a.add(rbox('bs_sideglass', (0.04, 0.9, 1.35), (1.15, 0.02, 1.25), 'pal_glass', 0.015, 2))
    a.add(rbox('bs_map', (0.04, 0.5, 0.65), (1.12, 0.02, 1.3), 'pal_sky', 0.012, 2))
    a.add(rbox('bs_mapdot', (0.03, 0.06, 0.06), (1.1, -0.05, 1.42), 'pal_coral', 0.012, 2))
    for k in range(3):
        a.add(rbox('bs_slat', (1.7, 0.12, 0.045), (0, 0.13 + k * 0.13, 0.45), 'pal_coral', 0.018, 2))
    for sx in (-0.7, 0.7):
        a.add(rbox('bs_benchleg', (0.06, 0.36, 0.43), (sx, 0.26, 0.215), 'pal_cream', 0.02, 2))
    a.add(rod('bs_signpost', (-1.55, -0.55, 0), (-1.55, -0.55, 2.2), 0.035, 'pal_cream', segs=10))
    a.add(vslab('bs_sign', ellipse_pts(0.22, 0.22, 28), -0.03, 0.03, 'pal_yellow', 0.015, loc=(-1.55, -0.6, 2.25)))
    a.add(vslab('bs_signring', ellipse_pts(0.13, 0.13, 22), -0.045, -0.025, 'pal_coral', 0.008, loc=(-1.55, -0.6, 2.25)))
    a.node(empty('seat', (0, 0.25, 0.5)))

    # ---- fountain
    a = Asset('fountain', note='round fountain 2.4 m, cream basin with pal_water water and a two-tier spout')
    a.add(lathe_p('ft_basin', [(0, 0), (1.15, 0), (1.2, 0.04), (1.2, 0.4), (1.17, 0.47), (1.1, 0.5), (1.03, 0.47),
                               (1.0, 0.4), (1.0, 0.16), (0, 0.16)],
                  lambda c: 'pal_coral' if (0.06 < c.z < 0.14 and c.x * c.x + c.y * c.y > 1.3) else 'pal_cream', 40))
    a.add(lathe('ft_water', [(0, 0.3), (1.0, 0.3), (1.005, 0.36), (0, 0.36)], 'pal_water', 48))
    for r in (0.62, 0.82):
        a.add(torus('ft_ripple', r, 0.012, 'pal_sky', (0, 0, 0.36), None, 40, 4))
    a.add(lathe_p('ft_column', [(0, 0.3), (0.24, 0.3), (0.2, 0.4), (0.13, 0.48), (0.11, 0.8), (0.15, 0.86),
                                (0, 0.86)], bands('pal_cream', 0.42, 'pal_coral', 0.47, 'pal_cream'), 24))
    a.add(lathe('ft_bowl', [(0, 0.84), (0.2, 0.84), (0.42, 0.95), (0.46, 1.02), (0.42, 1.04), (0.38, 0.98), (0, 0.98)],
                'pal_cream', 32))
    a.add(lathe('ft_bowlwater', [(0, 0.98), (0.39, 0.98), (0.4, 1.01), (0, 1.01)], 'pal_water', 32))
    for k in range(8):
        an = 2 * pi * k / 8 + 0.2
        dv = Vector((cos(an), sin(an), 0))
        path = [dv * (0.44 + 0.16 * u ** 0.8) + Vector((0, 0, 1.02 + 0.06 * sin(pi * u * 0.6) - 0.68 * u ** 1.8))
                for u in ls(0, 1, 7)]
        a.add(tube('ft_stream', path, lambda u: 0.035 - 0.012 * u, 'pal_water', sides=6))
        a.add(ell('ft_splash', dv * 0.6 + Vector((0, 0, 0.36)), (0.06, 0.06, 0.025), 'pal_sky', 10, 5))
    a.add(lathe_p('ft_spire', [(0, 1.0), (0.07, 1.0), (0.05, 1.12), (0.08, 1.16), (0.03, 1.22), (0, 1.22)],
                  lambda c: 'pal_coral', 16))
    a.add(lathe('ft_jet', drop_prof(0.07, 0.4, 0.03, 8, 6, z0=1.18), 'pal_water', 16))
    a.add(ell('ft_droptop', (0, 0, 1.62), 0.04, 'pal_sky', 10, 6))


def build_animals():
    # ---- sitting cat
    a = Asset('cat', note='sitting cat 0.45 m, cream with coral patches; faces -Y')
    C, P = 'pal_cream', 'pal_coral'
    a.add(lathe('ct_body', [(0, 0), (0.1, 0), (0.135, 0.04), (0.14, 0.11), (0.12, 0.19), (0.09, 0.25), (0.07, 0.29),
                            (0, 0.3)], C, 20, (0, 0.02, 0), scale=(1, 1.08, 1)))
    a.add(ell('ct_patch', (0.0, 0.12, 0.16), (0.09, 0.05, 0.08), P, 14, 8, rot=(0.3, 0, 0.2)))
    a.add(ell('ct_patch2', (-0.11, 0.0, 0.1), (0.05, 0.08, 0.06), P, 14, 8))
    for sx in (-1, 1):
        a.add(ell('ct_haunch', (sx * 0.085, 0.05, 0.07), (0.06, 0.1, 0.07), C, 14, 9))
        a.add(capsule('ct_leg', (sx * 0.045, -0.085, 0.02), (sx * 0.05, -0.07, 0.2), 0.03, C, 10, 3))
        a.add(ell('ct_paw', (sx * 0.045, -0.105, 0.02), (0.032, 0.042, 0.022), C, 10, 6))
    hc = Vector((0, -0.045, 0.36))
    a.add(ell('ct_head', hc, (0.105, 0.09, 0.088), C, 20, 12))
    a.add(ell('ct_headpatch', hc + Vector((0.05, -0.04, 0.045)), (0.05, 0.045, 0.035), P, 12, 7))
    for sx in (-1, 1):
        a.add(lathe('ct_ear', capsule_prof(0.075, 0.035, 0.008, 3), P if sx > 0 else C, 10,
                    hc + Vector((sx * 0.058, 0.0, 0.05)), (radians(-8), sx * radians(24), 0)))
        a.add(ell('ct_cheek', hc + Vector((sx * 0.028, -0.078, -0.03)), (0.03, 0.022, 0.022), 'pal_white', 10, 6))
        a.add(ell('ct_blush', hc + Vector((sx * 0.065, -0.068, -0.02)), (0.016, 0.006, 0.01), 'pal_peach', 8, 5,
                  rot=(0, 0, -sx * 0.6)))
    a.add(ell('ct_nose', hc + Vector((0, -0.094, -0.012)), (0.012, 0.008, 0.008), 'pal_pink', 8, 5))
    a.add(*eye_pair('ct', hc + Vector((0, -0.078, 0.012)), 0.038, 0.013))
    tail = [Vector(p) for p in ((0, 0.13, 0.03), (0.08, 0.14, 0.02), (0.15, 0.05, 0.02), (0.14, -0.06, 0.02),
                                (0.09, -0.12, 0.03))]
    a.add(tube('ct_tail', bezier(tail[0], tail[1] + Vector((0.08, 0, 0)), tail[3], 14, tail[4]),
               lambda u: 0.024 * (1 - 0.3 * u) if u < 0.97 else 0.012, P, sides=8))

    # ---- sleeping cat
    a = Asset('cat_sleep', note='curled sleeping cat 0.4 m across, cream with coral patches')
    path = [Vector((0.13 * cos(t), 0.11 * sin(t), 0.075)) for t in ls(-0.4 * pi, 1.2 * pi, 20)]
    a.add(tube('cs_body', path, lambda u: 0.085 * sin(pi * min(1, 0.12 + u * 0.88)) ** 0.5 + 0.01, C, sides=14))
    a.add(ell('cs_patch', (0.0, 0.12, 0.12), (0.08, 0.05, 0.04), P, 12, 7, rot=(0.4, 0, 0)))
    a.add(ell('cs_patch2', (0.12, -0.03, 0.12), (0.05, 0.07, 0.03), P, 12, 7))
    hc = Vector((-0.06, -0.1, 0.09))
    a.add(ell('cs_head', hc, (0.088, 0.078, 0.07), C, 18, 11))
    for sx in (-1, 1):
        a.add(lathe('cs_ear', capsule_prof(0.065, 0.03, 0.007, 3), P if sx > 0 else C, 10,
                    hc + Vector((sx * 0.05, 0.02, 0.04)), (radians(10), sx * radians(35), 0)))
        a.add(tube('cs_lid', [hc + Vector((sx * 0.032 - 0.014, -0.068, 0.012)), hc + Vector((sx * 0.032, -0.074, 0.004)),
                              hc + Vector((sx * 0.032 + 0.014, -0.068, 0.012))], lambda u: 0.004, 'pal_ink', sides=5))
        a.add(ell('cs_blush', hc + Vector((sx * 0.055, -0.058, -0.015)), (0.014, 0.006, 0.009), 'pal_peach', 8, 5))
    a.add(ell('cs_nose', hc + Vector((0, -0.08, -0.008)), (0.01, 0.007, 0.007), 'pal_pink', 8, 5))
    tpath = bezier((0.04, 0.1, 0.03), (0.2, 0.02, 0.04), (0.08, -0.17, 0.045), 12, (-0.06, -0.17, 0.05))
    a.add(tube('cs_tail', tpath, lambda u: 0.024 if u < 0.97 else 0.012, P, sides=8))
    for sx in (-1, 1):
        a.add(ell('cs_paw', hc + Vector((sx * 0.04, -0.06, -0.06)), (0.028, 0.035, 0.02), C, 10, 6))

    # ---- sitting dog
    a = Asset('dog', note='friendly sitting dog 0.6 m, sand with wood ears and a coral collar; faces -Y')
    D, E = 'pal_sand', 'pal_wood'
    a.add(lathe('dg_body', [(0, 0), (0.13, 0), (0.17, 0.05), (0.17, 0.15), (0.14, 0.26), (0.1, 0.34), (0.08, 0.38),
                            (0, 0.39)], D, 22, (0, 0.03, 0), scale=(1, 1.1, 1)))
    a.add(ell('dg_chest', (0, -0.07, 0.24), (0.1, 0.07, 0.12), 'pal_cream', 14, 9))
    for sx in (-1, 1):
        a.add(ell('dg_haunch', (sx * 0.11, 0.07, 0.09), (0.075, 0.13, 0.09), D, 14, 9))
        a.add(ell('dg_foot', (sx * 0.12, -0.04, 0.025), (0.04, 0.07, 0.03), D, 10, 6))
        a.add(capsule('dg_leg', (sx * 0.06, -0.1, 0.025), (sx * 0.065, -0.07, 0.26), 0.038, D, 10, 3))
        a.add(ell('dg_paw', (sx * 0.06, -0.125, 0.025), (0.042, 0.05, 0.028), 'pal_cream', 10, 6))
    hc = Vector((0, -0.07, 0.48))
    a.add(ell('dg_head', hc, (0.12, 0.11, 0.105), D, 20, 12))
    a.add(ell('dg_muzzle', hc + Vector((0, -0.1, -0.035)), (0.065, 0.06, 0.048), 'pal_cream', 14, 9))
    a.add(ell('dg_nose', hc + Vector((0, -0.158, -0.012)), (0.026, 0.018, 0.018), 'pal_ink', 10, 6))
    a.add(ell('dg_tongue', hc + Vector((0.01, -0.13, -0.085)), (0.022, 0.015, 0.028), 'pal_pink', 10, 6,
              rot=(0.3, 0, 0)))
    a.add(*eye_pair('dg', hc + Vector((0, -0.095, 0.03)), 0.045, 0.015))
    for sx in (-1, 1):
        a.add(ell('dg_ear', hc + Vector((sx * 0.11, 0.0, -0.005)), (0.035, 0.06, 0.1), E, 12, 8,
                  rot=(0, sx * radians(-18), 0)))
        a.add(ell('dg_brow', hc + Vector((sx * 0.045, -0.095, 0.065)), (0.018, 0.008, 0.008), E, 8, 5))
    a.add(torus('dg_collar', 0.085, 0.018, 'pal_coral', (0, -0.04, 0.37), (radians(-12), 0, 0), 22, 6))
    a.add(ell('dg_tag', (0, -0.13, 0.34), (0.022, 0.008, 0.022), 'pal_yellow', 10, 6))
    a.add(tube('dg_tail', bezier((0, 0.19, 0.06), (0.05, 0.3, 0.06), (0.14, 0.28, 0.1), 10), lambda u: 0.03 * (1 - 0.5 * u),
               E, sides=8))
    a.add(ell('dg_spot', (0.08, 0.1, 0.26), (0.06, 0.06, 0.06), E, 12, 7))

    # ---- goat
    a = Asset('goat', note='small cream goat 0.75 m tall, standing; faces -Y; a coral collar with a bell')
    G = 'pal_cream'
    a.add(capsule('gt_body', (0, 0.22, 0.42), (0, -0.2, 0.44), 0.16, G, 18, 5))
    a.add(ell('gt_belly', (0, 0.0, 0.36), (0.15, 0.22, 0.1), G, 14, 8))
    for sx in (-1, 1):
        for y in (-0.17, 0.2):
            a.add(capsule('gt_leg', (sx * 0.085, y, 0.05), (sx * 0.09, y, 0.38), 0.042, G, 10, 3))
            a.add(lathe('gt_hoof', rcyl_prof(0.045, 0.06, c=0.015, n=2), 'pal_ink', 10, (sx * 0.085, y, 0)))
    nk = Vector((0, -0.27, 0.6))
    a.add(capsule('gt_neck', (0, -0.18, 0.46), nk, 0.085, G, 12, 3))
    hc = Vector((0, -0.31, 0.66))
    a.add(ell('gt_head', hc, (0.085, 0.09, 0.08), G, 18, 11))
    a.add(ell('gt_snout', hc + Vector((0, -0.1, -0.04)), (0.06, 0.08, 0.055), G, 14, 9, rot=(0.35, 0, 0)))
    a.add(ell('gt_nose', hc + Vector((0, -0.17, -0.055)), (0.03, 0.015, 0.02), 'pal_pink', 10, 6))
    a.add(*eye_pair('gt', hc + Vector((0, -0.06, 0.03)), 0.055, 0.014))
    a.add(cone('gt_beard', hc + Vector((0, -0.14, -0.09)), hc + Vector((0, -0.12, -0.17)), 0.022, 0.008, 'pal_stone',
               8, 2))
    for sx in (-1, 1):
        a.add(ell('gt_ear', hc + Vector((sx * 0.1, 0.02, 0.0)), (0.07, 0.025, 0.03), G, 10, 6,
                  rot=(0, sx * radians(25), sx * radians(-15))))
        horn = bezier(hc + Vector((sx * 0.035, 0.0, 0.06)), hc + Vector((sx * 0.05, 0.05, 0.15)),
                      hc + Vector((sx * 0.06, 0.12, 0.13)), 8)
        a.add(tube('gt_horn', horn, lambda u: 0.022 * (1 - 0.7 * u) + 0.004, 'pal_stone', sides=8))
    a.add(torus('gt_collar', 0.075, 0.016, 'pal_coral', (0, -0.235, 0.53), (radians(-40), 0, 0), 20, 6))
    a.add(lathe('gt_bell', [(0, 0), (0.03, 0), (0.028, 0.02), (0.018, 0.045), (0, 0.05)], 'pal_yellow', 12,
                (0, -0.3, 0.42)))
    a.add(cone('gt_tail', (0, 0.36, 0.5), (0, 0.4, 0.6), 0.03, 0.012, G, 8, 2))
    a.add(ell('gt_patch', (0.06, 0.05, 0.56), (0.08, 0.12, 0.04), 'pal_stone', 12, 7, rot=(0, 0.4, 0)))


def build_all():
    build_water()
    build_flyers()
    build_rickshaw()
    build_bicycle('bicycle', False)
    build_bicycle('bicycle_lean', True)
    build_cart()
    build_small_street()
    build_story_props()
    build_leisure()
    build_animals()


# ============================================================================= PHASES
NATURE_GLB = os.path.normpath(os.path.join(HERE, '..', 'nature', 'nature.glb'))


def phase_build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    t = time.time()
    build_all()
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
        export_texcoords=True,
        export_draco_mesh_compression_enable=False, export_meshopt_compression_enable=False,
        export_image_format='NONE', export_materials='EXPORT', export_animations=False, export_cameras=False,
        export_lights=False, export_attributes=False, export_tangents=False)
    fix_glb_names(GLB)
    print('GLB bytes', os.path.getsize(GLB))
    json.dump({a.name: {'kind': a.kind, 'note': a.note} for a in ASSETS},
              open(os.path.join(HERE, '_notes.json'), 'w'), indent=1)


WATER = {'duck', 'duckling', 'rowboat', 'sailboat_toy', 'buoy', 'lily_cluster'}
ANIMALS = {'cat', 'cat_sleep', 'dog', 'goat'}


def preview_setup(name):
    """Return (base tile or None, root offset)."""
    if name in WATER:
        return None, (0, 0, -0.55)
    if name == 'fish':
        return None, (0, 0, -0.25)
    if name == 'seagull':
        return None, (0, 0, 0.3)
    if name == 'butterfly':
        return 'hex_grass', (0, 0, 0.3)
    if name == 'kite_bird':
        return 'hex_grass', (0, 0, 1.6)
    if name in ('string_lights', 'bunting'):
        return 'hex_stone', (-2.0, 0, 1.4)
    if name == 'lantern':
        return 'hex_cream', (0, 0, 0.9)
    if name in ANIMALS or name in ('fountain', 'bench_picnic', 'app_balloon', 'potted_plant_a', 'potted_plant_b',
                                   'kids_ball', 'cricket_bat', 'charpai'):
        return 'hex_grass', (0, 0, 0)
    if name in ('umbrella_beach', 'sun_lounger', 'bollard', 'rope_coil'):
        return 'hex_sand', (0, 0, 0)
    return 'hex_stone', (0, 0, 0)


def phase_render():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    vl_update()
    roots = [o for o in scene().objects if o.parent is None]
    notes = json.load(open(os.path.join(HERE, '_notes.json')))
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
        uvok = all(len(o.data.uv_layers) > 0 for o in ds if clean(o.name) in ('screen', 'label'))
        print('ROOT %-20s tris %5d size %.2f x %.2f x %.2f  COL0 %s  UV %s  mats %s  special %s' % (
            clean(r.name), tris, size.x, size.y, size.z, cols, uvok, sorted(mats), specials))
        rows.append((clean(r.name), size, tris, specials, notes.get(clean(r.name), {}).get('note', ''), lo, hi))
    bad = sorted(m for m in allmats if m not in PAL)
    missing = sorted(set(notes) - {r[0] for r in rows})
    print('TOTAL TRIS', total, ' roots', len(rows), ' off-palette materials:', bad, ' missing roots:', missing,
          ' animations:', [a.name for a in bpy.data.actions])
    with open(MANIFEST, 'w') as f:
        f.write('# details pack: MANIFEST\n\n')
        f.write('`details.glb` - %d roots, %d triangles total, %.0f KB. Built by `build_details.py` '
                '(one command rebuilds everything). Units metres; sizes are the bounding box (x, y, z) in Blender axes '
                '(Z up, front -Y). Every mesh carries baked AO as COLOR_0 (`Col`). Palette materials only. '
                'No animations (wings, heads and fish jumps are animated by the engine). `screen` and `label` quads '
                'have UVs 0..1 and face -Y.\n\n'
                % (len(rows), total, os.path.getsize(GLB) / 1024))
        for nm, size, tris, sp, note, lo, hi in rows:
            f.write('- **%s**: %.2f x %.2f x %.2f m (z %.2f..%.2f), %d tris; special: %s; %s\n' % (
                nm, size.x, size.y, size.z, lo.z, hi.z, tris, ', '.join('`%s`' % s for s in sp) or 'none', note))
    if 'render' not in PHASES and 'sheet' not in PHASES:
        return
    mine = {clean(r.name): r for r in roots}
    before = set(o.name for o in scene().objects)
    bpy.ops.import_scene.gltf(filepath=NATURE_GLB)
    vl_update()
    nat = {clean(o.name): o for o in scene().objects if o.parent is None and o.name not in before}
    lookdev_materials()
    for o in scene().objects:
        o.hide_render = True
    water, wall, key, cam = setup_lookdev()
    for o in (water, wall, key, cam):
        o.hide_render = False
    sc = scene()
    if 'render' in PHASES:
        os.makedirs(PREV, exist_ok=True)
        sc.render.resolution_x, sc.render.resolution_y = 800, 600
        for nm in mine:
            if ONLY and nm not in ONLY:
                continue
            base, off = preview_setup(nm)
            made = dup(mine[nm], off)
            lo, hi = world_bbox(made)
            if base:
                made += dup(nat[base], (0, 0, 0))
            frame_camera(cam, key, wall, lo, hi, lens=60, minrad={'butterfly': 0.1, 'duckling': 0.17, 'fish': 0.2}.get(nm, 0.28))
            sc.render.filepath = os.path.join(PREV, nm + '.png')
            bpy.ops.render.render(write_still=True)
            for o in made:
                bpy.data.objects.remove(o, do_unlink=True)
            print('rendered', nm)
    if 'sheet' in PHASES:
        contact_sheet(mine, nat, cam, key, wall)


def hex_xy(q, r, R=2.0):
    return Vector((sqrt(3) * R * (q + r / 2), 1.5 * R * r, 0))


def contact_sheet(rm, nat, cam, key, wall):
    sc = scene()
    rnd = random.Random(3)
    made = []

    def put(name, loc, rz=0.0, s=1.0):
        src = rm.get(name) or nat[name]
        made.extend(dup(src, Vector(loc), rz, s))

    grass_tiles = []

    def island(center, tiles):
        for (q, r), kind in tiles:
            p = center + hex_xy(q, r)
            put(kind, p)
            if kind in ('hex_grass', 'hex_grass_deep'):
                grass_tiles.append(p)

    def hang(name, p0, p1):
        d = Vector(p1) - Vector(p0)
        put(name, p0, atan2(d.y, d.x), 1.0)

    # ------------------------------------------------ bazaar corner (left)
    B = Vector((-4.6, 1.6, 0))
    island(B, [((0, 0), 'hex_stone'), ((1, 0), 'hex_stone'), ((-1, 0), 'hex_grass'), ((0, 1), 'hex_stone'),
               ((0, -1), 'hex_stone'), ((1, -1), 'hex_grass'), ((-1, 1), 'hex_grass'), ((1, 1), 'hex_stone')])
    put('rickshaw', B + Vector((-0.4, -1.2, 0)), radians(-28))
    put('fruit_cart', B + hex_xy(1, 0) + Vector((0.1, -0.6, 0)), radians(18))
    put('crate_fruit', B + hex_xy(1, 0) + Vector((-0.9, -1.5, 0)), radians(10))
    put('sack_grain', B + hex_xy(1, 0) + Vector((1.2, 0.1, 0)))
    put('barrel_small', B + hex_xy(1, 0) + Vector((1.0, 0.7, 0)))
    pA = B + hex_xy(0, 1) + Vector((-1.2, 0.5, 0))
    pB = pA + Vector((4.0, -0.25, 0))
    put('lamp_post', pA)
    put('lamp_post', pB)
    hang('string_lights', pA + Vector((0, 0, 2.55)), pB + Vector((0, 0, 2.55)))
    pC = B + hex_xy(-1, 0) + Vector((-1.0, 1.0, 0))
    put('street_lamp_double', pC)
    hang('bunting', pC + Vector((0.65, 0, 2.95)), pC + Vector((0.65, 0, 2.95)) + Vector((3.6, -1.75, 0)).normalized() * 4)
    put('charpai', B + hex_xy(-1, 0) + Vector((0.1, -0.2, 0)), radians(-12))
    put('chai_set', B + hex_xy(-1, 0) + Vector((-0.25, -0.15, 0.46)), radians(10))
    put('cat_sleep', B + hex_xy(-1, 0) + Vector((0.55, -0.05, 0.46)), radians(40))
    put('dog', B + hex_xy(-1, 0) + Vector((0.6, -1.0, 0)), radians(-20))
    put('water_cooler', B + hex_xy(0, 1) + Vector((0.2, 0.9, 0)))
    put('potted_plant_a', B + hex_xy(0, 1) + Vector((0.9, 0.7, 0)))
    put('potted_plant_b', B + hex_xy(0, 1) + Vector((-0.5, 1.0, 0)))
    put('bicycle_lean', B + hex_xy(1, 1) + Vector((-0.4, 0.6, 0)), radians(80))
    put('notice_pillar', B + hex_xy(1, 1) + Vector((0.8, 0.3, 0)))
    put('mail_sack', B + hex_xy(1, 1) + Vector((0.6, -0.7, 0)), radians(20))
    put('parcel', B + hex_xy(1, 1) + Vector((0.0, -0.9, 0)), radians(-15))
    put('parcel', B + hex_xy(1, 1) + Vector((0.05, -0.9, 0.28)), radians(10), 0.8)
    put('cat', B + hex_xy(0, 0) + Vector((0.9, 0.6, 0)), radians(-30))
    put('kids_ball', B + hex_xy(0, -1) + Vector((0.9, -0.2, 0)))
    put('cricket_bat', B + hex_xy(0, -1) + Vector((-1.0, -0.6, 0)), radians(15))
    put('bin', B + hex_xy(0, -1) + Vector((1.3, 0.5, 0)))
    put('goat', B + hex_xy(1, -1) + Vector((0.2, -0.2, 0)), radians(-50))
    put('tree_blob_coral', B + hex_xy(0, 1) + Vector((1.4, 1.1, 0)))
    put('tree_pear_mint', B + hex_xy(1, -1) + Vector((0.9, 0.7, 0)))
    put('bus_stop', B + hex_xy(-1, 1) + Vector((0.6, -0.3, 0)), radians(-20), 0.9)
    put('butterfly', B + hex_xy(1, -1) + Vector((-0.6, -0.5, 0.9)), radians(30), 1.6)
    # ------------------------------------------------ pond side (right)
    P = Vector((4.6, -0.6, 0))
    island(P, [((0, 0), 'hex_grass'), ((1, 0), 'hex_grass'), ((0, 1), 'hex_grass_deep'), ((1, -1), 'hex_sand'),
               ((-1, 1), 'hex_grass'), ((1, 1), 'hex_grass')])
    put('fountain', P + hex_xy(0, 1) + Vector((0, 0.1, 0)))
    put('bench_picnic', P + hex_xy(1, 0) + Vector((0.0, 0.2, 0)), radians(-15))
    put('laptop_open', P + hex_xy(1, 0) + Vector((0.2, 0.2, 0.765)), radians(-20))
    put('phone_giant', P + hex_xy(1, 1) + Vector((0.3, 0.4, 0)), radians(-20))
    put('app_balloon', P + hex_xy(1, 0) + Vector((1.1, 0.4, 0)))
    put('umbrella_beach', P + hex_xy(1, -1) + Vector((-0.4, 0.3, 0)), radians(30))
    put('sun_lounger', P + hex_xy(1, -1) + Vector((0.4, -0.3, 0)), radians(160))
    put('potted_plant_b', P + hex_xy(0, 0) + Vector((-1.0, 0.8, 0)))
    put('flower_patch', P + hex_xy(0, 0) + Vector((0.4, -0.5, 0)))
    put('butterfly', P + hex_xy(0, 0) + Vector((0.3, -0.6, 0.55)), radians(-30), 1.6)
    put('butterfly', P + hex_xy(0, 0) + Vector((0.8, -0.2, 0.8)), radians(60), 1.4)
    put('tree_cushion_deep', P + hex_xy(-1, 1) + Vector((-0.5, 0.4, 0)))
    put('cat', P + hex_xy(0, 1) + Vector((1.15, -0.3, 0.5)), radians(-60), 0.8)
    put('bollard', P + hex_xy(0, 0) + Vector((-0.9, -1.0, 0)))
    put('rope_coil', P + hex_xy(0, 0) + Vector((-0.2, -1.2, 0)))
    put('dock', P + hex_xy(0, 0) + Vector((-0.6, -2.6, 0)), radians(0))
    # water life in the lagoon in front
    W = -0.55
    put('rowboat', P + Vector((-2.2, -2.6, W)), radians(-70))
    put('buoy', P + Vector((2.6, -4.2, W)))
    put('sailboat_toy', P + Vector((4.3, -2.8, W)), radians(30))
    put('lily_cluster', Vector((-0.9, -1.0, W)), radians(20), 1.3)
    put('lily_cluster', Vector((0.9, -0.6, W)), radians(140), 1.1)
    put('lily_cluster', Vector((0.3, -3.2, W)), radians(260), 1.3)
    put('lily_cluster', Vector((-1.6, -3.0, W)), radians(80), 1.0)
    put('duck', Vector((0.0, -1.9, W)), radians(-60), 1.4)
    for k in range(3):
        put('duckling', Vector((-0.45 - 0.33 * k, -2.15 - 0.16 * k, W)), radians(-60 + rnd.uniform(-20, 20)), 1.4)
    put('duck', Vector((1.3, -2.4, W)), radians(150), 1.4)
    put('fish', Vector((-0.4, -3.6, -0.15)), radians(-30) , 1.5)
    put('seagull', P + Vector((0.5, -1.5, 3.4)), radians(-120), 1.2)
    put('seagull', P + Vector((-6.0, 3.0, 4.6)), radians(-70), 1.1)
    put('kite_bird', B + Vector((2.5, 3.6, 4.6)), radians(-10), 1.2)
    put('cloud', (-1.0, 9.0, 6.8), 0, 1.2)
    occupied = [o.matrix_world.translation.copy() for o in made if o.parent is None and not clean(o.name).startswith('hex_')]
    for p in grass_tiles:
        n = 0
        tries = 0
        while n < 14 and tries < 80:
            tries += 1
            a_ = rnd.uniform(0, 2 * pi)
            rr = sqrt(rnd.random()) * 1.55
            q = p + Vector((cos(a_) * rr, sin(a_) * rr, 0))
            if any((Vector((q.x - o.x, q.y - o.y)).length < 0.8) for o in occupied):
                continue
            put('grass_tuft' if rnd.random() < 0.3 else 'grass_spike', q, rnd.uniform(0, 6.28), rnd.uniform(0.8, 1.3))
            n += 1
    sc.render.resolution_x, sc.render.resolution_y = 2000, 1300
    cam.data.lens = 72
    cam.data.sensor_width = 36
    target = Vector((-1.6, -0.6, 0.6))
    d = Vector((-0.75, -1.5, 1.25)).normalized()
    cam.location = target + d * SHEET_DIST
    aim(cam, target)
    cam.data.clip_start = 1
    cam.data.clip_end = 500
    key.location = target + Vector((-0.55, -0.3, 0.78)).normalized() * 30
    aim(key, target)
    key.data.size = 14
    key.data.energy = 2600 * (30 / 8.0) ** 2
    wall.location = (0, 14.5, 0)
    sc.render.filepath = SHEET
    bpy.ops.render.render(write_still=True)
    print('contact sheet done')


SHEET_DIST = 42

if __name__ == '__main__':
    t0 = time.time()
    if 'build' in PHASES:
        phase_build()
        os.makedirs(SRC_MODELS, exist_ok=True)
        shutil.copyfile(GLB, os.path.join(SRC_MODELS, 'details.glb'))
        print('copied to', SRC_MODELS)
    if 'render' in PHASES or 'sheet' in PHASES or 'build' in PHASES:
        phase_render()
    print('DONE in %.1fs' % (time.time() - t0))
