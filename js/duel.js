import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { loadGlbAvatar } from './glbAvatar.js';
import { LOW, makeRenderer, frameGate } from './perf.js';

// Seção "Redes": dois avatares puxam por cordas os blocos do LinkedIn e do TikTok.
// Tudo é guiado por p (0→1) = quanto da seção já foi rolado.
const TIKTOK_SVG = 'https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/tiktok.svg';

const ease = (x) => x * x * (3 - 2 * x);
const range = (a, b, x) => THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
const smooth = (a, b, x) => ease(range(a, b, x));
const lerp = THREE.MathUtils.lerp;

// Fases da rolagem
const P = {
  walk: [0.0, 0.45],    // avatares entram puxando os blocos
  turn: [0.4, 0.52],    // viram de frente para a câmera
  stats: [0.48, 0.68],  // números sobem
  verdict: [0.7, 0.82], // TikTok comemora, balão aparece
};

// Face frontal de cada bloco: textura desenhada num canvas
function faceTexture(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  Promise.resolve(draw(ctx, c)).then(() => { tex.needsUpdate = true; });
  return tex;
}

function linkedinFace(ctx) {
  ctx.fillStyle = '#0a66c2';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#fff';
  ctx.font = '800 300px Archivo, "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('in', 256, 275);
}

async function tiktokFace(ctx) {
  ctx.fillStyle = '#0b0d14';
  ctx.fillRect(0, 0, 512, 512);
  try {
    const svg = await (await fetch(TIKTOK_SVG)).text();
    // Mesma nota em ciano, rosa e branco, levemente deslocadas (como o logo)
    for (const [color, dx, dy] of [['#25f4ee', -12, -8], ['#fe2c55', 12, 8], ['#ffffff', 0, 0]]) {
      const url = URL.createObjectURL(new Blob([svg.replace('<svg ', `<svg fill="${color}" `)], { type: 'image/svg+xml' }));
      const img = new Image();
      await new Promise((ok, fail) => { img.onload = ok; img.onerror = fail; img.src = url; });
      ctx.drawImage(img, 116 + dx, 106 + dy, 280, 280);
      URL.revokeObjectURL(url);
    }
  } catch {
    ctx.fillStyle = '#fff';
    ctx.font = '800 260px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', 256, 270);
  }
}

function makeBlock(color, faceDraw) {
  const S = 2.3;
  const body = new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const block = new THREE.Mesh(new RoundedBoxGeometry(S, S, S, 6, 0.28), body);
  block.castShadow = true;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(S * 0.86, S * 0.86),
    new THREE.MeshPhysicalMaterial({ map: faceTexture(faceDraw), roughness: 0.4, clearcoat: 0.5 }),
  );
  face.position.z = S / 2 + 0.002;
  block.add(face);
  const g = new THREE.Group();
  block.position.y = S / 2;
  g.add(block);
  g.userData = { block, size: S };
  return g;
}

// Corda com barriga (catenária aproximada); só é refeita quando as pontas ou a folga mudam
function makeRope() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xdfe7f5, roughness: 0.7 });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  mesh.castShadow = true;
  const pts = Array.from({ length: 10 }, () => new THREE.Vector3());
  let key = '';
  return {
    mesh,
    update(a, b, sag) {
      const k = `${a.x.toFixed(3)},${a.y.toFixed(3)},${b.x.toFixed(3)},${sag.toFixed(3)}`;
      if (k === key) return;
      key = k;
      for (let i = 0; i < pts.length; i++) {
        const t = i / (pts.length - 1);
        pts[i].lerpVectors(a, b, t);
        pts[i].y -= Math.sin(Math.PI * t) * sag;
      }
      mesh.geometry.dispose();
      mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), LOW ? 16 : 24, 0.035, 6, false);
    },
  };
}

function floorGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(160,200,255,0.55)');
  g.addColorStop(1, 'rgba(90,168,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 9),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.01;
  return m;
}

