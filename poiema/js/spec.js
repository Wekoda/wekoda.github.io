// Camada de especificação: desenha cada [data-spec] com número, nome e medidas.
// Ative com ?spec=1. Não faz parte do site final.
(() => {
  const css = `
  .spec-box{position:absolute;pointer-events:none;outline:2px dashed #E5484D;outline-offset:-1px;z-index:9998}
  .spec-tag{position:absolute;left:0;top:0;transform:translateY(-100%);display:flex;gap:6px;align-items:center;background:#E5484D;color:#fff;font:700 12px/1 Inter,sans-serif;padding:6px 9px;border-radius:6px 6px 6px 0;white-space:nowrap}
  .spec-tag i{font-style:normal;background:#fff;color:#E5484D;border-radius:50%;width:18px;height:18px;display:grid;place-items:center;font-size:11px}
  .spec-dim{position:absolute;right:6px;bottom:6px;background:#fff;color:#E5484D;font:600 11px/1 Inter,sans-serif;padding:4px 6px;border-radius:4px;border:1px solid #E5484D}
  .spec-box.sub{outline:1.5px dashed #0A7CF0}
  .spec-box.sub .spec-tag{background:#0A7CF0}
  .spec-box.sub .spec-tag i{color:#0A7CF0}
  .spec-box.sub .spec-dim{color:#0A7CF0;border-color:#0A7CF0}
  .spec-col{position:absolute;top:0;background:rgba(229,72,77,.035);pointer-events:none;z-index:9997}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const draw = () => {
    document.querySelectorAll('.spec-box,.spec-col').forEach((n) => n.remove());
    const H = document.documentElement.scrollHeight;
    const cont = document.querySelector('.container');
    if (cont) {
      const r = cont.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(cont).paddingLeft);
      const w = r.width - 2 * pad; const gut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter'));
      const n = innerWidth > 640 ? 12 : 4; const cw = (w - gut * (n - 1)) / n;
      for (let i = 0; i < n; i++) { const c = document.createElement('div'); c.className = 'spec-col'; Object.assign(c.style, { left: r.left + pad + i * (cw + gut) + 'px', width: cw + 'px', height: H + 'px' }); document.body.appendChild(c); }
    }
    let i = 0, j = 0; const placed = [];
    document.querySelectorAll('[data-spec]').forEach((el) => {
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
      const sub = el.hasAttribute('data-spec-sub');
      const b = document.createElement('div'); b.className = 'spec-box' + (sub ? ' sub' : '');
      Object.assign(b.style, { left: r.left + scrollX + 'px', top: r.top + scrollY + 'px', width: r.width + 'px', height: r.height + 'px' });
      const id = sub ? String.fromCharCode(97 + (j++ % 26)) : String(++i);
      b.innerHTML = `<div class="spec-tag"><i>${id}</i>${el.dataset.spec}</div><div class="spec-dim">${Math.round(r.width)} × ${Math.round(r.height)}</div>`;
      if (r.top + scrollY < 30) b.querySelector('.spec-tag').style.transform = 'none';
      document.body.appendChild(b);
      const tag = b.querySelector('.spec-tag'); let shift = 0;
      for (let k = 0; k < 8; k++) {
        const t = tag.getBoundingClientRect();
        const hit = placed.find((q) => !(t.right < q.left || t.left > q.right || t.bottom < q.top || t.top > q.bottom));
        if (!hit) break; shift += hit.right - t.left + 8; tag.style.left = shift + 'px';
      }
      placed.push(tag.getBoundingClientRect());
    });
    window.SPEC_READY = true;
  };
  document.fonts.ready.then(() => requestAnimationFrame(draw));
})();
