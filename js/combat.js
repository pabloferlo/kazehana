/**
 * combat.js — Motor de combate por turnos (lógica pura, sin DOM).
 *
 * Ronda:  startRound() → el enemigo muestra su intención
 *         resolve(acciones) → se ejecutan todas las acciones por velocidad
 * Cada método devuelve una lista de eventos que la interfaz reproduce.
 *
 * Estados (unit.fx = { nombre: turnosRestantes }):
 *   burn/poison (daño por turno), slow, freeze/stun (pierde el turno),
 *   atk_up/atk_down, def_up/def_down, spd_up, dodge_up, regen, wolf (forma de loba)
 */
import { Data } from './state.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = () => Math.random();
const pick = arr => arr[Math.floor(rnd() * arr.length)];

export const STATUS_INFO = {
  burn: ['🔥', 'Quemadura'], poison: ['☠️', 'Veneno'], slow: ['🐌', 'Lentitud'],
  freeze: ['🧊', 'Congelado'], stun: ['💫', 'Aturdido'],
  atk_up: ['⚔️⬆', 'Ataque ↑'], atk_down: ['⚔️⬇', 'Ataque ↓'],
  def_up: ['🛡️⬆', 'Defensa ↑'], def_down: ['🛡️⬇', 'Defensa ↓'],
  spd_up: ['💨⬆', 'Velocidad ↑'], dodge_up: ['🌀', 'Esquiva ↑'],
  regen: ['💚', 'Regeneración'], wolf: ['🐺', 'Forma de loba']
};

/** Crea una unidad enemiga a partir de enemies.json. */
export function makeEnemy(id, idx) {
  const d = Data.enemies.enemies[id];
  if (!d) throw new Error('Enemigo desconocido: ' + id);
  return {
    uid: 'e_' + idx, id, name: d.name, side: 'enemy', def: d, level: d.level,
    maxHp: d.hp, hp: d.hp, maxMp: 0, mp: 0,
    atk: d.atk, def_: d.def, mag: d.mag, spd: d.spd, hybrid: false,
    get defStat() { return this.def_; },
    fx: {}, ult: 0, dodgeBonus: d.dodgeBonus || 0,
    weak: d.weak || [], resist: d.resist || [], immune: d.immune || [],
    emoji: d.emoji, color: d.color, boss: !!d.boss, turns: 0, charging: null, intent: null, enraged: false
  };
}

export class Battle {
  /**
   * @param {object[]} allies   unidades aliadas (party.toUnit)
   * @param {object[]} enemies  unidades enemigas (makeEnemy)
   * @param {object} opts       { canFlee, bg }
   */
  constructor(allies, enemies, opts = {}) {
    this.allies = allies; this.enemies = enemies; this.opts = { canFlee: true, ...opts };
    this.round = 0; this.over = false; this.result = null; this.events = [];
    this.defeated = [];
  }
  get all() { return [...this.allies, ...this.enemies]; }
  byUid(uid) { return this.all.find(u => u.uid === uid); }
  alive(side) { return (side === 'ally' ? this.allies : this.enemies).filter(u => u.hp > 0); }
  foes(u) { return u.side === 'ally' ? this.enemies : this.allies; }
  friends(u) { return u.side === 'ally' ? this.allies : this.enemies; }
  ev(e) { this.events.push(e); }
  flush() { const e = this.events; this.events = []; return e; }

  /* ---------- Estadísticas efectivas ---------- */
  S(u, k) {
    let v = k === 'def' ? (u.def_ ?? u.def) : u[k];
    const f = u.fx;
    if ((k === 'atk' || k === 'mag') && f.atk_up) v *= 1.35;
    if ((k === 'atk' || k === 'mag') && f.atk_down) v *= 0.7;
    if (k === 'def' && f.def_up) v *= 1.4;
    if (k === 'def' && f.def_down) v *= 0.7;
    if (k === 'spd') { if (f.spd_up) v *= 1.4; if (f.slow) v *= 0.7; }
    return v;
  }

  /* ---------- Inicio de ronda ---------- */
  startRound() {
    this.round++;
    this.events = [];
    for (const u of this.all) u.defending = false;
    this.ev({ t: 'round', n: this.round });
    for (const e of this.alive('enemy')) this.decideIntent(e);
    return this.flush();
  }

