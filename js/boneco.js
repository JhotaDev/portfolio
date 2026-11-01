import * as THREE from 'three';
import { taperedTube } from './avatar.js';
import { LOW } from './perf.js';

// Personaliza o modelo "BONECO" (DAPENHA, CC BY 4.0) — models/avatar.glb
// As malhas vêm sem cor; aqui cada parte recebe material/cor por região,
// o tronco e os braços viram um moletom e a cabeça ganha cabelo cacheado.
const C = {
  skin: 0x8a5637,
  hoodie: 0x2a6fdb,
  rib: 0x2058b3,      // punhos, barra e bolso (canelado)
  lining: 0xe9eef7,   // forro do capuz
  string: 0xf1f1ec,
  aglet: 0x1d2320,
  shorts: 0x1f2328,
  belt: 0x111315,
  boots: 0xe9e9e4,
  brow: 0x120e0c,
  eye: 0x0b0a0d,
  hair: 0x100c0a,
  hairLight: 0x2a1f19,
};

const skinMat = (extra = {}) => new THREE.MeshPhysicalMaterial({
  color: C.skin, roughness: 0.58, sheen: 0.4, sheenColor: 0xffb48c, sheenRoughness: 0.5,
  clearcoat: 0.06, clearcoatRoughness: 0.6, ...extra,
});
const fabric = (color) => new THREE.MeshPhysicalMaterial({
  color, roughness: 0.85, sheen: 0.3, sheenRoughness: 0.6, sheenColor: 0x9fc4ff,
});

// Pinta uma malha por vértice: colorOf(x, yf, z) devolve a cor de cada vértice
function paint(mesh, H, colorOf, material) {
  const pos = mesh.geometry.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    col.set(colorOf(pos.getX(i), pos.getY(i) / H, pos.getZ(i)));
    colors.set([col.r, col.g, col.b], i * 3);
  }
  mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  material.color.set(0xffffff);
  material.vertexColors = true;
  mesh.material = material;
}

// "Infla" vértices ao longo da normal (dá volume de tecido); amount(x, yf) em unidades da cena
function inflate(mesh, H, amount) {
  const pos = mesh.geometry.attributes.position, nor = mesh.geometry.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    const a = amount(pos.getX(i), pos.getY(i) / H);
    if (!a) continue;
    pos.setXYZ(i, pos.getX(i) + nor.getX(i) * a, pos.getY(i) + nor.getY(i) * a, pos.getZ(i) + nor.getZ(i) * a);
  }
  pos.needsUpdate = true;
  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
}

export function customizeBoneco({ meshes, H, addToHead, addToBody }) {
  // Ordem das malhas no arquivo
  const [features, boots, hemFront, eyes, hemBack, body, shorts, headArms] = meshes;
  const w = (x) => x / H; // largura relativa à altura
  const NECK = 0.735;     // abaixo disso, a malha cabeça+braços vira manga do moletom

  eyes.material = new THREE.MeshPhysicalMaterial({ color: C.eye, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 });
  boots.material = new THREE.MeshPhysicalMaterial({ color: C.boots, roughness: 0.6 });
  for (const m of [hemFront, hemBack, shorts]) m.material = fabric(C.shorts);
  paint(features, H, (x, yf) => {
    if (yf < 0.6) return C.belt;
    if (yf > 0.912) return C.brow;
    return C.skin;
  }, skinMat());

  // Medidas: pulso (ponta mais baixa do braço), ombros, pescoço e tronco
  const p = new THREE.Vector3();
  const hp = headArms.geometry.attributes.position, bp = body.geometry.attributes.position;
  let wristY = Infinity, shoulderY = 0;
  const neck = new THREE.Vector3(); let nNeck = 0, neckR = 0;
  const headBox = new THREE.Box3(), torso = new THREE.Box3();
  for (let i = 0; i < hp.count; i++) {
    p.fromBufferAttribute(hp, i);
    if (p.y < NECK * H) wristY = Math.min(wristY, p.y);
    if (p.y > 0.745 * H) headBox.expandByPoint(p);
    if (p.y > 0.725 * H && p.y < 0.742 * H && Math.abs(p.x) < 0.1 * H) { neck.add(p); nNeck++; }
  }
  neck.divideScalar(nNeck || 1);
  for (let i = 0; i < hp.count; i++) {
    p.fromBufferAttribute(hp, i);
    if (p.y > 0.725 * H && p.y < 0.742 * H && Math.abs(p.x) < 0.1 * H) neckR = Math.max(neckR, Math.hypot(p.x - neck.x, p.z - neck.z));
  }
  for (let i = 0; i < bp.count; i++) {
    p.fromBufferAttribute(bp, i);
    if (p.y < 0.745 * H) shoulderY = Math.max(shoulderY, p.y);
    if (p.y > 0.5 * H && p.y < 0.73 * H && Math.abs(w(p.x)) <= 0.17) torso.expandByPoint(p);
  }

  // Moletom: tronco (antiga regata) + braços inteiros como mangas compridas
  const isTop = (x, yf) => yf >= 0.28 && Math.abs(w(x)) <= 0.17;
  paint(body, H, (x, yf) => (!isTop(x, yf) ? C.skin : yf < 0.535 ? C.rib : C.hoodie), fabric(C.hoodie));
  inflate(body, H, (x, yf) => (isTop(x, yf) ? 0.022 * H * THREE.MathUtils.smoothstep(yf, 0.5, 0.52) : 0));

  const cuffY = wristY / H + 0.035;
  paint(headArms, H, (x, yf) => (yf >= NECK ? C.skin : yf < cuffY ? C.rib : C.hoodie), skinMat({ roughness: 0.7 }));
  inflate(headArms, H, (x, yf) => (yf < NECK ? 0.016 * H * (1 - THREE.MathUtils.smoothstep(yf, NECK - 0.02, NECK)) : 0));

  addToBody(buildHood(neck, neckR, shoulderY, torso, body, H));
  addToBody(buildPocket(body, torso, H));
  addToHead(buildHair(headArms, headBox, H));
}

