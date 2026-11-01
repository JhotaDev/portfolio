import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildAvatar, surfaceZ } from './avatar.js';
import { loadGlbAvatar } from './glbAvatar.js';
import { initDesk } from './desk.js';
import { initDuel } from './duel.js';
import { makeRenderer, frameGate } from './perf.js';
import { I18N } from './i18n.js';

/* ---------- Cena ---------- */
const canvas = document.getElementById('avatar');
const renderer = makeRenderer(canvas);
renderer.toneMappingExposure = 1.05;
const gate = frameGate();

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const lookAt = new THREE.Vector3();

const key = new THREE.DirectionalLight(0xfff1e6, 2.4);
key.position.set(3, 4, 6);
const fill = new THREE.DirectionalLight(0xcfe0ff, 0.7);
fill.position.set(-5, 1, 3);
const rimL = new THREE.DirectionalLight(0x6fb0ff, 1.4);
rimL.position.set(-4, 3, -4);
const rimR = new THREE.DirectionalLight(0xffffff, 1.2);
rimR.position.set(4, 3, -3);
scene.add(key, fill, rimL, rimR, new THREE.HemisphereLight(0xeaf2ff, 0x0b1a3a, 0.55));

// Boneco feito em código — usado enquanto não existir models/avatar.glb
function proceduralRig() {
  const avatar = buildAvatar();
  return {
    root: avatar.root,
    headWorld: (out) => avatar.head.getWorldPosition(out),
    frame(aspect) {
      // Em telas estreitas afasta a câmera para mostrar o busto inteiro
      const portrait = aspect < 0.9;
      return {
        camY: portrait ? 0.45 : 0.75,
        lookY: portrait ? 0.2 : 0.57,
        dist: portrait ? 10.8 + (1 - aspect) * 9 : 10.8,
      };
    },
    close() {
      return { camY: 1.25, lookY: 1.05, dist: 6.5 };
    },
    update(cur, t, dt, blink) {
      const breath = Math.sin(t * 1.7);
      avatar.torso.rotation.y = cur.torso;
      avatar.torso.position.y = breath * 0.012;
      avatar.neckPivot.rotation.set(cur.neckX, cur.neckY, 0);
      avatar.headPivot.rotation.set(cur.headX + breath * 0.008, cur.headY, cur.roll);
      for (const eye of avatar.eyes) {
        // Olhos ovais deslizam sobre o rosto na direção do cursor
        const x = eye.base.x + cur.eyeY * 0.07;
        const y = eye.base.y - cur.eyeX * 0.06;
        eye.group.position.set(x, y, surfaceZ(x, y) - 0.015);
        eye.group.rotation.set(-y * 0.4, x * 0.6, 0);
        eye.group.scale.y = 1 - 0.9 * blink;
      }
      // Sobrancelhas sobem levemente ao olhar para cima
      const browLift = clamp(-cur.headX, 0, 0.5) * 0.1;
      for (const b of avatar.brows) b.position.y = damp(b.position.y, browLift, 6, dt);
    },
  };
}

let rig = null;

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* ---------- Coreografia da rolagem: hero → "Sobre" → mesa ---------- */
// zoom 0 = hero (busto centralizado), 1 = close no rosto com o avatar à esquerda
// trans 0→1 = o avatar gira, encolhe e "voa" até a mesa de "O que eu faço"
const about = document.getElementById('sobre');
const deskStage = document.querySelector('.desk-stage'); // cena da mesa ("O que eu faço")
const ease = (x) => x * x * (3 - 2 * x);
const smooth = (a, b, x) => ease(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1));
let zoom = 0, fade = 0, trans = 0;

// Progresso da transição (mesma fórmula usada em desk.js)
function deskTransition() {
  const top = deskStage.getBoundingClientRect().top;
  return THREE.MathUtils.clamp(1 - (top - window.innerHeight * 0.12) / (window.innerHeight * 0.95), 0, 1);
}

