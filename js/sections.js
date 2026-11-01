import { I18N } from './i18n.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- E-mail: troque aqui e ele muda no topo, no Contato e no link "Email ↗" ---------- */
const CONTACT_EMAIL = 'joaomesquita204@gmail.com';
document.querySelectorAll('[data-email]').forEach((a) => {
  a.textContent = CONTACT_EMAIL;
  a.href = `mailto:${CONTACT_EMAIL}`;
});
document.querySelectorAll('[data-email-link]').forEach((a) => { a.href = `mailto:${CONTACT_EMAIL}`; });

/* ---------- Ícones de tecnologia (Devicon via CDN + alguns desenhados aqui) ---------- */
const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';
const svg = (body) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}</svg>`)}`;
const TECH = {
  python: ['Python', DEVICON + 'python/python-original.svg'],
  pandas: ['Pandas', DEVICON + 'pandas/pandas-original.svg'],
  numpy: ['NumPy', DEVICON + 'numpy/numpy-original.svg'],
  jupyter: ['Jupyter', DEVICON + 'jupyter/jupyter-original.svg'],
  sklearn: ['scikit-learn', DEVICON + 'scikitlearn/scikitlearn-original.svg'],
  matplotlib: ['Matplotlib', DEVICON + 'matplotlib/matplotlib-original.svg'],
  postgresql: ['PostgreSQL', DEVICON + 'postgresql/postgresql-original.svg'],
  mysql: ['MySQL', DEVICON + 'mysql/mysql-original.svg'],
  sqlite: ['SQLite', DEVICON + 'sqlite/sqlite-original.svg'],
  aws: ['AWS (S3, Glue, Athena)', DEVICON + 'amazonwebservices/amazonwebservices-original-wordmark.svg'],
  java: ['Java', DEVICON + 'java/java-original.svg'],
  c: ['C', DEVICON + 'c/c-original.svg'],
  cpp: ['C++', DEVICON + 'cplusplus/cplusplus-original.svg'],
  javascript: ['JavaScript', DEVICON + 'javascript/javascript-original.svg'],
  postman: ['Postman', DEVICON + 'postman/postman-original.svg'],
  android: ['Android', DEVICON + 'android/android-original.svg'],
  kotlin: ['Kotlin', DEVICON + 'kotlin/kotlin-original.svg'],
  firebase: ['Firebase', DEVICON + 'firebase/firebase-original.svg'],
  arduino: ['Arduino', DEVICON + 'arduino/arduino-original.svg'],
  html: ['HTML', DEVICON + 'html5/html5-original.svg'],
  css: ['CSS', DEVICON + 'css3/css3-original.svg'],
  gemini: ['Gemini API', svg('<defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#4f8df7\"/><stop offset=\"1\" stop-color=\"#a77bf3\"/></linearGradient></defs><path d=\"M16 2c.9 7.4 6.6 13.1 14 14-7.4.9-13.1 6.6-14 14-.9-7.4-6.6-13.1-14-14 7.4-.9 13.1-6.6 14-14z\" fill=\"url(#g)\"/>')],
  rfid: ['RFID', svg('<g fill=\"none\" stroke=\"#5aa8ff\" stroke-width=\"2.2\" stroke-linecap=\"round\"><rect x=\"5\" y=\"9\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M22 12a6 6 0 0 1 0 8M25 9a10 10 0 0 1 0 14\"/></g>')],
  ai: ['IA generativa', svg('<path d="M16 3l2.6 7.4L26 13l-7.4 2.6L16 23l-2.6-7.4L6 13l7.4-2.6z" fill="#5aa8ff"/><path d="M25 20l1.2 3.3 3.3 1.2-3.3 1.2L25 29l-1.2-3.3-3.3-1.2 3.3-1.2z" fill="#9cc8ff"/>')],
  gcloud: ['Google Cloud', DEVICON + 'googlecloud/googlecloud-original.svg'],
  airflow: ['Airflow', DEVICON + 'apacheairflow/apacheairflow-original.svg'],
  fastapi: ['FastAPI', DEVICON + 'fastapi/fastapi-original.svg'],
  docker: ['Docker', DEVICON + 'docker/docker-original.svg'],
  linux: ['Linux', DEVICON + 'linux/linux-original.svg'],
  git: ['Git', DEVICON + 'git/git-original.svg'],
  github: ['GitHub', DEVICON + 'github/github-original.svg'],
  vscode: ['VS Code', DEVICON + 'vscode/vscode-original.svg'],
  // Ícones genéricos desenhados aqui (sem logotipo oficial no Devicon)
  sql: ['SQL', svg('<g fill="none" stroke="#3b82f6" stroke-width="2.4"><ellipse cx="16" cy="7" rx="10" ry="4"/><path d="M6 7v18c0 2.2 4.5 4 10 4s10-1.8 10-4V7M6 16c0 2.2 4.5 4 10 4s10-1.8 10-4"/></g>')],
  powerbi: ['Power BI', svg('<g fill="#f2c811"><rect x="5" y="15" width="5" height="12" rx="1.5"/><rect x="13" y="9" width="5" height="18" rx="1.5"/><rect x="21" y="4" width="5" height="23" rx="1.5"/></g>')],
  vba: ['VBA', svg('<rect x="4" y="6" width="24" height="20" rx="3" fill="#1d7a45"/><text x="16" y="20.5" font-family="Arial" font-weight="700" font-size="9" fill="#fff" text-anchor="middle">VBA</text>')],
  powerautomate: ['Power Automate', svg('<path d="M4 8h12l6 8-6 8H4l6-8z" fill="#0066ff"/><path d="M14 8h10l4 8-4 8H14l6-8z" fill="#5aa8ff"/>')],
  excel: ['Excel', svg('<rect x="4" y="5" width="24" height="22" rx="3" fill="#1d7a45"/><path d="M11 11l10 10M21 11L11 21" stroke="#fff" stroke-width="3" stroke-linecap="round"/>')],
};