// Capuz caído atrás do pescoço, com forro claro e cordões
function buildHood(neck, neckR, shoulderY, torso, body, H) {
  const g = new THREE.Group();
  const R = Math.min(neckR * 1.45, (torso.max.x - torso.min.x) * 0.3), tube = R * 0.3;
  const outer = fabric(C.hoodie), lining = fabric(C.lining);

  const ring = new THREE.Group();
  ring.position.set(neck.x, shoulderY + tube * 0.2, neck.z - R * 0.12);
  ring.rotation.x = 0.28; // frente mais baixa que a nuca
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 24, 72), outer);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.scale.set(1.12, 1, 0.9);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(R * 0.86, tube * 0.55, 20, 72), lining);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = tube * 0.35;
  innerRing.scale.set(1.12, 1, 0.9);
  ring.add(outerRing, innerRing);

  // Volume do capuz deitado nas costas
  const back = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), outer);
  back.scale.set(R * 1.3, R * 1.0, R * 0.7);
  back.position.set(neck.x, shoulderY - R * 0.15, neck.z - R * 1.15);
  g.add(ring, back);

  // Cordões: descem pela frente seguindo o peito
  const ray = new THREE.Raycaster();
  const front = (x, y) => {
    ray.set(new THREE.Vector3(x, y, torso.max.z + H), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(body)[0];
    return hit ? hit.point.z : torso.max.z;
  };
  const strMat = new THREE.MeshStandardMaterial({ color: C.string, roughness: 0.6 });
  const agMat = new THREE.MeshStandardMaterial({ color: C.aglet, roughness: 0.35, metalness: 0.4 });
  for (const s of [-1, 1]) {
    const x0 = neck.x + s * R * 0.42;
    const pts = [0, 0.06, 0.12, 0.17].map((d, i) => {
      const y = shoulderY - d * H;
      const x = x0 + s * (i % 2 ? 0.006 : 0) * H;
      return new THREE.Vector3(x, y, (i === 0 ? neck.z + R * 0.95 : front(x, y)) + 0.012 * H);
    });
    g.add(taperedTube(new THREE.CatmullRomCurve3(pts), 0.0055 * H, strMat));
    const end = pts[pts.length - 1];
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.0065 * H, 0.0065 * H, 0.022 * H, 14), agMat);
    tip.position.set(end.x, end.y - 0.01 * H, end.z);
    g.add(tip);
  }
  return g;
}