function scrollState() {
  const vh = window.innerHeight;
  const y = window.scrollY;
  trans = deskTransition();
  const zTarget = ease(THREE.MathUtils.clamp(y / about.offsetTop, 0, 1));
  // O avatar do topo some antes do da mesa aparecer (nunca os dois ao mesmo tempo)
  fade = smooth(0.15, 0.42, trans);
  document.documentElement.style.setProperty('--hero-out', THREE.MathUtils.clamp(y / (vh * 0.45), 0, 1).toFixed(3));
  canvas.style.setProperty('--avatar-opacity', (1 - fade).toFixed(3));
  return zTarget;
}

function placeCamera(z) {
  const a = rig.frame(camera.aspect, camera.fov);
  const b = rig.close(camera.aspect, camera.fov);
  const lerp = THREE.MathUtils.lerp;
  camera.position.set(0, lerp(a.camY, b.camY, z), lerp(a.dist, b.dist, z));
  lookAt.set(0, lerp(a.lookY, b.lookY, z), 0);
  camera.lookAt(lookAt);
  // Desloca a imagem para a esquerda no "Sobre" (em telas largas)
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const shift = camera.aspect > 0.9 ? w * 0.24 * z : 0;
  if (shift > 0.5) camera.setViewOffset(w, h, shift, 0, w, h);
  else camera.clearViewOffset();
}

/* ---------- Seguir o mouse ---------- */
const pointer = new THREE.Vector2();
let lastMove = -Infinity;
let pointerInside = false;

