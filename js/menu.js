/**
 * menu.js — Menú de pausa: grupo, inventario, equipo, misiones, relación con Yukine y sistema.
 */
import { $, el, openOverlay, closeOverlay, toast, openModal, closeModal, showScreen } from './ui.js';
import { Data, State, items, countItem, addItem, removeItem } from './state.js';
import { saveSlot, loadSlot, SLOTS } from './storage.js';
import { partyChars, maxOf, classDef, xpNeed, LEVEL_CAP, isFainted, healChar, reviveChar, clampChar, fullRestore } from './party.js';
import { questStatus, objProgress, cond as require_ } from './quests.js';
import { runScenes, addAffinity } from './story.js';
import { safe, showWorld, bonusText, autosave } from './world.js';

const SLOT_LABEL = { auto: 'Autoguardado', 1: 'Ranura 1', 2: 'Ranura 2', 3: 'Ranura 3' };
const STAGES = ['Desconocidos', 'Aliados', 'Compañeros', 'Muy cercanos', 'Pareja'];
const ELEM_NAME = { fuego: 'Fuego', hielo: 'Hielo', rayo: 'Rayo', arcano: 'Arcano', fisico: 'Físico', imbuido: 'Imbuido' };
let hooks = { resume: () => {}, toTitle: () => {}, images: () => {} };
export function setMenuHooks(h) { hooks = { ...hooks, ...h }; }

export function slotSummary(d) {
  if (!d) return 'Vacía';
  const p = d.player; const cls = Data.classes.classes.find(c => c.id === p.classId)?.name || '';
  return `${p.name} · ${p.age} años · ${cls} · Nv ${p.level} — ${new Date(d.savedAt).toLocaleString()}`;
}

/** Modal de guardar o cargar. */
export async function slotModal(mode) {
  const box = el('div', {}, el('h3', {}, mode === 'save' ? 'Guardar partida' : 'Cargar partida'));
  for (const slot of SLOTS) {
    if (mode === 'save' && slot === 'auto') continue;
    const data = await loadSlot(slot);
    const row = el('div', { class: 'save-slot' }, el('div', {}, el('strong', {}, SLOT_LABEL[slot]), el('small', {}, slotSummary(data))));
    if (mode === 'save') row.append(el('button', { class: 'btn', onclick: async () => { await saveSlot(slot, State.game); toast('Partida guardada'); closeModal(); } }, 'Guardar'));
    else if (data) row.append(el('button', { class: 'btn primary', onclick: () => { closeModal(); closeOverlay(); hooks.resume(data); } }, 'Cargar'));
    box.append(row);
  }
  openModal(box);
}

/* ---------- Utilidades ---------- */
const bar = (cls, pct) => el('div', { class: 'bar ' + cls }, el('i', { style: `width:${Math.max(0, Math.min(100, pct))}%` }));
const techLine = t => `${ELEM_NAME[t.element] || t.element} · ${t.mpCost} PM · ${t.type === 'attack' ? `pot. ${t.power}` : t.type === 'heal' ? 'cura' : t.type === 'buff' ? 'apoyo' : t.type === 'debuff' ? 'debilita' : 'utilidad'}`;

function pickChar(title, filter = () => true) {
  return new Promise(res => {
    const box = el('div', {}, el('h3', {}, title),
      el('div', { class: 'menu' }, ...partyChars().filter(filter).map(c => el('button', { class: 'btn', onclick: () => { closeModal(); res(c); } }, `${c.name} — PV ${c.hp}/${maxOf(c).hp} · PM ${c.mp}/${maxOf(c).mp}`)),
        el('button', { class: 'btn ghost', onclick: () => { closeModal(); res(null); } }, 'Cancelar')));
    openModal(box);
  });
}

/* ---------- Menú principal ---------- */
let tab = 'party';
export function openMenu(t) {
  if (t) tab = t;
  const g = State.game;
  const tabs = [['party', '👥 Grupo'], ['inv', '🎒 Inventario'], ['equip', '⚔️ Equipo'], ['quests', '📜 Misiones'], ['yukine', '💞 Yukine'], ['sys', '⚙️ Sistema']];
  const content = el('div', { class: 'menu-body' });
  const view = el('div', { class: 'menu-ov' },
    el('div', { class: 'menu-head' }, el('h2', {}, 'Menú'), el('div', { class: 'w-gold' }, `🪙 ${g.inventory.gold}`),
      el('button', { class: 'btn', onclick: () => { closeOverlay(); showWorld(); autosave(); } }, '✕ Cerrar')),
    el('div', { class: 'tabs' }, ...tabs.map(([id, label]) => el('button', { class: 'chip ' + (tab === id ? 'on' : ''), onclick: () => openMenu(id) }, label))), content);
  ({ party: renderParty, inv: renderInv, equip: renderEquip, quests: renderQuests, yukine: renderYukine, sys: renderSys })[tab](content);
  openOverlay(view, 'menu-ov-wrap');
}
const refresh = () => openMenu();

