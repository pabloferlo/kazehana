/**
 * ui.js — Utilidades de interfaz: pantallas, toasts, modal, retratos.
 */
export const $ = (sel, root = document) => root.querySelector(sel);

export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c));
  return n;
}

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + id).classList.add('active');
}

let toastTimer;
export function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

export function openModal(contentNode) {
  const body = $('#modal-body');
  body.replaceChildren(contentNode);
  $('#modal').classList.remove('hidden');
}
export function closeModal() { $('#modal').classList.add('hidden'); }

/**
 * Retrato del personaje: assets/portraits/<id>/<emocion>.png
 * Si no existe, cae a neutral.png y después a un placeholder.
 */
export function portraitNode(charId, emotion = 'neutral', label = '') {
  const wrap = el('div', { style: 'display:contents' });
  const ph = () => el('div', { class: 'portrait-ph' },
    el('div', { class: 'big' }, (label || charId || '?').charAt(0).toUpperCase()),
    el('div', {}, `Falta imagen:`), el('code', {}, `assets/portraits/${charId}/${emotion}.png`));
  const img = new Image();
  let triedNeutral = emotion === 'neutral';
  img.alt = label || charId;
  img.onerror = () => {
    if (!triedNeutral) { triedNeutral = true; img.src = `assets/portraits/${charId}/neutral.png`; }
    else wrap.replaceChildren(ph());
  };
  img.src = `assets/portraits/${charId}/${emotion}.png`;
  wrap.append(img);
  return wrap;
}

/* ---- Overlay a pantalla completa (menús, ciudades, mazmorras, tienda) ---- */
export function openOverlay(node, cls = '') {
  const o = $('#overlay');
  o.className = 'overlay ' + cls;
  o.replaceChildren(node);
  o.scrollTop = 0;
}
export function closeOverlay() { const o = $('#overlay'); o.className = 'overlay hidden'; o.replaceChildren(); }
export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Modal que se resuelve al cerrarse (acepta nodo). */
export function modalAsync(node) {
  return new Promise(res => {
    openModal(node);
    const btn = $('#modal-close');
    const h = () => { btn.removeEventListener('click', h); res(); };
    btn.addEventListener('click', h);
  });
}
