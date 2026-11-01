import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Paleta: pele marrom + moletom verde com detalhes lilás
export const COLORS = {
  skin: 0x8a5637,
  nose: 0x9a5a3c,
  earInner: 0x6e3f27,
  mouth: 0x2e140c,
  hair: 0x0e0b0a,
  hairLight: 0x231a16,
  eye: 0x0b0a0d,
  brow: 0x120e0c,
  hoodie: 0x2a6fdb,
  trim: 0xc98ae6,
  string: 0x3a3d42,
};

// Proporções da cabeça: superelipsoide (n > 2 = mais quadrado) com mandíbula larga
const HEAD = { rx: 0.86, ry: 1.05, rz: 0.84, n: 2.5, jaw: 0.1, front: 0.95 };
const X_AXIS = new THREE.Vector3(1, 0, 0);

// Projeta uma direção unitária na superfície da superelipsoide e aplica as proporções
function deform(v) {
  const n = HEAD.n;
  v.multiplyScalar(1 / (Math.abs(v.x) ** n + Math.abs(v.y) ** n + Math.abs(v.z) ** n) ** (1 / n));
  const t = Math.max(0, -v.y);
  v.x *= HEAD.rx * (1 - HEAD.jaw * t * t);
  v.z *= HEAD.rz * (1 - 0.1 * t) * (v.z > 0 ? HEAD.front : 1);
  v.y *= HEAD.ry;
  return v;
}

// Profundidade (z) da superfície frontal do rosto em (x, y)
export function surfaceZ(x, y) {
  const n = HEAD.n;
  const uy = y / HEAD.ry;
  const t = Math.max(0, -uy);
  const ux = x / (HEAD.rx * (1 - HEAD.jaw * t * t));
  const uz = Math.max(0, 1 - Math.abs(ux) ** n - Math.abs(uy) ** n) ** (1 / n);
  return uz * HEAD.rz * (1 - 0.1 * t) * HEAD.front;
}

function headShell({ scale = 1, thetaLength = Math.PI, tilt = 0 } = {}) {
  let g = new THREE.SphereGeometry(1, 96, 64, 0, Math.PI * 2, 0, thetaLength);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyAxisAngle(X_AXIS, tilt);
    deform(v).multiplyScalar(scale);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function mesh(geo, mat, { p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0] } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p);
  m.scale.set(...s);
  m.rotation.set(...r);
  return m;
}

// Tubo afinado preso a uma curva 3D (cordões) ou à superfície do rosto (sobrancelhas, boca)
export function taperedTube(curve, radius, mat, taper = () => 1, segs = 48, radial = 12) {
  const g = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const pos = g.attributes.position;
  const v = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i <= segs; i++) {
    curve.getPointAt(i / segs, c);
    const f = taper(i / segs);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(f).add(c);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

function faceTube(points, radius, mat, { lift = 0.01, taper } = {}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, surfaceZ(x, y) + lift))
  );
  return taperedTube(curve, radius, mat, taper);
}

const roundEnds = (u) => Math.sin(Math.PI * u) ** 0.35;

function makeMaterials() {
  const fabric = (color) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.8, sheen: 0.35, sheenRoughness: 0.7, sheenColor: color,
  });
  return {
    skin: new THREE.MeshPhysicalMaterial({
      color: COLORS.skin, roughness: 0.58, sheen: 0.4, sheenColor: 0xffb48c,
      sheenRoughness: 0.5, clearcoat: 0.06, clearcoatRoughness: 0.6,
    }),
    nose: new THREE.MeshPhysicalMaterial({
      color: COLORS.nose, roughness: 0.5, sheen: 0.4, sheenColor: 0xffb090, clearcoat: 0.08,
    }),
    earInner: new THREE.MeshStandardMaterial({ color: COLORS.earInner, roughness: 0.7 }),
    mouth: new THREE.MeshStandardMaterial({ color: COLORS.mouth, roughness: 0.6 }),
    hair: new THREE.MeshStandardMaterial({ color: COLORS.hair, roughness: 0.7 }),
    // Cachos pretos com brilho suave (estilo "massinha" da referência)
    curls: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.35,
    }),
    eye: new THREE.MeshPhysicalMaterial({
      color: COLORS.eye, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03,
    }),
    brow: new THREE.MeshStandardMaterial({ color: COLORS.brow, roughness: 0.5 }),
    hoodie: fabric(COLORS.hoodie),
    trim: fabric(COLORS.trim),
    string: new THREE.MeshStandardMaterial({ color: COLORS.string, roughness: 0.5 }),
  };
}

