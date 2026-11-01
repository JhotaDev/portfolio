import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { customizeBoneco } from './boneco.js';

// Valores ajustados para o modelo "BONECO" (models/avatar.glb)
export const MODEL_CONFIG = {
  url: 'models/avatar.glb',
  height: 4,        // altura normalizada do modelo na cena
  neck: 0.73,       // altura do pescoço (0 = pés, 1 = topo da cabeça) — tudo acima disso gira com o mouse
  blend: 0.012,     // suavidade da "dobra" no pescoço (fração da altura)
  showFrom: 0.5,    // parte mais baixa visível (0.5 ≈ da cintura para cima; 0 = corpo inteiro)
  headroom: 0.12,   // espaço acima da cabeça (para o cabelo)
  rotationY: 0,     // gire se o modelo vier de lado ou de costas (ex.: Math.PI)
  customize: customizeBoneco, // cores, cabelo e boca específicos deste modelo
};

// Injeta no shader uma rotação da cabeça em torno do pescoço — funciona em malhas sem rig
function patchMaterial(mat, uniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
uniform mat3 uHeadRot;
uniform vec3 uPivot;
uniform float uNeckY;
uniform float uBlend;
float headWeight(vec3 p) { return smoothstep(uNeckY - uBlend, uNeckY + uBlend, p.y); }`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
objectNormal = normalize(mix(objectNormal, uHeadRot * objectNormal, headWeight(position)));`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
transformed = mix(transformed, uPivot + uHeadRot * (transformed - uPivot), headWeight(position));`);
  };
  mat.needsUpdate = true;
}

// O mesmo arquivo é usado por várias cenas: baixa e decodifica uma vez só.
// Cada avatar clona as geometrias e cria materiais próprios, então compartilhar o glTF é seguro.
const gltfCache = new Map();
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/libs/draco/gltf/');
loader.setDRACOLoader(draco);
function loadGltf(url) {
  if (!gltfCache.has(url)) gltfCache.set(url, loader.loadAsync(url));
  return gltfCache.get(url);
}

export async function loadGlbAvatar(cfg = MODEL_CONFIG) {
  const gltf = await loadGltf(cfg.url);

  // Junta todas as malhas num mesmo espaço (pés em y = 0, centralizado, altura = cfg.height)
  gltf.scene.updateMatrixWorld(true);
  const meshes = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld).rotateY(cfg.rotationY);
    meshes.push(new THREE.Mesh(geo, o.material));
  });
  const box = new THREE.Box3();
  meshes.forEach((m) => { m.geometry.computeBoundingBox(); box.union(m.geometry.boundingBox); });
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = cfg.height / size.y;
  meshes.forEach((m) => m.geometry.translate(-center.x, -box.min.y, -center.z).scale(s, s, s));

  // Pivô do pescoço: média dos vértices na altura do pescoço
  const H = cfg.height, neckY = cfg.neck * H;
  const pivot = new THREE.Vector3(0, neckY, 0);
  let n = 0;
  for (const m of meshes) {
    const p = m.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(p.getY(i) - neckY) < 0.015 * H) { pivot.x += p.getX(i); pivot.z += p.getZ(i); n++; }
    }
  }
  if (n) { pivot.x /= n; pivot.z /= n; }

  // Objetos extras presos à cabeça (cabelo, boca...) giram junto com ela, em torno do pescoço
  const headGroup = new THREE.Group();
  headGroup.position.copy(pivot);
  const addToHead = (obj) => {
    const holder = new THREE.Group();
    holder.position.copy(pivot).negate();
    holder.add(obj);
    headGroup.add(holder);
  };
  // Objetos presos ao corpo (roupas) ficam parados quando a cabeça gira
  const bodyGroup = new THREE.Group();
  const addToBody = (obj) => bodyGroup.add(obj);
  await cfg.customize?.({ meshes, H, addToHead, addToBody, loader });

  const uniforms = {
    uHeadRot: { value: new THREE.Matrix3() },
    uPivot: { value: pivot },
    uNeckY: { value: neckY },
    uBlend: { value: cfg.blend * H },
  };
  const patched = new Set();
  const model = new THREE.Group();
  for (const m of meshes) {
    for (const mat of [m.material].flat()) {
      if (!patched.has(mat)) { patchMaterial(mat, uniforms); patched.add(mat); }
    }
    m.frustumCulled = false;
    model.add(m);
  }
  model.add(headGroup, bodyGroup);
  const root = new THREE.Group();
  root.add(model);

  const headCenter = new THREE.Vector3(pivot.x, neckY + (H - neckY) * 0.5, pivot.z);
  headGroup.updateMatrixWorld(true);
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const m4 = new THREE.Matrix4();

  return {
    root,
    headWorld: (out) => model.localToWorld(out.copy(headCenter)),
    frame(aspect, fov) {
      const bottom = cfg.showFrom * H, top = H * (1 + (cfg.headroom ?? 0.03));
      const half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
      const fitH = ((top - bottom) / 2) / half * 1.05;
      const fitW = (size.x * s / 2) / (half * aspect) * 1.15;
      const lookY = (top + bottom) / 2;
      return { camY: lookY + 0.1, lookY, dist: Math.max(fitH, fitW) + pivot.z };
    },
    // Close-up de cabeça e ombros (seção "Sobre")
    close(aspect, fov) {
      const half = Math.tan(THREE.MathUtils.degToRad(fov / 2));
      // Margem suficiente para o cabelo não ser cortado no topo
      const span = (H - neckY) * 2.9;
      const lookY = neckY + (H - neckY) * 0.45;
      return { camY: lookY + 0.15, lookY, dist: (span / 2) / half + pivot.z };
    },
    update(cur, t) {
      euler.set(cur.neckX + cur.headX, cur.neckY + cur.headY, cur.roll);
      uniforms.uHeadRot.value.setFromMatrix4(m4.makeRotationFromEuler(euler));
      headGroup.quaternion.setFromEuler(euler);
      model.rotation.y = cur.torso;
      model.scale.y = 1 + Math.sin(t * 1.7) * 0.004;
    },
  };
}
