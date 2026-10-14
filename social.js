/* KAZEHANA · relaciones, diálogos con estados de ánimo, romance y familia (sin DOM) */
(function (G) {
  'use strict';
  const D = G.D, U = G.U, W = G.World, NPC = G.NPC, Game = G.Game;
  const So = (G.Social = {});
  const rnd = () => U.R.r();
  const pick = (a) => U.R.pick(a);

  const LIMIT = { charlar: 4, bromear: 2, cumplido: 2, regalar: 2, coquetear: 3, cita: 1, entrenar: 1, ayuda: 1, noche: 1 };
  const BASE = { charlar: 0.58, bromear: 0.46, cumplido: 0.5, coquetear: 0.34, cita: 0.5, entrenar: 0.7 };
  const ROMANTIC = ['coquetear', 'cita', 'confesar', 'noche', 'proponer'];
  const MOOD_MOD = { alegre: 0.1, sereno: 0.05, coqueto: 0.05, enamorado: 0.12, enfadado: -0.25, triste: -0.08, serio: -0.04, nervioso: -0.03, avergonzado: 0, timido: 0, burlon: 0, neutral: 0, sorprendido: 0 };

  So.tokens = function (n) {
    const P = G.S.player;
    return { p: P.name, o: P.gender === 'm' ? 'o' : 'a', x: NPC.ox(n.gender), n: n.name, job: NPC.jobName(n), hair: P.look.hairName, eye: P.look.eyeName };
  };
  So.fmt = (n, str) => U.fill(str, So.tokens(n));
  function line(n, text, mood, who) {
    const m = mood || n.mood;
    return { who: who || 'npc', emote: So.fmt(n, pick(D.EMOTES[m] || D.EMOTES.neutral)), text: So.fmt(n, text), mood: m };
  }
  function moodAfter(n, good, romantic) {
    const P = G.S.player;
    if (!good) return pick(['serio', 'enfadado', 'triste', 'nervioso']);
    if (romantic && n.romance >= 55) return 'enamorado';
    return { tsundere: 'avergonzado', timido: 'timido', coqueto: 'coqueto', bromista: 'burlon', serio: 'sereno', rudo: 'burlon', sabio: 'sereno' }[n.pers] || (romantic ? pick(['timido', 'coqueto', 'alegre']) : 'alegre');
  }
  function chance(n, action, arg) {
    const P = G.S.player, d = Game.derived(P), pm = D.PERS[n.pers].mod[action] || 0;
    let p = (BASE[action] != null ? BASE[action] : 0.5) + n.affinity / 250 + pm + (MOOD_MOD[n.mood] || 0) + (d.st.car - 5) / 60;
    if (ROMANTIC.includes(action)) p += NPC.chemistry(n, P) * 0.3 - 0.08 + n.romance / 400;
    if (action === 'cumplido') p += arg === 'aspecto' && n.wants.includes('looks') ? 0.06 : arg === 'poder' && n.power ? 0.08 : 0;
    if (n.status === 'dating' || n.status === 'married') p += 0.08;
    if (P.honor < -30) p -= 0.08; if (P.honor > 30 && n.wants.includes('honor')) p += 0.08;
    return U.clamp(p, 0.06, 0.95);
  }
  So.chance = chance;
  function outcome(p) { const r = rnd(); return r < p * 0.35 ? 'great' : r < p ? 'good' : r < p + (1 - p) * 0.55 ? 'meh' : 'bad'; }
  function change(n, a, r, mood, eff) {
    if (a) { n.affinity = U.clamp(n.affinity + a, -100, 100); eff.push((a > 0 ? '💞 Afinidad +' : '💔 Afinidad ') + a); }
    if (r) { n.romance = U.clamp(n.romance + r, 0, 100); eff.push((r > 0 ? '❤️ Romance +' : '🥀 Romance ') + r); }
    if (mood) n.mood = mood;
  }
  function jealousy(n, eff) {
    const s = G.S; const partners = Object.values(s.npcs).filter((x) => x.id !== n.id && (x.status === 'dating' || x.status === 'married'));
    partners.forEach((a) => {
      if (rnd() < (a.status === 'married' ? 0.8 : 0.5)) {
        a.affinity -= 8; a.romance = Math.max(0, a.romance - 10); a.mood = 'enfadado'; a.trust -= 3;
        Game.log('😠 Llegan rumores a ' + a.name + ' de que andas con ' + n.name + '. Se ha enfadado.', 'bad'); eff.push('😠 ' + a.name + ' se entera de tus andanzas...');
      }
    });
  }
  function setDone(n, a) { n.today[a] = (n.today[a] || 0) + 1; }
  function side(n, kind) {
    const pr = D.PERS[n.pers];
    if (rnd() < 0.4) return ' ' + (kind === 'bad' ? pick(pr.bad) : pick(pr.good));
    return '';
  }

  /* ---- Lista de acciones disponibles ---- */
  So.why = function (n, id) {
    const P = G.S.player, rom = NPC.canRomance(n, P), done = n.today[id] || 0;
    if (LIMIT[id] && done >= LIMIT[id]) return 'Ya no por hoy';
    if (n.affinity <= -40 && !['despedirse'].includes(id)) return 'Te evita';
    if (ROMANTIC.includes(id)) {
      if (n.age < 18) return 'No disponible';
      if (!NPC.genderMatch(P, n) && id !== 'noche') return 'No es tu tipo de interés';
    }
    if (id === 'coquetear' && n.status === 'married') return n.id === P.spouse ? null : 'Está casad@';
    if (id === 'cita' && (n.affinity < 20 || n.romance < 8)) return 'Necesitas más confianza (afinidad 20 · romance 8)';
    if (id === 'confesar') { if (n.status === 'dating' || n.status === 'married') return 'Ya sois pareja'; if (n.romance < 35 || n.affinity < 35) return 'Aún es pronto (romance 35 · afinidad 35)'; }
    if (id === 'noche') { if (!(n.status === 'dating' || n.status === 'married')) return 'Solo con tu pareja'; if (n.romance < 50) return 'Necesitáis más intimidad'; }
    if (id === 'proponer') { if (n.status !== 'dating') return 'Necesitas ser su pareja'; if (n.romance < 70 || n.affinity < 65) return 'Aún no (romance 70 · afinidad 65)'; if (Game.count('anillo') < 1) return 'Necesitas un anillo'; if (P.spouse) return 'Ya estás casad@'; }
    if (id === 'terminar' && n.status !== 'dating') return 'No sois pareja';
    if (id === 'ayuda' && n.affinity < 15) return 'Aún no confía lo suficiente';
    if (id === 'entrenar' && n.affinity < 25) return 'Aún no tenéis confianza';
    return null;
  };
  So.hasReadyQuest = (n) => G.S.quests.some((q) => q.giver === n.id && Game.questReady(q) && q.status !== 'done');

  /* ---- Apertura de conversación ---- */
  So.open = function (n) {
    const P = G.S.player, st = NPC.stageOf(n), lines = [];
    if (!n.met) {
      lines.push({ who: 'sys', text: 'Ves a ' + NPC.shortDesc(n) + '. ' + So.fmt(n, pick(D.EMOTES[n.mood])) });
      return lines;
    }
    const night = G.S.time.phase === 2;
    let g;
    if (n.affinity <= -20) g = pick(['¿Qué quieres ahora?', 'Tch. Tú otra vez.']);
    else if (st.id === 'casados') g = pick(['¡Cariño! Me alegra tanto verte.', 'Bienvenid{o}, mi amor. Te estaba esperando.']);
    else if (st.id === 'pareja') g = pick(['¡Hola, {p}! Justo estaba pensando en ti...', 'Mi corazón se acelera cada vez que apareces.']);
    else if (st.id === 'confidente' || st.id === 'amigo') g = pick(['¡Hola, {p}! Me alegra verte.', '¡{p}! Justo la persona que quería ver.']);
    else g = pick(['Hola, {p}. ¿Necesitas algo?', 'Buenas. ¿Todo bien?']);
    if (night && rnd() < 0.3) g += ' Es tarde, ¿no?';
    lines.push(line(n, g));
    return lines;
  };

  /* ---- Presentación ---- */
  So.introduce = function (n) {
    const P = G.S.player, lines = [], eff = [];
    n.met = true; n.affinity += 2; G.S.counters.talks++;
    lines.push(line(n, 'Me llamo ' + n.name + ' ' + n.surname + '. Soy ' + NPC.jobName(n) + '. ¿Y tú?'));
    lines.push({ who: 'me', text: 'Me llamo ' + P.name + '. Encantad' + (P.gender === 'm' ? 'o' : 'a') + '.' });
    const rem = [];
    if (NPC.canRomance(n, P)) {
      rem.push('Qué ojos ' + P.look.eyeName + ' tienes... perdona, se me ha escapado.', 'Ese pelo ' + P.look.hairName + ' te sienta genial.');
      if (P.buildTags.includes('fuerte')) rem.push('Se nota que te cuidas. Tienes buena planta.');
      if (n.wants.includes('honor') && P.honor > 20) rem.push('He oído hablar de ti. Dicen que eres una buena persona.');
    }
    if (rem.length && rnd() < 0.5) { const m = pick(['timido', 'coqueto', 'alegre']); n.mood = m; lines.push(line(n, pick(rem), m)); n.affinity += 2; eff.push('💞 Primera impresión: +2'); }
    else lines.push(line(n, pick(['Un placer conocerte, {p}.', 'Encantad{x}. Si necesitas algo, ya sabes dónde encontrarme.'])));
    Game.advance(1); eff.push('📖 Ahora conoces a ' + n.name);
    return { lines, eff };
  };

  /* ---- Interacción principal ---- */
  So.interact = function (nid, action, arg) {
    const s = G.S, P = s.player, n = s.npcs[nid]; const lines = [], eff = []; let fight = null, fade = false;
    const r = { lines, eff, fight: null, close: false, fade: false };
    const why = So.why(n, action);
    if (why && !['despedirse', 'regalar'].includes(action) && action !== 'charlar') { lines.push({ who: 'sys', text: why }); return r; }
    const T = D.ACT;
    switch (action) {
      case 'charlar': {
        const topic = arg || 'general';
        if (n.special === 'mentor' && s.main.stage === 0) {
          lines.push(line(n, 'Así que eres ' + P.name + '. Te esperaba. Ven, siéntate: hay algo que debes saber.', 'serio'));
          lines.push(line(n, 'Hace siglos, un Señor de las Sombras fue sellado en la ' + s.world.pois.find((p) => p.type === 'guarida').name + '. El Sello se debilita. Para fortalecerlo hacen falta los tres Sellos Ancestrales, custodiados en los santuarios del reino.', 'serio'));
          lines.push(line(n, 'Busca los tres santuarios. Te he marcado uno en tu mapa. Y cuídate: el mundo es más grande y más peligroso de lo que crees.', 'sereno'));
          s.main.stage = 1; const q1 = s.quests.find((q) => q.id === 'main1'); if (q1) { q1.status = 'done'; eff.push(...Game.gainXp(30)); }
          const sh = s.world.pois.filter((p) => p.type === 'santuario'); sh.forEach((p, i) => { if (i === 0) { W.reveal(s, p.x, p.y, 2); p.revealed = true; eff.push('🗺️ Descubres: ' + p.name); } });
          s.quests.push({ id: 'main2', kind: 'main', type: 'seals', title: 'Los tres Sellos', desc: 'Reúne los Sellos Ancestrales completando los tres santuarios (⛩️) del reino.', status: 'active', reward: {} });
          n.affinity += 5; Game.advance(2); return r;
        }
        const lim = So.why(n, 'charlar'); if (lim) { lines.push({ who: 'sys', text: lim }); return r; }
        const need = { suenos: 15, miedos: 35, secretos: 60, poder: 10 }[topic] || 0;
        if (n.affinity < need) { lines.push(line(n, pick(['Eso... es algo que no cuento a cualquiera.', 'Aún no nos conocemos tanto, {p}.']), 'serio')); return r; }
        const p = chance(n, 'charlar'), o = outcome(p); setDone(n, 'charlar'); Game.advance(2);
        if (o === 'bad') { lines.push(line(n, pick(T.charlar.bad) + side(n, 'bad'), moodAfter(n, false))); change(n, -3, 0, n.mood, eff); n.mood = n.mood; return r; }
        const mood = moodAfter(n, true);
        if (topic === 'trabajo') lines.push(line(n, n.lore, mood));
        else if (topic === 'suenos') lines.push(line(n, n.dream, 'sereno'));
        else if (topic === 'miedos') lines.push(line(n, n.fear, 'triste'));
        else if (topic === 'secretos') { lines.push(line(n, n.secret, 'nervioso')); n.trust += 5; eff.push('🤝 Confianza +5'); }
        else if (topic === 'poder') lines.push(line(n, n.power ? 'Mi poder es el ' + D.POWERS[n.power].n.toLowerCase() + ' ' + D.POWERS[n.power].e + '. ' + D.POWERS[n.power].d : 'No tengo ningún poder especial. Solo sudor y paciencia.', mood));
        else if (topic === 'rumores') { lines.push(line(n, So.rumor(n), mood)); }
        else lines.push(line(n, pick(T.charlar[o]) + side(n, 'good'), mood));
        const a = o === 'great' ? 5 : o === 'good' ? 3 : 1;
        change(n, a, 0, mood, eff); n.seen[topic] = 1;
        return r;
      }
      case 'bromear': case 'cumplido': {
        const p = chance(n, action, arg), o = outcome(p); setDone(n, action); Game.advance(2);
        const romantic = action === 'cumplido' && NPC.canRomance(n, P);
        const eftab = { great: [4, romantic ? 3 : 0], good: [2, romantic ? 1 : 0], meh: [0, 0], bad: [-4, 0] }[o];
        const mood = moodAfter(n, o === 'great' || o === 'good', romantic);
        let t = pick(T[action][o]);
        lines.push(line(n, t + side(n, o === 'bad' ? 'bad' : 'good'), o === 'meh' ? 'neutral' : mood));
        change(n, eftab[0], eftab[1], o === 'meh' ? n.mood : mood, eff); if (o === 'great' || o === 'good') G.Sfx.play('love'); else if (o === 'bad') G.Sfx.play('bad');
        return r;
      }
      case 'regalar': {
        const it = D.ITEMS[arg]; if (!it || Game.count(arg) < 1 || it.t !== 'gift') { lines.push({ who: 'sys', text: 'Eso no es un regalo adecuado.' }); return r; }
        if ((n.today.regalar || 0) >= LIMIT.regalar) { lines.push({ who: 'sys', text: 'Ya le has hecho suficientes regalos hoy.' }); return r; }
        Game.addItem(arg, -1); setDone(n, 'regalar'); Game.advance(1);
        const love = it.tags.some((t) => n.likes.includes(t)), hate = it.tags.some((t) => n.dislikes.includes(t));
        const half = (n.today.regalar || 0) > 1 ? 0.5 : 1;
        const k = love ? 'love' : hate ? 'dislike' : (it.price >= 60 ? 'like' : 'neutral');
        const a = Math.round({ love: 9, like: 5, neutral: 2, dislike: -5 }[k] * half), rr = k === 'love' && NPC.canRomance(n, P) ? 3 : 0;
        const mood = k === 'dislike' ? 'serio' : k === 'neutral' ? 'neutral' : moodAfter(n, true, rr > 0);
        lines.push({ who: 'sys', text: it.e + ' Le regalas ' + it.n + '.' });
        lines.push(line(n, pick(T.regalar[k]) + (k === 'love' ? ' (¡Le encanta!)' : ''), mood)); change(n, a, rr, mood, eff); G.Sfx.play(k === 'dislike' ? 'bad' : 'love');
        return r;
      }
      case 'coquetear': {
        if (!NPC.canRomance(n, P)) { lines.push(line(n, pick(T.coquetear.no), 'timido')); change(n, -1, 0, 'nervioso', eff); Game.advance(2); setDone(n, 'coquetear'); return r; }
        const p = chance(n, 'coquetear'), o = outcome(p); setDone(n, 'coquetear'); Game.advance(2);
        const eftab = { great: [3, 7], good: [2, 4], meh: [0, 1], bad: [-4, -2] }[o];
        const mood = o === 'bad' ? pick(['enfadado', 'serio']) : o === 'meh' ? 'nervioso' : moodAfter(n, true, true);
        lines.push(line(n, pick(T.coquetear[o]) + side(n, o === 'bad' ? 'bad' : 'good'), mood)); change(n, eftab[0], eftab[1], mood, eff); if (n.id !== P.spouse) jealousy(n, eff);
        G.Sfx.play(o === 'bad' ? 'bad' : 'love'); return r;
      }
      case 'cita': {
        const dt = D.DATES[arg || 'paseo'];
        if (dt.night && s.time.phase !== 2) { lines.push({ who: 'sys', text: 'Solo se puede hacer de noche.' }); return r; }
        if (P.gold < dt.cost) { lines.push({ who: 'sys', text: 'Necesitas ' + dt.cost + ' ryo.' }); return r; }
        P.gold -= dt.cost; const p = chance(n, 'cita'), o = outcome(p); setDone(n, 'cita'); Game.advance(dt.steps);
        const eftab = { great: [5, 8], good: [3, 5], meh: [1, 1], bad: [-3, -2] }[o];
        const mood = o === 'bad' ? 'serio' : o === 'meh' ? 'neutral' : moodAfter(n, true, true);
        lines.push({ who: 'sys', text: dt.e + ' ' + So.fmt(n, dt[o]).replace('Apoya', 'Apoya') });
        lines.push(line(n, o === 'great' ? 'Ha sido un día perfecto, {p}. No quiero que acabe.' : o === 'good' ? 'Me lo he pasado muy bien contigo.' : o === 'meh' ? 'Bueno... gracias por la invitación.' : 'Creo que no ha sido nuestra mejor cita...', mood));
        change(n, eftab[0], eftab[1], mood, eff);
        if (arg === 'entrenar' && o !== 'bad') eff.push(...Game.gainXp(10 + P.level * 2));
        if (n.id !== P.spouse) jealousy(n, eff); G.Sfx.play(o === 'bad' ? 'bad' : 'love'); return r;
      }
      case 'confesar': {
        const p = U.clamp((n.romance - 25) / 100 + n.affinity / 200 + NPC.chemistry(n, P) * 0.3 + (D.PERS[n.pers].mod.coquetear || 0) * 0.5 + 0.1, 0.1, 0.92);
        Game.advance(2);
        lines.push({ who: 'me', text: 'Quiero ser sincer' + (P.gender === 'm' ? 'o' : 'a') + ' contigo, ' + n.name + '... Me gustas. Mucho.' });
        if (rnd() < p) {
          n.status = 'dating'; n.romance += 8; n.affinity += 6; n.mood = 'enamorado';
          lines.push(line(n, pick(T.confesar.yes), 'enamorado')); eff.push('💑 ¡Ahora sois pareja!'); G.Sfx.play('level'); Game.log('💑 ' + n.name + ' y tú sois ahora pareja.', 'love');
          if (n.id !== P.spouse) jealousy(n, eff);
        } else {
          n.romance = Math.max(0, n.romance - 8); n.mood = 'triste'; lines.push(line(n, pick(T.confesar.no), 'triste')); eff.push('💔 Te han rechazado. Romance -8'); G.Sfx.play('bad');
        }
        return r;
      }
      case 'noche': {
        Game.advance(2); lines.push({ who: 'sys', text: pick(D.NIGHT_LINES) }); n.romance = Math.min(100, n.romance + 8); n.affinity = Math.min(100, n.affinity + 5); n.mood = 'enamorado'; setDone(n, 'noche');
        eff.push('❤️ Romance +8', '💞 Afinidad +5'); r.fade = true; Game.skipToMorning(); const d = Game.derived(P); P.hp = d.maxHp; P.en = d.maxEn; eff.push('🛏️ Amaneces descansad' + (P.gender === 'm' ? 'o' : 'a') + ' y feliz.');
        lines.push(line(n, pick(['Buenos días... ¿has dormido bien? Yo no he querido despertarme.', 'Mmm... quédate un ratito más.']), 'enamorado')); G.Sfx.play('love'); return r;
      }
      case 'proponer': {
        Game.advance(2);
        lines.push({ who: 'me', text: 'Llevo mucho tiempo pensándolo. ¿Quieres casarte conmigo, ' + n.name + '?' });
        const p = U.clamp(0.5 + (n.romance - 70) / 100 + (n.affinity - 65) / 200 + (MOOD_MOD[n.mood] || 0), 0.2, 0.95);
        if (rnd() < p) {
          Game.addItem('anillo', -1); n.status = 'married'; P.spouse = n.id; n.romance = 100; n.mood = 'enamorado';
          Object.values(s.npcs).forEach((x) => { if (x.id !== n.id && x.status === 'dating') { x.status = 'ex'; x.mood = 'triste'; x.affinity -= 20; } });
          if (s.family.home) { n.home = s.family.home; const hp = W.poi(s, s.family.home); if (!hp.npcs.includes(n.id)) hp.npcs.push(n.id); }
          lines.push(line(n, pick(T.proponer.yes), 'enamorado')); eff.push('💍 ¡Os habéis casado!'); G.Sfx.play('level'); Game.log('💍 Te has casado con ' + NPC.fullName(n) + '.', 'love'); Game.addHonor(3);
        } else { n.mood = 'nervioso'; n.romance -= 4; lines.push(line(n, pick(T.proponer.no), 'nervioso')); eff.push('Romance -4'); }
        return r;
      }
      case 'terminar': {
        n.status = 'ex'; n.romance = 0; n.affinity -= 25; n.mood = 'triste'; lines.push({ who: 'me', text: 'Creo que lo mejor es que lo dejemos...' }); lines.push(line(n, pick(T.terminar), 'triste')); eff.push('💔 Habéis roto'); Game.advance(1); Game.log('Rompes con ' + n.name + '.', 'bad'); return r;
      }
      case 'ayuda': {
        const act = s.quests.find((q) => q.giver === n.id && q.status !== 'done');
        if (act) { if (Game.questReady(act)) { return So.interact(nid, 'entregar'); } lines.push(line(n, 'Ya te he pedido algo: ' + act.desc, 'serio')); return r; }
        if (rnd() < 0.3 && !n.special) { lines.push(line(n, pick(T.ayuda.none), 'sereno')); setDone(n, 'ayuda'); return r; }
        const q = Game.makeQuest(U.R, G.S.world.pois.find((p) => p.id === n.home)?.tier || 1, n.id);
        q.reward = Object.assign({}, q.reward, { gold: Math.round(q.reward.gold * 0.8) });
        s.quests.push(q); setDone(n, 'ayuda'); Game.advance(1);
        lines.push(line(n, pick(T.ayuda.give) + ' ' + q.desc, 'serio')); eff.push('📜 Nueva misión: ' + q.title); Game.log('Misión de ' + n.name + ': ' + q.title, 'quest'); return r;
      }
      case 'entregar': {
        const q = s.quests.find((x) => x.giver === n.id && Game.questReady(x)); if (!q) { lines.push({ who: 'sys', text: 'No tienes nada que entregar.' }); return r; }
        const out = Game.turnIn(q); lines.push(line(n, pick(T.ayuda.done), 'alegre')); eff.push(...out); G.Sfx.play('win'); return r;
      }
      case 'entrenar': {
        const p = chance(n, 'entrenar'); setDone(n, 'entrenar');
        if (rnd() > p) { lines.push(line(n, pick(T.entrenar.bad), 'serio')); Game.advance(1); return r; }
        Game.advance(6); lines.push(line(n, pick(T.entrenar.good), 'alegre')); eff.push(...Game.gainXp(14 + P.level * 3)); change(n, 3, 0, 'alegre', eff);
        if (rnd() < 0.2) { const k = pick(Object.keys(D.STATS)); P.stats[k]++; eff.push('📈 ' + D.STATS[k].n + ' +1'); } return r;
      }
      case 'retar': {
        lines.push({ who: 'me', text: '¿Qué tal un combate amistoso, ' + n.name + '?' });
        const p = U.clamp(0.5 + (D.PERS[n.pers].mod.retar || 0) + n.affinity / 300, 0.15, 0.95);
        if (n.age > 62 && !n.power) { lines.push(line(n, 'Jajaja, a mi edad... mejor no.', 'alegre')); return r; }
        if (rnd() > p) { lines.push(line(n, 'No me apetece pelear ahora.', 'serio')); return r; }
        lines.push(line(n, '¡Acepto! No me contengas.', 'burlon'));
        r.fight = [{ id: n.special === 'rival' ? 'ronin' : 'bandido', lvl: Math.max(1, n.level + (n.special === 'rival' ? 2 : 0)), extra: { n: n.name, e: n.special === 'rival' ? '🥋' : '🥊', human: true, gold: 0, drops: [], xp: 22 + n.level * 10, duel: n.id } }];
        Game.advance(2); return r;
      }
    }
    return r;
  };
  So.duelResult = function (n, win) {
    const eff = []; const lines = [];
    if (win) { change(n, 6, 0, moodAfter(n, true), eff); lines.push(line(n, pick(D.ACT.retar.win), n.mood)); if (n.special === 'rival') { G.S.player.fame += 3; eff.push('📣 Fama +3'); } }
    else { change(n, 3, 0, 'burlon', eff); lines.push(line(n, pick(D.ACT.retar.lose), 'burlon')); }
    return { lines, eff };
  };

  /* ---- Rumores ---- */
  So.rumor = function (n) {
    const s = G.S, R = U.R; const k = R.r();
    if (k < 0.4) { const p = Game.revealRandomPoi(); if (p) return 'Dicen que por esta zona está ' + p.name + '. Yo no iría solo... pero te lo marco en el mapa. 🗺️'; }
    if (k < 0.75) {
      const pool = Object.values(s.npcs).filter((x) => x.id !== n.id && x.met);
      if (pool.length >= 2) { const a = R.pick(pool), b = R.pick(pool.filter((x) => x.id !== a.id)); return R.pick(['He oído que ' + a.name + ' y ' + b.name + ' se llevan muy bien últimamente...', 'Dicen que ' + a.name + ' anda preguntando por ' + b.name + '. Qué cosas.', a.name + ' se quejaba de ' + b.name + ' el otro día. Algo pasó.']); }
    }
    const e = R.pick(Object.values(D.ENEMIES).filter((x) => !x.boss));
    return 'Cuidado en los caminos: se han visto ' + e.n.toLowerCase() + ' por los alrededores. ' + (R.chance(0.5) ? 'Dicen que sueltan buen botín.' : 'Llevan semanas dando problemas.');
  };

  /* ---- Familia ---- */
  function mkChild(g, ageYears, parentA, parentB) {
    const s = G.S, P = s.player, R = U.R;
    const names = g === 'm' ? D.CHILD_NAMES_M : D.CHILD_NAMES_F;
    const a = parentA.look, b = (parentB && parentB.look) || a;
    const mixp = (k) => (R.chance(0.5) ? a[k] : b[k]);
    const look = { skin: mixp('skin'), hairColor: mixp('hairColor'), hairName: mixp('hairName'), hairStyle: g === 'f' ? R.pick(['bob', 'twin', 'long', 'ponytail']) : R.pick(['short', 'spiky']), grey: 0, eye: mixp('eye'), eyeName: mixp('eyeName'), outfit: R.pick(D.OUTFITS), outfit2: '#f4d8a0', accs: [], age: ageYears, gender: g, build: 'atletico', buildTags: ['atletico'], height: 'medio', eyeShape: 'big' };
    return { id: U.uid('c'), name: R.pick(names), gender: g, birthDay: s.time.day - ageYears * D.DAYS_YEAR, look, bond: 30, skill: 0, trait: R.pick(D.CHILD_TRAITS), power: R.chance(0.6) ? (R.chance(0.5) ? P.power : (parentB && parentB.power) || P.power) : null, other: parentB ? parentB.id : null };
  }
  So.childAge = (c) => Game.childAge(c);
  So.childTrait = (c) => c.trait.replace('{x}', NPC.ox(c.gender));
  So.tryChild = function (n) {
    const s = G.S, P = s.player;
    if (!s.family.home) return { ok: false, msg: 'Necesitáis un hogar para formar una familia.' };
    if (s.family.pending) return { ok: false, msg: 'Ya hay un bebé en camino.' };
    if (n.gender === P.gender) return { ok: false, msg: 'Podéis adoptar a un niño o niña que necesite un hogar.' };
    Game.advance(2); n.romance = Math.min(100, n.romance + 3);
    if (rnd() < 0.45) { s.family.pending = { day: s.time.day + 12, partner: n.id }; Game.log('👶 ¡' + n.name + ' y tú vais a tener un bebé!', 'love'); return { ok: true, msg: '👶 ¡Esperáis un bebé! Nacerá en unos 12 días.' }; }
    return { ok: true, msg: 'Pasáis una noche preciosa, pero aún no hay noticias. Podéis seguir intentándolo.' };
  };
  So.adopt = function () {
    const s = G.S, P = s.player; const cost = 100;
    if (!s.family.home) return { ok: false, msg: 'Primero necesitas un hogar.' };
    if (s.family.children.length >= 5) return { ok: false, msg: 'Tu casa ya está llena de niños.' };
    if (P.gold < cost) return { ok: false, msg: 'Los trámites cuestan ' + cost + ' ryo.' };
    P.gold -= cost; const sp = P.spouse && s.npcs[P.spouse]; const c = mkChild(U.R.pick(['m', 'f']), U.R.ri(3, 7), P, sp || null); c.adopted = true; s.family.children.push(c); Game.addHonor(3);
    Game.log('🧒 Adoptas a ' + c.name + '.', 'love'); return { ok: true, msg: '🧒 ¡' + c.name + ' ya es parte de tu familia!' };
  };
  So.onDay = function () {
    const s = G.S, out = [], pend = s.family.pending;
    if (pend && s.time.day >= pend.day) {
      const sp = s.npcs[pend.partner]; const c = mkChild(U.R.pick(['m', 'f']), 0, G.S.player, sp); s.family.children.push(c); s.family.pending = null;
      out.push('👶 ¡Ha nacido ' + c.name + '! ' + (c.gender === 'm' ? 'Es un niño sano.' : 'Es una niña sana.'));
    }
    s.family.children.forEach((c) => { const a = Game.childAge(c); if (a === 10 && !c.asp) { c.asp = U.R.pick(['aventurero', 'curandero', 'herrero', 'guardián', 'erudito', 'artista']); out.push('🧒 ' + c.name + ' dice que de mayor quiere ser ' + c.asp + '.'); } });
    return out;
  };
  So.childAct = function (cid, kind) {
    const s = G.S, c = s.family.children.find((x) => x.id === cid); const P = s.player; const eff = [];
    if (!c) return null; const age = Game.childAge(c);
    c.acts = c.acts || {}; if (c.acts.day !== s.time.day) c.acts = { day: s.time.day, n: 0 };
    if (c.acts.n >= 3) return { text: c.name + ' está cansad' + NPC.ox(c.gender) + ' por hoy. Mañana seguiréis.', eff };
    c.acts.n++; Game.advance(3);
    if (kind === 'jugar') { c.bond = Math.min(100, c.bond + 4); eff.push('💞 Vínculo +4'); return { text: pick(['Jugáis a las sombras chinescas hasta que se ríe a carcajadas.', 'Corréis por el jardín; ' + c.name + ' te gana por un pelo (o te dejas).', 'Construís un fuerte de cojines. Es el mejor fuerte del mundo.']), eff }; }
    if (kind === 'ensenar') {
      if (age < 5) return { text: c.name + ' es muy pequeñ' + NPC.ox(c.gender) + ' para aprender eso.', eff }; c.skill = Math.min(20, c.skill + 1); c.bond = Math.min(100, c.bond + 2); eff.push('📘 Aprendizaje +1', '💞 Vínculo +2');
      if (!c.power && c.skill >= 6) { c.power = P.power; eff.push('🔮 ¡Despierta el poder de ' + D.POWERS[P.power].n + '!'); }
      return { text: 'Le enseñas ' + pick(['a respirar y concentrar su ki', 'una postura básica de combate', 'a leer las estrellas', 'a cocinar un buen caldo']) + '. Presta mucha atención.', eff };
    }
    if (kind === 'regalo') { if (Game.count('peluche') > 0) { Game.addItem('peluche', -1); c.bond = Math.min(100, c.bond + 10); eff.push('💞 Vínculo +10'); return { text: c.name + ' abraza el peluche y no te suelta en toda la tarde.', eff }; } if (Game.count('dango') > 0) { Game.addItem('dango', -1); c.bond = Math.min(100, c.bond + 5); eff.push('💞 Vínculo +5'); return { text: 'Se come el dango con los ojos brillantes.', eff }; } c.acts.n--; return { text: 'No tienes un peluche o dango que regalarle.', eff }; }
    return null;
  };
})((window.G = window.G || {}));