// Olho oval preto e brilhante; desliza sobre o rosto para olhar e "achata" para piscar
function buildEye(M, side) {
  const base = new THREE.Vector2(side * 0.3, 0.06);
  const group = new THREE.Group();
  group.add(mesh(new THREE.SphereGeometry(1, 32, 24), M.eye, { s: [0.085, 0.12, 0.055] }));
  return { group, base };
}

// Cacho em espiral aberta ("C" que enrola para fora), eixo voltado para +z
export function ringletGeometry() {
  const pts = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    const a = t * 1.55 * Math.PI * 2;
    const r = 1 - 0.55 * t;
    pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0.75 * t));
  }
  const taper = (u) => (1 - 0.55 * u) * Math.min(1, u * 8) ** 0.5 * Math.min(1, (1 - u) * 10) ** 0.6;
  return taperedTube(new THREE.CatmullRomCurve3(pts), 0.5, null, taper, 64, 12).geometry;
}

function buildHair(M) {
  const group = new THREE.Group();
  // Região do cabelo: testa livre, laterais descendo atrás das orelhas até a mandíbula
  const THETA = 1.95, TILT = -0.9;
  group.add(new THREE.Mesh(headShell({ scale: 1.02, thetaLength: THETA, tilt: TILT }), M.hair));

  const COUNT = 150, FRINGE = 26;
  const curls = new THREE.InstancedMesh(ringletGeometry(), M.curls, COUNT + FRINGE + 1);
  const dark = new THREE.Color(COLORS.hair), light = new THREE.Color(COLORS.hairLight);
  const tmp = new THREE.Object3D(), col = new THREE.Color();
  const Z = new THREE.Vector3(0, 0, 1), n = new THREE.Vector3(), spin = new THREE.Quaternion();
  const cosMax = Math.cos(THETA);

  let i = 0;
  while (i < COUNT + FRINGE) {
    // Os últimos cachos vão na linha da testa (franja)
    const fringe = i >= COUNT;
    const y = fringe
      ? Math.cos(THETA - 0.05 - Math.random() * 0.25)
      : cosMax + Math.random() * (1 - cosMax);
    const phi = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    const v = new THREE.Vector3(r * Math.cos(phi), y, r * Math.sin(phi));
    const u = Math.acos(y) / THETA;
    deform(v.applyAxisAngle(X_AXIS, TILT));
    if (fringe && v.z < 0.45) continue;
    // Deixa as orelhas à mostra (o cabelo passa por trás delas)
    if (Math.abs(v.x) > 0.7 && v.y > -0.4 && v.y < 0.22 && v.z > -0.3) continue;
    n.copy(v).normalize();
    const depth = (0.08 + 0.14 * (1 - u)) * (0.6 + 0.4 * Math.random());
    tmp.position.copy(v).addScaledVector(n, depth);
    n.x += (Math.random() - 0.5) * 0.7;
    n.y += (Math.random() - 0.5) * 0.7;
    tmp.quaternion.setFromUnitVectors(Z, n.normalize());
    tmp.quaternion.multiply(spin.setFromAxisAngle(Z, Math.random() * Math.PI * 2));
    tmp.scale.setScalar(0.16 + Math.random() * 0.07);
    tmp.updateMatrix();
    curls.setMatrixAt(i, tmp.matrix);
    curls.setColorAt(i, col.copy(dark).lerp(light, Math.random() ** 2));
    i++;
  }
  // Um cacho "espetado" no topo
  tmp.position.copy(deform(new THREE.Vector3(0.05, 1, 0.1).normalize())).multiplyScalar(1.2);
  tmp.quaternion.setFromUnitVectors(Z, new THREE.Vector3(0.15, 1, 0.25).normalize());
  tmp.scale.setScalar(0.17);
  tmp.updateMatrix();
  curls.setMatrixAt(COUNT + FRINGE, tmp.matrix);
  curls.setColorAt(COUNT + FRINGE, dark);
  group.add(curls);
  return group;
}

