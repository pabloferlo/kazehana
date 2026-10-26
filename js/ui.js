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

/* ---------- Imágenes de fondo opcionales (assets/backgrounds/<id>.jpg|png|webp) ---------- */
const imgCache = {};
/** Busca la primera imagen existente para un id. Devuelve la URL o null. Resultado en caché. */
export function findBgImage(id, dir = 'assets/backgrounds/') {
  if (!id) return Promise.resolve(null);
  const key = dir + id;
  if (imgCache[key] !== undefined) return Promise.resolve(imgCache[key]);
  const tryExt = ext => new Promise(res => { const im = new Image(); im.onload = () => res(im.src); im.onerror = () => res(null); im.src = `${dir}${id}.${ext}`; });
  return (async () => { for (const e of ['jpg', 'png', 'webp', 'jpeg']) { const u = await tryExt(e); if (u) return (imgCache[key] = u); } return (imgCache[key] = null); })();
}
/** Pone la primera imagen encontrada (de una lista de ids, por orden) como fondo de `node`, oscurecida `dim`. */
export async function applyBgImage(node, ids, dim = 0.35) {
  const tok = (node._bgTok = (node._bgTok || 0) + 1);
  node.style.backgroundImage = ''; // vuelve al degradado mientras carga
  for (const id of [].concat(ids)) {
    const u = await findBgImage(id);
    if (node._bgTok !== tok) return null;           // llegó otra petición
    if (u) {
      node.style.backgroundImage = `linear-gradient(rgba(0,0,0,${dim}),rgba(0,0,0,${dim})), url("${u}")`;
      node.style.backgroundSize = 'cover'; node.style.backgroundPosition = 'center'; node.style.backgroundRepeat = 'no-repeat';
      return u;
    }
  }
  return null;
}
/** Id de imagen que corresponde a un degradado de escena (data/backgrounds.json). */
export function bgIdFor(gradient, Data) { return Data.backgrounds?.gradients?.[gradient] || null; }
