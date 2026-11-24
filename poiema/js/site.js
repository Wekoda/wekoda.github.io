// Poiema — comportamento compartilhado (sem dependências)
(() => {
  const html = document.documentElement;
  const q = new URLSearchParams(location.search);
  // Modo estático: usado para gerar as imagens da especificação (sem animação, tudo visível)
  const estatico = navigator.webdriver || q.get('estatico') === '1';
  const reduz = (matchMedia('(prefers-reduced-motion: reduce)').matches || estatico) && q.get('mov') !== '1';
  html.classList.add('js');
  const guarda = {
    get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ---------- header ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('rolou', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  /* ---------- menu flutuante ---------- */
  const folha = document.querySelector('.menu-folha');
  const abrir = document.querySelector('.menu-flutuante');
  if (folha && abrir) {
    const set = (on) => {
      folha.classList.toggle('aberto', on);
      abrir.setAttribute('aria-expanded', String(on));
      folha.setAttribute('aria-hidden', String(!on));
      document.body.style.overflow = on ? 'hidden' : '';
      if (on) folha.querySelector('nav a')?.focus(); else abrir.focus();
    };
    abrir.addEventListener('click', () => set(true));
    folha.querySelectorAll('[data-fechar]').forEach((el) => el.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && folha.classList.contains('aberto')) set(false); });
    if (q.get('menu') === '1') set(true);
  }

  /* ---------- chips ---------- */
  document.querySelectorAll('.chip[aria-pressed]').forEach((c) =>
    c.addEventListener('click', () => {
      const unico = c.closest('[data-unico]');
      if (unico) unico.querySelectorAll('.chip').forEach((o) => o.setAttribute('aria-pressed', 'false'));
      c.setAttribute('aria-pressed', unico ? 'true' : String(c.getAttribute('aria-pressed') !== 'true'));
    }));

  /* ---------- revelar ao rolar ---------- */
  const rev = document.querySelectorAll('[data-revelar]');
  if (reduz || !('IntersectionObserver' in window)) rev.forEach((el) => el.classList.add('visivel'));
  else {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    rev.forEach((el) => io.observe(el));
  }

  /* ---------- hero: adesivos com profundidade + arrastáveis ---------- */
  const hero = document.querySelector('.hero');
  const adesivos = [...document.querySelectorAll('.adesivo')];
  const estado = new Map(adesivos.map((a) => [a, { dx: 0, dy: 0, px: 0, py: 0 }]));
  const aplicar = (a) => { const s = estado.get(a); a.style.translate = `${s.dx + s.px}px ${s.dy + s.py}px`; };
  if (hero && !reduz) {
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      adesivos.forEach((a) => { const k = { 1: 22, 2: 12, 3: 6 }[a.dataset.profundidade] || 8; const s = estado.get(a); s.px = -nx * k; s.py = -ny * k; aplicar(a); });
    });
  }
  adesivos.forEach((a) => {
    let ini = null;
    a.addEventListener('pointerdown', (e) => { const s = estado.get(a); ini = { x: e.clientX - s.dx, y: e.clientY - s.dy }; a.setPointerCapture(e.pointerId); a.classList.add('arrastando'); });
    a.addEventListener('pointermove', (e) => { if (!ini) return; const s = estado.get(a); s.dx = e.clientX - ini.x; s.dy = e.clientY - ini.y; aplicar(a); });
    const fim = () => { ini = null; a.classList.remove('arrastando'); };
    a.addEventListener('pointerup', fim); a.addEventListener('pointercancel', fim);
  });

  /* ---------- pílula: cai e pousa ao lado de "poiema", depois flutua e pisca ---------- */
  const pilula = document.querySelector('.hero [data-pilula]');
  const pouso = document.querySelector('[data-pouso-pilula]');
  if (pilula && pouso && q.get('pouso') === '1') document.body.classList.add('pousou');
  if (pilula && pouso && !reduz) {
    let origem, alvo;
    const medir = () => {
      pilula.style.transform = '';
      const a = pilula.getBoundingClientRect(), b = pouso.getBoundingClientRect();
      origem = { x: a.left + a.width / 2, y: a.top + scrollY + a.height / 2, w: a.width };
      alvo = { x: b.left + b.width / 2, y: b.top + scrollY + b.height / 2, w: b.width * 1.12 };
      cair();
    };
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const cair = () => {
      if (!origem) return;
      const fimRolagem = Math.max(1, alvo.y - innerHeight * 0.45);
      const t = Math.min(1, Math.max(0, scrollY / fimRolagem));
      const e = ease(t);
      const dx = (alvo.x - origem.x) * e, dy = (alvo.y - origem.y) * t;
      const esc = 1 + (alvo.w / origem.w - 1) * e;
      pilula.style.transform = `translate(${dx}px, ${dy}px) rotate(${-10 + 370 * e}deg) scale(${esc})`;
      document.body.classList.toggle('pousou', t >= 1);
    };
    addEventListener('scroll', cair, { passive: true });
    addEventListener('resize', medir);
    document.fonts.ready.then(medir);
  } else if (pouso && reduz && !estatico) document.body.classList.add('pousou');

  /* ---------- Hub: asterisco gira com a rolagem ---------- */
  const ast = document.querySelector('.hub-arte .gira .asterisco');
  if (ast && !reduz) addEventListener('scroll', () => { ast.style.rotate = `${scrollY * 0.25}deg`; }, { passive: true });

  /* ---------- Loja: ver todas as peças ---------- */
  document.querySelectorAll('[data-abrir-colecao]').forEach((b) => b.addEventListener('click', () => {
    const c = document.querySelector('.colecao'); c.classList.add('aberta'); b.remove();
  }));

  /* ---------- Poiema Music: mini player persistente ----------
     No protótipo o player é uma PRÉVIA (miniatura + progresso simulado), porque o
     artefato não permite iframes de outros sites. No site real, troque por
     <iframe src="https://www.youtube-nocookie.com/embed/ID?autoplay=1&enablejsapi=1">
     controlado pela YouTube IFrame API (ver docs/paginas/07-music.md). */
  const FAIXAS = [
    { n: 1, t: 'nossa comunhão', id: 'PXY25mUEHes', d: '5:06', img: 'clipe-01-nossa-comunhao' },
    { n: 2, t: 'a resposta que o mundo esperava', id: 'HteU-0Jma0Q', d: '3:37', img: 'clipe-02-a-resposta' },
    { n: 3, t: 'teus altares', id: 'CJ4RZC4fTp0', d: '12:09', img: 'clipe-03-teus-altares' },
    { n: 4, t: 'ritmo das correntezas', id: 'JZfirWO3qW0', d: '4:03', img: 'clipe-04-ritmo-das-correntezas' },
    { n: 5, t: 'emaús', id: 'BII8iO_7i10', d: '5:05', img: 'clipe-05-emaus' },
    { n: 6, t: 'imaginação / eu já posso ver', id: 'YDlbuxttsGU', d: '9:51', img: 'clipe-06-imaginacao' },
    { n: 7, t: 'santo de israel', id: 'P41yDyhe9Jc', d: '8:22', img: 'clipe-07-santo-de-israel' },
    { n: 8, t: 'fiz um voto', id: 'C-wIM1VpPsk', d: '3:54', img: 'clipe-08-fiz-um-voto' },
    { n: 9, t: 'irrepreensível', id: 'iMDqEKYFb1s', d: '9:55', img: 'clipe-09-irrepreensivel' },
    { n: 10, t: 'obras primas / desde o ventre', id: 'ezlgvWSnPdg', d: '7:24', img: 'clipe-10-obras-primas' },
    // Obra-Prima (Ao Vivo), 2025
    { t: 'Teus Altares (ao vivo)', id: '_zq7xIS4iT4', d: '8:13', img: '../yt/_zq7xIS4iT4', al: 'Obra-Prima' },
    { t: 'Uma Nova Canção (ao vivo)', id: 'xcPjf_xRjKM', d: '5:11', img: '../yt/xcPjf_xRjKM', al: 'Obra-Prima' },
    { t: 'Santo de Israel (ao vivo)', id: 'BeTI7dcRrF8', d: '9:47', img: '../yt/BeTI7dcRrF8', al: 'Obra-Prima' },
    { t: 'Irrepreensível (ao vivo)', id: '3yRCpdcCYZU', d: '8:11', img: '../yt/3yRCpdcCYZU', al: 'Obra-Prima' },
    { t: 'Obras-Primas (ao vivo)', id: 'P-Xc8ZoIUi4', d: '6:06', img: '../yt/P-Xc8ZoIUi4', al: 'Obra-Prima' },
    { t: 'Desde o Ventre (ao vivo)', id: '_GhNktl6AjQ', d: '5:49', img: '../yt/_GhNktl6AjQ', al: 'Obra-Prima' },
    { t: 'Imaginação (ao vivo)', id: 'wlR0Lpyi9f8', d: '9:24', img: '../yt/wlR0Lpyi9f8', al: 'Obra-Prima' },
    { t: 'Eu Já Posso Ver (ao vivo)', id: 'PzqwthtjLYI', d: '6:34', img: '../yt/PzqwthtjLYI', al: 'Obra-Prima' },
  ];
  const seg = (d) => { const [m, s] = d.split(':').map(Number); return m * 60 + s; };
  const ic = (n) => `<svg class="icone" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  let st = guarda.get('poiema-player') || null;     // { i, tocando, t }
  let mp, timer;
  const montar = () => {
    mp = document.createElement('aside');
    mp.className = 'miniplayer'; mp.hidden = true; mp.setAttribute('aria-label', 'Player Poiema Music');
    mp.innerHTML = `<div class="video"><img alt=""><span class="aviso-demo">prévia · no site o clipe toca aqui</span></div>
      <div class="barra"><i></i></div>
      <div class="ctrl"><img class="capa-mp" src="assets/music/capa-2oumais-vol1.webp" alt="">
        <div class="titulo-mp"><span></span><small>2ou+ vol.1 · Poiema Music</small></div>
        <button class="bt" data-mp="ant" aria-label="Faixa anterior">${ic('anterior')}</button>
        <button class="bt bt--play" data-mp="play" aria-label="Tocar">${ic('play')}</button>
        <button class="bt" data-mp="fechar" aria-label="Fechar player">${ic('fechar')}</button></div>`;
    document.body.appendChild(mp);
    mp.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mp]'); if (!b) return;
      if (b.dataset.mp === 'play') tocar(st.i, !st.tocando, st.t);
      if (b.dataset.mp === 'ant') tocar((st.i + FAIXAS.length - 1) % FAIXAS.length, true, 0);
      if (b.dataset.mp === 'fechar') { clearInterval(timer); st = null; guarda.set('poiema-player', null); render(); }
    });
  };
  const render = () => {
    document.body.classList.toggle('tocando', !!st?.tocando);
    document.querySelectorAll('[data-faixa]').forEach((el) => el.classList.toggle('ativa', !!st && +el.dataset.faixa === st.i));
    if (!mp) return;
    if (!st) { mp.hidden = true; return; }
    const f = FAIXAS[st.i];
    mp.hidden = false;
    mp.querySelector('.video img').src = `assets/music/${f.img}.webp`;
    mp.querySelector('.titulo-mp span').textContent = f.t;
    mp.querySelector('.titulo-mp small').textContent = (f.al ? f.al + ' (Ao Vivo)' : '2ou+ vol.1') + ' · Poiema Music';
    mp.querySelector('.capa-mp').src = f.al ? 'assets/music/capa-obra-prima.webp' : 'assets/music/capa-2oumais-vol1.webp';
    mp.querySelector('.barra i').style.width = (100 * st.t / seg(f.d)) + '%';
    const p = mp.querySelector('[data-mp="play"]');
    p.innerHTML = ic(st.tocando ? 'pausa' : 'play'); p.setAttribute('aria-label', st.tocando ? 'Pausar' : 'Tocar');
  };
  const tocar = (i, on = true, t = 0) => {
    st = { i, tocando: on, t }; guarda.set('poiema-player', st); render();
    clearInterval(timer);
    if (on && !estatico) timer = setInterval(() => {
      st.t += 1; if (st.t >= seg(FAIXAS[st.i].d)) { st.i = (st.i + 1) % FAIXAS.length; st.t = 0; }
      guarda.set('poiema-player', st); render();
    }, 1000);
  };
  montar();
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-ouvir]'); if (!b) return;
    e.preventDefault(); const i = +b.dataset.ouvir;
    if (st && st.i === i) tocar(i, !st.tocando, st.t); else tocar(i, true, 0);
  });
  if (q.get('player') !== null) st = { i: +q.get('player') || 0, tocando: true, t: 74 };
  if (st) tocar(st.i, st.tocando, st.t); else render();

  /* ---------- 2ou+: pontos da casa ---------- */
  document.querySelectorAll('[data-ponto]').forEach((b) => {
    const abre = () => {
      document.querySelectorAll('[data-ponto]').forEach((o) => o.setAttribute('aria-expanded', String(o === b)));
      document.querySelectorAll('[data-dica]').forEach((d) => d.classList.toggle('ativa', d.dataset.dica === b.dataset.ponto));
    };
    b.addEventListener('click', abre); b.addEventListener('mouseenter', abre);
  });
  /* ---------- carrossel de depoimentos ---------- */
  document.querySelectorAll('[data-carrossel]').forEach((b) => b.addEventListener('click', () => {
    const t = document.querySelector('[data-trilho]'); if (!t) return;
    t.scrollBy({ left: +b.dataset.carrossel * t.firstElementChild.getBoundingClientRect().width * 1.1, behavior: reduz ? 'auto' : 'smooth' });
  }));
  /* ---------- YouTube: abas (teclado ← →) ---------- */
  const abas = [...document.querySelectorAll('[role="tab"][data-aba]')];
  const escolher = (b, foco) => {
    abas.forEach((o) => { const on = o === b; o.setAttribute('aria-selected', on); o.tabIndex = on ? 0 : -1; document.getElementById(o.getAttribute('aria-controls')).hidden = !on; });
    if (foco) b.focus();
    if (history.replaceState) history.replaceState(null, '', '#' + b.dataset.aba);
  };
  abas.forEach((b, i) => {
    b.addEventListener('click', () => escolher(b));
    b.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) escolher(abas[(i + d + abas.length) % abas.length], true); });
  });
  const inicial = abas.find((b) => '#' + b.dataset.aba === location.hash); if (inicial) escolher(inicial);

  /* ---------- 2ou+: depoimentos em rolagem automática (para com mouse ou dedo em cima) ---------- */
  const trilho = document.querySelector('[data-trilho][data-auto]');
  if (trilho) {
    [...trilho.children].forEach((c) => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); trilho.appendChild(k); });
    let parado = false, retomar, pos = 0;
    const parar = () => { parado = true; clearTimeout(retomar); };
    const seguir = (ms = 0) => { clearTimeout(retomar); retomar = setTimeout(() => { parado = false; pos = trilho.scrollLeft; }, ms); };
    trilho.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') parar(); });
    trilho.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') seguir(); });
    trilho.addEventListener('touchstart', parar, { passive: true });
    trilho.addEventListener('touchend', () => seguir(1800), { passive: true });
    trilho.addEventListener('focusin', parar); trilho.addEventListener('focusout', () => seguir());
    document.querySelectorAll('[data-carrossel]').forEach((b) => b.addEventListener('click', () => { parar(); seguir(1400); }));
    if (!reduz) {
      const passo = () => {
        if (!parado) {
          pos += 0.45; const meio = trilho.scrollWidth / 2;
          if (pos >= meio) pos -= meio;
          trilho.scrollLeft = pos;
        }
        requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }
  }

  /* ---------- Loja: ver a peça (sem sair do site) ---------- */
  const modal = document.querySelector('.produto-modal');
  if (modal) {
    const principal = modal.querySelector('.pm-principal'), minis = modal.querySelector('.pm-miniaturas');
    const abrirPeca = (el) => {
      const fotos = el.dataset.fotos.split('|');
      modal.querySelector('#pm-nome').textContent = el.dataset.nome;
      modal.querySelector('.pm-num').textContent = el.dataset.num;
      principal.src = fotos[0]; principal.alt = 'Estampa ' + el.dataset.nome;
      minis.innerHTML = fotos.map((f, i) => `<button aria-current="${i === 0}" aria-label="Foto ${i + 1}"><img src="${f}" alt=""></button>`).join('');
      minis.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { principal.src = fotos[i]; minis.querySelectorAll('button').forEach((o) => o.setAttribute('aria-current', String(o === b))); }));
      modal.querySelector('.pm-ok').hidden = true;
      modal.showModal();
    };
    document.querySelectorAll('[data-produto]').forEach((el) => el.addEventListener('click', () => abrirPeca(el)));
    modal.querySelector('[data-fechar-modal]').addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    if (q.get('peca')) { const el = document.querySelectorAll('[data-produto]')[+q.get('peca')]; if (el) abrirPeca(el); }
  }
  document.querySelectorAll('[data-avise]').forEach((b) => b.addEventListener('click', () => {
    const ok = b.closest('.produto-modal')?.querySelector('.pm-ok');
    if (ok) { ok.hidden = false; return; }
    const t = document.createElement('div'); t.className = 'aviso-toast'; t.setAttribute('role', 'status');
    t.innerHTML = '<svg class="icone" aria-hidden="true" style="width:20px;height:20px"><use href="#i-check"/></svg>Combinado! A gente avisa quando as vendas abrirem.';
    document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
  }));

  /* ---------- logo vivo ---------- */
  document.querySelectorAll('.logo-vivo').forEach((l) => l.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || reduz) return;
    e.preventDefault(); l.classList.add('girando', 'tocou');
    setTimeout(() => { if (location.pathname.endsWith('/index.html') || location.pathname.endsWith('/')) { scrollTo({ top: 0, behavior: 'smooth' }); l.classList.remove('girando', 'tocou'); } else location.href = l.href; }, 650);
  }));

  /* ---------- mascotes: cada um com um movimento próprio (nada de flutuar igual) ---------- */
  const mola = (k = 0.12, c = 0.82) => ({ x: 0, v: 0, passo(alvo) { this.v = (this.v + (alvo - this.x) * k) * c; this.x += this.v; return this.x; } });
  let velRolagem = 0, ultimoY = scrollY;
  addEventListener('scroll', () => { velRolagem = scrollY - ultimoY; ultimoY = scrollY; }, { passive: true });

  // Eventos · calendário pendurado nos aros: balança com a velocidade da rolagem e com o mouse passando
  document.querySelectorAll('[data-movimento="pendulo"]').forEach((m) => {
    if (reduz) return;
    let ang = 0, v = 0;
    m.addEventListener('pointermove', (e) => { v += (e.movementX || 0) * 0.06; });
    (function quadro() {
      v += Math.max(-40, Math.min(40, velRolagem)) * 0.014; velRolagem *= 0.6;
      v += -ang * 0.035; v *= 0.94; ang += v; ang = Math.max(-28, Math.min(28, ang));
      m.style.transform = `rotate(${ang.toFixed(2)}deg)`;
      requestAnimationFrame(quadro);
    })();
  });

  // 2ou+ · logo que dá para pegar e jogar: volta para o lugar com mola e gira conforme a força
  document.querySelectorAll('[data-movimento="arremesso"]').forEach((m) => {
    const px = mola(0.06, 0.86), py = mola(0.06, 0.86), rz = mola(0.08, 0.8);
    let pego = null, ox = 0, oy = 0, ult = { x: 0, y: 0, t: 0 }, vx = 0, vy = 0;
    m.addEventListener('pointerdown', (e) => { pego = e.pointerId; m.setPointerCapture(e.pointerId); ox = e.clientX - px.x; oy = e.clientY - py.x; ult = { x: e.clientX, y: e.clientY, t: performance.now() }; m.classList.add('pego'); });
    m.addEventListener('pointermove', (e) => {
      if (pego !== e.pointerId) return;
      const t = performance.now(), dt = Math.max(1, t - ult.t); vx = (e.clientX - ult.x) / dt * 16; vy = (e.clientY - ult.y) / dt * 16; ult = { x: e.clientX, y: e.clientY, t };
      px.x = e.clientX - ox; py.x = e.clientY - oy; px.v = py.v = 0;
    });
    const soltar = () => { if (pego === null) return; pego = null; m.classList.remove('pego'); px.v = vx * 1.4; py.v = vy * 1.4; rz.v += vx * 1.2; };
    m.addEventListener('pointerup', soltar); m.addEventListener('pointercancel', soltar);
    (function quadro() {
      if (pego === null) { px.passo(0); py.passo(0); }
      const r = rz.passo(pego === null ? 0 : Math.max(-30, Math.min(30, vx * 2)));
      m.style.transform = `translate(${px.x.toFixed(1)}px, ${py.x.toFixed(1)}px) rotate(${r.toFixed(1)}deg)`;
      requestAnimationFrame(quadro);
    })();
  });

  // YouTube · play magnético: é puxado pelo cursor, amassa ao passar e "aperta" no clique
  document.querySelectorAll('[data-movimento="ima"]').forEach((m) => {
    if (reduz) return;
    const tx = mola(0.1, 0.78), ty = mola(0.1, 0.78), sx = mola(0.18, 0.7), sy = mola(0.18, 0.7);
    let alvo = { x: 0, y: 0, s: 1 };
    sx.x = sy.x = 1;
    addEventListener('pointermove', (e) => {
      const r = m.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
      const raio = r.width * 1.6;
      alvo = d < raio ? { x: dx * 0.35, y: dy * 0.35, s: d < r.width / 2 ? 1.08 : 1 } : { x: 0, y: 0, s: 1 };
    }, { passive: true });
    m.addEventListener('pointerdown', () => { sx.v -= 0.25; sy.v += 0.18; });
    m.addEventListener('click', () => document.querySelector('.yt-destaque')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    (function quadro() {
      const a = tx.passo(alvo.x), b = ty.passo(alvo.y), c = sx.passo(alvo.s), d = sy.passo(alvo.s === 1 ? 1 : 0.94);
      m.style.transform = `translate(${a.toFixed(1)}px, ${b.toFixed(1)}px) scale(${c.toFixed(3)}, ${d.toFixed(3)})`;
      requestAnimationFrame(quadro);
    })();
  });

  // Music · vinil que "arranha": gira com a velocidade da rolagem, dá para girar arrastando e roda sozinho enquanto toca
  document.querySelectorAll('[data-vinil]').forEach((capa) => {
    const disco = capa.querySelector('.vinil'); if (!disco || reduz) return;
    let ang = 0, v = 0, arrastando = false, ultAng = 0;
    const angulo = (e) => { const r = disco.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
    disco.addEventListener('pointerdown', (e) => { arrastando = true; disco.setPointerCapture(e.pointerId); ultAng = angulo(e); disco.classList.add('pego'); });
    disco.addEventListener('pointermove', (e) => { if (!arrastando) return; let a = angulo(e), d = a - ultAng; if (d > 180) d -= 360; if (d < -180) d += 360; ang += d; v = d; ultAng = a; });
    const fim = () => { arrastando = false; disco.classList.remove('pego'); };
    disco.addEventListener('pointerup', fim); disco.addEventListener('pointercancel', fim);
    (function quadro() {
      if (!arrastando) { v += Math.max(-80, Math.min(80, velRolagem)) * 0.12; velRolagem *= 0.6; const base = document.body.classList.contains('tocando') ? 1.2 : 0; v += (base - v) * 0.04; ang += v; }
      disco.style.rotate = `${(ang % 360).toFixed(1)}deg`;
      requestAnimationFrame(quadro);
    })();
  });

  // Loja · detalhes das estampas entram como carimbo; a lente aproxima onde o mouse está
  const carimbos = document.querySelectorAll('[data-carimbo]');
  if (carimbos.length) {
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const el = e.target; const i = [...el.parentElement.parentElement.querySelectorAll('[data-carimbo]')].indexOf(el); el.style.setProperty('--atraso', `${Math.max(0, i) * 90}ms`); el.style.setProperty('--giro', `${((i * 37) % 13) - 6}deg`); el.classList.add('carimbado'); io2.unobserve(el); }), { threshold: 0.35 });
    carimbos.forEach((c) => { if (reduz || q.get('estatico') === '1' || navigator.webdriver) { c.classList.add('carimbado', 'sem-anim'); c.style.setProperty('--giro', '0deg'); } else io2.observe(c); });
  }
  document.querySelectorAll('.lente').forEach((l) => {
    const img = l.querySelector('img');
    l.addEventListener('pointermove', (e) => { const r = l.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; });
  });

  /* ---------- profundidade: camadas que andam em velocidades diferentes ---------- */
  const camadas = [...document.querySelectorAll('[data-vel]')];
  if (camadas.length && !reduz) {
    const parallax = () => camadas.forEach((el) => {
      const r = el.parentElement.getBoundingClientRect();
      const d = (r.top + r.height / 2) - innerHeight / 2;
      el.style.translate = `0 ${(-d * +el.dataset.vel).toFixed(1)}px`;
    });
    addEventListener('scroll', parallax, { passive: true }); parallax();
  }

  /* ---------- Loja: fotos arrastáveis (um toque sem arrastar abre a peça) ---------- */
  document.querySelectorAll('[data-arrastavel]').forEach((el) => {
    let ini = null, moveu = false, dx = 0, dy = 0;
    el.addEventListener('pointerdown', (e) => { ini = { x: e.clientX - dx, y: e.clientY - dy, sx: e.clientX, sy: e.clientY }; moveu = false; el.setPointerCapture(e.pointerId); el.classList.add('arrastando'); });
    el.addEventListener('pointermove', (e) => { if (!ini) return; if (Math.hypot(e.clientX - ini.sx, e.clientY - ini.sy) > 6) moveu = true; dx = e.clientX - ini.x; dy = e.clientY - ini.y; el.style.translate = `${dx}px ${dy}px`; });
    const fim = () => { ini = null; el.classList.remove('arrastando'); };
    el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim);
    el.addEventListener('click', (e) => { if (moveu) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  });

  /* ---------- Loja: índice com prévia que segue o cursor ---------- */
  const previa = document.querySelector('[data-previa-img]');
  if (previa) {
    document.querySelectorAll('[data-indice] button').forEach((b) => {
      b.addEventListener('mouseenter', () => { previa.src = b.dataset.previa; previa.classList.add('visivel'); });
      b.addEventListener('mouseleave', () => previa.classList.remove('visivel'));
    });
    addEventListener('mousemove', (e) => { previa.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 150}px) rotate(${(e.movementX || 0) * 0.4}deg)`; }, { passive: true });
  }

  /* ---------- Loja: inclinação 3D nos cards ---------- */
  document.querySelectorAll('.peca--tilt').forEach((c) => {
    c.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse' || reduz) return; const r = c.getBoundingClientRect(); c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 10 + 'deg'); c.style.setProperty('--rx', -((e.clientY - r.top) / r.height - 0.5) * 10 + 'deg'); });
    c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  /* ---------- Loja: filtro por idioma e embaralhar ---------- */
  const grade = document.querySelector('[data-colecao]');
  if (grade) {
    document.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
      document.querySelectorAll('[data-filtro]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
      grade.querySelectorAll('.peca').forEach((p) => p.classList.toggle('escondida', b.dataset.filtro !== 'todas' && p.dataset.lingua !== b.dataset.filtro));
    }));
    document.querySelector('[data-embaralhar]')?.addEventListener('click', () => {
      grade.classList.add('trocando');
      setTimeout(() => { [...grade.children].sort(() => Math.random() - 0.5).forEach((c) => grade.appendChild(c)); grade.classList.remove('trocando'); }, 220);
    });
  }

  /* ---------- camada de especificação ---------- */
  if (q.get('spec') === '1') {
    const s = document.createElement('script');
    s.src = (document.currentScript?.src || 'js/site.js').replace('site.js', 'spec.js');
    document.body.appendChild(s);
  }
})();