function renderTech(list, withBubble) {
  list.innerHTML = '';
  list.dataset.tech.split(/\s+/).forEach((key, i) => {
    const [label, src] = TECH[key] ?? [key, ''];
    const li = document.createElement('li');
    li.style.setProperty('--i', i);
    const img = `<img class="ticon" src="${src}" alt="" loading="lazy" />`;
    li.innerHTML = `${withBubble ? `<span class="tech-bubble">${img}</span>` : img}<span>${label}</span>`;
    list.append(li);
  });
}
document.querySelectorAll('.tech-grid').forEach((ul) => renderTech(ul, true));
document.querySelectorAll('.ptech').forEach((ul) => renderTech(ul, false));

/* ---------- Vídeos de capa dos projetos: tocam só quando visíveis ---------- */
const videoIO = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) e.target.play().catch(() => {});
    else e.target.pause();
  }
}, { threshold: 0.4 });
document.querySelectorAll('video[data-autoplay]').forEach((v) => videoIO.observe(v));

/* ---------- Revelar ao entrar na tela ---------- */
// Os cards de serviço começam recortados (área zero), então observamos a lista e marcamos os filhos
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      if (e.target.classList.contains('svc-list')) [...e.target.children].forEach((c) => c.classList.add('in'));
      io.unobserve(e.target);
    }
  }
}, { threshold: 0.2 });
document.querySelectorAll('.reveal, .svc-list, .tech-grid').forEach((el) => io.observe(el));

/* ---------- O que eu faço: acordeão (um aberto por vez) ---------- */
const cards = [...document.querySelectorAll('.svc')];
function openCard(card, open = true) {
  cards.forEach((c) => {
    c.classList.toggle('open', c === card && open);
    c.querySelector('.svc-head').setAttribute('aria-expanded', String(c === card && open));
  });
}
cards.forEach((card) => {
  // Mouse: abre ao passar por cima. Toque/teclado: abre e fecha no clique.
  card.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') openCard(card); });
  card.querySelector('.svc-head').addEventListener('click', () => openCard(card, !card.classList.contains('open')));
});

/* ---------- Sobre: palavras acendem conforme a rolagem ---------- */
const about = document.querySelector('.about');
const aboutText = document.querySelector('[data-words]');
// Garante o texto mesmo se main.js ainda não tiver aplicado o idioma
if (!aboutText.textContent.trim()) {
  let lang = 'pt';
  try { lang = localStorage.getItem('lang') || 'pt'; } catch {}
  aboutText.innerHTML = (I18N[lang] || I18N.pt)['about.text'];
}

// Texto vira uma <span class="word"> por palavra; elementos (ex.: selos de empresas) contam como uma palavra.
// É refeito a cada troca de idioma (evento 'langchange' disparado por main.js).
let words = [];
function splitWords() {
  const parts = [];
  for (const node of [...aboutText.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const w of node.textContent.split(/\s+/)) {
        if (!w) continue;
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = w;
        parts.push(span, ' ');
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add('word');
      parts.push(node, ' ');
    }
  }
  aboutText.replaceChildren(...parts);
  // Pontuação colada ao selo (ex.: "FIAP,") não deve ganhar espaço antes dela
  aboutText.innerHTML = aboutText.innerHTML.replace(/ (<span class="word">[.,;:])/g, '$1');
  words = [...aboutText.querySelectorAll('.word')];
}
splitWords();
window.addEventListener('langchange', () => { splitWords(); onScroll(); });

