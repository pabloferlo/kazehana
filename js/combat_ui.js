/**
 * combat_ui.js — Interfaz del combate: tarjetas, intenciones enemigas, menús de acción,
 * reproducción de eventos con animaciones, partículas y pantalla de resultado.
 */
import { $, el, showScreen, toast } from './ui.js';
import { Data, State, addItem, addGold, items, removeItem } from './state.js';
import { Battle, makeEnemy, STATUS_INFO } from './combat.js';
import { partyChars, toUnit, syncBack, gainXp, isFainted, xpNeed, LEVEL_CAP } from './party.js';

const ELEM = {
  fuego: ['#ff6a3d', 'Fuego'], hielo: ['#8fd3ff', 'Hielo'], rayo: ['#ffe14d', 'Rayo'], arcano: ['#c27aff', 'Arcano'],
  fisico: ['#e8eefc', 'Físico'], imbuido: ['#7affc9', 'Imbuido'], oscuro: ['#8a5cff', 'Oscuro'], veneno: ['#8bd35a', 'Veneno'], objeto: ['#9fe9ff', 'Objeto']
};
const col = e => (ELEM[e] || ELEM.fisico)[0];
let fast = false;
const sleep = ms => new Promise(r => setTimeout(r, fast ? ms * 0.35 : ms));

/**
 * Lanza un combate completo.
 * @param {{enemies:string[], canFlee?:boolean, bg?:string}} cfg
 * @returns {Promise<{result:'win'|'lose'|'flee'}>}
 */