function buildFace(M, head) {
  // Nariz redondo
  head.add(mesh(new THREE.SphereGeometry(1, 32, 24), M.nose, {
    p: [0, -0.17, surfaceZ(0, -0.17) + 0.025], s: [0.15, 0.11, 0.12],
  }));

  // Sorriso em linha fina
  head.add(faceTube(
    [[-0.19, -0.43], [-0.09, -0.47], [0.03, -0.48], [0.14, -0.46], [0.22, -0.42]],
    0.01, M.mouth, { lift: 0.003, taper: (u) => 0.4 + 0.6 * Math.sin(Math.PI * u) ** 0.5 }
  ));

  // Sobrancelhas grossas, quase retas, pontas arredondadas
  const brows = [];
  for (const s of [-1, 1]) {
    const pts = [[0.13, 0.33], [0.24, 0.37], [0.4, 0.375], [0.52, 0.34]].map(([x, y]) => [s * x, y]);
    const brow = faceTube(pts, 0.058, M.brow, { lift: 0.04, taper: roundEnds });
    head.add(brow);
    brows.push(brow);
  }

  // Orelhas grandes e redondas
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * 0.9, -0.1, -0.04);
    ear.rotation.set(0, s * 0.45, -s * 0.12);
    ear.add(mesh(new THREE.SphereGeometry(1, 32, 24), M.skin, { s: [0.12, 0.25, 0.2] }));
    ear.add(mesh(new THREE.SphereGeometry(1, 24, 16), M.earInner, { p: [s * 0.05, 0, 0.02], s: [0.05, 0.15, 0.11] }));
    head.add(ear);
  }
  return { brows };
}

export function buildAvatar() {
  const M = makeMaterials();
  const root = new THREE.Group();
  const torso = new THREE.Group();
  root.add(torso);

  // Moletom (busto) — ombros arredondados
  const profile = new THREE.SplineCurve([
    [0.001, -0.25], [0.5, -0.28], [1.05, -0.42], [1.42, -0.66],
    [1.66, -1.05], [1.8, -1.7], [1.85, -2.8],
  ].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(60);
  profile.push(new THREE.Vector2(0.001, -2.8));
  const bodyGeo = new THREE.LatheGeometry(profile, 72);
  bodyGeo.scale(1, 1, 0.62);

  // Faixa lilás no peito: pintada por vértice (verde em cima, lilás embaixo)
  const green = new THREE.Color(COLORS.hoodie), lilac = new THREE.Color(COLORS.trim), c = new THREE.Color();
  const bp = bodyGeo.attributes.position;
  const colors = new Float32Array(bp.count * 3);
  for (let i = 0; i < bp.count; i++) {
    c.copy(green).lerp(lilac, THREE.MathUtils.smoothstep(-bp.getY(i), 1.3, 1.36));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  bodyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const bodyMat = M.hoodie.clone();
  bodyMat.color.set(0xffffff);
  bodyMat.sheenColor.set(0xffffff);
  bodyMat.vertexColors = true;
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  torso.add(body);

  // Gola do capuz: capuz verde atrás, forro lilás em volta do pescoço
  const hood = new THREE.Group();
  hood.position.set(0, -0.28, -0.1);
  hood.rotation.x = 0.32;
  hood.add(mesh(new THREE.TorusGeometry(0.56, 0.16, 20, 64), M.hoodie, { p: [0, 0.02, -0.08], r: [Math.PI / 2, 0, 0], s: [1.1, 0.85, 1] }));
  hood.add(mesh(new THREE.TorusGeometry(0.45, 0.1, 20, 64), M.trim, { p: [0, 0.08, 0.02], r: [Math.PI / 2, 0, 0], s: [1.1, 0.85, 1.2] }));
  torso.add(hood);

  // Cordões do capuz (encostados na frente do moletom)
  body.updateMatrixWorld();
  const ray = new THREE.Raycaster();
  const frontZ = (x, y) => {
    ray.set(new THREE.Vector3(x, y, 5), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(body)[0];
    return hit ? hit.point.z : 0.6;
  };
  for (const s of [-1, 1]) {
    const pts = [[0.2, -0.42], [0.17, -0.7], [0.2, -1.0], [0.17, -1.3]].map(([x, y]) =>
      new THREE.Vector3(s * x, y, frontZ(s * x, y) + 0.04));
    pts[0].z += 0.08;
    const curve = new THREE.CatmullRomCurve3(pts);
    torso.add(taperedTube(curve, 0.028, M.string));
    const end = pts[pts.length - 1];
    torso.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 16), M.trim, { p: [end.x, end.y - 0.04, end.z] }));
  }

  // Pescoço
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, -0.3, -0.05);
  torso.add(neckPivot);
  neckPivot.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.9, 32), M.skin, { p: [0, 0.35, 0] }));

  // Cabeça
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.55, 0);
  neckPivot.add(headPivot);
  const head = new THREE.Group();
  head.position.set(0, 0.8, 0.05);
  headPivot.add(head);
  head.add(new THREE.Mesh(headShell(), M.skin));

  const { brows } = buildFace(M, head);
  const eyes = [-1, 1].map((s) => buildEye(M, s));
  eyes.forEach((e) => head.add(e.group));
  head.add(buildHair(M));

  return { root, torso, neckPivot, headPivot, head, eyes, brows };
}