// Bolso canguru: retalho que acompanha a barriga, um pouco mais escuro
function buildPocket(body, torso, H) {
  const yTop = 0.6 * H, yBot = 0.54 * H;
  const halfTop = (torso.max.x - torso.min.x) * 0.3, halfBot = (torso.max.x - torso.min.x) * 0.38;
  const geo = new THREE.PlaneGeometry(1, 1, 24, 12);
  const pos = geo.attributes.position;
  const ray = new THREE.Raycaster();
  const cx = (torso.min.x + torso.max.x) / 2;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5, v = pos.getY(i) + 0.5; // 0..1
    const y = yBot + v * (yTop - yBot);
    const half = halfBot + (halfTop - halfBot) * v;
    const x = cx + (u - 0.5) * 2 * half;
    ray.set(new THREE.Vector3(x, y, torso.max.z + H), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(body)[0];
    pos.setXYZ(i, x, y, (hit ? hit.point.z : torso.max.z) + 0.006 * H);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, fabric(C.rib));
}

// Cacho pequeno e bem enrolado (espiral apertada), eixo voltado para +z
function curlGeometry() {
  const pts = [];
  for (let i = 0; i <= 70; i++) {
    const t = i / 70;
    const a = t * 2.6 * Math.PI * 2;
    const r = 1 - 0.6 * t;
    pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.1 * t));
  }
  const taper = (u) => (1 - 0.4 * u) * Math.min(1, u * 10) ** 0.5 * Math.min(1, (1 - u) * 10) ** 0.6;
  return taperedTube(new THREE.CatmullRomCurve3(pts), 0.38, null, taper, 90, 8).geometry;
}

// Gerador pseudoaleatório determinístico (mulberry32)
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildHair(headMesh, headBox, H) {
  // Aleatório com semente fixa: o cabelo sai idêntico em todas as cenas (home, mesa, redes)
  const rand = seeded(20260411);
  const center = headBox.getCenter(new THREE.Vector3());
  const half = headBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const ray = new THREE.Raycaster();
  const surface = (dir) => {
    ray.set(center.clone().addScaledVector(dir, H), dir.clone().negate());
    return ray.intersectObject(headMesh)[0];
  };

  const THETA = 1.42, TILT = -0.65; // testa livre na frente, desce mais atrás
  // Menos cachos no modo leve (celular): carrega e desenha mais rápido
  const COUNT = LOW ? 190 : 340, FRINGE = LOW ? 28 : 46;
  // Fosco: sem clearcoat, só um sheen suave de fio
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.82, sheen: 0.35, sheenColor: 0x4a3a30, sheenRoughness: 0.7,
  });
  const curls = new THREE.InstancedMesh(curlGeometry(), mat, COUNT + FRINGE);
  const dark = new THREE.Color(C.hair), light = new THREE.Color(C.hairLight), col = new THREE.Color();
  const tmp = new THREE.Object3D();
  const Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), n = new THREE.Vector3(), spin = new THREE.Quaternion();
  const size = Math.min(half.x, half.y, half.z);
  const cosMax = Math.cos(THETA);

  let i = 0, tries = 0;
  while (i < COUNT + FRINGE && tries++ < 30000) {
    const fringe = i >= COUNT;
    const y = fringe ? Math.cos(THETA + TILT - 0.02 + rand() * 0.22) : cosMax + rand() * (1 - cosMax);
    const phi = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    const dir = new THREE.Vector3(r * Math.cos(phi), y, r * Math.sin(phi));
    if (!fringe) dir.applyAxisAngle(X, TILT);
    if (fringe && dir.z < 0.55) continue;
    const hit = surface(dir.multiply(half).normalize());
    if (!hit) continue;
    const local = hit.point.clone().sub(center);
    // Deixa as orelhas à mostra
    if (Math.abs(local.x) > half.x * 0.75 && local.y < half.y * 0.15 && local.z > -half.z * 0.4) continue;
    n.copy(hit.face.normal).normalize();
    const u = Math.acos(THREE.MathUtils.clamp(local.y / half.y, -1, 1)) / Math.PI;
    tmp.position.copy(hit.point).addScaledVector(n, size * (0.05 + 0.16 * (1 - u)) * (0.5 + 0.5 * rand()));
    n.x += (rand() - 0.5) * 0.8;
    n.y += (rand() - 0.5) * 0.8;
    tmp.quaternion.setFromUnitVectors(Z, n.normalize());
    tmp.quaternion.multiply(spin.setFromAxisAngle(Z, rand() * Math.PI * 2));
    tmp.scale.setScalar(size * (0.15 + rand() * 0.08));
    tmp.updateMatrix();
    curls.setMatrixAt(i, tmp.matrix);
    curls.setColorAt(i, col.copy(dark).lerp(light, rand() ** 2));
    i++;
  }
  curls.count = i;
  return curls;
}
