/* KAZEHANA · datos del juego (editables sin tocar la lógica) */
(function (G) {
  'use strict';
  const D = (G.D = {});

  D.STATS = {
    fue: { n: 'Fuerza', e: '💪', d: 'Daño físico y vida' },
    agi: { n: 'Agilidad', e: '⚡', d: 'Esquiva, críticos y huida' },
    men: { n: 'Mente', e: '🧠', d: 'Poder mágico y astucia' },
    car: { n: 'Carisma', e: '✨', d: 'Relaciones y precios' },
    esp: { n: 'Espíritu', e: '🔮', d: 'Energía y poder mágico' },
  };
  D.PHASES = [{ n: 'Mañana', e: '🌅' }, { n: 'Tarde', e: '☀️' }, { n: 'Noche', e: '🌙' }];
  D.SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
  D.SEASON_E = ['🌸', '🌻', '🍁', '❄️'];
  D.DAYS_SEASON = 8; D.DAYS_YEAR = 32; D.STEPS_PHASE = 8;

  D.TRAITS = {
    valiente: { n: 'Valiente', e: '🦁', d: '+1 Fuerza', s: { fue: 1 } },
    veloz: { n: 'Veloz', e: '🐆', d: '+1 Agilidad', s: { agi: 1 } },
    astuto: { n: 'Astuto', e: '🦊', d: '+1 Mente', s: { men: 1 } },
    encantador: { n: 'Encantador', e: '🌹', d: '+1 Carisma', s: { car: 1 } },
    sonador: { n: 'Soñador', e: '🌙', d: '+1 Espíritu', s: { esp: 1 } },
    curioso: { n: 'Curioso', e: '🔍', d: '+10% experiencia', xp: 0.1 },
    generoso: { n: 'Generoso', e: '🤝', d: 'Empiezas con honor +12', honor: 12 },
    ambicioso: { n: 'Ambicioso', e: '💰', d: '+60 ryo iniciales', gold: 60 },
    rudo: { n: 'Testarudo', e: '🪨', d: '+12 vida máxima', hp: 12 },
  };

  D.ORIGINS = {
    aldea: { n: 'Aldea', e: '🏡', bonus: { car: 1, fue: 1 }, gold: 60, items: { onigiri: 3, pocion: 1 }, poi: 'aldea',
      d: 'Creciste entre arrozales y festivales. Todos se conocen, y la vida es sencilla... hasta que algo se mueve en las montañas.',
      intro: 'Tu aldea te vio crecer entre risas, campos de arroz y festivales de linternas. Pero las cosechas se pudren y los viejos hablan de un sello que se debilita.' },
    ciudad: { n: 'Ciudad', e: '🏘️', bonus: { men: 1, car: 1 }, gold: 120, items: { pocion: 2 }, poi: 'ciudad',
      d: 'Calles animadas, gremios y mercados. Aprendiste a moverte entre gente, y a no fiarte de todos.',
      intro: 'Creciste entre mercados, gremios y callejones. Sabes regatear, leer a la gente... y reconocer cuándo una ciudad empieza a tener miedo.' },
    capital: { n: 'Capital', e: '🏯', bonus: { men: 2 }, gold: 250, items: { pocion: 2, te_fino: 1 }, poi: 'capital',
      d: 'Palacios, academias y política. Lo tienes todo a mano, pero también tienes enemigos que aún no conoces.',
      intro: 'La capital te dio educación, buenos modales y una vida cómoda. Demasiado cómoda. Algo en tu interior pedía salir a ver el mundo de verdad.' },
    monte: { n: 'Monte', e: '⛰️', bonus: { fue: 1, esp: 1 }, gold: 30, items: { hierba: 3, onigiri: 2 }, poi: 'monte',
      d: 'Entre cumbres y niebla. Gente dura, silenciosa. Los espíritus aquí no son un cuento.',
      intro: 'Creciste entre niebla, cumbres y espíritus que susurran por las noches. La montaña te hizo fuerte... y un poco salvaje.' },
    azar: { n: 'Azar', e: '🎲', bonus: {}, gold: 80, items: { pocion: 1, onigiri: 2 }, poi: 'random',
      d: 'Que el destino decida: aldea, ciudad, capital o monte. Con una pequeña sorpresa extra.',
      intro: 'No recuerdas bien cómo llegaste aquí; solo que despertaste con un destino pendiente y los bolsillos casi vacíos.' },
  };

  /* ------ Estados de combate ------ */
  D.STATUS = {
    burn: { n: 'Quemadura', e: '🔥', dot: 1 }, bleed: { n: 'Sangrado', e: '🩸', dot: 1 },
    stun: { n: 'Aturdido', e: '💫', skip: 1 }, freeze: { n: 'Congelado', e: '🧊', skip: 1 },
    weak: { n: 'Debilitado', e: '⬇️' }, atkup: { n: 'Furia', e: '⬆️' }, defup: { n: 'Guardia', e: '🛡️' }, dodge: { n: 'Esquiva', e: '💨' },
  };

  /* ------ Poderes ------ */
  const S = (id, n, lvl, cost, o) => Object.assign({ id, n, lvl, cost }, o);
  D.POWERS = {
    fuego: { n: 'Fuego', e: '🔥', col: '#ff7a45', stat: 'mag', d: 'Daño explosivo y quemaduras.', skills: [
      S('f1', 'Chispa Carmesí', 1, 4, { t: 'dmg', m: 1.5, st: { id: 'burn', t: 3, p: 0.3 } }),
      S('f2', 'Lanza de Brasas', 3, 7, { t: 'dmg', m: 2.1, st: { id: 'burn', t: 3, p: 0.5 } }),
      S('f3', 'Aura Ardiente', 6, 9, { t: 'buff', buff: { id: 'atkup', t: 4 } }),
      S('f4', 'Tormenta Ígnea', 10, 14, { t: 'dmg', m: 1.5, aoe: 1, st: { id: 'burn', t: 3, p: 0.6 } }),
      S('f5', 'Fénix Eterno', 15, 24, { t: 'dmg', m: 4.2, st: { id: 'burn', t: 4, p: 1 } })] },
    rayo: { n: 'Rayo', e: '⚡', col: '#ffe14d', stat: 'mag', d: 'Velocidad y aturdimiento.', skills: [
      S('r1', 'Relámpago Corto', 1, 4, { t: 'dmg', m: 1.45, st: { id: 'stun', t: 1, p: 0.25 } }),
      S('r2', 'Cadena de Rayos', 3, 9, { t: 'dmg', m: 1.1, aoe: 1 }),
      S('r3', 'Paso Relámpago', 6, 8, { t: 'buff', buff: { id: 'dodge', t: 4 } }),
      S('r4', 'Trueno Divino', 10, 14, { t: 'dmg', m: 2.9, st: { id: 'stun', t: 1, p: 0.55 } }),
      S('r5', 'Dios del Trueno', 15, 25, { t: 'dmg', m: 3.2, aoe: 1, st: { id: 'stun', t: 1, p: 0.7 } })] },
    viento: { n: 'Viento', e: '🌪️', col: '#7fe3c4', stat: 'mag', d: 'Cortes veloces y esquiva.', skills: [
      S('v1', 'Corte de Viento', 1, 4, { t: 'dmg', m: 1.4, st: { id: 'bleed', t: 3, p: 0.3 } }),
      S('v2', 'Ráfaga Cortante', 3, 8, { t: 'dmg', m: 1.0, aoe: 1, st: { id: 'weak', t: 3, p: 0.4 } }),
      S('v3', 'Paso del Viento', 6, 7, { t: 'buff', buff: { id: 'dodge', t: 4 } }),
      S('v4', 'Cuchilla Huracanada', 10, 13, { t: 'dmg', m: 2.6, st: { id: 'bleed', t: 4, p: 0.7 } }),
      S('v5', 'Ojo de la Tormenta', 15, 24, { t: 'dmg', m: 2.4, aoe: 1, st: { id: 'stun', t: 1, p: 0.6 } })] },
    agua: { n: 'Agua', e: '💧', col: '#4fa8ff', stat: 'mag', d: 'Curación y control.', skills: [
      S('a1', 'Gota Afilada', 1, 4, { t: 'dmg', m: 1.4 }),
      S('a2', 'Ola Curativa', 3, 8, { t: 'heal', m: 2.6 }),
      S('a3', 'Marea Fría', 6, 9, { t: 'dmg', m: 1.2, aoe: 1, st: { id: 'weak', t: 3, p: 0.6 } }),
      S('a4', 'Prisión Acuática', 10, 13, { t: 'dmg', m: 2.0, st: { id: 'stun', t: 2, p: 0.65 } }),
      S('a5', 'Tsunami', 15, 25, { t: 'dmg', m: 3.0, aoe: 1 })] },
    hielo: { n: 'Hielo', e: '❄️', col: '#9fe6ff', stat: 'mag', d: 'Congela y protege.', skills: [
      S('h1', 'Aguja de Hielo', 1, 4, { t: 'dmg', m: 1.4, st: { id: 'freeze', t: 1, p: 0.2 } }),
      S('h2', 'Escarcha', 3, 7, { t: 'dmg', m: 1.5, st: { id: 'weak', t: 3, p: 0.7 } }),
      S('h3', 'Armadura de Hielo', 6, 9, { t: 'buff', buff: { id: 'defup', t: 4 } }),
      S('h4', 'Ventisca', 10, 14, { t: 'dmg', m: 1.5, aoe: 1, st: { id: 'freeze', t: 1, p: 0.4 } }),
      S('h5', 'Cero Absoluto', 15, 24, { t: 'dmg', m: 4.0, st: { id: 'freeze', t: 2, p: 1 } })] },
    sombra: { n: 'Sombra', e: '🌑', col: '#a77bff', stat: 'mag', d: 'Roba vida y debilita.', skills: [
      S('s1', 'Garra Sombría', 1, 4, { t: 'dmg', m: 1.5, st: { id: 'weak', t: 3, p: 0.3 } }),
      S('s2', 'Drenar Vida', 3, 7, { t: 'drain', m: 1.5 }),
      S('s3', 'Velo de Sombras', 6, 8, { t: 'buff', buff: { id: 'dodge', t: 4 } }),
      S('s4', 'Hambre del Abismo', 10, 13, { t: 'drain', m: 2.6 }),
      S('s5', 'Eclipse', 15, 25, { t: 'dmg', m: 2.7, aoe: 1, st: { id: 'weak', t: 4, p: 1 } })] },
    luz: { n: 'Luz', e: '✨', col: '#ffe9a6', stat: 'mag', d: 'Cura y purifica.', skills: [
      S('l1', 'Destello', 1, 4, { t: 'dmg', m: 1.45 }),
      S('l2', 'Toque Sanador', 3, 7, { t: 'heal', m: 2.8 }),
      S('l3', 'Escudo Sagrado', 6, 9, { t: 'buff', buff: { id: 'defup', t: 4 } }),
      S('l4', 'Juicio Celestial', 10, 14, { t: 'dmg', m: 2.6 }),
      S('l5', 'Amanecer', 15, 24, { t: 'dmg', m: 2.0, aoe: 1, sh: 0.3 })] },
    espada: { n: 'Espada Espiritual', e: '⚔️', col: '#d6dcff', stat: 'atk', d: 'Técnicas físicas imbuidas de espíritu.', skills: [
      S('e1', 'Tajo Espiritual', 1, 4, { t: 'dmg', m: 1.5, st: { id: 'bleed', t: 3, p: 0.3 } }),
      S('e2', 'Estocada Veloz', 3, 6, { t: 'dmg', m: 2.0 }),
      S('e3', 'Postura de Hierro', 6, 8, { t: 'buff', buff: { id: 'defup', t: 4 } }),
      S('e4', 'Danza de Cien Cortes', 10, 14, { t: 'dmg', m: 1.4, aoe: 1, st: { id: 'bleed', t: 3, p: 0.6 } }),
      S('e5', 'Corte Trascendente', 15, 24, { t: 'dmg', m: 4.6 })] },
  };

  /* ------ Objetos ------ */
  const I = (id, n, e, t, price, o) => (D.ITEMS[id] = Object.assign({ id, n, e, t, price }, o));
  D.ITEMS = {};
  I('pocion', 'Poción', '🧪', 'cons', 25, { hp: 40, d: 'Recupera 40 de vida.' });
  I('pocion_mayor', 'Poción mayor', '⚗️', 'cons', 85, { hp: 120, d: 'Recupera 120 de vida.' });
  I('onigiri', 'Onigiri', '🍙', 'cons', 8, { hp: 18, d: 'Bolita de arroz. +18 vida.' });
  I('elixir', 'Elixir de ki', '🍶', 'cons', 35, { en: 25, d: 'Recupera 25 de energía.' });
  I('elixir_mayor', 'Elixir mayor', '🫙', 'cons', 95, { en: 70, d: 'Recupera 70 de energía.' });
  I('antidoto', 'Antídoto', '🌱', 'cons', 18, { cure: 1, d: 'Elimina estados negativos.' });
  I('humo', 'Bomba de humo', '💨', 'cons', 30, { flee: 1, d: 'Huida segura del combate.' });
  I('shuriken', 'Shuriken', '✴️', 'cons', 22, { dmg: 32, d: 'Lanzable: 32 de daño.' });
  I('bomba', 'Bomba ígnea', '💣', 'cons', 60, { dmg: 80, d: 'Lanzable: 80 de daño.' });
  I('bokken', 'Bokken', '🪵', 'weapon', 40, { atk: 2, d: 'Espada de madera.' });
  I('katana_hierro', 'Katana de hierro', '🗡️', 'weapon', 190, { atk: 6, d: 'Fiable y afilada.' });
  I('lanza', 'Lanza de ciervo', '🔱', 'weapon', 380, { atk: 9, d: 'Largo alcance y buen filo.' });
  I('baston', 'Bastón espiritual', '🪄', 'weapon', 260, { atk: 2, mag: 8, d: 'Amplifica tu poder.' });
  I('guantes', 'Guantes del trueno', '🥊', 'weapon', 520, { atk: 8, mag: 5, d: 'Puños cargados de ki.' });
  I('katana_plata', 'Katana de plata', '⚔️', 'weapon', 650, { atk: 13, d: 'Filo de plata lunar.' });
  I('espada_eclipse', 'Espada del Eclipse', '🌘', 'weapon', 0, { atk: 18, mag: 14, d: 'Legendaria. Forjada con la sombra.' });
  I('kimono', 'Kimono de cuero', '👘', 'armor', 60, { def: 3, d: 'Protección ligera.' });
  I('armadura_ligera', 'Armadura ligera', '🛡️', 'armor', 230, { def: 7, d: 'Placas sobre tela.' });
  I('capa_sombra', 'Capa de sombra', '🧥', 'armor', 520, { def: 9, agi: 2, d: 'Ligera y sigilosa.' });
  I('armadura_samurai', 'Armadura samurái', '🪖', 'armor', 760, { def: 14, d: 'Pesada y noble.' });
  I('amuleto_bronce', 'Amuleto de bronce', '📿', 'amulet', 120, { bonus: { fue: 1 }, d: '+1 Fuerza' });
  I('amuleto_jade', 'Amuleto de jade', '🟢', 'amulet', 300, { bonus: { esp: 2 }, d: '+2 Espíritu' });
  I('amuleto_viento', 'Amuleto del viento', '🪽', 'amulet', 300, { bonus: { agi: 2 }, d: '+2 Agilidad' });
  I('colgante_sabio', 'Colgante del sabio', '🔮', 'amulet', 300, { bonus: { men: 2 }, d: '+2 Mente' });
  I('talisman', 'Talismán de labia', '🧿', 'amulet', 280, { bonus: { car: 2 }, d: '+2 Carisma' });
  I('anillo', 'Anillo de compromiso', '💍', 'key', 250, { d: 'Necesario para pedir matrimonio.' });
  // regalos (tags de gustos)
  I('flor', 'Flor de cerezo', '🌸', 'gift', 15, { tags: ['flor'], d: 'Regalo: flores.' });
  I('dango', 'Dango', '🍡', 'gift', 10, { tags: ['dulce', 'comida'], d: 'Regalo: dulce.' });
  I('pastel', 'Pastel de castaña', '🍰', 'gift', 26, { tags: ['dulce', 'comida'], d: 'Regalo: dulce.' });
  I('ramen', 'Ramen caliente', '🍜', 'gift', 18, { tags: ['comida'], d: 'Regalo: comida.' });
  I('sake', 'Sake de arroz', '🍶', 'gift', 30, { tags: ['bebida'], d: 'Regalo: bebida.' });
  I('te_fino', 'Té fino', '🍵', 'gift', 22, { tags: ['bebida'], d: 'Regalo: bebida.' });
  I('libro', 'Libro antiguo', '📖', 'gift', 45, { tags: ['libro', 'magia'], d: 'Regalo: libro.' });
  I('kunai_deco', 'Kunai decorado', '🔪', 'gift', 60, { tags: ['arma'], d: 'Regalo: arma.' });
  I('joya', 'Joya de ámbar', '💎', 'gift', 200, { tags: ['lujo'], d: 'Regalo: lujo.' });
  I('perfume', 'Perfume de glicina', '🧴', 'gift', 70, { tags: ['belleza'], d: 'Regalo: belleza.' });
  I('peluche', 'Peluche de zorro', '🧸', 'gift', 35, { tags: ['tierno'], d: 'Regalo: tierno.' });
  I('pergamino', 'Pergamino arcano', '📜', 'gift', 90, { tags: ['magia'], d: 'Regalo: magia.' });
  I('pez_dorado', 'Pez dorado', '🐟', 'gift', 120, { tags: ['raro'], d: 'Regalo: raro.' });
  I('mascara', 'Máscara de teatro', '🎭', 'gift', 55, { tags: ['arte'], d: 'Regalo: arte.' });
  I('flauta', 'Flauta de bambú', '🎶', 'gift', 80, { tags: ['arte'], d: 'Regalo: arte.' });
  // materiales
  I('hierba', 'Hierba medicinal', '🌿', 'mat', 12, { d: 'Material. Útil para encargos.' });
  I('colmillo', 'Colmillo espectral', '🦷', 'mat', 14, { d: 'Material.' });
  I('esencia', 'Esencia espiritual', '💠', 'mat', 40, { d: 'Material valioso.' });
  I('escama', 'Escama de dragón', '🐉', 'mat', 95, { d: 'Material raro.' });
  I('cristal', 'Cristal de ki', '🔷', 'mat', 60, { d: 'Material.' });
  I('sello', 'Sello ancestral', '🔰', 'key', 0, { d: 'Fragmento del sello que contiene la Sombra.' });
  D.GIFT_TAGS = ['flor', 'dulce', 'bebida', 'libro', 'arma', 'lujo', 'belleza', 'tierno', 'magia', 'arte', 'comida', 'raro'];

  D.SHOP = {
    aldea: ['onigiri', 'pocion', 'antidoto', 'kimono', 'bokken', 'flor', 'dango', 'ramen', 'hierba'],
    monte: ['onigiri', 'pocion', 'hierba', 'antidoto', 'amuleto_bronce', 'te_fino', 'elixir'],
    ciudad: ['onigiri', 'pocion', 'pocion_mayor', 'elixir', 'antidoto', 'humo', 'shuriken', 'katana_hierro', 'baston', 'kimono', 'armadura_ligera', 'amuleto_bronce', 'amuleto_viento', 'flor', 'dango', 'pastel', 'sake', 'te_fino', 'ramen', 'libro', 'perfume', 'peluche', 'mascara', 'kunai_deco', 'anillo'],
    capital: ['pocion', 'pocion_mayor', 'elixir', 'elixir_mayor', 'antidoto', 'humo', 'shuriken', 'bomba', 'katana_hierro', 'lanza', 'baston', 'guantes', 'katana_plata', 'armadura_ligera', 'capa_sombra', 'armadura_samurai', 'amuleto_jade', 'amuleto_viento', 'colgante_sabio', 'talisman', 'flor', 'pastel', 'sake', 'te_fino', 'libro', 'joya', 'perfume', 'peluche', 'pergamino', 'pez_dorado', 'mascara', 'flauta', 'kunai_deco', 'anillo'],
  };

  /* ------ Lugares y asentamientos ------ */
  D.PLACES = {
    plaza: { n: 'Plaza', e: '⛲', d: 'El corazón del lugar: aquí se cruza todo el mundo.' },
    mercado: { n: 'Mercado', e: '🏮', d: 'Puestos, regateo y objetos curiosos.' },
    taberna: { n: 'Taberna', e: '🍶', d: 'Humo, música y secretos a media voz.' },
    templo: { n: 'Templo', e: '⛩️', d: 'Calma, incienso y rezos.' },
    dojo: { n: 'Dojo', e: '🥋', d: 'Entrenamiento, disciplina y rivalidades.' },
    gremio: { n: 'Gremio', e: '📜', d: 'Tablón de encargos y gente con cicatrices.' },
    arena: { n: 'Arena', e: '🏟️', d: 'Combates a cambio de gloria y ryo.' },
  };
  D.SETTLE = {
    aldea: { n: 'Aldea', e: '🏡', npcs: 7, places: ['plaza', 'mercado', 'taberna', 'templo'], inn: 12, house: 450 },
    ciudad: { n: 'Ciudad', e: '🏘️', npcs: 12, places: ['plaza', 'mercado', 'taberna', 'templo', 'dojo', 'gremio'], inn: 20, house: 1100 },
    capital: { n: 'Capital', e: '🏯', npcs: 16, places: ['plaza', 'mercado', 'taberna', 'templo', 'dojo', 'gremio', 'arena'], inn: 35, house: 2400 },
    monte: { n: 'Aldea del monte', e: '⛺', npcs: 6, places: ['plaza', 'templo', 'dojo', 'taberna'], inn: 8, house: 300 },
  };

  D.POI_KINDS = {
    capital: { e: '🏯' }, ciudad: { e: '🏘️' }, aldea: { e: '🏡' }, monte: { e: '⛺' },
    cueva: { e: '🕳️' }, ruinas: { e: '🏛️' }, torre: { e: '🗼' }, mina: { e: '⛏️' }, bosque: { e: '🏮' },
    santuario: { e: '⛩️' }, guarida: { e: '🌋' },
  };

  /* ------ Enemigos (nivel 1 base; escalan con el nivel) ------ */
  const E = (id, n, e, tier, zones, hp, atk, def, spd, xp, gold, o) => (D.ENEMIES[id] = Object.assign({ id, n, e, tier, zones, hp, atk, def, spd, xp, gold, skills: [], drops: [] }, o));
  D.ENEMIES = {};
  E('lobo', 'Lobo espectral', '🐺', 1, ['bosque', 'pradera', 'montana'], 36, 12, 2, 9, 12, 6, { skills: [{ n: 'Mordisco', m: 1.3, st: { id: 'bleed', t: 3, p: 0.3 } }], drops: [['colmillo', 0.4]] });
  E('bandido', 'Bandido del camino', '🪓', 1, ['camino', 'pradera', 'bosque'], 42, 13, 3, 8, 16, 18, { human: 1, skills: [{ n: 'Tajo sucio', m: 1.2 }], drops: [['pocion', 0.2], ['onigiri', 0.3]] });
  E('kodama', 'Kodama travieso', '🌳', 1, ['bosque'], 30, 11, 1, 11, 11, 4, { skills: [{ n: 'Lluvia de hojas', m: 1.1, st: { id: 'weak', t: 3, p: 0.35 } }], drops: [['hierba', 0.6]] });
  E('serpiente', 'Serpiente roja', '🐍', 1, ['pradera', 'costa', 'bosque'], 32, 12, 1, 10, 11, 5, { skills: [{ n: 'Veneno', m: 1.0, st: { id: 'bleed', t: 4, p: 0.7 } }], drops: [['antidoto', 0.15]] });
  E('jabali', 'Jabalí furioso', '🐗', 1, ['bosque', 'pradera'], 52, 12, 4, 6, 14, 5, { skills: [{ n: 'Embestida', m: 1.5, st: { id: 'stun', t: 1, p: 0.2 } }], drops: [['onigiri', 0.4]] });
  E('cangrejo', 'Cangrejo de roca', '🦀', 1, ['costa'], 44, 11, 6, 4, 12, 6, { skills: [{ n: 'Pinza', m: 1.3 }] });
  E('ronin', 'Rōnin errante', '🤺', 2, ['camino', 'pradera', 'montana'], 78, 19, 6, 11, 28, 40, { human: 1, skills: [{ n: 'Iaijutsu', m: 1.6 }, { n: 'Guardia', m: 1.0 }], drops: [['katana_hierro', 0.06], ['pocion', 0.3]] });
  E('ninja', 'Ninja renegado', '🥷', 2, ['bosque', 'camino', 'montana'], 62, 21, 3, 17, 30, 45, { human: 1, skills: [{ n: 'Kunai envenenada', m: 1.2, st: { id: 'bleed', t: 3, p: 0.6 } }, { n: 'Golpe a traición', m: 1.8 }], drops: [['shuriken', 0.4], ['humo', 0.2]] });
  E('tengu', 'Tengu del viento', '🦅', 2, ['montana', 'bosque'], 68, 18, 4, 15, 29, 32, { skills: [{ n: 'Ráfaga', m: 1.4, st: { id: 'weak', t: 3, p: 0.4 } }], drops: [['esencia', 0.15]] });
  E('kitsune', 'Kitsune salvaje', '🦊', 2, ['bosque', 'pradera'], 64, 17, 4, 14, 30, 34, { skills: [{ n: 'Fuego fatuo', m: 1.4, st: { id: 'burn', t: 3, p: 0.6 } }], drops: [['esencia', 0.2], ['flor', 0.2]] });
  E('golem', 'Gólem de piedra', '🗿', 2, ['montana'], 120, 19, 11, 3, 32, 30, { skills: [{ n: 'Puñetazo roca', m: 1.6, st: { id: 'stun', t: 1, p: 0.3 } }], drops: [['cristal', 0.25]] });
  E('cultista', 'Cultista de la Sombra', '🧙', 2, ['camino', 'bosque', 'montana'], 60, 20, 3, 10, 30, 50, { human: 1, skills: [{ n: 'Maldición', m: 1.2, st: { id: 'weak', t: 4, p: 0.7 } }, { n: 'Rayo oscuro', m: 1.7 }], drops: [['esencia', 0.3], ['elixir', 0.3]] });
  E('oso', 'Oso de las cumbres', '🐻', 2, ['montana', 'bosque'], 100, 20, 6, 6, 30, 12, { skills: [{ n: 'Zarpazo', m: 1.5, st: { id: 'bleed', t: 3, p: 0.4 } }], drops: [['colmillo', 0.5]] });
  E('oni', 'Oni cazador', '👹', 3, ['montana', 'bosque', 'pradera'], 160, 29, 10, 8, 60, 90, { skills: [{ n: 'Garrotazo', m: 1.7, st: { id: 'stun', t: 1, p: 0.35 } }, { n: 'Rugido', m: 1.0, st: { id: 'weak', t: 3, p: 0.8 } }], drops: [['esencia', 0.4], ['pocion_mayor', 0.25]] });
  E('yuki', 'Yuki-onna', '👸', 3, ['montana'], 120, 27, 6, 13, 58, 80, { skills: [{ n: 'Aliento helado', m: 1.5, st: { id: 'freeze', t: 1, p: 0.45 } }], drops: [['cristal', 0.4]] });
  E('jinete', 'Jinete sombrío', '🏇', 3, ['camino', 'pradera'], 140, 30, 8, 15, 62, 110, { human: 1, skills: [{ n: 'Carga', m: 1.7, st: { id: 'stun', t: 1, p: 0.3 } }], drops: [['katana_plata', 0.04], ['pocion_mayor', 0.3]] });
  E('asesino', 'Asesino de la Luna', '🗡️', 3, ['camino', 'bosque', 'montana'], 105, 34, 5, 21, 64, 120, { human: 1, skills: [{ n: 'Corte letal', m: 2.0, st: { id: 'bleed', t: 4, p: 0.8 } }], drops: [['capa_sombra', 0.04], ['humo', 0.3]] });
  E('dragon', 'Dragón menor', '🐲', 3, ['montana'], 230, 33, 12, 10, 90, 160, { skills: [{ n: 'Aliento ígneo', m: 1.8, st: { id: 'burn', t: 3, p: 0.7 } }, { n: 'Cola brutal', m: 1.4 }], drops: [['escama', 0.5], ['esencia', 0.5]] });
  // Jefes
  E('guardian', 'Guardián del santuario', '🛡️', 2, [], 150, 22, 9, 8, 70, 120, { boss: 1, skills: [{ n: 'Golpe sagrado', m: 1.6 }, { n: 'Sello', m: 1.0, st: { id: 'weak', t: 3, p: 0.8 } }], drops: [['esencia', 1]] });
  E('oni_rey', 'Rey Oni', '👺', 3, [], 300, 34, 12, 9, 150, 300, { boss: 1, skills: [{ n: 'Aplastamiento', m: 1.9, st: { id: 'stun', t: 1, p: 0.4 } }, { n: 'Furia roja', m: 1.4, st: { id: 'burn', t: 3, p: 0.6 } }], drops: [['escama', 1], ['pocion_mayor', 1]] });
  E('quimera', 'Quimera de las ruinas', '🦁', 3, [], 280, 33, 11, 12, 140, 280, { boss: 1, skills: [{ n: 'Triple mordida', m: 1.8, st: { id: 'bleed', t: 3, p: 0.7 } }, { n: 'Llamarada', m: 1.5, st: { id: 'burn', t: 3, p: 0.7 } }], drops: [['cristal', 1], ['esencia', 1]] });
  E('espectro', 'General espectral', '💀', 3, [], 260, 36, 9, 14, 140, 280, { boss: 1, skills: [{ n: 'Tajo fantasma', m: 1.9 }, { n: 'Llamada de muertos', m: 1.1, st: { id: 'weak', t: 4, p: 0.9 } }], drops: [['cristal', 1], ['elixir_mayor', 1]] });
  E('sombras', 'Señor de las Sombras', '🌑', 4, [], 620, 46, 16, 14, 600, 1500, { boss: 1, skills: [{ n: 'Abismo', m: 1.9, st: { id: 'weak', t: 3, p: 0.7 } }, { n: 'Hambre eterna', m: 1.6, st: { id: 'bleed', t: 4, p: 0.9 } }, { n: 'Eclipse total', m: 2.4, st: { id: 'stun', t: 1, p: 0.4 } }], drops: [['espada_eclipse', 1]] });

  /* ------ Eventos con decisiones (formato de datos) ------ */
  // Resultado (o): text, gold, xp, hp, en, honor, fame, item:{id:±n}, fight:[ids], npc:true, reveal:true, stat:{fue:1}, steps:n, check:{stat,dc,win:o,lose:o}
  // Requisitos (req): {item:'id'} | {gold:n} | {stat:'car',min:n}
  D.EVENTS = [
    { id: 'viejo_herido', zones: ['camino', 'bosque', 'pradera'], title: 'Un anciano herido', text: 'Entre la maleza ves a un anciano con la pierna ensangrentada. Te mira con ojos cansados: «Por favor... no puedo caminar».', choices: [
      { t: 'Curarle con una poción', req: { item: 'pocion' }, o: { text: 'Le das la poción. Se recupera y te regala un amuleto de su aldea y mil bendiciones.', item: { pocion: -1, amuleto_bronce: 1 }, honor: 8, xp: 25 } },
      { t: 'Vendarle y ayudarle a levantarse', o: { text: 'Pierdes un rato, pero el anciano te agradece con lágrimas en los ojos.', honor: 5, xp: 18, steps: 6 } },
      { t: 'Registrar sus bolsillos', o: { text: 'Le quitas unas monedas mientras gime. Te sientes sucio.', gold: 30, honor: -10 } },
      { t: 'Seguir tu camino', o: { text: 'Te alejas. Su voz se pierde entre los árboles.', honor: -2 } }] },
    { id: 'nino_perdido', zones: ['pradera', 'bosque', 'camino'], title: 'Una niña llorando', text: 'Una niña de unos siete años llora sentada al borde del camino. Dice que se ha perdido de su familia.', choices: [
      { t: 'Acompañarla a buscar a su familia', o: { text: 'Tras buscar un buen rato, la encontráis. Su madre te da todo lo que lleva encima.', gold: 40, honor: 10, xp: 30, steps: 10, fame: 2 } },
      { t: 'Darle comida y seguir', req: { item: 'onigiri' }, o: { text: 'La niña sonríe entre lágrimas. Alguien pasará a recogerla, seguro.', item: { onigiri: -1 }, honor: 3, xp: 8 } },
      { t: 'Ignorarla', o: { text: 'No es asunto tuyo... ¿verdad?', honor: -6 } }] },
    { id: 'santuario_viejo', zones: ['bosque', 'montana'], title: 'Un santuario olvidado', text: 'Un pequeño torii cubierto de musgo marca la entrada de un santuario abandonado. Una brisa fría te acaricia la nuca.', choices: [
      { t: 'Rezar y dejar una ofrenda', req: { gold: 20 }, o: { text: 'Depositas 20 ryo. Sientes una calidez en el pecho; los espíritus te bendicen.', gold: -20, hp: 999, en: 999, honor: 4, xp: 20 } },
      { t: 'Rezar en silencio', o: { text: 'Cierras los ojos un momento. Algo susurra tu nombre... y se calla.', en: 15, xp: 10 } },
      { t: 'Saquear el altar', o: { check: { stat: 'esp', dc: 12, win: { text: 'Tomas un cristal del altar sin que nada pase. Esta vez.', item: { cristal: 1 }, honor: -6 }, lose: { text: 'Una sombra se alza del altar. «Ladrón...»', honor: -6, fight: ['kodama', 'kodama'] } } } }] },
    { id: 'duelista', zones: ['camino', 'pradera'], title: 'Un duelista te corta el paso', text: 'Un espadachín de mirada afilada desenvaina un palmo. «Se dice que eres bueno. Demuéstralo».', choices: [
      { t: 'Aceptar el duelo', o: { text: 'Las espadas cantan...', fight: ['ronin'], fame: 3 } },
      { t: 'Rechazarlo con educación', req: { stat: 'car', min: 8 }, o: { text: 'Con unas palabras amables, el duelista asiente y te deja pasar.', xp: 10 } },
      { t: 'Huir', o: { text: 'Das media vuelta. Escuchas una carcajada a tu espalda.', fame: -1, steps: 4 } }] },
    { id: 'mercader_dudoso', zones: ['camino', 'costa'], title: 'El mercader del abrigo largo', text: 'Un hombre con un abrigo lleno de bolsillos te susurra: «Psst... ¿quieres un objeto muy especial? Barato, barato».', choices: [
      { t: 'Comprar el objeto misterioso (60 ryo)', req: { gold: 60 }, o: { check: { stat: 'men', dc: 10, win: { text: 'Resulta ser una auténtica pieza rara. ¡Menuda ganga!', gold: -60, item: { pergamino: 1, elixir: 1 } }, lose: { text: 'Era una baratija. Te han timado.', gold: -60, item: { dango: 1 } } } } },
      { t: 'Denunciarlo a la guardia local', o: { text: 'El mercader huye entre maldiciones. Los aldeanos te lo agradecen.', honor: 5, xp: 15 } },
      { t: 'Ignorarlo', o: { text: 'Sigues tu camino.' } }] },
    { id: 'bandidos_aldeanos', zones: ['camino', 'pradera'], title: 'Extorsión en el camino', text: 'Unos bandidos acorralan a un grupo de campesinos pidiéndoles el diezmo. Uno te mira, suplicante.', choices: [
      { t: 'Plantarles cara', o: { text: '«¡Un héroe!», gritan los campesinos. Los bandidos desenvainan.', fight: ['bandido', 'bandido'], honor: 6, fame: 2 } },
      { t: 'Convencerlos con palabras', req: { stat: 'car', min: 9 }, o: { check: { stat: 'car', dc: 13, win: { text: 'Tu labia hace que los bandidos se marchen sin derramar una gota de sangre.', honor: 7, xp: 35, fame: 2 }, lose: { text: 'No cuela. Los bandidos se enfadan.', fight: ['bandido', 'bandido'] } } } },
      { t: 'Unirte a los bandidos', o: { text: 'Te llevas una parte del botín. Los campesinos te miran con odio.', gold: 70, honor: -15, fame: -3 } },
      { t: 'No meterte', o: { text: 'Te marchas. Lo que pasa después no lo quieres saber.', honor: -3 } }] },
    { id: 'puente_roto', zones: ['bosque', 'montana', 'pradera'], title: 'Puente colgante roto', text: 'Un viejo puente de cuerdas cuelga a medio caer sobre un barranco. Al otro lado ves un cofre.', choices: [
      { t: 'Cruzar con cuidado', o: { check: { stat: 'agi', dc: 12, win: { text: 'Cruzas haciendo equilibrios. El cofre guarda un buen botín.', gold: 60, item: { pocion: 1 }, xp: 25 }, lose: { text: 'Resbalas y caes sobre las rocas.', hp: -18 } } } },
      { t: 'Rodear', o: { text: 'Pierdes tiempo, pero llegas entero.', steps: 10 } }] },
    { id: 'estrellas', zones: ['any'], night: 1, title: 'Lluvia de estrellas', text: 'El cielo se llena de estrellas fugaces. Dicen que quien pida un deseo con el corazón limpio...', choices: [
      { t: 'Pedir fuerza', o: { text: 'Sientes los músculos más firmes.', stat: { fue: 1 } } },
      { t: 'Pedir sabiduría', o: { text: 'La mente se te aclara.', stat: { men: 1 } } },
      { t: 'Pedir amor', o: { text: 'Notas un cosquilleo en el pecho. Alguien piensa en ti.', stat: { car: 1 }, npc: true } },
      { t: 'Solo contemplarlas', o: { text: 'Una paz inmensa. Recuperas fuerzas.', hp: 25, en: 25 } }] },
    { id: 'maestro_errante', zones: ['camino', 'montana'], title: 'Un maestro errante', text: 'Un hombre de barba larga medita bajo un árbol. Sin abrir los ojos, dice: «Sé lo que buscas. Pelea conmigo y te enseñaré».', choices: [
      { t: 'Combatir al maestro', o: { text: 'Desenvaina una caña de bambú. ¡Cuidado!', fight: ['ronin'], xp: 40, stat: { agi: 1 } } },
      { t: 'Sentarte a meditar', o: { check: { stat: 'esp', dc: 11, win: { text: 'Notas tu ki fluir con claridad.', stat: { esp: 1 }, xp: 25 }, lose: { text: 'Te quedas dormido. El maestro se ha ido.', steps: 6 } } } }] },
    { id: 'termas', zones: ['montana', 'bosque'], title: 'Aguas termales', text: 'Entre la niebla ves un manantial humeante. El agua está caliente y huele a azufre.', choices: [
      { t: 'Bañarte y descansar', o: { text: 'Te relajas por completo. A lo lejos oyes a alguien que también disfruta del agua...', hp: 999, en: 999, steps: 8, npc: true } },
      { t: 'Llenar un frasco', o: { text: 'Guardas un poco de agua termal.', item: { pocion: 1 } } }] },
    { id: 'mapa_tesoro', zones: ['any'], title: 'Un mapa arrugado', text: 'Encuentras un mapa viejo con una cruz marcada. Parece indicar un lugar que no conoces.', choices: [
      { t: 'Estudiarlo', o: { text: 'Con esfuerzo, descifras la ubicación y la marcas en tu mapa.', reveal: true, xp: 12 } },
      { t: 'Venderlo', o: { text: 'Un mercader te da unas monedas por él.', gold: 45 } }] },
    { id: 'espiritu_espejo', zones: ['bosque', 'montana'], title: 'El espejo de la niebla', text: 'En un claro, un espejo de bronce flota entre la niebla. Tu reflejo sonríe cuando tú no lo haces.', choices: [
      { t: 'Tocar el espejo', o: { check: { stat: 'esp', dc: 13, win: { text: 'El reflejo se inclina ante ti: has dominado a tu sombra.', stat: { esp: 1 }, xp: 40, en: 20 }, lose: { text: 'El reflejo sale del espejo con tu cara...', fight: ['kodama', 'kitsune'] } } } },
      { t: 'Romperlo de una patada', o: { text: 'El espejo estalla en mil cristales. Recoges un fragmento.', item: { cristal: 1 }, honor: -2 } },
      { t: 'Alejarte', o: { text: 'Ahora el reflejo no te sigue con la mirada. Mejor.' } }] },
    { id: 'ladron', zones: ['camino', 'town'], title: '¡Ladrón!', text: 'Notas un tirón: un muchacho encapuchado te ha quitado la bolsa y sale corriendo.', choices: [
      { t: 'Perseguirlo', o: { check: { stat: 'agi', dc: 11, win: { text: 'Lo alcanzas en un callejón. Te devuelve la bolsa... y algo extra por el susto.', gold: 25, honor: 2 }, lose: { text: 'Se escabulle entre la multitud.', gold: -30 } } } },
      { t: 'Dejarlo ir', o: { text: 'Quizá necesitaba el dinero más que tú.', gold: -20, honor: 3 } }] },
    { id: 'pelea_taberna', zones: ['town'], title: 'Pelea en la taberna', text: 'Dos borrachos se pelean y una silla vuela hacia ti. Alguien grita: «¡Que empiece la fiesta!».', choices: [
      { t: 'Meterte de lleno', o: { text: 'Los puños vuelan.', fight: ['bandido'], xp: 15, fame: 1 } },
      { t: 'Separarlos', req: { stat: 'fue', min: 8 }, o: { text: 'Los agarras del cuello. Todo el mundo aplaude.', honor: 4, fame: 2, xp: 14 } },
      { t: 'Esconderte tras la barra', o: { text: 'Cuando acaba, el tabernero te invita a una copa.', hp: 5 } }] },
    { id: 'caravana', zones: ['camino'], title: 'Caravana atacada', text: 'Una caravana de mercaderes está siendo atacada por lobos espectrales.', choices: [
      { t: 'Defenderla', o: { text: '¡A por ellos!', fight: ['lobo', 'lobo'], honor: 5, gold: 60, fame: 2 } },
      { t: 'Aprovechar el caos', o: { text: 'Coges un par de bultos de la caravana mientras se distraen.', gold: 55, item: { pocion: 1 }, honor: -12 } },
      { t: 'Seguir', o: { text: 'No es tu pelea.' } }] },
    { id: 'festival', zones: ['town'], title: 'Festival de las linternas', text: 'Las calles brillan con cientos de linternas de papel. Hay música, puestos de comida y parejas bailando.', choices: [
      { t: 'Bailar con quien te invite', o: { text: 'Giras entre risas. Alguien te toma de la mano y baila contigo hasta quedaros sin aliento.', npc: true, xp: 12, steps: 4 } },
      { t: 'Participar en el concurso de comer', req: { gold: 10 }, o: { check: { stat: 'fue', dc: 10, win: { text: '¡Ganas el concurso! El premio: unos dulces y mucha fama.', gold: 40, item: { pastel: 1 }, fame: 2 }, lose: { text: 'Acabas con un dolor de barriga tremendo.', gold: -10, hp: -8 } } } },
      { t: 'Soltar una linterna al río', o: { text: 'Pides un deseo al verla alejarse. Te sientes en paz.', en: 25, honor: 2 } }] },
    { id: 'zorro_acertijo', zones: ['bosque'], title: 'El zorro que habla', text: 'Un zorro de nueve colas te corta el paso: «Responde mi acertijo y te daré un tesoro. Falla, y tendrás que divertirme».', choices: [
      { t: 'Intentar resolverlo', o: { check: { stat: 'men', dc: 12, win: { text: '«¡Correcto!», ríe el zorro, y te deja una joya.', item: { joya: 1 }, xp: 35 }, lose: { text: '«¡Mal!», sonríe. Una niebla te envuelve y aparecen sus compinches.', fight: ['kitsune'] } } } },
      { t: 'Ofrecerle comida', req: { item: 'dango' }, o: { text: 'El zorro devora el dango y te regala una flor mágica.', item: { dango: -1, flor: 2 }, xp: 10 } },
      { t: 'Rodearlo', o: { text: 'El zorro bosteza y se aleja.' } }] },
    { id: 'flores_cerezo', zones: ['pradera', 'camino'], title: 'Cerezos en flor', text: 'Un cerezo gigante llueve pétalos en un claro. Alguien está sentado bajo él, mirando las flores en silencio.', choices: [
      { t: 'Sentarte a su lado', o: { text: 'Charláis un rato bajo los pétalos. Hay algo especial en el aire.', npc: true, xp: 8, steps: 4 } },
      { t: 'Hacer un picnic en solitario', o: { text: 'Comes tranquilamente y te sientes mejor.', hp: 20, en: 10 } }] },
    { id: 'tormenta', zones: ['any'], title: 'Tormenta repentina', text: 'El cielo se oscurece y empieza a caer una lluvia torrencial con rayos.', choices: [
      { t: 'Buscar refugio', o: { check: { stat: 'agi', dc: 10, win: { text: 'Encuentras una cueva a tiempo. Allí hay algo guardado.', item: { hierba: 2 } }, lose: { text: 'Llegas empapado y con un rasguño.', hp: -10 } } } },
      { t: 'Atravesarla con calma', o: { check: { stat: 'esp', dc: 10, win: { text: 'Canalizas la energía del rayo. ¡Tu ki aumenta!', en: 30, xp: 15 }, lose: { text: 'Un rayo te sacude.', hp: -15 } } } }] },
    { id: 'mendigo', zones: ['town'], title: 'Un mendigo en la esquina', text: 'Un hombre harapiento te tiende las manos: «Una moneda, por piedad...».', choices: [
      { t: 'Darle 10 ryo', req: { gold: 10 }, o: { text: 'Te sonríe con los ojos húmedos. «Que los espíritus te cuiden».', gold: -10, honor: 5 } },
      { t: 'Darle un onigiri', req: { item: 'onigiri' }, o: { text: 'Se lo come con lágrimas. Susurra algo sobre «un tesoro en la montaña».', item: { onigiri: -1 }, honor: 5, reveal: true } },
      { t: 'Pasar de largo', o: { text: 'Seguís cada uno su camino.' } }] },
    { id: 'cartel', zones: ['town'], title: 'Cartel de "se busca"', text: 'Un cartel ofrece recompensa por un bandido que se esconde en las afueras. 120 ryo.', choices: [
      { t: 'Ir a por él', o: { text: 'Lo encuentras bebiendo en un callejón.', fight: ['bandido', 'ronin'], gold: 120, fame: 3 } },
      { t: 'Arrancar el cartel', o: { text: 'No es tu problema.' } }] },
  ];

  /* ------ Misiones procedurales (tablón del gremio) ------ */
  D.QUEST_TITLES = {
    hunt: ['Plaga de {e}', 'Se buscan cazadores de {e}', 'Protege a los aldeanos: {e}'],
    bring: ['Encargo de {i}', 'Se necesita {i}', 'Necesito {i} urgentemente'],
    visit: ['Explorar {p}', 'Informe sobre {p}', 'Reconocimiento de {p}'],
  };

  /* ------ Rangos de honor ------ */
  D.honorTitle = function (h) {
    return h >= 70 ? 'Héroe legendario' : h >= 40 ? 'Héroe del pueblo' : h >= 15 ? 'Buena persona' : h > -15 ? 'Viajero neutral' : h > -40 ? 'Sinvergüenza' : h > -70 ? 'Villano' : 'Azote del reino';
  };
})((window.G = window.G || {}));