function onPointer(x, y) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
  lastMove = clock.elapsedTime; // mesmo relógio da animação
  pointerInside = true;
}
window.addEventListener('pointermove', (e) => onPointer(e.clientX, e.clientY));
window.addEventListener('touchmove', (e) => onPointer(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
document.documentElement.addEventListener('pointerleave', () => { pointerInside = false; });

const raycaster = new THREE.Raycaster();
const gazePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -4); // plano 4 unidades à frente do rosto
const target = new THREE.Vector3();
const headPos = new THREE.Vector3();

const look = { yaw: 0, pitch: 0 };       // alvo
const cur = {                            // valores suavizados
  torso: 0, neckY: 0, neckX: 0, headY: 0, headX: 0, roll: 0, eyeY: 0, eyeX: 0,
};
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const clamp = THREE.MathUtils.clamp;

function updateTarget(t) {
  const idle = !pointerInside || t - lastMove > 6;
  if (idle) {
    // Olhar "vivo" quando o mouse está parado
    look.yaw = Math.sin(t * 0.35) * 0.22 + Math.sin(t * 0.83) * 0.06;
    look.pitch = Math.sin(t * 0.5 + 1) * 0.06 - 0.02;
    return;
  }
  rig.headWorld(headPos);
  // Plano mais perto do rosto = ângulos maiores (giro mais visível)
  gazePlane.constant = -(headPos.z + 2.2);
  raycaster.setFromCamera(pointer, camera);
  if (!raycaster.ray.intersectPlane(gazePlane, target)) return;
  const d = target.sub(headPos);
  look.yaw = clamp(Math.atan2(d.x, d.z), -1.0, 1.0);
  look.pitch = clamp(Math.atan2(-d.y, Math.hypot(d.x, d.z)), -0.6, 0.55);
}

/* ---------- Piscar ---------- */
let nextBlink = 1.5, blinkStart = -1;
const BLINK = 0.17;
function blinkAmount(t) {
  if (blinkStart < 0 && t > nextBlink) {
    blinkStart = t;
    nextBlink = t + 2 + Math.random() * 3.5;
    if (Math.random() < 0.18) nextBlink = t + 0.28; // piscada dupla
  }
  if (blinkStart < 0) return 0;
  const p = (t - blinkStart) / BLINK;
  if (p >= 1) { blinkStart = -1; return 0; }
  return Math.sin(Math.PI * p);
}

/* ---------- Loop ---------- */
const clock = new THREE.Clock();
let intro = 0;

function tick() {
  // Modo leve (celular): ~30 fps
  if (!gate()) { requestAnimationFrame(tick); return; }
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  zoom = damp(zoom, scrollState(), 8, dt);
  placeCamera(zoom);

  updateTarget(t);

  cur.torso = damp(cur.torso, look.yaw * 0.18, 2.5, dt);
  cur.neckY = damp(cur.neckY, look.yaw * 0.35, 4, dt);
  cur.neckX = damp(cur.neckX, look.pitch * 0.35, 4, dt);
  cur.headY = damp(cur.headY, look.yaw * 0.6, 6, dt);
  cur.headX = damp(cur.headX, look.pitch * 0.75, 6, dt);
  cur.roll = damp(cur.roll, -look.yaw * 0.1 + (cur.headY - look.yaw * 0.58) * 0.25, 5, dt);
  cur.eyeY = damp(cur.eyeY, look.yaw * 0.42, 16, dt);
  cur.eyeX = damp(cur.eyeX, look.pitch * 0.35, 16, dt);

  rig.update(cur, t, dt, blinkAmount(t));

  intro = damp(intro, 1, 2.2, dt);
  // Ao sair do "Sobre", ele abaixa como quem vai sentar enquanto some
  rig.root.position.y = (1 - intro) * -0.8 - smooth(0.05, 0.42, trans) * 0.9;

  // Só renderiza enquanto o avatar estiver visível (hero e "Sobre")
  if (fade < 1) renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// Usa models/avatar.glb se existir; senão, o boneco feito em código
loadGlbAvatar()
  .catch((err) => {
    console.info('models/avatar.glb não carregado, usando o boneco padrão.', err?.message ?? err);
    return proceduralRig();
  })
  .then((r) => {
    rig = r;
    rig.root.position.y = -0.8;
    scene.add(rig.root);
    resize();
    document.body.classList.add('ready');
    clock.start();
    tick();
  });

// Segunda cena: avatar trabalhando na mesa ("O que eu faço")
initDesk(document.getElementById('desk')).catch((err) => console.info('Cena da mesa indisponível:', err?.message ?? err));

// Terceira cena: LinkedIn × TikTok puxados por cordas ("Redes")
initDuel(document.getElementById('redes')).catch((err) => console.info('Cena das redes indisponível:', err?.message ?? err));

/* ---------- Idioma (traduções em js/i18n.js) ---------- */
function applyLang(lang) {
  if (!I18N[lang]) lang = 'pt';
  document.documentElement.lang = { pt: 'pt-BR', en: 'en', es: 'es' }[lang];
  const t = I18N[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => { if (t[el.dataset.i18n] != null) el.textContent = t[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => { if (t[el.dataset.i18nHtml] != null) el.innerHTML = t[el.dataset.i18nHtml]; });
  // Avisa sections.js para refazer o texto do 'Sobre mim' palavra por palavra
  window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  document.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
  try { localStorage.setItem('lang', lang); } catch {}
}

// Troca com cortina: sobe cobrindo a tela com a sigla, troca os textos e sai por cima
const curtain = document.querySelector('.lang-curtain');
let switching = false;
function setLang(lang) {
  if (switching || document.documentElement.lang.startsWith(lang)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return applyLang(lang);
  switching = true;
  curtain.querySelector('span').textContent = lang.toUpperCase();
  curtain.classList.remove('leave');
  void curtain.offsetWidth;
  curtain.classList.add('enter');
  setTimeout(() => {
    applyLang(lang);
    curtain.classList.replace('enter', 'leave');
    setTimeout(() => { curtain.classList.remove('leave'); switching = false; }, 600);
  }, 850);
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
try { applyLang(localStorage.getItem('lang') || 'pt'); } catch { applyLang('pt'); }

/* ---------- Tema ---------- */
const themeBtn = document.querySelector('.theme-toggle');
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('theme', theme); } catch {}
}
themeBtn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
try { setTheme(localStorage.getItem('theme') || 'dark'); } catch { setTheme('dark'); }