/* ---------- Grupo ---------- */
function renderParty(box) {
  for (const c of partyChars()) {
    const m = maxOf(c), def = classDef(c), need = c.level >= LEVEL_CAP ? null : xpNeed(c.level);
    const known = c.techniques.known.map(id => Data.tech[id]);
    const eq = c.techniques.equipped;
    const techs = el('div', { class: 'tech-list' }, ...known.map(t => {
      const on = eq.includes(t.id);
      return el('button', { class: 'tech-chip ' + (on ? 'on' : ''), title: t.desc, onclick: () => {
        if (on) { if (eq.length <= 1) return toast('Necesitas al menos 1 técnica equipada.'); eq.splice(eq.indexOf(t.id), 1); }
        else { if (eq.length >= 4) return toast('Máximo 4 técnicas equipadas. Quita una primero.'); eq.push(t.id); }
        refresh();
      } }, el('b', {}, (on ? '✔ ' : '') + t.name), el('small', {}, techLine(t)));
    }));
    const heals = known.filter(t => t.type === 'heal');
    const ult = Data.tech[def.ultimate];
    box.append(el('div', { class: 'char-card' },
      el('div', { class: 'cc-head' }, el('div', { class: 'avatar' }, c.name[0]), el('div', {},
        el('h3', {}, c.name, el('small', {}, ` Nv ${c.level}${c.id === 'protagonista' ? ` · ${def.name}` : ' · Loba de hielo'}`)),
        el('div', { class: 'xpline' }, need ? `XP ${c.xp}/${need}` : 'Nivel máximo (de momento)'), need ? bar('xp', c.xp / need * 100) : null)),
      el('div', { class: 'cc-stats' }, ...[['PV', c.hp + '/' + m.hp], ['PM', c.mp + '/' + m.mp], ['ATQ', m.atk], ['DEF', m.def], ['MAG', m.mag], ['VEL', m.spd]].map(([k, v]) => el('span', {}, el('small', {}, k), ` ${v}`))),
      bar('hp', c.hp / m.hp * 100), bar('mp', c.mp / m.mp * 100),
      isFainted(c) ? el('div', { class: 'err' }, '⚠ Debilitado — usa una Pluma de Fénix o descansa en una posada.') : null,
      el('h4', {}, `Técnicas (${eq.length}/4 equipadas) — haz clic para equipar/quitar`), techs,
      ult ? el('div', { class: 'ult-line' }, `★ Ulti: ${ult.name.replace(' (ULTI)', '')} — ${ult.desc}`) : null,
      heals.length ? el('div', { class: 'heal-row' }, ...heals.map(t => el('button', { class: 'btn', disabled: c.mp < t.mpCost || isFainted(c) ? 'disabled' : null, onclick: () => castHeal(c, t) }, `💚 ${t.name} (${t.mpCost} PM)`))) : null));
  }
}

async function castHeal(caster, t) {
  let targets;
  if (t.target === 'party') targets = partyChars().filter(c => !isFainted(c));
  else if (t.target === 'self') targets = [caster];
  else { const c = await pickChar(`${t.name}: ¿a quién?`, c => !isFainted(c)); if (!c) return; targets = [c]; }
  const m = maxOf(caster);
  const off = classDef(caster).hybrid ? (m.atk + m.mag) / 2 : m.mag;
  const amount = Math.round(t.power * (off + caster.level * 1.5) / 14);
  caster.mp -= t.mpCost; targets.forEach(x => healChar(x, amount));
  toast(`${t.name}: +${amount} PV`); refresh();
}

