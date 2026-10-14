/* KAZEHANA · combate por turnos (sin DOM) */
(function (G) {
  'use strict';
  const D = G.D, U = G.U, Game = G.Game;
  const C = (G.Combat = {});
  const rnd = () => U.R.r();

  C.makeEnemy = function (id, lvl, extra) {
    const b = D.ENEMIES[id], f = Math.max(0, lvl - ((b.tier - 1) * 3 + 1));
    const hp = Math.round(b.hp * (1 + 0.24 * f));
    const e = {
      uid: U.uid('e'), id, n: b.n, e: b.e, lvl, hp, maxHp: hp, atk: Math.round(b.atk * (1 + 0.17 * f)), def: Math.round(b.def * (1 + 0.12 * f)), spd: b.spd + Math.floor(f / 2),
      xp: Math.round(b.xp * (1 + 0.28 * f)), gold: Math.round(b.gold * (1 + 0.2 * f)), skills: b.skills, drops: b.drops, human: !!b.human, boss: !!b.boss, st: {},
    };
    return Object.assign(e, extra || {});
  };

  // opts: {noFlee, duel:{npc}, title}
  C.begin = function (group, opts) {
    const s = G.S, P = s.player; opts = opts || {};
    const enemies = group.map((g) => C.makeEnemy(g.id, g.lvl, g.extra));
    s.combat = { enemies, target: 0, turn: 1, log: [], done: null, opts, pst: {}, defending: false, fx: [] };
    const d = Game.derived(P); P.hp = Math.min(P.hp, d.maxHp);
    C.say('⚔️ ' + (enemies.length > 1 ? 'Te enfrentas a ' + enemies.map((e) => e.n).join(', ') : 'Te enfrentas a ' + enemies[0].n + ' (nv. ' + enemies[0].lvl + ')') + '.');
    return s.combat;
  };
  C.say = (t, cls) => { const c = G.S.combat; if (c) c.log.push({ t, c: cls || '' }); };
  C.alive = () => G.S.combat.enemies.filter((e) => e.hp > 0);
  C.target = function () { const c = G.S.combat; let t = c.enemies[c.target]; if (!t || t.hp <= 0) { t = C.alive()[0]; c.target = c.enemies.indexOf(t); } return t; };
  C.setTarget = (i) => { const c = G.S.combat; if (c.enemies[i] && c.enemies[i].hp > 0) c.target = i; };

  function addStatus(st, id, t) { st[id] = Math.max(st[id] || 0, t); }
  function dotDmg(lvl) { return 4 + Math.round(lvl * 1.6); }

  function hitEnemy(e, dmg, tag) {
    e.hp = Math.max(0, e.hp - dmg);
    C.G.fx.push({ k: 'e', uid: e.uid, v: dmg, crit: tag === 'crit' });
    if (e.hp <= 0) C.say('💀 ' + e.n + ' cae derrotado.', 'good');
  }
  C.pdmg = function (stat, mult, target) {
    const P = G.S.player, d = Game.derived(P), c = G.S.combat;
    let base = stat === 'mag' ? d.mag : d.atk;
    base *= mult * (0.9 + rnd() * 0.2) * (1 + 0.08 * P.powerRank);
    if (c.pst.atkup) base *= 1.35; if (c.pst.weak) base *= 0.7;
    let crit = rnd() * 100 < d.crit; if (crit) base *= 1.6;
    if (target.st.weak) base *= 1.1;
    let dmg = Math.max(1, Math.round(base - target.def * 0.55));
    return { dmg, crit };
  };
  Object.defineProperty(C, 'G', { get: () => G.S.combat });

  /* ---- acciones del jugador ---- */
  C.playerAct = function (kind, arg) {
    const s = G.S, c = s.combat, P = s.player, d = Game.derived(P);
    if (!c || c.done) return c;
    c.fx = []; let acted = true;
    if (c.pst.stun || c.pst.freeze) { C.say('💫 No puedes moverte este turno.', 'bad'); }
    else if (kind === 'attack') {
      const t = C.target(); const r = C.pdmg('atk', 1.0, t);
      if (rnd() < 0.04 + Math.max(0, (t.spd - d.spd)) * 0.004) { C.say('💨 ' + t.n + ' esquiva tu ataque.'); G.Sfx.play('click'); }
      else { hitEnemy(t, r.dmg, r.crit ? 'crit' : ''); C.say('🗡️ Golpeas a ' + t.n + ' y le causas ' + r.dmg + (r.crit ? ' (¡crítico!)' : '') + '.'); G.Sfx.play(r.crit ? 'crit' : 'hit'); }
      P.en = Math.min(d.maxEn, P.en + 2);
    } else if (kind === 'skill') {
      const sk = Game.skills(P).find((x) => x.id === arg);
      if (!sk) acted = false;
      else if (P.en < sk.cost) { C.say('🔷 No tienes energía suficiente.', 'bad'); acted = false; }
      else {
        P.en -= sk.cost; const stat = sk.stat || D.POWERS[P.power].stat;
        C.say('✨ Usas ' + sk.n + '.', 'skill'); G.Sfx.play(sk.t === 'heal' ? 'heal' : 'magic');
        if (sk.t === 'heal') { const h = Math.round(d.mag * sk.m * (1 + 0.08 * P.powerRank)); const before = P.hp; P.hp = Math.min(d.maxHp, P.hp + h); C.say('💚 Recuperas ' + (P.hp - before) + ' de vida.', 'good'); c.fx.push({ k: 'p', v: -(P.hp - before) }); }
        else if (sk.t === 'buff') { addStatus(c.pst, sk.buff.id, sk.buff.t + 1); C.say(D.STATUS[sk.buff.id].e + ' ' + D.STATUS[sk.buff.id].n + ' durante ' + sk.buff.t + ' turnos.', 'good'); }
        else {
          const targets = sk.aoe ? C.alive() : [C.target()]; let totalDmg = 0;
          targets.forEach((t) => {
            const r = C.pdmg(stat, sk.m, t); totalDmg += r.dmg; hitEnemy(t, r.dmg, r.crit ? 'crit' : '');
            C.say('  → ' + t.n + ': ' + r.dmg + (r.crit ? ' (¡crítico!)' : ''));
            if (sk.st && t.hp > 0 && rnd() < sk.st.p && !(t.boss && D.STATUS[sk.st.id].skip && rnd() < 0.5)) { addStatus(t.st, sk.st.id, sk.st.t + 1); C.say('  ' + D.STATUS[sk.st.id].e + ' ' + t.n + ': ' + D.STATUS[sk.st.id].n); }
          });
          if (sk.t === 'drain') { const h = Math.round(totalDmg * 0.5); P.hp = Math.min(d.maxHp, P.hp + h); C.say('🩸 Absorbes ' + h + ' de vida.', 'good'); }
          if (sk.sh) { const h = Math.round(totalDmg * sk.sh); P.hp = Math.min(d.maxHp, P.hp + h); C.say('💚 Te curas ' + h + '.', 'good'); }
        }
      }
    } else if (kind === 'defend') { c.defending = true; P.en = Math.min(d.maxEn, P.en + 5); C.say('🛡️ Te pones en guardia y recuperas el aliento.'); G.Sfx.play('click'); }
    else if (kind === 'item') {
      const it = D.ITEMS[arg];
      if (!it || Game.count(arg) < 1) acted = false;
      else if (it.hp || it.en) { Game.addItem(arg, -1); Game.heal(it.hp || 0, it.en || 0); C.say(it.e + ' Usas ' + it.n + '.', 'good'); G.Sfx.play('heal'); }
      else if (it.cure) { Game.addItem(arg, -1); c.pst = {}; C.say(it.e + ' Te curas de todos los estados.', 'good'); }
      else if (it.dmg) { Game.addItem(arg, -1); const t = C.target(); hitEnemy(t, it.dmg, ''); C.say(it.e + ' ' + it.n + ': ' + it.dmg + ' de daño a ' + t.n + '.'); G.Sfx.play('hit'); }
      else if (it.flee) { if (c.opts.noFlee) { C.say('🚫 No puedes huir de este combate.', 'bad'); acted = false; } else { Game.addItem(arg, -1); C.say('💨 Lanzas la bomba de humo y escapas.'); c.done = 'flee'; return c; } }
      else acted = false;
    } else if (kind === 'flee') {
      if (c.opts.noFlee) { C.say('🚫 No puedes huir de este combate.', 'bad'); acted = false; }
      else {
        const avg = U.sum(C.alive().map((e) => e.spd)) / Math.max(1, C.alive().length);
        const p = U.clamp(0.45 + (d.spd - avg) * 0.04, 0.2, 0.9);
        if (rnd() < p) { C.say('🏃 ¡Logras escapar!'); c.done = 'flee'; return c; }
        C.say('🏃 No consigues escapar.', 'bad');
      }
    }
    if (!acted) return c;
    Game.clampVitals();
    if (C.alive().length === 0) { c.done = 'win'; return c; }
    C.enemyPhase();
    return c;
  };

  C.enemyPhase = function () {
    const s = G.S, c = s.combat, P = s.player, d = Game.derived(P);
    C.alive().forEach((e) => {
      if (P.hp <= 0) return;
      // estados del enemigo
      if (e.st.burn) { const x = dotDmg(e.lvl); e.hp = Math.max(0, e.hp - x); c.fx.push({ k: 'e', uid: e.uid, v: x }); C.say('🔥 ' + e.n + ' sufre ' + x + ' por quemaduras.'); }
      if (e.st.bleed) { const x = dotDmg(e.lvl); e.hp = Math.max(0, e.hp - x); c.fx.push({ k: 'e', uid: e.uid, v: x }); C.say('🩸 ' + e.n + ' sangra: ' + x + '.'); }
      if (e.hp <= 0) { C.say('💀 ' + e.n + ' cae derrotado.', 'good'); return; }
      const skip = e.st.stun || e.st.freeze;
      const weak = e.st.weak;
      Object.keys(e.st).forEach((k) => { e.st[k]--; if (e.st[k] <= 0) delete e.st[k]; });
      if (skip) { C.say('💫 ' + e.n + ' no puede actuar.', 'good'); return; }
      // elegir ataque
      let sk = { n: 'Ataque', m: 1.0 };
      if (e.skills.length && rnd() < 0.5) sk = U.R.pick(e.skills);
      let atk = e.atk * sk.m * (0.88 + rnd() * 0.24) * (weak ? 0.7 : 1);
      let dodgeP = d.dodge / 100 + (c.pst.dodge ? 0.3 : 0);
      if (rnd() < dodgeP) { C.say('💨 Esquivas el ' + sk.n.toLowerCase() + ' de ' + e.n + '.', 'good'); return; }
      let dmg = atk - d.def * 0.55; if (c.pst.defup) dmg *= 0.6; if (c.defending) dmg *= 0.5;
      dmg = Math.max(1, Math.round(dmg));
      if (rnd() < 0.05) { dmg = Math.round(dmg * 1.5); C.say('💥 ¡Golpe crítico!', 'bad'); }
      P.hp = Math.max(0, P.hp - dmg); c.fx.push({ k: 'p', v: dmg }); G.Sfx.play('hurt');
      C.say(e.e + ' ' + e.n + ' usa ' + sk.n + ': ' + dmg + ' de daño.', 'bad');
      if (sk.st && rnd() < sk.st.p) { addStatus(c.pst, sk.st.id, sk.st.t + 1); C.say(D.STATUS[sk.st.id].e + ' Sufres: ' + D.STATUS[sk.st.id].n + '.', 'bad'); }
    });
    // fin de ronda del jugador
    if (c.pst.burn) { const x = dotDmg(Math.max(1, Math.floor(P.level / 2))); P.hp = Math.max(0, P.hp - x); C.say('🔥 Las llamas te queman: ' + x + '.', 'bad'); }
    if (c.pst.bleed) { const x = dotDmg(Math.max(1, Math.floor(P.level / 2))); P.hp = Math.max(0, P.hp - x); C.say('🩸 Sangras: ' + x + '.', 'bad'); }
    Object.keys(c.pst).forEach((k) => { c.pst[k]--; if (c.pst[k] <= 0) delete c.pst[k]; });
    c.defending = false; c.turn++;
    Game.clampVitals();
    if (P.hp <= 0) c.done = 'lose';
    else if (C.alive().length === 0) c.done = 'win';
  };

  // Simulación rápida para equilibrar (usado en pruebas)
  C.simulate = function (P, group) {
    const save = G.S.combat; C.begin(group, {}); const c = G.S.combat; let n = 0;
    while (!c.done && n++ < 80) { const sk = Game.skills(P).filter((s) => s.t === 'dmg' && P.en >= s.cost).pop(); C.playerAct(sk ? 'skill' : 'attack', sk && sk.id); }
    const res = c.done; G.S.combat = save; return res;
  };
})((window.G = window.G || {}));
