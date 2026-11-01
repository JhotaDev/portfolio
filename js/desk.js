import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadGlbAvatar } from './glbAvatar.js';
import { makeRenderer, frameGate } from './perf.js';

// Cena "O que eu faço": o avatar atrás de uma mesa, olhando o monitor (ou o cursor)
const ACCENT = 0x5aa8ff;

// Tela do monitor: linhas de "código" coloridas rolando, desenhadas num canvas
function makeScreen() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const colors = ['#5aa8ff', '#9cc8ff', '#e8f1ff', '#ffd479', '#7ee0ff'];
  const lines = Array.from({ length: 40 }, () => ({
    indent: Math.floor(Math.random() * 4),
    tokens: Array.from({ length: 1 + Math.floor(Math.random() * 4) }, () => ({
      w: 20 + Math.random() * 90, c: colors[Math.floor(Math.random() * colors.length)],
    })),
  }));
  let offset = 0;
  return {
    tex,
    draw(t) {
      ctx.fillStyle = '#071226';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#0d1d3a';
      ctx.fillRect(0, 0, c.width, 22);
      ['#ff6b6b', '#ffd479', '#5ee3a1'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(14 + i * 14, 11, 4, 0, 7); ctx.fill(); });
      offset = (t * 18) % (lines.length * 18);
      for (let i = 0; i < 18; i++) {
        const idx = (Math.floor(offset / 18) + i) % lines.length;
        const y = 34 + i * 18 - (offset % 18);
        ctx.fillStyle = '#2a3f66';
        ctx.fillRect(10, y, 14, 8);
        let x = 34 + lines[idx].indent * 22;
        for (const tk of lines[idx].tokens) {
          ctx.fillStyle = tk.c;
          ctx.globalAlpha = 0.9;
          ctx.fillRect(x, y, tk.w, 8);
          x += tk.w + 10;
        }
        ctx.globalAlpha = 1;
      }
      if (Math.floor(t * 2) % 2) { ctx.fillStyle = '#e8f1ff'; ctx.fillRect(34, c.height - 30, 9, 14); }
      tex.needsUpdate = true;
    },
  };
}

// Brilho redondo no chão (luz de spot)
function floorGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(220,235,255,0.85)');
  g.addColorStop(0.35, 'rgba(120,175,255,0.35)');
  g.addColorStop(1, 'rgba(90,168,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 7),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0.2, 0.01, 1);
  return mesh;
}

function buildDesk() {
  const g = new THREE.Group();
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf2f5fb, roughness: 0.35, clearcoat: 0.4 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a2236, roughness: 0.4, metalness: 0.6 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: 0.45 });
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    g.add(m);
    return m;
  };

  // Tampo, painel frontal (esconde as pernas) e pés
  const topY = 2.05;
  box(4.4, 0.12, 1.9, white, 0.2, topY, 1.35);
  box(4.1, 1.55, 0.06, white, 0.2, topY - 0.85, 2.22);
  for (const x of [-1.85, 2.25]) for (const z of [0.55, 2.15]) box(0.1, topY, 0.1, metal, x, topY / 2, z);

  // Monitor virado para o avatar
  const screen = makeScreen();
  const mon = new THREE.Group();
  mon.position.set(1.2, topY + 0.06, 1.55);
  mon.rotation.y = -2.55;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.04, 32), metal);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.06), metal);
  neck.position.y = 0.3;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.08, 0.07), black);
  frame.position.y = 0.95;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.64, 0.97), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }));
  panel.position.set(0, 0.95, 0.036);
  [base, neck, frame].forEach((m) => { m.castShadow = true; });
  mon.add(base, neck, frame, panel);
  // Luz azul da tela iluminando o rosto
  const glow = new THREE.PointLight(ACCENT, 6, 4, 1.6);
  glow.position.set(0, 0.95, 0.5);
  mon.add(glow);
  g.add(mon);

  // Teclado com teclas, mouse e caneca
  const kb = box(1.3, 0.05, 0.42, black, 0.05, topY + 0.085, 0.95);
  kb.rotation.y = -0.25;
  const keyGeo = new THREE.BoxGeometry(0.075, 0.025, 0.075);
  const keys = new THREE.InstancedMesh(keyGeo, new THREE.MeshStandardMaterial({ color: 0x26324d, roughness: 0.5 }), 14 * 4);
  const tmp = new THREE.Object3D();
  let k = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) {
    tmp.position.set(-0.56 + c * 0.086, 0.035, -0.14 + r * 0.092);
    tmp.updateMatrix();
    keys.setMatrixAt(k++, tmp.matrix);
  }
  kb.add(keys);
  const mouse = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.09, 6, 12), black);
  mouse.rotation.x = Math.PI / 2;
  mouse.scale.set(1, 1, 0.55);
  mouse.position.set(0.95, topY + 0.1, 0.95);
  g.add(mouse);
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.28, 32), new THREE.MeshPhysicalMaterial({ color: ACCENT, roughness: 0.3, clearcoat: 0.6 }));
  mug.position.set(-1.25, topY + 0.2, 1.25);
  mug.castShadow = true;
  g.add(mug);

  return { group: g, screen };
}