/* ---------- Inventario ---------- */
function renderInv(box) {
  const entries = Object.entries(items());
  if (!entries.length) return box.append(el('p', {}, 'Tu mochila está vacía.'));
  const groups = { consumable: 'Consumibles', scroll: 'Pergaminos', gift: 'Regalos', equipment: 'Equipamiento', key: 'Objetos clave' };
  for (const [type, label] of Object.entries(groups)) {
    const list = entries.filter(([id]) => Data.itemById[id].type === type); if (!list.length) continue;
    box.append(el('h4', {}, label));
    for (const [id, n] of list) {
      const it = Data.itemById[id];
      const row = el('div', { class: `inv-row ${it.rarity || ''}` }, el('span', { class: 'si' }, it.icon),
        el('div', { class: 'sd' }, el('b', {}, it.name), el('small', {}, ` ×${n}`), it.rarity ? el('span', { class: 'badge rar' }, it.rarity) : null,
          el('p', {}, it.desc + (it.bonus ? '  ' + bonusText(it.bonus) : ''))));
      if (type === 'consumable') row.append(el('button', { class: 'btn', onclick: () => useConsumable(id) }, 'Usar'));
      if (type === 'scroll') row.append(el('button', { class: 'btn', onclick: () => useScroll(id) }, 'Aprender'));
      if (type === 'gift') row.append(el('button', { class: 'btn', onclick: () => giveGift(id) }, 'Regalar a Yukine'));
      if (type === 'equipment') row.append(el('button', { class: 'btn', onclick: () => equipFlow(id) }, 'Equipar'));
      box.append(row);
    }
  }
}

async function useConsumable(id) {
  const it = Data.itemById[id], e = it.effect;
  const c = await pickChar(`${it.name}: ¿a quién?`, c => e.revive ? isFainted(c) : !isFainted(c));
  if (!c) return;
  if (e.revive) reviveChar(c, e.revive);
  else {
    const m = maxOf(c);
    if (e.heal) healChar(c, e.heal); if (e.healPct) healChar(c, Math.round(m.hp * e.healPct));
    if (e.mp) c.mp = Math.min(m.mp, c.mp + e.mp);
  }
  removeItem(id, 1); toast(`${c.name} usa ${it.name}`); refresh();
}

async function useScroll(id) {
  const it = Data.itemById[id], t = Data.tech[it.teaches];
  const c = await pickChar(`${it.name}: ¿quién la aprende?`, c => !c.techniques.known.includes(t.id));
  if (!c) { if (partyChars().every(x => x.techniques.known.includes(t.id))) toast('Todos conocen ya esta técnica.'); return; }
  c.techniques.known.push(t.id);
  if (c.techniques.equipped.length < 4) c.techniques.equipped.push(t.id);
  removeItem(id, 1); toast(`${c.name} aprende ${t.name}`); refresh();
}

async function giveGift(id) {
  if (!State.game.companions.yukine) return toast('Yukine aún no está contigo.');
  const it = Data.itemById[id]; removeItem(id, 1); addAffinity(it.affinity || 2);
  const lines = ['¿Es para mí? ...Gracias. No tenías por qué.', '¡Hmph! No lo necesitaba. ...Pero está muy bueno.', '¡Jo, qué detalle! Mi cola está moviéndose sola, no mires.'];
  await new Promise(res => { openModal(el('div', {}, el('h3', {}, `Regalas ${it.name}`), el('p', {}, `Yukine: «${lines[Math.floor(Math.random() * lines.length)]}»`))); $('#modal-close').addEventListener('click', res, { once: true }); });
  refresh();
}

/* ---------- Equipo ---------- */
const SLOTS_EQ = [['weapon', '🗡️ Arma'], ['armor', '🛡️ Armadura'], ['accessory', '📿 Accesorio']];
function equip(c, slot, id) {
  const cur = c.equipment[slot];
  if (cur) addItem(cur, 1);
  if (id) { removeItem(id, 1); c.equipment[slot] = id; } else delete c.equipment[slot];
  clampChar(c); refresh();
}
async function equipFlow(id) {
  const it = Data.itemById[id];
  const c = await pickChar(`Equipar ${it.name}: ¿a quién?`);
  if (c) equip(c, it.slot, id);
}
function renderEquip(box) {
  for (const c of partyChars()) {
    const card = el('div', { class: 'char-card' }, el('h3', {}, c.name));
    for (const [slot, label] of SLOTS_EQ) {
      const cur = c.equipment[slot] ? Data.itemById[c.equipment[slot]] : null;
      const owned = Object.keys(items()).filter(id => Data.itemById[id].slot === slot);
      card.append(el('div', { class: 'eq-slot' }, el('b', {}, label),
        el('div', { class: 'eq-cur' }, cur ? `${cur.icon} ${cur.name} — ${bonusText(cur.bonus)}` : '— vacío —'),
        el('div', { class: 'chips' }, ...owned.map(id => el('button', { class: 'chip', title: bonusText(Data.itemById[id].bonus), onclick: () => equip(c, slot, id) }, `${Data.itemById[id].icon} ${Data.itemById[id].name}`)),
          cur ? el('button', { class: 'chip', onclick: () => equip(c, slot, null) }, 'Quitar') : null)));
    }
    box.append(card);
  }
}

