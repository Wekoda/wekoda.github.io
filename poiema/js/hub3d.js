// Hub Multiplique: asterisco de VIDRO transparente, iluminado por luz vermelha.
// O vidro é incolor; o vermelho vem das luzes e do ambiente refletido/refratado.
import * as THREE from '../vendor/three/three.module.min.js';

const alvo = document.querySelector('[data-3d-asterisco]');
const estatico = navigator.webdriver || new URLSearchParams(location.search).get('estatico') === '1';
const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;

async function iniciar() {
  if (!alvo) return;
  const contorno = await (await fetch('js/asterisco-contorno.json')).json();
  const fundo = getComputedStyle(document.body).getPropertyValue('--tema-fundo').trim() || '#F7EDEA';

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: estatico });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(fundo);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true'); canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;-webkit-mask-image:radial-gradient(closest-side,#000 70%,transparent 100%);mask-image:radial-gradient(closest-side,#000 70%,transparent 100%)';
  alvo.appendChild(canvas);

  const cena = new THREE.Scene();
  cena.background = new THREE.Color(fundo);

  // Ambiente: sala clara com painéis vermelhos acesos (é isso que o vidro reflete)
  const amb = new THREE.Scene();
  amb.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(fundo).multiplyScalar(1.05), side: THREE.BackSide })));
  const painel = (cor, int, x, y, z, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(cor).multiplyScalar(int), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); amb.add(m);
  };
  painel('#ff2a1a', 6, -6, 3, 4, 5, 9);    // luz vermelha principal (esquerda)
  painel('#ff4a2a', 4, 7, -2, 2, 3, 7);    // contraluz vermelha (direita)
  painel('#ffffff', 3, 2, 8, 6, 6, 2);     // luz branca de cima (brilho do vidro)
  painel('#c8322b', 2.5, 0, -7, -6, 10, 4);
  const pm = new THREE.PMREMGenerator(renderer);
  cena.environment = pm.fromScene(amb, 0.02).texture;

  // Fundo de refração: um brilho vermelho suave atrás do vidro
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
    const gr = g.createRadialGradient(190, 230, 6, 210, 240, 190);
    g.fillStyle = fundo; g.fillRect(0, 0, 512, 512);
    gr.addColorStop(0, 'rgba(255,45,30,0.9)'); gr.addColorStop(0.3, 'rgba(235,50,38,0.5)'); gr.addColorStop(0.65, 'rgba(235,70,55,0.12)'); gr.addColorStop(1, 'rgba(235,70,55,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
    // faixas claras/escuras para a refração ficar visível
    g.globalAlpha = 0.035; for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#7a1510'; g.fillRect(0, i * 64, 512, 26); } g.globalAlpha = 1; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const brilho = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  brilho.position.set(0.3, -0.1, -2.4); cena.add(brilho);

  // Geometria: contorno do asterisco extrudado com bisel
  const forma = new THREE.Shape(contorno.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 10, curveSegments: 48 });
  geo.center(); geo.computeVertexNormals();
  const vidro = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness: 0.02, transmission: 1, thickness: 1.2, ior: 1.52,
    envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.02, specularIntensity: 1, dispersion: 0.2,
  });
  const ast = new THREE.Mesh(geo, vidro);
  cena.add(ast);

  const luzV = new THREE.PointLight('#ff2a1a', 60, 0, 2); luzV.position.set(-2.6, 1.6, 2.4); cena.add(luzV);
  const luzV2 = new THREE.PointLight('#ff5a3a', 30, 0, 2); luzV2.position.set(2.8, -1.4, 1.4); cena.add(luzV2);
  cena.add(new THREE.AmbientLight('#ffffff', 0.25));

  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  cam.position.set(0, 0, 6.2);

  const tamanho = () => { const r = { width: alvo.clientWidth, height: alvo.clientHeight }; renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.updateProjectionMatrix(); };
  tamanho(); new ResizeObserver(tamanho).observe(alvo);

  let mx = 0, my = 0;
  addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  const quadro = (t) => {
    const s = t / 1000;
    ast.rotation.z = (reduz ? 0.2 : s * 0.25) + scrollY * 0.003;
    ast.rotation.y = 0.35 * Math.sin(s * 0.6) + mx * 0.6;
    ast.rotation.x = -0.25 + 0.15 * Math.cos(s * 0.5) + my * 0.4;
    luzV.position.x = -2.6 + Math.sin(s * 0.8) * 0.8;
    renderer.render(cena, cam);
  };
  alvo.classList.add('tem-3d');
  if (reduz || estatico) { ast.rotation.set(-0.3, 0.45, 0.35); renderer.render(cena, cam); window.HUB3D_PRONTO = true; return; }
  renderer.setAnimationLoop(quadro);
  window.HUB3D_PRONTO = true;
}
iniciar().catch(() => { window.HUB3D_PRONTO = true; /* sem WebGL: fica o asterisco em SVG */ });