export async function initDesk(canvas) {
  const renderer = makeRenderer(canvas, { shadows: true });
  const gate = frameGate();

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  renderer.toneMappingExposure = 1.05;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const look = new THREE.Vector3(0.35, 2.05, 0.9);

  // Mesmas luzes da home (o avatar fica com a mesma cor/brilho nas duas cenas)
  const key = new THREE.DirectionalLight(0xfff1e6, 2.4);
  key.position.set(3, 4, 6);
  const rimR = new THREE.DirectionalLight(0xffffff, 1.2);
  rimR.position.set(4, 3, -3);
  scene.add(key, rimR);

  // Spot de cima (como um estúdio): marca o chão e a sombra, mais suave para não estourar o avatar
  const spot = new THREE.SpotLight(0xffffff, 70, 14, 0.55, 0.6, 1.5);
  spot.position.set(0.4, 8.5, 2.2);
  spot.target.position.set(0.2, 0, 1);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0005;
  scene.add(spot, spot.target);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.7);
  fill.position.set(-5, 1, 3);
  const rim = new THREE.DirectionalLight(0x6fb0ff, 1.4);
  rim.position.set(-4, 3, -4);
  scene.add(fill, rim, new THREE.HemisphereLight(0xeaf2ff, 0x0b1a3a, 0.55));

  const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.45 }));
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.receiveShadow = true;
  const glowFloor = floorGlow();
  scene.add(shadowFloor, glowFloor);

  const { group: desk, screen } = buildDesk();
  scene.add(desk);

  const SEAT_Y = 0;                    // altura final do boneco (de pé atrás da mesa)
  const rig = await loadGlbAvatar();
  rig.root.rotation.y = 0.35;          // corpo meio virado para o monitor
  rig.root.position.set(-0.15, SEAT_Y, -0.1);
  rig.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(rig.root);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Afasta a câmera em telas estreitas para caber mesa + avatar
    const dist = 11 / Math.min(1, camera.aspect * 1.05);
    const dir = new THREE.Vector3(-0.52, 0.36, 0.78).normalize();
    camera.position.copy(look).addScaledVector(dir, dist);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // Olhar: segue o cursor em qualquer lugar da tela; sem mouse, volta a olhar o monitor.
  // A posição é medida a partir da cabeça do boneco (≈36% / 30% do canvas), em frações da janela.
  const pointer = { x: 0, y: 0, inside: false };
  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - (r.left + r.width * 0.36)) / (window.innerWidth / 2);
    pointer.y = -(e.clientY - (r.top + r.height * 0.3)) / (window.innerHeight / 2);
    pointer.inside = true;
  });
  document.documentElement.addEventListener('pointerleave', () => { pointer.inside = false; });

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const cur = { torso: 0, neckX: 0, neckY: 0, headX: 0, headY: 0, roll: 0 };
  const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
  const ease = (x) => x * x * (3 - 2 * x);
  const smooth = (a, b, x) => ease(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));
  const clock = new THREE.Clock();
  let lastScreen = 0;

  function tick() {
    requestAnimationFrame(tick);
    if (!visible || !gate()) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // Montagem sincronizada com o voo do avatar (mesma fórmula de main.js):
    // a mesa sobe do chão e, quando o avatar voador chega, este cai sentado na cadeira
    const top = canvas.parentElement.getBoundingClientRect().top;
    const trans = THREE.MathUtils.clamp(1 - (top - window.innerHeight * 0.12) / (window.innerHeight * 0.95), 0, 1);
    // Mesa sobe do chão; depois o avatar (sempre em tamanho normal) desce até o lugar
    const d = smooth(0.1, 0.55, trans);
    desk.position.y = -(1 - d) * 2.6;
    glowFloor.material.opacity = d;
    const a = smooth(0.45, 0.8, trans);
    rig.root.visible = a > 0.01;
    rig.root.position.y = SEAT_Y + (1 - a) * 1.3;

    // Lendo a tela: pequenos movimentos de olhar + leve "digitação"
    let yaw = 0.62 + Math.sin(t * 0.9) * 0.06 + Math.sin(t * 2.3) * 0.02;
    let pitch = 0.22 + Math.sin(t * 1.3) * 0.03;
    if (pointer.inside) {
      yaw = THREE.MathUtils.clamp(pointer.x * 0.85 + 0.35, -0.6, 1.1);
      pitch = THREE.MathUtils.clamp(-pointer.y * 0.55 + 0.05, -0.45, 0.45);
    }
    yaw -= rig.root.rotation.y;
    cur.neckY = damp(cur.neckY, yaw * 0.35, 4, dt);
    cur.headY = damp(cur.headY, yaw * 0.65, 6, dt);
    cur.neckX = damp(cur.neckX, pitch * 0.3, 4, dt);
    cur.headX = damp(cur.headX, pitch * 0.7 + Math.abs(Math.sin(t * 7)) * 0.012, 6, dt);
    cur.roll = damp(cur.roll, -yaw * 0.06, 4, dt);
    rig.update(cur, t);

    if (t - lastScreen > 0.08) { screen.draw(t); lastScreen = t; }
    renderer.render(scene, camera);
  }
  tick();
}
