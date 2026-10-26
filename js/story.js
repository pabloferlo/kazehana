/**
 * story.js — Motor de escenas/diálogos.
 * Soporta: máquina de escribir, retratos por emoción, elecciones con respuesta,
 * condiciones (if), afinidad con Yukine y acciones (battle, quest, item, flag…).
 */
import { $, el, showScreen, portraitNode, toast, applyBgImage, bgIdFor } from './ui.js';
import { Data, State, fillTemplate, addItem, addGold, rollItem } from './state.js';
import { cond, giveQuest, turnIn, autoCompleteMain } from './quests.js';
import { joinYukine, partyChars, fullRestore } from './party.js';

const EMOTIONS = {
  neutral: '', happy: '😊 Alegre', sad: '😢 Triste', angry: '😠 Furioso/a',
  shy: '😳 Tímida', determined: '🔥 Decidido/a', afraid: '😨 Asustado/a',
  smug: '😏 Pícara', cold: '🧊 Frío/a', wolf: '🐺 Loba'
};

/* ---------- Acciones ---------- */
const handlers = {};
export function registerAction(type, fn) { handlers[type] = fn; }

export function addAffinity(n) {
  const r = State.game.romance; r.affinity = Math.max(0, r.affinity + n);
  if (n) toast(`💗 Yukine ${n > 0 ? '+' : ''}${n}`);
}

async function runAction(a) {
  const g = State.game;
  switch (a.type) {
    case 'flag': g.flags[a.flag] = true; break;
    case 'item': { const iid = rollItem(a.id); if (iid) { addItem(iid, a.qty || 1); toast(`Obtienes: ${Data.itemById[iid].name}`); } break; }
    case 'gold': addGold(a.amount); toast(`+${a.amount} 🪙`); break;
    case 'affinity': addAffinity(a.value); break;
    case 'stage': g.romance.stage = Math.max(g.romance.stage, a.value); break;
    case 'stagecheck': if (g.romance.affinity >= a.minAff) g.romance.stage = Math.max(g.romance.stage, a.value); break;
    case 'joinYukine': joinYukine(); toast('Yukine se une al grupo'); break;
    case 'heal': partyChars().forEach(fullRestore); toast('El grupo se recupera por completo'); break;
    case 'quest':
      if (a.op === 'give') { if (giveQuest(a.id)) toast(`Nueva misión: ${Data.quests.quests[a.id].name}`); }
      else if (a.op === 'turnin') { const l = turnIn(a.id); if (l) toast(`Misión completada: ${Data.quests.quests[a.id].name}${l.length ? ' — ' + l.join(', ') : ''}`, 3500); }
      break;
    default: if (handlers[a.type]) return handlers[a.type](a);
  }
}
async function runActions(list) { for (const a of list || []) await runAction(a); }

/* ---------- Escritura y avance ---------- */
function typeText(node, text, speed = 14) {
  let i = 0, timer, resolveFn;
  const done = new Promise(res => (resolveFn = res));
  node.textContent = '';
  timer = setInterval(() => { node.textContent = text.slice(0, ++i); if (i >= text.length) { clearInterval(timer); resolveFn(); } }, speed);
  return { done, skip() { clearInterval(timer); node.textContent = text; resolveFn(); } };
}

function waitAdvance() {
  return new Promise(res => {
    const dlg = $('#dialogue');
    const go = () => { cleanup(); res(); };
    const key = e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); go(); } };
    const cleanup = () => { dlg.removeEventListener('click', go); document.removeEventListener('keydown', key); };
    dlg.addEventListener('click', go);
    document.addEventListener('keydown', key);
  });
}

function matchesAge(scene, age) {
  if (scene.minAge && age < scene.minAge) return false;
  if (scene.maxAge && age > scene.maxAge) return false;
  return true;
}

async function playLine(scene) {
  const g = State.game;
  if (scene.bg) {
    const bgNode = $('#story-bg'); bgNode.style.background = scene.bg;
    const bid = bgIdFor(scene.bg, Data) || (/^[\w-]+$/.test(scene.bg) ? scene.bg : null);
    if (bid) applyBgImage(bgNode, [bid], 0.25);
  }
  const pHost = $('#story-portrait'); pHost.replaceChildren();
  if (scene.char) pHost.append(portraitNode(scene.char, scene.emotion || 'neutral', scene.speaker));

  $('#dlg-speaker').textContent = scene.narration ? '' : fillTemplate(scene.speaker || '', g);
  $('#dlg-emotion').textContent = EMOTIONS[scene.emotion] || '';
  const textNode = $('#dlg-text');
  textNode.classList.toggle('narration', !!scene.narration);
  $('#dlg-choices').replaceChildren(); $('#dlg-hint').style.display = 'none';

  const typing = typeText(textNode, fillTemplate(scene.text, g));
  const dlg = $('#dialogue'); const skip = () => typing.skip();
  dlg.addEventListener('click', skip);
  await typing.done; dlg.removeEventListener('click', skip);

  const choices = (scene.choices || []).filter(c => cond(c.if));
  if (choices.length) {
    const chosen = await new Promise(res => {
      const box = $('#dlg-choices');
      choices.forEach(c => box.append(el('button', { class: 'btn', onclick: ev => { ev.stopPropagation(); box.replaceChildren(); res(c); } }, fillTemplate(c.label, g))));
    });
    if (chosen.setFlag) g.flags[chosen.setFlag] = true;
    if (chosen.aff) addAffinity(chosen.aff);
    await runActions(chosen.actions);
    for (const r of chosen.reply || []) await playLine(r);
  } else {
    $('#dlg-hint').style.display = '';
    await new Promise(r => setTimeout(r, 60));
    await waitAdvance();
  }
  if (scene.setFlag) g.flags[scene.setFlag] = true;
  await runActions(scene.actions);
}

/** Reproduce una lista de escenas (o la clave de story.json). */
export async function runScenes(scenes) {
  if (typeof scenes === 'string') scenes = Data.story[scenes];
  showScreen('story');
  const age = State.game?.player?.age ?? 18;
  for (const sc of scenes) {
    if (!matchesAge(sc, age) || !cond(sc.if)) continue;
    await playLine(sc);
    showScreen('story');
  }
  const done = autoCompleteMain();
  done.forEach((t, i) => setTimeout(() => toast(t, 3500), i * 600));
}
