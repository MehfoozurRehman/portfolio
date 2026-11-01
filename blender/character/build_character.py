"""Launch Isles - CHARACTER pack generator (player, parrot, npc_a, npc_b, npc_c).

Rebuild everything with one command (Git Bash):
  "/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup \
      --python build_character.py -- all

Modes:
  all        build, bake AO, rig, animate, export character.glb, copy to world/src/models,
             MANIFEST.md, previews, walk/run strips, contact sheet, validation report
  look [n..] static build + AO + look-dev renders into _work/ (fast iteration)
  poses [n]  build + rig + animate, render previews only (no export)
  validate   re-import character.glb into an empty scene and print roots / tris / materials / animations

Conventions (world/ASSETS.md): 1 unit = 1 m, Blender Z up, fronts face -Y, every root Empty at the origin with its
origin at the feet, palette-named materials only, AO baked to vertex colour `Col`.
Adults are 1.65 m tall. Seated clips keep the feet on the ground at the origin and put the seat contact at 0.46 m.
"""
import bpy, bmesh, math, os, sys, json, struct, time, shutil
from mathutils import Vector, Matrix, Quaternion, noise

V = Vector
HERE = os.path.dirname(os.path.abspath(__file__))
WORLD = os.path.abspath(os.path.join(HERE, '..', '..'))
GLB = os.path.join(HERE, 'character.glb')
SRC_GLB = os.path.join(WORLD, 'src', 'models', 'character.glb')
PREV = os.path.join(HERE, 'previews')
WORK = os.path.join(HERE, '_work')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
MODE = ARGS[0] if ARGS else 'all'
FPS = 30
T0 = time.time()


def log(*a):
    print('[char %6.1fs]' % (time.time() - T0), *a, flush=True)


# ============================================================================ palette
PAL = {
    'pal_grass': '#74C391', 'pal_grass_light': '#9ED6A8', 'pal_grass_deep': '#2E9B78',
    'pal_leaf_dark': '#1F7A60', 'pal_coral': '#F28C6F', 'pal_coral_deep': '#DC6B52',
    'pal_peach': '#F7B79F', 'pal_cream': '#F3EDE6', 'pal_stone': '#E3D8CF', 'pal_sand': '#F1DCC2',
    'pal_wood': '#C98C62', 'pal_wood_dark': '#8E5B3D', 'pal_pink': '#ECBDB7', 'pal_sky': '#A9D6E5',
    'pal_water': '#79BFC9', 'pal_yellow': '#F6CF6B', 'pal_navy': '#2C3567', 'pal_ink': '#2B2A31',
    'pal_white': '#FFFFFF', 'pal_tan': '#C9955E', 'pal_fur': '#EDE3D3', 'pal_skin': '#E9B48F',
    'pal_glass': '#BFE3EE', 'pal_emissive': '#FFE6A3',
    # palette-adjacent pastel cloth colours for the townsfolk (map these in the engine)
    'pal_kameez_a': '#D9A3A0', 'pal_kameez_b': '#A9C2A2', 'pal_kameez_c': '#A7C7DD', 'pal_kameez_d': '#DDB85E',
}