export async function initDuel(section) {
  const canvas = section.querySelector('#duel');
  const sticky = section.querySelector('.duel-sticky');
  const renderer = makeRenderer(canvas, { shadows: true });
  const gate = frameGate();

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 8, bottom: -4 });
  const rim = new THREE.DirectionalLight(0x6fb0ff, 1.6);
  rim.position.set(-6, 5, -6);
  scene.add(key, rim, new THREE.HemisphereLight(0xeaf2ff, 0x0b1a3a, 0.5));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.ShadowMaterial({ opacity: 0.4 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor, floorGlow());

  // Dois lados: LinkedIn (vem da esquerda) e TikTok (vem da direita)
  const sides = [];
  for (const [side, color, face] of [[-1, 0x0a66c2, linkedinFace], [1, 0x14161f, tiktokFace]]) {
    const holder = new THREE.Group();     // posição + direção do avatar
    const rig = await loadGlbAvatar();
    rig.root.scale.setScalar(0.55);       // modelo tem 4 de altura → 2,2
    rig.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    holder.add(rig.root);
    const block = makeBlock(color, face);
    const rope = makeRope();
    scene.add(holder, block, rope.mesh);
    sides.push({ side, holder, rig, block, rope, cur: { torso: 0, neckX: 0, neckY: 0, headX: 0, headY: 0, roll: 0 } });
  }

  const stats = [...section.querySelectorAll('.duel-stat')];
  const counters = [...section.querySelectorAll('[data-count]')];
  const fmt = new Intl.NumberFormat('pt-BR');

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(sticky);

  const a = new THREE.Vector3(), b = new THREE.Vector3(), v = new THREE.Vector3();
  const toScreen = (vec) => { v.copy(vec).project(camera); return [(v.x + 1) / 2 * 100, (1 - v.y) / 2 * 100]; };
  const clock = new THREE.Clock();
  const damp = (x, y, k, dt) => x + (y - x) * (1 - Math.exp(-k * dt));

  function tick() {
    requestAnimationFrame(tick);
    if (!visible || !gate()) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    const r = section.getBoundingClientRect();
    const p = THREE.MathUtils.clamp(-r.top / (r.height - window.innerHeight), 0, 1);

    // Layout: em telas estreitas (celular em pé) a cena fica mais compacta,
    // e a câmera se afasta o suficiente para os dois blocos caberem inteiros
    const narrow = camera.aspect < 1;
    const END = narrow ? 0.95 : 1.35, OFF = narrow ? 2.15 : 2.55;
    const tanH = Math.tan(THREE.MathUtils.degToRad(15));
    const dist = Math.max(17, (END + OFF + 1.45) / (tanH * camera.aspect));
    const zoomIn = smooth(...P.stats, p) * dist * 0.08;
    camera.position.set(0, 1.6 + 1.6 * dist / 17, dist - zoomIn);
    camera.lookAt(0, 1.6, 0);

    const walk = smooth(...P.walk, p);
    const turn = smooth(...P.turn, p);
    const verdict = smooth(...P.verdict, p);
    const halfW = tanH * dist * camera.aspect;

    for (const s of sides) {
      const { side, holder, rig, block, rope, cur } = s;
      const start = side * (halfW + 2.5), end = side * END;
      const x = lerp(start, end, walk);
      const walking = walk > 0 && walk < 1;
      const stride = (x - start) * 2.6;

      // Andando de lado puxando a corda; no fim, vira para a câmera
      holder.position.set(x, walking ? Math.abs(Math.sin(stride)) * 0.12 : 0, 0.6);
      holder.rotation.y = lerp(-side * Math.PI / 2, 0, turn);
      rig.root.rotation.x = walking ? 0.22 : lerp(0.22, 0, turn);   // inclinado para frente fazendo força
      rig.root.rotation.z = walking ? Math.sin(stride) * 0.06 : 0;

      // Bloco vem atrás, arrastado pela corda (balança um pouco ao ser puxado)
      const bx = x + side * OFF;
      block.position.set(bx, 0, -0.3);
      block.userData.block.rotation.z = walking ? Math.sin(stride * 0.5) * 0.03 : 0;
      block.userData.block.rotation.y = side * 0.18;

      // Corda: da cintura (atrás do avatar) até a lateral do bloco
      a.set(0, 1.15, -0.22);
      holder.localToWorld(a);
      b.set(bx - side * block.userData.size * 0.5, 1.05, -0.3);
      rope.update(a, b, walking ? 0.05 : lerp(0.05, 0.3, turn));

      // Veredito: o do TikTok comemora pulando; o do LinkedIn abaixa a cabeça
      let pitch = Math.sin(t * 0.8 + side) * 0.04, yaw = Math.sin(t * 0.6 + side) * 0.08;
      if (verdict > 0) {
        if (side > 0) {
          holder.position.y = Math.abs(Math.sin(t * 6)) * 0.45 * verdict;
          pitch = -0.25 * verdict;
        } else {
          pitch = 0.35 * verdict;
          yaw = 0.5 * verdict;
        }
      }
      cur.headY = damp(cur.headY, yaw, 5, dt);
      cur.headX = damp(cur.headX, pitch, 5, dt);
      rig.update(cur, t);
    }

    // Camada HTML: título, números (posicionados sob cada bloco), telas de destaque e veredito
    section.style.setProperty('--head-in', smooth(0, 0.08, p).toFixed(3));
    const statIn = smooth(...P.stats, p);
    stats.forEach((el, i) => {
      // No celular os números ficam fixos em cada metade (não se sobrepõem)
      const x = narrow ? (i ? 75 : 25) : toScreen(b.set(sides[i].block.position.x, 0, 0))[0];
      el.style.setProperty('--x', `${x}%`);
      el.style.setProperty('--stat-in', statIn.toFixed(3));
    });
    counters.forEach((el) => { el.textContent = fmt.format(Math.round(Number(el.dataset.count) * ease(statIn))); });
    section.style.setProperty('--verdict-in', verdict.toFixed(3));

    renderer.render(scene, camera);
  }
  tick();
}
