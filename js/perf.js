import * as THREE from 'three';

// Modo leve: celulares/tablets (toque), telas pequenas ou poucos núcleos de CPU
export const LOW =
  window.matchMedia('(pointer: coarse), (max-width: 860px)').matches ||
  (navigator.hardwareConcurrency || 8) <= 4;

// Renderer com as configurações certas para cada aparelho
export function makeRenderer(canvas, { shadows = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !LOW,
    powerPreference: LOW ? 'low-power' : 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, LOW ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows && !LOW;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

// No modo leve desenha a ~30 fps (pula quadros); retorna true quando deve desenhar
export function frameGate() {
  let last = 0;
  const minGap = LOW ? 1000 / 30 : 0;
  return (now = performance.now()) => {
    if (now - last < minGap) return false;
    last = now;
    return true;
  };
}
