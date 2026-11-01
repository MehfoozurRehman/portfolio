"""Launch Isles - BUILDINGS asset pack generator (Blender 5.2, headless).
Rebuild everything from scratch with one command (Git Bash):
  "/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup \
      --python world/assets/buildings/build_buildings.py
Options after `--`:
  --no-render        skip previews and contact sheet (build, bake, export, validate only)
  --only a,b,c       only render previews for these roots
  --no-sheet         skip the contact sheet / district renders
  --no-previews      skip per-asset previews
  --render-only      do not rebuild: re-import the existing buildings.glb and render
  --samples N        AO bake samples (default 96)
Outputs (next to this script): buildings.glb, previews/*.png, contact_sheet.png, MANIFEST.md,
and a copy of the GLB at world/src/models/buildings.glb.
"""
import bpy, bmesh, math, os, sys, json, struct, re, shutil, random, time
from math import pi, sin, cos, tan, atan2, acos, sqrt, radians
from mathutils import Vector, Matrix, Euler
T0 = time.time()
HERE = os.path.dirname(os.path.abspath(__file__))
WORLD = os.path.dirname(os.path.dirname(HERE))
PREV = os.path.join(HERE, 'previews')
os.makedirs(PREV, exist_ok=True)
GLB = os.path.join(HERE, 'buildings.glb')
COPY = os.path.join(WORLD, 'src', 'models', 'buildings.glb')
ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []

def flag(f):
    return f in ARGV

def argval(f, d=None):
    if f in ARGV:
        i = ARGV.index(f)
        if i + 1 < len(ARGV):
            return ARGV[i + 1]
    return d

def log(*a):
    print('[buildings %6.1fs]' % (time.time() - T0), *a, flush=True)

# --------------------------------------------------------------------------------------------
# Palette (ASSETS.md). Names are the contract; hex only drives previews.
# --------------------------------------------------------------------------------------------
PAL = {
    'pal_grass': '74C391', 'pal_grass_light': '9ED6A8', 'pal_grass_deep': '2E9B78', 'pal_leaf_dark': '1F7A60',
    'pal_coral': 'F28C6F', 'pal_coral_deep': 'DC6B52', 'pal_peach': 'F7B79F', 'pal_cream': 'F3EDE6',
    'pal_stone': 'E3D8CF', 'pal_sand': 'F1DCC2', 'pal_wood': 'C98C62', 'pal_wood_dark': '8E5B3D',
    'pal_pink': 'ECBDB7', 'pal_sky': 'A9D6E5', 'pal_water': '79BFC9', 'pal_yellow': 'F6CF6B',
    'pal_navy': '2C3567', 'pal_ink': '2B2A31', 'pal_white': 'FFFFFF', 'pal_tan': 'C9955E',
    'pal_fur': 'EDE3D3', 'pal_skin': 'E9B48F', 'pal_glass': 'BFE3EE', 'pal_emissive': 'FFE6A3',
}

def lin(h):
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(out)

def principled(m):
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    b = nt.nodes.get('Principled BSDF')
    if b is None:
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        b = nt.nodes.new('ShaderNodeBsdfPrincipled')
        o = nt.nodes.new('ShaderNodeOutputMaterial')
        nt.links.new(b.outputs[0], o.inputs[0])
    return nt, b

def setup_material(m, name, ao_attr=None):
    nt, b = principled(m)
    col = lin(PAL[name])
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Metallic'].default_value = 0.0
    b.inputs['Roughness'].default_value = 0.15 if name == 'pal_glass' else (0.6 if name == 'pal_water' else 0.92)
    try:
        b.inputs['Specular IOR Level'].default_value = 0.5 if name == 'pal_glass' else 0.25
    except Exception:
        pass
    if name == 'pal_emissive':
        b.inputs['Emission Color'].default_value = (*col, 1)
        b.inputs['Emission Strength'].default_value = 1.0
    if ao_attr:
        attr = nt.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = ao_attr
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        mix.inputs[6].default_value = (*col, 1)
        nt.links.new(attr.outputs['Color'], mix.inputs[7])
        nt.links.new(mix.outputs[2], b.inputs['Base Color'])
        if name == 'pal_emissive':
            b.inputs['Emission Strength'].default_value = 6.0
    m.diffuse_color = (*col, 1)

M = {}

def make_palette():
    M.clear()
    for name in PAL:
        m = bpy.data.materials.new(name)
        setup_material(m, name)
        M[name] = m

# --------------------------------------------------------------------------------------------
# Geometry kit
# --------------------------------------------------------------------------------------------
PARTS = None      # current asset: list of body part objects
SPECIALS = None   # current asset: list of (name, [objs], pivot)
EMPTIES = None    # current asset: list of empties
XF = [Matrix.Identity(4)]

def TR(loc=(0, 0, 0), rot=(0, 0, 0), scale=None):
    m = Matrix.Translation(Vector(loc)) @ Euler(rot, 'XYZ').to_matrix().to_4x4()
    if scale is not None:
        m = m @ Matrix.Diagonal((*scale, 1.0))
    return m

class frame:
    """Local coordinate frame for a group of parts (translation + rotation)."""
    def __init__(self, loc=(0, 0, 0), rot=(0, 0, 0)):
        self.m = TR(loc, rot)
    def __enter__(self):
        XF.append(XF[-1] @ self.m)
        return self
    def __exit__(self, *a):
        XF.pop()

def wp(p):
    """Local point -> world point in the current frame."""
    return tuple(XF[-1] @ Vector(p))

def _link(ob):
    bpy.context.scene.collection.objects.link(ob)

def _finish(bm, mat, M4=None, bev=0.0, segs=3, angle=30, sharp=50, name='part', wn=True, reg=True, mfn=None):
    m = XF[-1] @ (M4 if M4 is not None else Matrix.Identity(4))
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    bm.normal_update()
    mats = [mat] if isinstance(mat, str) else list(mat)
    if mfn is not None:
        for f in bm.faces:
            f.material_index = mfn(f)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    _link(ob)
    for mm in mats:
        me.materials.append(M[mm])
    for p in me.polygons:
        p.use_smooth = True
    if sharp and bev <= 0:
        try:
            me.set_sharp_from_angle(angle=radians(sharp))
        except Exception:
            pass
    if bev > 0:
        b = ob.modifiers.new('bev', 'BEVEL')
        b.width = bev
        b.segments = segs
        b.limit_method = 'ANGLE'
        b.angle_limit = radians(angle)
        b.harden_normals = False
        b.use_clamp_overlap = True
    if wn:
        w = ob.modifiers.new('wn', 'WEIGHTED_NORMAL')
        w.keep_sharp = True
        w.weight = 50
    if reg and PARTS is not None:
        PARTS.append(ob)
    return ob

def box(size, c=(0, 0, 0), mat='pal_cream', r=0.05, segs=3, rot=(0, 0, 0), **kw):
    sx, sy, sz = size
    mn = min(size)
    segs = min(segs, 3 if mn >= 0.9 else (2 if mn >= 0.14 else 1))
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    r = min(r, 0.48 * min(size))
    return _finish(bm, mat, TR(c, rot), bev=r, segs=segs, **kw)

def cyl(r, h, c=(0, 0, 0), mat='pal_cream', bev=0.03, n=None, r2=None, rot=(0, 0, 0), center=False, segs=3, **kw):
    """Cylinder/cone along local Z. c = base centre (or centre if center=True)."""
    rr = max(r, r2 or 0)
    if n is None:
        n = 32 if rr > 0.6 else (24 if rr > 0.3 else (18 if rr > 0.15 else (12 if rr > 0.06 else 8)))
    mn = min(rr, h)
    segs = min(segs, 3 if mn >= 0.5 else (2 if mn >= 0.16 else 1))
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=n, radius1=r,
                          radius2=(r if r2 is None else r2), depth=h)
    if not center:
        bmesh.ops.translate(bm, vec=(0, 0, h / 2), verts=bm.verts)
    bev = min(bev, 0.45 * h, 0.45 * min(r, r if r2 is None else max(r2, 0.001) + 1e9))
    return _finish(bm, mat, TR(c, rot), bev=bev, segs=segs, **kw)