def s2l(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexlin(h):
    h = h.lstrip('#')
    return tuple(s2l(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


MATS = {}


def mat(name):
    if name in MATS:
        return MATS[name]
    assert name in PAL, name
    m = bpy.data.materials.new(name)
    b = m.node_tree.nodes.get('Principled BSDF')
    col = (*hexlin(PAL[name]), 1.0)
    b.inputs['Base Color'].default_value = col
    b.inputs['Roughness'].default_value = 0.15 if name == 'pal_glass' else 0.9
    b.inputs['Metallic'].default_value = 0.0
    m.diffuse_color = col
    MATS[name] = m
    return m


# ============================================================================ math helpers
def clamp(x, a, b):
    return a if x < a else b if x > b else x


def sstep(a, b, x):
    t = clamp((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def sm(x, w):
    """0 for x << 0, 1 for x >> 0, smooth over [-w, w]."""
    return sstep(-w, w, x)


def lerp(a, b, t):
    return a + (b - a) * t


def wrapa(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


def R(axis, deg):
    return Matrix.Rotation(math.radians(deg), 3, V(axis))


def E(pitch=0.0, yaw=0.0, roll=0.0):
    """Rotation in rest-world axes: pitch about X (+ leans forward / nods down), yaw about Z (+ turns to the
    character's left), roll about Y (+ tilts the top toward the character's left)."""
    return R((0, 0, 1), yaw) @ R((1, 0, 0), pitch) @ R((0, 1, 0), roll)


def dir_pe(phi, e):
    return V((math.cos(e) * math.sin(phi), -math.cos(e) * math.cos(phi), math.sin(e)))


def pw(v, m):
    return math.copysign(abs(v) ** m, v)


# ============================================================================ keyframe curve helper (also used for profiles)
def interp(keys, f, loop=None):
    if loop:
        f = f % loop
        ext = [(k - loop, v) for k, v in keys[-2:]] + list(keys) + [(k + loop, v) for k, v in keys[:2]]
    else:
        if f <= keys[0][0]:
            return keys[0][1]
        if f >= keys[-1][0]:
            return keys[-1][1]
        ext = [keys[0]] + list(keys) + [keys[-1]]
    for i in range(1, len(ext) - 2):
        t1, p1 = ext[i]; t2, p2 = ext[i + 1]
        if t1 <= f <= t2 and t2 > t1:
            t0, p0 = ext[i - 1]; t3, p3 = ext[i + 2]
            m1 = 0.0 if t2 == t0 or (p1 - p0) * (p2 - p1) <= 0 else (p2 - p0) / (t2 - t0)
            m2 = 0.0 if t3 == t1 or (p2 - p1) * (p3 - p2) <= 0 else (p3 - p1) / (t3 - t1)
            if not loop:
                if i == 1:
                    m1 = 0.0
                if i == len(ext) - 3:
                    m2 = 0.0
            dt = t2 - t1; s = (f - t1) / dt
            h00 = 2 * s ** 3 - 3 * s ** 2 + 1; h10 = s ** 3 - 2 * s ** 2 + s
            h01 = -2 * s ** 3 + 3 * s ** 2; h11 = s ** 3 - s ** 2
            return h00 * p1 + h10 * dt * m1 + h01 * p2 + h11 * dt * m2
    return keys[-1][1]


# ============================================================================ surfaces
class Ell:
    """Super-ellipsoid parameterised by azimuth phi (0 = front -Y, +pi/2 = +X) and elevation e.
    Base for radially displaced clay shells (hair, beard, cap, jacket...)."""

    def __init__(self, c, r, nxy=2.0, nz=2.0, pear=0.0, rot=None):
        self.c = V(c); self.r = r; self.mxy = 2.0 / nxy; self.mz = 2.0 / nz; self.pear = pear
        self.rot = rot

    def unit(self, phi, e):
        z = pw(math.sin(e), self.mz); cc = pw(math.cos(e), self.mz)
        return cc * pw(math.sin(phi), self.mxy), -cc * pw(math.cos(phi), self.mxy), z

    def base(self, phi, e):
        x, y, z = self.unit(phi, e)
        f = 1 - self.pear * z
        p = V((x * self.r[0] * f, y * self.r[1] * f, z * self.r[2]))
        if self.rot is not None:
            p = self.rot @ p
        return self.c + p

    def frame(self, phi, e):
        h = 1e-3
        e2 = clamp(e, -1.5697, 1.5697)
        dp = self.base(phi + h, e2) - self.base(phi - h, e2)
        de = self.base(phi, e2 + h) - self.base(phi, e2 - h)
        n = dp.cross(de)
        if n.length < 1e-14:
            n = V((0, 0, 1 if e > 0 else -1))
            if self.rot is not None:
                n = self.rot @ n
        n.normalize()
        tp = dp.normalized() if dp.length > 1e-12 else V((1, 0, 0))
        tp = (tp - n * tp.dot(n)).normalized()
        te = n.cross(tp)
        return self.base(phi, e), n, tp, te

    def at(self, phi, e, off=0.0):
        p, n, _, _ = self.frame(phi, e)
        return p + n * off


class HeadShape(Ell):
    """Adult head: tapered jaw, slightly flatter face, fuller back of the skull."""

    def __init__(self, c, r, jaw=0.22, chin=0.06):
        super().__init__(c, r)
        self.jaw = jaw; self.chin = chin

    def base(self, phi, e):
        x, y, z = self.unit(phi, e)
        if z < 0:
            x *= 1 - self.jaw * (-z) ** 1.5
            if y < 0:
                y *= 1 + self.chin * (-z) ** 3
        y *= 0.985 + 0.06 * math.tanh(3.0 * y)
        y *= 1 + 0.05 * max(0.0, y) * max(0.0, z)
        return self.c + V((x * self.r[0], y * self.r[1], z * self.r[2]))


class Lathe(Ell):
    """Closed body: half-width W(z) and half-depth D(z) profiles, superellipse sections, rounded end caps.
    Same (phi, e) parameterisation as Ell (z = z0..z1 as sin(e) goes -1..1)."""

    def __init__(self, z0, z1, W, D, nxy=2.4, k=5.0, c=(0, 0, 0), open_bottom=False):
        super().__init__(c, (1, 1, 1), nxy=nxy)
        self.z0, self.z1, self.W, self.D, self.k = z0, z1, W, D, k
        self.open_bottom = open_bottom

    def zof(self, e):
        return self.z0 + (self.z1 - self.z0) * (math.sin(e) + 1) / 2

    def base(self, phi, e):
        s = math.sin(e)
        z = self.zof(e)
        env = max(0.0, 1 - abs(s) ** self.k) ** (1.0 / self.k) if (s > 0 or not self.open_bottom) else 1.0
        w = interp(self.W, z) * env; d = interp(self.D, z) * env
        return self.c + V((w * pw(math.sin(phi), self.mxy), -d * pw(math.cos(phi), self.mxy), z))


def surf(ell, disp, nu, erows, top=True, bottom=True):
    """Grid over (phi, e). erows: list of e values, or a function phi -> list (same length).
    Returns verts, faces, displacement per vertex, (phi, e) per vertex."""
    verts, faces, dv, prm = [], [], [], []
    rows = len(erows(0.0)) if callable(erows) else len(erows)
    for i in range(rows):
        for j in range(nu):
            phi = 2 * math.pi * j / nu
            e = erows(phi)[i] if callable(erows) else erows[i]
            p, n, _, _ = ell.frame(phi, e)
            d = disp(phi, e) if disp else 0.0
            verts.append(p + n * d); dv.append(d); prm.append((phi, e))

    def ix(i, j):
        return i * nu + (j % nu)
    for i in range(rows - 1):
        for j in range(nu):
            faces.append((ix(i, j), ix(i, j + 1), ix(i + 1, j + 1), ix(i + 1, j)))
    for flag, e0, sgn in ((bottom, -math.pi / 2, -1), (top, math.pi / 2, 1)):
        if not flag:
            continue
        b = len(verts); p, n, _, _ = ell.frame(0.0, e0); d = disp(0.0, e0) if disp else 0.0
        verts.append(p + n * d); dv.append(d); prm.append((0.0, e0))
        for j in range(nu):
            if sgn < 0:
                faces.append((b, ix(0, j + 1), ix(0, j)))
            else:
                faces.append((ix(rows - 1, j), ix(rows - 1, j + 1), b))
    return verts, faces, dv, prm


def erange(nv):
    return [-math.pi / 2 + math.pi * i / nv for i in range(1, nv)]


def cull(verts, faces, hidden):
    keep = [f for f in faces if not all(hidden[i] for i in f)]
    used = sorted({i for f in keep for i in f})
    rm = {o: n for n, o in enumerate(used)}
    return [verts[i] for i in used], [tuple(rm[i] for i in f) for f in keep]


def ellipsoid(c, radii, nu=16, nv=10, basis=None, deform=None, nxy=2.0, nz=2.0):
    unit = Ell((0, 0, 0), (1, 1, 1), nxy, nz)
    vs, fs, _, _ = surf(unit, None, nu, erange(nv))
    out = []
    for u in vs:
        p = V((u.x * radii[0], u.y * radii[1], u.z * radii[2]))
        if deform:
            p = deform(p)
        if basis is not None:
            p = basis @ p
        out.append(p + V(c))
    return out, fs


def basis_cols(a, b, c):
    return Matrix((a, b, c)).transposed()


def tube(points, radii, segs=10, caps=(True, True), cap_rings=3, normals=None, flat=None, rfn=None):
    pts = [V(p) for p in points]
    n = len(pts)
    if not isinstance(radii, (list, tuple)):
        radii = [radii] * n
    tans = []
    for i in range(n):
        t = (pts[1] - pts[0]) if i == 0 else (pts[-1] - pts[-2]) if i == n - 1 else (pts[i + 1] - pts[i - 1])
        tans.append(t.normalized())
    frames = []
    if normals is not None:
        for i in range(n):
            nn = V(normals[i] if isinstance(normals, list) else normals)
            nn = (nn - tans[i] * nn.dot(tans[i])).normalized()
            frames.append((nn, tans[i].cross(nn)))
    else:
        ref = V((0, 0, 1)) if abs(tans[0].z) < 0.9 else V((1, 0, 0))
        nn = (ref - tans[0] * ref.dot(tans[0])).normalized()
        for i in range(n):
            if i > 0:
                nn = tans[i - 1].rotation_difference(tans[i]) @ nn
                nn = (nn - tans[i] * nn.dot(tans[i])).normalized()
            frames.append((nn.copy(), tans[i].cross(nn)))
    fl = flat or [(1, 1)] * n
    if not isinstance(fl, list):
        fl = [fl] * n
    verts, faces, rings = [], [], []

    def ring(c, fr, r, f, ri):
        idx = len(verts)
        N, B = fr
        for k in range(segs):
            a = 2 * math.pi * k / segs
            rr = rfn(ri, k, r) if (rfn and ri >= 0) else r
            verts.append(c + N * (math.cos(a) * rr * f[0]) + B * (math.sin(a) * rr * f[1]))
        rings.append(idx)
    if caps[0]:
        sp = len(verts); verts.append(pts[0] - tans[0] * radii[0] * 0.95)
        for j in range(1, cap_rings):
            a = (math.pi / 2) * j / cap_rings
            ring(pts[0] - tans[0] * radii[0] * 0.95 * math.cos(a), frames[0], radii[0] * math.sin(a), fl[0], -1)
    for i in range(n):
        ring(pts[i], frames[i], radii[i], fl[i], i)
    if caps[1]:
        for j in range(cap_rings - 1, 0, -1):
            a = (math.pi / 2) * j / cap_rings
            ring(pts[-1] + tans[-1] * radii[-1] * 0.95 * math.cos(a), frames[-1], radii[-1] * math.sin(a), fl[-1], -1)
        ep = len(verts); verts.append(pts[-1] + tans[-1] * radii[-1] * 0.95)
    for ri in range(len(rings) - 1):
        a0, a1 = rings[ri], rings[ri + 1]
        for k in range(segs):
            k2 = (k + 1) % segs
            faces.append((a0 + k, a0 + k2, a1 + k2, a1 + k))
    if caps[0]:
        a0 = rings[0]
        for k in range(segs):
            faces.append((sp, a0 + (k + 1) % segs, a0 + k))
    if caps[1]:
        a0 = rings[-1]
        for k in range(segs):
            faces.append((a0 + k, a0 + (k + 1) % segs, ep))
    return verts, faces


def slab(outline, z0, z1, bevel=0.0, steps=2):
    n = len(outline)
    c = V((sum(p[0] for p in outline) / n, sum(p[1] for p in outline) / n, 0))
    rings = []
    if bevel > 0:
        for k in range(steps + 1):
            a = (math.pi / 2) * k / steps
            rings.append((bevel * (1 - math.sin(a)), z0 + bevel * (1 - math.cos(a))))
        for k in range(steps + 1):
            a = (math.pi / 2) * k / steps
            rings.append((bevel * (1 - math.cos(a)), z1 - bevel * (1 - math.sin(a))))
    else:
        rings = [(0, z0), (0, z1)]
    norms = []
    for i in range(n):
        p0 = V((*outline[i - 1], 0)); p2 = V((*outline[(i + 1) % n], 0))
        t = (p2 - p0).normalized()
        norms.append(V((t.y, -t.x, 0)))
    verts, faces = [], []
    for inset, z in rings:
        for i in range(n):
            p = V((*outline[i], 0)) - norms[i] * inset
            verts.append(V((p.x, p.y, z)))
    Rn = len(rings)
    for r in range(Rn - 1):
        for i in range(n):
            i2 = (i + 1) % n
            a, b = r * n + i, r * n + i2
            faces.append((a, b, b + n, a + n))
    bc = len(verts); verts.append(V((c.x, c.y, rings[0][1])))
    tc = len(verts); verts.append(V((c.x, c.y, rings[-1][1])))
    for i in range(n):
        i2 = (i + 1) % n
        faces.append((bc, i2, i))
        faces.append(((Rn - 1) * n + i, (Rn - 1) * n + i2, tc))
    return verts, faces


def ring_torus(center, normal, R0, r, segs=24, rsegs=8, rx=None):
    n = V(normal).normalized()
    a = V((1, 0, 0)) if abs(n.x) < 0.9 else n.orthogonal().normalized()
    a = (a - n * a.dot(n)).normalized(); b = n.cross(a)
    rxx = rx or R0
    verts, faces = [], []
    for k in range(segs):
        t = 2 * math.pi * k / segs
        p = V(center) + a * (math.cos(t) * rxx) + b * (math.sin(t) * R0)
        radial = (a * math.cos(t) + b * math.sin(t)).normalized()
        for j in range(rsegs):
            s = 2 * math.pi * j / rsegs
            verts.append(p + radial * (math.cos(s) * r) + n * (math.sin(s) * r))
    for k in range(segs):
        k2 = (k + 1) % segs
        for j in range(rsegs):
            j2 = (j + 1) % rsegs
            faces.append((k * rsegs + j, k2 * rsegs + j, k2 * rsegs + j2, k * rsegs + j2))
    return verts, faces


# ============================================================================ objects
class Char:
    def __init__(self, name):
        self.name = name
        self.coll = bpy.context.scene.collection
        self.root = bpy.data.objects.new(name, None)
        self.root.empty_display_size = 0.3
        self.coll.objects.link(self.root)
        self.parts = []

    def add(self, pname, verts, faces, matname, rule, closed=True, decimate=None, outward=None, solidify=None, loose=None):
        me = bpy.data.meshes.new(self.name + '_' + pname)
        me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
        me.validate(clean_customdata=False)
        me.update()
        me.materials.append(mat(matname))
        ob = bpy.data.objects.new(self.name + '_' + pname, me)
        self.coll.objects.link(ob)
        ob.parent = self.root
        if closed:
            bm = bmesh.new(); bm.from_mesh(me)
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            bm.to_mesh(me); bm.free()
        elif outward is not None:
            s = 0.0
            for p in me.polygons:
                s += p.normal.dot(p.center - V(outward)) * p.area
            if s < 0:
                me.flip_normals()
        if solidify:
            mod = ob.modifiers.new('sol', 'SOLIDIFY'); mod.thickness = solidify; mod.offset = -1.0; mod.use_rim = True
            dg = bpy.context.evaluated_depsgraph_get()
            nm = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
            ob.modifiers.remove(mod)
            old = ob.data; ob.data = nm; nm.name = old.name; bpy.data.meshes.remove(old)
            me = nm
        if decimate:
            mod = ob.modifiers.new('dec', 'DECIMATE'); mod.ratio = decimate
            dg = bpy.context.evaluated_depsgraph_get()
            nm = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
            ob.modifiers.remove(mod)
            old = ob.data; ob.data = nm; nm.name = old.name; bpy.data.meshes.remove(old)
            me = nm
        me.shade_smooth()
        ob['rule'] = json.dumps(rule)
        if loose:
            ob['loose'] = loose
        self.parts.append(ob)
        return ob

    def tris(self):
        return sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in self.parts)


# ============================================================================ adult skeleton (shared humanoid)
SH_X, SH_Z = 0.172, 1.345          # shoulder joint
AOUT = 45.0                        # rest A-pose: arms 45 deg out from vertical
UA, LA, HA, FA = 0.270, 0.250, 0.085, 0.080   # upper arm, forearm, palm, fingers
HIP_X, HIP_Z, KNEE_Z, ANK_Z = 0.090, 0.840, 0.460, 0.085
HC = V((0, 0.006, 1.518)); HR = (0.100, 0.115, 0.125)   # head
EYE_PHI, EYE_E = 0.385, 0.03
EYE_Z = HC.z + HR[2] * math.sin(EYE_E)


def arm_pts(sg):
    a = math.radians(AOUT)
    d = V((sg * math.sin(a), 0, -math.cos(a)))
    S = V((sg * SH_X, 0, SH_Z)); Eb = S + d * UA; W = Eb + d * LA
    return S, Eb, W, d


def arm_q(sg):
    a = math.radians(AOUT)
    return V((sg * math.cos(a), 0, math.sin(a)))      # outward-up, perpendicular to the arm (palm normal = -q)


def leg_pts(sg):
    Hp = V((sg * HIP_X, 0, HIP_Z)); K = V((sg * HIP_X, -0.012, KNEE_Z)); A = V((sg * HIP_X, 0, ANK_Z))
    return Hp, K, A


def human_bones():
    d = [('root', (0, 0, 0), (0, 0, 0.12), None),
         ('hips', (0, 0, 0.90), (0, 0, 1.00), 'root'),
         ('spine', (0, 0, 1.00), (0, 0, 1.16), 'hips'),
         ('chest', (0, 0, 1.16), (0, 0, 1.36), 'spine'),
         ('neck', (0, 0.006, 1.38), (0, 0.006, 1.47), 'chest'),
         ('head', (0, 0.006, 1.47), (0, 0.006, 1.66), 'neck'),
         ('eyes', (0, -0.085, EYE_Z + 0.004), (0, -0.13, EYE_Z + 0.004), 'head')]
    for s, sg in (('L', 1), ('R', -1)):
        S, Eb, W, dd = arm_pts(sg)
        Hp, K, A = leg_pts(sg)
        d += [('shoulder_' + s, (sg * 0.03, 0, SH_Z), tuple(S), 'chest'),
              ('upper_arm_' + s, tuple(S), tuple(Eb), 'shoulder_' + s),
              ('lower_arm_' + s, tuple(Eb), tuple(W), 'upper_arm_' + s),
              ('hand_' + s, tuple(W), tuple(W + dd * HA), 'lower_arm_' + s),
              ('fingers_' + s, tuple(W + dd * HA), tuple(W + dd * (HA + FA)), 'hand_' + s),
              ('upper_leg_' + s, tuple(Hp), tuple(K), 'hips'),
              ('lower_leg_' + s, tuple(K), tuple(A), 'upper_leg_' + s),
              ('foot_' + s, tuple(A), (sg * HIP_X, -0.135, 0.028), 'lower_leg_' + s)]
    return d


def parrot_bones():
    return [('root', (0, 0, 0), (0, 0, 0.04), None),
            ('body', (0, 0.01, 0.045), (0, 0.0, 0.21), 'root'),
            ('head', (0, 0, 0.215), (0, -0.004, 0.31), 'body'),
            ('beak', (0, -0.052, 0.252), (0, -0.094, 0.238), 'head'),
            ('eyes', (0, -0.03, 0.283), (0, -0.07, 0.283), 'head'),
            ('wing_L', (0.060, 0.0, 0.190), (0.062, 0.088, 0.058), 'body'),
            ('wing_R', (-0.060, 0.0, 0.190), (-0.062, 0.088, 0.058), 'body'),
            ('tail', (0, 0.06, 0.08), (0, 0.165, 0.014), 'body')]


# ============================================================================ head building blocks
HEAD = HeadShape(HC, HR, jaw=0.31, chin=0.10)


def feat(ell, phi, e, off, radii, nu=12, nv=8, tilt=0.0, nxy=2.0, nz=2.0):
    p, n, tp, te = ell.frame(phi, e)
    if tilt:
        rm = Matrix.Rotation(math.radians(tilt), 3, n)
        tp = rm @ tp; te = rm @ te
    return ellipsoid(p + n * off, radii, nu, nv, basis=basis_cols(tp, te, n), nxy=nxy, nz=nz)


def cap_rim(phi):
    return 0.32 + 0.32 * math.cos(phi)


def cap_disp(phi, e):
    """Six-panel structured crown: a band that rolls under at the rim, a raised front, panel seams."""
    d = e - cap_rim(phi)
    if d <= -0.035:
        return -0.008
    if d < 0.065:
        t = (0.065 - d) / 0.10
        return -0.003 + 0.0175 * math.sqrt(max(0.0, 1 - t * t))
    c = math.cos(phi)
    base = 0.0145
    base += 0.013 * (0.55 + 0.45 * max(0.0, c)) * sm(d - 0.16, 0.12) * (1 - 0.55 * sm(e - 1.2, 0.25))
    seam = 0.0
    for k in range(6):
        seam += math.exp(-((wrapa(phi - k * math.pi / 3) * math.cos(e)) / 0.022) ** 2)
    base -= 0.0026 * min(1.0, seam) * sm(d - 0.10, 0.04) * (1 - sm(e - 1.45, 0.05))
    return base


def player_ink(phi, e):
    """Short trimmed hair below the cap plus a groomed full beard that follows the jaw."""
    p = wrapa(phi); a = abs(p)
    eb = interp([(0.0, -0.212), (0.17, -0.235), (0.27, -0.30), (0.34, -0.375), (0.55, -0.395), (0.85, -0.385), (1.12, -0.355), (1.34, -0.32), (1.40, -0.10), (1.43, 0.40)], a)
    face = sm(1.43 - a, 0.022) * sm(e - eb, 0.02)
    nape = sm(a - 2.0, 0.15) * sm(-0.46 - e, 0.05)
    hole = sm(1 - ((p / 0.165) ** 2 + ((e + 0.376 - 0.028 * (p / 0.15) ** 2) / 0.024) ** 2), 0.3)
    ink = (1 - face) * (1 - nape) * (1 - hole)
    beard = sm(-0.02 - e, 0.08) * sm(1.75 - a, 0.2)
    chin = sm(-0.55 - e, 0.16) * sm(0.85 - a, 0.3) * (1 - 0.8 * sm(-1.0 - e, 0.15))
    jaw = sm(-0.45 - e, 0.2)
    T = 0.0058 + beard * (0.0022 + 0.0035 * jaw + 0.0150 * chin)
    ec = -0.268 - 0.075 * (p / 0.30) ** 2
    T += 0.0068 * math.exp(-(abs(p) / 0.29) ** 2.6 - ((e - ec) / 0.042) ** 2)
    T += 0.0008 * noise.noise(dir_pe(phi, e) * 9.0)
    return -0.006 + (T + 0.006) * ink


def add_eyes(ch, ell, off_fn, phi0=EYE_PHI, e0=EYE_E, lod=1, lash='pal_ink', iris='pal_wood_dark'):
    for sg in (1, -1):
        s = 'L' if sg > 0 else 'R'
        phi = sg * phi0
        off = off_fn(phi, e0)
        v, f = feat(ell, phi, e0, off - 0.0068, (0.0208, 0.0118, 0.0090), 12 if lod else 8, 7 if lod else 5, tilt=sg * 5, nxy=1.8)
        ch.add('eye_white_' + s, v, f, 'pal_white', ['rigid', 'eyes'])
        v, f = feat(ell, phi - sg * 0.010, e0 + 0.009, off + 0.0032, (0.0100, 0.0104, 0.0042), 10 if lod else 8, 6 if lod else 5)
        ch.add('iris_' + s, v, f, iris, ['rigid', 'eyes'])
        if lod:
            v, f = feat(ell, phi - sg * 0.010, e0 + 0.009, off + 0.0058, (0.0048, 0.0050, 0.0026), 8, 4)
            ch.add('pupil_' + s, v, f, 'pal_ink', ['rigid', 'eyes'])
        v, f = feat(ell, phi - sg * 0.010 + 0.030, e0 + 0.032, off + 0.0078, (0.0027, 0.0027, 0.0018), 6, 4)
        ch.add('glint_' + s, v, f, 'pal_white', ['rigid', 'eyes'])
        pts, rad = [], []
        for k in range(6):
            u = -1 + 2 * k / 5
            ph = phi + sg * u * 0.232
            ee = e0 + 0.002 + 0.090 * math.sqrt(max(0.0, 1 - u * u)) * (1 - 0.12 * u * sg)
            pts.append(ell.at(ph, ee, off_fn(ph, ee) + 0.0018))
            rad.append(0.0017 + 0.0012 * sstep(-0.2, 1.0, u * sg))
        if not lod:
            pts, rad = pts[::2] + [pts[-1]], rad[::2] + [rad[-1]]
        v, f = tube(pts, rad, segs=4 if lod else 3, cap_rings=2)
        ch.add('lash_' + s, v, f, lash, ['rigid', 'head'])


def add_brows(ch, ell, off_fn, matname, e0=0.19, thick=1.0, lift=0.0, span=(0.09, 0.53), segs=6):
    for sg in (1, -1):
        pts, rad = [], []
        for k in range(5):
            t = k / 4
            phi = sg * (span[0] + (span[1] - span[0]) * t)
            e = e0 + 0.030 * math.sin(math.pi * min(1.0, t * 1.45)) - 0.05 * t * t + 0.012 * t + lift * (1 - t)
            pts.append(ell.at(phi, e, off_fn(phi, e) + 0.0035))
            rad.append(thick * (0.0064 - 0.0022 * t))
        p, n, tp, te = ell.frame(sg * 0.3, e0)
        v, f = tube(pts, rad, segs=segs, cap_rings=2, normals=[n] * 5, flat=(0.55, 1.0))
        ch.add('brow_' + ('L' if sg > 0 else 'R'), v, f, matname, ['rigid', 'head'])


def add_nose(ch, ell, matname, size=1.0, lod=1):
    es = [0.10, 0.03, -0.05, -0.12, -0.165]
    offs = [-0.002, 0.003, 0.009, 0.016, 0.0175]
    rad = [0.0065, 0.0072, 0.0082, 0.0102, 0.0108]
    pts = [ell.at(0.0, e, o * size) for e, o in zip(es, offs)]
    v, f = tube(pts, [r * size for r in rad], segs=7 if lod else 5, cap_rings=2)
    ch.add('nose', v, f, matname, ['rigid', 'head'])
    for sg in ((1, -1) if lod else ()):
        v, f = feat(ell, sg * 0.125, -0.178, 0.0045 * size, (0.0092 * size, 0.0072 * size, 0.0075 * size), 6, 4)
        ch.add('nostril_' + ('L' if sg > 0 else 'R'), v, f, matname, ['rigid', 'head'])


def add_mouth_line(ch, ell, e0=-0.375, width=0.13, smile=0.012, matname='pal_coral_deep', r=0.0028):
    pts = []
    for k in range(5):
        t = k / 4
        phi = -width + 2 * width * t
        e = e0 - smile * math.sin(math.pi * t) + 0.012 * (abs(2 * t - 1)) ** 2
        pts.append(ell.at(phi, e, 0.0012))
    v, f = tube(pts, r, segs=4, cap_rings=2)
    ch.add('mouth', v, f, matname, ['rigid', 'head'])


def add_ears(ch, ell, off_fn, matname, e0=-0.06, lod=1):
    for sg in (1, -1):
        s = 'L' if sg > 0 else 'R'
        phi = sg * 1.62
        base = off_fn(phi, e0) + 0.003
        v, f = feat(ell, phi, e0, base, (0.019, 0.031, 0.0065), 10 if lod else 8, 6 if lod else 5, tilt=-sg * 10)
        ch.add('ear_' + s, v, f, matname, ['rigid', 'head'])
        if lod:
            p0, n, tp, te = ell.frame(phi, e0)
            rm = Matrix.Rotation(math.radians(-sg * 10), 3, n)
            tp = rm @ tp; te = rm @ te
            c = p0 + n * (base + 0.0045)
            pts = []
            for k in range(7):
                a = math.radians(-60 + 220 * k / 6)
                pts.append(c + te * (0.026 * math.cos(a)) + tp * (sg * 0.015 * math.sin(a)))
            v, f = tube(pts, [0.0032, 0.0042, 0.0046, 0.0046, 0.0044, 0.0040, 0.0034], segs=5, cap_rings=2)
            ch.add('ear_helix_' + s, v, f, matname, ['rigid', 'head'])


def add_skin_head(ch, matname, cover_fn, nu=28, nv=20, ell=HEAD):
    v, f, _, prm = surf(ell, None, nu, erange(nv))
    hid = [cover_fn(phi, e) > 0.004 for phi, e in prm]
    v, f = cull(v, f, hid)
    ch.add('head', v, f, matname, ['rigid', 'head'], closed=False, outward=ell.c)


def add_shell(ch, pname, matname, disp, cover_fn=None, nu=96, nv=60, dec=None, rule=None, ell=HEAD):
    v, f, dv, prm = surf(ell, disp, nu, erange(nv))
    hid = []
    for i, (phi, e) in enumerate(prm):
        h = dv[i] < -0.003
        if cover_fn and cover_fn(phi, e) > dv[i] + 0.004:
            h = True
        hid.append(h)
    v, f = cull(v, f, hid)
    return ch.add(pname, v, f, matname, rule or ['rigid', 'head'], closed=False, outward=ell.c, decimate=dec)


def add_cap(ch):
    def rows(phi):
        r0 = cap_rim(phi)
        out = [r0 + s for s in [-0.035, -0.026, -0.016, -0.006, 0.006, 0.02, 0.04, 0.065]]
        out += [r0 + 0.065 + (math.pi / 2 - 0.004 - r0 - 0.065) * (k / 14) ** 0.85 for k in range(1, 15)]
        return out
    v, f, dv, prm = surf(HEAD, cap_disp, 120, rows, top=True, bottom=False)
    ch.add('cap', v, f, 'pal_ink', ['rigid', 'head'], closed=False, outward=HC, decimate=0.40)
    A, B = 0.094, 0.148
    N = 22
    outline = [(A * math.cos(math.pi * k / N), -0.034 - B * math.sin(math.pi * k / N)) for k in range(N, -1, -1)]
    vs, fs = slab(outline, -0.0056, 0.0056, bevel=0.0052, steps=2)
    zb = HEAD.at(0.0, cap_rim(0.0) + 0.012, 0.0).z
    out = []
    for p in vs:
        q = V((p.x, p.y, p.z - 1.7 * p.x * p.x + 0.5 * max(0.0, -p.y - 0.11) ** 2))
        q = R((1, 0, 0), -4) @ (q - V((0, -0.09, 0))) + V((0, -0.09, 0))
        out.append(q + V((0, HC.y, zb - 0.002)))
    ch.add('cap_brim', out, fs, 'pal_ink', ['rigid', 'head'])
    v, f = ellipsoid(HEAD.at(0.0, math.pi / 2, cap_disp(0.0, math.pi / 2)) + V((0, 0, 0.0015)), (0.0085, 0.0085, 0.005), 8, 5)
    ch.add('cap_button', v, f, 'pal_ink', ['rigid', 'head'])


# ============================================================================ body building blocks
TORSO_W = [(0.80, 0.152), (0.88, 0.157), (0.98, 0.143), (1.10, 0.146), (1.20, 0.160), (1.29, 0.172), (1.36, 0.170), (1.43, 0.130)]
TORSO_D = [(0.80, 0.106), (0.88, 0.113), (0.98, 0.104), (1.10, 0.109), (1.20, 0.117), (1.29, 0.111), (1.36, 0.098), (1.43, 0.080)]


def torso(W=TORSO_W, D=TORSO_D, z0=0.80, z1=1.43):
    return Lathe(z0, z1, W, D, nxy=2.5, k=5.0)


TORSO = torso()


def z2e(z, T=TORSO):
    return math.asin(clamp(2 * (z - T.z0) / (T.z1 - T.z0) - 1, -1, 1))


def jacket_w(z):
    return 0.12 + 0.32 * sstep(1.15, 1.42, z)


def jacket_disp(phi, e):
    z = TORSO.zof(e)
    a = abs(wrapa(phi))
    edge = a - jacket_w(z)
    m = sm(edge, 0.025) * sm(z - 0.835, 0.012)
    T = 0.011
    T += 0.0035 * math.exp(-(edge / 0.035) ** 2)
    T += 0.0035 * sm(0.875 - z, 0.012)
    T -= 0.0018 * math.exp(-((a - math.pi / 2) / 0.035) ** 2)
    T -= 0.0014 * math.exp(-((z - 1.30) / 0.01) ** 2) * sm(a - 1.7, 0.2)
    T += 0.0022 * noise.noise(V((phi * 1.3, z * 7.0, 1.7)))
    return -0.005 + (T + 0.005) * m


TORSO_RULE = ['torso']


def jacket_fold(phi, z):
    return 0.0022 * noise.noise(V((phi * 1.4, z * 6.0, 1.7))) - 0.0015 * math.exp(-((abs(wrapa(phi)) - math.pi / 2) / 0.05) ** 2)


def add_jacket(ch, rows=20, cols=30):
    T = TORSO
    zh, zt = 0.835, 1.426
    v, f, _, prm = surf(T, None, 24, erange(18))
    hid = [abs(wrapa(phi)) > jacket_w(T.zof(e)) + 0.06 and T.zof(e) > zh + 0.02 for phi, e in prm]
    v, f = cull(v, f, hid)
    ch.add('tee', v, f, 'pal_navy', TORSO_RULE, closed=False, outward=V((0, 0, 1.14)))
    v, f = ring_torus((0, 0.010, 1.418), (0, 0.25, 1), 0.058, 0.0085, 16, 5, rx=0.064)
    ch.add('tee_collar', v, f, 'pal_navy', ['rigid', 'chest'])
    verts, faces = [], []
    edgeL, edgeR, hem = [], [], []
    for i in range(rows):
        t = i / (rows - 1)
        z = zh + (zt - zh) * t
        e = z2e(z); w = jacket_w(z)
        for j in range(cols):
            u = j / (cols - 1)
            phi = w + (2 * math.pi - 2 * w) * u
            p, n, _, _ = T.frame(phi, e)
            d = 0.0165 + jacket_fold(phi, z) + 0.0045 * sm(0.87 - z, 0.012)
            verts.append(p + n * d)
            if j == 0:
                edgeL.append(p + n * 0.0110)
            if j == cols - 1:
                edgeR.append(p + n * 0.0110)
            if i == 0:
                hem.append(p + n * 0.0135)
    for i in range(rows - 1):
        for j in range(cols - 1):
            a0 = i * cols + j
            faces.append((a0, a0 + 1, a0 + cols + 1, a0 + cols))
    ch.add('jacket', verts, faces, 'pal_tan', TORSO_RULE, closed=False, outward=V((0, 0, 1.14)))
    for nm, pts in (('placket_L', edgeL), ('placket_R', edgeR)):
        v, f = tube(pts[::2] + [pts[-1]], 0.0115, segs=6, cap_rings=2)
        ch.add(nm, v, f, 'pal_tan', TORSO_RULE)
    v, f = tube(hem[::2] + [hem[-1]], 0.0125, segs=6, cap_rings=2)
    ch.add('hem', v, f, 'pal_tan', TORSO_RULE)
    for sg in (1, -1):
        s = 'L' if sg > 0 else 'R'
        p, n, tp, te = TORSO.frame(sg * 0.80, z2e(0.97))
        v, f = ellipsoid(p + n * 0.0195, (0.044, 0.021, 0.0060), 10, 6, basis=basis_cols(tp, te, n), nxy=3.0, nz=3.0)
        ch.add('pocket_' + s, v, f, 'pal_tan', TORSO_RULE)
        pts = []
        for k in range(6):
            z = 1.395 - 0.21 * k / 5
            pts.append(TORSO.at(sg * (jacket_w(z) + 0.03), z2e(z), 0.025))
        v, f = tube(pts, 0.0032, segs=5, cap_rings=2)
        ch.add('cord_' + s, v, f, 'pal_ink', ['rigid', 'chest'])
        v, f = ellipsoid(pts[-1] + V((0, -0.002, -0.006)), (0.0055, 0.0055, 0.009), 6, 4)
        ch.add('cord_tip_' + s, v, f, 'pal_ink', ['rigid', 'chest'])


def add_collar(ch, matname='pal_fur', closed_ring=False, z0=1.402, lump=1.0, r=0.034, segs=8, n=22, a=0.134, b=0.118):
    pts, rad = [], []
    t0, t1 = (0.0, 2 * math.pi) if closed_ring else (0.58, 2 * math.pi - 0.58)
    for k in range(n + 1):
        t = t0 + (t1 - t0) * k / n
        pts.append(V((a * math.sin(t), 0.016 - b * math.cos(t), z0 - 0.022 * math.cos(t))))
        rad.append(r * (1.0 + 0.12 * math.cos(t)))

    def rfn(ri, k, rr):
        return rr * (1 + lump * (0.11 * math.sin(ri * 2.3 + k * 1.7) + 0.08 * noise.noise(V((ri * 0.7, k * 0.9, 3.1)))))
    v, f = tube(pts, rad, segs=segs, cap_rings=3, rfn=rfn)
    ch.add('collar', v, f, matname, ['rigid', 'chest'])


def add_neck(ch, matname):
    v, f = tube([(0, 0.008, 1.33), (0, 0.008, 1.40), (0, 0.008, 1.50)], [0.052, 0.049, 0.049], segs=10, caps=(False, False))
    ch.add('neck', v, f, matname, ['z', ['neck', 'head'], [1.45], 0.03], closed=False, outward=V((0, 0.008, 1.41)))


def add_arms(ch, sleeve, skin, cuff=None, lod=1):
    for s, sg in (('L', 1), ('R', -1)):
        S, Eb, W, d = arm_pts(sg)
        pts, rad = [], []
        n = 12 if lod else 8
        for k in range(n):
            t = k / (n - 1)
            pts.append(S + (W + d * 0.008 - S) * t)
            r = lerp(0.062, 0.052, sstep(0, 0.45, t)) - 0.004 * sstep(0.55, 0.95, t)
            if lod:
                r -= 0.0028 * math.exp(-((t - 0.10) / 0.025) ** 2)
                r += 0.0025 * math.exp(-((t - 0.47) / 0.03) ** 2) + 0.002 * math.exp(-((t - 0.56) / 0.03) ** 2)
                r += 0.004 * sstep(0.90, 0.97, t)
            rad.append(r)
        v, f = tube(pts, rad, segs=9 if lod else 6, cap_rings=2 if not lod else 3)
        ch.add('sleeve_' + s, v, f, sleeve, ['chain', [list(S), list(Eb), list(W)], ['upper_arm_' + s, 'lower_arm_' + s], [0.05]])
        if cuff:
            v, f = tube([W - d * 0.014, W + d * 0.008], 0.048, segs=8, cap_rings=2)
            ch.add('cuff_' + s, v, f, cuff, ['rigid', 'lower_arm_' + s])
        add_hand(ch, s, sg, skin, lod)


def add_hand(ch, s, sg, skin, lod=1):
    S, Eb, W, d = arm_pts(sg)
    q = arm_q(sg)
    y = V((0, -1, 0))
    L = HA + FA
    bas = basis_cols(q, y, d)
    if bas.determinant() < 0:
        bas = basis_cols(q, -y, d)

    def deform(p):
        w = (p.z + L / 2)
        t = w / L
        x = p.x * (1 - 0.22 * t) - 1.8 * max(0.0, w - 0.080) ** 2 + 0.004 * math.sin(math.pi * t)
        yy = p.y * (1.0 - 0.12 * max(0.0, t - 0.5))
        return V((x, yy, p.z))
    c = W + d * (L / 2 - 0.006)
    v, f = ellipsoid((0, 0, 0), (0.0225, 0.047, L / 2), 12 if lod else 8, 8 if lod else 6, nxy=2.7, nz=2.3, deform=deform)
    v = [bas @ p + c for p in v]
    Hk = W + d * HA
    ch.add('hand_' + s, v, f, skin, ['chain', [list(W - d * 0.03), list(Hk), list(W + d * L)], ['hand_' + s, 'fingers_' + s], [0.018]])
    pts = [W + d * 0.020 + y * 0.032 - q * 0.004, W + d * 0.055 + y * 0.055 - q * 0.013, W + d * 0.088 + y * 0.062 - q * 0.020]
    v, f = tube(pts, [0.0165, 0.0150, 0.0128], segs=7 if lod else 5, cap_rings=2)
    ch.add('thumb_' + s, v, f, skin, ['rigid', 'hand_' + s])


def add_legs(ch, pants, shoe, sole, lod=1, pelvis_w=0.163, loose=False, chappal=None, skin='pal_skin'):
    v, f = ellipsoid((0, 0.006, 0.862 if lod else 0.85), (pelvis_w + (0.018 if lod else 0.0), 0.124 if lod else 0.112, 0.108 if lod else 0.095), 12 if lod else 8, 8 if lod else 6)
    ch.add('pelvis', v, f, pants, ['rigid', 'hips'])
    for s, sg in (('L', 1), ('R', -1)):
        Hp, K, A = leg_pts(sg)
        n = 11 if lod else 7
        pts, rad = [], []
        for k in range(n):
            t = k / (n - 1)
            pts.append(Hp + (A + V((0, 0, 0.026)) - Hp) * t)
            r = interp([(0.0, 0.090), (0.35, 0.081), (0.52, 0.069), (0.70, 0.067), (0.92, 0.060), (1.0, 0.065)], t)
            if loose:
                r = interp([(0.0, 0.100), (0.40, 0.094), (0.62, 0.088), (0.80, 0.080), (0.90, 0.066), (0.96, 0.050), (1.0, 0.052)], t)
            if lod:
                r += 0.0022 * math.exp(-((t - 0.50) / 0.03) ** 2) + 0.003 * math.exp(-((t - 0.93) / 0.025) ** 2)
            rad.append(r)

        def rfn(ri, k, r, n=n):
            return r * (1 + 0.025 * math.sin(k * 2.1 + ri * 1.3) * (ri > n - 4))
        v, f = tube(pts, rad, segs=9 if lod else 7, cap_rings=3 if lod else 2, rfn=rfn if lod else None)
        ch.add('leg_' + s, v, f, pants, ['chain', [list(Hp), list(K), list(A)], ['upper_leg_' + s, 'lower_leg_' + s], [0.05]])
        cx = sg * (HIP_X + 0.004)
        cc = V((cx, -0.042, 0.062))
        if chappal:
            v, f = ellipsoid((cx, -0.048, 0.036), (0.043, 0.112, 0.030), 10, 6, nxy=2.4)
            ch.add('foot_' + s, v, f, skin, ['rigid', 'foot_' + s])
            outline = [(cx + 0.050 * math.cos(2 * math.pi * k / 12), -0.050 + 0.125 * pw(math.sin(2 * math.pi * k / 12), 0.8)) for k in range(12)]
            v, f = slab(outline, 0.0, 0.016, bevel=0.006, steps=1)
            ch.add('chappal_' + s, v, f, chappal, ['rigid', 'foot_' + s])
            pts = [V((cx + 0.047 * math.cos(a), -0.075, 0.012 + 0.046 * math.sin(a))) for a in [math.pi * k / 6 for k in range(7)]]
            v, f = tube(pts, 0.0075, segs=5, caps=(True, True), cap_rings=2, normals=(0, -1, 0), flat=(0.45, 1.0))
            ch.add('strap_' + s, v, f, chappal, ['rigid', 'foot_' + s])
            continue

        def toe(p):
            fwd = max(0.0, -(p.y + 0.03) / 0.10)
            return V((p.x * (1 - 0.12 * fwd), p.y, max(p.z, -0.04) - 0.010 * fwd * fwd))
        v, f = ellipsoid((0, 0, 0), (0.052, 0.126, 0.045), 12 if lod else 10, 8 if lod else 6, nxy=2.5, nz=2.3, deform=toe)
        ch.add('shoe_' + s, [p + cc for p in v], f, shoe, ['rigid', 'foot_' + s])
        nn = 14 if lod else 10
        outline = [(cx + 0.057 * math.cos(2 * math.pi * k / nn), -0.044 + 0.133 * pw(math.sin(2 * math.pi * k / nn), 0.8)) for k in range(nn)]
        v, f = slab(outline, 0.0, 0.027, bevel=0.010, steps=1)
        ch.add('sole_' + s, v, f, sole, ['rigid', 'foot_' + s])


# ============================================================================ characters
def build_player():
    ch = Char('player')
    cover = lambda p, e: max(player_ink(p, e), cap_disp(p, e))
    add_skin_head(ch, 'pal_skin', cover, nu=36, nv=26)
    add_shell(ch, 'hair_beard', 'pal_ink', player_ink, cover_fn=cap_disp, nu=150, nv=100, dec=0.10)
    add_cap(ch)
    skin_off = lambda p, e: 0.0
    add_eyes(ch, HEAD, skin_off)
    add_brows(ch, HEAD, skin_off, 'pal_ink', e0=0.168, thick=1.28, span=(0.09, 0.52))
    add_nose(ch, HEAD, 'pal_skin', size=0.86)
    add_ears(ch, HEAD, lambda p, e: max(0.0, player_ink(p, e)), 'pal_skin')
    pts = [HEAD.at(0.15 * u, -0.383 + 0.030 * u * u, 0.0012 - 0.0015 * u * u) for u in (-1, -0.6, -0.25, 0.0, 0.25, 0.6, 1)]
    v, f = tube(pts, [0.0022, 0.0034, 0.0040, 0.0042, 0.0040, 0.0034, 0.0022], segs=6, cap_rings=2, normals=[HEAD.frame(0.0, -0.38)[1]] * 7, flat=(0.7, 1.0))
    ch.add('lip', v, f, 'pal_coral', ['rigid', 'head'])
    add_neck(ch, 'pal_skin')
    add_jacket(ch)
    add_collar(ch)
    add_arms(ch, 'pal_tan', 'pal_skin')
    add_legs(ch, 'pal_ink', 'pal_white', 'pal_cream')
    return ch


# ---- NPC hair styles (adult)
def hair_bob(phi, e):
    a = abs(wrapa(phi))
    hl = 0.40 - 0.10 * (min(a, 1.1) / 1.1) ** 2 + 0.03 * math.cos(7 * wrapa(phi)) * sm(0.7 - a, 0.2)
    side_part = 0.05 * math.exp(-((wrapa(phi) - 0.35) / 0.1) ** 2)
    face = sm(1.10 - a, 0.05) * sm(hl + side_part - e, 0.04)
    bottom = sm(e + 0.62 - 0.08 * (a / math.pi), 0.04)
    ink = (1 - face) * bottom
    T = 0.010 + 0.11 * (1 - math.cos(min(0.0, e))) + 0.004 * sm(-e - 0.3, 0.15) + 0.006 * sm(e - 0.9, 0.3)
    T += 0.0015 * noise.noise(dir_pe(phi, e) * 8)
    return -0.006 + (T + 0.006) * ink


def hair_crop(phi, e):
    a = abs(wrapa(phi))
    hl = 0.62 - 0.05 * math.cos(2.0 * wrapa(phi) - 0.6) + 0.10 * sm(a - 0.5, 0.2)
    face = sm(1.12 - a, 0.05) * sm(hl - e, 0.035)
    side = sm(a - 1.10, 0.05) * sm(2.25 - a, 0.15) * sm(0.14 - e, 0.035)
    back = sm(-0.36 - e, 0.04)
    ink = (1 - face) * (1 - side) * (1 - back)
    T = 0.0075 + 0.004 * sm(e - 0.8, 0.3) + 0.0012 * noise.noise(dir_pe(phi, e) * 10)
    return -0.006 + (T + 0.006) * ink


def hair_bun(phi, e):
    a = abs(wrapa(phi))
    part = 0.035 * math.exp(-(wrapa(phi) / 0.10) ** 2)
    hl = 0.47 + part - 0.14 * (min(a, 1.15) / 1.15) ** 2
    face = sm(1.15 - a, 0.05) * sm(hl - e, 0.035)
    side = sm(a - 1.12, 0.05) * sm(2.2 - a, 0.2) * sm(-0.02 - e, 0.035)
    back = sm(-0.40 - e, 0.04)
    ink = (1 - face) * (1 - side) * (1 - back)
    T = 0.0085 + 0.002 * sm(e - 0.5, 0.3) + 0.0012 * noise.noise(dir_pe(phi, e) * 9)
    return -0.006 + (T + 0.006) * ink


def extra_glasses(ch):
    for sg in (1, -1):
        p, n, tp, te = HEAD.frame(sg * EYE_PHI, EYE_E)
        c = p + n * 0.017
        v, f = ring_torus(c, n, 0.0185, 0.0024, 12, 4, rx=0.0225)
        ch.add('glasses_' + ('L' if sg > 0 else 'R'), v, f, 'pal_ink', ['rigid', 'head'])
        outer = c + tp * (sg * 0.0225)
        ear = HEAD.at(sg * 1.45, EYE_E + 0.03, 0.012)
        v, f = tube([outer, outer.lerp(ear, 0.5) + n * 0.003, ear], 0.0021, segs=4, cap_rings=1)
        ch.add('glasses_arm_' + ('L' if sg > 0 else 'R'), v, f, 'pal_ink', ['rigid', 'head'])
    pl = HEAD.at(EYE_PHI - 0.255, EYE_E + 0.02, 0.016); pr = HEAD.at(-EYE_PHI + 0.255, EYE_E + 0.02, 0.016)
    mid = HEAD.at(0.0, EYE_E + 0.05, 0.020)
    v, f = tube([pl, mid, pr], 0.0021, segs=4, cap_rings=1)
    ch.add('glasses_bridge', v, f, 'pal_ink', ['rigid', 'head'])


def extra_scarf(ch):
    add_collar(ch, 'pal_yellow', closed_ring=True, z0=1.405, lump=0.3, r=0.034, segs=7, n=14, a=0.112, b=0.098)
    for k, (dx, dz, ln) in enumerate(((0.045, 0.0, 0.24), (0.075, 0.012, 0.19))):
        top = V((dx, -0.098, 1.385 + dz))
        pts = [top + V((0.008 * t, -0.03 * math.sin(t * 1.3) - 0.004 * t, -ln * t)) for t in (0, 0.33, 0.66, 1.0)]
        v, f = tube(pts, [0.028, 0.026, 0.025, 0.024], segs=6, cap_rings=2, normals=(0, -1, 0), flat=(0.30, 1.0))
        ch.add('scarf_tail_%d' % k, v, f, 'pal_yellow', ['rigid', 'chest'])


def extra_moustache(ch, matname):
    for sg in (1, -1):
        pts = [HEAD.at(sg * (0.02 + 0.13 * t), -0.27 - 0.06 * t * t, 0.003 + 0.002 * math.sin(math.pi * t)) for t in (0, 0.33, 0.66, 1.0)]
        v, f = tube(pts, [0.0075, 0.0072, 0.0058, 0.0035], segs=5, cap_rings=2)
        ch.add('moustache_' + ('L' if sg > 0 else 'R'), v, f, matname, ['rigid', 'head'])


def extra_tablet(ch):
    S, Eb, W, d = arm_pts(1)
    q = arm_q(1)
    y = V((0, -1, 0))
    c = W + d * 0.10 - q * 0.030
    bas = basis_cols(y, d, -q)
    outline = [(0.085 * pw(math.cos(2 * math.pi * k / 16), 0.45), 0.115 * pw(math.sin(2 * math.pi * k / 16), 0.45)) for k in range(16)]
    vs, fs = slab(outline, -0.0055, 0.0055, bevel=0.0045, steps=1)
    ch.add('tablet', [bas @ p + c for p in vs], fs, 'pal_navy', ['rigid', 'hand_L'])
    inner = [(0.074 * pw(math.cos(2 * math.pi * k / 16), 0.4), 0.102 * pw(math.sin(2 * math.pi * k / 16), 0.4)) for k in range(16)]
    vs, fs = slab(inner, 0.003, 0.0068)
    ch.add('tablet_screen', [bas @ p + c for p in vs], fs, 'pal_sky', ['rigid', 'hand_L'])


def extra_bun(ch):
    c = HEAD.at(math.pi, 0.72, 0.010)
    v, f = ellipsoid(c + V((0, 0.024, 0.014)), (0.038, 0.034, 0.034), 10, 7)
    ch.add('bun', v, f, 'pal_ink', ['rigid', 'head'])
    v, f = ring_torus(c + V((0, 0.004, 0.002)), (0, 0.8, 0.6), 0.026, 0.0075, 10, 4)
    ch.add('bun_band', v, f, 'pal_yellow', ['rigid', 'head'])


def surf_path(T, params, off):
    """Smooth path over a body surface: params are (phi, z) pairs, returns points and outward normals."""
    pts, nrm = [], []
    for phi, z in params:
        p, n, _, _ = T.frame(phi, z2e(z, T))
        pts.append(p + n * off); nrm.append(n)
    return pts, nrm


def catmull_pts(points, per=3):
    P = [V(p) for p in points]
    out = []
    for i in range(len(P) - 1):
        p0 = P[i - 1] if i > 0 else P[i] * 2 - P[i + 1]
        p1, p2 = P[i], P[i + 1]
        p3 = P[i + 2] if i + 2 < len(P) else P[i + 1] * 2 - P[i]
        for k in range(per):
            t = k / per
            out.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return out


def make_beard(full=1.0, cheek=0.0):
    """Neat beard shell for townsfolk (combined with a hair function by max())."""
    def bd(phi, e):
        p = wrapa(phi); a = abs(p)
        eb = interp([(0.0, -0.212), (0.17, -0.235), (0.27, -0.30), (0.34, -0.375), (0.55, -0.395), (0.85, -0.385), (1.12, -0.355), (1.34, -0.32), (1.40, -0.10), (1.43, 0.40)], a) + cheek
        face = sm(1.43 - a, 0.022) * sm(e - eb, 0.02)
        region = sm(1.62 - a, 0.04) * sm(0.16 - e, 0.04) * sm(e + 1.3, 0.1)
        hole = sm(1 - ((p / 0.15) ** 2 + ((e + 0.376 - 0.028 * (p / 0.15) ** 2) / 0.022) ** 2), 0.3)
        ink = (1 - face) * region * (1 - hole)
        chin = sm(-0.55 - e, 0.16) * sm(0.85 - a, 0.3) * (1 - 0.8 * sm(-1.0 - e, 0.15))
        T = 0.0028 + 0.0028 * sm(-0.45 - e, 0.2) + 0.010 * full * chin
        ec = -0.268 - 0.075 * (p / 0.30) ** 2
        T += 0.0055 * math.exp(-(abs(p) / 0.29) ** 2.6 - ((e - ec) / 0.042) ** 2)
        return -0.006 + (T + 0.006) * ink
    return bd


def combine(*fns):
    return lambda phi, e: max(f(phi, e) for f in fns)


KAM_W = [(0.48, 0.198), (0.60, 0.186), (0.72, 0.174), (0.84, 0.166), (0.95, 0.150), (1.08, 0.150), (1.20, 0.162), (1.29, 0.172), (1.36, 0.170), (1.43, 0.130)]
KAM_D = [(0.48, 0.148), (0.60, 0.138), (0.72, 0.128), (0.84, 0.120), (0.95, 0.108), (1.08, 0.110), (1.20, 0.118), (1.29, 0.113), (1.36, 0.100), (1.43, 0.080)]


def add_tunic(ch, color, hem, slit_top=0.82, W=KAM_W, D=KAM_D, name='kameez', nu=20, nv=15):
    T = Lathe(hem, 1.43, W, D, nxy=2.4, k=5.0, open_bottom=True)
    v, f, _, _ = surf(T, None, nu, erange(nv), bottom=False)
    keep = []
    for fc in f:
        c = sum((v[i] for i in fc), V((0, 0, 0))) / len(fc)
        ph = math.atan2(c.x, -c.y)
        if c.z < slit_top and abs(abs(ph) - math.pi / 2) < 0.17:
            continue
        keep.append(fc)
    ch.add(name, v, keep, color, ['kameez'], closed=False, outward=V((0, 0, 1.0)), solidify=0.007)
    return T


def add_vest(ch, color, T, buttons='pal_cream'):
    rows, cols = 12, 22
    zh, zt = 0.86, 1.425
    verts, faces = [], []
    for i in range(rows):
        z = zh + (zt - zh) * i / (rows - 1)
        w = 0.07 + 0.26 * sstep(1.12, 1.42, z)
        for j in range(cols):
            phi = w + (2 * math.pi - 2 * w) * j / (cols - 1)
            p, n, _, _ = T.frame(phi, z2e(z, T))
            verts.append(p + n * 0.012)
    for i in range(rows - 1):
        for j in range(cols - 1):
            a0 = i * cols + j
            c = (verts[a0] + verts[a0 + cols + 1]) / 2
            ph = math.atan2(c.x, -c.y)
            if 1.17 < c.z < 1.38 and abs(abs(ph) - math.pi / 2) < 0.62:
                continue
            faces.append((a0, a0 + 1, a0 + cols + 1, a0 + cols))
    ch.add('sadri', verts, faces, color, TORSO_RULE, closed=False, outward=V((0, 0, 1.1)), solidify=0.007)
    for k, z in enumerate((1.10, 0.99, 0.90)):
        p, n, _, _ = T.frame(0.075, z2e(z, T))
        v, f = ellipsoid(p + n * 0.020, (0.0065, 0.0065, 0.0035), 6, 4, basis=basis_cols(*T.frame(0.075, z2e(z, T))[2:], n))
        ch.add('button_%d' % k, v, f, buttons, TORSO_RULE)


def add_drape(ch, color, T, params, r, thin, nm, off=0.024, segs=7):
    pts, nrm = surf_path(T, params, off)
    pts = catmull_pts(pts, 2)
    nrm = catmull_pts(nrm, 2)
    v, f = tube(pts, r, segs=segs, cap_rings=2, normals=[n.normalized() for n in nrm], flat=(thin, 1.0))
    ch.add(nm, v, f, color, ['rigid', 'chest'])


DRAPE_PATH = [(0.42, 0.92), (0.52, 1.10), (0.72, 1.30), (1.15, 1.415), (2.0, 1.43), (math.pi - 0.01, 1.43),
              (-2.0, 1.43), (-1.15, 1.415), (-0.72, 1.30), (-0.52, 1.10), (-0.42, 0.92)]


def add_cap_jinnah(ch, color, head):
    top = head.at(0.0, math.pi / 2, 0.0)

    def crease(p):
        return V((p.x, p.y, p.z - 0.011 * math.exp(-(p.x / 0.025) ** 2) * max(0.0, p.z / 0.045)))
    v, f = ellipsoid(top + V((0, 0.006, -0.024)), (0.104, 0.122, 0.046), 16, 9, nxy=2.4, nz=4.0, deform=crease)
    ch.add('cap', v, f, color, ['rigid', 'head'])


def add_stick(ch):
    S, Eb, W, d = arm_pts(1)
    g = W + d * 0.075
    pts = [g - d * 0.05, g + d * 0.25, g + d * 0.50, g + d * 0.73]
    v, f = tube(pts, [0.012, 0.011, 0.011, 0.010], segs=7, cap_rings=2)
    ch.add('stick_shaft', v, f, 'pal_wood_dark', ['rigid', 'hand_L'], loose='stick')


def add_braid(ch, head, hair_fn):
    top = head.at(math.pi, 0.10, hair_fn(math.pi, 0.10))
    pts = [top + V((0, -0.01, 0.0)), V((0, 0.128, 1.47)), V((0, 0.140, 1.38)), V((0, 0.138, 1.27)), V((0, 0.132, 1.16)), V((0, 0.128, 1.08))]
    pts = catmull_pts(pts, 3)
    rad = [0.024 - 0.010 * k / (len(pts) - 1) for k in range(len(pts))]

    def rfn(ri, k, r):
        return r * (1 + 0.16 * abs(math.sin(ri * 1.25)))
    v, f = tube(pts, rad, segs=8, cap_rings=2, rfn=rfn)
    ch.add('braid', v, f, 'pal_ink', ['z', ['chest', 'head'], [1.44], 0.04])
    v, f = ring_torus(pts[-1] + V((0, 0, 0.012)), (0, 0, 1), 0.016, 0.006, 10, 4)
    ch.add('braid_tie', v, f, 'pal_kameez_d', ['rigid', 'chest'])


def add_hand_item(ch, name, color, size, screen=None, along=0.09):
    S, Eb, W, d = arm_pts(1)
    q = arm_q(1)
    y = V((0, -1, 0))
    c = W + d * along - q * 0.030
    bas = basis_cols(y, d, -q)
    ow, oh, th = size
    outline = [(ow * pw(math.cos(2 * math.pi * k / 16), 0.4), oh * pw(math.sin(2 * math.pi * k / 16), 0.4)) for k in range(16)]
    vs, fs = slab(outline, -th, th, bevel=th * 0.8, steps=1)
    ch.add(name, [bas @ p + c for p in vs], fs, color, ['rigid', 'hand_L'])
    if screen:
        inner = [(ow * 0.86 * pw(math.cos(2 * math.pi * k / 16), 0.35), oh * 0.88 * pw(math.sin(2 * math.pi * k / 16), 0.35)) for k in range(16)]
        vs, fs = slab(inner, th * 0.6, th * 1.25)
        ch.add(name + '_screen', [bas @ p + c for p in vs], fs, screen, ['rigid', 'hand_L'])


def add_bag_strap(ch, T, color, bag, params, bag_param, bag_size):
    pts, nrm = surf_path(T, params, 0.018)
    pts = catmull_pts(pts, 3); nrm = catmull_pts(nrm, 3)
    v, f = tube(pts, 0.0095, segs=5, cap_rings=2, normals=[n.normalized() for n in nrm], flat=(0.45, 1.0))
    ch.add('bag_strap', v, f, color, TORSO_RULE)
    ph, z = bag_param
    p, n, tp, te = T.frame(ph, z2e(z, T))
    v, f = ellipsoid(p + n * (bag_size[2] + 0.012), bag_size, 12, 8, basis=basis_cols(tp, te, n), nxy=3.2, nz=3.2)
    ch.add('bag', v, f, bag, TORSO_RULE)


def add_belt(ch, T, z, color):
    pts = [T.at(2 * math.pi * k / 18, z2e(z, T), 0.004) for k in range(19)]
    v, f = tube(pts, 0.010, segs=4, caps=(False, False), normals=[V((0, 0, 1))] * 19, flat=(1.0, 0.75))
    ch.add('belt', v, f, color, TORSO_RULE, closed=False, outward=V((0, 0, z)))


def extra_hoodie(ch, T):
    v, f = ellipsoid((0, 0.098, 1.425), (0.105, 0.055, 0.060), 12, 8, nxy=2.4)
    ch.add('hood', v, f, 'pal_kameez_b', ['rigid', 'chest'])
    p, n, tp, te = T.frame(0.0, z2e(1.00, T))
    v, f = ellipsoid(p + n * 0.006, (0.10, 0.055, 0.009), 12, 6, basis=basis_cols(tp, te, n), nxy=3.2, nz=3.2)
    ch.add('pocket', v, f, 'pal_kameez_b', TORSO_RULE)
    for sg in (1, -1):
        pts = [T.at(sg * 0.12, z2e(z, T), 0.008) for z in (1.42, 1.35, 1.28)]
        v, f = tube(pts, 0.0035, segs=5, cap_rings=2)
        ch.add('hood_cord_' + ('L' if sg > 0 else 'R'), v, f, 'pal_white', ['rigid', 'chest'])


def extra_backpack(ch, T):
    v, f = ellipsoid((0, 0.185, 1.13), (0.125, 0.065, 0.16), 14, 9, nxy=3.0, nz=3.0)
    ch.add('backpack', v, f, 'pal_coral', ['rigid', 'chest'])
    v, f = ellipsoid((0, 0.245, 1.08), (0.085, 0.022, 0.07), 10, 6, nxy=3.0, nz=3.0)
    ch.add('backpack_pocket', v, f, 'pal_coral_deep', ['rigid', 'chest'])
    for sg in (1, -1):
        pts, nrm = surf_path(T, [(sg * 2.6, 1.30), (sg * 2.0, 1.41), (sg * 1.2, 1.425), (sg * 0.55, 1.30), (sg * 0.50, 1.12)], 0.012)
        v, f = tube(catmull_pts(pts, 3), 0.011, segs=5, cap_rings=2)
        ch.add('backpack_strap_' + ('L' if sg > 0 else 'R'), v, f, 'pal_coral_deep', ['rigid', 'chest'])


NPCS = {
    'npc_a': dict(skin='pal_skin', hair='pal_ink', hair_fn=combine(hair_crop, make_beard(0.8)), brow='pal_ink',
                  dress='kameez', top='pal_kameez_c', pants='pal_kameez_c', vest='pal_wood_dark', chappal='pal_wood_dark',
                  note='Young man in a sky-blue shalwar kameez with a dark sadri waistcoat and chappals, short hair, neat beard. Owns the `npc_*` clips.'),
    'npc_b': dict(skin='pal_wood', hair='pal_stone', hair_fn=combine(hair_crop, make_beard(1.25, cheek=0.04)), brow='pal_stone',
                  dress='kameez', top='pal_cream', pants='pal_cream', chappal='pal_wood_dark', shawl='pal_wood', cap='pal_ink',
                  glasses=True, stick=True, jaw=0.18,
                  note='Elder: cream shalwar kameez, brown shawl, Jinnah cap, grey beard, glasses; walking stick in the left hand (separate skinned child mesh `stick`).'),
    'npc_c': dict(skin='pal_peach', hair='pal_ink', hair_fn=hair_bun, brow='pal_ink', dress='kameez', top='pal_coral',
                  pants='pal_cream', chappal='pal_coral_deep', dupatta='pal_kameez_d', braid=True, jaw=0.30, nose=0.8, brow_t=0.72,
                  note='Young woman in a coral shalwar kameez with a mustard dupatta over the shoulders and a long braid.'),
    'npc_d': dict(skin='pal_skin', hair='pal_wood_dark', hair_fn=hair_bob, brow='pal_wood_dark', ears=False, dress='kurti',
                  top='pal_kameez_a', pants='pal_navy', shoe='pal_white', sole='pal_cream', bag='pal_kameez_d', jaw=0.30, nose=0.8, brow_t=0.72,
                  note='Young woman in modern clothes: dusty-rose kurti, jeans, sneakers, shoulder bag.'),
    'npc_e': dict(skin='pal_wood', hair='pal_ink', hair_fn=hair_crop, brow='pal_ink', dress='hoodie', top='pal_kameez_b',
                  pants='pal_navy', shoe='pal_white', sole='pal_cream', phone=True,
                  note='Young man in modern clothes: sage hoodie, jeans, sneakers, phone in the left hand.'),
    'npc_f': dict(skin='pal_skin', hair='pal_ink', hair_fn=hair_crop, brow='pal_ink', dress='shirt', top='pal_sky',
                  pants='pal_navy', shoe='pal_ink', sole='pal_cream', backpack=True, kid=True, jaw=0.34, nose=0.75, brow_t=0.8,
                  note='School kid (about 1.30 m): light-blue uniform shirt, navy trousers, school bag. Same skeleton; the `npc_f` root carries a 0.79 scale.'),
}
NPC_NAMES = list(NPCS.keys())
KID_SCALE = 0.79


def build_npc(name, P):
    ch = Char(name)
    head = HeadShape(HC, HR, jaw=P.get('jaw', 0.24))
    hair = P['hair_fn']
    add_skin_head(ch, P['skin'], hair, nu=20, nv=15, ell=head)
    add_shell(ch, 'hair', P['hair'], hair, nu=100, nv=68, dec=P.get('hair_dec', 0.037), ell=head)
    skin_off = lambda p, e: 0.0
    add_eyes(ch, head, skin_off, lod=0)
    add_brows(ch, head, lambda p, e: max(0.0, hair(p, e)), P.get('brow', P['hair']), e0=0.17, thick=P.get('brow_t', 0.95), segs=5)
    add_nose(ch, head, P['skin'], size=P.get('nose', 0.95), lod=0)
    if P.get('ears', True):
        add_ears(ch, head, lambda p, e: max(0.0, hair(p, e)), P['skin'], lod=0)
    add_mouth_line(ch, head, e0=-0.372, width=0.12, smile=0.014)
    add_neck(ch, P['skin'])
    dress = P['dress']
    if dress in ('kameez', 'kurti'):
        T = add_tunic(ch, P['top'], 0.48 if dress == 'kameez' else 0.66, slit_top=0.82 if dress == 'kameez' else 0.86)
        v, f = ring_torus((0, 0.010, 1.418), (0, 0.25, 1), 0.058, 0.0085, 12, 4, rx=0.064)
        ch.add('neckline', v, f, P['top'], ['rigid', 'chest'])
    else:
        T = torso([(z, w + 0.006) for z, w in TORSO_W], [(z, w + 0.004) for z, w in TORSO_D])
        v, f, _, _ = surf(T, None, 18, erange(14))
        ch.add('torso', v, f, P['top'], TORSO_RULE)
        if dress == 'shirt':
            add_belt(ch, T, 0.865, 'pal_ink')
            for sg in (1, -1):
                pts = [T.at(sg * a, z2e(z, T), 0.006) for a, z in ((0.05, 1.415), (0.30, 1.37), (0.48, 1.415))]
                v, f = tube(pts, 0.012, segs=5, cap_rings=2, normals=[V((0, -0.4, 1))] * 3, flat=(0.35, 1.0))
                ch.add('collar_' + ('L' if sg > 0 else 'R'), v, f, 'pal_white', ['rigid', 'chest'])
        if dress == 'hoodie':
            extra_hoodie(ch, T)
    add_arms(ch, P['top'], P['skin'], cuff=P.get('cuff'), lod=0)
    add_legs(ch, P['pants'], P.get('shoe', 'pal_white'), P.get('sole', 'pal_cream'), lod=0, loose=(dress == 'kameez'),
             chappal=P.get('chappal'), skin=P['skin'])
    if P.get('vest'):
        add_vest(ch, P['vest'], T)
    if P.get('dupatta'):
        add_drape(ch, P['dupatta'], T, DRAPE_PATH, 0.040, 0.18, 'dupatta')
    if P.get('shawl'):
        add_drape(ch, P['shawl'], T, [(0.45, 0.98), (0.55, 1.12)] + DRAPE_PATH[2:-2] + [(-0.55, 1.12), (-0.45, 0.98)], 0.060, 0.16, 'shawl', off=0.03)
    if P.get('cap'):
        add_cap_jinnah(ch, P['cap'], head)
    if P.get('glasses'):
        extra_glasses(ch)
    if P.get('stick'):
        add_stick(ch)
    if P.get('braid'):
        add_braid(ch, head, hair)
    if P.get('bag'):
        add_bag_strap(ch, T, 'pal_wood_dark', P['bag'],
                      [(-2.25, 1.02), (-1.7, 1.06), (-1.0, 1.14), (-0.35, 1.26), (0.35, 1.37), (0.9, 1.425), (1.6, 1.43), (2.2, 1.36), (2.8, 1.22), (-2.9, 1.10), (-2.4, 1.04)],
                      (-2.3, 0.93), (0.085, 0.10, 0.025))
    if P.get('phone'):
        add_hand_item(ch, 'phone', 'pal_ink', (0.036, 0.074, 0.0045), screen='pal_sky')
    if P.get('backpack'):
        extra_backpack(ch, T)
    if P.get('kid'):
        piv = V((0, 0.006, 1.40))
        for ob in ch.parts:
            r = json.loads(ob['rule'])
            if r[0] == 'rigid' and r[1] in ('head', 'eyes'):
                for vv in ob.data.vertices:
                    vv.co = piv + (vv.co - piv) * 1.15
        ch.root_scale = KID_SCALE
    return ch


def build_parrot():
    ch = Char('parrot')
    tilt = R((1, 0, 0), -12)
    body = Ell((0, 0.012, 0.135), (0.071, 0.077, 0.098), pear=0.12, rot=tilt)
    v, f, _, _ = surf(body, None, 20, erange(12))
    ch.add('body', v, f, 'pal_grass', ['rigid', 'body'])

    v, f = ellipsoid((0, 0, 0), (0.056, 0.046, 0.074), 16, 10)
    v = [tilt @ p + V((0, -0.026, 0.118)) for p in v]
    ch.add('belly', v, f, 'pal_grass_light', ['rigid', 'body'])
    head = Ell((0, -0.006, 0.266), (0.066, 0.064, 0.063))
    v, f, _, _ = surf(head, None, 16, erange(11))
    ch.add('head', v, f, 'pal_grass', ['rigid', 'head'])
    v, f = tube([(0, -0.050, 0.274), (0, -0.074, 0.271), (0, -0.091, 0.259), (0, -0.098, 0.242), (0, -0.094, 0.228)],
                [0.025, 0.020, 0.0135, 0.008, 0.0045], segs=8, cap_rings=2, normals=(1, 0, 0), flat=(0.85, 1.0))
    ch.add('beak', v, f, 'pal_coral', ['rigid', 'head'])
    v, f = ellipsoid((0, -0.068, 0.247), (0.016, 0.020, 0.011), 8, 5)
    ch.add('beak_low', v, f, 'pal_coral_deep', ['rigid', 'beak'])
    for sg in (1, -1):
        s = 'L' if sg > 0 else 'R'
        phi, e = sg * 0.92, 0.20
        v, f = feat(head, phi, e, -0.002, (0.019, 0.020, 0.007), 10, 6)
        ch.add('eye_ring_' + s, v, f, 'pal_white', ['rigid', 'eyes'])
        v, f = feat(head, phi - sg * 0.03, e - 0.01, 0.0035, (0.0125, 0.0145, 0.007), 10, 6)
        ch.add('eye_' + s, v, f, 'pal_ink', ['rigid', 'eyes'])
        v, f = feat(head, phi - sg * 0.03 + 0.03, e + 0.02, 0.0095, (0.004, 0.004, 0.003), 6, 3)
        ch.add('eye_glint_' + s, v, f, 'pal_white', ['rigid', 'eyes'])
        v, f = tube([(sg * 0.060, -0.004, 0.192), (sg * 0.073, 0.030, 0.158), (sg * 0.072, 0.060, 0.108), (sg * 0.058, 0.088, 0.060)],
                    [0.034, 0.037, 0.026, 0.008], segs=10, cap_rings=3, normals=(sg, 0, 0), flat=(0.46, 1.0))
        ch.add('wing_' + s, v, f, 'pal_grass_deep', ['rigid', 'wing_' + s])
        v, f = tube([(sg * 0.026, 0.004, 0.050), (sg * 0.027, 0.0, 0.012)], 0.0085, segs=6, cap_rings=2)
        ch.add('leg_' + s, v, f, 'pal_pink', ['rigid', 'body'])
        v, f = ellipsoid((sg * 0.027, -0.014, 0.008), (0.012, 0.022, 0.0075), 6, 4)
        ch.add('toes_' + s, v, f, 'pal_pink', ['rigid', 'body'])
    v, f = tube([(0, 0.058, 0.082), (0, 0.105, 0.042), (0, 0.162, 0.014)], [0.030, 0.023, 0.011], segs=9, cap_rings=3,
                normals=(0, 0, 1), flat=(0.36, 1.0))
    ch.add('tail', v, f, 'pal_grass_deep', ['rigid', 'tail'])
    for k in range(3):
        b = V((0, -0.022 + 0.017 * k, 0.322 - 0.004 * k))
        pts = [b, b + V((0, 0.004 + 0.004 * k, 0.020 - 0.003 * k)), b + V((0, 0.016 + 0.006 * k, 0.034 - 0.006 * k))]
        v, f = tube(pts, [0.0105, 0.007, 0.003], segs=5, cap_rings=2)
        ch.add('crest_%d' % k, v, f, 'pal_yellow', ['rigid', 'head'])
    return ch


# ============================================================================ weights
def seg_proj(p, a, b):
    ab = b - a
    t = clamp((p - a).dot(ab) / ab.length_squared, 0.0, 1.0)
    return t, (a + ab * t - p).length


def zband(z, bones, bounds, w):
    i = 0
    while i < len(bounds) and z >= bounds[i]:
        i += 1
    out = {bones[i]: 1.0}
    for j, zb in enumerate(bounds):
        if abs(z - zb) < w:
            t = sstep(zb - w, zb + w, z)
            out = {bones[j]: 1 - t, bones[j + 1]: t}
    return out


def vertex_weights(p, rule):
    kind = rule[0]
    if kind == 'rigid':
        return {rule[1]: 1.0}
    if kind == 'z':
        return zband(p.z, rule[1], rule[2], rule[3])
    if kind == 'kameez' and p.z < 0.88:
        t = sstep(0.88, 0.56, p.z)
        lw = t * (0.55 + 0.25 * sm(-p.y, 0.03))
        lr = sm(p.x, 0.035)
        return {b: w for b, w in (('hips', 1 - lw), ('upper_leg_L', lw * lr), ('upper_leg_R', lw * (1 - lr))) if w > 0.002}
    if kind in ('torso', 'kameez'):
        out = zband(p.z, ['hips', 'spine', 'chest'], [1.00, 1.17], 0.06)
        s = 0.55 * sm(abs(p.x) - 0.125, 0.03) * sm(p.z - 1.31, 0.04)
        if s > 0.002:
            out = {b: w * (1 - s) for b, w in out.items()}
            out['shoulder_' + ('L' if p.x > 0 else 'R')] = s
        return out
    if kind == 'chain':
        J = [V(x) for x in rule[1]]; bones = rule[2]; bl = rule[3]
        best = None; cum = [0.0]
        for k in range(len(J) - 1):
            L = (J[k + 1] - J[k]).length
            t, d = seg_proj(p, J[k], J[k + 1])
            if best is None or d < best[0] - 1e-9:
                best = (d, cum[-1] + t * L)
            cum.append(cum[-1] + L)
        s = best[1]
        k = 0
        while k < len(bones) - 1 and s > cum[k + 1]:
            k += 1
        out = {bones[k]: 1.0}
        for j in range(1, len(bones)):
            w = bl[j - 1]
            if abs(s - cum[j]) < w:
                t = sstep(cum[j] - w, cum[j] + w, s)
                out = {bones[j - 1]: 1 - t, bones[j]: t}
        return out
    raise ValueError(kind)


def assign_weights(ch):
    for ob in ch.parts:
        rule = json.loads(ob['rule'])
        groups = {}
        for v in ob.data.vertices:
            for b, w in vertex_weights(v.co, rule).items():
                if w < 0.002:
                    continue
                if b not in groups:
                    groups[b] = ob.vertex_groups.new(name=b)
                groups[b].add([v.index], w, 'REPLACE')


# ============================================================================ AO bake
def bake_ao(chars, samples=64):
    sc = bpy.context.scene
    if sc.world is None:
        sc.world = bpy.data.worlds.new('BakeWorld')
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.world.light_settings.distance = 0.20
    sc.render.bake.target = 'VERTEX_COLORS'
    for i, ch in enumerate(chars):
        ch.root.location = V((3.0 * i, 0, 0))
    obs = []
    for ch in chars:
        for ob in ch.parts:
            me = ob.data
            ca = me.color_attributes.new('Col', 'BYTE_COLOR', 'POINT')
            me.color_attributes.active_color = ca
            try:
                me.color_attributes.render_color_index = list(me.color_attributes).index(ca)
            except Exception:
                pass
            obs.append(ob)
    bpy.context.view_layer.update()
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    t = time.time()
    try:
        bpy.ops.object.bake(type='AO')
        ok = True
    except Exception as ex:
        log('AO bake failed, filling white:', ex)
        ok = False
    log('AO bake %.1fs ok=%s' % (time.time() - t, ok))
    for o in obs:
        ca = o.data.color_attributes['Col']
        for d in ca.data:
            a = (0.25 + 0.75 * clamp(d.color[0], 0.0, 1.0) ** 0.8) if ok else 1.0
            d.color = (a, a, a, 1.0)
    for ch in chars:
        ch.root.location = (0, 0, 0)
    bpy.context.view_layer.update()


# ============================================================================ join + rig
def join_parts(ch):
    ch.loose = [o for o in ch.parts if o.get('loose')]
    obs = [o for o in ch.parts if not o.get('loose')]
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    with bpy.context.temp_override(active_object=obs[0], selected_editable_objects=obs, selected_objects=obs):
        bpy.ops.object.join()
    m = obs[0]
    m.name = ch.name + '_mesh'; m.data.name = ch.name + '_mesh'
    ch.mesh = m
    return m


def build_armature(ch, defs):
    data = bpy.data.armatures.new(ch.name + '_rig')
    ob = bpy.data.objects.new(ch.name + '_rig', data)
    ch.coll.objects.link(ob)
    ob.parent = ch.root
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, h, t, par in defs:
        eb = data.edit_bones.new(name)
        eb.head, eb.tail = V(h), V(t)
        eb.roll = 0.0
    for name, h, t, par in defs:
        if par:
            data.edit_bones[name].parent = data.edit_bones[par]
            data.edit_bones[name].use_connect = False
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in ob.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    for m in [ch.mesh] + getattr(ch, 'loose', []):
        m.parent = ob
        mod = m.modifiers.new('Armature', 'ARMATURE'); mod.object = ob
        if m.get('loose'):
            m.name = m['loose']; m.data.name = m['loose']
    ch.rig = ob
    if getattr(ch, 'root_scale', None):
        ch.root.scale = (ch.root_scale,) * 3
    return ob


class Rig:
    def __init__(self, ob, offbone):
        self.ob = ob
        bones = ob.data.bones
        self.names = [b.name for b in bones]
        self.P = {b.name: (b.parent.name if b.parent else None) for b in bones}
        self.H = {b.name: b.head_local.copy() for b in bones}
        self.T = {b.name: b.tail_local.copy() for b in bones}
        self.Rr = {b.name: b.matrix_local.to_3x3() for b in bones}
        self.len = {n: (self.T[n] - self.H[n]).length for n in self.names}
        self.dir = {n: (self.T[n] - self.H[n]).normalized() for n in self.names}
        self.offbone = offbone
        self.adir, self.hinge, self.curl = {}, {}, {}
        for s, sg in (('L', 1), ('R', -1)):
            if 'upper_arm_' + s in self.dir:
                a = self.dir['upper_arm_' + s]
                self.adir[s] = a
                self.hinge[s] = a.cross(V((0, -1, 0))).normalized()
                self.curl[s] = a.cross(-arm_q(sg)).normalized()
        self.eye_axis = None
        if 'eyes' in self.Rr:
            loc = self.Rr['eyes'].inverted() @ V((0, 0, 1))
            self.eye_axis = max(range(3), key=lambda i: abs(loc[i]))


def ik2(S, T, L1, L2, pole):
    dv = T - S
    dist = clamp(dv.length, abs(L1 - L2) + 1e-4, (L1 + L2) * 0.999)
    dirv = dv.normalized()
    ca = clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1)
    sa = math.sqrt(1 - ca * ca)
    pn = (pole - dirv * pole.dot(dirv))
    pn = pn.normalized() if pn.length > 1e-6 else dirv.orthogonal().normalized()
    return S + dirv * (L1 * ca) + pn * (L1 * sa), S + dirv * dist


class Pose:
    def __init__(self, rig):
        self.rig = rig; self.D = {}; self.off = V((0, 0, 0)); self.blink = 0.0; self.yaw = 0.0

    def Dw(self, n):
        while n is not None:
            if n in self.D:
                return self.D[n]
            n = self.rig.P[n]
        return Matrix.Identity(3)

    def pos(self, n):
        p = self.rig.P[n]
        if p is None:
            return self.rig.H[n].copy()
        b = self.pos(p) + self.Dw(p) @ (self.rig.H[n] - self.rig.H[p])
        if n == self.rig.offbone:
            b = b + self.off
        return b

    def rel(self, n, M):
        self.D[n] = self.Dw(self.rig.P[n]) @ M

    def hips(self, off=(0, 0, 0), pitch=0, yaw=0, roll=0):
        self.off = V(off); self.yaw = yaw
        self.rel(self.rig.offbone, E(pitch, yaw, roll))

    def bone(self, n, pitch=0, yaw=0, roll=0):
        self.rel(n, E(pitch, yaw, roll))

    def aim(self, n, d):
        self.rel(n, self.rig.dir[n].rotation_difference(V(d).normalized()).to_matrix())

    def _hand(self, s, hand, curl, hand_side=0.0):
        self.rel('hand_' + s, R(self.rig.curl[s], hand) @ R(self.rig.hinge[s], hand_side))
        self.rel('fingers_' + s, R(self.rig.curl[s], curl))

    def arm_fk(self, s, out=14, fwd=0, bend=10, twist=0, hand=0, shrug=0, sfwd=0, curl=15):
        sg = 1 if s == 'L' else -1
        self.rel('shoulder_' + s, R((0, 1, 0), -sg * shrug) @ R((0, 0, 1), -sg * sfwd))
        r = self.rig.adir[s]
        d1 = V((sg * math.sin(math.radians(out)), 0, -math.cos(math.radians(out))))
        d = R((1, 0, 0), -fwd) @ d1
        M = r.rotation_difference(d).to_matrix()
        if twist:
            M = R(d, sg * twist) @ M
        self.rel('upper_arm_' + s, M)
        self.rel('lower_arm_' + s, R(self.rig.hinge[s], bend))
        self._hand(s, hand, curl)

    def arm_ik(self, s, T, pole, hand=0, shrug=0, hand_roll=0, curl=15, hand_side=0.0):
        sg = 1 if s == 'L' else -1
        self.rel('shoulder_' + s, R((0, 1, 0), -sg * shrug))
        up, lo = 'upper_arm_' + s, 'lower_arm_' + s
        S = self.pos(up)
        Eb, W = ik2(S, V(T), self.rig.len[up], self.rig.len[lo], V(pole))
        u = (Eb - S).normalized(); f = (W - Eb).normalized()
        Dp = self.Dw('shoulder_' + s)
        r = self.rig.adir[s]
        Du = (Dp @ r).rotation_difference(u).to_matrix() @ Dp
        self.D[up] = Du
        Dl = (Du @ r).rotation_difference(f).to_matrix() @ Du
        if hand_roll:
            Dl = R(f, sg * hand_roll) @ Dl
        self.D[lo] = Dl
        self._hand(s, hand, curl, hand_side)

    def leg_ik(self, s, A, foot=0, pole=(0, -1, 0)):
        ul, ll, ft = 'upper_leg_' + s, 'lower_leg_' + s, 'foot_' + s
        Hp = self.pos(ul)
        Dh = self.Dw(self.rig.offbone)
        K, Aa = ik2(Hp, V(A), self.rig.len[ul], self.rig.len[ll], Dh @ V(pole))
        Dt = (Dh @ self.rig.dir[ul]).rotation_difference((K - Hp).normalized()).to_matrix() @ Dh
        self.D[ul] = Dt
        Ds = (Dt @ self.rig.dir[ll]).rotation_difference((Aa - K).normalized()).to_matrix() @ Dt
        self.D[ll] = Ds
        want = R((0, 0, 1), self.yaw) @ R((1, 0, 0), foot) @ self.rig.dir[ft]
        self.D[ft] = (Ds @ self.rig.dir[ft]).rotation_difference(want).to_matrix() @ Ds

    def leg_fk(self, s, fwd=0, knee=0, foot=0, out=0, twist=0):
        sg = 1 if s == 'L' else -1
        self.rel('upper_leg_' + s, R((0, 0, 1), sg * twist) @ R((1, 0, 0), -fwd) @ R((0, 1, 0), -sg * out))
        self.rel('lower_leg_' + s, R((1, 0, 0), knee))
        self.rel('foot_' + s, R((1, 0, 0), foot))

    def locals(self):
        out = {}
        for n in self.rig.names:
            Dp = self.Dw(self.rig.P[n]); Dn = self.Dw(n)
            Rr = self.rig.Rr[n]
            out[n] = (Rr.inverted() @ Dp.inverted() @ Dn @ Rr).to_quaternion()
        return out


ACTIONS = {}


def write_action(rig, name, nframes, fn, loop=True):
    act = bpy.data.actions.new(name)
    act.use_fake_user = True
    slot = act.slots.new(id_type='OBJECT', name=rig.ob.name)
    strip = act.layers.new('Layer').strips.new(type='KEYFRAME')
    cb = strip.channelbag(slot, ensure=True)
    frames = list(range(nframes + 1))
    rot = {n: [] for n in rig.names}; locs = []; scl = []
    prev = {}
    for f in frames:
        P = fn(f)
        L = P.locals()
        for n in rig.names:
            q = L[n]
            if n in prev and prev[n].dot(q) < 0:
                q = -q
            prev[n] = q
            rot[n].append(q)
        locs.append(rig.Rr[rig.offbone].inverted() @ P.off)
        s = [1.0, 1.0, 1.0]
        if rig.eye_axis is not None:
            s[rig.eye_axis] = 1.0 - 0.9 * clamp(P.blink, 0, 1)
        scl.append(s)

    def curve(path, idx, group, vals):
        fc = cb.fcurves.new(path, index=idx, group_name=group)
        fc.keyframe_points.add(len(vals))
        co = []
        for f, v in zip(frames, vals):
            co += [float(f), float(v)]
        fc.keyframe_points.foreach_set('co', co)
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
        fc.update()
    for n in rig.names:
        for i in range(4):
            curve('pose.bones["%s"].rotation_quaternion' % n, i, n, [q[i] for q in rot[n]])
    for i in range(3):
        curve('pose.bones["%s"].location' % rig.offbone, i, rig.offbone, [l[i] for l in locs])
    if rig.eye_axis is not None:
        for i in range(3):
            curve('pose.bones["eyes"].scale', i, 'eyes', [s[i] for s in scl])
    ad = rig.ob.animation_data or rig.ob.animation_data_create()
    tr = ad.nla_tracks.new(); tr.name = name
    st = tr.strips.new(name, 0, act)
    try:
        st.action_slot = slot
    except Exception:
        pass
    ACTIONS[name] = dict(rig=rig.ob.name, frames=nframes, loop=loop, act=act, slot=slot)
    return act


class K:
    """Named channels of (frame, value) keys, evaluated with clamped Hermite curves."""

    def __init__(self, loop=None, **ch):
        self.loop = loop; self.ch = {k: sorted(v) for k, v in ch.items()}

    def __call__(self, f):
        return type('KV', (), {k: interp(v, f, self.loop) for k, v in self.ch.items()})


def bump(f, c, w):
    return math.exp(-((f - c) / w) ** 2)


def blink_at(f, centers, w=1.5, loop=None):
    vals = [bump(f, c, w) for c in centers]
    if loop:
        vals += [bump(f, c + loop, w) for c in centers] + [bump(f, c - loop, w) for c in centers]
    return max(vals + [0.0])


# ============================================================================ humanoid actions (adult)
ARM_N = 7.0     # neutral arm angle from vertical (clears the jacket)


def stand(P, dz=-0.012, sway=0.0, roll=0.0, yaw=0.0, feet=0.0, pitch=0.0, dy=0.0):
    P.hips((sway, dy, dz), pitch=pitch, yaw=yaw, roll=roll)
    for s, sg in (('L', 1), ('R', -1)):
        P.leg_ik(s, V((sg * (HIP_X + feet), 0.0, ANK_Z)), foot=0)


def trunk(P, sp=(0, 0, 0), ch=(0, 0, 0), nk=(0, 0, 0), hd=(0, 0, 0)):
    P.bone('spine', *sp); P.bone('chest', *ch); P.bone('neck', *nk); P.bone('head', *hd)


def foot_track(ph, stance, L, lift, heel=0.075, run=False):
    """In-place foot path. Returns y (forward is -y), ankle lift, foot pitch (+ toe down)."""
    ph %= 1.0
    if ph < stance:
        t = ph / stance
        y = -L / 2 + L * t
        z = heel * sstep(0.55, 1.0, t) + 0.012 * (1 - sstep(0.0, 0.18, t))
        pitch = -16 * (1 - sstep(0.0, 0.2, t)) + 38 * sstep(0.55, 1.0, t)
    else:
        t = (ph - stance) / (1 - stance)
        if run:
            y = L / 2 + 0.05 * math.sin(math.pi * min(1, t * 2)) * (t < 0.5) - L * sstep(0.15, 1.0, t)
            z = heel * (1 - t) + lift * math.sin(math.pi * min(1.0, t * 1.1)) ** 0.7
        else:
            y = L / 2 - L * sstep(0.0, 1.0, t)
            z = heel * (1 - sstep(0, 0.35, t)) + lift * math.sin(math.pi * t) ** 1.3 + 0.012 * sstep(0.7, 1.0, t)
        pitch = lerp(38, -16, sstep(0.0, 0.85, t))
    return y, z, pitch


def locomotion(rig, nf, stance, L, lift, bob, base, lean, arm_sw, arm_bend, arm_out, yawamp, run=False, headp=0.0, heel=0.075):
    def fn(f):
        p = f / nf
        P = Pose(rig)
        zb = base - bob * math.cos(4 * math.pi * (p - (0.0 if not run else 0.42)))
        P.hips((0.012 * math.sin(2 * math.pi * (p - 0.08)), 0, zb), pitch=lean * 0.45,
               yaw=-yawamp * math.cos(2 * math.pi * p), roll=3.0 * math.sin(2 * math.pi * (p - 0.08)))
        P.bone('spine', lean * 0.35, yawamp * 0.6 * math.cos(2 * math.pi * p), -1.5 * math.sin(2 * math.pi * (p - 0.08)))
        P.bone('chest', lean * 0.2 + 1.2 * math.cos(4 * math.pi * p), yawamp * 1.0 * math.cos(2 * math.pi * p), -0.8 * math.sin(2 * math.pi * (p - 0.08)))
        P.bone('neck', -lean * 0.35, 0, 0)
        P.bone('head', -lean * 0.45 + headp - 1.5 * math.cos(4 * math.pi * (p - 0.1)),
               -yawamp * 0.55 * math.cos(2 * math.pi * p), 1.2 * math.sin(2 * math.pi * (p - 0.08)))
        for s, sg, off in (('L', 1, 0.0), ('R', -1, 0.5)):
            y, z, pitch = foot_track(p + off, stance, L, lift, heel=heel, run=run)
            P.leg_ik(s, V((sg * (HIP_X - 0.004), y, ANK_Z + z)), foot=pitch)
        for s, sg, off in (('L', 1, 0.5), ('R', -1, 0.0)):
            sw = -math.cos(2 * math.pi * (p + off - 0.07))
            P.arm_fk(s, out=arm_out + 2 * max(0, -sw), fwd=arm_sw * sw + 3, bend=arm_bend[0] + arm_bend[1] * max(0.0, sw),
                     hand=5 + 6 * max(0.0, sw), shrug=1.0 * max(0, sw), curl=25 if not run else 55)
        return P
    return fn


def act_idle(rig, nf=120, npc=False):
    yawk = [(0, 0), (22, 0), (36, 24), (56, 24), (70, -20), (88, -20), (102, 0)]
    if npc:
        yawk = [(0, 0), (30, 0), (44, -16), (66, -16), (80, 12), (98, 12), (110, 0)]
    kk = K(loop=nf, yaw=yawk, pitch=[(0, 0), (36, -3), (56, -3), (70, 2), (88, 2), (102, 0)],
           roll=[(0, 0), (36, 3), (56, 2), (70, -2), (88, -3), (102, 0)])

    def fn(f):
        ph = 2 * math.pi * f / nf
        br = math.sin(2 * ph)
        k = kk(f)
        P = Pose(rig)
        stand(P, dz=-0.014 + 0.002 * br, sway=0.016 + 0.004 * math.sin(ph), roll=2.5 + 0.6 * math.sin(ph), yaw=-3)
        P.leg_ik('R', V((-HIP_X - 0.03, -0.035, ANK_Z)), foot=0)
        P.bone('spine', 1.5, k.yaw * 0.10 + 2, -2.0 - 0.5 * math.sin(ph))
        P.bone('chest', -1.0 * br, k.yaw * 0.12, -0.6)
        P.bone('neck', 0, k.yaw * 0.25, 0)
        P.bone('head', k.pitch + 0.6 * br, k.yaw * 0.55, k.roll + 0.8 * math.sin(ph))
        for s, sg in (('L', 1), ('R', -1)):
            P.arm_fk(s, out=ARM_N + 0.8 * br, fwd=4 + 1.2 * math.sin(ph + sg), bend=14 + 2 * br, hand=8, shrug=0.8 * br, curl=22)
        P.blink = blink_at(f, [14, 64, 69, 104] if not npc else [24, 78, 83], loop=nf)
        return P
    return fn


def act_walk(rig, npc=False):
    return locomotion(rig, 24 if not npc else 26, stance=0.60, L=0.48, lift=0.07, bob=0.011, base=-0.021, lean=4.0,
                      arm_sw=20.0 if not npc else 16.0, arm_bend=(12.0, 16.0), arm_out=ARM_N, yawamp=6.0)


def act_run(rig):
    return locomotion(rig, 16, stance=0.38, L=0.52, lift=0.20, bob=0.016, base=-0.055, lean=13.0,
                      arm_sw=36.0, arm_bend=(78.0, 14.0), arm_out=ARM_N + 2, yawamp=8.0, run=True, headp=-3.0, heel=0.10)


def act_jump(rig):
    kk = K(dz=[(0, -0.014), (5, -0.13), (9, 0.004), (16, 0.0)],
           lean=[(0, 2), (5, 22), (9, -3), (16, 2)],
           arm=[(0, 4), (5, -45), (9, 150), (16, 110)],
           out=[(0, ARM_N), (5, 16), (9, 22), (16, 40)],
           bend=[(0, 14), (5, 16), (9, 12), (16, 35)],
           lift=[(0, 0), (8, 0.04), (10, 0.08), (16, 0.20)],
           fy=[(0, 0), (9, 0.02), (16, -0.06)],
           ft=[(0, 0), (5, 0), (9, 45), (16, 15)],
           head=[(0, 0), (5, -15), (9, -8), (16, -4)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        P.hips((0, 0.03 * k.lean / 22, k.dz), pitch=k.lean * 0.6)
        trunk(P, sp=(k.lean * 0.3, 0, 0), ch=(k.lean * 0.1, 0, 0), nk=(-k.lean * 0.3, 0, 0), hd=(k.head, 0, 0))
        for s, sg in (('L', 1), ('R', -1)):
            P.leg_ik(s, V((sg * HIP_X, k.fy, ANK_Z + k.lift)), foot=k.ft)
            P.arm_fk(s, out=k.out, fwd=k.arm, bend=k.bend, hand=6, curl=30)
        return P
    return fn


def act_fall(rig, nf=20):
    def fn(f):
        ph = 2 * math.pi * f / nf
        P = Pose(rig)
        P.hips((0, 0, 0.0), pitch=-2)
        trunk(P, sp=(-3, 0, 0), ch=(-2 + 1.5 * math.sin(ph), 0, 0), nk=(4, 0, 0), hd=(10, 0, 2 * math.sin(ph)))
        for s, sg, o in (('L', 1, 0), ('R', -1, math.pi)):
            P.leg_ik(s, V((sg * (HIP_X + 0.02), -0.06 + 0.05 * math.sin(ph + o), ANK_Z + 0.13 + 0.04 * math.cos(ph + o))), foot=20)
            P.arm_fk(s, out=95 + 8 * math.sin(2 * ph + o * 0.3), fwd=15, bend=25 + 8 * math.sin(2 * ph), hand=8, shrug=6, curl=10)
        return P
    return fn


def act_land(rig):
    kk = K(dz=[(0, 0.0), (2, -0.04), (5, -0.15), (9, -0.004), (14, -0.014)],
           lift=[(0, 0.12), (2, 0.0), (14, 0.0)],
           lean=[(0, -2), (2, 8), (5, 24), (9, 1), (14, 1.5)],
           out=[(0, 95), (3, 60), (6, 35), (10, 18), (14, ARM_N)],
           arm=[(0, 15), (5, 35), (10, 8), (14, 4)],
           bend=[(0, 25), (5, 45), (14, 14)],
           ft=[(0, 20), (2, 0), (14, 0)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        P.hips((0, 0.035 * k.lean / 24, k.dz), pitch=k.lean * 0.6)
        trunk(P, sp=(k.lean * 0.3, 0, 0), ch=(k.lean * 0.1, 0, 0), nk=(-k.lean * 0.4, 0, 0), hd=(-k.lean * 0.3, 0, 0))
        for s, sg in (('L', 1), ('R', -1)):
            P.leg_ik(s, V((sg * (HIP_X + 0.01), -0.03 * k.lift / 0.12, ANK_Z + k.lift)), foot=k.ft)
            P.arm_fk(s, out=k.out, fwd=k.arm, bend=k.bend, hand=8, curl=20)
        P.blink = bump(f, 5, 1.5)
        return P
    return fn


def act_wave(rig, nf=48):
    kk = K(up=[(0, 0), (9, 1), (39, 1), (48, 0)])

    def fn(f):
        u = kk(f).up
        w = math.sin(2 * math.pi * 3 * (f - 9) / 30) if 9 <= f <= 39 else 0.0
        w *= sstep(7, 12, f) * (1 - sstep(36, 41, f))
        P = Pose(rig)
        stand(P, dz=-0.013, sway=0.012 * u, roll=2 * u)
        P.bone('spine', 0.5, -4 * u, 1.5 * u); P.bone('chest', -2 * u, -3 * u, 1.5 * u); P.bone('neck', 0, -2 * u, 0)
        P.bone('head', -3 * u, -7 * u, -5 * u + 1.5 * w)
        P.arm_fk('L', out=ARM_N, fwd=4, bend=14, hand=8, curl=22)
        P.arm_fk('R', out=lerp(ARM_N, 140, u), fwd=lerp(4, 20, u), bend=lerp(14, 45, u) + 18 * w * u, hand=lerp(8, -10, u),
                 twist=lerp(0, -70, u), shrug=5 * u, curl=lerp(22, 5, u))
        P.blink = bump(f, 26, 1.5)
        return P
    return fn


def act_interact(rig, nf=30):
    kk = K(r=[(0, 0), (10, 1), (13, 1.06), (16, 1), (20, 1), (30, 0)])

    def fn(f):
        r = kk(f).r
        rr = min(r, 1.0)
        P = Pose(rig)
        stand(P, dz=-0.014 - 0.02 * rr, pitch=5 * rr, yaw=-4 * rr)
        trunk(P, sp=(6 * rr, -3 * rr, 0), ch=(4 * rr, -3 * rr, 0), nk=(0, 0, 0), hd=(8 * rr, 4 * rr, 0))
        P.arm_fk('L', out=lerp(ARM_N, 18, rr), fwd=lerp(4, -8, rr), bend=lerp(14, 26, rr), hand=8, curl=22)
        rest = Pose(rig); stand(rest); rest.arm_fk('R', out=ARM_N, fwd=4, bend=14)
        T0 = rest.pos('hand_R')
        T1 = V((-0.13, -0.50, 1.10))
        T = T0.lerp(T1, sstep(0, 1, rr)) + V((0, -0.03 * max(0.0, r - 1) / 0.06, 0))
        P.arm_ik('R', T, pole=(-0.7, 0.5, -0.6), hand=lerp(8, -25, rr), hand_roll=-75 * rr, curl=lerp(22, 5, rr))
        P.blink = bump(f, 22, 1.4)
        return P
    return fn


SEAT_HIP = 0.54                       # hip joints above the feet origin when seated (seat contact at 0.46 m)
SIT_DZ = SEAT_HIP - HIP_Z


def seat_base(P, lean=4.0, yaw=0.0, dy=0.0, roll=0.0):
    P.hips((0, dy, SIT_DZ), pitch=lean * 0.3 - 2, yaw=yaw, roll=roll)


def seated_legs(P, dy=0.0, spread=0.02, swing=(0.0, 0.0), lift=(0.0, 0.0)):
    for s, sg, i in (('L', 1, 0), ('R', -1, 1)):
        P.leg_ik(s, V((sg * (HIP_X + spread), -0.40 + dy + swing[i], ANK_Z + lift[i])), foot=-2)


def act_sit(rig, nf=90, npc=False):
    def fn(f):
        ph = 2 * math.pi * f / nf
        br = math.sin(2 * ph)
        P = Pose(rig)
        seat_base(P, lean=8)
        P.bone('spine', 6 + 0.5 * br, 0, 0); P.bone('chest', 4 - 0.8 * br, 0, 0); P.bone('neck', -4, 0, 0)
        hy = 12 * math.sin(ph) if not npc else -9 * math.sin(ph + 1)
        P.bone('head', -3 + 0.6 * br, hy, 2 * math.sin(ph + 0.4))
        seated_legs(P, swing=(0.015 * math.sin(2 * ph), 0.015 * math.sin(2 * ph + 2)))
        for s, sg in (('L', 1), ('R', -1)):
            knee = P.pos('lower_leg_' + s)
            T = knee + V((sg * 0.012, 0.075, 0.072 + 0.002 * br))
            P.arm_ik(s, T, pole=(sg * 1.0, 0.5, -0.2), hand=-15, hand_roll=60, curl=35)
        P.blink = blink_at(f, [30, 76], loop=nf)
        return P
    return fn


def act_swing(rig, nf=60):
    def fn(f):
        ph = 2 * math.pi * f / nf
        c = math.cos(ph)
        u = (c + 1) / 2
        P = Pose(rig)
        P.hips((0, 0.0, SIT_DZ), pitch=-12 * c - 3)
        P.bone('spine', -5 * c, 0, 0); P.bone('chest', -3 * c, 0, 0); P.bone('neck', 4 * c, 0, 0)
        P.bone('head', 6 * c - 2, 0, 2 * math.sin(ph))
        for s, sg in (('L', 1), ('R', -1)):
            P.leg_fk(s, fwd=lerp(70, 100, u), knee=lerp(115, 12, u), foot=lerp(-10, 30, u), out=3)
            P.arm_ik(s, V((sg * 0.24, 0.03, 1.27)), pole=(sg * 1.0, 0.3, -0.6), hand=-10, hand_roll=-20, curl=85)
        P.blink = bump(f, 40, 1.4)
        return P
    return fn


def act_slide(rig, nf=30):
    def fn(f):
        ph = 2 * math.pi * f / nf
        P = Pose(rig)
        P.hips((0, 0.0, SIT_DZ), pitch=-18, roll=2 * math.sin(ph))
        P.bone('spine', -4, 0, -1.5 * math.sin(ph)); P.bone('chest', 2, 0, 0); P.bone('neck', 8, 0, 0)
        P.bone('head', 4, 3 * math.sin(ph), 5 * math.sin(ph))
        for s, sg, o in (('L', 1, 0), ('R', -1, math.pi)):
            P.leg_fk(s, fwd=98 + 3 * math.sin(2 * ph + o), knee=8, foot=20, out=5)
            P.arm_fk(s, out=150 + 8 * math.sin(2 * ph + o), fwd=12, bend=14, hand=-5, twist=-30, shrug=10, curl=5)
        return P
    return fn


def act_kick(rig, nf=24):
    kk = K(y=[(0, 0.0), (6, 0.24), (11, -0.42), (15, -0.44), (24, 0.0)],
           z=[(0, 0.0), (6, 0.20), (11, 0.30), (15, 0.32), (24, 0.0)],
           ft=[(0, 0), (6, 30), (11, 35), (15, 25), (24, 0)],
           lean=[(0, 0), (6, 8), (11, -12), (15, -14), (24, 0)],
           dz=[(0, -0.014), (6, -0.05), (11, -0.03), (15, -0.035), (24, -0.014)],
           arm=[(0, 0), (6, 1), (11, -1), (15, -1), (24, 0)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        P.hips((0.025 * abs(k.arm), 0, k.dz), pitch=k.lean * 0.5, yaw=-6 * k.arm)
        trunk(P, sp=(k.lean * 0.4, 5 * k.arm, 0), ch=(k.lean * 0.2, 5 * k.arm, 0), nk=(-k.lean * 0.3, 0, 0), hd=(-k.lean * 0.2 + 8, 0, 0))
        P.leg_ik('L', V((HIP_X + 0.02, 0.0, ANK_Z)), foot=0)
        P.leg_ik('R', V((-HIP_X, k.y, ANK_Z + k.z)), foot=k.ft)
        P.arm_fk('L', out=ARM_N + 25 * abs(k.arm), fwd=4 - 35 * k.arm, bend=20 + 20 * abs(k.arm), hand=8, curl=30)
        P.arm_fk('R', out=ARM_N + 25 * abs(k.arm), fwd=4 + 35 * k.arm, bend=20 + 20 * abs(k.arm), hand=8, curl=30)
        return P
    return fn


def act_cheer(rig, nf=40):
    kk = K(loop=nf, dz=[(0, -0.02), (6, -0.09), (12, 0.0), (20, -0.06), (26, -0.09), (32, 0.0)],
           lift=[(0, 0.0), (8, 0.0), (12, 0.10), (16, 0.0), (28, 0.0), (32, 0.08), (36, 0.0)],
           arm=[(0, 150), (6, 135), (12, 165), (20, 145), (26, 135), (32, 165)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        P.hips((0, 0, k.dz), pitch=3)
        trunk(P, sp=(-2, 0, 0), ch=(-4, 0, 0), nk=(-3, 0, 0), hd=(-10, 0, 5 * math.sin(2 * math.pi * f / nf)))
        for s, sg in (('L', 1), ('R', -1)):
            P.leg_ik(s, V((sg * (HIP_X + 0.015), 0.0, ANK_Z + k.lift)), foot=30 * k.lift / 0.1)
            P.arm_fk(s, out=k.arm, fwd=15, bend=18 + 10 * math.sin(4 * math.pi * f / nf), hand=-5, twist=-40, shrug=10, curl=80)
        P.blink = bump(f, 13, 1.5)
        return P
    return fn


def act_type(rig, nf=32):
    def fn(f):
        ph = 2 * math.pi * f / nf
        P = Pose(rig)
        seat_base(P, lean=10)
        P.bone('spine', 6, 0, 0); P.bone('chest', 4 + 0.6 * math.sin(ph), 0, 0); P.bone('neck', 2, 0, 0)
        P.bone('head', 12 + 1.5 * math.sin(2 * ph), 2 * math.sin(ph), 0)
        seated_legs(P, dy=0.02)
        for s, sg, o in (('L', 1, 0.0), ('R', -1, 0.5)):
            tap = max(0.0, math.sin(2 * math.pi * (4 * f / nf + o)))
            T = V((sg * 0.12, -0.36 + 0.012 * math.sin(ph + o * 3), 0.765 + 0.014 * tap))
            P.arm_ik(s, T, pole=(sg * 1.0, 0.4, -0.7), hand=-12 + 12 * tap, hand_roll=75, curl=30 - 15 * tap)
        P.blink = bump(f, 20, 1.3)
        return P
    return fn


def act_lean(rig, nf=90):
    def fn(f):
        ph = 2 * math.pi * f / nf
        br = math.sin(2 * ph)
        P = Pose(rig)
        P.hips((0.02, 0.10, -0.03 + 0.002 * br), pitch=10, yaw=-4, roll=3)
        P.leg_ik('L', V((HIP_X + 0.02, 0.02, ANK_Z)), foot=0)
        P.leg_ik('R', V((-HIP_X + 0.07, 0.06, ANK_Z + 0.08)), foot=40)
        P.bone('spine', 12, 2, -2); P.bone('chest', 10 - 0.8 * br, 2, 0); P.bone('neck', -10, 0, 0)
        P.bone('head', -12 + 0.6 * br, 10 * math.sin(ph), 4 * math.sin(ph + 0.5))
        for s, sg in (('L', 1), ('R', -1)):
            P.arm_ik(s, V((sg * 0.10, -0.47, 1.025)), pole=(sg * 0.8, 0.2, -1.0), hand=-5, hand_roll=70, curl=30,
                     hand_side=sg * -15)
        P.blink = blink_at(f, [24, 66], loop=nf)
        return P
    return fn


def act_npc_talk(rig, nf=96):
    kk = K(loop=nf, g=[(0, 0), (12, 1), (26, 0.4), (38, 1), (52, 0.1), (64, 0.8), (80, 0.2)],
           nod=[(0, 0), (14, 6), (24, -2), (40, 5), (50, 0), (66, 6), (80, 0)],
           yaw=[(0, 8), (30, 14), (56, 4), (80, 12)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        ph = 2 * math.pi * f / nf
        seat_base(P, lean=8, yaw=k.yaw * 0.2)
        P.bone('spine', 4, k.yaw * 0.2, 0); P.bone('chest', 3 - 1.5 * k.g, k.yaw * 0.2, 0); P.bone('neck', -2, 0, 0)
        P.bone('head', k.nod - 3, k.yaw * 0.5, 4 * k.g - 2)
        seated_legs(P)
        knee = P.pos('lower_leg_L')
        P.arm_ik('L', knee + V((0.01, 0.08, 0.072)), pole=(1, 0.5, -0.2), hand=-15, hand_roll=60, curl=35)
        g = k.g
        P.arm_fk('R', out=lerp(18, 40, g), fwd=lerp(30, 55, g) + 6 * math.sin(3 * ph), bend=lerp(75, 95, g) + 10 * math.sin(4 * ph),
                 hand=-20 * g, twist=lerp(0, -70, g), curl=lerp(35, 8, g))
        P.blink = blink_at(f, [20, 58, 62], loop=nf)
        return P
    return fn


# ============================================================================ parrot actions
def pp_base(P, dz=0.0, pitch=0.0, roll=0.0, yaw=0.0):
    P.hips((0, 0, dz), pitch=pitch, yaw=yaw, roll=roll)


def wing_fold(P, s, open_=0.0, up=0.0):
    sg = 1 if s == 'L' else -1
    rest = P.rig.dir['wing_' + s]
    d = rest.lerp(V((sg * 0.6, 0.55, -0.15)).normalized(), open_)
    d = R((0, 1, 0), -sg * up) @ d
    P.aim('wing_' + s, d)


def act_parrot_idle(rig, nf=90):
    kk = K(loop=nf, roll=[(0, 0), (14, 0), (22, 18), (38, 18), (46, -6), (60, -14), (72, -14), (82, 0)],
           yaw=[(0, 0), (20, 10), (44, 10), (58, -16), (74, -16), (84, 0)],
           tail=[(0, 0), (30, 6), (34, -6), (38, 4), (42, 0)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        br = math.sin(4 * math.pi * f / nf)
        pp_base(P, dz=0.0015 * br, pitch=-1 * br)
        P.bone('head', 2 * br, k.yaw, k.roll)
        P.bone('beak', 0, 0, 0)
        for s in ('L', 'R'):
            wing_fold(P, s, 0.0)
        P.bone('tail', k.tail * 0.3, k.tail, 0)
        P.blink = blink_at(f, [10, 52, 56], 1.3, loop=nf)
        return P
    return fn


def act_parrot_fly(rig, nf=12):
    def fn(f):
        ph = 2 * math.pi * f / nf
        flap = math.sin(ph)
        P = Pose(rig)
        pp_base(P, dz=0.035 - 0.008 * flap, pitch=34 + 3 * flap)
        P.bone('head', -26 - 3 * flap, 0, 0)
        P.bone('beak', 0, 0, 0)
        for s, sg in (('L', 1), ('R', -1)):
            d = R((0, 1, 0), -sg * (10 + 55 * flap)) @ V((sg * 1.0, 0.25 + 0.15 * flap, 0.0)).normalized()
            P.aim('wing_' + s, d)
        P.bone('tail', -18 + 6 * flap, 0, 0)
        return P
    return fn


def act_parrot_hop(rig, nf=18):
    kk = K(dz=[(0, 0), (4, -0.012), (9, 0.075), (13, 0.0), (15, -0.008), (18, 0)],
           pitch=[(0, 0), (4, 14), (9, -4), (13, 10), (18, 0)],
           wing=[(0, 0), (6, 0), (9, 1), (12, 0.2), (14, 0)],
           tail=[(0, 0), (4, -10), (9, 14), (13, -8), (18, 0)])

    def fn(f):
        k = kk(f); P = Pose(rig)
        pp_base(P, dz=k.dz, pitch=k.pitch)
        P.bone('head', -k.pitch * 0.7, 0, 0)
        P.bone('beak', 0, 0, 0)
        for s in ('L', 'R'):
            wing_fold(P, s, 0.55 * k.wing, up=45 * k.wing)
        P.bone('tail', k.tail, 0, 0)
        P.blink = bump(f, 4, 1.2)
        return P
    return fn


def act_parrot_talk(rig, nf=24):
    def fn(f):
        ph = 2 * math.pi * f / nf
        o = max(0.0, math.sin(2 * ph))
        P = Pose(rig)
        pp_base(P, dz=0.004 * max(0, math.sin(2 * ph)), pitch=3 * math.sin(2 * ph))
        P.bone('head', -6 * o + 4, 6 * math.sin(ph), 8 * math.sin(ph))
        P.bone('beak', 28 * o, 0, 0)
        for s in ('L', 'R'):
            wing_fold(P, s, 0.12 * o, up=8 * o)
        P.bone('tail', 4 * math.sin(2 * ph), 0, 0)
        P.blink = bump(f, 18, 1.2)
        return P
    return fn


# ============================================================================ build all
ALL = ['player', 'parrot', 'npc_a', 'npc_b', 'npc_c', 'npc_d', 'npc_e', 'npc_f']


def build_all(names=None):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = FPS
    MATS.clear(); LD.clear(); ACTIONS.clear()
    chars = []
    for n in names or ALL:
        if n == 'player':
            chars.append(build_player())
        elif n == 'parrot':
            chars.append(build_parrot())
        else:
            chars.append(build_npc(n, NPCS[n]))
    for ch in chars:
        log('built %-7s parts=%3d tris=%d' % (ch.name, len(ch.parts), ch.tris()))
        log('   ' + ' '.join('%s:%d' % (o.name.split('_', 1)[1], sum(len(p.vertices) - 2 for p in o.data.polygons)) for o in ch.parts))
    log('TOTAL TRIS', sum(c.tris() for c in chars))
    return chars


PLAYER_ACTS = [('player_idle', 120, act_idle, True), ('player_walk', 24, act_walk, True), ('player_run', 16, act_run, True),
               ('player_jump', 16, act_jump, False), ('player_fall', 20, act_fall, True), ('player_land', 14, act_land, False),
               ('player_wave', 48, act_wave, False), ('player_interact', 30, act_interact, False),
               ('player_sit', 90, act_sit, True), ('player_swing', 60, act_swing, True), ('player_slide', 30, act_slide, True),
               ('player_kick', 24, act_kick, False), ('player_cheer', 40, act_cheer, True), ('player_type', 32, act_type, True),
               ('player_lean', 90, act_lean, True)]


def rig_and_animate(chars):
    rigs = {}
    for ch in chars:
        assign_weights(ch)
    bake_ao(chars)
    for ch in chars:
        join_parts(ch)
        build_armature(ch, parrot_bones() if ch.name == 'parrot' else human_bones())
        rigs[ch.name] = Rig(ch.rig, 'body' if ch.name == 'parrot' else 'hips')
    if 'player' in rigs:
        r = rigs['player']
        for nm, nf, fa, loop in PLAYER_ACTS:
            write_action(r, nm, nf, fa(r), loop)
    npc_owner = next((n for n in NPC_NAMES if n in rigs), None)
    if npc_owner:
        r = rigs[npc_owner]
        for nm, nf, fn, loop in [('npc_idle', 120, act_idle(r, npc=True), True), ('npc_walk', 26, act_walk(r, npc=True), True),
                                 ('npc_sit', 90, act_sit(r, npc=True), True), ('npc_talk', 96, act_npc_talk(r), True),
                                 ('npc_wave', 48, act_wave(r), False)]:
            write_action(r, nm, nf, fn, loop)
    if 'parrot' in rigs:
        r = rigs['parrot']
        for nm, nf, fn, loop in [('parrot_idle', 90, act_parrot_idle(r), True), ('parrot_fly', 12, act_parrot_fly(r), True),
                                 ('parrot_hop', 18, act_parrot_hop(r), False), ('parrot_talk', 24, act_parrot_talk(r), True)]:
            write_action(r, nm, nf, fn, loop)
    log('actions', len(ACTIONS))
    return rigs


def export_glb(chars):
    for ch in chars:
        ad = ch.rig.animation_data
        if ad:
            ad.action = None
            for tr in ad.nla_tracks:
                tr.mute = False
        for pb in ch.rig.pose.bones:
            pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.ops.export_scene.gltf(
        filepath=GLB, export_format='GLB', use_selection=False, export_yup=True, export_apply=False,
        export_texcoords=False, export_normals=True, export_materials='EXPORT', export_cameras=False, export_lights=False,
        export_extras=False, export_skins=True, export_def_bones=False, export_rest_position_armature=True,
        export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_step=1,
        export_optimize_animation_size=True, export_optimize_animation_keep_anim_armature=True,
        export_anim_slide_to_zero=False, export_morph=False,
        export_vertex_color='NAME', export_vertex_color_name='Col', export_all_vertex_colors=False,
        export_draco_mesh_compression_enable=False)
    log('exported', GLB, os.path.getsize(GLB))
    os.makedirs(os.path.dirname(SRC_GLB), exist_ok=True)
    shutil.copyfile(GLB, SRC_GLB)


# ============================================================================ look-dev scene
def preview_materials():
    for m in MATS.values():
        nt = m.node_tree
        b = nt.nodes.get('Principled BSDF')
        if b is None or nt.nodes.get('AOmul'):
            continue
        a = nt.nodes.new('ShaderNodeVertexColor'); a.layer_name = 'Col'
        mx = nt.nodes.new('ShaderNodeMix'); mx.name = 'AOmul'
        mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
        mx.inputs['Factor'].default_value = 1.0
        mx.inputs[6].default_value = b.inputs['Base Color'].default_value
        nt.links.new(a.outputs['Color'], mx.inputs[7])
        nt.links.new(mx.outputs[2], b.inputs['Base Color'])


def lookdev_mat(name, hx, rough=0.95):
    m = bpy.data.materials.new('LD_' + name)
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*hexlin(hx), 1)
    b.inputs['Roughness'].default_value = rough
    return m


LD = {}


def mkobj(name, verts, faces, m, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate(); me.update()
    me.materials.append(m)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def hex_tile(name, c):
    out = [(2.0 * math.cos(math.radians(90 + 60 * k)), 2.0 * math.sin(math.radians(90 + 60 * k))) for k in range(6)]
    pts = []
    for k in range(6):
        a = V(out[k]); b = V(out[(k + 1) % 6])
        for j in range(4):
            pts.append(tuple(a.lerp(b, j / 4)))
    v, f = slab(pts, -1.2, -0.05, bevel=0.06, steps=3)
    o1 = mkobj(name + '_body', [p + V(c) for p in v], f, LD['cream'])
    v, f = slab([(p[0] * 0.985, p[1] * 0.985) for p in pts], -0.12, 0.0, bevel=0.06, steps=3)
    o2 = mkobj(name + '_top', [p + V(c) for p in v], f, LD['grass'])
    return [o1, o2]


def setup_lookdev(cam_loc, target, lens=50, res=(800, 600), tiles=((0, 0, 0),), wall_dist=2.6):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    try:
        sc.view_settings.view_transform = 'AgX'
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except Exception as ex:
        log('view transform', ex)
    try:
        sc.eevee.taa_render_samples = 64
        sc.eevee.use_raytracing = True
        sc.eevee.use_shadows = True
        sc.eevee.shadow_ray_count = 2
        sc.eevee.shadow_step_count = 8
        sc.eevee.use_fast_gi = True
    except Exception as ex:
        log('eevee', ex)
    if not LD:
        LD['cream'] = lookdev_mat('cream', '#F3EDE6'); LD['grass'] = lookdev_mat('grass', '#74C391')
        LD['pink'] = lookdev_mat('pink', '#ECBDB7'); LD['water'] = lookdev_mat('water', '#79BFC9', 0.6)
        LD['coral'] = lookdev_mat('coral', '#F28C6F'); LD['wood'] = lookdev_mat('wood', '#C98C62')
    w = bpy.data.worlds.new('LookDev'); sc.world = w
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (*hexlin('#D9D2CB'), 1)
    bg.inputs['Strength'].default_value = 0.8
    objs = []
    cam_loc = V(cam_loc); target = V(target)
    vd = (target - cam_loc); vd.z = 0; vd.normalize()
    left = V((0, 0, 1)).cross(vd).normalized()
    wc = target + vd * wall_dist
    a = V((0, 0, 1)).cross(-vd).normalized()
    wv = [wc + a * sx * 14 + V((0, 0, sz * 8)) for sx, sz in ((-1, -0.2), (1, -0.2), (1, 1), (-1, 1))]
    objs.append(mkobj('LD_wall', wv, [(0, 1, 2, 3)], LD['pink'], smooth=False))
    wv = [V((x, y, -0.55)) for x, y in ((-30, -30), (30, -30), (30, 30), (-30, 30))]
    objs.append(mkobj('LD_water', wv, [(0, 1, 2, 3)], LD['water'], smooth=False))
    for i, t in enumerate(tiles):
        objs += hex_tile('LD_tile%d' % i, t)
    ld = bpy.data.lights.new('LD_key', 'AREA'); ld.size = 4.5; ld.energy = 2000; ld.color = (1.0, 0.96, 0.9)
    lo = bpy.data.objects.new('LD_key', ld); sc.collection.objects.link(lo)
    lo.location = target + left * 3.6 - vd * 2.0 + V((0, 0, 4.6))
    lo.rotation_euler = (target - lo.location).to_track_quat('-Z', 'Y').to_euler()
    objs.append(lo)
    cd = bpy.data.cameras.new('LD_cam'); cd.lens = lens
    co = bpy.data.objects.new('LD_cam', cd); sc.collection.objects.link(co)
    co.location = cam_loc
    co.rotation_euler = (target - cam_loc).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = co
    objs.append(co)
    return objs


def clear_lookdev(objs):
    for o in objs:
        try:
            bpy.data.objects.remove(o, do_unlink=True)
        except Exception:
            pass


def render(path):
    sc = bpy.context.scene
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    log('render', os.path.basename(path))


def set_pose(ch, action=None, frame=0):
    ad = ch.rig.animation_data or ch.rig.animation_data_create()
    for tr in ad.nla_tracks:
        tr.mute = True
    if action is None:
        ad.action = None
        for pb in ch.rig.pose.bones:
            pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    else:
        info = ACTIONS[action]
        ad.action = info['act']
        try:
            ad.action_slot = info['slot']
        except Exception as ex:
            log('slot assign', ex)
    bpy.context.scene.frame_set(frame)


def show_only(chars, keep):
    for ch in chars:
        vis = ch.name in keep
        for o in [ch.root] + [c for c in ch.root.children_recursive]:
            o.hide_render = not vis
            o.hide_viewport = not vis


def place(ch, loc, rotz=0.0):
    ch.root.location = V(loc)
    ch.root.rotation_euler = (0, 0, math.radians(rotz))


def bench(loc, w=1.4, h=0.46):
    outline = [(w / 2 * pw(math.cos(2 * math.pi * k / 20), 0.3), 0.21 * pw(math.sin(2 * math.pi * k / 20), 0.3)) for k in range(20)]
    v, f = slab(outline, h - 0.08, h, bevel=0.03, steps=2)
    o = [mkobj('LD_bench', [p + V(loc) + V((0, 0.05, 0)) for p in v], f, LD['coral'])]
    for sx in (-1, 1):
        v, f = slab([(0.05 * math.cos(2 * math.pi * k / 12), 0.15 * math.sin(2 * math.pi * k / 12)) for k in range(12)], 0, h - 0.07, bevel=0.02)
        o.append(mkobj('LD_leg', [p + V(loc) + V((sx * w * 0.36, 0.05, 0)) for p in v], f, LD['cream']))
    return o


def desk(loc):
    outline = [(0.45 * pw(math.cos(2 * math.pi * k / 20), 0.3), 0.25 * pw(math.sin(2 * math.pi * k / 20), 0.3)) for k in range(20)]
    v, f = slab(outline, 0.68, 0.73, bevel=0.02, steps=2)
    return [mkobj('LD_desk', [p + V(loc) for p in v], f, LD['wood'])]


def rail(loc, h=1.0):
    v, f = tube([V(loc) + V((-0.8, 0, h)), V(loc) + V((0.8, 0, h))], 0.035, segs=12)
    o = [mkobj('LD_rail', v, f, LD['cream'])]
    for sx in (-0.6, 0.6):
        v, f = tube([V(loc) + V((sx, 0, 0)), V(loc) + V((sx, 0, h))], 0.03, segs=10)
        o.append(mkobj('LD_post', v, f, LD['cream']))
    return o


# ============================================================================ composite helpers
def load_px(path):
    import numpy as np
    img = bpy.data.images.load(path)
    w, h = img.size
    buf = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    bpy.data.images.remove(img)
    return buf.reshape(h, w, 4)


def save_px(arr, path):
    import numpy as np
    h, w = arr.shape[:2]
    img = bpy.data.images.new('comp', w, h, alpha=False)
    img.pixels.foreach_set(arr.astype(np.float32).ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


# ============================================================================ previews
def cam_34(target, dist, h, side=-1.0, ang=35.0):
    a = math.radians(ang)
    return V((side * math.sin(a) * dist, -math.cos(a) * dist, h)) + V((target[0], target[1], 0)), V(target)


def body_cam(ang=35.0):
    cl, tg = cam_34((0, 0, 0.84), 6.2, 2.2, ang=ang)
    return cl, tg, 50


def face_cam(ang=30.0, h=1.62):
    cl, tg = cam_34((0, 0, 1.46), 2.4, h, ang=ang)
    return cl, tg, 85


def shoot_set(ch, cam, shots, extra=None):
    cl, tg, lens = cam
    objs = setup_lookdev(cl, tg, lens)
    if extra:
        objs += extra()
    for nm, act, fr in shots:
        set_pose(ch, act, fr)
        render(os.path.join(PREV, nm + '.png'))
    clear_lookdev(objs)


def strip(ch, act, n, step, name):
    import numpy as np
    objs = setup_lookdev(V((-6.0, -0.9, 1.1)), V((0, 0, 0.80)), 60, res=(300, 520), wall_dist=2.4)
    tiles = []
    for fr in range(0, n, step):
        set_pose(ch, act, fr)
        p = os.path.join(WORK, 'strip_%02d.png' % fr)
        bpy.context.scene.render.filepath = p
        bpy.ops.render.render(write_still=True)
        tiles.append(load_px(p))
    save_px(np.concatenate(tiles, axis=1), os.path.join(PREV, name))
    clear_lookdev(objs)
    log('strip', name)


def previews(chars, rigs, only=None):
    os.makedirs(PREV, exist_ok=True)
    preview_materials()
    by = {c.name: c for c in chars}
    pl = by.get('player')
    if pl and (not only or 'player' in only):
        show_only(chars, ['player'])
        shoot_set(pl, body_cam(), [('player_rest', None, 0), ('player_idle', 'player_idle', 44), ('player_walk', 'player_walk', 3),
                                   ('player_run', 'player_run', 3), ('player_wave', 'player_wave', 20), ('player_jump', 'player_jump', 10),
                                   ('player_fall', 'player_fall', 5), ('player_land', 'player_land', 5),
                                   ('player_kick', 'player_kick', 12), ('player_cheer', 'player_cheer', 12),
                                   ('player_interact', 'player_interact', 14)])
        shoot_set(pl, face_cam(30), [('player_face', 'player_idle', 0)])
        shoot_set(pl, face_cam(0, 1.52), [('player_face_front', 'player_idle', 0)])
        shoot_set(pl, face_cam(90, 1.52), [('player_face_side', 'player_idle', 0)])
        shoot_set(pl, body_cam(20), [('player_lean', 'player_lean', 20)], extra=lambda: rail((0, -0.53, 0)))
        shoot_set(pl, body_cam(), [('player_sit', 'player_sit', 20), ('player_swing', 'player_swing', 0),
                                   ('player_swing_back', 'player_swing', 30), ('player_slide', 'player_slide', 8)],
                  extra=lambda: bench((0, 0, 0)))
        shoot_set(pl, body_cam(), [('player_type', 'player_type', 6)], extra=lambda: bench((0, 0, 0)) + desk((0, -0.48, 0)))
        strip(pl, 'player_walk', 24, 3, 'player_walk_strip.png')
        strip(pl, 'player_run', 16, 2, 'player_run_strip.png')
        set_pose(pl, None)
    for n in NPC_NAMES:
        if n not in by or (only and n not in only):
            continue
        ch = by[n]
        show_only(chars, [n])
        shoot_set(ch, body_cam(), [('%s_idle' % n, 'npc_idle', 40), ('%s_walk' % n, 'npc_walk', 4), ('%s_wave' % n, 'npc_wave', 20)])
        shoot_set(ch, face_cam(30), [('%s_face' % n, 'npc_idle', 0)])
        shoot_set(ch, body_cam(), [('%s_sit' % n, 'npc_sit', 20), ('%s_talk' % n, 'npc_talk', 12)], extra=lambda: bench((0, 0, 0)))
        set_pose(ch, None)
    if 'parrot' in by and (not only or 'parrot' in only):
        pr = by['parrot']
        show_only(chars, ['parrot'])
        cl, tg = cam_34((0, 0, 0.17), 1.6, 0.62)
        shoot_set(pr, (cl, tg, 85), [('parrot_idle', 'parrot_idle', 30), ('parrot_fly', 'parrot_fly', 3),
                                     ('parrot_talk', 'parrot_talk', 6), ('parrot_hop', 'parrot_hop', 9)])
        set_pose(pr, None)
    if only:
        return
    show_only(chars, [c.name for c in chars])
    lay = {'player': (0.0, -0.3, 0, 'player_wave', 20), 'parrot': (-0.65, -0.75, 25, 'parrot_talk', 6),
           'npc_a': (-1.15, 0.45, 15, 'npc_idle', 30), 'npc_b': (-2.35, 0.0, 25, 'npc_idle', 60),
           'npc_c': (1.15, 0.45, -15, 'npc_wave', 22), 'npc_d': (2.35, 0.0, -25, 'npc_idle', 70),
           'npc_e': (-0.55, 1.15, 5, 'npc_idle', 90), 'npc_f': (0.65, -0.85, -10, 'npc_wave', 18)}
    for n, (x, y, rz, act, fr) in lay.items():
        if n in by:
            place(by[n], (x, y, 0), rz)
            set_pose(by[n], act, fr)
    cl = V((-4.9, -9.6, 4.4)); tg = V((0.0, 0.1, 0.75))
    objs = setup_lookdev(cl, tg, 50, res=(1600, 900), tiles=((-1.75, 0.0, 0), (1.75, 0.0, 0)), wall_dist=4.0)
    render(os.path.join(HERE, 'contact_sheet.png'))
    clear_lookdev(objs)
    for c in chars:
        place(c, (0, 0, 0))


# ============================================================================ validation / manifest
def glb_json(path):
    with open(path, 'rb') as fh:
        data = fh.read()
    clen, ctype = struct.unpack('<II', data[12:20])
    return json.loads(data[20:20 + clen].decode('utf8'))


def glb_report(path):
    g = glb_json(path)
    nodes = g['nodes']; acc = g['accessors']
    lines = []
    scene = g['scenes'][g.get('scene', 0)]
    lines.append('roots: ' + ', '.join(nodes[i]['name'] for i in scene['nodes']))
    for m in g['meshes']:
        tris = 0; mats = []
        for pr in m['primitives']:
            tris += acc[pr['indices']]['count'] // 3
            mats.append(g['materials'][pr['material']]['name'])
            attrs = sorted(pr['attributes'].keys())
        lines.append('mesh %-12s tris=%5d attrs=%s mats=%s' % (m['name'], tris, ','.join(attrs), ','.join(mats)))
    for s in g.get('skins', []):
        lines.append('skin %-10s joints=%d' % (s.get('name', ''), len(s['joints'])))
    for a in g.get('animations', []):
        tmax = max(acc[smp['input']]['max'][0] for smp in a['samplers'])
        lines.append('anim %-16s %.3fs channels=%d' % (a['name'], tmax, len(a['channels'])))
    lines.append('extensionsUsed: %s' % g.get('extensionsUsed', []))
    return g, lines


def validate():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    roots = [o for o in bpy.context.scene.objects if o.parent is None]
    print('VALIDATE roots:', sorted(o.name for o in roots))
    for r in sorted(roots, key=lambda o: o.name):
        tris = 0; mats = set(); bones = 0; cols = []
        for o in [r] + list(r.children_recursive):
            if o.type == 'MESH':
                me = o.data
                me.calc_loop_triangles()
                tris += len(me.loop_triangles)
                mats |= {m.name for m in me.materials if m}
                cols = [a.name for a in me.color_attributes]
            if o.type == 'ARMATURE':
                bones = len(o.data.bones)
        print('VALIDATE %-8s tris=%5d bones=%2d mats=%s cols=%s' % (r.name, tris, bones, sorted(mats), cols))
    print('VALIDATE actions:', sorted(a.name for a in bpy.data.actions))
    g, lines = glb_report(GLB)
    for l in lines:
        print('GLB', l)


def write_manifest(chars, rigs):
    g, lines = glb_report(GLB)
    acc = g['accessors']
    mesh_tris = {m['name']: sum(acc[p['indices']]['count'] // 3 for p in m['primitives']) for m in g['meshes']}
    anims = {a['name']: max(acc[s['input']]['max'][0] for s in a['samplers']) for a in g['animations']}
    total = sum(mesh_tris.values())
    L = ['# character pack: MANIFEST', '',
         'File: `character.glb` (%.0f KB, glTF binary, no Draco / meshopt / KTX). %d triangles in total. AO baked into COLOR_0 (`Col`).'
         % (os.path.getsize(GLB) / 1024, total), 'Copied to `world/src/models/character.glb`.', '',
         'Rebuild: `"/c/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b --factory-startup --python build_character.py -- all`', '',
         '## Roots', '',
         '| root | size x, y, z (m) | triangles | bones | special children | notes |', '|---|---|---|---|---|---|']
    notes = {'player': 'Mehfooz, stylised adult (1.65 m). Children: `player_rig` (armature) > `player_mesh` (skinned). Rest pose is an A-pose; play `player_idle` by default.',
             'parrot': 'Tota the parrot (0.35 m). Children: `parrot_rig` > `parrot_mesh`. Origin at the feet (perch point).'}
    for n, P in NPCS.items():
        notes[n] = P['note'] + ' Children: `%s_rig` > `%s_mesh`.' % (n, n)
    for ch in chars:
        set_pose(ch, None)
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        ev = ch.mesh.evaluated_get(dg)
        me = ev.to_mesh()
        xs = [ch.mesh.matrix_world @ v.co for v in me.vertices]
        mn = V((min(p.x for p in xs), min(p.y for p in xs), min(p.z for p in xs)))
        mx = V((max(p.x for p in xs), max(p.y for p in xs), max(p.z for p in xs)))
        ev.to_mesh_clear()
        L.append('| `%s` | %.2f, %.2f, %.2f | %d | %d | none | %s |' % (
            ch.name, mx.x - mn.x, mx.y - mn.y, mx.z - mn.z, mesh_tris.get(ch.name + '_mesh', 0), len(ch.rig.data.bones), notes[ch.name]))
    L += ['', '## Skeletons', '',
          'Humanoid (player and npc_a..npc_f: identical bone names and rest pose, %d bones): ' % len(human_bones()) +
          ', '.join('`%s`' % b[0] for b in human_bones()) + '.', '',
          'Parrot (%d bones): ' % len(parrot_bones()) + ', '.join('`%s`' % b[0] for b in parrot_bones()) + '.', '',
          '- `root` never moves. `hips` (or `body` on the parrot) carries the only translation channel, so every clip is in place (no root motion).',
          '- `eyes` is animated by scale only (blinks). `head` is the bone to turn for look-at. `fingers_*` curl the hands.',
          '- glTF node names must be unique, so three.js GLTFLoader renames the duplicate bones of the 2nd to 4th humanoid (`hips_1`, `hips_2`...). '
          'To share clips: after loading, inside each character root strip `/_\\d+$/` from bone names, and strip it from the node part of every '
          'clip track name too (`hips_3.quaternion` -> `hips.quaternion`). Then any `player_*` or `npc_*` clip drives any of the four humanoids.',
          '- Seated clips (`player_sit`, `player_type`, `player_swing`, `player_slide`, `npc_sit`, `npc_talk`): feet stay on the ground at the origin, '
          'the hip joints are at %.2f m and the seat contact (bottom of the trousers) at %.2f m. Place the root so the seat surface is 0.46 m above it, '
          'directly under the hips, facing -Y; the knees reach 0.37 m forward and the feet rest 0.40 m forward.' % (SEAT_HIP, SEAT_HIP - 0.08),
          '- `player_type`: hands at 0.77 m above the floor and 0.36 m in front of the origin (desk top about 0.73 m).',
          '- `player_lean`: forearms on a railing 1.0 m high, 0.45 m in front of the origin.',
          '- `player_swing`: hands hold the chains at x = +/-0.22 m, 1.02 m above the origin.',
          '- Natural ground speed of the in-place cycles at 1x: walk %.2f m/s, run %.2f m/s, npc_walk %.2f m/s. Set the clip timeScale to '
          '(speed / natural speed) to avoid foot sliding.' % (0.48 / (0.60 * 24 / 30), 0.52 / (0.38 * 16 / 30), 0.48 / (0.60 * 26 / 30)), '',
          '## Animations (30 fps)', '', '| clip | frames | seconds | loop | on |', '|---|---|---|---|---|']
    for nm, info in ACTIONS.items():
        L.append('| `%s` | 0-%d | %.2f | %s | `%s` |' % (nm, info['frames'], anims.get(nm, info['frames'] / FPS),
                                                       'yes' if info['loop'] else 'once', info['rig']))
    L += ['', '## Materials', '', ', '.join('`%s`' % m for m in sorted(MATS.keys())), '',
          'Palette-adjacent cloth colours added for the townsfolk (map them to shared clay materials like the other `pal_*`): ' +
          ', '.join('`%s` %s' % (k, PAL[k]) for k in ('pal_kameez_a', 'pal_kameez_b', 'pal_kameez_c', 'pal_kameez_d')) +
          ' (dusty rose, sage, sky, mustard).', '',
          '## Townsfolk notes', '',
          '- `npc_b` has a second skinned mesh named `stick` (walking stick, bound to `hand_L`) under `npc_b_rig`.',
          '- `npc_f` (kid) uses the same skeleton; its root Empty carries a uniform scale of %.2f, so keep the root scale when cloning. '
          'All clips work unchanged; its seated contact height is %.2f m.' % (KID_SCALE, KID_SCALE * (SEAT_HIP - 0.08)),
          '- Kameez/kurti skirts are weighted partly to the thighs so they follow walking and sitting.', '',
          '## Validation (read back from the exported GLB)', '', '```'] + lines + ['```', '']
    with open(os.path.join(HERE, 'MANIFEST.md'), 'w', encoding='utf8', newline='\n') as fh:
        fh.write('\n'.join(L))
    log('manifest written')


# ============================================================================ look mode
def look(names):
    os.makedirs(WORK, exist_ok=True)
    chars = build_all(names)
    for ch in chars:
        assign_weights(ch)
    bake_ao(chars, samples=32)
    preview_materials()
    for ch in chars:
        show_only(chars, [ch.name])
        if ch.name == 'parrot':
            cl, tg = cam_34((0, 0, 0.17), 1.6, 0.62)
            views = [('34', (cl, tg, 85))]
        else:
            views = [('34', body_cam()), ('face', face_cam(30)), ('front', face_cam(0, 1.52)), ('side', face_cam(90, 1.52)),
                     ('back', face_cam(150, 1.6)), ('bodyfront', body_cam(0))]
        for nm, (cl, tg, lens) in views:
            objs = setup_lookdev(cl, tg, lens)
            render(os.path.join(WORK, 'look_%s_%s.png' % (ch.name, nm)))
            clear_lookdev(objs)


# ============================================================================ main
if MODE == 'look':
    look(ARGS[1:] or ['player'])
elif MODE == 'validate':
    validate()
elif MODE == 'poses':
    os.makedirs(WORK, exist_ok=True)
    names = [a for a in ARGS[1:] if not a.startswith('-')] or None
    chars = build_all(names)
    rigs = rig_and_animate(chars)
    previews(chars, rigs, only=names)
elif MODE == 'all':
    os.makedirs(WORK, exist_ok=True)
    chars = build_all()
    rigs = rig_and_animate(chars)
    export_glb(chars)
    write_manifest(chars, rigs)
    if '--noprev' not in ARGS:
        previews(chars, rigs)
    validate()
log('DONE', MODE)