/* ---------- Misiones ---------- */
function renderQuests(box) {
  const g = State.game;
  const mk = (type, title) => {
    const list = Object.entries(Data.quests.quests).filter(([id, q]) => q.type === type && g.quests[id]);
    box.append(el('h4', {}, title));
    if (!list.length) return box.append(el('p', { class: 'hint' }, 'Nada por ahora.'));
    for (const [id, q] of list) {
      const st = questStatus(id);
      box.append(el('div', { class: `quest ${st}` }, el('b', {}, q.name), el('span', { class: 'badge' }, { active: 'En curso', ready: 'Lista para entregar', turned: 'Completada' }[st]),
        el('p', {}, q.desc),
        ...q.objectives.map(o => el('div', { class: 'obj' }, `${st === 'turned' ? '✔' : '•'} ${objProgress(id, o)}`)),
        st === 'ready' && q.giver ? el('small', { class: 'hint' }, 'Vuelve con quien te la encargó.') : null));
    }
  };
  mk('main', 'Historia principal'); mk('side', 'Misiones secundarias');
}

/* ---------- Relación con Yukine ---------- */
function renderYukine(box) {
  const g = State.game, y = g.companions.yukine;
  if (!y) return box.append(el('p', {}, 'Aún no has conocido a Yukine.'));
  const r = g.romance;
  box.append(el('div', { class: 'char-card' },
    el('div', { class: 'cc-head' }, el('div', { class: 'avatar' }, 'Y'), el('div', {}, el('h3', {}, 'Yukine'), el('div', { class: 'xpline' }, `Relación: ${STAGES[r.stage]}`))),
    el('div', { class: 'xpline' }, `💗 Afinidad: ${r.affinity}`), bar('aff', Math.min(100, r.affinity / 40 * 100)),
    el('p', { class: 'hint' }, 'Los eventos de la historia hacen avanzar la relación. Habla con ella, haz regalos y elige bien tus respuestas.')));
  box.append(el('h4', {}, 'Conversaciones'));
  const topics = Data.story.topics.filter(t => !g.flags['topic_' + t.id]);
  const avail = topics.filter(t => State.game && require_(t.if));
  if (!avail.length) box.append(el('p', { class: 'hint' }, 'Ya no hay temas nuevos por ahora. Avanza en la historia.'));
  box.append(el('div', { class: 'chips' }, ...avail.map(t => el('button', { class: 'chip', onclick: () => talkTopic(t) }, `💬 ${t.title}`))));
  if (r.stage >= 4) {
    box.append(el('h4', {}, 'A solas'), el('button', { class: 'btn', onclick: intimate }, '💞 Pasar tiempo a solas con Yukine'),
      el('p', { class: 'hint' }, 'Un momento de intimidad y descanso: recupera PV/PM de todos y sube la afinidad.'));
  }
}


async function talkTopic(t) {
  closeOverlay();
  await safe(async () => { await runScenes(t.scenes); State.game.flags['topic_' + t.id] = true; addAffinity(3); });
  showWorld(); openMenu('yukine');
}
async function intimate() {
  closeOverlay();
  await safe(async () => {
    const sc = Data.story.intimate[Math.floor(Math.random() * Data.story.intimate.length)];
    await runScenes(sc); addAffinity(2); partyChars().forEach(fullRestore);
  });
  showWorld(); openMenu('yukine'); autosave();
}

/* ---------- Sistema ---------- */
function renderSys(box) {
  box.append(el('div', { class: 'menu' },
    el('button', { class: 'btn primary', onclick: () => slotModal('save') }, '💾 Guardar partida'),
    el('button', { class: 'btn', onclick: () => slotModal('load') }, '📂 Cargar partida'),
    el('button', { class: 'btn', onclick: () => hooks.images() }, '🖼️ Ilustraciones que necesito de ti'),
    el('button', { class: 'btn ghost', onclick: () => { autosave(); closeOverlay(); hooks.toTitle(); } }, '🏠 Menú principal')));
}