  pickTarget(e, skill) {
    const foes = this.alive('ally'); if (!foes.length) return null;
    if (rnd() < 0.25) return foes.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b)).uid;
    return pick(foes).uid;
  }

  decideIntent(e) {
    if (e.charging) { e.intent = { skill: e.charging, exec: true, target: this.pickTarget(e, e.charging) }; return; }
    e.turns++;
    const d = e.def; let skill;
    if (d.ultimate && e.turns % d.ultimate.every === 0) skill = { ...d.ultimate, isUlt: true };
    else {
      const pool = d.skills.filter(s => !s.minRound || this.round >= s.minRound);
      const total = pool.reduce((a, s) => a + (s.weight || 1), 0);
      let r = rnd() * total; skill = pool[0];
      for (const s of pool) { r -= (s.weight || 1); if (r <= 0) { skill = s; break; } }
    }
    if (skill.charge) e.intent = { skill, charging: true };
    else e.intent = { skill, target: skill.target === 'enemy' ? this.pickTarget(e, skill) : null };
  }

  /** Texto descriptivo de la intención para la interfaz. */
  describeIntent(e) {
    if (e.hp <= 0) return null;
    if (e.fx.freeze || e.fx.stun) return { icon: '💤', text: 'Incapacitado', kind: 'disabled' };
    const it = e.intent; if (!it) return null;
    const s = it.skill;
    if (it.charging) return { icon: '⏳', text: `Cargando: ${s.name}`, kind: 'charge' };
    if (it.exec) return { icon: '💥', text: `¡${s.name}!`, kind: 'exec' };
    const type = s.type || 'attack';
    if (type === 'buff') return { icon: '✨', text: s.name, kind: 'buff' };
    if (type === 'debuff') return { icon: '🌀', text: `${s.name}`, kind: 'debuff' };
    const tgt = s.target === 'all_enemies' ? 'a todos' : (this.byUid(it.target)?.name ?? '');
    return { icon: s.target === 'all_enemies' ? '🌊' : '⚔️', text: `${s.name} → ${tgt}`, kind: 'attack', target: it.target };
  }

  /* ---------- Resolución de la ronda ---------- */
  resolve(actions) {
    this.events = [];
    const acts = [];
    for (const a of actions) {
      const unit = this.byUid(a.actor); if (!unit || unit.hp <= 0) continue;
      const prio = a.kind === 'defend' ? 3 : (a.kind === 'item' ? 2 : a.kind === 'flee' ? 1 : 0);
      acts.push({ ...a, unit, prio });
    }
    for (const e of this.alive('enemy')) acts.push({ kind: 'enemy', unit: e, prio: 0 });
    acts.sort((a, b) => b.prio - a.prio || (this.S(b.unit, 'spd') + rnd() * 4) - (this.S(a.unit, 'spd') + rnd() * 4));
    for (const act of acts) {
      if (this.over) break;
      if (act.unit.hp <= 0) continue;
      this.runAct(act);
      this.checkEnd();
    }
    if (!this.over) { this.endRound(); this.checkEnd(); }
    return this.flush();
  }

  /** ¿Pierde el turno por congelación / aturdimiento? */
  disabled(u) {
    for (const k of ['freeze', 'stun']) {
      if (u.fx[k]) {
        delete u.fx[k];
        this.ev({ t: 'msg', text: `${u.name} está ${k === 'freeze' ? 'congelado' : 'aturdido'} y pierde el turno.`, target: u.uid, status: k });
        if (u.charging) { u.charging = null; this.ev({ t: 'msg', text: `¡Se interrumpe la carga de ${u.name}!`, target: u.uid, interrupt: true }); }
        return true;
      }
    }
    return false;
  }

  runAct(act) {
    const u = act.unit;
    if (this.disabled(u)) return;
    if (act.kind === 'defend') {
      u.defending = true; u.mp = Math.min(u.maxMp, u.mp + 6); u.ult = Math.min(100, u.ult + 6);
      return this.ev({ t: 'defend', actor: u.uid, text: `${u.name} se pone en guardia.`, mp: u.mp, ult: u.ult });
    }
    if (act.kind === 'flee') return this.tryFlee(u);
    if (act.kind === 'item') return this.useItem(u, act);
    if (act.kind === 'enemy') return this.enemyAct(u);
    const tech = Data.tech[act.tech];
    if (!tech) return;
    if (act.kind === 'ult') { if (u.ult < 100 || !u.ultTech) return; u.ult = 0; }
    else { if (u.mp < tech.mpCost) return this.ev({ t: 'msg', text: `${u.name} no tiene PM suficientes.` }); u.mp -= tech.mpCost; u.ult = Math.min(100, u.ult + 5); }
    this.doTech(u, tech, this.targetsFor(u, tech, act.target));
  }

  targetsFor(u, tech, targetUid) {
    const foes = this.alive(u.side === 'ally' ? 'enemy' : 'ally'), friends = this.alive(u.side);
    switch (tech.target) {
      case 'all_enemies': return foes;
      case 'party': return friends;
      case 'self': return [u];
      case 'ally': { const t = this.byUid(targetUid); return [t && t.hp > 0 && t.side === u.side ? t : u]; }
      default: { const t = this.byUid(targetUid); return [t && t.hp > 0 && t.side !== u.side ? t : foes[0]].filter(Boolean); }
    }
  }

  /* ---------- Turno enemigo ---------- */
  enemyAct(e) {
    const it = e.intent; if (!it) return;
    const s = it.skill;
    if (it.charging) {
      e.charging = s;
      return this.ev({ t: 'charge', actor: e.uid, text: s.chargeText || `¡${e.name} concentra energía!`, name: s.name });
    }
    e.charging = null;
    const tech = { type: s.type || 'attack', name: s.name, element: s.element || 'fisico', power: s.power || 0, target: s.target || 'enemy',
      effect: s.effect || null, stat: s.stat, enemyUlt: !!s.isUlt, ultimate: !!s.isUlt };
    let targets;
    if (tech.target === 'enemy') { const t = this.byUid(it.target); targets = [t && t.hp > 0 ? t : pick(this.alive('ally'))]; }
    else targets = this.targetsFor(e, tech);
    this.doTech(e, tech, targets.filter(Boolean));
  }

  /* ---------- Técnicas ---------- */
  doTech(actor, tech, targets) {
    this.ev({ t: 'act', actor: actor.uid, name: tech.name, element: tech.element, ult: !!tech.ultimate, mp: actor.mp, ultv: actor.ult, targets: targets.map(t => t.uid) });
    switch (tech.type) {
      case 'attack': for (const t of targets) { if (this.over) break; this.hit(actor, tech, t); } break;
      case 'heal': for (const t of targets) this.heal(actor, tech, t); break;
      case 'buff': for (const t of targets) this.applyFx(t, tech.effect, `${tech.name}`, true); break;
      case 'debuff': for (const t of targets) this.applyFx(t, tech.effect, `${tech.name}`, false); break;
      case 'utility': if (tech.effect?.mp_restore) { actor.mp = Math.min(actor.maxMp, actor.mp + tech.effect.mp_restore); this.ev({ t: 'mp', target: actor.uid, amount: tech.effect.mp_restore, mp: actor.mp }); } break;
      case 'ultimate': this.transformWolf(actor, tech); break;
    }
    this.checkEnrage();
  }

  offense(actor, tech) {
    const stat = tech.stat || (tech.element === 'fisico' ? 'atk' : 'mag');
    if (actor.hybrid && stat === 'mag') return (this.S(actor, 'atk') + this.S(actor, 'mag')) / 2;
    if (actor.hybrid && tech.element === 'imbuido') return (this.S(actor, 'atk') + this.S(actor, 'mag')) / 2;
    return this.S(actor, stat);
  }

  dodgeChance(actor, t) {
    const base = 0.03 + (this.S(t, 'spd') - this.S(actor, 'spd')) * 0.01 + (t.dodgeBonus || 0) + (t.fx.dodge_up ? 0.2 : 0);
    return clamp(base, 0, 0.5);
  }

  hit(actor, tech, t) {
    if (rnd() < this.dodgeChance(actor, t)) return this.ev({ t: 'dodge', target: t.uid, text: `¡${t.name} esquiva!` });
    const eff = tech.effect || {};
    const raw = tech.power * (this.offense(actor, tech) + actor.level * 1.5) / 25;
    const def = this.S(t, 'def') * (1 - (eff.ignore_def || 0));
    let dmg = raw * 30 / (30 + def);
    const weak = t.weak?.includes(tech.element), resist = t.resist?.includes(tech.element);
    if (weak) dmg *= 1.5; if (resist) dmg *= 0.6;
    const crit = rnd() < 0.06 + (eff.crit_up || 0) + (actor.fx.wolf ? 0.1 : 0);
    if (crit) dmg *= 1.5;
    if (actor.fx.wolf) dmg *= 1.5;
    if (t.defending) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg * (0.92 + rnd() * 0.16)));
    t.hp = Math.max(0, t.hp - dmg);
    if (t.side === 'ally') t.ult = Math.min(100, t.ult + 7);
    this.ev({ t: 'hit', target: t.uid, dmg, crit, weak, resist, hp: t.hp, element: tech.element, guard: !!t.defending });
    if (t.hp <= 0) return this.faint(t);
    for (const k of ['burn', 'poison', 'slow', 'freeze', 'stun'])
      if (eff[k] && rnd() < eff[k]) this.status(t, k, k === 'freeze' || k === 'stun' ? 1 : 3);
    if (eff.def_down) this.status(t, 'def_down', eff.def_down);
    if (eff.atk_up && actor.side === 'ally') this.status(actor, 'atk_up', eff.atk_up);
  }

  status(t, k, turns) {
    if (t.immune?.includes(k)) return this.ev({ t: 'msg', text: `${t.name} es inmune.`, target: t.uid, immune: true });
    if (t.hp <= 0) return;
    if (k === 'freeze' || k === 'stun') { t.fx[k] = 1; if (t.charging) { t.charging = null; this.ev({ t: 'msg', text: `¡Se interrumpe la carga de ${t.name}!`, target: t.uid, interrupt: true }); } }
    else t.fx[k] = Math.max(t.fx[k] || 0, turns);
    this.ev({ t: 'status', target: t.uid, status: k, text: `${STATUS_INFO[k]?.[1] || k}`, fx: { ...t.fx } });
  }

  applyFx(t, effect, name, good) {
    if (!effect) return;
    for (const [k, v] of Object.entries(effect)) this.status(t, k, v);
  }

  heal(actor, tech, t) {
    const revive = t.hp <= 0;
    if (revive) return;
    const off = actor.hybrid ? (this.S(actor, 'atk') + this.S(actor, 'mag')) / 2 : this.S(actor, 'mag');
    const amount = Math.round(tech.power * (off + actor.level * 1.5) / 14);
    const before = t.hp; t.hp = Math.min(t.maxHp, t.hp + amount);
    this.ev({ t: 'heal', target: t.uid, amount: t.hp - before, hp: t.hp });
    if (tech.effect?.regen) this.status(t, 'regen', tech.effect.regen);
  }

  /** Aullido Lunar: transformación de Yukine. */
  transformWolf(actor, tech) {
    const eff = tech.effect || {};
    const bonus = Math.round(actor.maxHp * 0.4);
    actor.maxHp += bonus; actor.wolfBonus = (actor.wolfBonus || 0) + bonus;
    actor.hp = Math.min(actor.maxHp, actor.hp + bonus + Math.round(actor.maxHp * (eff.heal || 0.4)));
    actor.fx.wolf = (eff.transform_wolf || 3) + 1;
    actor.fx.atk_up = actor.fx.wolf;
    this.ev({ t: 'transform', actor: actor.uid, text: `¡${actor.name} aúlla a la luna y se transforma en loba!`, hp: actor.hp, maxHp: actor.maxHp, fx: { ...actor.fx } });
    for (const a of this.alive('ally')) {
      if (a === actor) continue;
      a.fx.atk_up = (eff.transform_wolf || 3) + 1;
      const h = Math.round(a.maxHp * 0.25); const before = a.hp; a.hp = Math.min(a.maxHp, a.hp + h);
      this.ev({ t: 'heal', target: a.uid, amount: a.hp - before, hp: a.hp });
      this.ev({ t: 'status', target: a.uid, status: 'atk_up', text: 'Ataque ↑ (Aullido)', fx: { ...a.fx } });
    }
  }

  /* ---------- Objetos y huida ---------- */
  useItem(u, act) {
    const it = Data.itemById[act.item]; if (!it?.effect) return;
    const t = this.byUid(act.target) || u; const e = it.effect;
    this.ev({ t: 'act', actor: u.uid, name: it.name, element: 'objeto', ult: false, mp: u.mp, ultv: u.ult, targets: [t.uid] });
    if (e.revive) {
      if (t.hp > 0) return this.ev({ t: 'msg', text: 'No surte efecto.' });
      t.hp = Math.max(1, Math.round(t.maxHp * e.revive)); t.fx = {};
      return this.ev({ t: 'revive', target: t.uid, hp: t.hp, text: `¡${t.name} se levanta de nuevo!` });
    }
    if (t.hp <= 0) return this.ev({ t: 'msg', text: 'No surte efecto sobre un aliado debilitado.' });
    if (e.heal || e.healPct) {
      const amt = e.heal || Math.round(t.maxHp * e.healPct); const b = t.hp; t.hp = Math.min(t.maxHp, t.hp + amt);
      this.ev({ t: 'heal', target: t.uid, amount: t.hp - b, hp: t.hp });
    }
    if (e.mp) { t.mp = Math.min(t.maxMp, t.mp + e.mp); this.ev({ t: 'mp', target: t.uid, amount: e.mp, mp: t.mp }); }
  }

  tryFlee(u) {
    if (!this.opts.canFlee) return this.ev({ t: 'msg', text: '¡No puedes huir de este combate!' });
    const a = Math.max(...this.alive('ally').map(x => this.S(x, 'spd'))), b = Math.max(...this.alive('enemy').map(x => this.S(x, 'spd')));
    if (rnd() < clamp(0.55 + (a - b) * 0.03, 0.25, 0.9)) {
      this.ev({ t: 'msg', text: '¡Escapáis del combate!' });
      this.over = true; this.result = 'flee'; this.ev({ t: 'end', result: 'flee' });
    } else this.ev({ t: 'msg', text: '¡No logras escapar!' });
  }

  /* ---------- Fin de ronda / estados ---------- */
  endRound() {
    for (const u of this.all) {
      if (u.hp <= 0) continue;
      for (const k of ['burn', 'poison']) if (u.fx[k]) {
        const d = Math.max(3, Math.round(u.maxHp * (k === 'burn' ? 0.06 : 0.05)));
        u.hp = Math.max(0, u.hp - d);
        this.ev({ t: 'hit', target: u.uid, dmg: d, dot: k, hp: u.hp, element: k === 'burn' ? 'fuego' : 'veneno' });
        if (u.hp <= 0) { this.faint(u); break; }
      }
      if (u.hp <= 0) continue;
      const regen = (u.fx.regen ? 0.06 : 0) + (u.fx.wolf ? 0.08 : 0);
      if (regen) { const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * regen)); if (u.hp > b) this.ev({ t: 'heal', target: u.uid, amount: u.hp - b, hp: u.hp, regen: true }); }
      for (const k of Object.keys(u.fx)) {
        if (k === 'freeze' || k === 'stun' || u.fx[k] >= 99) continue;
        if (--u.fx[k] <= 0) {
          delete u.fx[k];
          if (k === 'wolf') this.endWolf(u);
        }
      }
      if (u.side === 'ally') { u.mp = Math.min(u.maxMp, u.mp + 4); u.ult = Math.min(100, u.ult + 3 + (u.ultGain || 0)); }
    }
    this.ev({ t: 'tick' });
  }

  endWolf(u) {
    if (u.wolfBonus) { u.maxHp -= u.wolfBonus; u.wolfBonus = 0; u.hp = Math.max(1, Math.min(u.hp, u.maxHp)); }
    this.ev({ t: 'unwolf', actor: u.uid, text: `${u.name} recupera su forma humana.`, hp: u.hp, maxHp: u.maxHp });
  }

  faint(t) {
    t.fx = {}; t.charging = null; t.intent = null;
    if (t.side === 'enemy') this.defeated.push(t);
    if (t.wolfBonus) { t.maxHp -= t.wolfBonus; t.wolfBonus = 0; }
    this.ev({ t: 'faint', target: t.uid, text: t.side === 'ally' ? `¡${t.name} queda debilitado!` : `${t.name} es derrotado.` });
  }

  checkEnrage() {
    for (const e of this.alive('enemy')) {
      const en = e.def.enrage;
      if (en && !e.enraged && e.hp / e.maxHp <= en.hp) {
        e.enraged = true; e.fx.atk_up = 99;
        this.ev({ t: 'enrage', target: e.uid, text: en.text });
      }
    }
  }

  checkEnd() {
    if (this.over) return;
    if (!this.alive('enemy').length) { this.over = true; this.result = 'win'; this.ev({ t: 'end', result: 'win' }); }
    else if (!this.alive('ally').length) { this.over = true; this.result = 'lose'; this.ev({ t: 'end', result: 'lose' }); }
  }

  /** Recompensas al ganar. */
  rewards() {
    let xp = 0, gold = 0; const loot = [];
    for (const e of this.enemies) {
      xp += e.def.xp || 0; gold += e.def.gold || 0;
      for (const l of e.def.loot || []) if (rnd() < l.chance) loot.push(l.item);
    }
    return { xp, gold, loot, kills: this.enemies.map(e => e.id) };
  }
}
