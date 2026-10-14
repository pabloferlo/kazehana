/* KAZEHANA · generador de NPCs (todos adultos, 18+) */
(function (G) {
  'use strict';
  const D = G.D, U = G.U;
  const N = (G.NPC = {});

  const WANTS = ['fuerza', 'mente', 'carisma', 'honor', 'fama', 'riqueza', 'looks'];
  const BUILD_TYPES = ['musculoso', 'atletico', 'delgado', 'curvy', 'robusto', 'alto', 'menudo', 'maduro'];

  function ageGroup(a) { return a < 30 ? 'joven' : a < 45 ? 'adulto' : a < 60 ? 'mediana' : 'mayor'; }
  N.ageGroup = ageGroup;
  const ox = (g) => (g === 'm' ? 'o' : 'a');
  N.ox = ox;

  N.gen = function (R, o) {
    o = o || {};
    const g = o.gender || (R.chance(0.5) ? 'm' : 'f');
    const age = o.age || (function () {
      const r = R.r();
      return r < 0.45 ? R.ri(18, 29) : r < 0.73 ? R.ri(30, 44) : r < 0.9 ? R.ri(45, 59) : R.ri(60, 75);
    })();
    const settle = o.settle || 'aldea';
    const job = o.job ? D.JOBS[o.job] : R.wpick(Object.values(D.JOBS).filter((j) => j.w > 0 && j.settle.includes(settle)), (j) => j.w);
    const names = g === 'm' ? D.NAMES_M : D.NAMES_F;
    const buildKey = R.pick(Object.keys(D.BUILDS[g]));
    const build = D.BUILDS[g][buildKey];
    const hairC = R.wpick(D.HAIR_COLORS, (h) => (['negro', 'castano'].includes(h.id) ? 4 : ['rubio', 'pelirrojo'].includes(h.id) ? 2 : 1));
    const eyeC = R.wpick(D.EYE_COLORS, (e) => (['marron', 'negro'].includes(e.id) ? 4 : 1));
    const styles = g === 'm' ? ['short', 'short', 'spiky', 'bald', 'ponytail', 'medium'] : ['bob', 'long', 'long', 'ponytail', 'bun', 'short', 'twin', 'medium'];
    let style = R.pick(styles);
    if (style === 'twin' && age > 26) style = 'ponytail';
    const grey = age >= 60 ? (R.chance(0.6) ? 2 : 1) : age >= 45 ? (R.chance(0.5) ? 1 : 0) : 0;
    const height = R.wpick(['bajo', 'medio', 'alto', 'muyalto'], (h) => (h === 'medio' ? 4 : h === 'muyalto' ? 0.7 : 2));
    const accs = [];
    if (g === 'm' && R.chance(0.35)) accs.push('barba');
    if (R.chance(0.12)) accs.push('gafas');
    if (R.chance(0.12)) accs.push('cicatriz');
    if (R.chance(0.15)) accs.push('pecas');
    if (R.chance(0.1)) accs.push('pendientes');
    if (R.chance(0.08)) accs.push('lunar');
    if (R.chance(0.07)) accs.push('cinta');
    if (R.chance(0.05) && ['campesino', 'pescador', 'cazador'].includes(job.id)) accs.push('sombrero');
    if (R.chance(0.04)) accs.push(R.chance(0.5) ? 'orejas' : 'cuernos');
    const pers = o.pers || R.pick(Object.keys(D.PERS));
    const P = D.PERS[pers];
    const r = R.r();
    const interestedIn = g === 'm' ? (r < 0.78 ? ['f'] : r < 0.9 ? ['m', 'f'] : ['m']) : (r < 0.78 ? ['m'] : r < 0.9 ? ['m', 'f'] : ['f']);
    const likes = R.shuffle(D.GIFT_TAGS).slice(0, 3);
    const dislikes = R.shuffle(D.GIFT_TAGS.filter((t) => !likes.includes(t))).slice(0, 2);
    const first = R.pick(names);
    const npc = {
      id: o.id || U.uid('n'), name: first, surname: R.pick(D.SURNAMES), gender: g, age, job: job.id, home: o.home || null,
      pers, power: R.chance(0.4) ? R.pick(Object.keys(D.POWERS)) : null, level: Math.max(1, (o.level || 1) + R.ri(-1, 2)),
      look: { skin: R.pick(D.SKINS), hairColor: hairC.hex, hairName: hairC.n, hairStyle: style, grey, eye: eyeC.hex, eyeName: eyeC.n, outfit: job.col[0], outfit2: job.col[1],
        build: buildKey, buildTags: build.tags.slice(), height, accs, age, gender: g, eyeShape: P.eye },
      looks: Math.min(98, R.ri(38, 88) + build.lb + (age < 30 ? 4 : 0) + (age > 55 ? -8 : 0)),
      interestedIn, likes, dislikes, wants: R.shuffle(WANTS).slice(0, 2), type: R.pick(BUILD_TYPES),
      dream: R.pick(D.DREAMS), fear: R.pick(D.FEARS), secret: R.pick(D.SECRETS), lore: R.pick(job.lore),
      mood: R.pick(P.base), moodDay: 0, affinity: R.ri(-4, 6), romance: 0, trust: 0, met: false, status: 'single', special: o.special || null,
      today: {}, seen: {}, suspicion: 0, daysTalked: 0,
    };
    npc.dream = npc.dream.replace('{job}', jobName(npc));
    return npc;
  };

  function jobName(n) { const j = D.JOBS[n.job]; return n.gender === 'm' ? j.m : j.f; }
  N.jobName = jobName;
  N.fullName = (n) => n.name + ' ' + n.surname;
  N.xTokens = (n) => ({ x: ox(n.gender) });

  /* ---- Descripción física ---- */
  const FEM = { negro: 'negra', rubio: 'rubia', pelirrojo: 'pelirroja', plateado: 'plateada', blanco: 'blanca', violeta: 'violeta', verde: 'verde', azul: 'azul', rosa: 'rosa', castaño: 'castaña' };
  function hairText(n) {
    const L = n.look;
    const col = L.grey === 2 ? 'casi blanco por las canas' : L.grey === 1 ? L.hairName + ' con canas' : L.hairName;
    const colF = L.grey === 2 ? 'casi blanca por las canas' : L.grey === 1 ? (FEM[L.hairName] || L.hairName) + ' con canas' : (FEM[L.hairName] || L.hairName);
    switch (L.hairStyle) {
      case 'bald': return 'la cabeza rapada';
      case 'short': return 'cabello corto, ' + col;
      case 'spiky': return 'cabello corto y revuelto, en punta, ' + col;
      case 'bob': return 'cabello ' + col + ', corto, que le llega justo a los hombros';
      case 'long': return 'una larga melena ' + colF + ' que le cae hasta la cintura';
      case 'ponytail': return 'cabello ' + col + ' recogido en una coleta alta';
      case 'bun': return 'cabello ' + col + ' recogido en un moño';
      case 'twin': return 'cabello ' + col + ' en dos coletas';
      case 'medium': return 'cabello ' + col + ' a media espalda';
      default: return 'cabello ' + col;
    }
  }
  const GRP = { joven: ['joven', 'joven'], adulto: ['adulto', 'adulta'], mediana: ['de mediana edad', 'de mediana edad'], mayor: ['mayor', 'mayor'] };
  N.describe = function (n) {
    const L = n.look, g = n.gender, gr = ageGroup(n.age);
    const head = (g === 'm' ? 'Hombre ' : 'Mujer ') + GRP[gr][g === 'm' ? 0 : 1];
    const h = D.HEIGHTS[L.height].replace('{x}', ox(g));
    const body = D.BUILDS[g][L.build].t;
    const accs = L.accs.filter((a) => a !== 'barba').map((a) => D.ACCS[a]);
    let t = head + ' ' + h + ', con ' + body + '. ';
    t += U.cap(hairText(n)) + (L.accs.includes('barba') ? ' y barba cuidada' : '') + '. ';
    t += 'Ojos ' + L.eyeName + '. ';
    if (accs.length) t += 'Destacan ' + accs.join(', ') + '. ';
    t += 'Viste ' + D.JOBS[n.job].outfit + '.';
    return t;
  };
  N.shortDesc = function (n) {
    const gr = ageGroup(n.age);
    const word = n.gender === 'm' ? { joven: 'un joven', adulto: 'un hombre', mediana: 'un hombre maduro', mayor: 'un anciano' }[gr] : { joven: 'una joven', adulto: 'una mujer', mediana: 'una mujer madura', mayor: 'una anciana' }[gr];
    const hairName = n.look.grey === 2 ? 'canoso' : n.look.hairStyle === 'bald' ? 'rapado' : n.look.hairName;
    return word + ' de pelo ' + hairName;
  };
  N.display = (n) => (n.met || n.special === 'mentor' && n.met ? n.name + ' ' + n.surname : U.cap(N.shortDesc(n)));
  N.stageOf = function (n) {
    if (n.status === 'married') return { id: 'casados', n: 'Pareja casada', h: 5 };
    if (n.status === 'dating') return { id: 'pareja', n: 'Pareja', h: 4 };
    if (n.status === 'ex') return { id: 'ex', n: 'Ex', h: 0 };
    if (!n.met) return { id: 'desconocido', n: 'Desconocido', h: 0 };
    const a = n.affinity;
    if (a >= 60) return { id: 'confidente', n: 'Mejor amistad', h: 3 };
    if (a >= 30) return { id: 'amigo', n: 'Amistad', h: 2 };
    if (a >= 10) return { id: 'conocido', n: 'Conocido', h: 1 };
    if (a <= -20) return { id: 'hostil', n: 'Hostil', h: 0 };
    return { id: 'nuevo', n: 'Recién conocido', h: 0 };
  };

  /* ---- Atracción / química ---- */
  N.genderMatch = (P, n) => P.prefs.interest === 'both' || P.prefs.interest === n.gender;
  N.npcInterested = (n, P) => n.interestedIn.includes(P.gender);
  N.canRomance = (n, P) => n.age >= 18 && N.genderMatch(P, n) && N.npcInterested(n, P) && P.prefs.interest !== 'none';
  N.attraction = function (n, P) {
    if (!N.genderMatch(P, n) || P.prefs.interest === 'none') return 0;
    let a = n.looks * 0.55;
    const tags = n.look.buildTags.slice();
    if (n.look.height === 'alto' || n.look.height === 'muyalto') tags.push('alto');
    if (n.look.height === 'bajo') tags.push('menudo');
    if (n.age >= 45) tags.push('maduro');
    const hits = P.prefs.types.filter((t) => tags.includes(t)).length;
    a += Math.min(2, hits) * 16;
    return U.clamp(Math.round(a), 0, 100);
  };
  N.attrLabel = function (v) {
    return v >= 80 ? '🔥 Te llama muchísimo la atención' : v >= 62 ? '💘 Te resulta muy atractiv@' : v >= 45 ? '🙂 Tiene su encanto' : v > 0 ? '😶 No es tu tipo, pero ¿quién sabe?' : '—';
  };
  // Química: lo que el NPC valora de ti (0..1)
  N.chemistry = function (n, P, derivedFn) {
    let tot = 0;
    n.wants.forEach((w) => {
      let v = 0.4;
      if (w === 'fuerza') v = P.stats.fue / 22;
      else if (w === 'mente') v = P.stats.men / 22;
      else if (w === 'carisma') v = P.stats.car / 22;
      else if (w === 'honor') v = (P.honor + 100) / 200;
      else if (w === 'fama') v = P.fame / 40;
      else if (w === 'riqueza') v = P.gold / 1200;
      else if (w === 'looks') v = 0.35 + (P.buildTags.includes(n.type) ? 0.35 : 0.1) + (P.looksBonus || 0);
      tot += U.clamp(v, 0, 1);
    });
    let c = tot / n.wants.length;
    if (P.buildTags.includes(n.type)) c += 0.1;
    return U.clamp(c, 0, 1);
  };

  /* ---- Analizador de la autodescripción del jugador ---- */
  N.parseSelf = function (text) {
    const t = (text || '').toLowerCase();
    const out = {};
    const hairCtx = (re) => new RegExp('(?:pelo|cabello|melena|cabellera)\\s+(?:\\w+\\s+){0,3}?' + re).test(t);
    const eyeCtx = (re) => new RegExp('ojos\\s+(?:\\w+\\s+){0,2}?' + re).test(t);
    const hc = [['rubi', 'rubio'], ['pelirroj|rojiz|rojo', 'pelirrojo'], ['negr|moreno|oscur', 'negro'], ['casta', 'castano'], ['plate|gris', 'plateado'], ['blanc', 'blanco'], ['azul', 'azul'], ['rosa', 'rosa'], ['verde', 'verde'], ['violeta|morad', 'violeta']];
    for (const [re, id] of hc) if (hairCtx('(?:' + re + ')') || (id === 'rubio' && /rubi[oa]/.test(t)) || (id === 'pelirrojo' && /pelirroj[oa]/.test(t))) { out.hair = id; break; }
    const ec = [['marr', 'marron'], ['negr', 'negro'], ['verde', 'verde'], ['azul', 'azul'], ['gris', 'gris'], ['dorad|ámbar|ambar|miel', 'dorado'], ['violeta|morad', 'violeta'], ['roj', 'rojo']];
    for (const [re, id] of ec) if (eyeCtx('(?:' + re + ')')) { out.eye = id; break; }
    if (/musculos|fornid|forzud/.test(t)) out.build = 'musculoso';
    else if (/atl[eé]tic|deportist/.test(t)) out.build = 'atletico';
    else if (/delgad|flac|esbelt/.test(t)) out.build = 'delgado';
    else if (/voluptuos/.test(t)) out.build = 'voluptuosa';
    else if (/curv/.test(t)) out.build = 'curvy';
    else if (/menud|peque[ñn]it/.test(t)) out.build = 'menudo';
    else if (/robust|gord|rellen|corpulent/.test(t)) out.build = 'robusto';
    if (/\bmuy alt[oa]\b|altísim/.test(t)) out.height = 'muyalto';
    else if (/\balt[oa]\b/.test(t)) out.height = 'alto';
    else if (/\bbaj[oa]\b|bajit|peque[ñn][oa]\b/.test(t)) out.height = 'bajo';
    if (/coleta/.test(t)) out.style = 'ponytail';
    else if (/moño/.test(t)) out.style = 'bun';
    else if (/rapad|calv/.test(t)) out.style = 'bald';
    else if (/(pelo|cabello|melena)\s+larg/.test(t) || /larg[oa]s?\s+(pelo|cabello)/.test(t)) out.style = 'long';
    else if (/(pelo|cabello)\s+cort/.test(t)) out.style = 'short';
    out.accs = [];
    if (/cicatriz/.test(t)) out.accs.push('cicatriz');
    if (/gafas/.test(t)) out.accs.push('gafas');
    if (/peca/.test(t)) out.accs.push('pecas');
    if (/barba/.test(t)) out.accs.push('barba');
    return out;
  };

  N.buildTagsFor = function (g, buildKey, height) {
    const b = D.BUILDS[g][buildKey] || D.BUILDS[g][Object.keys(D.BUILDS[g])[0]];
    const tags = b.tags.slice();
    if (height === 'alto' || height === 'muyalto') tags.push('alto');
    if (height === 'bajo') tags.push('menudo');
    return tags;
  };
})((window.G = window.G || {}));