export async function runBattle(cfg) {
  const allies = partyChars().map(toUnit);
  const enemies = cfg.enemies.map((id, i) => makeEnemy(id, i));
  if (cfg.startUlt != null) allies.forEach(a => { a.ult = cfg.startUlt; });   // solo para depurar
  const battle = new Battle(allies, enemies, { canFlee: cfg.canFlee !== false && !enemies.some(e => e.boss) });
  const root = $('#screen-battle');
  const view = {};                                  // instantánea visual por uid
  for (const u of battle.all) view[u.uid] = { hp: u.hp, maxHp: u.maxHp, mp: u.mp, ult: u.ult, fx: { ...u.fx } };

  /* ---------- Construcción del DOM ---------- */
  const enemyRow = el('div', { class: 'b-enemies' });
  const allyRow = el('div', { class: 'b-allies' });
  const banner = el('div', { class: 'b-banner' });
  const log = el('div', { class: 'b-log' });
  const cmd = el('div', { class: 'b-cmd' });
  const fxLayer = el('div', { class: 'b-fx' });
  const roundLbl = el('div', { class: 'b-round' });
  const speedBtn = el('button', { class: 'btn ghost b-speed', onclick: () => { fast = !fast; speedBtn.textContent = fast ? '⏩ Rápido' : '▶ Normal'; } }, fast ? '⏩ Rápido' : '▶ Normal');
  const field = el('div', { class: 'battle' }, el('div', { class: 'b-bg', style: `background:${cfg.bg || ''}` }), fxLayer,
    el('div', { class: 'b-top' }, roundLbl, speedBtn), enemyRow, banner, log, allyRow, cmd);
  root.replaceChildren(field);
  showScreen('battle');

  const cards = {};
  const mkBar = cls => el('div', { class: 'bar ' + cls }, el('i'));
  const mkCard = u => {
    const isE = u.side === 'enemy';
    const sprite = isE
      ? el('div', { class: 'sprite', style: `--c:${u.color}` }, el('span', { class: 'emoji' }, u.emoji))
      : el('div', { class: 'avatar' }, u.name[0]);
    if (isE) { const img = new Image(); img.src = `assets/enemies/${u.id}.png`; img.className = 'sprite-img'; img.onload = () => { sprite.replaceChildren(img); }; }
    else { const img = new Image(); img.src = `assets/portraits/${u.id}/neutral.png`; img.onload = () => { sprite.replaceChildren(img); }; }
    const c = el('div', { class: `card ${isE ? 'enemy' : 'ally'} ${u.boss ? 'boss' : ''}`, 'data-uid': u.uid },
      el('div', { class: 'intent' }), sprite,
      el('div', { class: 'info' },
        el('div', { class: 'nm' }, u.name, el('small', {}, ` Nv ${u.level}`)),
        mkBar('hp'), el('div', { class: 'num hpnum' }),
        ...(isE ? [] : [mkBar('mp'), el('div', { class: 'num mpnum' }), mkBar('ult')]),
        el('div', { class: 'fx' })));
    cards[u.uid] = c; (isE ? enemyRow : allyRow).append(c);
    return c;
  };
  battle.enemies.forEach(mkCard); battle.allies.forEach(mkCard);

  function refresh(uid) {
    const u = battle.byUid(uid), v = view[uid], c = cards[uid]; if (!c) return;
    c.querySelector('.hp i').style.width = `${Math.max(0, v.hp / v.maxHp * 100)}%`;
    c.querySelector('.hpnum').textContent = `PV ${Math.max(0, Math.round(v.hp))}/${Math.round(v.maxHp)}`;
    c.classList.toggle('down', v.hp <= 0);
    if (u.side === 'ally') {
      c.querySelector('.mp i').style.width = `${v.mp / u.maxMp * 100}%`;
      c.querySelector('.mpnum').textContent = `PM ${Math.round(v.mp)}/${u.maxMp}`;
      const ub = c.querySelector('.ult i'); ub.style.width = `${v.ult}%`;
      c.querySelector('.ult').classList.toggle('full', v.ult >= 100 && !!u.ultTech);
      c.classList.toggle('locked-ult', !u.ultTech);
    }
    c.classList.toggle('wolf', !!v.fx.wolf);
    c.querySelector('.fx').replaceChildren(...Object.entries(v.fx).filter(([k]) => STATUS_INFO[k]).map(([k, t]) =>
      el('span', { class: 'fxi', title: `${STATUS_INFO[k][1]}${t < 99 ? ` (${t})` : ''}` }, STATUS_INFO[k][0])));
  }
  const refreshAll = () => battle.all.forEach(u => refresh(u.uid));
  function syncViews() { for (const u of battle.all) view[u.uid] = { hp: u.hp, maxHp: u.maxHp, mp: u.mp, ult: u.ult, fx: { ...u.fx } }; }

  function showIntents() {
    for (const e of battle.enemies) {
      const c = cards[e.uid], box = c.querySelector('.intent');
      const d = battle.describeIntent(e);
      c.classList.remove('charging');
      if (!d) { box.textContent = ''; box.className = 'intent'; continue; }
      box.className = `intent ${d.kind}`; box.textContent = `${d.icon} ${d.text}`;
      if (d.kind === 'charge' || d.kind === 'exec') c.classList.add('charging');
    }
  }
  const hideIntents = () => battle.enemies.forEach(e => { cards[e.uid].querySelector('.intent').textContent = ''; });

  /* ---------- Efectos visuales ---------- */
  function say(text, cls = '') { banner.className = 'b-banner show ' + cls; banner.textContent = text; }
  function clearBanner() { banner.className = 'b-banner'; }
  function logLine(t) { log.append(el('div', {}, t)); while (log.children.length > 4) log.firstChild.remove(); log.scrollTop = 1e6; }
  function float(uid, text, cls = '') {
    const c = cards[uid]; if (!c) return;
    const f = el('div', { class: 'float ' + cls }, text); c.append(f); setTimeout(() => f.remove(), 1300);
  }
  function burst(uid, color, n = 14) {
    const c = cards[uid]; if (!c) return;
    for (let i = 0; i < n; i++) {
      const p = el('span', { class: 'ptc' });
      const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 60;
      p.style.cssText = `--c:${color};--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;`;
      c.append(p); setTimeout(() => p.remove(), 800);
    }
  }
  const pulse = (uid, cls, ms = 500) => { const c = cards[uid]; if (!c) return; c.classList.add(cls); setTimeout(() => c.classList.remove(cls), ms); };
  async function cinematic(text, color, sub = '') {
    fxLayer.style.setProperty('--c', color);
    fxLayer.replaceChildren(el('div', { class: 'cine' }, el('div', { class: 'cine-t' }, text), el('div', { class: 'cine-s' }, sub)));
    field.classList.add('ult'); await sleep(1500); field.classList.remove('ult'); fxLayer.replaceChildren();
  }

  /* ---------- Reproducción de eventos ---------- */
  async function play(events) {
    for (const e of events) {
      switch (e.t) {
        case 'round': roundLbl.textContent = `Turno ${e.n}`; break;
        case 'defend': say(`🛡️ ${e.text}`); logLine(e.text); view[e.actor].mp = e.mp; view[e.actor].ult = e.ult; pulse(e.actor, 'guard', 700); refresh(e.actor); await sleep(550); break;
        case 'act': {
          const u = battle.byUid(e.actor); view[e.actor].mp = e.mp; view[e.actor].ult = e.ult === undefined ? view[e.actor].ult : (u.side === 'ally' ? e.ultv : 0);
          refresh(e.actor);
          const c = col(e.element);
          if (u.side === 'enemy') {
            say(`⚔️ ${u.name} usa ${e.name}`, 'enemy'); logLine(`${u.name} usa ${e.name}.`);
            (e.targets || []).forEach(t => cards[t]?.classList.add('targeted'));
          } else { say(`${u.name}: ${e.name}`, ''); logLine(`${u.name} usa ${e.name}.`); }
          banner.style.setProperty('--c', c);
          pulse(e.actor, 'acting', 700);
          if (e.ult) await cinematic(e.name.toUpperCase(), u.side === 'enemy' ? '#ff2d2d' : c, u.side === 'enemy' ? '¡Ataque especial!' : `¡Técnica definitiva de ${u.name}!`);
          else await sleep(650);
          break;
        }
        case 'charge': say(`⏳ ${e.text}`, 'warn'); logLine(e.text); pulse(e.actor, 'chargeflash', 900); cards[e.actor]?.classList.add('charging'); await sleep(1100); break;
        case 'hit': {
          const v = view[e.target]; v.hp = e.hp;
          const label = e.dot ? `${e.dmg}` : `${e.dmg}${e.crit ? '!' : ''}`;
          float(e.target, label, e.crit ? 'crit' : e.dot ? 'dot' : 'dmg');
          if (e.weak) float(e.target, '¡DÉBIL!', 'tag weak'); else if (e.resist) float(e.target, 'Resiste', 'tag resist');
          if (e.crit) float(e.target, '¡CRÍTICO!', 'tag crit');
          if (e.guard) float(e.target, '🛡️', 'tag');
          pulse(e.target, 'hurt', 450); burst(e.target, col(e.element), e.crit ? 22 : 12);
          if (!e.dot) logLine(`${battle.byUid(e.target).name} recibe ${e.dmg} de daño${e.weak ? ' (¡débil!)' : e.resist ? ' (resistido)' : ''}.`);
          refresh(e.target); await sleep(e.dot ? 350 : 520); break;
        }
        case 'dodge': float(e.target, '¡ESQUIVA!', 'dodge'); pulse(e.target, 'dodging', 500); logLine(e.text); await sleep(600); break;
        case 'heal': view[e.target].hp = e.hp; float(e.target, `+${e.amount}`, 'heal'); burst(e.target, '#7dffa0', 8); refresh(e.target); await sleep(e.regen ? 300 : 500); break;
        case 'mp': view[e.target].mp = e.mp; float(e.target, `+${e.amount} PM`, 'mp'); refresh(e.target); await sleep(400); break;
        case 'status': view[e.target].fx = e.fx; float(e.target, e.text, 'tag status'); refresh(e.target); await sleep(350); break;
        case 'revive': view[e.target].hp = e.hp; view[e.target].fx = {}; float(e.target, '¡Revive!', 'heal'); logLine(e.text); refresh(e.target); await sleep(600); break;
        case 'faint': view[e.target].hp = 0; cards[e.target]?.classList.remove('charging', 'targeted'); logLine(e.text); say(e.text, 'warn'); refresh(e.target); await sleep(700); break;
        case 'msg': logLine(e.text); say(e.text, e.interrupt ? '' : 'warn'); if (e.interrupt) float(e.target, '¡INTERRUMPIDO!', 'tag weak'); await sleep(750); break;
        case 'enrage': say(e.text, 'enemy'); logLine(e.text); field.classList.add('enrage'); pulse(e.target, 'chargeflash', 900); await sleep(1200); break;
        case 'transform': {
          view[e.actor].hp = e.hp; view[e.actor].maxHp = e.maxHp; view[e.actor].fx = e.fx; logLine(e.text);
          await cinematic('AULLIDO LUNAR', '#bfe6ff', e.text);
          refresh(e.actor); burst(e.actor, '#bfe6ff', 30); break;
        }
        case 'unwolf': view[e.actor].hp = e.hp; view[e.actor].maxHp = e.maxHp; view[e.actor].fx = { ...(view[e.actor].fx) }; delete view[e.actor].fx.wolf; logLine(e.text); refresh(e.actor); await sleep(400); break;
        case 'tick': syncViews(); refreshAll(); break;
        case 'end': break;
      }
      if (e.t === 'act' || e.t === 'faint') { /* mantiene banner hasta el siguiente */ }
      if (e.t === 'hit' || e.t === 'dodge') Object.values(cards).forEach(c => c.classList.remove('targeted'));
    }
    Object.values(cards).forEach(c => c.classList.remove('targeted'));
    clearBanner(); syncViews(); refreshAll();
  }

  /* ---------- Menú de acciones ---------- */
  function targetMode(kind, info) {
    return new Promise(res => {
      const pool = kind === 'enemy' ? battle.alive('enemy') : kind === 'ally_any' ? battle.allies : battle.alive('ally');
      const done = v => { Object.values(cards).forEach(c => { c.classList.remove('targetable'); c.onclick = null; }); res(v); };
      pool.forEach(u => { cards[u.uid].classList.add('targetable'); cards[u.uid].onclick = () => done(u.uid); });
      cmd.replaceChildren(el('div', { class: 'cmd-head' }, info || 'Elige un objetivo…'),
        el('button', { class: 'btn', onclick: () => done(null) }, '← Cancelar'));
    });
  }

  function chooseAction(unit, idx) {
    return new Promise(res => {
      const info = el('div', { class: 'cmd-info' }, 'Elige una acción.');
      const show = t => { info.textContent = t; };
      const main = () => {
        const techRow = el('div', { class: 'tech-grid' });
        for (const id of unit.techs) {
          const t = Data.tech[id]; const ok = unit.mp >= t.mpCost;
          const b = el('button', { class: 'btn tech', style: `--c:${col(t.element)}`, title: t.desc, disabled: ok ? null : 'disabled',
            onclick: async () => {
              let target = null;
              if (t.target === 'enemy') target = await targetMode('enemy', `${t.name}: elige enemigo`);
              else if (t.target === 'ally') target = await targetMode('ally', `${t.name}: elige aliado`);
              if ((t.target === 'enemy' || t.target === 'ally') && !target) return main();
              res({ actor: unit.uid, kind: 'tech', tech: id, target });
            } }, el('b', {}, t.name), el('small', {}, `${ELEM[t.element]?.[1] || ''} · ${t.mpCost} PM · ${t.type === 'heal' ? 'cura' : t.type === 'buff' ? 'apoyo' : t.type === 'debuff' ? 'debilita' : t.type === 'utility' ? 'utilidad' : `pot. ${t.power}`}`));
          b.addEventListener('mouseenter', () => show(`${t.desc}`));
          techRow.append(b);
        }
        const row = el('div', { class: 'cmd-row' });
        const ultReady = unit.ultTech && view[unit.uid].ult >= 100;
        if (unit.ultTech) {
          const ut = Data.tech[unit.ultTech];
          row.append(el('button', { class: 'btn ult-btn', disabled: ultReady ? null : 'disabled', title: ut.desc,
            onclick: async () => {
              let target = null;
              if (ut.target === 'enemy') { target = await targetMode('enemy', `${ut.name}: elige enemigo`); if (!target) return main(); }
              res({ actor: unit.uid, kind: 'ult', tech: unit.ultTech, target });
            } }, `★ ${ut.name.replace(' (ULTI)', '')} ${ultReady ? '' : `(${Math.floor(view[unit.uid].ult)}%)`}`));
        } else if (unit.id === 'yukine') row.append(el('button', { class: 'btn', disabled: 'disabled' }, '★ Ulti bloqueada'));
        row.append(
          el('button', { class: 'btn', onclick: itemMenu }, '🎒 Objeto'),
          el('button', { class: 'btn', onclick: () => res({ actor: unit.uid, kind: 'defend' }) }, '🛡️ Defender'),
          ...(battle.opts.canFlee ? [el('button', { class: 'btn ghost', onclick: () => res({ actor: unit.uid, kind: 'flee' }) }, '🏃 Huir')] : []),
          ...(idx > 0 ? [el('button', { class: 'btn ghost', onclick: () => res({ back: true }) }, '↩ Anterior')] : []));
        cmd.replaceChildren(el('div', { class: 'cmd-head' }, `Turno de `, el('b', {}, unit.name)), techRow, row, info);
      };
      const itemMenu = () => {
        const list = Object.entries(items()).filter(([id]) => Data.itemById[id]?.type === 'consumable');
        const grid = el('div', { class: 'tech-grid' });
        if (!list.length) grid.append(el('div', { class: 'cmd-info' }, 'No tienes objetos.'));
        for (const [id, n] of list) {
          const it = Data.itemById[id];
          grid.append(el('button', { class: 'btn tech', style: '--c:#9fe9ff', title: it.desc, onclick: async () => {
            const t = await targetMode(it.effect.revive ? 'ally_any' : 'ally', `${it.name}: elige aliado`);
            if (!t) return itemMenu();
            removeItem(id, 1);
            res({ actor: unit.uid, kind: 'item', item: id, target: t });
          } }, el('b', {}, `${it.icon} ${it.name}`), el('small', {}, `×${n} · ${it.desc}`)));
        }
        cmd.replaceChildren(el('div', { class: 'cmd-head' }, 'Objetos'), grid, el('button', { class: 'btn', onclick: main }, '← Volver'));
      };
      main();
    });
  }

  /* ---------- Bucle principal ---------- */
  if (cfg.intro) { say(cfg.intro, 'enemy'); await sleep(1300); clearBanner(); }
  refreshAll();
  while (!battle.over) {
    await play(battle.startRound());
    showIntents();
    const chosen = [];
    const order = battle.alive('ally');
    for (let i = 0; i < order.length;) {
      const a = await chooseAction(order[i], i);
      if (a.back) { chosen.pop(); i--; continue; }
      chosen[i] = a; i++;
    }
    cmd.replaceChildren(el('div', { class: 'cmd-head' }, '…'));
    hideIntents();
    await play(battle.resolve(chosen));
  }
  cmd.replaceChildren(); field.classList.remove('enrage');
  battle.allies.forEach(syncBack);

  /* ---------- Resultado ---------- */
  if (battle.result === 'win') {
    const r = battle.rewards();
    const g = State.game; addGold(r.gold);
    r.loot.forEach(i => addItem(i, 1)); r.kills.forEach(k => { g.kills[k] = (g.kills[k] || 0) + 1; });
    const lines = [];
    for (const ch of partyChars()) {
      const before = ch.level; const share = isFainted(ch) ? Math.floor(r.xp / 2) : r.xp;
      const res = gainXp(ch, share);
      lines.push(el('div', { class: 'res-line' }, `${ch.name}: +${share} XP` + (res.levels ? `  ⬆ Nivel ${before} → ${ch.level}` : ''),
        ...res.learned.map(t => el('div', { class: 'res-learn' }, `✨ Aprende: ${Data.tech[t].name}`))));
    }
    await showResult('¡VICTORIA!', 'win', [
      el('div', { class: 'res-line' }, `🪙 +${r.gold} monedas`),
      ...(r.loot.length ? [el('div', { class: 'res-line' }, `🎁 ${r.loot.map(i => Data.itemById[i].name).join(', ')}`)] : []), ...lines]);
  } else if (battle.result === 'lose') {
    await showResult('DERROTA', 'lose', [el('div', { class: 'res-line' }, 'Ambos habéis caído…')]);
  }
  return { result: battle.result };

  function showResult(title, cls, nodes) {
    return new Promise(res => {
      field.append(el('div', { class: 'b-result ' + cls }, el('h2', {}, title), ...nodes,
        el('button', { class: 'btn primary', onclick: () => res() }, 'Continuar')));
    });
  }
}
