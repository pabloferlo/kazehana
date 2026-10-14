/* KAZEHANA · retratos procedurales (SVG). Cada NPC/jugador se dibuja a partir de sus rasgos
   y cambia de expresión según su estado de ánimo. Si añades imágenes propias en assets/portraits/
   (ver README) se usarán en su lugar. */
(function (G) {
  'use strict';
  const U = G.U;
  const Port = (G.Port = {});

  function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(c.substr(i, 2), 16)); }
  function toHex(a) { return '#' + a.map((v) => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); }
  function shade(c, f) { return f < 0 ? mix(c, '#000000', -f) : mix(c, '#ffffff', f); }

  // Expresiones: ojos, ceja (tipo), boca, rubor, extra
  const FACE = {
    neutral: { eyes: 'open', brow: 'flat', mouth: 'flat', blush: 0 },
    alegre: { eyes: 'open', brow: 'up', mouth: 'smile', blush: 0.15 },
    timido: { eyes: 'shy', brow: 'sad', mouth: 'small', blush: 0.85 },
    enfadado: { eyes: 'narrow', brow: 'angry', mouth: 'frown', blush: 0 },
    triste: { eyes: 'sad', brow: 'sad', mouth: 'frown', blush: 0, tear: 1 },
    coqueto: { eyes: 'wink', brow: 'up', mouth: 'smirk', blush: 0.35 },
    sorprendido: { eyes: 'wide', brow: 'up', mouth: 'o', blush: 0 },
    serio: { eyes: 'narrow', brow: 'flat', mouth: 'flat', blush: 0 },
    burlon: { eyes: 'half', brow: 'up', mouth: 'smirk', blush: 0 },
    avergonzado: { eyes: 'closed', brow: 'sad', mouth: 'wavy', blush: 1, steam: 1 },
    enamorado: { eyes: 'heart', brow: 'up', mouth: 'smile', blush: 0.7 },
    nervioso: { eyes: 'small', brow: 'sad', mouth: 'wavy', blush: 0.2, sweat: 1 },
    sereno: { eyes: 'closed', brow: 'flat', mouth: 'smile', blush: 0.1 },
  };

  function eye(cx, cy, kind, L, side, skin, dark, female) {
    const ir = L.eye, st = '#1b1722';
    let s = '';
    const lash = female ? '<path d="M' + (cx - 11) + ',' + (cy - 5) + ' Q' + (cx - 14) + ',' + (cy - 8) + ' ' + (cx - 15) + ',' + (cy - 5) + '" stroke="' + st + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>' : '';
    const full = (ry, ir_r, dx) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="10.5" ry="' + ry + '" fill="#fff" stroke="' + st + '" stroke-width="1.6"/>'
      + '<circle cx="' + (cx + dx) + '" cy="' + cy + '" r="' + ir_r + '" fill="' + ir + '"/><circle cx="' + (cx + dx) + '" cy="' + cy + '" r="' + (ir_r * 0.45) + '" fill="' + st + '"/>'
      + '<circle cx="' + (cx + dx - 2.2) + '" cy="' + (cy - 2.4) + '" r="2.1" fill="#fff"/>';
    switch (kind) {
      case 'closed': s = '<path d="M' + (cx - 10) + ',' + (cy + 1) + ' Q' + cx + ',' + (cy - 9) + ' ' + (cx + 10) + ',' + (cy + 1) + '" stroke="' + st + '" stroke-width="3" fill="none" stroke-linecap="round"/>'; break;
      case 'wink': s = side === 'r' ? '<path d="M' + (cx - 10) + ',' + (cy + 1) + ' Q' + cx + ',' + (cy - 8) + ' ' + (cx + 10) + ',' + (cy + 1) + '" stroke="' + st + '" stroke-width="3" fill="none" stroke-linecap="round"/>' : full(10.5, 6.4, 0); break;
      case 'half': s = full(10, 6.4, 0) + '<path d="M' + (cx - 11.5) + ',' + (cy - 1) + ' L' + (cx + 11.5) + ',' + (cy - 1) + ' L' + (cx + 11.5) + ',' + (cy - 12) + ' L' + (cx - 11.5) + ',' + (cy - 12) + 'Z" fill="' + skin + '"/><path d="M' + (cx - 11) + ',' + (cy - 1) + ' L' + (cx + 11) + ',' + (cy - 1) + '" stroke="' + st + '" stroke-width="2.4"/>'; break;
      case 'narrow': s = full(7, 5.8, 0) + '<path d="M' + (cx - 11.5) + ',' + (cy - 7.6) + ' L' + (cx + 11.5) + ',' + (cy - 7.6) + '" stroke="' + st + '" stroke-width="2.6"/>'; break;
      case 'sad': s = full(10, 6.4, 0) + '<path d="M' + (cx - 10) + ',' + (cy - 5) + ' Q' + cx + ',' + (cy - 14) + ' ' + (cx + 10) + ',' + (cy - 5) + '" stroke="' + st + '" stroke-width="1.5" fill="none"/>'; break;
      case 'wide': s = full(12.5, 6, 0); break;
      case 'small': s = full(9.5, 4.2, side === 'l' ? 1 : -1); break;
      case 'shy': s = full(9, 5.6, side === 'l' ? 3 : 3) + '<path d="M' + (cx - 11) + ',' + (cy - 4) + ' L' + (cx + 11) + ',' + (cy - 4) + '" stroke="' + st + '" stroke-width="2.2"/>'; break;
      case 'heart': s = full(11, 7, 0) + '<path d="M' + cx + ',' + (cy + 3) + ' C' + (cx - 7) + ',' + (cy - 3) + ' ' + (cx - 2) + ',' + (cy - 7) + ' ' + cx + ',' + (cy - 3) + ' C' + (cx + 2) + ',' + (cy - 7) + ' ' + (cx + 7) + ',' + (cy - 3) + ' ' + cx + ',' + (cy + 3) + 'Z" fill="#ff4f7a" opacity=".9"/>'; break;
      default: s = full(11, 6.8, 0);
    }
    return s + lash;
  }

  function brows(kind, col) {
    const o = 'stroke="' + col + '" stroke-width="3.6" stroke-linecap="round" fill="none"';
    const P = {
      flat: ['M64,96 L90,95', 'M110,95 L136,96'], up: ['M64,92 Q77,86 90,91', 'M110,91 Q123,86 136,92'],
      angry: ['M64,92 L90,101', 'M110,101 L136,92'], sad: ['M64,99 L90,92', 'M110,92 L136,99'],
    }[kind] || ['M64,96 L90,95', 'M110,95 L136,96'];
    return '<path d="' + P[0] + '" ' + o + '/><path d="' + P[1] + '" ' + o + '/>';
  }

  function mouth(kind) {
    const k = '#5a2230', st = 'stroke="' + k + '" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"';
    return {
      flat: '<path d="M91,146 L109,146" ' + st + '/>',
      smile: '<path d="M88,141 Q100,155 112,141" ' + st + '/>',
      grin: '<path d="M88,140 Q100,160 112,140Z" fill="#8a2f44" stroke="' + k + '" stroke-width="2"/>',
      smirk: '<path d="M91,146 Q102,151 112,139" ' + st + '/>',
      frown: '<path d="M91,151 Q100,142 109,151" ' + st + '/>',
      small: '<path d="M95,146 Q100,149 105,146" ' + st + '/>',
      o: '<ellipse cx="100" cy="147" rx="5" ry="6.5" fill="#8a2f44" stroke="' + k + '" stroke-width="2"/>',
      wavy: '<path d="M88,146 Q94,141 100,146 T112,146" ' + st + '/>',
    }[kind] || '';
  }

  // Capas de pelo: [detrás, delante]
  function hairLayers(style, c, c2, female) {
    const f = 'fill="' + c + '" stroke="' + c2 + '" stroke-width="2" stroke-linejoin="round"';
    const cap = '<path d="M50,106 C44,58 74,36 100,36 C128,36 158,58 150,106 C142,86 126,74 100,72 C74,74 58,86 50,106Z" ' + f + '/>';
    const fringe = '<path d="M54,96 Q70,66 100,72 Q132,66 146,96 Q130,82 118,86 Q108,76 98,88 Q86,76 76,88 Q64,82 54,96Z" ' + f + '/>';
    switch (style) {
      case 'bald': return ['', ''];
      case 'short': return ['', cap + fringe];
      case 'spiky': return ['', '<path d="M48,104 L42,70 L62,78 L58,40 L80,58 L90,26 L102,52 L120,28 L124,58 L146,42 L142,78 L160,72 L152,104 Q130,78 100,78 Q70,78 48,104Z" ' + f + '/>'];
      case 'bob': return ['<path d="M42,112 C36,50 70,32 100,32 C130,32 164,50 158,112 L162,166 Q150,176 138,170 L138,112 L62,112 L62,170 Q50,176 38,166Z" ' + f + '/>', cap + fringe];
      case 'medium': return ['<path d="M42,112 C36,50 70,32 100,32 C130,32 164,50 158,112 L162,206 Q150,216 136,208 L136,112 L64,112 L64,208 Q50,216 38,206Z" ' + f + '/>', cap + fringe];
      case 'long': return ['<path d="M40,112 C34,44 70,30 100,30 C130,30 166,44 160,112 L166,232 Q150,242 120,236 L120,150 L80,150 L80,236 Q50,242 34,232Z" ' + f + '/>',
        cap + fringe + '<path d="M58,118 L50,214 Q60,226 74,212 L76,150Z" ' + f + '/><path d="M142,118 L150,214 Q140,226 126,212 L124,150Z" ' + f + '/>'];
      case 'ponytail': return ['<path d="M136,70 C180,66 192,134 174,184 C168,152 156,122 138,104Z" ' + f + '/>', cap + fringe + '<ellipse cx="140" cy="76" rx="5" ry="7" fill="#e0525f"/>'];
      case 'bun': return ['<circle cx="100" cy="28" r="17" ' + f + '/>', cap + fringe + '<rect x="90" y="40" width="20" height="5" rx="2" fill="#e0525f"/>'];
      case 'twin': return ['<path d="M56,92 C16,98 14,176 34,206 C42,172 48,134 60,112Z" ' + f + '/><path d="M144,92 C184,98 186,176 166,206 C158,172 152,134 140,112Z" ' + f + '/>', cap + fringe + '<circle cx="56" cy="92" r="5" fill="#e0525f"/><circle cx="144" cy="92" r="5" fill="#e0525f"/>'];
      default: return ['', cap + fringe];
    }
  }

  Port.svg = function (ent, mood, opts) {
    opts = opts || {};
    const L = ent.look;
    mood = mood || 'neutral';
    const F = FACE[mood] || FACE.neutral;
    const female = L.gender === 'f';
    const skin = L.skin, skinD = shade(skin, -0.18);
    const hairBase = L.hairColor;
    const hair = L.grey ? mix(hairBase, '#e8e8ee', L.grey === 2 ? 0.88 : 0.45) : hairBase;
    const hairD = shade(hair, -0.3);
    const tags = L.buildTags || [];
    const wide = tags.includes('musculoso') || tags.includes('fuerte') ? 1 : tags.includes('delgado') || tags.includes('menudo') ? -1 : 0;
    let sw = female ? 56 : 66; sw += wide * 10; if (tags.includes('robusto')) sw += 6;
    const hue = U.hash(ent.id || ent.name || 'x') % 360;
    const gid = 'g' + (U.hash((ent.id || '') + mood + Math.random()) % 99999);
    const [hb, hf] = hairLayers(L.hairStyle, hair, hairD, female);
    const outfit = L.outfit, outfit2 = L.outfit2 || '#e6d9b8';
    let g = '';
    g += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(' + hue + ',45%,26%)"/><stop offset="1" stop-color="hsl(' + ((hue + 40) % 360) + ',50%,14%)"/></linearGradient></defs>';
    g += '<rect width="200" height="240" fill="url(#' + gid + ')"/>';
    g += '<circle cx="100" cy="110" r="88" fill="hsl(' + hue + ',55%,60%)" opacity=".12"/>';
    g += hb;
    // torso
    g += '<path d="M' + (100 - sw) + ',240 L' + (100 - sw) + ',204 Q' + (100 - sw) + ',176 ' + (100 - sw * 0.5) + ',170 L' + (100 + sw * 0.5) + ',170 Q' + (100 + sw) + ',176 ' + (100 + sw) + ',204 L' + (100 + sw) + ',240Z" fill="' + outfit + '" stroke="' + shade(outfit, -0.35) + '" stroke-width="2"/>';
    g += '<rect x="87" y="148" width="26" height="26" rx="8" fill="' + skinD + '"/>';
    g += '<path d="M82,170 L100,204 L118,170 L112,168 L100,190 L88,168Z" fill="' + outfit2 + '" stroke="' + shade(outfit2, -0.3) + '" stroke-width="1.5"/>';
    if (ent.look.outfitPattern !== 0) g += '<path d="M' + (100 - sw + 6) + ',226 L' + (100 + sw - 6) + ',226" stroke="' + shade(outfit, 0.2) + '" stroke-width="2" stroke-dasharray="4 5" opacity=".6"/>';
    // orejas + cara
    g += '<ellipse cx="53" cy="113" rx="7" ry="10" fill="' + skin + '" stroke="' + skinD + '" stroke-width="1.5"/><ellipse cx="147" cy="113" rx="7" ry="10" fill="' + skin + '" stroke="' + skinD + '" stroke-width="1.5"/>';
    if (L.accs.includes('orejas')) g += '<path d="M62,64 L54,22 L88,50Z" fill="' + hair + '" stroke="' + hairD + '" stroke-width="2"/><path d="M138,64 L146,22 L112,50Z" fill="' + hair + '" stroke="' + hairD + '" stroke-width="2"/><path d="M62,58 L58,34 L78,50Z" fill="#f4a7b9"/><path d="M138,58 L142,34 L122,50Z" fill="#f4a7b9"/>';
    g += '<path d="M54,100 C54,56 146,56 146,100 C146,142 124,170 100,170 C76,170 54,142 54,100Z" fill="' + skin + '" stroke="' + skinD + '" stroke-width="2"/>';
    // rubor
    if (F.blush) g += '<ellipse cx="70" cy="131" rx="12" ry="6.5" fill="#ff5c8a" opacity="' + (0.5 * F.blush).toFixed(2) + '"/><ellipse cx="130" cy="131" rx="12" ry="6.5" fill="#ff5c8a" opacity="' + (0.5 * F.blush).toFixed(2) + '"/>';
    if (L.accs.includes('pecas')) g += '<g fill="' + skinD + '" opacity=".7"><circle cx="68" cy="126" r="1.4"/><circle cx="74" cy="129" r="1.4"/><circle cx="80" cy="126" r="1.4"/><circle cx="120" cy="126" r="1.4"/><circle cx="126" cy="129" r="1.4"/><circle cx="132" cy="126" r="1.4"/></g>';
    // barba
    if (L.accs.includes('barba')) g += '<path d="M56,128 C58,168 80,178 100,178 C120,178 142,168 144,128 C136,152 120,162 100,162 C80,162 64,152 56,128Z" fill="' + hair + '" stroke="' + hairD + '" stroke-width="1.5"/>';
    // arrugas
    if (L.age >= 50) g += '<g stroke="' + skinD + '" stroke-width="1.6" fill="none" opacity=".75"><path d="M62,112 q-4,3 -6,8"/><path d="M138,112 q4,3 6,8"/><path d="M88,138 q-6,4 -6,12"/><path d="M112,138 q6,4 6,12"/></g>';
    // nariz
    g += '<path d="M99,122 Q96,131 100,133" stroke="' + skinD + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    // ojos y cejas
    const bc = shade(hairD, -0.1);
    g += eye(78, 113, F.eyes, L, 'l', skin, hairD, female) + eye(122, 113, F.eyes, L, 'r', skin, hairD, female);
    g += brows(F.brow, bc);
    if (F.tear) g += '<path d="M72,126 Q68,136 72,140 Q76,136 72,126Z" fill="#8fd0ff" opacity=".85"/>';
    if (F.sweat) g += '<path d="M146,88 Q141,98 146,102 Q151,98 146,88Z" fill="#9fdcff" opacity=".9"/>';
    if (F.steam) g += '<g stroke="#ffffff" stroke-width="2" opacity=".5" fill="none" stroke-linecap="round"><path d="M64,70 q-4,-8 0,-14"/><path d="M100,52 q-4,-8 0,-14"/><path d="M136,70 q4,-8 0,-14"/></g>';
    g += mouth(F.mouth);
    if (L.accs.includes('lunar')) g += '<circle cx="112" cy="150" r="1.8" fill="' + hairD + '"/>';
    if (L.accs.includes('cicatriz')) g += '<path d="M64,94 L86,134" stroke="#b86a6a" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M69,104 l7,-4 M74,114 l7,-4 M79,124 l7,-4" stroke="#b86a6a" stroke-width="1.4" opacity=".7"/>';
    if (L.accs.includes('marca')) g += '<path d="M126,126 q4,6 0,12" stroke="#d6395b" stroke-width="3" fill="none"/>';
    // pelo frontal
    g += hf;
    if (L.accs.includes('cuernos')) g += '<path d="M72,56 L64,28 L88,48Z" fill="#f2e6d0" stroke="#8a7a60" stroke-width="2"/><path d="M128,56 L136,28 L112,48Z" fill="#f2e6d0" stroke="#8a7a60" stroke-width="2"/>';
    if (L.accs.includes('cinta')) g += '<rect x="48" y="78" width="104" height="9" fill="' + outfit2 + '" stroke="' + shade(outfit2, -0.3) + '" stroke-width="1.5"/><path d="M150,82 l18,10 l-4,-14z" fill="' + outfit2 + '"/>';
    if (L.accs.includes('gafas')) g += '<g fill="rgba(180,220,255,.18)" stroke="#2b2b3a" stroke-width="2.4"><circle cx="78" cy="113" r="15"/><circle cx="122" cy="113" r="15"/><path d="M93,112 Q100,108 107,112" fill="none"/></g>';
    if (L.accs.includes('pendientes')) g += '<circle cx="52" cy="128" r="3.5" fill="#f2c14e"/><circle cx="148" cy="128" r="3.5" fill="#f2c14e"/>';
    if (L.accs.includes('sombrero')) g += '<path d="M24,80 Q100,0 176,80 Q100,64 24,80Z" fill="#d9bb7a" stroke="#8f6e2e" stroke-width="2.5"/><path d="M50,72 Q100,40 150,72" stroke="#8f6e2e" stroke-width="1.5" fill="none" opacity=".7"/>';
    const w = opts.w || 200, h = Math.round(w * 1.2);
    return '<svg class="portrait" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="' + w + '" height="' + h + '" role="img" aria-label="Retrato">' + g + '</svg>';
  };

  // Imágenes propias opcionales: assets/portraits/<id>_<mood>.png ... (por defecto desactivado)
  Port.custom = { enabled: false, path: 'assets/portraits/' };
  Port.html = function (ent, mood, opts) {
    if (Port.custom.enabled && ent.img) return '<img class="portrait" src="' + Port.custom.path + ent.img + '_' + (mood || 'neutral') + '.png" alt="">';
    return Port.svg(ent, mood, opts);
  };
})((window.G = window.G || {}));