def sphere(r, c=(0, 0, 0), mat='pal_cream', scale=(1, 1, 1), u=None, v=None, rot=(0, 0, 0), **kw):
    au = 24 if r > 0.5 else (16 if r > 0.15 else (10 if r > 0.07 else 8))
    u = au if u is None else min(u, au)
    av = max(6, (au * 2) // 3)
    v = av if v is None else min(v, av)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    return _finish(bm, mat, TR(c, rot, scale), bev=0, sharp=0, **kw)

def torus(R, r, c=(0, 0, 0), mat='pal_coral', rot=(0, 0, 0), n=None, m=10, arc=None, **kw):
    """Torus in local XY plane around Z. arc=(a0,a1) radians for a partial ring (capped)."""
    if n is None:
        n = 32 if R > 0.5 else (20 if R > 0.2 else 14)
    m = min(m, 8 if r >= 0.05 else 6)
    bm = bmesh.new()
    full = arc is None
    a0, a1 = (0, 2 * pi) if full else arc
    rings = n if full else n + 1
    grid = []
    for i in range(rings):
        a = a0 + (a1 - a0) * i / (n if not full else n)
        row = []
        for j in range(m):
            b = 2 * pi * j / m
            rr = R + r * cos(b)
            row.append(bm.verts.new((rr * cos(a), rr * sin(a), r * sin(b))))
        grid.append(row)
    for i in range(rings if full else rings - 1):
        i2 = (i + 1) % rings
        for j in range(m):
            j2 = (j + 1) % m
            bm.faces.new((grid[i][j], grid[i2][j], grid[i2][j2], grid[i][j2]))
    if not full:
        bm.faces.new(list(reversed(grid[0])))
        bm.faces.new(grid[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(bm, mat, TR(c, rot), bev=0, sharp=0, **kw)

def fillet(pts, r, seg=6, closed=True):
    n = len(pts)
    rs = list(r) if isinstance(r, (list, tuple)) else [r] * n
    out = []
    for i in range(n):
        p1 = Vector(pts[i])
        if (not closed and (i == 0 or i == n - 1)) or rs[i] <= 0:
            out.append((p1.x, p1.y))
            continue
        p0 = Vector(pts[i - 1])
        p2 = Vector(pts[(i + 1) % n])
        d1 = p0 - p1
        l1 = d1.length
        d2 = p2 - p1
        l2 = d2.length
        if l1 < 1e-6 or l2 < 1e-6:
            out.append((p1.x, p1.y))
            continue
        d1.normalize()
        d2.normalize()
        ang = acos(max(-1.0, min(1.0, d1.dot(d2))))
        if ang < 1e-3 or ang > pi - 1e-3:
            out.append((p1.x, p1.y))
            continue
        t = rs[i] / tan(ang / 2)
        t = min(t, 0.49 * l1, 0.49 * l2)
        rr = t * tan(ang / 2)
        A = p1 + d1 * t
        B = p1 + d2 * t
        bis = (d1 + d2).normalized()
        cc = p1 + bis * (rr / sin(ang / 2))
        a0 = atan2(A.y - cc.y, A.x - cc.x)
        a1 = atan2(B.y - cc.y, B.x - cc.x)
        da = a1 - a0
        while da > pi:
            da -= 2 * pi
        while da < -pi:
            da += 2 * pi
        for k in range(seg + 1):
            a = a0 + da * k / seg
            out.append((cc.x + rr * cos(a), cc.y + rr * sin(a)))
    # dedupe
    ded = []
    for p in out:
        if not ded or (Vector(p) - Vector(ded[-1])).length > 1e-5:
            ded.append(p)
    if closed and len(ded) > 2 and (Vector(ded[0]) - Vector(ded[-1])).length < 1e-5:
        ded.pop()
    return ded

def prism(poly, depth, plane='XZ', off=0.0, mat='pal_cream', bev=0.04, segs=2, c=(0, 0, 0), rot=(0, 0, 0), **kw):
    """Extrude a 2D polygon. plane XZ: (u,v)->(x,z), extruded along Y over [off-d/2, off+d/2].
    YZ: (u,v)->(y,z) along X. XY: (u,v)->(x,y) along Z."""
    bm = bmesh.new()
    vs = []
    for (u, v) in poly:
        if plane == 'XZ':
            co = (u, off - depth / 2, v)
        elif plane == 'YZ':
            co = (off - depth / 2, u, v)
        else:
            co = (u, v, off - depth / 2)
        vs.append(bm.verts.new(co))
    f = bm.faces.new(vs)
    ax = {'XZ': (0, depth, 0), 'YZ': (depth, 0, 0), 'XY': (0, 0, depth)}[plane]
    res = bmesh.ops.extrude_face_region(bm, geom=[f])
    ev = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=ax, verts=ev)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(bm, mat, TR(c, rot), bev=bev, segs=segs, **kw)

def revolve(profile, mat='pal_cream', steps=28, c=(0, 0, 0), rot=(0, 0, 0), mfn=None, sharp=50, **kw):
    """Revolve an open profile [(r,z),...] (first/last usually on the axis) around local Z."""
    bm = bmesh.new()
    vs = [bm.verts.new((max(r, 0.0), 0, z)) for r, z in profile]
    es = [bm.edges.new((vs[i], vs[i + 1])) for i in range(len(vs) - 1)]
    bmesh.ops.spin(bm, geom=vs + es, cent=(0, 0, 0), axis=(0, 0, 1), angle=2 * pi, steps=steps, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    # drop degenerate faces left at the axis
    bad = [f for f in bm.faces if f.calc_area() < 1e-9]
    if bad:
        bmesh.ops.delete(bm, geom=bad, context='FACES_ONLY')
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(bm, mat, TR(c, rot), bev=0, mfn=mfn, sharp=sharp, **kw)

def quad(name, w, h, c, rot=(0, 0, 0), mat='pal_white'):
    """Flat quad facing local -Y with UVs 0..1 (u right, v up as seen from the front)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new(p) for p in [(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)]]
    f = bm.faces.new(vs)
    for loop, (u, v) in zip(f.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]):
        loop[uv].uv = (u, v)
    ob = _finish(bm, mat, TR(c, rot), bev=0, sharp=0, wn=False, reg=False, name=name)
    SPECIALS.append((name, [ob], wp(c)))
    return ob

def _curve_to_mesh(cob, mat, name, sharp=40):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(cob.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
    data = cob.data
    bpy.data.objects.remove(cob)
    try:
        if isinstance(data, bpy.types.TextCurve) or isinstance(data, bpy.types.Curve):
            bpy.data.curves.remove(data)
    except Exception:
        pass
    me.transform(XF[-1])
    me.materials.clear()
    me.materials.append(M[mat])
    for p in me.polygons:
        p.use_smooth = True
        p.material_index = 0
    try:
        me.set_sharp_from_angle(angle=radians(sharp))
    except Exception:
        pass
    ob = bpy.data.objects.new(name, me)
    _link(ob)
    w = ob.modifiers.new('wn', 'WEIGHTED_NORMAL')
    w.keep_sharp = True
    w.weight = 50
    if PARTS is not None:
        PARTS.append(ob)
    return ob

def tube(pts, r, mat='pal_ink', kind='BEZIER', res=4, bres=1, name='tube'):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = bres
    cu.use_fill_caps = True
    cu.resolution_u = res
    if kind == 'BEZIER':
        sp = cu.splines.new('BEZIER')
        sp.bezier_points.add(len(pts) - 1)
        for bp, p in zip(sp.bezier_points, pts):
            bp.co = p
            bp.handle_left_type = 'AUTO'
            bp.handle_right_type = 'AUTO'
    else:
        sp = cu.splines.new('POLY')
        sp.points.add(len(pts) - 1)
        for pt, p in zip(sp.points, pts):
            pt.co = (*p, 1)
    ob = bpy.data.objects.new(name, cu)
    _link(ob)
    return _curve_to_mesh(ob, mat, name, sharp=60)

FONT_PATHS = ['C:/Windows/Fonts/seguibl.ttf', 'C:/Windows/Fonts/arialbd.ttf']

def text_mesh(s, height, depth, bevel, mat, c=(0, 0, 0), spacing=1.0):
    cu = bpy.data.curves.new('txt', 'FONT')
    cu.body = s
    for fp in FONT_PATHS:
        if os.path.exists(fp):
            try:
                cu.font = bpy.data.fonts.load(fp, check_existing=True)
                break
            except Exception:
                pass
    cu.size = 1.0
    cu.extrude = depth / 2 - bevel
    cu.bevel_depth = bevel
    cu.bevel_resolution = 2
    cu.resolution_u = 4
    cu.align_x = 'CENTER'
    cu.space_character = spacing
    ob = bpy.data.objects.new('txt', cu)
    _link(ob)
    XF.append(Matrix.Identity(4))
    me_ob = _curve_to_mesh(ob, mat, 'txt', sharp=60)
    XF.pop()
    me = me_ob.data
    me.transform(Matrix.Rotation(pi / 2, 4, 'X'))  # stand up, front -> -Y
    xs = [v.co.x for v in me.vertices]
    zs = [v.co.z for v in me.vertices]
    ys = [v.co.y for v in me.vertices]
    s_ = height / (max(zs) - min(zs))
    me.transform(Matrix.Translation((-(max(xs) + min(xs)) / 2, -(max(ys) + min(ys)) / 2, -min(zs))))
    me.transform(Matrix.Diagonal((s_, 1.0, s_, 1.0)))
    me.transform(XF[-1] @ Matrix.Translation(c))
    return me_ob

def special(name, objs, pivot):
    for o in objs:
        if o in PARTS:
            PARTS.remove(o)
    SPECIALS.append((name, objs, wp(pivot)))

def marker(name, loc, rotz=0.0):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = 'SINGLE_ARROW' if name in ('seat', 'use') else 'PLAIN_AXES'
    e.empty_display_size = 0.3
    e.location = wp(loc)
    e.rotation_euler = (0, 0, rotz)
    _link(e)
    EMPTIES.append(e)
    return e

class collect:
    """Capture parts created inside the block (to turn them into a special child)."""
    def __enter__(self):
        self.start = len(PARTS)
        self.objs = []
        return self
    def __exit__(self, *a):
        self.objs = PARTS[self.start:]

# ---------------------------------------------------------------- composite helpers
def arch_profile(w, z0, zs, rise, n=24):
    pts = [(-w / 2, z0), (w / 2, z0)]
    for i in range(n + 1):
        t = pi * i / n
        pts.append((w / 2 * cos(t), zs + rise * sin(t)))
    return pts

def arch_band(a_out, b_out, a_in, b_in, zc, t0, t1, n=28):
    o = [(a_out * cos(t0 + (t1 - t0) * i / n), zc + b_out * sin(t0 + (t1 - t0) * i / n)) for i in range(n + 1)]
    inn = [(a_in * cos(t1 - (t1 - t0) * i / n), zc + b_in * sin(t1 - (t1 - t0) * i / n)) for i in range(n + 1)]
    return o + inn

def chevron(half, ze, za, t):
    s = (za - ze) / half
    k = t * sqrt(1 + s * s)
    zi = za - k
    yi = (za - k - ze) / s
    return [(-half, ze), (0, za), (half, ze), (yi, ze), (0, zi), (-yi, ze)], s, k

def gable_roof(half, ze, za, t, length, plane, mat, off=0.0, apex_r=0.28):
    poly, s, k = chevron(half, ze, za, t)
    poly = fillet(poly, [0.05, apex_r, 0.05, 0.03, apex_r * 0.4, 0.03], seg=5)
    return prism(poly, length, plane, off=off, mat=mat, bev=0.06, segs=3)

def house_profile(hw, z0, zw, za):
    return [(-hw, z0), (hw, z0), (hw, zw), (0, za), (-hw, zw)]

def u_frame(wo, ho, wi, hi, ro, ri, seg=10):
    pts = [(wo / 2, 0), (wo / 2, ho), (-wo / 2, ho), (-wo / 2, 0), (-wi / 2, 0), (-wi / 2, hi), (wi / 2, hi), (wi / 2, 0)]
    return fillet(pts, [0, ro, ro, 0, 0, ri, ri, 0], seg=seg)

def door_slab(w, h, mat='pal_wood', t=0.08, arch=True, knob_side=1):
    """Local: wall plane y=0, outward -Y, bottom centre at origin. Hinge at x=-w/2*knob_side."""
    r = w / 2 * 0.98 if arch else 0.06
    poly = fillet([(-w / 2, 0), (w / 2, 0), (w / 2, h), (-w / 2, h)], [0, 0, r, r], seg=10)
    objs = [prism(poly, t, 'XZ', off=-t / 2, mat=mat, bev=0.025, segs=2)]
    # two plank grooves (raised battens)
    for x in (-w / 6, w / 6):
        objs.append(box((0.035, 0.02, h * 0.62), (x, -t - 0.004, h * 0.40), 'pal_wood_dark', r=0.012, segs=2))
    objs.append(sphere(0.05, (knob_side * (w / 2 - 0.12), -t - 0.035, h * 0.47), 'pal_yellow', u=16, v=10))
    return objs

def window_rect(w, h, frame_mat='pal_wood', glass='pal_glass', cross=True, sill=True, depth=0.1):
    """Local: wall plane y=0, outward -Y, centred on origin."""
    box((w, 0.06, h), (0, -0.0, 0), glass, r=0.02, segs=1)
    fb = 0.08
    box((w + 2 * fb, depth, fb), (0, -depth / 2 + 0.02, h / 2 + fb / 2 - 0.01), frame_mat, r=0.03, segs=2)
    box((w + 2 * fb, depth, fb), (0, -depth / 2 + 0.02, -h / 2 - fb / 2 + 0.01), frame_mat, r=0.03, segs=2)
    box((fb, depth, h), (w / 2 + fb / 2 - 0.01, -depth / 2 + 0.02, 0), frame_mat, r=0.03, segs=2)
    box((fb, depth, h), (-w / 2 - fb / 2 + 0.01, -depth / 2 + 0.02, 0), frame_mat, r=0.03, segs=2)
    if cross:
        box((0.05, 0.05, h), (0, -0.04, 0), frame_mat, r=0.018, segs=2)
        box((w, 0.05, 0.05), (0, -0.04, 0), frame_mat, r=0.018, segs=2)
    if sill:
        box((w + 0.3, 0.16, 0.07), (0, -0.07, -h / 2 - 0.09), 'pal_cream' if frame_mat != 'pal_cream' else 'pal_stone', r=0.03, segs=2)

def window_round(r, frame_mat='pal_coral', glass='pal_glass', cross=True):
    """Local: wall plane y=0, outward -Y, centred."""
    cyl(r - 0.02, 0.08, (0, 0.0, 0), glass, bev=0.015, rot=(pi / 2, 0, 0), center=True, segs=1)
    torus(r, 0.065, (0, -0.045, 0), frame_mat, rot=(pi / 2, 0, 0), m=6)
    if cross:
        box((0.045, 0.04, 2 * r - 0.04), (0, -0.05, 0), frame_mat, r=0.015, segs=2)
        box((2 * r - 0.04, 0.04, 0.045), (0, -0.05, 0), frame_mat, r=0.015, segs=2)

def bush(c, r=0.25, mat='pal_grass', n=3, seed=1, flowers=None):
    rnd = random.Random(seed)
    for i in range(n):
        a = 2 * pi * i / n + rnd.random()
        rr = r * (0.75 + 0.3 * rnd.random())
        sphere(rr, (c[0] + cos(a) * r * 0.55, c[1] + sin(a) * r * 0.45, c[2] + rr * 0.85), mat, scale=(1, 1, 0.9), u=12, v=8)
    sphere(r * 0.9, (c[0], c[1], c[2] + r * 1.25), mat, u=12, v=8)
    if flowers:
        for i in range(4):
            a = 2 * pi * i / 4 + 0.6
            sphere(0.05, (c[0] + cos(a) * r * 0.85, c[1] + sin(a) * r * 0.8 - 0.05, c[2] + r * (1.0 + 0.4 * rnd.random())), flowers, u=12, v=8)

def crate(c, size=(0.5, 0.36, 0.28), fruit=None, rot=(0, 0, 0), seed=0, fr=0.085):
    w, d, h = size
    with frame(c, rot):
        box((w, d, h), (0, 0, h / 2), 'pal_wood', r=0.035, segs=1)
        for z in (h * 0.33, h * 0.66):
            box((w + 0.012, d + 0.012, 0.03), (0, 0, z), 'pal_wood_dark', r=0.012, segs=2)
        box((w - 0.08, d - 0.08, 0.04), (0, 0, h - 0.01), 'pal_wood_dark', r=0.015, segs=2)
        if fruit:
            rnd = random.Random(seed)
            nx = max(1, int((w - 0.06) / (2 * fr)))
            ny = max(1, int((d - 0.06) / (2 * fr)))
            for i in range(nx):
                for j in range(ny):
                    x = -(nx - 1) * fr + i * 2 * fr
                    y = -(ny - 1) * fr + j * 2 * fr
                    m = fruit[(i + j + rnd.randint(0, 3)) % len(fruit)] if isinstance(fruit, list) else fruit
                    sphere(fr * (0.95 + 0.1 * rnd.random()), (x, y, h + fr * 0.55), m, u=8, v=5)

def stripes_panel(width, length, n, mats, t=0.07, scallop=True, scallop_r=None):
    """Striped awning panel in local frame: hinge line along X at origin, panel extends toward -Y
    in the XY plane (top surface at z=0). Scallops hang from the free edge."""
    sw = width / n
    for i in range(n):
        x = -width / 2 + sw * (i + 0.5)
        box((sw + 0.004, length, t), (x, -length / 2, -t / 2), mats[i % len(mats)], r=0.03, segs=1)
        if scallop:
            sr = scallop_r or sw * 0.5
            sphere(sr, (x, -length + 0.01, -t * 0.5), mats[i % len(mats)], scale=(1.0, 0.45, 0.85), u=12, v=7)

# --------------------------------------------------------------------------------------------
# Asset registry
# --------------------------------------------------------------------------------------------
ASSETS = []
NOTES = {}

def asset(name, note=''):
    def deco(fn):
        ASSETS.append((name, fn))
        NOTES[name] = note
        return fn
    return deco

# ============================================================================================ DETAIL KIT
# Scale: adult player 1.65 m. Doors >= 2.0 m, counters 0.95 m, desk 0.75 m, seats 0.46 m, railings 1.0 m.
FLOWERS = ['pal_coral', 'pal_yellow', 'pal_peach', 'pal_pink', 'pal_white']


def flower_box(w, c, rot=(0, 0, 0), seed=0):
    """Window flower box. Local: hangs on a wall plane y=0, outward -Y; c = top-centre of the box."""
    with frame(c, rot):
        box((w, 0.26, 0.22), (0, -0.15, -0.11), 'pal_wood', r=0.05)
        box((w + 0.04, 0.3, 0.05), (0, -0.15, -0.01), 'pal_wood_dark', r=0.02)
        n = max(2, int(w / 0.28))
        for i in range(n):
            x = -w / 2 + 0.1 + i * (w - 0.2) / (n - 1)
            sphere(0.11, (x, -0.15, 0.06), 'pal_grass' if i % 2 else 'pal_grass_deep', u=9, v=6)
            sphere(0.05, (x + 0.03, -0.25, 0.14 + 0.03 * (i % 2)), FLOWERS[(i + seed) % 5], u=6, v=5)


def potted(c, r=0.2, h=0.38, plant='pal_grass', pot='pal_coral_deep', kind='bush'):
    x, y, z = c
    cyl(r * 0.8, h, (x, y, z), pot, bev=0.04, r2=r, n=14, segs=1)
    cyl(r * 1.06, 0.07, (x, y, z + h - 0.05), pot, bev=0.03, n=14, segs=1)
    if kind == 'bush':
        sphere(r * 1.25, (x, y, z + h + r * 0.85), plant, u=14, v=9)
        sphere(r * 0.8, (x + r * 0.6, y - r * 0.3, z + h + r * 0.5), plant, u=10, v=7)
    elif kind == 'tall':
        cyl(0.03, r * 2.5, (x, y, z + h), 'pal_wood_dark', bev=0.0, n=8)
        for k, (dx, dy, dz, rr) in enumerate(((0, 0, 2.6, 1.0), (0.5, 0.1, 2.0, 0.75), (-0.5, -0.1, 1.9, 0.7))):
            sphere(r * rr, (x + dx * r, y + dy * r, z + h + dz * r), plant, u=14, v=9)
    elif kind == 'spiky':
        for k in range(7):
            a = k * 2 * pi / 7
            cyl(0.05, r * 2.2, (x + 0.05 * cos(a), y + 0.05 * sin(a), z + h - 0.05), 'pal_leaf_dark', bev=0.0, r2=0.004,
                rot=(0.45 * sin(a), -0.45 * cos(a), 0) if False else (-0.5 * sin(a) * 0 + 0.0, 0, 0), n=8)
        for k in range(6):
            a = k * 2 * pi / 6 + 0.3
            with frame((x, y, z + h - 0.03), (0, 0, a)):
                cyl(0.045, r * 1.8, (0, 0, 0), 'pal_leaf_dark', bev=0.0, r2=0.004, rot=(0, 0.55, 0), n=8)


def wall_lantern(c, rot=(0, 0, 0)):
    """Local: wall plane y=0, outward -Y. c = bracket point."""
    with frame(c, rot):
        box((0.12, 0.06, 0.2), (0, -0.03, 0), 'pal_ink', r=0.025)
        tube([(0, -0.05, 0.05), (0, -0.2, 0.12), (0, -0.28, 0.06)], 0.016, 'pal_ink')
        cyl(0.1, 0.06, (0, -0.28, 0.0), 'pal_ink', bev=0.02, r2=0.035, n=8, segs=1)
        cyl(0.075, 0.15, (0, -0.28, -0.15), 'pal_emissive', bev=0.03, n=8, segs=2)
        cyl(0.06, 0.03, (0, -0.28, -0.18), 'pal_ink', bev=0.01, n=8, segs=1)


def hanging_lantern(c, chain=0.3):
    x, y, z = c
    cyl(0.012, chain, (x, y, z - chain), 'pal_ink', bev=0.0, n=8)
    cyl(0.1, 0.06, (x, y, z - chain - 0.02), 'pal_ink', bev=0.02, r2=0.04)
    sphere(0.1, (x, y, z - chain - 0.12), 'pal_emissive', scale=(1, 1, 1.15), u=14, v=9)
    cyl(0.05, 0.03, (x, y, z - chain - 0.26), 'pal_ink', bev=0.01)


def drainpipe(x, y, z0, z1, mat='pal_stone', yaw=0.0):
    """Vertical downpipe at (x,y) from ground z0 to the eave z1, offset toward local -Y of yaw."""
    cyl(0.055, z1 - z0 - 0.25, (x, y, z0 + 0.15), mat, bev=0.0, n=10)
    with frame((x, y, z0), (0, 0, yaw)):
        cyl(0.055, 0.22, (0, 0, 0.17), mat, bev=0.0, n=10, rot=(radians(-35), 0, 0))
        cyl(0.075, 0.1, (0, -0.1, 0.02), mat, bev=0.02, n=10, segs=1, rot=(radians(-80), 0, 0))
    cyl(0.09, 0.14, (x, y, z1 - 0.12), mat, bev=0.02, r2=0.06, n=10, segs=1, rot=(pi, 0, 0))
    for zz in (z0 + 0.6, (z0 + z1) / 2 + 0.3):
        torus(0.07, 0.018, (x, y, zz), mat, n=10, m=4)


def vent(c, mat='pal_stone'):
    x, y, z = c
    box((0.36, 0.36, 0.34), (x, y, z + 0.17), mat, r=0.06)
    box((0.48, 0.48, 0.07), (x, y, z + 0.42), mat, r=0.03)
    for k in range(3):
        box((0.26, 0.02, 0.03), (x, y - 0.185, z + 0.08 + k * 0.08), 'pal_ink', r=0.01, segs=1)


def turbine_vent(c):
    x, y, z = c
    cyl(0.12, 0.2, (x, y, z), 'pal_stone', bev=0.03, n=16)
    sphere(0.2, (x, y, z + 0.32), 'pal_cream', scale=(1, 1, 0.85), u=16, v=10)
    for k in range(6):
        a = k * pi / 3
        box((0.03, 0.06, 0.26), (x + 0.19 * cos(a), y + 0.19 * sin(a), z + 0.3), 'pal_stone', r=0.01, rot=(0, 0, a), segs=1)
    sphere(0.04, (x, y, z + 0.52), 'pal_coral', u=10, v=7)


def water_tank(c, r=0.45, h=0.75, mat='pal_sky'):
    x, y, z = c
    for a in (0.785, 2.356, 3.927, 5.498):
        cyl(0.035, 0.35, (x + r * 0.7 * cos(a), y + r * 0.7 * sin(a), z), 'pal_stone', bev=0.01, n=8)
    box((r * 1.8, r * 1.8, 0.06), (x, y, z + 0.37), 'pal_stone', r=0.03)
    cyl(r, h, (x, y, z + 0.4), mat, bev=0.06)
    for k in (0.3, 0.62):
        torus(r + 0.01, 0.02, (x, y, z + 0.4 + h * k), mat, m=6)
    revolve([(0, z + 0.4 + h + 0.22), (r * 0.5, z + 0.4 + h + 0.17), (r * 0.95, z + 0.4 + h + 0.02), (r * 0.95, z + 0.4 + h - 0.02), (0, z + 0.4 + h - 0.02)],
            'pal_cream', steps=28, c=(x, y, 0), sharp=70)
    cyl(0.08, 0.06, (x, y, z + 0.4 + h + 0.2), 'pal_cream', bev=0.02)


def solar_panel(c, rotz=0.0, w=1.1, d=0.65, tilt=25, legs=True):
    with frame(c, (0, 0, rotz)):
        if legs:
            for x in (-w / 2 + 0.1, w / 2 - 0.1):
                cyl(0.025, 0.12, (x, -d * 0.35, 0), 'pal_stone', bev=0.0, n=8)
                cyl(0.025, 0.12 + d * sin(radians(tilt)) * 0.7, (x, d * 0.35, 0), 'pal_stone', bev=0.0, n=8)
        with frame((0, 0, 0.12 + d * sin(radians(tilt)) / 2), (radians(tilt), 0, 0)):
            box((w, d, 0.05), (0, 0, 0), 'pal_cream', r=0.02, segs=1)
            box((w - 0.07, d - 0.07, 0.02), (0, 0, 0.026), 'pal_navy', r=0.008, segs=1)
            for k in range(1, 4):
                box((0.012, d - 0.08, 0.012), (-w / 2 + k * w / 4, 0, 0.04), 'pal_sky', r=0.004, segs=1)
            box((w - 0.08, 0.012, 0.012), (0, 0, 0.04), 'pal_sky', r=0.004, segs=1)


def bench(c, rotz=0.0, L=1.4, back=True, mat='pal_wood', leg='pal_cream'):
    """Seat height 0.46. Local front -Y."""
    with frame(c, (0, 0, rotz)):
        for k in range(3):
            box((L, 0.13, 0.05), (0, -0.16 + k * 0.15, 0.44), mat, r=0.02, segs=1)
        for x in (-L / 2 + 0.12, L / 2 - 0.12):
            box((0.08, 0.42, 0.06), (x, 0.0, 0.39), leg, r=0.025, segs=2)
            box((0.08, 0.08, 0.38), (x, -0.14, 0.19), leg, r=0.03, segs=2)
            box((0.08, 0.08, 0.38 if not back else 0.86), (x, 0.17, 0.19 if not back else 0.43), leg, r=0.03, segs=2)
        if back:
            for k in range(2):
                box((L, 0.05, 0.12), (0, 0.21, 0.62 + k * 0.17), mat, r=0.02, segs=1)


def facade_bench(c, rotz=0.0, L=1.3):
    """Bench built into a facade (wall at local y=0, seat in front)."""
    with frame(c, (0, 0, rotz)):
        box((L + 0.16, 0.48, 0.1), (0, -0.25, 0.41), 'pal_cream', r=0.04)
        for x in (-L / 2, L / 2):
            box((0.16, 0.42, 0.4), (x, -0.22, 0.2), 'pal_cream', r=0.05)
        for k in range(3):
            box((L - 0.1, 0.13, 0.04), (0, -0.4 + k * 0.15, 0.48), 'pal_wood', r=0.018, segs=2)
        box((L - 0.06, 0.1, 0.32), (0, -0.04, 0.68), 'pal_wood', r=0.04)
        for k in range(2):
            sphere(0.13, (-L / 4 + k * L / 2, -0.15, 0.62), ['pal_coral', 'pal_sky'][k], scale=(1, 0.55, 0.8), u=14, v=9)


def rope_curve(p0, p1, sag, n=8):
    p0, p1 = Vector(p0), Vector(p1)
    pts = []
    for i in range(n + 1):
        t = i / n
        p = p0.lerp(p1, t)
        p.z -= sag * 4 * t * (1 - t)
        pts.append(p)
    return pts


def bunting(p0, p1, n=7, sag=0.3, mats=('pal_coral', 'pal_yellow', 'pal_grass_light', 'pal_sky', 'pal_pink'), size=0.2):
    pts = rope_curve(p0, p1, sag, 8)
    tube([tuple(p) for p in pts], 0.012, 'pal_cream', kind='POLY')
    d = Vector(p1) - Vector(p0)
    yaw = atan2(d.y, d.x)
    for i in range(n):
        t = (i + 0.5) / n
        p = Vector(p0).lerp(Vector(p1), t)
        p.z -= sag * 4 * t * (1 - t)
        with frame(tuple(p), (0, 0, yaw)):
            prism([(-size / 2, 0), (size / 2, 0), (0, -size * 1.2)], 0.025, 'XZ', mat=mats[i % len(mats)], bev=0.008, segs=1)


def string_lights(p0, p1, n=8, sag=0.25):
    pts = rope_curve(p0, p1, sag, 8)
    tube([tuple(p) for p in pts], 0.01, 'pal_ink', kind='POLY')
    for i in range(n):
        t = (i + 0.5) / n
        p = Vector(p0).lerp(Vector(p1), t)
        p.z -= sag * 4 * t * (1 - t) + 0.05
        sphere(0.045, tuple(p), 'pal_emissive', scale=(1, 1, 1.25), u=10, v=7)


def bicycle(c, rotz=0.0, mat='pal_coral', basket=False, lean=0.13):
    """Bicycle along local X, leaning toward local +Y by `lean` (against a wall)."""
    with frame(c, (0, 0, rotz)):
        with frame((0, 0, 0), (-lean, 0, 0)):
            for x in (-0.52, 0.52):
                torus(0.33, 0.035, (x, 0, 0.34), 'pal_ink', rot=(pi / 2, 0, 0), n=18, m=5)
                cyl(0.05, 0.08, (x, 0, 0.34), 'pal_cream', bev=0.01, rot=(pi / 2, 0, 0), center=True, n=10)
            for a, b in (((-0.52, 0.34), (-0.08, 0.36)), ((-0.08, 0.36), (0.38, 0.78)), ((-0.08, 0.36), (-0.2, 0.8)),
                         ((-0.2, 0.8), (0.38, 0.78)), ((-0.52, 0.34), (-0.2, 0.8)), ((0.38, 0.78), (0.52, 0.34))):
                tube([(a[0], 0, a[1]), (b[0], 0, b[1])], 0.025, mat, kind='POLY', bres=1, res=1)
            box((0.22, 0.1, 0.06), (-0.22, 0, 0.86), 'pal_ink', r=0.03, segs=1)
            tube([(0.38, 0, 0.78), (0.36, 0, 0.98)], 0.022, mat, kind='POLY', bres=1, res=1)
            tube([(0.36, -0.22, 0.98), (0.36, 0.22, 0.98)], 0.02, 'pal_ink', kind='POLY', bres=1, res=1)
            torus(0.07, 0.025, (-0.08, 0.03, 0.36), 'pal_ink', rot=(pi / 2, 0, 0), n=12, m=6)
            if basket:
                box((0.3, 0.32, 0.2), (0.6, 0, 0.92), 'pal_wood', r=0.04)
                box((0.24, 0.26, 0.04), (0.6, 0, 1.02), 'pal_white', r=0.015, segs=1)


def sack(c, r=0.26, mat='pal_sand', fill=None, badge=None, rotz=0.0, squash=1.0):
    x, y, z = c
    with frame(c, (0, 0, rotz)):
        if fill:  # open sack with produce on top
            revolve(fillet([(0, 0), (r * 0.9, 0), (r, r * 0.6), (r * 0.95, r * 1.25), (r * 1.02, r * 1.4), (r * 0.88, r * 1.42), (0, r * 1.3)],
                           [0, 0.05, r * 0.4, 0.03, 0.03, 0.02, 0], seg=2, closed=False), mat, steps=16, sharp=70)
            sphere(r * 0.88, (0, 0, r * 1.3), fill, scale=(1, 1, 0.3), u=16, v=8)
        else:
            sphere(r, (0, 0, r * 0.85 * squash), mat, scale=(1, 0.82, 1.15 * squash), u=12, v=8)
            cyl(r * 0.28, r * 0.35, (0, 0, r * 1.95 * squash), mat, bev=0.0, r2=r * 0.18, n=8)
            torus(r * 0.22, 0.02, (0, 0, r * 1.98 * squash), 'pal_wood_dark', n=8, m=4)
            if badge:
                box((r * 0.9, 0.03, r * 0.6), (0, -r * 0.8, r * 0.95 * squash), badge, r=0.02, segs=1, rot=(0.15, 0, 0))
                if badge == 'pal_white':
                    for s in (-1, 1):
                        box((r * 0.5, 0.02, 0.02), (s * r * 0.2, -r * 0.83, r * 1.05 * squash), 'pal_coral', r=0.006, rot=(0.15, s * 0.6, 0), segs=1)


def bollard(c, mat='pal_navy'):
    x, y, z = c
    cyl(0.14, 0.42, (x, y, z), mat, bev=0.04)
    sphere(0.15, (x, y, z + 0.44), mat, scale=(1, 1, 0.55), u=16, v=8)
    torus(0.15, 0.03, (x, y, z + 0.3), mat, n=16, m=6)


def coiled_rope(c, R=0.24):
    x, y, z = c
    for k in range(3):
        torus(R - k * 0.035, 0.04, (x, y, z + 0.04 + k * 0.07), 'pal_sand', n=16, m=5)
    tube([(x + R, y, z + 0.04), (x + R + 0.15, y - 0.15, z + 0.04), (x + R + 0.3, y - 0.1, z + 0.04)], 0.04, 'pal_sand')


def barrel(c, mat='pal_sky', r=0.28, h=0.75):
    x, y, z = c
    revolve(fillet([(0, 0), (r * 0.85, 0), (r, h * 0.5), (r * 0.85, h), (0, h)], [0, 0.03, r * 0.8, 0.03, 0], seg=4, closed=False),
            mat, steps=18, c=(x, y, z), sharp=70)
    for t in (0.18, 0.82):
        rr = r * 0.85 + (r - r * 0.85) * (1 - abs(t - 0.5) * 2) + 0.005
        torus(rr + 0.01, 0.022, (x, y, z + h * t), 'pal_wood_dark', n=18, m=4)


def parcel(c, s=(0.4, 0.3, 0.25), rotz=0.0):
    with frame(c, (0, 0, rotz)):
        box(s, (0, 0, s[2] / 2), 'pal_tan', r=0.03)
        box((s[0] + 0.01, 0.06, s[2] + 0.01), (0, 0, s[2] / 2), 'pal_stone', r=0.015, segs=1)


def steps_block(c, w, n=2, rise=0.12, run=0.3, mat='pal_stone'):
    """Steps descending toward local -Y from c (top front edge of the platform)."""
    x, y, z = c
    for i in range(n):
        h = z - rise * i
        box((w - i * 0.1, run * (i + 1), h), (x, y - run * (i + 1) / 2, h / 2), mat, r=0.045)


def shutters(w, h, mat='pal_grass_light'):
    """Local: wall plane y=0, outward -Y, centred on a window of size w x h."""
    for s in (-1, 1):
        box((w * 0.42, 0.06, h + 0.08), (s * (w / 2 + w * 0.21 + 0.1), -0.04, 0), mat, r=0.03)
        for k in range(3):
            box((w * 0.32, 0.02, 0.03), (s * (w / 2 + w * 0.21 + 0.1), -0.075, -h / 3 + k * h / 3), 'pal_cream', r=0.008, segs=1)


def window_full(w, h, frame_mat='pal_wood', glass='pal_glass', box_flowers=True, shut=None, seed=0, sill=True):
    window_rect(w, h, frame_mat, glass, cross=True, sill=sill)
    if shut:
        shutters(w, h, shut)
    if box_flowers:
        flower_box(w + 0.1, (0, -0.02, -h / 2 - 0.16), seed=seed)


def crate_stack(c, rotz=0.0, fruit=False):
    with frame(c, (0, 0, rotz)):
        crate((0, 0, 0), (0.6, 0.45, 0.42))
        crate((0.06, 0.02, 0.42), (0.52, 0.42, 0.38), rot=(0, 0, 0.15), fruit=['pal_coral', 'pal_yellow'] if fruit else None, seed=3)
        crate((0.62, 0.0, 0), (0.5, 0.45, 0.4), rot=(0, 0, -0.1))


# ============================================================================================ PAKISTAN KIT
# Faisalabad / Punjab street details in pastel clay: arches, jaali, truck-art trims, shop boards, tube lights,
# AC units, dishes, iron balconies, brick bases, bougainvillea, charpai, plastic chairs, rolling shutters.
def arch_top(w, hs, h, n=10, pointed=True):
    """Arch crown points from the right springing (w/2, hs) to the left (-w/2, hs)."""
    pts = []
    for i in range(n + 1):
        t = i / n
        x = w / 2 * cos(pi * t)
        u = min(1.0, abs(x) / (w / 2))
        if pointed:
            z = hs + (h - hs) * ((1 - u ** 1.5) ** 0.62)
        else:
            z = hs + (h - hs) * sqrt(max(0.0, 1 - u * u))
        pts.append((x, z))
    return pts


def arch_frame(wo, ho, wi, hi, so, si, pointed=True, n=12):
    outer = [(wo / 2, 0)] + arch_top(wo, so, ho, n, pointed) + [(-wo / 2, 0)]
    inner = [(-wi / 2, 0)] + list(reversed(arch_top(wi, si, hi, n, pointed))) + [(wi / 2, 0)]
    return outer + inner


def arch_hood(w, c, rot=(0, 0, 0), mat='pal_coral', pointed=True):
    """Decorative arch band sitting on top of an opening of width w. Local wall plane y=0, outward -Y; c = top centre of opening."""
    with frame(c, rot):
        rise = w * 0.42
        prism(arch_frame(w + 0.26, rise + 0.16, w + 0.02, rise, 0.0, 0.0, pointed, 10), 0.1, 'XZ', off=-0.05, mat=mat, bev=0.03, segs=1)
        sphere(0.05, (0, -0.1, rise + 0.2), 'pal_yellow', u=8, v=6)


def jaali(w, h, c, rot=(0, 0, 0), mat='pal_cream', back='pal_wood_dark', sp=0.2):
    """Lattice screen. Local wall plane y=0, outward -Y; c = centre."""
    with frame(c, rot):
        box((w, 0.04, h), (0, 0.0, 0), back, r=0.015, segs=1)
        fb = 0.07
        for s in (-1, 1):
            box((w + fb, 0.08, fb), (0, -0.04, s * (h / 2)), mat, r=0.025, segs=1)
            box((fb, 0.08, h + fb), (s * (w / 2), -0.04, 0), mat, r=0.025, segs=1)
        hw, hh = w / 2 - 0.02, h / 2 - 0.02
        for sgn in (1, -1):
            d = Vector((1, sgn)).normalized()
            nrm = Vector((-d.y, d.x))
            cmax = (hw + hh) / sqrt(2)
            k = -cmax + sp / 2
            while k < cmax:
                p0 = nrm * k
                t0, t1 = -1e9, 1e9
                for ax, lim in ((0, hw), (1, hh)):
                    if abs(d[ax]) < 1e-9:
                        continue
                    a = (-lim - p0[ax]) / d[ax]
                    b = (lim - p0[ax]) / d[ax]
                    t0 = max(t0, min(a, b))
                    t1 = min(t1, max(a, b))
                if t1 - t0 > 0.06:
                    m = p0 + d * ((t0 + t1) / 2)
                    box((t1 - t0, 0.035, 0.035), (m.x, -0.035, m.y), mat, r=0.012, rot=(0, -sgn * pi / 4, 0), segs=1)
                k += sp


def truck_trim(w, c, rot=(0, 0, 0), h=0.16, base='pal_yellow', cols=('pal_coral', 'pal_grass_deep', 'pal_sky', 'pal_coral_deep')):
    """Pastel truck-art band: border strip with chevrons and flower dots. Local plane y=0, outward -Y; c = centre."""
    with frame(c, rot):
        box((w, 0.04, h), (0, -0.02, 0), base, r=0.015, segs=1)
        n = max(2, min(10, int(w / 0.26)))
        step = w / n
        for i in range(n):
            x = -w / 2 + step * (i + 0.5)
            if i % 2 == 0:
                cw = step * 0.38
                prism([(-cw, h * 0.28), (0, -h * 0.25), (cw, h * 0.28), (cw * 0.55, h * 0.3), (0, 0.0), (-cw * 0.55, h * 0.3)], 0.02, 'XZ',
                      off=-0.05, c=(x, 0, 0), mat=cols[(i // 2) % len(cols)], bev=0.004, segs=1)
            else:
                sphere(h * 0.22, (x, -0.05, 0), 'pal_white', scale=(1, 0.5, 1), u=8, v=5)
                sphere(h * 0.1, (x, -0.07, 0), 'pal_pink', u=6, v=4)
        for s in (-1, 1):
            box((w, 0.02, 0.018), (0, -0.045, s * (h / 2 - 0.01)), 'pal_coral_deep', r=0.006, segs=1)


def tube_light(c, rot=(0, 0, 0), L=0.9):
    """Wall tube light. Local wall plane y=0, outward -Y."""
    with frame(c, rot):
        box((L + 0.06, 0.05, 0.06), (0, -0.025, 0.0), 'pal_white', r=0.02, segs=1)
        cyl(0.028, L, (0, -0.075, 0), 'pal_emissive', bev=0.0, n=8, rot=(0, pi / 2, 0), center=True)


def ac_unit(c, rot=(0, 0, 0)):
    """Split-AC outdoor unit on wall brackets. Local wall plane y=0, outward -Y; c = bottom centre at the wall."""
    with frame(c, rot):
        for x in (-0.28, 0.28):
            tube([(x, 0, -0.02), (x, -0.32, -0.02), (x, -0.04, -0.3)], 0.014, 'pal_ink', kind='POLY')
        box((0.78, 0.3, 0.55), (0, -0.18, 0.275), 'pal_cream', r=0.06)
        cyl(0.19, 0.02, (-0.12, -0.335, 0.28), 'pal_stone', bev=0.006, n=16, rot=(pi / 2, 0, 0), center=True, segs=1)
        torus(0.19, 0.02, (-0.12, -0.34, 0.28), 'pal_stone', rot=(pi / 2, 0, 0), n=16, m=4)
        box((0.04, 0.02, 0.36), (-0.12, -0.35, 0.28), 'pal_stone', r=0.01, segs=1)
        for k in range(4):
            box((0.16, 0.02, 0.025), (0.24, -0.335, 0.14 + k * 0.08), 'pal_stone', r=0.008, segs=1)
        tube([(0.36, -0.1, 0.4), (0.5, -0.05, 0.42), (0.5, -0.03, -0.4)], 0.016, 'pal_white')


def dish_antenna(c, rot=(0, 0, 0), s=1.0):
    """Wall/roof satellite dish facing local -Y and up. c = mount point (wall plane y=0)."""
    with frame(c, rot):
        box((0.1, 0.06, 0.1), (0, -0.03, 0), 'pal_stone', r=0.02, segs=1)
        tube([(0, -0.05, 0), (0, -0.3 * s, 0.05)], 0.015, 'pal_stone', kind='POLY')
        with frame((0, -0.3 * s, 0.1), (radians(-60), 0, 0)):
            revolve([(0, 0.0), (0.28 * s, 0.07 * s), (0.31 * s, 0.1 * s), (0.29 * s, 0.11 * s), (0, 0.04 * s)], 'pal_white', steps=18, sharp=70)
            tube([(0.25 * s, 0, 0.08 * s), (0, 0, 0.32 * s)], 0.008, 'pal_stone', kind='POLY')
            sphere(0.03 * s, (0, 0, 0.33 * s), 'pal_coral', u=8, v=5)


def iron_balcony(w, c, rot=(0, 0, 0), d=0.6):
    """Small wrought-iron balcony (rail 1.0 m). Local wall plane y=0, outward -Y; c = floor level centre at the wall."""
    with frame(c, rot):
        box((w + 0.1, d + 0.05, 0.12), (0, -d / 2, -0.06), 'pal_cream', r=0.04)
        for k in range(3):
            box((0.06, 0.06, 0.25), (-w / 2 + 0.15 + k * (w - 0.3) / 2, -d + 0.08, -0.22), 'pal_cream', r=0.02, segs=1, rot=(0.6, 0, 0))
        n = max(4, int(w / 0.14))
        for i in range(n + 1):
            x = -w / 2 + i * w / n
            cyl(0.012, 0.95, (x, -d + 0.03, 0.0), 'pal_ink', bev=0.0, n=6)
        for j in range(1, 4):
            cyl(0.012, 0.95, (-w / 2, -d + 0.03 + j * (d - 0.06) / 4 + 0.0, 0.0), 'pal_ink', bev=0.0, n=6)
            cyl(0.012, 0.95, (w / 2, -d + 0.03 + j * (d - 0.06) / 4, 0.0), 'pal_ink', bev=0.0, n=6)
        tube([(-w / 2, 0, 1.0), (-w / 2, -d + 0.03, 1.0), (w / 2, -d + 0.03, 1.0), (w / 2, 0, 1.0)], 0.022, 'pal_ink', kind='POLY')
        tube([(-w / 2, -d + 0.03, 0.12), (w / 2, -d + 0.03, 0.12)], 0.016, 'pal_ink', kind='POLY')
        for i in range(max(2, int(w / 0.4))):
            x = -w / 2 + (i + 0.5) * w / max(2, int(w / 0.4))
            torus(0.08, 0.012, (x, -d + 0.03, 0.56), 'pal_ink', rot=(pi / 2, 0, 0), n=12, m=4)


def brick_band(w, h, c, rot=(0, 0, 0), brick='pal_coral_deep', mortar='pal_peach'):
    """Raised brick-pattern base. Local wall plane y=0, outward -Y; c = bottom centre."""
    with frame(c, rot):
        box((w, 0.03, h), (0, -0.015, h / 2), mortar, r=0.01, segs=1)
        bw, bh = 0.42, 0.14
        rows = max(1, int(h / (bh + 0.03)))
        for r_ in range(rows):
            z = 0.03 + r_ * (bh + 0.03) + bh / 2
            off = 0 if r_ % 2 == 0 else bw / 2
            x = -w / 2 + 0.02 - off
            while x < w / 2 - 0.02:
                x0 = max(x, -w / 2 + 0.02)
                x1 = min(x + bw - 0.03, w / 2 - 0.02)
                if x1 - x0 > 0.08:
                    box((x1 - x0, 0.035, bh), ((x0 + x1) / 2, -0.045, z), brick, r=0.012, segs=1)
                x += bw


def bougainvillea(c, r=0.22):
    x, y, z = c
    cyl(r * 0.8, 0.42, (x, y, z), 'pal_coral_deep', bev=0.04, r2=r, n=14, segs=1)
    cyl(r * 1.06, 0.07, (x, y, z + 0.37), 'pal_coral_deep', bev=0.03, n=14, segs=1)
    sphere(r * 1.15, (x, y, z + 0.42 + r * 0.8), 'pal_grass_deep', u=12, v=8)
    rnd = random.Random(int((x + y) * 100))
    for k in range(7):
        a = k * 2 * pi / 7 + rnd.uniform(-0.2, 0.2)
        zz = z + 0.42 + r * (0.5 + 0.9 * rnd.random())
        rr = r * (0.75 + 0.35 * rnd.random())
        sphere(r * 0.42, (x + rr * cos(a), y + rr * sin(a), zz), 'pal_coral' if k % 3 else 'pal_pink', u=8, v=6)
    tube([(x + r * 0.6, y, z + 0.5), (x + r * 1.4, y - 0.1, z + 0.2), (x + r * 1.6, y - 0.15, z - 0.0)], 0.02, 'pal_grass_deep')
    sphere(r * 0.3, (x + r * 1.6, y - 0.15, z + 0.03), 'pal_coral', u=8, v=6)


def charpai(c, rotz=0.0):
    """Woven rope cot, 0.9 x 1.9 m, top at 0.45 m."""
    with frame(c, (0, 0, rotz)):
        for x in (-0.45, 0.45):
            box((0.08, 1.95, 0.09), (x, 0, 0.4), 'pal_wood', r=0.03, segs=1)
        for y in (-0.95, 0.95):
            box((0.98, 0.08, 0.09), (0, y, 0.4), 'pal_wood', r=0.03, segs=1)
        box((0.84, 1.84, 0.04), (0, 0, 0.42), 'pal_sand', r=0.015, segs=1)
        for k in range(5):
            box((0.84, 0.05, 0.02), (0, -0.74 + k * 0.37, 0.445), 'pal_coral', r=0.008, segs=1)
        for k in range(3):
            box((0.05, 1.84, 0.02), (-0.28 + k * 0.28, 0, 0.446), 'pal_sky', r=0.008, segs=1)
        for x in (-0.45, 0.45):
            for y in (-0.95, 0.95):
                revolve([(0, 0), (0.06, 0), (0.07, 0.12), (0.045, 0.22), (0.065, 0.33), (0.05, 0.44), (0, 0.44)], 'pal_wood_dark', steps=10,
                        c=(x, y, 0), sharp=80)


def plastic_chair(c, rotz=0.0, mat='pal_white'):
    """Moulded plastic chair, seat 0.46 m, facing local -Y."""
    with frame(c, (0, 0, rotz)):
        box((0.46, 0.44, 0.05), (0, 0, 0.44), mat, r=0.022, segs=1)
        with frame((0, 0.2, 0.46), (radians(-10), 0, 0)):
            box((0.44, 0.05, 0.42), (0, 0, 0.22), mat, r=0.03, segs=1)
            for k in range(3):
                box((0.07, 0.06, 0.24), (-0.12 + k * 0.12, 0, 0.18), 'pal_stone', r=0.02, segs=1)
        for x in (-0.2, 0.2):
            for y in (-0.18, 0.18):
                cyl(0.025, 0.44, (x, y, 0), mat, bev=0.0, r2=0.032, n=8, rot=(0.06 if y > 0 else -0.06, -0.06 if x < 0 else 0.06, 0))
        for s in (-1, 1):
            box((0.04, 0.4, 0.04), (s * 0.23, 0.0, 0.65), mat, r=0.015, segs=1)


def shop_board(w, h, c, rot=(0, 0, 0), base='pal_navy', border='pal_yellow', drop=0.3):
    """Hanging bilingual shop board: Urdu-style decorative strokes on the right, blocky 'English' bars on the left.
    Local: hangs from a wall bracket at c (wall plane y=0) and faces local -Y."""
    with frame(c, rot):
        tube([(0, 0.0, 0.0), (0, -0.25, 0.0), (0, -0.5, 0.0)], 0.022, 'pal_ink', kind='POLY')
        for x in (-w / 2 + 0.12, w / 2 - 0.12):
            cyl(0.008, drop, (x * 0.0, -0.38 + x * 0.0, -drop), 'pal_ink', bev=0.0, n=6) if False else None
        with frame((0, -0.38, -drop - h / 2), (0, 0, 0)):
            for x in (-w / 2 + 0.1, w / 2 - 0.1):
                cyl(0.008, drop, (x, 0, h / 2), 'pal_ink', bev=0.0, n=6)
            tube([(-w / 2 + 0.1, 0, h / 2 + drop), (w / 2 - 0.1, 0, h / 2 + drop)], 0.012, 'pal_ink', kind='POLY')
            box((w + 0.08, 0.06, h + 0.08), (0, 0.0, 0), border, r=0.035, segs=1)
            box((w, 0.07, h), (0, -0.012, 0), base, r=0.03, segs=1)
            # Urdu-style strokes (right half): flowing clay ribbons + dots, read right-to-left
            xs = w * 0.25
            tube([(xs + w * 0.2, -0.05, h * 0.12), (xs + w * 0.1, -0.05, -h * 0.12), (xs, -0.05, h * 0.05), (xs - w * 0.1, -0.05, -h * 0.15),
                  (xs - w * 0.18, -0.05, h * 0.0)], 0.018, 'pal_white')
            tube([(xs + w * 0.06, -0.05, h * 0.28), (xs + w * 0.02, -0.05, h * 0.05)], 0.016, 'pal_white', kind='POLY')
            tube([(xs - w * 0.04, -0.05, h * 0.25), (xs - w * 0.06, -0.05, h * 0.02)], 0.016, 'pal_white', kind='POLY')
            for dx, dz in ((0.12, -0.3), (-0.1, 0.33), (0.0, -0.32)):
                sphere(0.022, (xs + dx * w, -0.055, dz * h), 'pal_yellow', u=6, v=4)
            # 'English' as chunky block glyph bars (left half)
            x0 = -w * 0.44
            gw = w * 0.36 / 4
            for g in range(4):
                gx = x0 + g * gw + gw * 0.15
                box((0.03, 0.02, h * 0.42), (gx, -0.05, 0), 'pal_yellow', r=0.008, segs=1)
                box((gw * 0.55, 0.02, 0.03), (gx + gw * 0.25, -0.05, h * 0.19 * (1 if g % 2 else -1)), 'pal_yellow', r=0.008, segs=1)
                if g % 2 == 0:
                    box((gw * 0.45, 0.02, 0.03), (gx + gw * 0.22, -0.05, 0), 'pal_yellow', r=0.008, segs=1)


def rolling_shutter(w, h, open_frac, c, rot=(0, 0, 0), mat='pal_sky', as_special=None):
    """Rolling metal shutter in its frame. Local wall plane y=0, outward -Y; c = bottom centre of the opening.
    open_frac = fraction rolled up (0 = closed). If as_special, the slats become that special child (pivot at the top)."""
    with frame(c, rot):
        for s in (-1, 1):
            box((0.08, 0.12, h), (s * (w / 2 + 0.04), -0.06, h / 2), 'pal_stone', r=0.025, segs=1)
        box((w + 0.24, 0.3, 0.3), (0, -0.13, h + 0.15), 'pal_stone', r=0.08)
        box((w + 0.26, 0.04, 0.06), (0, -0.29, h + 0.02), 'pal_coral_deep', r=0.015, segs=1)
        down = h * (1 - open_frac)
        box((w, 0.04, h - down + 0.02), (0, 0.04, down + (h - down) / 2), 'pal_ink', r=0.01, segs=1)
        with collect() as cs:
            ns = max(2, int(down / 0.16))
            for k in range(ns):
                zz = h - (k + 0.5) * down / ns
                box((w - 0.02, 0.05, down / ns - 0.012), (0, -0.03, zz), mat if k % 2 == 0 else 'pal_cream', r=0.012, segs=1)
            if down > 0.2:
                box((w * 0.3, 0.06, 0.05), (0, -0.07, h - down + 0.12), 'pal_ink', r=0.02, segs=1)
                box((0.08, 0.05, 0.1), (w * 0.25, -0.08, h - down + 0.1), 'pal_yellow', r=0.02, segs=1)
        if as_special:
            special(as_special, cs.objs, (0, -0.03, h))



# ============================================================================================ HOME
@asset('home_hut', 'Studio hut, barrel roof (adult scale), painted sky-blue door 1.04 x 2.22 (hinge = left edge), brick base, AC unit, dish, bougainvillea.')
def a_home_hut():
    W, D = 3.6, 3.2
    zs, rise = 2.9, 1.05
    z0 = 0.25
    box((W + 0.6, D + 0.7, z0), (0, -0.1, z0 / 2), 'pal_stone', r=0.1)
    prism(arch_profile(W, z0, zs, rise, 22), D, 'XZ', mat='pal_cream', bev=0.08, segs=2)
    box((W + 0.04, D + 0.04, 0.4), (0, 0, z0 + 0.2), 'pal_pink', r=0.06)
    a_in, b_in = W / 2 + 0.04, rise + 0.04
    prism(arch_band(W / 2 + 0.34, rise + 0.34, a_in, b_in, zs, -0.17, pi + 0.17, 26), D + 0.55, 'XZ', mat='pal_coral_deep', bev=0.09, segs=2)
    for y in (-(D + 0.55) / 2 + 0.07, (D + 0.55) / 2 - 0.07):
        prism(arch_band(W / 2 + 0.41, rise + 0.41, W / 2 + 0.26, rise + 0.26, zs, -0.19, pi + 0.19, 24), 0.14, 'XZ',
              off=y, mat='pal_coral', bev=0.05, segs=1)
    cx = 0.85
    zr = zs + (rise + 0.34) * sqrt(max(0, 1 - (cx / (W / 2 + 0.34)) ** 2))
    box((0.42, 0.42, 0.9), (cx, 0.6, zr + 0.2), 'pal_pink', r=0.08)
    box((0.52, 0.52, 0.12), (cx, 0.6, zr + 0.66), 'pal_cream', r=0.05)
    cyl(0.1, 0.1, (cx, 0.6, zr + 0.72), 'pal_ink', bev=0.02)
    for k, (dx, dz, rr) in enumerate(((0.05, 0.95, 0.1), (0.15, 1.15, 0.13), (0.3, 1.38, 0.15))):
        sphere(rr, (cx + dx, 0.6, zr + dz), 'pal_white', u=12, v=8)
    zr2 = zs + (rise + 0.34) * sqrt(1 - (0.95 / (W / 2 + 0.34)) ** 2)
    dish_antenna((-0.95, -0.2, zr2 - 0.05), (radians(-25), 0, radians(30)), s=0.9)
    with frame((0, -D / 2, z0)):
        prism(u_frame(1.34, 2.44, 1.06, 2.28, 0.67, 0.53), 0.16, 'XZ', off=-0.04, mat='pal_coral', bev=0.04)
        d = door_slab(1.04, 2.24, 'pal_sky', t=0.08)
        special('door', d, (-0.52, 0, 0))
        with frame((0, 0, 3.05)):
            window_round(0.28, 'pal_coral')
        for x in (-0.95, 0.95):
            wall_lantern((x, 0, 2.05))
        box((1.1, 0.6, 0.03), (0, -0.4, 0.015), 'pal_coral', r=0.012, segs=1)
        for s in (-1, 1):
            brick_band(1.05, 0.55, (s * 1.22, -0.02, 0.0))
    bougainvillea((-1.25, -D / 2 - 0.35, z0), 0.22)
    bougainvillea((1.3, -D / 2 - 0.35, z0), 0.2)
    steps_block((0, -D / 2 - 0.45, z0), 1.6, n=2, rise=0.12, run=0.3)
    with frame((-W / 2, 0.15, 1.75), (0, 0, -pi / 2)):
        window_full(0.9, 0.95, 'pal_coral', shut='pal_grass_light', seed=1)
        arch_hood(0.9, (0, 0, 0.5), mat='pal_coral')
    with frame((-W / 2, 0.15, z0), (0, 0, -pi / 2)):
        bench((0, -0.55, 0), 0.0, L=1.3, back=False)
    with frame((W / 2, 0.6, 1.9), (0, 0, pi / 2)):
        window_round(0.36, 'pal_coral')
    with frame((W / 2, -0.75, 2.05), (0, 0, pi / 2)):
        ac_unit((0, 0, 0))
    bicycle((W / 2 + 0.28, 0.6, z0), rotz=pi / 2 + pi, mat='pal_sky', lean=0.12)
    drainpipe(W / 2 - 0.05, -D / 2 - 0.08, z0, zs + 0.05, 'pal_coral_deep')
    plastic_chair((-1.6, -D / 2 - 0.9, 0), rotz=0.5)


@asset('home_desk', 'Outdoor work desk (0.75 m) under a mint canopy. seat (hip height) faces the laptop (+Y); use behind the chair.')
def a_home_desk():
    zb = 0.08
    cyl(1.5, zb, (0, 0, 0), 'pal_stone', bev=0.035, n=48)
    for x in (-1.25, 1.25):
        cyl(0.075, 2.7, (x, 0.95, zb), 'pal_cream', bev=0.03)
        sphere(0.11, (x, 0.95, zb + 2.75), 'pal_cream', u=16, v=10)
    with frame((0, 1.1, zb + 2.65), (radians(9), 0, 0)):
        box((2.95, 2.25, 0.15), (0, -1.0, 0.05), 'pal_grass_light', r=0.07, segs=3)
        for i in range(9):
            x = -1.32 + i * (2.64 / 8)
            sphere(0.15, (x, -2.1, -0.01), 'pal_cream', scale=(1, 0.5, 0.75), u=16, v=10)
        string_lights((-1.4, -2.05, -0.12), (1.4, -2.05, -0.12), n=9, sag=0.18)
    with frame((0, 0.25, zb)):
        T = 0.75
        box((1.55, 0.78, 0.07), (0, 0, T - 0.035), 'pal_wood', r=0.035)
        for x in (-0.68, 0.68):
            for y in (-0.3, 0.3):
                box((0.07, 0.07, T - 0.07), (x, y, (T - 0.07) / 2), 'pal_cream', r=0.03, segs=2)
        box((0.4, 0.66, 0.3), (0.5, 0.0, T - 0.22), 'pal_cream', r=0.04)
        sphere(0.03, (0.5, -0.34, T - 0.2), 'pal_coral', u=10, v=7)
        top = T
        with frame((-0.1, -0.02, top)):
            box((0.44, 0.3, 0.03), (0, 0, 0.015), 'pal_stone', r=0.012, segs=2)
            box((0.38, 0.17, 0.006), (0, -0.04, 0.031), 'pal_cream', r=0.002, segs=1)
            with frame((0, 0.145, 0.03), (radians(-14), 0, 0)):
                box((0.44, 0.022, 0.29), (0, 0, 0.145), 'pal_stone', r=0.01, segs=2)
                box((0.41, 0.006, 0.265), (0, -0.012, 0.145), 'pal_ink', r=0.002, segs=1)
                quad('screen', 0.37, 0.23, (0, -0.0165, 0.148), mat='pal_white')
        with frame((0.38, -0.18, top)):
            cyl(0.055, 0.11, (0, 0, 0), 'pal_coral', bev=0.015)
            cyl(0.046, 0.01, (0, 0, 0.1), 'pal_wood_dark', bev=0.0)
            torus(0.035, 0.012, (0.06, 0, 0.055), 'pal_coral', rot=(pi / 2, 0, 0), m=6, n=12)
        with frame((-0.6, 0.2, top)):
            cyl(0.08, 0.03, (0, 0, 0), 'pal_yellow', bev=0.012)
            tube([(0, 0, 0.02), (0.02, 0.0, 0.32), (0.15, -0.02, 0.43)], 0.014, 'pal_cream')
            cyl(0.1, 0.11, (0.17, -0.03, 0.34), 'pal_yellow', bev=0.015, r2=0.04)
            sphere(0.045, (0.17, -0.03, 0.35), 'pal_emissive', u=10, v=7)
        with frame((0.55, 0.22, top)):
            cyl(0.06, 0.09, (0, 0, 0), 'pal_coral_deep', bev=0.015, r2=0.075)
            for k, (dx, dy, rr) in enumerate([(0, 0, 0.07), (0.04, 0.02, 0.05), (-0.04, 0.01, 0.055)]):
                sphere(rr, (dx, dy, 0.13 + k * 0.02), 'pal_grass', u=10, v=7)
        for i, (m, t) in enumerate((('pal_sky', 0.05), ('pal_coral', 0.04), ('pal_yellow', 0.045))):
            box((0.26, 0.19, t), (0.25, 0.24, top + 0.025 + i * 0.047), m, r=0.012, rot=(0, 0, 0.12 * i), segs=1)
        box((0.22, 0.16, 0.015), (-0.42, -0.2, top + 0.008), 'pal_white', r=0.005, rot=(0, 0, 0.2), segs=1)
        tube([(-0.5, -0.25, top + 0.02), (-0.36, -0.2, top + 0.02)], 0.008, 'pal_navy', kind='POLY', bres=1, res=1)
    # chair (seat 0.46)
    with frame((-0.1, -0.5, zb)):
        box((0.48, 0.45, 0.07), (0, 0, 0.42), 'pal_wood', r=0.03)
        box((0.44, 0.41, 0.05), (0, 0, 0.47), 'pal_coral', r=0.024, segs=2)
        for x in (-0.2, 0.2):
            for y in (-0.17, 0.17):
                cyl(0.028, 0.39, (x, y, 0), 'pal_cream', bev=0.01, n=10)
        box((0.48, 0.07, 0.4), (0, -0.21, 0.78), 'pal_coral', r=0.035)
        for x in (-0.2, 0.2):
            cyl(0.025, 0.36, (x, -0.21, 0.44), 'pal_cream', bev=0.01, n=10)
    marker('seat', (-0.1, -0.5, zb + 0.56), rotz=pi)
    marker('use', (-0.1, -1.1, zb), rotz=pi)
    potted((1.1, -0.75, zb), 0.2, 0.42, 'pal_grass', 'pal_coral', 'tall')
    cyl(0.14, 0.32, (-1.0, 0.3, zb), 'pal_stone', bev=0.03, r2=0.16)
    sphere(0.11, (-1.0, 0.3, zb + 0.33), 'pal_white', scale=(1, 1, 0.5), u=12, v=8)


@asset('portrait_board', 'Tall billboard stand. screen 2.4 x 3.0 m (portrait), UV 0..1, bottom at 1.2 m.')
def a_portrait_board():
    zc = 2.7
    for x in (-0.95, 0.95):
        box((0.26, 0.26, 4.55), (x, 0.14, 2.275), 'pal_cream', r=0.1)
        cyl(0.26, 0.18, (x, 0.14, 0), 'pal_stone', bev=0.06)
        bush((x, -0.25, 0), 0.24, 'pal_grass', seed=int(x * 10) + 20, flowers='pal_coral')
    box((2.62, 0.14, 3.22), (0, 0.0, zc), 'pal_cream', r=0.06)
    fb = 0.16
    for s in (-1, 1):
        box((2.62 + 2 * fb - 0.02, 0.2, fb), (0, -0.03, zc + s * (1.61 + fb / 2 - 0.02)), 'pal_coral', r=0.075)
        box((fb, 0.2, 3.22), (s * (1.31 + fb / 2 - 0.01), -0.03, zc), 'pal_coral', r=0.075)
    quad('screen', 2.4, 3.0, (0, -0.075, zc))
    poly = fillet([(-0.75, 0), (0.75, 0), (0.48, 0.45), (-0.48, 0.45)], [0.05, 0.05, 0.2, 0.2], seg=6)
    prism(poly, 0.2, 'XZ', off=0.0, mat='pal_coral_deep', bev=0.05, c=(0, 0, zc + 1.74))
    sphere(0.13, (0, -0.02, zc + 2.3), 'pal_yellow', u=16, v=10)
    for x in (-0.8, 0.8):
        tube([(x, -0.05, zc + 1.72), (x, -0.3, zc + 1.95), (x, -0.6, zc + 1.88)], 0.025, 'pal_navy')
        with frame((x, -0.62, zc + 1.82), (radians(-50), 0, 0)):
            cyl(0.11, 0.2, (0, 0, -0.1), 'pal_navy', bev=0.03, r2=0.075)
            cyl(0.09, 0.02, (0, 0, -0.11), 'pal_emissive', bev=0.0)


def number_asset(txt, seed):
    text_mesh(txt, 1.6, 0.42, 0.09, 'pal_coral', spacing=1.02)
    me = PARTS[-1].data
    xs = [v.co.x for v in me.vertices]
    w = max(xs) - min(xs)
    rnd = random.Random(seed)
    for k in range(int(w / 0.7) + 2):
        x = -w / 2 + k * w / (int(w / 0.7) + 1) + rnd.uniform(-0.1, 0.1)
        y = rnd.choice((-0.32, 0.3))
        sphere(0.12, (x, y, 0.05), 'pal_grass_deep', scale=(1.3, 1, 0.7), u=9, v=6)
        sphere(0.05, (x + 0.06, y - 0.05, 0.14), FLOWERS[k % 5], u=6, v=5)


@asset('number_6plus', 'Chunky clay "6+" (years shipping), 1.6 m tall, with flower tufts at its feet.')
def a_n6():
    number_asset('6+', 1)


@asset('number_400plus', 'Chunky clay "400+" (projects built), 1.6 m tall, with flower tufts at its feet.')
def a_n400():
    number_asset('400+', 2)


@asset('welcome_arch', 'Decorative welcome gate (2.4 m clear) with small onion-dome finials and truck-art trim; label = crown plaque 1.6 x 0.45.')
def a_welcome_arch():
    zc = 2.45
    prism(arch_band(1.8, 1.8, 1.28, 1.28, zc, 0.0, pi, 36), 0.46, 'XZ', mat='pal_cream', bev=0.09, segs=3)
    for s in (-1, 1):
        box((0.52, 0.46, zc - 0.3), (s * 1.54, 0, 0.3 + (zc - 0.3) / 2), 'pal_cream', r=0.09)
        box((0.72, 0.66, 0.3), (s * 1.54, 0, 0.15), 'pal_stone', r=0.09)
        box((0.6, 0.54, 0.1), (s * 1.54, 0, zc), 'pal_coral', r=0.04)
        # little mosque-inspired onion dome finial (decorative gate only)
        with frame((s * 1.54, 0, zc + 0.05)):
            cyl(0.2, 0.22, (0, 0, 0), 'pal_cream', bev=0.04, n=16)
            torus(0.2, 0.03, (0, 0, 0.22), 'pal_coral', n=16, m=4)
            revolve(fillet([(0, 0.22), (0.22, 0.22), (0.27, 0.36), (0.22, 0.52), (0.1, 0.66), (0.025, 0.76), (0, 0.8)],
                           [0, 0.02, 0.1, 0.08, 0.06, 0.02, 0], seg=3, closed=False), 'pal_grass_light', steps=20)
            sphere(0.045, (0, 0, 0.84), 'pal_yellow', u=8, v=6)
        jaali(0.3, 1.1, (s * 1.54, -0.235, 1.35), mat='pal_cream', back='pal_coral_deep', sp=0.19)
        bougainvillea((s * 1.54, -0.68, 0), 0.2)
        xi = s * 0.78
        zi = zc + sqrt(1.28 ** 2 - 0.78 ** 2)
        hanging_lantern((xi, 0, zi), chain=0.32)
    box((1.9, 0.14, 0.62), (0, -0.27, zc + 1.42), 'pal_coral', r=0.07)
    quad('label', 1.6, 0.45, (0, -0.345, zc + 1.42), mat='pal_cream')
    truck_trim(1.9, (0, -0.3, zc + 1.03), h=0.13)
    sphere(0.14, (0, -0.05, zc + 1.95), 'pal_yellow', u=14, v=9)
    for s in (-1, 1):
        for k, t in enumerate((0.25, 0.5, 0.75)):
            a = pi / 2 + s * (pi / 2) * t
            x, z = 1.55 * cos(a), zc + 1.55 * sin(a)
            sphere(0.17 - 0.025 * k, (x, -0.22, z), 'pal_grass' if k % 2 == 0 else 'pal_grass_deep', u=11, v=7)
            sphere(0.06, (x + 0.08 * s, -0.36, z + 0.05), 'pal_coral' if k % 2 else 'pal_pink', u=6, v=5)


# ============================================================================================ SCHOOLIEE
@asset('school', 'Flat-roofed Punjab school with pointed-arch verandah, jaali parapet, rooftop tank, solar panels and bell tower. bell pivot at hang point; door hinge left edge.')
def a_school():
    W, D = 5.6, 3.4
    z0 = 0.25
    H = 3.1
    box((W + 0.6, D + 1.9, z0), (0, -0.55, z0 / 2), 'pal_stone', r=0.1)
    box((W, D, H), (0, 0, z0 + H / 2), 'pal_cream', r=0.1, segs=3)
    box((W + 0.04, D + 0.04, 0.45), (0, 0, z0 + 0.225), 'pal_pink', r=0.06)
    zr = z0 + H
    box((W + 0.3, D + 0.3, 0.2), (0, 0, zr + 0.05), 'pal_coral', r=0.07)
    # parapet with jaali panels on the front
    ph = 0.55
    for s in (-1, 1):
        box((0.16, D + 0.3, ph), (s * (W / 2 + 0.07), 0, zr + 0.15 + ph / 2), 'pal_cream', r=0.05)
    box((W + 0.3, 0.16, ph), (0, D / 2 + 0.07, zr + 0.15 + ph / 2), 'pal_cream', r=0.05)
    for x0, x1 in ((-W / 2 - 0.15, -1.75), (-0.55, 0.55), (1.75, W / 2 + 0.15)):
        box((x1 - x0, 0.16, ph), ((x0 + x1) / 2, -D / 2 - 0.07, zr + 0.15 + ph / 2), 'pal_cream', r=0.05)
    for xc in (-1.15, 1.15):
        jaali(1.2, ph - 0.08, (xc, -D / 2 - 0.02, zr + 0.15 + ph / 2), mat='pal_cream', back='pal_coral_deep', sp=0.18)
    box((W + 0.36, D + 0.36, 0.08), (0, 0, zr + 0.15 + ph + 0.04), 'pal_coral', r=0.03)
    # verandah: pointed arcade
    vy = -D / 2 - 1.1
    box((W - 0.4, 1.2, 0.18), (0, -D / 2 - 0.55, z0 + 2.95), 'pal_cream', r=0.06)
    box((W - 0.34, 1.26, 0.06), (0, -D / 2 - 0.55, z0 + 3.07), 'pal_coral', r=0.02)
    for i, x in enumerate((-2.4, -0.8, 0.8, 2.4)):
        box((0.26, 0.26, 2.95), (x, vy, z0 + 1.475), 'pal_cream', r=0.08)
        box((0.36, 0.36, 0.14), (x, vy, z0 + 0.07), 'pal_stone', r=0.05)
    for xa in (-1.6, 0.0, 1.6):
        with frame((xa, vy, z0)):
            prism(arch_frame(1.6, 2.95, 1.34, 2.55, 1.6, 1.6, True, 12), 0.24, 'XZ', mat='pal_cream', bev=0.05)
    truck_trim(W - 0.5, (0, vy - 0.16, z0 + 2.88), h=0.12)
    # bell tower on the roof
    with frame((0, 0.3, zr + 0.15)):
        box((1.05, 1.05, 1.6), (0, 0, 0.8), 'pal_cream', r=0.08)
        with frame((0, -0.53, 1.05)):
            cyl(0.3, 0.06, (0, 0, 0), 'pal_white', bev=0.02, rot=(pi / 2, 0, 0), center=True)
            torus(0.3, 0.045, (0, -0.03, 0), 'pal_coral', rot=(pi / 2, 0, 0), m=6)
            box((0.035, 0.02, 0.2), (0, -0.045, 0.07), 'pal_ink', r=0.01, segs=1)
            box((0.15, 0.02, 0.035), (0.06, -0.045, 0.0), 'pal_ink', r=0.01, segs=1)
        box((1.22, 1.22, 0.14), (0, 0, 1.65), 'pal_coral', r=0.05)
        for x in (-0.47, 0.47):
            for y in (-0.47, 0.47):
                box((0.15, 0.15, 0.85), (x, y, 1.72 + 0.425), 'pal_cream', r=0.05, segs=2)
        box((1.22, 1.22, 0.14), (0, 0, 2.6), 'pal_cream', r=0.05)
        cyl(0.88, 0.75, (0, 0, 2.65), 'pal_coral_deep', bev=0.06, r2=0.07, n=4, rot=(0, 0, pi / 4))
        sphere(0.12, (0, 0, 3.48), 'pal_yellow', u=14, v=9)
        with collect() as cb:
            revolve(fillet([(0, 2.52), (0.1, 2.52), (0.12, 2.45), (0.15, 2.26), (0.24, 2.12), (0.25, 2.07), (0, 2.07)],
                           [0, 0.03, 0.02, 0.05, 0.03, 0.01, 0], seg=4, closed=False), 'pal_yellow', steps=24)
            sphere(0.06, (0, 0, 2.05), 'pal_wood_dark', u=10, v=7)
            torus(0.06, 0.02, (0, 0, 2.56), 'pal_yellow', rot=(pi / 2, 0, 0), m=6, n=12)
        special('bell', cb.objs, (0, 0, 2.58))
    water_tank((-2.0, 0.6, zr + 0.15), r=0.45, h=0.7, mat='pal_sky')
    for x in (1.4, 2.25):
        solar_panel((x, 0.7, zr + 0.15), rotz=0.0, w=0.8, d=0.95, tilt=22)
    for sx in (-1, 1):
        bunting((0, 0.3 - 0.53, zr + 1.8), (sx * (W / 2 + 0.1), -D / 2 - 0.1, zr + 0.75), n=8, sag=0.25)
    # facade: windows with pointed hoods, door
    for x in (-2.0, -1.0, 1.0, 2.0):
        with frame((x, -D / 2, 1.75)):
            window_full(0.6, 1.0, 'pal_wood', seed=int(x * 3), box_flowers=False)
            arch_hood(0.6, (0, 0, 0.55), mat='pal_coral')
    for sx in (-1, 1):
        with frame((sx * W / 2, 0.2, 1.75), (0, 0, sx * pi / 2)):
            jaali(0.8, 1.0, (0, 0, 0), mat='pal_cream', back='pal_wood_dark')
            arch_hood(0.8, (0, 0, 0.55), mat='pal_coral')
    with frame((0, -D / 2, z0)):
        prism(u_frame(1.56, 2.6, 1.24, 2.4, 0.78, 0.62), 0.16, 'XZ', off=-0.04, mat='pal_coral', bev=0.04)
        d = door_slab(1.22, 2.36, 'pal_grass_deep', t=0.08)
        special('door', d, (-0.61, 0, 0))
        tube_light((0, 0, 2.75), L=0.8)
    for sx in (-1, 1):
        brick_band(1.6, 0.6, (sx * 1.85, -D / 2 - 0.02, z0))
        bougainvillea((sx * 0.95, vy - 0.45, z0), 0.2)
    steps_block((0, vy - 0.2, z0), 1.7, n=2, rise=0.12, run=0.32)
    facade_bench((-W / 2, 1.0, z0), rotz=-pi / 2, L=1.2)
    for sx in (-1, 1):
        # parnala rain spouts
        cyl(0.07, 0.5, (sx * (W / 2 - 0.5), -D / 2 - 0.05, zr + 0.25), 'pal_stone', bev=0.0, n=8, rot=(pi / 2 - 0.25, 0, 0))
    bicycle((W / 2 + 0.28, 0.4, z0), rotz=pi / 2, mat='pal_yellow', basket=True)
    with frame((W / 2, -0.9, 2.1), (0, 0, pi / 2)):
        ac_unit((0, 0, 0))


@asset('school_van', 'Yellow toy school van (3.6 m, adult scale). Nose faces -Y. Stop-sign arm on the left side.')
def a_school_van():
    L, Wd = 3.6, 1.75
    box((Wd, L, 0.95), (0, 0, 0.38 + 0.475), 'pal_yellow', r=0.3, segs=3)
    box((Wd - 0.1, L * 0.72, 0.8), (0, 0.45, 1.25 + 0.36), 'pal_yellow', r=0.3, segs=3)
    box((Wd + 0.02, L + 0.02, 0.09), (0, 0, 1.24), 'pal_ink', r=0.04, segs=2)
    box((Wd + 0.02, L + 0.02, 0.05), (0, 0, 0.8), 'pal_ink', r=0.02, segs=1)
    for sy in (-1, 1):
        box((Wd + 0.08, 0.24, 0.22), (0, sy * (L / 2 + 0.03), 0.45), 'pal_cream', r=0.1)
    with frame((0, 0.45 - L * 0.36, 1.62), (radians(10), 0, 0)):
        box((Wd - 0.38, 0.07, 0.55), (0, 0.0, 0), 'pal_glass', r=0.08, segs=2)
    for sx in (-1, 1):
        for y in (-0.38, 0.22, 0.82, 1.42):
            box((0.05, 0.44, 0.34), (sx * (Wd / 2 - 0.075), y, 1.5), 'pal_glass', r=0.07, segs=2)
    box((Wd - 0.44, 0.07, 0.46), (0, L / 2 + 0.0, 1.62), 'pal_glass', r=0.08, segs=2)
    for sx in (-1, 1):
        sphere(0.13, (sx * 0.55, -L / 2 + 0.03, 0.88), 'pal_emissive', scale=(1, 0.45, 1), u=14, v=9)
        torus(0.13, 0.025, (sx * 0.55, -L / 2 + 0.0, 0.88), 'pal_cream', rot=(pi / 2, 0, 0), n=16, m=6)
        sphere(0.08, (sx * 0.68, L / 2 - 0.0, 0.92), 'pal_coral', scale=(1, 0.45, 1), u=10, v=7)
        sphere(0.08, (sx * 0.62, -0.3, 2.1), 'pal_coral', u=10, v=7)
        sphere(0.08, (sx * 0.62, 1.5, 2.1), 'pal_coral', u=10, v=7)
        tube([(sx * Wd / 2, -0.85, 1.35), (sx * (Wd / 2 + 0.18), -0.92, 1.4)], 0.02, 'pal_ink', kind='POLY', bres=1, res=1)
        box((0.08, 0.16, 0.2), (sx * (Wd / 2 + 0.2), -0.92, 1.45), 'pal_ink', r=0.03, segs=1)
    box((0.75, 0.06, 0.24), (0, -L / 2 - 0.0, 0.88), 'pal_cream', r=0.06, segs=2)
    for k in range(3):
        box((0.6, 0.02, 0.025), (0, -L / 2 - 0.03, 0.8 + k * 0.07), 'pal_stone', r=0.008, segs=1)
    box((0.95, 0.12, 0.26), (0, -0.35, 2.12), 'pal_navy', r=0.06)
    for sx in (-1, 1):
        for y in (-1.05, 1.1):
            cyl(0.36, 0.3, (sx * (Wd / 2 - 0.08), y, 0.36), 'pal_ink', bev=0.11, rot=(0, pi / 2, 0), center=True)
            cyl(0.17, 0.06, (sx * (Wd / 2 + 0.08), y, 0.36), 'pal_cream', bev=0.025, rot=(0, pi / 2, 0), center=True)
            prism(arch_band(0.46, 0.46, 0.4, 0.4, 0.38, 0, pi, 16), 0.06, 'YZ', c=(sx * (Wd / 2 + 0.01), y, 0), mat='pal_coral_deep',
                  bev=0.02, segs=1) if False else None
    for sx in (-1, 1):
        box((0.02, 0.03, 0.75), (sx * (Wd / 2), -0.6, 0.85), 'pal_coral_deep', r=0.01, segs=1)
    # stop arm (left side)
    with frame((-Wd / 2 - 0.06, -0.15, 1.05)):
        poly = [(0.22 * cos(pi / 8 + k * pi / 4), 0.22 * sin(pi / 8 + k * pi / 4)) for k in range(8)]
        prism(fillet(poly, 0.02, seg=1), 0.04, 'YZ', mat='pal_coral', bev=0.012, segs=1)
        prism(fillet([(0.16 * cos(pi / 8 + k * pi / 4), 0.16 * sin(pi / 8 + k * pi / 4)) for k in range(8)], 0.01, seg=1), 0.02, 'YZ', off=-0.02,
              mat='pal_white', bev=0.005, segs=1)


@asset('noticeboard', 'Fee-challan noticeboard with roof and lamp. screen 1.3 x 0.86 (centre 1.6 m).')
def a_noticeboard():
    for x in (-0.82, 0.82):
        box((0.14, 0.14, 2.45), (x, 0.03, 1.225), 'pal_wood', r=0.05)
        box((0.3, 0.3, 0.14), (x, 0.03, 0.07), 'pal_stone', r=0.05)
    box((1.6, 0.12, 1.1), (0, 0.0, 1.6), 'pal_wood_dark', r=0.05)
    box((1.52, 0.1, 1.02), (0, -0.03, 1.6), 'pal_cream', r=0.04)
    quad('screen', 1.3, 0.86, (0, -0.085, 1.6))
    for (x, z, m) in ((-0.62, 2.04, 'pal_coral'), (0.62, 2.04, 'pal_yellow'), (-0.62, 1.16, 'pal_sky'), (0.62, 1.16, 'pal_grass')):
        sphere(0.04, (x, -0.1, z), m, u=10, v=7)
    gable_roof(0.38, 2.42, 2.74, 0.1, 2.0, 'YZ', 'pal_coral_deep', apex_r=0.08)
    tube([(0, 0.0, 2.45), (0, -0.25, 2.5), (0, -0.35, 2.42)], 0.018, 'pal_ink')
    cyl(0.1, 0.08, (0, -0.35, 2.33), 'pal_ink', bev=0.02, r2=0.04)
    sphere(0.06, (0, -0.35, 2.3), 'pal_emissive', u=10, v=7)
    potted((0.95, -0.35, 0), 0.16, 0.3, 'pal_grass', 'pal_coral')
    box((0.5, 0.06, 0.32), (-0.55, -0.15, 0.55), 'pal_white', r=0.02, rot=(0.1, 0, 0.05), segs=1)


# ============================================================================================ KAROBARI
@asset('bazaar_stall', 'Bazaar stall, counter 0.95 m, truck-art trims, hanging bilingual board, tube light. awning pivot = back hinge (rotate about X). Bunting rides on the awning.')
def a_bazaar_stall():
    for x in (-1.25, 1.25):
        cyl(0.07, 2.92, (x, 0.8, 0), 'pal_cream', bev=0.025, n=10, segs=1)
        cyl(0.07, 2.5, (x, -0.72, 0), 'pal_cream', bev=0.025, n=10, segs=1)
        sphere(0.1, (x, -0.72, 2.52), 'pal_coral', u=10, v=7)
    box((2.5, 0.06, 1.6), (0, 0.82, 1.75), 'pal_pink', r=0.03)
    truck_trim(2.4, (0, 0.78, 2.45), h=0.18)
    T = 0.95
    box((2.4, 0.8, T - 0.08), (0, -0.25, (T - 0.08) / 2), 'pal_wood', r=0.06)
    truck_trim(2.3, (0, -0.65, 0.62), h=0.2)
    truck_trim(2.3, (0, -0.65, 0.2), h=0.12, base='pal_grass_light')
    box((2.55, 0.95, 0.08), (0, -0.25, T - 0.04), 'pal_cream', r=0.04)
    for x, fr in ((-0.8, ['pal_coral']), (0.0, ['pal_yellow']), (0.8, ['pal_grass'])):
        crate((x, -0.32, T), (0.6, 0.44, 0.2), fruit=fr, rot=(radians(-16), 0, 0), seed=int(x * 10 + 5))
    with frame((0.95, 0.05, T)):
        cyl(0.1, 0.08, (0, 0, 0), 'pal_yellow', bev=0.02)
        cyl(0.025, 0.35, (0, 0, 0.08), 'pal_yellow', bev=0.0, n=8)
        box((0.5, 0.03, 0.03), (0, 0, 0.43), 'pal_yellow', r=0.01, segs=1)
        for x in (-0.22, 0.22):
            tube([(x, 0, 0.43), (x, 0, 0.3)], 0.006, 'pal_ink', kind='POLY')
            cyl(0.1, 0.03, (x, 0, 0.27), 'pal_yellow', bev=0.01, r2=0.08)
    crate((-0.75, -1.15, 0), (0.6, 0.45, 0.34), fruit=['pal_coral', 'pal_coral_deep'], seed=2)
    crate((0.0, -1.15, 0), (0.6, 0.45, 0.34), fruit=['pal_grass', 'pal_grass_light'], seed=3)
    sack((0.85, -1.1, 0), 0.25, 'pal_sand', fill='pal_yellow')
    sack((1.4, -0.75, 0), 0.24, 'pal_sand', fill='pal_coral_deep')
    sack((-1.55, -0.3, 0), 0.27, 'pal_tan', rotz=0.4)
    sack((-1.5, 0.25, 0), 0.24, 'pal_sand', rotz=-0.3)
    plastic_chair((0.4, 0.4, 0), rotz=pi + 0.3, mat='pal_sky')
    for i in range(5):
        sphere(0.075, (1.0 + 0.04 * (i % 2), 0.55, 2.35 - i * 0.11), 'pal_yellow', scale=(0.8, 0.8, 1.3), u=8, v=6)
    tube([(1.0, 0.57, 2.6), (1.0, 0.55, 2.35)], 0.012, 'pal_wood_dark', kind='POLY')
    for i in range(4):
        sphere(0.06, (-1.0, 0.55, 2.4 - i * 0.12), 'pal_coral', u=8, v=6)
    tube([(-1.0, 0.57, 2.6), (-1.0, 0.55, 2.4)], 0.012, 'pal_wood_dark', kind='POLY')
    tube_light((0, 0.78, 2.2), L=1.1)
    shop_board(0.9, 0.46, (-1.25, -0.72, 2.3), (0, 0, -pi / 2), base='pal_grass_deep', drop=0.15)
    with collect() as ca:
        with frame((0, 0.82, 2.95), (radians(14), 0, 0)):
            stripes_panel(2.8, 1.95, 8, ['pal_coral', 'pal_cream'], t=0.08)
            box((2.86, 0.12, 0.12), (0, 0.0, -0.02), 'pal_coral_deep', r=0.05)
            bunting((-1.4, -1.98, -0.22), (1.4, -1.98, -0.22), n=9, sag=0.12)
    special('awning', ca.objs, (0, 0.82, 2.95))


@asset('storefront', 'Karobari shop, Faisalabad style: flat roof with parapet sign (label 1.8 x 0.45), display window screen 1.7 x 1.1, half-up rolling shutter, hanging bilingual board, tube light, AC, dish, charpai on the roof.')
def a_storefront():
    W, D, H = 3.8, 2.6, 3.25
    z0 = 0.18
    box((W + 0.4, D + 0.6, z0), (0, -0.15, z0 / 2), 'pal_stone', r=0.07)
    box((W, D, H), (0, 0, z0 + H / 2), 'pal_pink', r=0.1, segs=3)
    brick_band(W - 0.1, 0.55, (0, -D / 2 - 0.0, z0))
    zr = z0 + H
    box((W + 0.22, D + 0.22, 0.2), (0, 0, zr + 0.05), 'pal_cream', r=0.08)
    truck_trim(W, (0, -D / 2 - 0.11, zr - 0.12), h=0.16)
    ph = 0.5
    for s in (-1, 1):
        box((0.14, D + 0.1, ph), (s * (W / 2 + 0.03), 0, zr + 0.15 + ph / 2), 'pal_cream', r=0.05)
    box((W + 0.2, 0.14, ph), (0, D / 2 + 0.03, zr + 0.15 + ph / 2), 'pal_cream', r=0.05)
    poly = fillet([(-1.25, 0), (1.25, 0), (1.25, 0.85), (-1.25, 0.85)], [0, 0, 0.36, 0.36], seg=6)
    prism(poly, 0.18, 'XZ', off=-D / 2 + 0.0, mat='pal_cream', bev=0.06, c=(0, 0, zr + 0.15))
    for x0, x1 in ((-W / 2 - 0.1, -1.25), (1.25, W / 2 + 0.1)):
        box((x1 - x0, 0.14, ph), ((x0 + x1) / 2, -D / 2 + 0.0, zr + 0.15 + ph / 2), 'pal_cream', r=0.05)
    box((2.06, 0.08, 0.58), (0, -D / 2 - 0.13, zr + 0.62), 'pal_coral', r=0.05)
    quad('label', 1.8, 0.45, (0, -D / 2 - 0.175, zr + 0.62), mat='pal_cream')
    tube_light((0, -D / 2 - 0.09, zr + 0.28), L=1.6)
    # rooftop life
    water_tank((1.0, 0.5, zr + 0.15), r=0.42, h=0.65, mat='pal_sky')
    charpai((-0.8, 0.25, zr + 0.15), rotz=pi / 2 + 0.1)
    plastic_chair((0.2, -0.5, zr + 0.15), rotz=0.4)
    dish_antenna((-W / 2 + 0.1, D / 2 - 0.3, zr + 0.6), (0, 0, radians(-120)), s=1.0)
    # display window with pointed hood
    with frame((-0.55, -D / 2, 1.55)):
        box((2.0, 0.14, 1.38), (0, -0.02, 0), 'pal_cream', r=0.05)
        quad('screen', 1.7, 1.1, (0, -0.096, 0.0))
        box((2.2, 0.26, 0.1), (0, -0.12, -0.74), 'pal_cream', r=0.04)
        arch_hood(2.0, (0, 0, 0.7), mat='pal_coral_deep')
    facade_bench((-0.55, -D / 2, z0), 0.0, L=1.5)
    # shop opening with a half-up rolling shutter
    with frame((1.3, -D / 2, z0)):
        box((1.2, 0.2, 2.3), (0, 0.12, 1.15), 'pal_ink', r=0.03, segs=1)
        rolling_shutter(1.1, 2.3, 0.55, (0, -0.02, 0), mat='pal_sky')
    shop_board(1.0, 0.5, (1.3, -D / 2, 3.15), (0, 0, 0), base='pal_navy', drop=0.12)
    with frame((-W / 2, -0.4, 2.3), (0, 0, -pi / 2)):
        ac_unit((0, 0, 0))
    with frame((-W / 2, 0.7, 2.0), (0, 0, -pi / 2)):
        iron_balcony(1.0, (0, 0, 0), d=0.45)
    steps_block((1.3, -D / 2 - 0.4, z0), 1.3, n=1, rise=0.18, run=0.3)
    bougainvillea((-2.05, -D / 2 - 0.45, 0), 0.22)
    plastic_chair((2.35, -D / 2 - 0.6, 0), rotz=-0.4, mat='pal_white')
    drainpipe(-W / 2 + 0.05, -D / 2 - 0.08, z0, zr, 'pal_cream')
    parcel((2.3, -0.3, 0), (0.45, 0.35, 0.3), rotz=0.2)
    parcel((2.3, -0.28, 0.3), (0.38, 0.3, 0.24), rotz=-0.1)
    bicycle((-W / 2 - 0.3, -1.1, 0), rotz=-pi / 2, mat='pal_grass_deep', basket=True, lean=-0.13)


@asset('chai_stall', 'Dhaba chai stall: tin-roof shade, big kettle on a clay stove, cups, truck-art cart, two dhaba benches and a charpai, bilingual board.')
def a_chai_stall():
    T = 0.95
    box((3.4, 2.6, 0.12), (0, 0.2, 0.06), 'pal_stone', r=0.05)
    zb = 0.12
    # tin-roof shade on wooden posts
    for x in (-1.55, 1.55):
        cyl(0.065, 2.75, (x, 1.3, zb), 'pal_wood', bev=0.02, n=10, segs=1)
        cyl(0.065, 2.45, (x, -0.95, zb), 'pal_wood', bev=0.02, n=10, segs=1)
    with frame((0, 1.38, zb + 2.78), (radians(8), 0, 0)):
        box((3.5, 2.6, 0.06), (0, -1.25, 0), 'pal_sky', r=0.025, segs=1)
        for k in range(9):
            box((0.07, 2.62, 0.05), (-1.6 + k * 0.4, -1.25, 0.04), 'pal_cream', r=0.02, segs=1)
        truck_trim(3.5, (0, -2.56, -0.06), h=0.16)
    tube_light((0.0, 1.32, zb + 2.35), L=1.0)
    # cart counter with truck-art front
    with frame((0, 0.75, zb)):
        box((1.9, 0.75, T - 0.1), (0, 0, (T - 0.1) / 2), 'pal_coral', r=0.07)
        box((2.0, 0.85, 0.08), (0, 0, T - 0.06), 'pal_cream', r=0.035)
        truck_trim(1.8, (0, -0.38, T - 0.3), h=0.2)
        truck_trim(1.8, (0, -0.38, 0.25), h=0.12, base='pal_grass_light')
        for k, (x, m) in enumerate(((0.55, 'pal_yellow'), (0.75, 'pal_peach'))):
            cyl(0.08, 0.22, (x, 0.15, T - 0.02), 'pal_glass', bev=0.025, n=12)
            cyl(0.065, 0.13, (x, 0.15, T), m, bev=0.02, n=12)
            cyl(0.085, 0.04, (x, 0.15, T + 0.2), 'pal_coral', bev=0.015, n=12)
        for i, (x, y) in enumerate([(-0.05, -0.15), (0.12, -0.18), (0.05, 0.02), (0.24, -0.02), (-0.15, 0.08)]):
            cyl(0.045, 0.085, (x, y, T - 0.02), 'pal_white', bev=0.015, r2=0.05, n=10, segs=1)
            cyl(0.04, 0.006, (x, y, T + 0.065), 'pal_tan', bev=0.0, n=10)
    # clay stove (chulha) with a big kettle
    with frame((-1.0, 0.1, zb)):
        revolve(fillet([(0, 0), (0.42, 0), (0.45, 0.35), (0.36, 0.58), (0.24, 0.6), (0.24, 0.5), (0, 0.5)], [0, 0.04, 0.1, 0.06, 0.02, 0.02, 0], seg=3,
                       closed=False), 'pal_coral_deep', steps=24)
        box((0.3, 0.1, 0.22), (0, -0.4, 0.2), 'pal_ink', r=0.04, segs=1)
        for k in range(3):
            sphere(0.06, (-0.06 + k * 0.06, -0.42, 0.18 + (k % 2) * 0.04), 'pal_emissive', u=8, v=5)
        revolve(fillet([(0, 0.55), (0.28, 0.55), (0.34, 0.75), (0.28, 0.98), (0.12, 1.05), (0, 1.05)], [0, 0.04, 0.12, 0.08, 0.04, 0], seg=4, closed=False),
                'pal_cream', steps=24)
        cyl(0.12, 0.07, (0, 0, 1.03), 'pal_coral_deep', bev=0.02, n=14)
        sphere(0.05, (0, 0, 1.13), 'pal_coral_deep', u=8, v=6)
        tube([(0.3, 0, 0.78), (0.45, 0, 0.9), (0.52, 0, 1.06)], 0.04, 'pal_cream')
        torus(0.22, 0.02, (0, 0, 1.1), 'pal_wood_dark', rot=(pi / 2, 0, 0), n=16, m=4, arc=(0.2, pi - 0.2))
        for k, (dx, z, rr) in enumerate([(0.55, 1.15, 0.07), (0.6, 1.3, 0.09), (0.52, 1.48, 0.11)]):
            sphere(rr, (dx, 0, z), 'pal_white', u=10, v=7)
    # benches, charpai
    dhaba_bench_parts((-0.6, -1.0, zb), rotz=0.0)
    dhaba_bench_parts((1.1, -0.65, zb), rotz=pi / 2)
    charpai((-2.4, 0.3, 0), rotz=0.15)
    shop_board(1.0, 0.5, (-1.55, 1.3, zb + 2.4), (0, 0, -pi / 2), base='pal_coral_deep', border='pal_cream', drop=0.2)
    sack((1.95, 1.0, zb), 0.24, 'pal_sand', rotz=0.3)
    crate((1.95, 0.4, zb), (0.5, 0.42, 0.34), rot=(0, 0, -0.2))


@asset('phone_stand', 'A phone on a stand (centre ~1.55 m) with a voice-note bubble. screen 0.42 x 0.82.')
def a_phone_stand():
    cyl(0.4, 0.12, (0, 0, 0), 'pal_stone', bev=0.04)
    cyl(0.28, 0.1, (0, 0, 0.12), 'pal_coral', bev=0.035)
    cyl(0.07, 0.9, (0, 0, 0.22), 'pal_cream', bev=0.02)
    torus(0.08, 0.025, (0, 0, 0.7), 'pal_coral', n=14, m=6)
    with frame((0, 0, 1.1), (radians(-12), 0, 0)):
        box((0.6, 0.2, 0.1), (0, 0.02, 0.0), 'pal_coral', r=0.045)
        for x in (-0.27, 0.27):
            box((0.06, 0.12, 0.14), (x, -0.02, 0.06), 'pal_coral', r=0.025, segs=1)
        box((0.5, 0.075, 0.96), (0, 0, 0.5), 'pal_navy', r=0.065)
        quad('screen', 0.42, 0.82, (0, -0.0385, 0.505))
        sphere(0.018, (0, -0.038, 0.95), 'pal_ink', u=8, v=6)
        box((0.02, 0.03, 0.15), (0.255, 0, 0.75), 'pal_navy', r=0.008, segs=1)
    with frame((0.55, 0.0, 2.15)):
        box((0.5, 0.1, 0.26), (0, 0, 0), 'pal_grass', r=0.12)
        prism(fillet([(-0.22, -0.08), (-0.07, -0.08), (-0.27, -0.24)], [0, 0, 0.02], seg=2), 0.08, 'XZ', mat='pal_grass', bev=0.02, segs=1)
        prism(fillet([(-0.17, -0.065), (-0.17, 0.065), (-0.06, 0.0)], 0.015, seg=2), 0.03, 'XZ', off=-0.06, mat='pal_white', bev=0.008, segs=1)
        for i, h in enumerate((0.06, 0.13, 0.08, 0.15, 0.05)):
            box((0.025, 0.03, h), (0.0 + i * 0.045, -0.06, 0), 'pal_white', r=0.012, segs=1)
    tube([(0.07, 0.0, 1.85), (0.28, 0.0, 2.0), (0.36, 0.0, 2.05)], 0.012, 'pal_cream')
    potted((-0.45, 0.2, 0), 0.13, 0.25, 'pal_grass', 'pal_coral_deep')


# ============================================================================================ WHATSAPP
def paper_plane_parts(s=1.0, mat='pal_white'):
    th = 0.018 * s
    for sx in (-1, 1):
        poly = [(0, -0.3 * s), (sx * 0.26 * s, 0.28 * s), (sx * 0.02 * s, 0.22 * s)]
        if sx < 0:
            poly = list(reversed(poly))
        prism(poly, th, 'XY', off=0.0, mat=mat, bev=0.006, segs=1, rot=(0, -sx * radians(14), 0), c=(0, 0, 0.02 * s))
    prism([(-0.3 * s, 0.0), (0.24 * s, 0.0), (0.24 * s, -0.09 * s)], th, 'YZ', mat=mat, bev=0.006, segs=1, c=(0, 0, 0.0))


@asset('post_office', 'Round flat-roofed post office (no dome) with crenellated parapet, rooftop tank and plane mast, painted door 1.06 x 2.22 (hinge left), AC, dish, mail sacks, pillar box, postman bicycle.')
def a_post_office():
    R = 1.9
    z0 = 0.25
    revolve(fillet([(0, 0), (R + 0.35, 0), (R + 0.35, z0), (0, z0)], [0, 0.03, 0.09, 0], seg=4, closed=False), 'pal_stone', steps=40)
    cyl(R, 3.0, (0, 0, z0), 'pal_cream', bev=0.06, n=44, segs=2)
    cyl(R + 0.06, 0.5, (0, 0, z0), 'pal_grass_light', bev=0.05, n=44, segs=2)
    zr = z0 + 3.0
    cyl(R + 0.18, 0.24, (0, 0, zr - 0.1), 'pal_grass_deep', bev=0.09, n=44, segs=2)
    # crenellated parapet ring (merlons)
    revolve(fillet([(R - 0.12, zr + 0.1), (R + 0.12, zr + 0.1), (R + 0.12, zr + 0.62), (R - 0.12, zr + 0.62)], 0.05, seg=2, closed=True)
            + [(R - 0.12, zr + 0.1)], 'pal_cream', steps=44, sharp=70)
    torus(R, 0.07, (0, 0, zr + 0.64), 'pal_coral', n=44, m=6)
    cyl(R - 0.05, 0.08, (0, 0, zr + 0.1), 'pal_stone', bev=0.03, n=36, segs=1)
    truck_trim(1.6, (0, -R - 0.2, zr + 0.02), h=0.13) if False else None
    water_tank((0.5, 0.55, zr + 0.18), r=0.42, h=0.65, mat='pal_sky')
    cyl(0.04, 1.5, (-0.6, 0.2, zr + 0.18), 'pal_cream', bev=0.0, n=8)
    with frame((-0.6, 0.2, zr + 1.75), (0.2, 0, 0.6)):
        paper_plane_parts(0.8)
    vent((-0.7, -0.75, zr + 0.18))
    with frame((0, -R + 0.06, z0)):
        box((1.6, 0.62, 2.85), (0, 0.16, 1.425), 'pal_cream', r=0.09)
        prism(arch_frame(1.48, 2.7, 1.12, 2.32, 1.6, 1.6, True, 12), 0.16, 'XZ', off=-0.17, mat='pal_grass_deep', bev=0.04)
        d = door_slab(1.08, 2.26, 'pal_coral', t=0.08)
        for o in d:
            o.data.transform(Matrix.Translation((0, -0.13, 0)))
        special('door', d, (-0.54, -0.13, 0))
        jaali(0.5, 0.36, (0, -0.18, 2.42), mat='pal_cream', back='pal_grass_deep', sp=0.12)
        tube_light((0, -0.15, 2.95) if False else (0, -0.16, 2.78), L=0.7)
        for x in (-0.95, 0.95):
            wall_lantern((x, -0.14, 2.0))
    steps_block((0, -R - 0.55, z0), 1.5, n=2, rise=0.12, run=0.3)
    for ang in (-58, 58, 140, -140):
        a = radians(ang)
        n = (sin(a), -cos(a))
        with frame((n[0] * (R - 0.02), n[1] * (R - 0.02), 1.85), (0, 0, a)):
            window_round(0.36, 'pal_grass_deep')
            if abs(ang) < 90:
                flower_box(0.75, (0, -0.02, -0.5), seed=ang)
                arch_hood(0.72, (0, 0, 0.38), mat='pal_coral')
    for ang, kind in ((-95, 'ac'), (95, 'dish')):
        a = radians(ang)
        n = (sin(a), -cos(a))
        with frame((n[0] * (R + 0.01), n[1] * (R + 0.01), 2.3 if kind == 'ac' else 2.9), (0, 0, a)):
            if kind == 'ac':
                ac_unit((0, 0, 0))
            else:
                dish_antenna((0, 0, 0), s=1.0)
    sack((-1.05, -2.15, 0), 0.3, 'pal_sand', badge='pal_white', rotz=0.3)
    sack((-1.55, -1.85, 0), 0.27, 'pal_sand', badge='pal_white', rotz=-0.4)
    sack((-1.3, -2.0, 0.42), 0.24, 'pal_tan', badge='pal_white', rotz=0.1, squash=0.8)
    parcel((-2.05, -1.35, 0), (0.45, 0.35, 0.32), rotz=0.5)
    parcel((-2.05, -1.35, 0.32), (0.35, 0.3, 0.22), rotz=0.3)
    with frame((1.45, -2.05, 0)):
        cyl(0.24, 0.12, (0, 0, 0), 'pal_coral_deep', bev=0.04)
        cyl(0.2, 1.0, (0, 0, 0.1), 'pal_coral', bev=0.05)
        revolve(fillet([(0, 1.32), (0.18, 1.27), (0.24, 1.12), (0.24, 1.06), (0, 1.06)], [0, 0.1, 0.05, 0.02, 0], seg=3, closed=False),
                'pal_coral_deep', steps=24)
        box((0.22, 0.05, 0.035), (0, -0.2, 0.88), 'pal_ink', r=0.015, segs=1)
        box((0.16, 0.03, 0.12), (0, -0.2, 0.62), 'pal_cream', r=0.02, segs=1)
    for ang, kind in ((-125, 'bench'), (120, 'bike')):
        a = radians(ang)
        n = (sin(a), -cos(a))
        with frame((n[0] * (R + 0.02), n[1] * (R + 0.02), z0), (0, 0, a)):
            if kind == 'bench':
                bench((0, -0.35, 0), 0.0, L=1.3, back=False)
            else:
                bicycle((0, -0.3, 0), 0.0, mat='pal_coral', basket=True, lean=-0.12)
    bougainvillea((0.95, -2.2, 0), 0.2)


@asset('pigeon_loft', 'Raised pigeon loft (platform 2.0 m) with railing, ladder, pigeons and a seed sack.')
def a_pigeon_loft():
    zp = 2.0
    for x in (-0.6, 0.6):
        for y in (-0.48, 0.48):
            box((0.12, 0.12, zp), (x, y, zp / 2), 'pal_cream', r=0.045, segs=2)
    for y in (-0.48, 0.48):
        box((1.3, 0.06, 0.06), (0, y, 0.8), 'pal_wood', r=0.025, rot=(0, 0.75, 0), segs=1)
    box((1.6, 1.4, 0.12), (0, 0, zp + 0.06), 'pal_wood', r=0.045)
    box((1.3, 1.0, 1.0), (0, 0.12, zp + 0.12 + 0.5), 'pal_pink', r=0.08)
    zt = zp + 1.12
    gable_roof(0.72, zt - 0.06, zt + 0.55, 0.13, 1.6, 'YZ', 'pal_grass_deep', off=0, apex_r=0.12)
    poly, s, k = chevron(0.72, zt - 0.06, zt + 0.55, 0.13)
    prism(fillet(house_profile(0.5, zt - 0.1, zt - 0.08, zt + 0.55 - k - 0.03), 0.02, seg=2), 1.3, 'YZ', c=(0, 0.12, 0), mat='pal_pink', bev=0.04)
    for row, z in enumerate((zp + 0.42, zp + 0.8)):
        for x in (-0.4, 0.0, 0.4):
            cyl(0.11, 0.03, (x, -0.38, z), 'pal_ink', bev=0.01, rot=(pi / 2, 0, 0), center=True)
            torus(0.12, 0.025, (x, -0.395, z), 'pal_cream', rot=(pi / 2, 0, 0), m=6, n=16)
        box((1.2, 0.13, 0.04), (0, -0.45, z - 0.15), 'pal_wood', r=0.018, segs=1)
    # front railing at 1.0 m? (it's a loft deck: low 0.5 rail)
    for x in (-0.74, 0.74):
        cyl(0.03, 0.5, (x, -0.66, zp + 0.12), 'pal_cream', bev=0.0, n=8)
    box((1.52, 0.05, 0.05), (0, -0.66, zp + 0.62), 'pal_cream', r=0.02, segs=1)
    with frame((0.45, -0.95, 0), (radians(-18), 0, 0)):
        for x in (-0.18, 0.18):
            box((0.06, 0.06, 2.2), (x, 0, 1.1), 'pal_wood', r=0.025, segs=1)
        for i in range(7):
            box((0.38, 0.045, 0.045), (0, 0, 0.25 + i * 0.3), 'pal_wood_dark', r=0.015, segs=1)

    def pigeon(c, yaw):
        with frame(c, (0, 0, yaw)):
            sphere(0.11, (0, 0.02, 0.1), 'pal_stone', scale=(0.85, 1.25, 0.9), u=14, v=9)
            sphere(0.075, (0, -0.1, 0.2), 'pal_white', u=12, v=8)
            cyl(0.025, 0.05, (0, -0.17, 0.19), 'pal_coral', bev=0.0, r2=0.003, rot=(pi / 2, 0, 0), n=8)
            for sx in (-1, 1):
                sphere(0.014, (sx * 0.045, -0.15, 0.22), 'pal_ink', u=6, v=5)
            prism([(-0.05, 0.1), (0.05, 0.1), (0, 0.24)], 0.03, 'XY', c=(0, 0, 0.12), mat='pal_stone', bev=0.01, segs=1)
    pigeon((-0.35, -0.55, zp + 0.12), 0.3)
    pigeon((0.2, 0.1, zt + 0.45), -0.5)
    pigeon((-0.5, 0.3, zt + 0.25), 1.2)
    sack((-0.85, -0.6, 0), 0.24, 'pal_sand', fill='pal_yellow')
    cyl(0.18, 0.06, (0.0, -0.75, 0), 'pal_sky', bev=0.02)
    cyl(0.15, 0.01, (0.0, -0.75, 0.055), 'pal_water', bev=0.0)


@asset('paper_plane', 'Paper plane message, origin at its centre, nose toward -Y.')
def a_paper_plane():
    paper_plane_parts(1.0)


# ============================================================================================ LEADPROFIT
@asset('warehouse', 'Quonset warehouse (adult scale). door = roll-up door 2.6 x 2.8, pivot on its top edge (rotate about X).')
def a_warehouse():
    W, D = 4.8, 3.8
    zs, rise = 2.55, 1.75
    z0 = 0.25
    box((W + 0.4, D + 0.4, z0), (0, 0, z0 / 2), 'pal_stone', r=0.09)
    prism(arch_profile(W, z0, zs, rise, 24), D, 'XZ', mat='pal_pink', bev=0.08, segs=2)
    box((W + 0.04, D + 0.04, 0.5), (0, 0, z0 + 0.25), 'pal_coral_deep', r=0.06)
    prism(arch_band(W / 2 + 0.24, rise + 0.24, W / 2 + 0.02, rise + 0.02, zs, -0.1, pi + 0.1, 26), D + 0.3, 'XZ',
          mat='pal_grass_light', bev=0.08, segs=3)
    for y in (-(D + 0.3) / 2 + 0.08, -0.65, 0.65, (D + 0.3) / 2 - 0.08):
        prism(arch_band(W / 2 + 0.33, rise + 0.33, W / 2 + 0.18, rise + 0.18, zs, -0.12, pi + 0.12, 22), 0.15, 'XZ',
              off=y, mat='pal_cream', bev=0.05, segs=1)
    for y in (-0.65, 0.65):
        turbine_vent((0, y + 0.0, zs + rise + 0.27))
    with frame((0, -D / 2, z0)):
        prism(u_frame(2.95, 3.0, 2.62, 2.82, 0.14, 0.07), 0.18, 'XZ', off=-0.05, mat='pal_wood', bev=0.05)
        with collect() as cd:
            for i in range(9):
                box((2.6, 0.08, 0.31), (0, -0.05, 0.155 + i * 0.31), 'pal_cream' if i % 2 == 0 else 'pal_stone', r=0.04, segs=2)
            box((0.4, 0.05, 0.07), (0, -0.11, 0.3), 'pal_ink', r=0.02, segs=1)
        special('door', cd.objs, (0, -0.05, 2.79))
        with frame((0, 0, 3.55)):
            window_round(0.32, 'pal_cream')
        wall_lantern((0, 0, 3.1))
        for sx in (-1, 1):
            brick_band(0.75, 0.6, (sx * 1.95, -0.02, 0.0))
        box((1.6, 0.06, 0.32), (0, -0.04, 0) if False else (-0.0, -0.1, 3.0) if False else (0, -0.04, -10), 'pal_navy', r=0.03) if False else None
    # loading dock
    box((W + 0.2, 0.75, 0.3), (0, -D / 2 - 0.5, 0.15), 'pal_wood', r=0.05)
    for i in range(8):
        box((0.04, 0.72, 0.02), (-W / 2 + 0.3 + i * 0.6, -D / 2 - 0.5, 0.3), 'pal_wood_dark', r=0.008, segs=1)
    for x in (-W / 2 - 0.05, W / 2 + 0.05):
        bollard((x, -D / 2 - 0.75, 0.3))
    coiled_rope((-W / 2 + 0.55, -D / 2 - 0.55, 0.3))
    # side door (-X)
    with frame((-W / 2, 0.6, z0), (0, 0, -pi / 2)):
        prism(u_frame(1.16, 2.2, 0.96, 2.08, 0.1, 0.06), 0.12, 'XZ', off=-0.02, mat='pal_cream', bev=0.03)
        door_slab(0.94, 2.06, 'pal_wood', t=0.06, arch=False)
        wall_lantern((0, 0, 2.4))
        box((1.1, 0.4, 0.12), (0, -0.25, -0.06), 'pal_stone', r=0.04)
    for sx in (-1, 1):
        drainpipe(sx * (W / 2 - 0.05), -D / 2 - 0.08, z0, zs, 'pal_cream')
    # cargo
    crate((1.5, -D / 2 - 0.55, 0.3), (0.55, 0.5, 0.48), rot=(0, 0, 0.1))
    crate_stack((W / 2 + 0.6, -0.9, 0), rotz=pi / 2)
    crate((W / 2 + 0.55, 0.3, 0), (0.6, 0.55, 0.52), rot=(0, 0, 0.08))
    barrel((W / 2 + 0.55, 1.05, 0), 'pal_sky')
    barrel((W / 2 + 0.5, 1.6, 0), 'pal_coral')
    box((0.9, 0.9, 0.12), (-W / 2 - 0.7, -1.0, 0.06), 'pal_wood_dark', r=0.03)
    for i, (dx, dy, z) in enumerate(((-0.2, -0.15, 0.12), (0.2, -0.15, 0.12), (-0.2, 0.2, 0.12), (0.2, 0.2, 0.12), (0.0, 0.0, 0.48))):
        sack((-W / 2 - 0.7 + dx, -1.0 + dy, z), 0.22, 'pal_sand' if i % 2 else 'pal_tan', squash=0.7, rotz=i)
    # hand trolley
    with frame((1.6, -D / 2 - 1.2, 0), (0, 0, 0.3)):
        for x in (-0.2, 0.2):
            tube([(x, 0.05, 0.1), (x, 0.15, 1.15)], 0.025, 'pal_coral', kind='POLY', bres=1, res=1)
            cyl(0.12, 0.06, (x * 1.25, 0.1, 0.12), 'pal_ink', bev=0.02, rot=(0, pi / 2, 0), center=True)
        box((0.5, 0.25, 0.04), (0, -0.07, 0.04), 'pal_coral', r=0.015, segs=1)
        tube([(-0.2, 0.15, 1.15), (0.2, 0.15, 1.15)], 0.025, 'pal_coral', kind='POLY', bres=1, res=1)
        parcel((0, -0.02, 0.06), (0.4, 0.28, 0.3))


@asset('crane', 'Dock crane (~6 m). arm pivot at the mast top (rotate about Z to swing); hook + crate ride on the arm.')
def a_crane():
    box((2.0, 2.0, 0.4), (0, 0, 0.2), 'pal_stone', r=0.12)
    for x in (-0.8, 0.8):
        for y in (-0.8, 0.8):
            cyl(0.16, 0.18, (x, y, 0.16), 'pal_ink', bev=0.05, rot=(0, pi / 2, 0), center=True)
    for k in range(4):
        box((0.42, 0.04, 0.1), (-0.7 + k * 0.47, -1.01, 0.25), 'pal_yellow' if k % 2 == 0 else 'pal_ink', r=0.02, segs=1)
    cyl(0.8, 0.14, (0, 0, 0.4), 'pal_navy', bev=0.05)
    box((1.4, 1.3, 1.5), (0, 0.15, 0.54 + 0.75), 'pal_coral', r=0.16, segs=3)
    box((0.95, 0.07, 0.6), (0, -0.5, 1.6), 'pal_glass', r=0.08, segs=2)
    box((0.07, 0.6, 0.5), (-0.7, 0.2, 1.6), 'pal_glass', r=0.06, segs=2)
    box((0.07, 0.55, 1.2), (0.7, 0.25, 1.15), 'pal_coral_deep', r=0.05, segs=2)
    box((1.48, 1.38, 0.14), (0, 0.15, 2.1), 'pal_cream', r=0.06)
    box((0.55, 0.55, 3.1), (0, 0.3, 2.15 + 1.55), 'pal_yellow', r=0.14, segs=3)
    for z in (2.9, 3.7, 4.5):
        box((0.62, 0.62, 0.12), (0, 0.3, z), 'pal_cream', r=0.05, segs=2)
    with frame((0.33, 0.3, 2.2)):
        for y in (-0.15, 0.15):
            box((0.04, 0.04, 2.9), (0.0, y, 1.45), 'pal_ink', r=0.015, segs=1)
        for i in range(9):
            box((0.04, 0.3, 0.035), (0.0, 0, 0.2 + i * 0.32), 'pal_ink', r=0.012, segs=1)
    zt = 5.3
    with collect() as ca:
        with frame((0, 0.3, zt)):
            cyl(0.4, 0.22, (0, 0, 0), 'pal_coral_deep', bev=0.06)
            box((0.42, 4.2, 0.42), (0, -1.2, 0.4), 'pal_yellow', r=0.14, segs=3)
            for k in range(6):
                box((0.44, 0.08, 0.44), (0, -2.9 + k * 0.62, 0.4), 'pal_cream', r=0.04, segs=1)
            box((0.75, 0.75, 0.65), (0, 1.1, 0.4), 'pal_stone', r=0.14)
            tube([(0, -0.1, 0.62), (0, -1.5, 1.15), (0, -3.1, 0.62)], 0.022, 'pal_ink')
            box((0.14, 0.14, 0.62), (0, -0.1, 0.75), 'pal_yellow', r=0.05, segs=1)
            cyl(0.11, 0.1, (0, -3.1, 0.18), 'pal_ink', bev=0.03, rot=(0, pi / 2, 0), center=True)
            tube([(0, -3.1, 0.15), (0, -3.1, -2.0)], 0.018, 'pal_ink', kind='POLY', bres=1, res=1)
            torus(0.09, 0.028, (0, -3.1, -2.08), 'pal_coral_deep', rot=(pi / 2, 0, 0), m=6, n=14, arc=(pi * 0.1, pi * 1.65))
            for sx in (-1, 1):
                tube([(0, -3.1, -2.0), (sx * 0.24, -3.1, -2.45)], 0.013, 'pal_ink', kind='POLY', bres=1, res=1)
            crate((0, -3.1, -2.95), (0.55, 0.5, 0.48))
            sphere(0.07, (0, -3.3, 0.66), 'pal_emissive', u=10, v=7)
    special('arm', ca.objs, (0, 0.3, zt))
    bollard((-1.2, -1.1, 0))
    coiled_rope((1.25, -1.1, 0))


@asset('price_board', 'Live price ticker board on legs (screen 1.9 x 1.2, centre 2.4 m), lamps and an up-arrow topper.')
def a_price_board():
    zc = 2.4
    for x in (-0.95, 0.95):
        box((0.15, 0.15, zc), (x, 0.04, zc / 2), 'pal_cream', r=0.06)
        box((0.34, 0.34, 0.13), (x, 0.04, 0.065), 'pal_stone', r=0.05)
    box((2.24, 0.18, 1.5), (0, 0, zc), 'pal_navy', r=0.09)
    quad('screen', 1.9, 1.2, (0, -0.095, zc))
    box((2.4, 0.5, 0.1), (0, -0.1, zc + 0.82), 'pal_coral_deep', r=0.045, rot=(radians(-10), 0, 0))
    poly = [(-0.12, 0), (0.12, 0), (0.12, 0.22), (0.28, 0.22), (0.0, 0.52), (-0.28, 0.22), (-0.12, 0.22)]
    prism(fillet(poly, 0.04, seg=2), 0.14, 'XZ', mat='pal_coral', bev=0.04, c=(0.7, 0, zc + 0.88), rot=(0, -0.3, 0))
    for k, x in enumerate((-0.7, -0.56)):
        cyl(0.17, 0.08, (x, 0.0, zc + 0.97 - k * 0.04), 'pal_yellow', bev=0.03, rot=(pi / 2, 0, 0), center=True)
    for x in (-0.6, 0.6):
        tube([(x, -0.1, zc + 0.75), (x, -0.4, zc + 0.85)], 0.02, 'pal_ink', kind='POLY', bres=1, res=1)
        cyl(0.08, 0.13, (x, -0.42, zc + 0.78), 'pal_ink', bev=0.02, r2=0.05, rot=(radians(-130), 0, 0))
    bush((0, -0.3, 0), 0.22, 'pal_grass', seed=40, flowers='pal_yellow')


# ============================================================================================ DSME
@asset('glass_tower', 'DSME office tower (~9.6 m): cream frame floors, pal_glass window bands, balconies, rooftop tank and solar panels.')
def a_glass_tower():
    S = 3.2
    rr = 0.55

    def rprism(w, h, z0, mat, r, bev, d=None):
        d = d or w
        prism(fillet([(-w / 2, -d / 2), (w / 2, -d / 2), (w / 2, d / 2), (-w / 2, d / 2)], r, seg=5), h, 'XY', off=z0 + h / 2, mat=mat, bev=bev)

    rprism(S + 0.9, 0.25, 0.0, 'pal_stone', rr + 0.3, 0.08)
    rprism(S - 0.25, 2.8, 0.25, 'pal_glass', rr - 0.1, 0.05)
    for k in range(4):
        a = k * pi / 2 + pi / 4
        box((0.3, 0.3, 2.8), ((S / 2 - 0.25) * cos(a) * 1.0, (S / 2 - 0.25) * sin(a) * 1.0, 1.65), 'pal_cream', r=0.1)
    z = 3.05
    fh = 1.95
    for i in range(3):
        rprism(S + 0.16, 0.3, z, 'pal_cream', rr + 0.06, 0.1)
        rprism(S - 0.18, fh - 0.3 + 0.06, z + 0.27, 'pal_glass', rr - 0.06, 0.05)
        for k in range(4):
            a = k * pi / 2
            for u in (-0.55, 0.0, 0.55):
                x, y = u, -(S - 0.18) / 2 - 0.02
                xr = x * cos(a) - y * sin(a)
                yr = x * sin(a) + y * cos(a)
                box((0.12, 0.1, fh - 0.3), (xr, yr, z + 0.3 + (fh - 0.3) / 2), 'pal_cream', r=0.04, rot=(0, 0, a), segs=1)
        if i < 2:
            # small front balcony with glass rail (1.0 m)
            box((1.5, 0.6, 0.12), (0.55, -S / 2 - 0.25, z + 0.3), 'pal_cream', r=0.05)
            box((1.5, 0.12, 0.55), (0.55, -S / 2 - 0.5, z + 0.62), 'pal_cream', r=0.05)
            for xx in (-0.15, 1.25):
                box((0.12, 0.6, 0.55), (xx, -S / 2 - 0.25, z + 0.62), 'pal_cream', r=0.05)
            potted((1.05, -S / 2 - 0.3, z + 0.36), 0.12, 0.22, 'pal_grass', 'pal_coral')
        z += fh
    rprism(S + 0.24, 0.32, z, 'pal_cream', rr + 0.09, 0.11)
    rprism(S - 0.3, 0.35, z + 0.32, 'pal_cream', rr - 0.05, 0.1)
    zr = z + 0.32
    water_tank((0.75, 0.6, zr), r=0.4, h=0.6, mat='pal_sky')
    solar_panel((-0.65, 0.55, zr), rotz=0.0, w=1.0, d=0.6)
    solar_panel((-0.65, -0.3, zr), rotz=0.0, w=1.0, d=0.6)
    box((0.6, 0.45, 0.4), (0.7, -0.6, zr + 0.2), 'pal_stone', r=0.08)
    cyl(0.15, 0.04, (0.7, -0.82, zr + 0.2), 'pal_ink', bev=0.01, rot=(pi / 2, 0, 0), center=True)
    cyl(0.03, 0.9, (1.2, 1.2, zr), 'pal_cream', bev=0.01, n=8)
    sphere(0.06, (1.2, 1.2, zr + 0.95), 'pal_coral', u=10, v=7)
    for (x, y, r) in ((-1.2, -1.15, 0.22),):
        cyl(r * 0.8, 0.14, (x, y, zr), 'pal_coral_deep', bev=0.04)
        sphere(r, (x, y, zr + 0.14 + r * 0.7), 'pal_grass', u=14, v=9)
    for k in range(2):
        with frame((-(S - 0.18) / 2 - 0.02, 0.7, 3.55 + k * 1.95), (0, 0, -pi / 2)):
            ac_unit((0, 0, 0))
    dish_antenna((1.25, -1.2, zr + 0.05), (0, 0, radians(30)))
    # entrance
    box((1.9, 0.95, 0.15), (0, -S / 2 - 0.35, 2.6), 'pal_cream', r=0.06)
    for x in (-0.8, 0.8):
        cyl(0.06, 2.35, (x, -S / 2 - 0.72, 0.25), 'pal_cream', bev=0.02, n=12)
    box((1.4, 0.08, 2.2), (0, -S / 2 + 0.06, 0.25 + 1.1), 'pal_sky', r=0.04)
    box((0.05, 0.1, 2.15), (0, -S / 2 + 0.02, 0.25 + 1.1), 'pal_cream', r=0.015, segs=1)
    box((1.5, 0.08, 0.28), (0, -S / 2 - 0.85, 2.88), 'pal_navy', r=0.05)
    for x in (-1.45, 1.45):
        box((0.6, 0.6, 0.45), (x, -S / 2 - 0.65, 0.25 + 0.225), 'pal_cream', r=0.08)
        sphere(0.3, (x, -S / 2 - 0.65, 0.95), 'pal_grass', u=16, v=10)
    bench((-1.6, 0.6, 0.25), rotz=-pi / 2, L=1.2)


@asset('globe_sculpture', 'Globe on a plinth (~3.2 m) with a flower ring. globe pivot at the globe centre (spin about Z).')
def a_globe_sculpture():
    revolve(fillet([(0, 0), (0.75, 0), (0.75, 0.22), (0.52, 0.27), (0.44, 0.36), (0.4, 1.15), (0.52, 1.2), (0.56, 1.34), (0, 1.34)],
                   [0, 0.04, 0.06, 0.04, 0.05, 0.06, 0.04, 0.04, 0], seg=3, closed=False),
            ['pal_cream', 'pal_coral'], steps=36,
            mfn=lambda f: 1 if f.calc_center_median().z > 1.17 or f.calc_center_median().z < 0.24 else 0)
    box((0.44, 0.05, 0.26), (0, -0.42, 0.75), 'pal_navy', r=0.03, rot=(0.04, 0, 0), segs=1)
    torus(1.05, 0.16, (0, 0, 0.12), 'pal_grass_deep', n=40, m=8)
    rnd = random.Random(4)
    for k in range(14):
        a = k * 2 * pi / 14 + rnd.uniform(-0.1, 0.1)
        sphere(0.06, (1.05 * cos(a), 1.05 * sin(a), 0.3), FLOWERS[k % 5], u=10, v=7)
    R = 0.75
    cz = 1.34 + R + 0.12
    cyl(0.08, 0.25, (0, 0, 1.3), 'pal_coral', bev=0.02)
    torus(R + 0.12, 0.05, (0, 0, cz), 'pal_coral', rot=(pi / 2, 0, 0.5), arc=(-pi / 2 - 0.05, pi / 2 + 0.05), n=36, m=8)
    sphere(0.07, (0, 0, cz + R + 0.15), 'pal_yellow', u=10, v=7)
    with collect() as cg:
        sphere(R, (0, 0, cz), 'pal_water', u=32, v=20)
        blobs = [(-0.3, 0.5, 0.33), (0.4, 0.35, 0.26), (1.4, -0.2, 0.3), (2.2, 0.1, 0.28), (3.0, 0.55, 0.22),
                 (3.6, -0.45, 0.25), (4.6, 0.2, 0.31), (5.4, -0.3, 0.21), (2.6, -0.6, 0.19), (0.9, 0.85, 0.17)]
        for lon, lat, r in blobs:
            n = Vector((cos(lat) * cos(lon), cos(lat) * sin(lon), sin(lat)))
            p = Vector((0, 0, cz)) + n * (R - 0.015)
            rot = n.to_track_quat('Z', 'Y').to_euler()
            sphere(r, tuple(p), 'pal_grass', scale=(1.0, 0.75, 0.18), rot=tuple(rot), u=12, v=8)
        for sz in (1, -1):
            sphere(0.25, (0, 0, cz + sz * (R - 0.05)), 'pal_white', scale=(1, 1, 0.25), u=16, v=8)
    special('globe', cg.objs, (0, 0, cz))


# ============================================================================================ MOBILE
@asset('phone_monolith', 'Giant rounded phone standing upright (2.4 m). screen 1.02 x 1.95. Uplights in the plinth.')
def a_phone_monolith():
    box((1.7, 0.95, 0.18), (0, 0.05, 0.09), 'pal_stone', r=0.08)
    box((1.5, 0.75, 0.08), (0, 0.05, 0.2), 'pal_cream', r=0.035)
    box((1.22, 0.3, 2.2), (0, 0.04, 0.24 + 1.1), 'pal_sky', r=0.16, segs=3)
    quad('screen', 1.02, 1.95, (0, -0.111, 1.34))
    box((0.3, 0.03, 0.05), (0, -0.105, 2.37), 'pal_navy', r=0.02, segs=1)
    sphere(0.035, (0.25, -0.11, 2.37), 'pal_navy', u=10, v=7)
    for z, h in ((1.9, 0.3), (1.5, 0.2)):
        box((0.05, 0.12, h), (0.62, 0.04, z), 'pal_cream', r=0.02, segs=1)
    box((0.38, 0.06, 0.38), (-0.3, 0.2, 2.1), 'pal_cream', r=0.08)
    for x, z in ((-0.38, 2.18), (-0.22, 2.02)):
        cyl(0.055, 0.04, (x, 0.23, z), 'pal_ink', bev=0.012, rot=(pi / 2, 0, 0), center=True)
    for x in (-0.55, 0.55):
        cyl(0.07, 0.04, (x, -0.3, 0.22), 'pal_ink', bev=0.012)
        cyl(0.05, 0.02, (x, -0.3, 0.26), 'pal_emissive', bev=0.0)
    bush((-0.75, 0.3, 0), 0.2, 'pal_grass', seed=60)


@asset('signal_tower', 'Rounded mint signal tower (~6.5 m) with dishes, fins and ladder. rings empty = where the engine spawns pulse rings.')
def a_signal_tower():
    revolve(fillet([(0, 0), (0.9, 0), (0.9, 0.25), (0.6, 0.34), (0, 0.34)], [0, 0.04, 0.08, 0.06, 0], seg=3, closed=False), 'pal_stone', steps=36)

    def band(f):
        z = f.calc_center_median().z
        return 1 if (1.6 < z < 1.8 or 3.1 < z < 3.3 or 4.4 < z < 4.6) else 0
    revolve([(0, 0.34), (0.42, 0.34), (0.36, 1.6), (0.36, 1.8), (0.29, 3.1), (0.29, 3.3), (0.22, 4.4), (0.22, 4.6), (0.16, 5.3), (0, 5.3)],
            ['pal_grass_light', 'pal_cream'], steps=28, mfn=band, sharp=30)
    for z, r in ((1.7, 0.62), (3.2, 0.52), (4.5, 0.42)):
        cyl(r, 0.12, (0, 0, z - 0.06), 'pal_cream', bev=0.05)
        cyl(r - 0.06, 0.05, (0, 0, z + 0.05), 'pal_sky', bev=0.02)
    with frame((0, -0.34, 0.34), (radians(-2.5), 0, 0)):
        for x in (-0.15, 0.15):
            box((0.04, 0.04, 3.0), (x, 0, 1.5), 'pal_navy', r=0.015, segs=1)
        for i in range(9):
            box((0.3, 0.035, 0.035), (0, 0, 0.25 + i * 0.32), 'pal_navy', r=0.012, segs=1)
    sphere(0.32, (0, 0, 5.5), 'pal_sky', u=20, v=13)
    torus(0.36, 0.05, (0, 0, 5.5), 'pal_cream', n=24, m=6)
    cyl(0.03, 0.6, (0, 0, 5.75), 'pal_cream', bev=0.0, n=8)
    sphere(0.1, (0, 0, 6.42), 'pal_emissive', u=12, v=8)
    for a, zz, sz in ((-0.7, 4.0, 1.0), (2.3, 4.0, 1.0), (0.9, 2.6, 1.3)):
        with frame((0.3 * cos(a), 0.3 * sin(a), zz), (0, radians(75), a)):
            cyl(0.02, 0.2, (0, 0, 0), 'pal_cream', bev=0.0, n=6)
            revolve([(0, 0.18), (0.26 * sz, 0.26), (0.3 * sz, 0.31), (0.28 * sz, 0.32), (0, 0.23)], 'pal_white', steps=20, sharp=70)
            sphere(0.035, (0, 0, 0.36), 'pal_coral', u=8, v=6)
    box((0.55, 0.4, 0.65), (0.85, 0.45, 0.325), 'pal_cream', r=0.08)
    box((0.04, 0.02, 0.3), (0.85, 0.24, 0.4), 'pal_ink', r=0.01, segs=1)
    sphere(0.035, (0.75, 0.24, 0.55), 'pal_emissive', u=8, v=6)
    bush((-0.8, -0.5, 0), 0.2, 'pal_grass', seed=77)
    marker('rings', (0, 0, 5.9))


# ============================================================================================ SERVICES
def stall_frame(accent, stripe_mats, roof=True):
    T = 0.95
    for x in (-1.1, 1.1):
        for y in (-0.7, 0.7):
            cyl(0.06, 2.6, (x, y, 0), 'pal_cream', bev=0.025, n=10, segs=1)
    box((2.2, 0.7, T - 0.08), (0, -0.15, (T - 0.08) / 2), 'pal_wood', r=0.06)
    box((1.9, 0.04, 0.6), (0, -0.51, 0.45), accent, r=0.03)
    truck_trim(2.0, (0, -0.54, 0.82), h=0.13)
    tube_light((0, 0.67, 2.3), L=1.0)
    box((2.36, 0.86, 0.08), (0, -0.15, T - 0.04), 'pal_cream', r=0.04)
    box((2.2, 0.05, 1.5), (0, 0.7, 1.75), 'pal_pink', r=0.025)
    if roof:
        box((2.5, 1.75, 0.15), (0, 0, 2.67), 'pal_cream', r=0.07, segs=3)
    with collect() as ca:
        with frame((0, -0.86, 2.6), (radians(-18), 0, 0)):
            stripes_panel(2.5, 0.72, 7, stripe_mats, t=0.07)
            box((2.56, 0.1, 0.1), (0, 0, -0.02), accent, r=0.045, segs=1)
    special('awning', ca.objs, (0, -0.86, 2.6))
    marker('use', (0, -1.45, 0), rotz=pi)
    cyl(0.18, 0.07, (0.75, 0.25, 0.42), 'pal_wood', bev=0.025)
    for a in range(3):
        aa = a * 2 * pi / 3
        cyl(0.022, 0.42, (0.75 + 0.11 * cos(aa), 0.25 + 0.11 * sin(aa), 0), 'pal_cream', bev=0.0, n=6)
    crate((-1.45, -0.2, 0), (0.5, 0.42, 0.36), rot=(0, 0, 0.25))


def stall_sign(accent, z=3.05, y=-0.72, w=1.6):
    box((w + 0.2, 0.1, 0.56), (0, y, z), accent, r=0.06)
    quad('label', w, 0.4, (0, y - 0.052, z), mat='pal_cream')
    for x in (-w / 2 + 0.12, w / 2 - 0.12):
        cyl(0.03, 0.3, (x, y + 0.02, z - 0.55), 'pal_cream', bev=0.0, n=8)


@asset('stall_whatsapp', 'Service stall: WhatsApp AI. Chat-bubble canopy; awning pivot at the front hinge; counter 0.95 m.')
def a_stall_whatsapp():
    stall_frame('pal_grass', ['pal_grass', 'pal_cream'], roof=False)
    box((2.6, 1.8, 0.6), (0, 0.0, 2.9), 'pal_grass_light', r=0.28, segs=3)
    prism(fillet([(0.65, 0.0), (1.12, 0.0), (1.12, -0.5)], [0, 0, 0.04], seg=2), 0.4, 'YZ', c=(0, 0.28, 2.65), mat='pal_grass_light', bev=0.06)
    for i, x in enumerate((-0.42, 0.0, 0.42)):
        sphere(0.13, (x, 0.0, 3.2), 'pal_white', scale=(1, 1, 0.6), u=14, v=9)
    stall_sign('pal_grass_deep', z=2.92, y=-0.92, w=1.5)
    with frame((0.6, -0.2, 0.95), (radians(-10), 0, 0.2)):
        box((0.24, 0.045, 0.44), (0, 0, 0.22), 'pal_navy', r=0.035, segs=1)
        box((0.2, 0.01, 0.38), (0, -0.022, 0.22), 'pal_white', r=0.004, segs=1)
        box((0.13, 0.02, 0.06), (-0.02, -0.03, 0.31), 'pal_grass', r=0.02, segs=1)
        box((0.11, 0.02, 0.06), (0.03, -0.03, 0.2), 'pal_sky', r=0.02, segs=1)
    for i, (x, z, w) in enumerate(((-0.75, 2.2, 0.4), (-0.25, 2.05, 0.32), (0.3, 2.25, 0.36))):
        cyl(0.008, 0.38, (x, 0.0, z + 0.12), 'pal_cream', bev=0.0, n=6)
        box((w, 0.06, 0.2), (x, 0.0, z), ['pal_grass', 'pal_white', 'pal_grass_deep'][i], r=0.09, segs=2)
    with frame((-0.5, -0.25, 0.95)):
        box((0.4, 0.07, 0.24), (0, 0, 0.32), 'pal_grass', r=0.11, segs=2)
        cyl(0.02, 0.2, (0, 0, 0.0), 'pal_cream', bev=0.0, n=8)
    potted((1.45, -0.6, 0), 0.18, 0.36, 'pal_grass', 'pal_cream')


@asset('stall_saas', 'Service stall: SaaS & ERPs. Dashboard screen 1.2 x 0.72 on the counter; counter 0.95 m.')
def a_stall_saas():
    stall_frame('pal_sky', ['pal_sky', 'pal_cream'])
    stall_sign('pal_navy')
    with frame((-0.2, -0.05, 0.95)):
        box((1.34, 0.09, 0.84), (0, 0, 0.72), 'pal_navy', r=0.06)
        quad('screen', 1.2, 0.72, (0, -0.046, 0.72))
        box((0.1, 0.06, 0.32), (0, 0.05, 0.16), 'pal_navy', r=0.03, segs=1)
        box((0.36, 0.22, 0.04), (0, 0.03, 0.02), 'pal_navy', r=0.02, segs=1)
        box((0.5, 0.16, 0.03), (0, -0.3, 0.015), 'pal_stone', r=0.012, segs=1)
    for i, (h, m) in enumerate(((0.16, 'pal_grass'), (0.26, 'pal_yellow'), (0.38, 'pal_coral'))):
        box((0.1, 0.1, h), (0.55 + i * 0.13, -0.3, 0.95 + h / 2), m, r=0.04, segs=1)
    cyl(0.12, 0.05, (0.68, 0.08, 0.95), 'pal_coral', bev=0.02)
    prism([(0, 0), (0.13, 0), (0.0, 0.13)], 0.06, 'XY', off=0.95 + 0.05, c=(0.68, 0.08, 0), mat='pal_yellow', bev=0.015, segs=1)
    cyl(0.05, 0.1, (-0.85, -0.3, 0.95), 'pal_white', bev=0.015)
    potted((-0.95, 0.1, 0.95), 0.08, 0.14, 'pal_grass', 'pal_coral_deep')
    for i, m in enumerate(('pal_sky', 'pal_navy', 'pal_yellow')):
        box((0.06, 0.24, 0.32), (1.45, -0.6 + i * 0.07, 0.16), m, r=0.015, segs=1, rot=(0, 0.12 * i, 0))


@asset('stall_mobile', 'Service stall: Mobile apps. A stepped rack of pastel phones with chargers; counter 0.95 m.')
def a_stall_mobile():
    stall_frame('pal_coral', ['pal_coral', 'pal_cream'])
    stall_sign('pal_coral_deep')
    box((1.7, 0.24, 0.12), (0, -0.3, 1.01), 'pal_cream', r=0.05)
    box((1.7, 0.24, 0.3), (0, -0.04, 1.1), 'pal_cream', r=0.05)
    cols = ['pal_navy', 'pal_yellow', 'pal_grass', 'pal_pink', 'pal_sky', 'pal_coral_deep', 'pal_navy', 'pal_grass_light']
    k = 0
    for row, (y, z, n) in enumerate(((-0.3, 1.07, 4), (-0.04, 1.25, 4))):
        for i in range(n):
            x = -(n - 1) * 0.22 + i * 0.44 + (0.11 if row else 0)
            with frame((x, y, z), (radians(-10), 0, 0)):
                box((0.3, 0.06, 0.56), (0, 0, 0.28), cols[k % len(cols)], r=0.05, segs=1)
                box((0.25, 0.01, 0.46), (0, -0.031, 0.285), 'pal_white', r=0.004, segs=1)
                sphere(0.015, (0, -0.035, 0.53), 'pal_ink', u=6, v=5)
            k += 1
    tube([(-0.6, -0.3, 1.07), (-0.7, -0.45, 1.0), (-0.75, -0.55, 0.7), (-0.7, -0.55, 0.5)], 0.012, 'pal_white')
    tube([(0.6, -0.3, 1.07), (0.75, -0.45, 1.0), (0.8, -0.56, 0.75)], 0.012, 'pal_white')
    for i in range(3):
        parcel((1.45, -0.55 + i * 0.05, i * 0.22), (0.32, 0.24, 0.22), rotz=0.15 * i)


@asset('stall_desktop', 'Service stall: Desktop & automation. Monitor screen 1.04 x 0.62, cables, PC tower, gear; counter 0.95 m.')
def a_stall_desktop():
    stall_frame('pal_yellow', ['pal_yellow', 'pal_cream'])
    stall_sign('pal_navy')
    T = 0.95
    with frame((-0.2, -0.05, T)):
        box((1.18, 0.09, 0.76), (0, 0, 0.6), 'pal_cream', r=0.05)
        box((1.1, 0.02, 0.68), (0, -0.04, 0.6), 'pal_ink', r=0.01, segs=1)
        quad('screen', 1.04, 0.62, (0, -0.052, 0.6))
        cyl(0.04, 0.2, (0, 0.03, 0.0), 'pal_cream', bev=0.01)
        box((0.32, 0.22, 0.03), (0, 0.03, 0.015), 'pal_cream', r=0.012, segs=1)
        box((0.6, 0.18, 0.04), (0.0, -0.32, 0.02), 'pal_stone', r=0.015, segs=1)
        for i in range(3):
            box((0.52, 0.03, 0.012), (0, -0.37 + i * 0.045, 0.045), 'pal_cream', r=0.005, segs=1)
        box((0.08, 0.12, 0.03), (0.4, -0.3, 0.015), 'pal_cream', r=0.015, segs=1)
    box((0.3, 0.46, 0.56), (0.75, 0.02, T + 0.28), 'pal_stone', r=0.06)
    cyl(0.05, 0.02, (0.75, -0.215, T + 0.43), 'pal_emissive', bev=0.0, rot=(pi / 2, 0, 0), center=True)
    with frame((0.75, 0.0, T + 0.72), (pi / 2, 0, 0)):
        cyl(0.13, 0.08, (0, 0, 0), 'pal_coral', bev=0.02, center=True)
        for i in range(8):
            a = i * pi / 4
            box((0.07, 0.07, 0.08), (0.15 * cos(a), 0.15 * sin(a), 0), 'pal_coral', r=0.02, rot=(0, 0, a), segs=1)
        cyl(0.05, 0.1, (0, 0, 0), 'pal_cream', bev=0.015, center=True)
    tube([(-0.2, 0.03, 1.15), (-0.25, 0.25, 1.0), (-0.55, -0.1, 0.97), (-0.65, -0.6, 0.92), (-0.75, -0.65, 0.45), (-1.05, -0.9, 0.04)], 0.025, 'pal_navy')
    tube([(0.65, -0.1, 1.04), (0.45, -0.5, 0.97), (0.35, -0.6, 0.62), (0.5, -0.8, 0.05), (0.9, -1.0, 0.04)], 0.025, 'pal_ink')
    box((0.08, 0.05, 0.12), (-1.05, -0.92, 0.07), 'pal_yellow', r=0.02, segs=1)
    box((0.5, 0.35, 0.3), (1.45, -0.55, 0.15), 'pal_cream', r=0.06)
    box((0.42, 0.04, 0.22), (1.45, -0.73, 0.17), 'pal_navy', r=0.02, segs=1)


# ============================================================================================ TIMELINE
def flag_post(H, pr, flag_w, flag_h, flag_mat, plate_w, plate_h, plate_z, finial='pal_yellow', summit=False):
    if summit:
        rnd = random.Random(5)
        for i, (x, y, r) in enumerate(((-0.3, 0.1, 0.38), (0.3, 0.05, 0.33), (0.0, -0.25, 0.3), (0.05, 0.3, 0.28), (-0.42, -0.3, 0.2), (0.45, -0.3, 0.18))):
            sphere(r, (x, y, r * 0.45), 'pal_stone', scale=(1.1, 1.0, 0.7), rot=(0, 0, rnd.random()), u=12, v=8)
        cyl(0.2, 0.32, (0, 0, 0.1), 'pal_cream', bev=0.06)
        for k in range(5):
            a = k * 2 * pi / 5 + 0.4
            sphere(0.06, (0.62 * cos(a), 0.55 * sin(a), 0.08), FLOWERS[k], u=10, v=7)
    else:
        revolve(fillet([(0, 0), (0.32, 0), (0.28, 0.13), (0.1, 0.17), (0, 0.17)], [0, 0.03, 0.06, 0.04, 0], seg=3, closed=False), 'pal_stone', steps=28)
    cyl(pr, H, (0, 0, 0.1), 'pal_cream', bev=pr * 0.4)
    if summit:
        poly = []
        for i in range(10):
            a = pi / 2 + i * pi / 5
            rr = 0.26 if i % 2 == 0 else 0.12
            poly.append((rr * cos(a), rr * sin(a)))
        prism(fillet(poly, 0.02, seg=2), 0.1, 'XZ', c=(0, 0, H + 0.38), mat='pal_yellow', bev=0.03, segs=2)
    else:
        sphere(pr * 1.7, (0, 0, H + 0.12), finial, u=14, v=9)
    box((plate_w + 0.14, 0.08, plate_h + 0.14), (0, -pr - 0.04, plate_z), 'pal_wood', r=0.04)
    quad('label', plate_w, plate_h, (0, -pr - 0.082, plate_z), mat='pal_cream')
    with collect() as cf:
        nx, nz = 12, 3
        bm = bmesh.new()
        grid = []
        for i in range(nx + 1):
            u = i / nx
            row = []
            hh = flag_h * (1 - 0.35 * u)
            for j in range(nz + 1):
                v = j / nz - 0.5
                x = pr + u * flag_w
                y = 0.07 * sin(u * pi * 2.0) * u
                z = H - flag_h / 2 + v * hh - 0.04 * u
                row.append(bm.verts.new((x, y, z)))
            grid.append(row)
        for i in range(nx):
            for j in range(nz):
                bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
        ob = _finish(bm, flag_mat, None, bev=0, sharp=0, wn=False, name='flagcloth')
        so = ob.modifiers.new('sol', 'SOLIDIFY')
        so.thickness = 0.04
        so.offset = 0
        b = ob.modifiers.new('bev', 'BEVEL')
        b.width = 0.015
        b.segments = 2
        b.limit_method = 'ANGLE'
        b.angle_limit = radians(40)
        ring = 'pal_coral_deep' if flag_mat != 'pal_coral_deep' else 'pal_cream'
        cyl(pr * 1.25, 0.08, (0, 0, H - flag_h / 2 - 0.06), ring, bev=0.02)
        cyl(pr * 1.25, 0.08, (0, 0, H + flag_h / 2 - 0.02), ring, bev=0.02)
    special('flag', cf.objs, (0, 0, H))


@asset('milestone_flag', 'Timeline milestone: post (2.7 m), label plate 0.8 x 0.45 at eye height, flag pivot at the pole top (flutter about Z).')
def a_milestone_flag():
    flag_post(2.6, 0.065, 0.8, 0.55, 'pal_coral', 0.8, 0.45, 1.5)
    hanging_lantern((0.0, -0.18, 2.25), chain=0.12) if False else None
    sphere(0.12, (0.25, -0.15, 0.06), 'pal_grass_deep', scale=(1.3, 1, 0.7), u=12, v=8)
    sphere(0.05, (0.3, -0.2, 0.15), 'pal_yellow', u=10, v=7)


@asset('summit_flag', 'Summit "Today" flag (4.2 m): cairn, star finial, big label plate 1.2 x 0.66, flag pivot at the pole.')
def a_summit_flag():
    flag_post(4.0, 0.1, 1.4, 0.95, 'pal_yellow', 1.2, 0.66, 1.6, summit=True)


# ============================================================================================ GITHUB
BOOK_COLS = ['pal_coral', 'pal_sky', 'pal_yellow', 'pal_grass', 'pal_navy', 'pal_pink', 'pal_coral_deep', 'pal_grass_deep', 'pal_peach']


def book_parts(c=(0, 0, 0), h=0.25, d=0.18, t=0.055, mat='pal_coral', lean=0.0, detail=True):
    with frame(c, (0, lean, 0)):
        if detail:
            box((t, d, h), (0, 0, h / 2), mat, r=0.014, segs=2)
            box((t - 0.012, d - 0.008, h - 0.022), (0, 0.008, h / 2), 'pal_white', r=0.006, segs=1)
            for z in (0.035, h - 0.035):
                box((t + 0.004, 0.02, 0.014), (0, -d / 2 + 0.006, z), 'pal_yellow', r=0.005, segs=1)
        else:
            box((t, d, h), (0, 0, h / 2), mat, r=0.016, segs=1)


@asset('library_kiosk', 'GitHub library kiosk (adult scale): four open shelves of books, lantern, bench, book cart. use = stand point.')
def a_library_kiosk():
    W, D = 3.0, 1.4
    z0 = 0.18
    box((W + 0.5, D + 0.6, z0), (0, -0.1, z0 / 2), 'pal_stone', r=0.07)
    for x in (-W / 2 + 0.09, W / 2 - 0.09):
        box((0.18, D, 2.6), (x, 0, z0 + 1.3), 'pal_pink', r=0.06)
    box((W, 0.12, 2.6), (0, D / 2 - 0.06, z0 + 1.3), 'pal_pink', r=0.05)
    with frame((-W / 2, 0.0, 1.75), (0, 0, -pi / 2)):
        window_round(0.24, 'pal_cream')
    shelf_z = [z0 + 0.12, 0.78, 1.3, 1.82]
    box((W - 0.24, D - 0.1, 0.12), (0, 0.0, z0 + 0.06), 'pal_wood', r=0.035)
    for z in shelf_z[1:]:
        box((W - 0.24, D - 0.35, 0.07), (0, 0.14, z - 0.035), 'pal_wood', r=0.03)
    rnd = random.Random(21)
    k = 0
    for si, z in enumerate(shelf_z):
        x = -W / 2 + 0.26
        while x < W / 2 - 0.36:
            h = 0.3 + 0.1 * rnd.random()
            t = 0.09 + 0.05 * rnd.random()
            lean = 0.25 if rnd.random() < 0.1 else 0.0
            book_parts((x + t / 2, 0.1, z), h=h, d=0.28, t=t, mat=BOOK_COLS[k % len(BOOK_COLS)], lean=lean, detail=False)
            x += t + 0.015 + (0.06 if lean else 0)
            k += 1
            if rnd.random() < 0.08:
                x += 0.15
    za, ze = 3.6, 2.75
    gable_roof(D / 2 + 0.45, ze, za, 0.17, W + 0.45, 'YZ', 'pal_grass_deep', apex_r=0.2)
    poly, s, kk = chevron(D / 2 + 0.45, ze, za, 0.17)
    zw = za - kk - s * (D / 2)
    prism(fillet(house_profile(D / 2, z0 + 2.55, zw, za - kk - 0.02), 0.02, seg=2), W, 'YZ', mat='pal_cream', bev=0.04)
    box((W + 0.08, 0.18, 0.24), (0, -D / 2 + 0.06, z0 + 2.6), 'pal_cream', r=0.06)
    truck_trim(W - 0.1, (0, -D / 2 - 0.04, z0 + 2.6), h=0.14)
    with frame((0, -D / 2 - 0.05, z0 + 3.0)):
        for sx in (-1, 1):
            box((0.3, 0.05, 0.21), (sx * 0.15, 0, 0), 'pal_white', r=0.03, rot=(0, sx * 0.18, 0), segs=1)
        box((0.05, 0.06, 0.25), (0, -0.01, -0.01), 'pal_coral', r=0.015, segs=1)
    hanging_lantern((W / 2 - 0.25, -D / 2 - 0.15, z0 + 2.5), chain=0.25)
    # book cart, stool, bench, plants
    with frame((W / 2 + 0.55, -0.55, 0)):
        box((0.7, 0.4, 0.08), (0, 0, 0.5), 'pal_wood', r=0.03)
        box((0.7, 0.4, 0.06), (0, 0, 0.18), 'pal_wood', r=0.03)
        for x in (-0.3, 0.3):
            for y in (-0.15, 0.15):
                cyl(0.02, 0.5, (x, y, 0.08), 'pal_cream', bev=0.0, n=6)
                sphere(0.05, (x, y, 0.05), 'pal_ink', u=8, v=6)
        for i, m in enumerate(('pal_sky', 'pal_coral', 'pal_yellow', 'pal_grass')):
            box((0.1, 0.3, 0.26), (-0.22 + i * 0.13, 0, 0.67), m, r=0.015, segs=1, rot=(0, 0.1 * (i - 1.5), 0))
    bench((-W / 2 - 0.45, -0.45, 0), rotz=-pi / 2, L=1.2)
    potted((-W / 2 + 0.2, -D / 2 - 0.45, z0), 0.16, 0.32, 'pal_grass', 'pal_coral')
    marker('use', (0, -1.35, 0), rotz=pi)


@asset('book', 'Single repo book, 0.25 m tall, origin at bottom; spine faces -Y.')
def a_book():
    book_parts((0, 0, 0), h=0.25, d=0.18, t=0.055, mat='pal_coral')


# ============================================================================================ TOOLSHED
@asset('toolshed', 'Garden shed (adult scale). door hinge left edge. Shelf crates label_0..3 = top-left, top-right, bottom-left, bottom-right.')
def a_toolshed():
    W, D = 3.2, 2.4
    z0 = 0.16
    box((W + 0.5, D + 0.5, z0), (0, -0.05, z0 / 2), 'pal_stone', r=0.07)
    za, ze = 3.75, 2.5
    poly, s, k = chevron(W / 2 + 0.32, ze, za, 0.2)
    zw = za - k - s * (W / 2)
    prism(fillet(house_profile(W / 2, z0, zw, za - k - 0.02), [0, 0, 0.02, 0.08, 0.02], seg=4), D, 'XZ', mat='pal_sky', bev=0.06, segs=3)
    for x in (-W / 2, W / 2):
        for y in (-D / 2, D / 2):
            box((0.14, 0.14, zw - z0), (x, y, z0 + (zw - z0) / 2), 'pal_cream', r=0.05, segs=2)
    box((W + 0.02, D + 0.02, 0.35), (0, 0, z0 + 0.175), 'pal_cream', r=0.05)
    gable_roof(W / 2 + 0.32, ze, za, 0.2, D + 0.5, 'XZ', 'pal_coral_deep', apex_r=0.22)
    cyl(0.08, 0.7, (0.75, 0.5, za - s * 0.75 - 0.25), 'pal_stone', bev=0.02)
    cyl(0.13, 0.08, (0.75, 0.5, za - s * 0.75 + 0.45), 'pal_stone', bev=0.03, r2=0.08)
    with frame((-0.75, -D / 2, z0)):
        prism(u_frame(1.2, 2.24, 0.98, 2.1, 0.06, 0.04), 0.12, 'XZ', off=-0.02, mat='pal_cream', bev=0.03)
        with collect() as cd:
            box((0.96, 0.07, 2.06), (0, -0.035, 1.03), 'pal_wood', r=0.03)
            for z in (0.35, 1.7):
                box((0.88, 0.04, 0.12), (0, -0.09, z), 'pal_cream', r=0.025, segs=1)
            box((0.1, 0.04, 1.58), (0, -0.095, 1.03), 'pal_cream', r=0.025, rot=(0, -0.55, 0), segs=1)
            sphere(0.05, (0.36, -0.12, 1.05), 'pal_ink', u=10, v=7)
        special('door', cd.objs, (-0.48, -0.035, 0))
        with frame((0, 0, 2.55)):
            window_round(0.2, 'pal_cream', cross=False)
        wall_lantern((0.72, 0, 1.95))
    with frame((0.65, -D / 2 - 0.3, z0)):
        for x in (-0.66, 0.66):
            box((0.08, 0.5, 1.95), (x, 0, 0.975), 'pal_wood', r=0.03, segs=2)
        for z in (0.12, 0.98):
            box((1.38, 0.52, 0.06), (0, 0, z), 'pal_wood', r=0.025, segs=1)
        box((1.42, 0.52, 0.07), (0, 0, 1.95), 'pal_wood_dark', r=0.03, segs=1)
        idx = 0
        for z in (1.01, 0.15):
            for x in (-0.3, 0.3):
                crate((x, 0.0, z), (0.56, 0.4, 0.62))
                quad('label_%d' % idx, 0.46, 0.21, (x, -0.206, z + 0.31), mat='pal_cream')
                idx += 1
        with frame((0.3, 0.02, 1.985)):
            cyl(0.11, 0.2, (0, 0, 0), 'pal_coral', bev=0.03)
            tube([(-0.09, 0, 0.06), (-0.22, 0, 0.17), (-0.28, 0, 0.26)], 0.018, 'pal_coral')
            torus(0.08, 0.016, (0.02, 0, 0.22), 'pal_coral', rot=(pi / 2, 0, 0), m=6, n=14, arc=(0, pi))
        potted((-0.35, 0.0, 1.985), 0.1, 0.16, 'pal_grass', 'pal_coral_deep')
    with frame((-W / 2, 0.0, 1.55), (0, 0, -pi / 2)):
        window_full(0.72, 0.68, 'pal_cream', shut='pal_coral', seed=2)
    with frame((-W / 2 - 0.12, -0.75, z0), (0, radians(-12), 0)):
        cyl(0.025, 1.35, (0, 0, 0.25), 'pal_wood', bev=0.0, n=8)
        box((0.2, 0.04, 0.28), (0, 0, 0.14), 'pal_stone', r=0.03, segs=1)
        torus(0.06, 0.018, (0, 0, 1.65), 'pal_ink', rot=(pi / 2, 0, 0), m=6, n=12)
    with frame((-W / 2 - 0.12, 0.8, z0), (0, radians(-10), 0)):
        cyl(0.025, 1.6, (0, 0, 0.12), 'pal_wood', bev=0.0, n=8)
        box((0.04, 0.4, 0.05), (0, 0, 1.72), 'pal_ink', r=0.015, segs=1)
        for k2 in range(5):
            box((0.025, 0.025, 0.12), (0, -0.16 + k2 * 0.08, 1.64), 'pal_ink', r=0.008, segs=1)
    drainpipe(W / 2 - 0.05, -D / 2 - 0.08, z0, zw, 'pal_cream')
    barrel((W / 2 + 0.3, -D / 2 + 0.05, 0), 'pal_wood', r=0.3, h=0.7)
    cyl(0.29, 0.02, (W / 2 + 0.3, -D / 2 + 0.05, 0.69), 'pal_water', bev=0.0)
    # wheelbarrow
    with frame((W / 2 + 0.7, 0.7, 0), (0, 0, pi / 2 + 0.3)):
        revolve(fillet([(0, 0), (0.25, 0), (0.42, 0.3), (0.44, 0.33), (0, 0.3)], [0, 0.06, 0.04, 0.02, 0], seg=2, closed=False),
                'pal_coral', steps=24, c=(0, 0, 0.32), sharp=70)
        sphere(0.3, (0, 0, 0.62), 'pal_wood_dark', scale=(1, 1, 0.2), u=14, v=6)
        torus(0.16, 0.05, (0, -0.48, 0.17), 'pal_ink', rot=(0, pi / 2, 0), n=16, m=6)
        for x in (-0.22, 0.22):
            tube([(x * 0.6, -0.4, 0.2), (x, 0.1, 0.4), (x * 1.1, 0.75, 0.55)], 0.022, 'pal_cream')
            cyl(0.02, 0.3, (x * 0.8, 0.2, 0.0), 'pal_cream', bev=0.0, n=6)
    sack((0.2, -D / 2 - 0.55, 0), 0.24, 'pal_tan', rotz=0.6)
    potted((-1.55, -D / 2 - 0.4, 0), 0.18, 0.34, 'pal_grass', 'pal_coral_deep')


# ============================================================================================ CONTACT
@asset('lighthouse', 'Lighthouse (~7.6 m), cream/coral stripes, door 2.05 m, gallery railing 1.0 m. lamp = emissive bulb.')
def a_lighthouse():
    revolve(fillet([(0, 0), (1.5, 0), (1.5, 0.38), (1.22, 0.45), (0, 0.45)], [0, 0.05, 0.12, 0.08, 0], seg=4, closed=False), 'pal_stone', steps=48)
    rnd = random.Random(9)
    for k in range(7):
        a = k * 2 * pi / 7 + rnd.uniform(-0.2, 0.2)
        if -2.2 < a - 3 * pi / 2 < 0.6 and abs(a - 3 * pi / 2) < 0.5:
            continue
        rr = rnd.uniform(0.2, 0.32)
        sphere(rr, (1.55 * cos(a), 1.55 * sin(a), rr * 0.4), 'pal_stone', scale=(1.2, 1, 0.75), rot=(0, 0, a), u=14, v=8)
    z0, z1, r0, r1 = 0.43, 5.2, 1.12, 0.78

    def stripe(f):
        z = f.calc_center_median().z
        return int(((z - z0) / ((z1 - z0) / 5))) % 2
    prof = [(0, z0)] + [(r0 + (r1 - r0) * (i / 10), z0 + (z1 - z0) * i / 10) for i in range(11)] + [(0, z1)]
    revolve(prof, ['pal_cream', 'pal_coral'], steps=36, mfn=stripe, sharp=60)
    cyl(1.15, 0.18, (0, 0, z1 - 0.02), 'pal_cream', bev=0.06, n=36, segs=2)
    torus(1.08, 0.04, (0, 0, z1 + 1.15), 'pal_coral_deep', m=6, n=44)
    torus(1.08, 0.025, (0, 0, z1 + 0.65), 'pal_coral_deep', m=6, n=44)
    for i in range(14):
        a = i * 2 * pi / 14
        cyl(0.03, 1.0, (1.08 * cos(a), 1.08 * sin(a), z1 + 0.16), 'pal_coral_deep', bev=0.0, n=6)
    cyl(0.62, 0.14, (0, 0, z1 + 0.16), 'pal_coral_deep', bev=0.04)
    cyl(0.55, 0.95, (0, 0, z1 + 0.3), 'pal_glass', bev=0.03, n=36)
    for i in range(6):
        a = i * pi / 3 + pi / 6
        box((0.08, 0.08, 0.95), (0.56 * cos(a), 0.56 * sin(a), z1 + 0.775), 'pal_cream', r=0.025, rot=(0, 0, a), segs=1)
    with collect() as cl:
        sphere(0.3, (0, 0, z1 + 0.78), 'pal_emissive', u=24, v=16)
    special('lamp', cl.objs, (0, 0, z1 + 0.78))
    revolve(fillet([(0, z1 + 2.0), (0.35, z1 + 1.83), (0.68, z1 + 1.4), (0.75, z1 + 1.25), (0, z1 + 1.25)], [0, 0.15, 0.1, 0.03, 0], seg=4, closed=False),
            'pal_coral_deep', steps=36)
    sphere(0.13, (0, 0, z1 + 2.1), 'pal_yellow', u=14, v=9)
    cyl(0.02, 0.28, (0, 0, z1 + 2.2), 'pal_cream', bev=0.0, n=6)
    with frame((0, -1.06, z0)):
        box((1.4, 0.55, 2.45), (0, 0.2, 1.225), 'pal_cream', r=0.09)
        d = door_slab(1.0, 2.06, 'pal_wood', t=0.07)
        for o in d:
            o.data.transform(Matrix.Translation((0, -0.07, 0)))
        prism(u_frame(1.28, 2.24, 1.02, 2.08, 0.64, 0.51), 0.12, 'XZ', off=-0.1, mat='pal_coral_deep', bev=0.03)
        wall_lantern((0.68, -0.08, 1.8))
    steps_block((0, -1.62, z0), 1.3, n=2, rise=0.14, run=0.28)
    for z in (2.45, 3.95):
        rz = r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        with frame((0, -rz + 0.02, z), (radians(-4), 0, 0)):
            window_round(0.2, 'pal_navy', cross=False)
            box((0.5, 0.18, 0.06), (0, -0.08, -0.27), 'pal_cream', r=0.025, segs=1)
    coiled_rope((1.05, -1.25, 0.0))
    for k, a in enumerate((-0.2, 0.15)):
        pass


@asset('pier', 'Pier segment 2 m long (along Y). Deck top z=0.12; rope rail 1.0 m; posts reach z=-1.2 (water at -0.55).')
def a_pier():
    rnd = random.Random(31)
    for x in (-0.55, 0.55):
        box((0.12, 2.0, 0.14), (x, 0, -0.07), 'pal_wood_dark', r=0.04)
    n = 8
    for i in range(n):
        y = -1.0 + (i + 0.5) * 2.0 / n
        box((1.8 + rnd.uniform(-0.04, 0.04), 2.0 / n - 0.03, 0.09), (rnd.uniform(-0.02, 0.02), y, 0.075), 'pal_wood', r=0.035,
            rot=(0, 0, rnd.uniform(-0.02, 0.02)), segs=1)
    for x in (-0.9, 0.9):
        for y in (-0.88, 0.88):
            cyl(0.11, 2.25, (x, y, -1.2), 'pal_cream', bev=0.05)
            sphere(0.12, (x, y, 1.05), 'pal_cream', u=14, v=9)
            torus(0.115, 0.025, (x, y, 0.25), 'pal_coral', m=6, n=16)
        tube([(x, -0.88, 0.98), (x, 0.0, 0.84), (x, 0.88, 0.98)], 0.03, 'pal_sand')
        tube([(x, -0.88, 0.55), (x, 0.0, 0.45), (x, 0.88, 0.55)], 0.025, 'pal_sand')
    torus(0.22, 0.065, (1.02, 0.0, 0.7), 'pal_coral', rot=(0, pi / 2, 0), m=8, n=20)
    for k in range(4):
        a = k * pi / 2 + pi / 4
        box((0.05, 0.08, 0.14), (1.04, 0.22 * cos(a), 0.7 + 0.22 * sin(a)), 'pal_white', r=0.02, rot=(a, 0, 0), segs=1)
    bollard((-0.55, 0.55, 0.12), 'pal_navy')
    coiled_rope((0.35, -0.5, 0.12), R=0.2)


# ============================================================================================ SHARED
@asset('billboard', 'Shared billboard: 16:10 screen 3.2 x 2.0 (bottom 1.6 m) on legs, catwalk, ladder and two spot lamps.')
def a_billboard():
    zc = 2.6
    for x in (-1.3, 1.3):
        box((0.26, 0.26, zc + 1.2), (x, 0.16, (zc + 1.2) / 2), 'pal_cream', r=0.1)
        cyl(0.26, 0.18, (x, 0.16, 0), 'pal_stone', bev=0.06)
    box((1.8, 0.08, 0.12), (-0.65, 0.3, 1.0), 'pal_cream', r=0.04, rot=(0, 0.45, 0))
    box((1.8, 0.08, 0.12), (0.65, 0.3, 1.0), 'pal_cream', r=0.04, rot=(0, -0.45, 0))
    box((3.42, 0.14, 2.22), (0, 0.0, zc), 'pal_cream', r=0.06)
    fb = 0.16
    for s in (-1, 1):
        box((3.42 + 2 * fb - 0.02, 0.2, fb), (0, -0.03, zc + s * (1.11 + fb / 2 - 0.02)), 'pal_coral', r=0.075)
        box((fb, 0.2, 2.22), (s * (1.71 + fb / 2 - 0.01), -0.03, zc), 'pal_coral', r=0.075)
    quad('screen', 3.2, 2.0, (0, -0.075, zc))
    box((3.6, 0.5, 0.06), (0, -0.35, zc - 1.25), 'pal_wood', r=0.025)
    for x in (-1.75, -0.6, 0.6, 1.75):
        cyl(0.02, 0.5, (x, -0.58, zc - 1.22), 'pal_cream', bev=0.0, n=6)
    box((3.55, 0.04, 0.04), (0, -0.58, zc - 0.72), 'pal_cream', r=0.015, segs=1)
    with frame((1.55, -0.25, 0), (radians(8), 0, 0)):
        for x in (-0.16, 0.16):
            box((0.04, 0.04, zc - 1.25), (x, 0, (zc - 1.25) / 2), 'pal_wood_dark', r=0.015, segs=1)
        for i in range(4):
            box((0.32, 0.035, 0.035), (0, 0, 0.25 + i * 0.3), 'pal_wood_dark', r=0.012, segs=1)
    for x in (-1.0, 1.0):
        tube([(x, -0.05, zc + 1.17), (x, -0.3, zc + 1.4), (x, -0.6, zc + 1.33)], 0.025, 'pal_navy')
        with frame((x, -0.62, zc + 1.27), (radians(-50), 0, 0)):
            cyl(0.11, 0.2, (0, 0, -0.1), 'pal_navy', bev=0.03, r2=0.075)
            cyl(0.09, 0.02, (0, 0, -0.11), 'pal_emissive', bev=0.0)
    for x in (-1.3, 1.3):
        bush((x, -0.35, 0), 0.24, 'pal_grass', seed=int(x * 7) + 50, flowers='pal_peach')


@asset('scaffold_block', 'Build-animation scaffold: 2 x 2 x 2 m, origin bottom centre, with a ladder and toe boards.')
def a_scaffold_block():
    h = 0.95
    pr = 0.05
    for x in (-h, h):
        for y in (-h, h):
            cyl(pr, 2.0, (x, y, 0), 'pal_cream', bev=0.02, n=10, segs=1)
            cyl(0.1, 0.05, (x, y, 0), 'pal_stone', bev=0.02, n=10, segs=1)
    for z in (0.1, 1.0, 1.95):
        for s in (-h, h):
            cyl(0.035, 2 * h, (s, -h, z), 'pal_cream', bev=0.012, n=8, rot=(-pi / 2, 0, 0))
            cyl(0.035, 2 * h, (-h, s, z), 'pal_cream', bev=0.012, n=8, rot=(0, pi / 2, 0))
            for x in (-h, h):
                sphere(0.065, (x, s, z), 'pal_coral', u=8, v=6)
    L = sqrt((2 * h) ** 2 + 0.9 ** 2)
    ang = atan2(0.9, 2 * h)
    cyl(0.03, L, (-h, -h - 0.03, 0.1), 'pal_cream', bev=0.01, n=8, rot=(0, pi / 2 - ang, 0))
    cyl(0.03, L, (-h - 0.03, h, 1.0), 'pal_cream', bev=0.01, n=8, rot=(pi / 2 - ang, 0, 0))
    for z in (1.0, 1.95):
        for i in range(4):
            y = -0.66 + i * 0.44
            box((1.86, 0.4, 0.05), (0, y, z + 0.06), 'pal_wood' if (i + int(z)) % 2 == 0 else 'pal_wood_dark', r=0.02, segs=1)
        box((1.86, 0.04, 0.14), (0, -h + 0.04, z + 0.15), 'pal_wood', r=0.015, segs=1)
    with frame((h - 0.05, -0.3, 0), (0, radians(-6), 0)):
        for y in (-0.17, 0.17):
            box((0.04, 0.04, 2.05), (0, y, 1.02), 'pal_yellow', r=0.015, segs=1)
        for i in range(6):
            box((0.035, 0.34, 0.035), (0, 0, 0.2 + i * 0.32), 'pal_yellow', r=0.012, segs=1)


@asset('launch_pad', 'Hex launch pad (pointy-top, circumradius 1.2 m) with a pal_sky blueprint ring.')
def a_launch_pad():
    hexp = [(1.2 * cos(pi / 2 + k * pi / 3), 1.2 * sin(pi / 2 + k * pi / 3)) for k in range(6)]
    prism(fillet(hexp, 0.12, seg=4), 0.14, 'XY', off=0.07, mat='pal_cream', bev=0.05)
    hexi = [(1.0 * cos(pi / 2 + k * pi / 3), 1.0 * sin(pi / 2 + k * pi / 3)) for k in range(6)]
    prism(fillet(hexi, 0.1, seg=4), 0.04, 'XY', off=0.14, mat='pal_stone', bev=0.015, segs=1)
    revolve(fillet([(0.7, 0.15), (0.84, 0.15), (0.84, 0.2), (0.7, 0.2)], 0.02, seg=2, closed=True) + [(0.7, 0.15)], 'pal_sky', steps=36, sharp=70)
    for k in range(6):
        a = pi / 2 + k * pi / 3 + pi / 6
        box((0.18, 0.05, 0.03), (0.55 * cos(a), 0.55 * sin(a), 0.17), 'pal_sky', r=0.012, rot=(0, 0, a), segs=1)
        a2 = pi / 2 + k * pi / 3
        sphere(0.045, (0.93 * cos(a2), 0.93 * sin(a2), 0.16), 'pal_sky', scale=(1, 1, 0.5), u=10, v=7)
    cyl(0.16, 0.03, (0, 0, 0.16), 'pal_sky', bev=0.012)
    box((0.42, 0.05, 0.025), (0, 0, 0.175), 'pal_sky', r=0.01, segs=1)
    box((0.05, 0.42, 0.025), (0, 0, 0.175), 'pal_sky', r=0.01, segs=1)



def dhaba_bench_parts(c, rotz=0.0, L=1.8):
    """Rustic dhaba bench, seat 0.46 m, painted legs and a truck-art apron. Local front -Y."""
    with frame(c, (0, 0, rotz)):
        box((L, 0.42, 0.08), (0, 0, 0.42), 'pal_wood', r=0.03)
        for x in (-L / 2 + 0.15, L / 2 - 0.15):
            for y in (-0.15, 0.15):
                box((0.09, 0.09, 0.4), (x, y, 0.2), 'pal_coral_deep', r=0.03, segs=1)
            box((0.08, 0.36, 0.06), (x, 0, 0.12), 'pal_coral_deep', r=0.02, segs=1)
        truck_trim(L - 0.4, (0, -0.21, 0.33), h=0.1)


@asset('dhaba_bench', 'Dhaba bench (1.8 m, seat 0.46 m), painted legs with a truck-art apron.')
def a_dhaba_bench():
    dhaba_bench_parts((0, 0, 0))


@asset('water_tank_rooftop', 'Rooftop water tank on a stand (~1.4 m) with inlet pipe; drop on any flat roof.')
def a_water_tank_rooftop():
    water_tank((0, 0, 0), r=0.48, h=0.75, mat='pal_sky')
    tube([(0.35, 0.3, 1.0), (0.6, 0.45, 0.9), (0.62, 0.45, 0.0)], 0.03, 'pal_stone')
    cyl(0.05, 0.08, (0.62, 0.45, 0.0), 'pal_stone', bev=0.01, n=8, segs=1)


@asset('shop_shutter', 'Rolling metal shop shutter, 2.4 x 2.4 m opening. shutter = slat panel with pivot at its top edge (scale or slide on Z to roll up).')
def a_shop_shutter():
    box((2.9, 0.3, 2.85), (0, 0.15, 1.425), 'pal_pink', r=0.06)
    box((2.44, 0.2, 2.42), (0, 0.2, 1.21), 'pal_ink', r=0.03, segs=1)
    rolling_shutter(2.4, 2.4, 0.0, (0, -0.0, 0), mat='pal_sky', as_special='shutter')
    truck_trim(2.6, (0, -0.31, 2.68), h=0.14)


@asset('electric_pole', 'Concrete electricity pole (~6.2 m) with crossarm, insulators, transformer, street lamp and tangled cable loops. wire_a / wire_b = wire attach points on the crossarm ends.')
def a_electric_pole():
    cyl(0.2, 0.35, (0, 0, 0), 'pal_stone', bev=0.05, n=12, r2=0.17)
    cyl(0.13, 5.9, (0, 0, 0.3), 'pal_stone', bev=0.03, n=10, r2=0.085, segs=1)
    for z in (1.0, 2.0):
        torus(0.12, 0.02, (0, 0, z), 'pal_coral', n=10, m=4)
    box((1.6, 0.12, 0.12), (0, 0, 5.75), 'pal_wood_dark', r=0.03)
    for x in (-0.7, -0.25, 0.25, 0.7):
        cyl(0.04, 0.12, (x, 0, 5.81), 'pal_white', bev=0.0, n=8)
        sphere(0.045, (x, 0, 5.95), 'pal_white', u=8, v=5)
    for s in (-1, 1):
        tube([(0, 0, 5.4), (s * 0.5, 0, 5.72)], 0.02, 'pal_ink', kind='POLY')
    with frame((0, 0.22, 3.6)):
        box((0.5, 0.36, 0.6), (0, 0.0, 0), 'pal_stone', r=0.07)
        for x in (-0.15, 0.0, 0.15):
            cyl(0.03, 0.14, (x, 0, 0.3), 'pal_white', bev=0.0, n=6)
        box((0.2, 0.02, 0.16), (0, -0.185, 0.05), 'pal_yellow', r=0.01, segs=1)
        for s in (-1, 1):
            tube([(s * 0.2, 0, -0.3), (s * 0.24, -0.12, -0.36), (s * 0.15, -0.2, -0.32)], 0.02, 'pal_stone', kind='POLY')
    # tangled cable loops and a coil
    tube([(-0.7, 0, 5.95), (-0.45, -0.1, 5.2), (-0.15, -0.05, 4.7), (0.0, -0.14, 4.55), (0.15, -0.06, 4.8), (0.7, 0, 5.95)], 0.018, 'pal_ink')
    tube([(-0.25, 0, 5.95), (-0.2, -0.12, 5.35), (0.05, -0.16, 5.15), (0.25, 0, 5.95)], 0.016, 'pal_ink')
    tube([(0.0, -0.13, 5.3), (0.05, -0.15, 4.2), (0.1, -0.16, 3.95)], 0.016, 'pal_ink')
    for k in range(3):
        torus(0.16 - k * 0.02, 0.014, (0.02, -0.16, 4.1 - k * 0.04), 'pal_ink', rot=(pi / 2 + 0.2 * k, 0, 0.3 * k), n=14, m=4)
    # street lamp arm
    tube([(0, -0.1, 4.9), (0, -0.55, 5.1), (0, -0.9, 5.05)], 0.035, 'pal_stone')
    with frame((0, -0.95, 4.98)):
        box((0.42, 0.2, 0.08), (0, 0, 0.04), 'pal_stone', r=0.035, segs=1)
        box((0.32, 0.14, 0.03), (0, 0, -0.005), 'pal_emissive', r=0.012, segs=1)
    box((0.3, 0.03, 0.4), (0, -0.1, 2.6), 'pal_white', r=0.02, segs=1, rot=(0, 0, 0))
    box((0.24, 0.02, 0.06), (0, -0.12, 2.7), 'pal_coral', r=0.01, segs=1)
    marker('wire_a', (-0.7, 0, 5.98))
    marker('wire_b', (0.7, 0, 5.98))


EXPECTED = {
    'home_hut': ['door'], 'home_desk': ['screen', 'seat', 'use'], 'portrait_board': ['screen'],
    'number_6plus': [], 'number_400plus': [], 'welcome_arch': ['label'],
    'school': ['bell', 'door'], 'school_van': [], 'noticeboard': ['screen'],
    'bazaar_stall': ['awning'], 'storefront': ['screen', 'label'], 'chai_stall': [], 'phone_stand': ['screen'],
    'post_office': ['door'], 'pigeon_loft': [], 'paper_plane': [],
    'warehouse': ['door'], 'crane': ['arm'], 'price_board': ['screen'],
    'glass_tower': [], 'globe_sculpture': ['globe'],
    'phone_monolith': ['screen'], 'signal_tower': ['rings'],
    'stall_whatsapp': ['awning', 'label', 'use'], 'stall_saas': ['awning', 'label', 'use', 'screen'],
    'stall_mobile': ['awning', 'label', 'use'], 'stall_desktop': ['awning', 'label', 'use', 'screen'],
    'milestone_flag': ['label', 'flag'], 'summit_flag': ['label', 'flag'],
    'library_kiosk': ['use'], 'book': [],
    'toolshed': ['door', 'label_0', 'label_1', 'label_2', 'label_3'],
    'lighthouse': ['lamp'], 'pier': [],
    'billboard': ['screen'], 'scaffold_block': [], 'launch_pad': [],
    'dhaba_bench': [], 'water_tank_rooftop': [], 'shop_shutter': ['shutter'], 'electric_pole': ['wire_a', 'wire_b'],
}

# --------------------------------------------------------------------------------------------
# Build pipeline
# --------------------------------------------------------------------------------------------
def convert_all(objs):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    out = []
    news = []
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        news.append((o, me))
    for o, me in news:
        old = o.data
        o.modifiers.clear()
        o.data = me
        if old.users == 0:
            bpy.data.meshes.remove(old)
        out.append(o)
    return out

def join_objs(objs, name):
    if len(objs) == 1:
        ob = objs[0]
    else:
        for o in bpy.context.view_layer.objects:
            o.select_set(False)
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        with bpy.context.temp_override(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs):
            bpy.ops.object.join()
        ob = objs[0]
    ob.name = name
    ob.data.name = name
    return ob

def build_asset(name, fn):
    global PARTS, SPECIALS, EMPTIES
    PARTS, SPECIALS, EMPTIES = [], [], []
    fn()
    root = bpy.data.objects.new(name, None)
    root.empty_display_type = 'PLAIN_AXES'
    _link(root)
    parts = convert_all(PARTS)
    body = join_objs(parts, name + '_body')
    while body.data.uv_layers:
        body.data.uv_layers.remove(body.data.uv_layers[0])
    body.parent = root
    for sname, objs, pivot in SPECIALS:
        objs = convert_all(objs)
        ob = join_objs(objs, sname)
        ob.data.transform(Matrix.Translation(-Vector(pivot)))
        ob.location = pivot
        ob.parent = root
    for e in EMPTIES:
        e.parent = root
    if name == 'paper_plane':  # origin at the centre of its bounds
        cs = [body.matrix_world @ Vector(c) for c in body.bound_box]
        ctr = sum(cs, Vector()) / 8
        body.data.transform(Matrix.Translation(-ctr))
    PARTS = SPECIALS = EMPTIES = None
    return root

def children_meshes(root):
    return [c for c in root.children_recursive if c.type == 'MESH']

def bake_ao(roots, samples):
    sc = bpy.context.scene
    for i, r in enumerate(roots):
        r.location = ((i % 7) * 16.0, (i // 7) * 16.0, 0.0)
    # ground for contact occlusion
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=200)
    me = bpy.data.meshes.new('bake_ground')
    bm.to_mesh(me)
    bm.free()
    ground = bpy.data.objects.new('bake_ground', me)
    _link(ground)
    ground.location = (40, 40, 0.0)
    if not sc.world:
        sc.world = bpy.data.worlds.new('w')
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.device = 'CPU'
    try:
        sc.world.light_settings.distance = 0.9
    except Exception:
        pass
    meshes = []
    for r in roots:
        meshes += children_meshes(r)
    for ob in meshes:
        me = ob.data
        if 'Col' not in me.color_attributes:
            me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
        me.color_attributes.active_color = me.color_attributes['Col']
        try:
            me.color_attributes.render_color_index = me.color_attributes.active_color_index
        except Exception:
            pass
    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for ob in meshes:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    sc.render.bake.target = 'VERTEX_COLORS'
    t = time.time()
    ok = True
    try:
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    except Exception as e:
        ok = False
        log('AO bake failed, filling white:', e)
    log('AO bake %.1fs over %d meshes' % (time.time() - t, len(meshes)))
    for ob in meshes:
        attr = ob.data.color_attributes['Col']
        white = (not ok) or ob.name.split('.')[0] in ('screen', 'label', 'label_0', 'label_1', 'label_2', 'label_3', 'lamp')
        for d in attr.data:
            if white:
                d.color = (1, 1, 1, 1)
            else:
                v = d.color[0]
                v = 0.42 + 0.58 * (max(0.0, min(1.0, v)) ** 0.85)
                d.color = (v, v, v, 1)
    bpy.data.objects.remove(ground)
    for r in roots:
        r.location = (0, 0, 0)
    bpy.context.view_layer.update()

def export_glb(roots):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for r in roots:
        r.select_set(True)
        for c in r.children_recursive:
            c.select_set(True)
    kw = dict(filepath=GLB, export_format='GLB', use_selection=True, export_yup=True, export_apply=True,
              export_vertex_color='NAME', export_vertex_color_name='Col', export_all_vertex_colors=False,
              export_extras=False, export_animations=False, export_draco_mesh_compression_enable=False,
              export_meshopt_compression_enable=False, export_normals=True, export_texcoords=True,
              export_materials='EXPORT', export_image_format='NONE', export_tangents=False)
    try:
        bpy.ops.export_scene.gltf(**kw)
    except TypeError as e:
        log('export kw fallback', e)
        kw.pop('export_image_format', None)
        bpy.ops.export_scene.gltf(**kw)
    clean_glb_names(GLB)

def compact_colors(js, rest):
    """Rewrite COLOR_0 accessors from normalized ushort to normalized ubyte (valid core glTF, no extension)
    and repack the BIN chunk. Halves the colour stream."""
    blen, btype = struct.unpack_from('<II', rest, 0)
    binb = rest[8:8 + blen]
    color_views = {}
    for m in js.get('meshes', []):
        for pr in m['primitives']:
            a = pr['attributes'].get('COLOR_0')
            if a is not None:
                acc = js['accessors'][a]
                if acc['componentType'] == 5123:
                    color_views[acc['bufferView']] = a
    out = bytearray()
    for i, bv in enumerate(js['bufferViews']):
        off = bv.get('byteOffset', 0)
        data = binb[off:off + bv['byteLength']]
        if i in color_views:
            acc = js['accessors'][color_views[i]]
            n = acc['count'] * {'VEC3': 3, 'VEC4': 4}[acc['type']]
            vals = struct.unpack_from('<%dH' % n, data, 0)
            data = bytes(min(255, (v + 128) // 257) for v in vals)
            acc['componentType'] = 5121
            bv.pop('byteStride', None)
        while len(out) % 4:
            out.append(0)
        bv['byteOffset'] = len(out)
        bv['byteLength'] = len(data)
        out += data
    while len(out) % 4:
        out.append(0)
    js['buffers'][0]['byteLength'] = len(out)
    return struct.pack('<II', len(out), btype) + bytes(out)


def clean_glb_names(path):
    """Strip Blender's .001 suffixes from node/mesh names so every special child is named exactly."""
    with open(path, 'rb') as f:
        data = f.read()
    magic, ver, length = struct.unpack_from('<III', data, 0)
    clen, ctype = struct.unpack_from('<II', data, 12)
    js = json.loads(data[20:20 + clen].decode('utf-8'))
    rest = data[20 + clen:]
    for key in ('nodes', 'meshes'):
        for n in js.get(key, []):
            if 'name' in n:
                n['name'] = re.sub(r'\.\d{3}$', '', n['name'])
    js.pop('extras', None)
    rest = compact_colors(js, rest)
    jb = json.dumps(js, separators=(',', ':')).encode('utf-8')
    while len(jb) % 4:
        jb += b' '
    out = struct.pack('<III', magic, ver, 12 + 8 + len(jb) + len(rest)) + struct.pack('<II', len(jb), ctype) + jb + rest
    with open(path, 'wb') as f:
        f.write(out)

# --------------------------------------------------------------------------------------------
# Validation (fresh scene re-import)
# --------------------------------------------------------------------------------------------
def strip(n):
    return re.sub(r'\.\d{3}$', '', n)

def validate():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    roots = [o for o in bpy.context.scene.objects if o.parent is None]
    info = {}
    total = 0
    mats = set()
    errors = []
    names = [strip(r.name) for r in roots]
    for name in EXPECTED:
        if name not in names:
            errors.append('missing root ' + name)
    for r in roots:
        rn = strip(r.name)
        if rn not in EXPECTED:
            errors.append('unexpected root ' + r.name)
        tris = 0
        lo = Vector((1e9, 1e9, 1e9))
        hi = Vector((-1e9, -1e9, -1e9))
        kids = []
        for c in r.children_recursive:
            kids.append(strip(c.name))
            if c.type == 'MESH':
                me = c.data
                me.calc_loop_triangles()
                tris += len(me.loop_triangles)
                for m in me.materials:
                    mats.add(m.name)
                for v in me.vertices:
                    p = c.matrix_world @ v.co
                    lo = Vector(map(min, lo, p))
                    hi = Vector(map(max, hi, p))
                if not me.color_attributes:
                    errors.append('no vertex colour on %s/%s' % (rn, c.name))
        for need in EXPECTED.get(rn, []):
            if need not in kids:
                errors.append('%s missing child %s' % (rn, need))
        specials = sorted(set(k for k in kids if not k.endswith('_body')))
        info[rn] = dict(tris=tris, size=tuple(hi - lo), lo=tuple(lo), hi=tuple(hi), specials=specials)
        total += tris
    bad = [m for m in mats if strip(m) not in PAL]
    if bad:
        errors.append('off-palette materials: %s' % bad)
    log('VALIDATE roots=%d total_tris=%d size=%.0f KB' % (len(roots), total, os.path.getsize(GLB) / 1024))
    for rn in sorted(info):
        i = info[rn]
        log('  %-16s tris=%6d size=(%.2f, %.2f, %.2f) children=%s' % (rn, i['tris'], *i['size'], i['specials']))
    log('  materials:', sorted(strip(m) for m in mats))
    log('  animations:', [a.name for a in bpy.data.actions])
    if errors:
        for e in errors:
            log('  ERROR', e)
    else:
        log('  all names match the spec')
    return roots, info, total, sorted(strip(m) for m in mats), errors

def write_manifest(info, total, mats):
    lines = ['# BUILDINGS pack manifest', '',
             'Generated by `build_buildings.py`. Units metres, Blender Z-up (glTF Y-up after export). Every root is an Empty at the origin; '
             'fronts face Blender -Y; origins at bottom centre (paper_plane: centre). Size = (x width, y depth, z height) of the root\'s '
             'meshes; footprint = x by y.', '',
             '- File: `buildings.glb` (%.2f MB), %d roots, **%d triangles** total (budget 260k tris / 5 MB).' % (os.path.getsize(GLB) / 1e6, len(info), total),
             '- Scale: adult player 1.65 m. Doors >= 2.05 m, counters 0.95 m, desk 0.75 m, chair seat 0.46 m, railings 1.0 m, single-storey eaves ~2.5-3.0 m.',
             '- COLOR_0 is stored as normalized UNSIGNED_BYTE VEC4 (core glTF, no extension) to save space.',
             '- Materials: ' + ', '.join('`%s`' % m for m in mats) + '.',
             '- Vertex colour `Col` (COLOR_0) = baked Cycles AO (96 samples, distance 0.9 m, remapped to 0.42..1). `screen`, `label*` and `lamp` are pure white.',
             '- `screen` / `label*` quads: material `pal_white` / `pal_cream`, UV (0,0) bottom-left .. (1,1) top-right as seen from the front '
             '(standard glTF UVs: use `texture.flipY = false`).',
             '- Child names are exact in the GLB. three.js `GLTFLoader` de-duplicates node names across the whole file (`door`, `door_1`, ...), '
             'so look up specials per root with a prefix match such as `/^door(_\\d+)?$/`.',
             '- Moving parts have their origin on the hinge/axis: rotate them in place.', '',
             '| root | size x, y, z (m) | tris | special children | notes |', '|---|---|---|---|---|']
    order = [n for n, _ in ASSETS]
    for n in order:
        if n not in info:
            continue
        i = info[n]
        lines.append('| `%s` | %.2f, %.2f, %.2f | %d | %s | %s |' % (n, *i['size'], i['tris'], ', '.join('`%s`' % s for s in i['specials']) or '-',
                                                                   NOTES.get(n, '')))
    lines += ['', 'Districts (suggested grouping, see contact_sheet.png):', '',
              '- Home: home_hut, home_desk, portrait_board, number_6plus, number_400plus, welcome_arch',
              '- Schooliee: school, school_van, noticeboard  |  Karobari: bazaar_stall, storefront, chai_stall, phone_stand',
              '- WhatsApp Gateway: post_office, pigeon_loft, paper_plane  |  LeadProfit: warehouse, crane, price_board',
              '- DSME Globals: glass_tower, globe_sculpture  |  Mobile Ecosystems: phone_monolith, signal_tower',
              '- Services square: stall_whatsapp, stall_saas, stall_mobile, stall_desktop  |  Timeline Hill: milestone_flag, summit_flag',
              '- GitHub: library_kiosk, book  |  Toolshed: toolshed  |  Contact: lighthouse, pier  |  Shared: billboard, scaffold_block, launch_pad', '']
    with open(os.path.join(HERE, 'MANIFEST.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

# --------------------------------------------------------------------------------------------
# Look-dev renders
# --------------------------------------------------------------------------------------------
def lookdev_materials(roots):
    attr = 'Col'
    for r in roots:
        for c in children_meshes(r):
            if c.data.color_attributes:
                attr = c.data.color_attributes[0].name
                break
        break
    for m in list(bpy.data.materials):
        n = strip(m.name)
        if n in PAL:
            nt = m.node_tree
            for node in list(nt.nodes):
                nt.nodes.remove(node)
            b = nt.nodes.new('ShaderNodeBsdfPrincipled')
            o = nt.nodes.new('ShaderNodeOutputMaterial')
            nt.links.new(b.outputs[0], o.inputs[0])
            setup_material(m, n, ao_attr=attr)
    return attr

def mat_simple(name, hexs, rough=0.9):
    m = bpy.data.materials.new(name)
    nt, b = principled(m)
    b.inputs['Base Color'].default_value = (*lin(hexs), 1)
    b.inputs['Roughness'].default_value = rough
    return m

def hex_tile_mesh(R=2.0, depth=1.2, name='tile'):
    bm = bmesh.new()
    pts = [(R * cos(pi / 2 + k * pi / 3), R * sin(pi / 2 + k * pi / 3)) for k in range(6)]
    pts = fillet(pts, 0.1, seg=3)
    top = [bm.verts.new((x, y, 0)) for x, y in pts]
    f = bm.faces.new(top)
    res = bmesh.ops.extrude_face_region(bm, geom=[f])
    ev = [e for e in res['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, -depth), verts=ev)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    top_edges = [e for e in bm.edges if all(abs(v.co.z) < 1e-6 for v in e.verts) and len(e.link_faces) == 2 and
                 any(abs(fc.normal.z) < 0.5 for fc in e.link_faces)]
    bmesh.ops.bevel(bm, geom=top_edges, offset=0.08, segments=4, profile=0.5, affect='EDGES')
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
        p.material_index = 0 if p.normal.z > 0.6 else 1
    try:
        me.set_sharp_from_angle(angle=radians(50))
    except Exception:
        pass
    return me

class Stage:
    def __init__(self):
        sc = bpy.context.scene
        self.sc = sc
        sc.render.engine = 'BLENDER_EEVEE'
        sc.render.resolution_x, sc.render.resolution_y = 800, 600
        sc.render.film_transparent = False
        try:
            sc.view_settings.view_transform = 'AgX'
            for look in ('AgX - Base Contrast', 'AgX - Medium High Contrast', 'None'):
                try:
                    sc.view_settings.look = look
                    break
                except Exception:
                    pass
        except Exception:
            pass
        sc.view_settings.exposure = 0.3
        ee = sc.eevee
        ee.taa_render_samples = 64
        for k, v in (('use_raytracing', True), ('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 8),
                     ('use_fast_gi', True), ('fast_gi_distance', 1.5)):
            try:
                setattr(ee, k, v)
            except Exception:
                pass
        if not sc.world:
            sc.world = bpy.data.worlds.new('world')
        w = sc.world
        try:
            w.use_nodes = True
        except Exception:
            pass
        nt = w.node_tree
        bg = nt.nodes.get('Background')
        if bg is None:
            bg = nt.nodes.new('ShaderNodeBackground')
            out = nt.nodes.new('ShaderNodeOutputWorld')
            nt.links.new(bg.outputs[0], out.inputs[0])
        bg.inputs['Color'].default_value = (*lin('E9E3DE'), 1)
        bg.inputs['Strength'].default_value = 0.8
        self.m_grass = mat_simple('ld_grass', PAL['pal_grass'])
        self.m_cream = mat_simple('ld_cream', PAL['pal_cream'])
        self.m_water = mat_simple('ld_water', PAL['pal_water'], rough=0.35)
        self.m_wall = mat_simple('ld_wall', PAL['pal_pink'])
        self.m_stone = mat_simple('ld_stone', PAL['pal_stone'])
        tme = hex_tile_mesh()
        tme.materials.append(self.m_grass)
        tme.materials.append(self.m_cream)
        self.tile_me = tme
        # water
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=400)
        me = bpy.data.meshes.new('water')
        bm.to_mesh(me)
        bm.free()
        me.materials.append(self.m_water)
        self.water = bpy.data.objects.new('ld_water', me)
        self.water.location = (0, 0, -0.55)
        _link(self.water)
        # wall
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1)
        me = bpy.data.meshes.new('wall')
        bm.to_mesh(me)
        bm.free()
        me.materials.append(self.m_wall)
        self.wall = bpy.data.objects.new('ld_wall', me)
        _link(self.wall)
        # camera
        cd = bpy.data.cameras.new('cam')
        cd.lens = 72
        cd.sensor_width = 36
        cd.clip_start = 0.1
        cd.clip_end = 1000
        self.cam = bpy.data.objects.new('cam', cd)
        _link(self.cam)
        sc.camera = self.cam
        # key light (area, soft) from upper left
        ld = bpy.data.lights.new('key', 'AREA')
        ld.shape = 'DISK'
        ld.size = 5.0
        try:
            ld.use_shadow_jitter = True
            ld.shadow_jitter_overblur = 10
        except Exception:
            pass
        self.key = bpy.data.objects.new('key', ld)
        _link(self.key)
        self.tiles = []
    def clear_tiles(self):
        for t in self.tiles:
            bpy.data.objects.remove(t)
        self.tiles = []
    def tile(self, x, y, scale=1.0, mat_top=None):
        ob = bpy.data.objects.new('ld_tile', self.tile_me)
        ob.location = (x, y, 0)
        ob.scale = (scale, scale, 1)
        _link(ob)
        self.tiles.append(ob)
        return ob
    def frame_camera(self, target, radius, az=38, el=32, aspect=800 / 600):
        d = Vector((-sin(radians(az)) * cos(radians(el)), -cos(radians(az)) * cos(radians(el)), sin(radians(el))))
        hf = radians(28) / 2
        vf = atan2(tan(hf), aspect)
        dist = radius / sin(min(hf, vf)) * 1.02
        loc = Vector(target) + d * dist
        self.cam.location = loc
        self.cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
        # key light: upper-left of the camera, scaled with distance
        right = d.cross(Vector((0, 0, 1))).normalized()   # points to camera's left
        ldir = (d * 0.35 + right * 0.85 + Vector((0, 0, 1.15))).normalized()
        L = max(7.0, radius * 3.2)
        self.key.location = Vector(target) + ldir * L
        self.key.rotation_euler = (-ldir).to_track_quat('-Z', 'Y').to_euler()
        self.key.data.size = max(5.0, radius * 1.6)
        self.key.data.energy = 900.0 * (L / 7.0) ** 2
        # pink wall behind (perpendicular to view, horizontal)
        back = Vector((-d.x, -d.y, 0)).normalized()
        wc = Vector(target) + back * (radius * 1.9 + 2.5)
        self.wall.location = (wc.x, wc.y, -1.2 + 30)
        self.wall.scale = (400, 0.4, 60)
        self.wall.rotation_euler = (0, 0, atan2(back.y, back.x) - pi / 2)
        return dist
    def render(self, path, res=(800, 600)):
        self.sc.render.resolution_x, self.sc.render.resolution_y = res
        self.sc.render.filepath = path
        bpy.ops.render.render(write_still=True)

def dup_root(root, loc, rotz=0.0, name=None):
    r = bpy.data.objects.new(name or (root.name + '_copy'), None)
    _link(r)
    for c in root.children:
        cc = c.copy()
        cc.hide_render = False
        _link(cc)
        cc.parent = r
        cc.matrix_parent_inverse = c.matrix_parent_inverse.copy()
    r.location = loc
    r.rotation_euler = (0, 0, rotz)
    return r

def root_bounds(root):
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for c in children_meshes(root):
        for corner in c.bound_box:
            p = c.matrix_world @ Vector(corner)
            lo = Vector(map(min, lo, p))
            hi = Vector(map(max, hi, p))
    return lo, hi

def set_root_visible(root, vis):
    root.hide_render = not vis
    for c in root.children_recursive:
        c.hide_render = not vis

def render_previews(roots, only=None):
    st = Stage()
    rd = {strip(r.name): r for r in roots}
    for r in roots:
        set_root_visible(r, False)
    for name, _ in ASSETS:
        if only and name not in only:
            continue
        r = rd.get(name)
        if r is None:
            continue
        set_root_visible(r, True)
        bpy.context.view_layer.update()
        lo, hi = root_bounds(r)
        ext = hi - lo
        if name == 'paper_plane':
            r.location = (0, 0, 0.6)
            bpy.context.view_layer.update()
            lo, hi = root_bounds(r)
            ext = hi - lo
        foot = max(ext.x, ext.y)
        st.clear_tiles()
        scale = max(1.0, (foot * 0.5 + 0.5) / 1.73)
        st.tile(0, 0, scale)
        ctr = (lo + hi) / 2
        radius = max(ext.length / 2, 1.0)
        target = Vector((ctr.x, ctr.y, max(ctr.z * 0.9, 0.3)))
        st.frame_camera(target, radius * 1.05)
        st.render(os.path.join(PREV, name + '.png'))
        log('preview', name)
        set_root_visible(r, False)
    st.clear_tiles()
    for r in roots:
        set_root_visible(r, True)
    return st

R_T = 2.0
SQ3 = sqrt(3)

def axial(q, r):
    return (SQ3 * R_T * (q + r / 2.0), 1.5 * R_T * r)

FLOWER = [(0, 0), (1, 0), (-1, 0), (0, 1), (-1, 1), (0, -1), (1, -1)]
DISTRICTS = [
    # name, centre, tiles(axial), items: (root, x, y, rotz_deg, z)
    ('home', (0, 0), FLOWER, [('home_hut', -0.6, 1.6, 0, 0), ('home_desk', -4.2, -1.4, 20, 0), ('portrait_board', 3.6, 2.6, -20, 0),
                              ('number_6plus', 0.4, -2.4, 0, 0), ('number_400plus', 3.4, -1.3, -15, 0), ('welcome_arch', -1.2, -4.6, 0, 0), ('electric_pole', -5.0, 2.4, 0, 0), ('electric_pole', 5.2, 0.4, 0, 0)]),
    ('schooliee', (20, 0), FLOWER, [('school', -0.4, 1.4, 0, 0), ('school_van', 4.0, -1.6, -50, 0), ('noticeboard', -3.6, -2.4, 25, 0),
                                   ('launch_pad', 0.6, -3.6, 0, 0), ('electric_pole', -5.0, 1.6, 0, 0), ('electric_pole', 5.0, 2.2, 0, 0)]),
    ('karobari', (40, 0), FLOWER, [('storefront', 0.2, 1.8, 0, 0), ('bazaar_stall', -3.8, -1.0, 20, 0), ('chai_stall', 3.6, -1.6, -20, 0),
                                  ('phone_stand', 0.2, -2.8, 0, 0), ('shop_shutter', -3.4, 3.4, 20, 0), ('electric_pole', -5.2, 0.8, 0, 0), ('electric_pole', 5.0, 1.8, 0, 0), ('water_tank_rooftop', 3.6, 3.6, 0, 0)]),
    ('whatsapp', (0, -18), FLOWER, [('post_office', 0.8, 1.2, 0, 0), ('pigeon_loft', -3.6, -1.6, 20, 0), ('paper_plane', 3.4, -1.8, -30, 3.0),
                                   ('paper_plane', 4.0, 0.6, -50, 3.8), ('paper_plane', -0.8, -3.6, 10, 2.0), ('electric_pole', -4.8, 2.0, 0, 0), ('electric_pole', 4.8, 2.6, 0, 0)]),
    ('leadprofit', (20, -18), FLOWER, [('warehouse', 0.8, 1.6, 0, 0), ('crane', -4.0, -1.6, 0, 0), ('price_board', 2.4, -3.4, -15, 0), ('electric_pole', -4.6, 2.4, 0, 0), ('electric_pole', 5.0, 0.0, 0, 0)]),
    ('dsme', (40, -18), FLOWER, [('glass_tower', 0.0, 1.6, 0, 0), ('globe_sculpture', -2.6, -2.6, 0, 0), ('billboard', 3.0, -2.6, -25, 0)]),
    ('mobile', (0, -36), FLOWER, [('phone_monolith', -3.0, 0.6, 20, 0), ('phone_monolith', -0.8, 2.4, 0, 0), ('phone_monolith', 1.6, 2.2, -15, 0),
                                 ('signal_tower', 3.6, -1.2, 0, 0), ('stall_mobile', -1.0, -2.6, 10, 0)]),
    ('services', (20, -36), FLOWER, [('stall_whatsapp', -2.3, 2.1, 0, 0), ('stall_saas', 2.3, 2.1, 0, 0), ('stall_mobile', -2.4, -2.1, 0, 0),
                                    ('stall_desktop', 2.4, -2.1, 0, 0), ('dhaba_bench', 0.0, 0.0, 90, 0)]),
    ('timeline', (40, -36), FLOWER, [('milestone_flag', -3.4, -2.6, 0, 0), ('milestone_flag', -1.2, -1.0, 0, 0), ('milestone_flag', 1.2, 0.4, 0, 0),
                                    ('summit_flag', 0.4, 3.0, 0, 0), ('scaffold_block', 3.6, -2.2, 0, 0)]),
    ('github', (0, -54), FLOWER, [('library_kiosk', 0.0, 1.6, 0, 0), ('book', 2.4, -1.6, 10, 0), ('book', 2.6, -1.5, -15, 0), ('launch_pad', -2.6, -2.4, 0, 0)]),
    ('toolshed', (20, -54), FLOWER, [('toolshed', 0.0, 1.0, 0, 0)]),
    ('contact', (40, -54), FLOWER[:5], [('lighthouse', 0.0, 1.0, 0, 0), ('pier', 1.73 * 2 + 3.0, 3.0, 90, 0), ('pier', 1.73 * 2 + 5.0, 3.0, 90, 0)]),
]

def render_sheet(roots, st):
    M.clear()
    for m in bpy.data.materials:
        if strip(m.name) in PAL:
            M[strip(m.name)] = m
    rd = {strip(r.name): r for r in roots}
    for r in roots:
        set_root_visible(r, False)
    st.clear_tiles()
    copies = []
    for dname, (cx, cy), tiles, items in DISTRICTS:
        for q, rr in tiles:
            x, y = axial(q, rr)
            st.tile(cx + x, cy + y)
        poles = []
        for (rn, x, y, rz, z) in items:
            if rn in rd:
                cp = dup_root(rd[rn], (cx + x, cy + y, z), radians(rz))
                copies.append(cp)
                if rn == 'electric_pole':
                    poles.append(cp)
        bpy.context.view_layer.update()
        for a, b in zip(poles, poles[1:]):
            for wn, sag in (('wire_a', 0.7), ('wire_b', 0.9)):
                pa = next(c for c in a.children if strip(c.name) == wn).matrix_world.translation
                pb = next(c for c in b.children if strip(c.name) == wn).matrix_world.translation
                tube([tuple(p) for p in rope_curve(pa, pb, sag, 10)], 0.018, 'pal_ink', kind='POLY')
    # the pier needs water around it: drop the extra tile under it (handled by layout) ; make a few trees for context
    bpy.context.view_layer.update()
    cx, cy = 20, -27
    st.frame_camera(Vector((cx, cy, 0)), 40, az=22, el=50, aspect=2400 / 1500)
    st.key.data.energy *= 1.0
    st.render(os.path.join(PREV, 'overview_all_districts.png'), res=(2400, 1500))
    log('overview')
    # district close-ups
    for dname, (cx, cy), tiles, items in DISTRICTS:
        st.frame_camera(Vector((cx, cy, 1.0)), 7.4, az=30, el=42)
        st.render(os.path.join(PREV, 'district_%s.png' % dname), res=(1200, 900))
        log('district', dname)
    compose_sheet([os.path.join(PREV, 'district_%s.png' % d[0]) for d in DISTRICTS], os.path.join(HERE, 'contact_sheet.png'))


def compose_sheet(paths, out, cols=4, tw=800, th=600):
    import numpy as np
    rows = (len(paths) + cols - 1) // cols
    sheet = np.ones((rows * th, cols * tw, 4), dtype=np.float32)
    for i, pth in enumerate(paths):
        im = bpy.data.images.load(pth)
        w, h = im.size
        px = np.array(im.pixels[:], dtype=np.float32).reshape(h, w, 4)
        ys = (np.arange(th) * h / th).astype(int)
        xs = (np.arange(tw) * w / tw).astype(int)
        small = px[ys][:, xs]
        r, c = i // cols, i % cols
        y0 = (rows - 1 - r) * th
        sheet[y0:y0 + th, c * tw:(c + 1) * tw] = small
        bpy.data.images.remove(im)
    img = bpy.data.images.new('sheet', cols * tw, rows * th, alpha=False)
    img.pixels = sheet.ravel()
    img.filepath_raw = out
    img.file_format = 'PNG'
    img.save()
    log('contact sheet', out)

# --------------------------------------------------------------------------------------------
def main():
    samples = int(argval('--samples', '96'))
    if not flag('--render-only'):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        make_palette()
        roots = []
        for name, fn in ASSETS:
            t = time.time()
            roots.append(build_asset(name, fn))
            log('built', name, '%.2fs' % (time.time() - t))
        bake_ao(roots, samples)
        export_glb(roots)
        log('exported', GLB, '%.0f KB' % (os.path.getsize(GLB) / 1024))
    roots, info, total, mats, errors = validate()
    write_manifest(info, total, mats)
    if not errors:
        os.makedirs(os.path.dirname(COPY), exist_ok=True)
        shutil.copyfile(GLB, COPY)
        log('copied to', COPY)
    if flag('--no-render'):
        return
    lookdev_materials(roots)
    only = argval('--only')
    only = set(only.split(',')) if only else None
    st = None
    if not flag('--no-previews'):
        st = render_previews(roots, only)
    if not flag('--no-sheet') and not only:
        if st is None:
            st = Stage()
        render_sheet(roots, st)
    log('done')

main()