/* ---------- Carreira: linha cresce e o cargo do meio da tela acende ---------- */
const timeline = document.querySelector('.timeline');
const jobs = [...document.querySelectorAll('.job')];

/* ---------- Projetos: rolagem vertical vira movimento horizontal ---------- */
const projects = document.querySelector('.projects');
const track = document.querySelector('.projects-track');
const pcards = [...track.children];
const counter = document.querySelector('[data-counter]');
document.querySelector('[data-total]').textContent = String(pcards.length).padStart(2, '0');
let travel = 0;
function measureProjects() {
  travel = Math.max(0, track.scrollWidth - window.innerWidth);
  track.classList.toggle('fits', travel === 0);
  projects.classList.toggle('fits', travel === 0); // sem carrossel: esconde contador e barra
  projects.style.setProperty('--projects-h', `${window.innerHeight + travel}px`);
}

/* ---------- Menu: link da seção atual ---------- */
const navLinks = [...document.querySelectorAll('.nav a')];
const navTargets = navLinks.map((a) => document.querySelector(a.getAttribute('href')));

function onScroll() {
  const vh = window.innerHeight;
  document.body.classList.toggle('scrolled', window.scrollY > 40);

  // Sobre
  const ar = about.getBoundingClientRect();
  const ap = clamp(-ar.top / (ar.height - vh), 0, 1);
  about.style.setProperty('--about-in', clamp((vh - ar.top) / vh * 1.4 - 0.4, 0, 1).toFixed(3));
  const lit = Math.round(clamp(ap * 1.35, 0, 1) * words.length);
  words.forEach((w, i) => w.classList.toggle('lit', i < lit));

  // Carreira
  const tr = timeline.getBoundingClientRect();
  timeline.style.setProperty('--grow', clamp((vh * 0.55 - tr.top) / tr.height, 0, 1).toFixed(3));
  let best = null, bestDist = Infinity;
  for (const job of jobs) {
    const r = job.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
    if (d < bestDist) { bestDist = d; best = job; }
  }
  jobs.forEach((j) => j.classList.toggle('active', j === best && bestDist < vh * 0.45));

  // Projetos
  const pr = projects.getBoundingClientRect();
  const pp = clamp(-pr.top / Math.max(1, pr.height - vh), 0, 1);
  track.style.setProperty('--x', (pp * travel).toFixed(1));
  projects.style.setProperty('--p', pp.toFixed(3));
  counter.textContent = String(Math.min(pcards.length, Math.floor(pp * (pcards.length - 1) + 0.5) + 1)).padStart(2, '0');

  // Menu
  let current = -1;
  navTargets.forEach((sec, i) => { if (sec && sec.getBoundingClientRect().top < vh * 0.5) current = i; });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === current));
}

/* ---------- Navegação: rolagem suave até cada seção ---------- */
// Onde cada aba "pousa": no Sobre, num ponto em que o texto já está acendendo; no Contato, no fim da página
function navTarget(hash) {
  const vh = window.innerHeight;
  const maxY = document.documentElement.scrollHeight - vh;
  if (hash === '#inicio') return 0;
  if (hash === '#sobre') return about.offsetTop + (about.offsetHeight - vh) * 0.75;
  if (hash === '#contato') return maxY;
  const el = document.querySelector(hash);
  return el ? Math.min(maxY, el.getBoundingClientRect().top + window.scrollY) : null;
}

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
let scrollAnim = 0;
function smoothScrollTo(y) {
  cancelAnimationFrame(scrollAnim);
  const startY = window.scrollY, dist = y - startY;
  if (Math.abs(dist) < 2) return;
  // Duração cresce com a distância, mas fica entre 0,7 s e 1,6 s
  const dur = clamp(500 + Math.abs(dist) * 0.12, 700, 1600);
  const t0 = performance.now();
  const step = (now) => {
    const t = clamp((now - t0) / dur, 0, 1);
    window.scrollTo(0, startY + dist * easeInOutCubic(t));
    if (t < 1) scrollAnim = requestAnimationFrame(step);
  };
  scrollAnim = requestAnimationFrame(step);
}
// Se a pessoa rolar ou tocar durante a animação, devolve o controle a ela
for (const ev of ['wheel', 'touchstart', 'keydown']) {
  window.addEventListener(ev, () => cancelAnimationFrame(scrollAnim), { passive: true });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href');
  const y = navTarget(hash);
  if (y == null) return;
  e.preventDefault();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) window.scrollTo(0, y);
  else smoothScrollTo(y);
  history.replaceState(null, '', hash);
});

measureProjects();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => { measureProjects(); onScroll(); });
onScroll();
