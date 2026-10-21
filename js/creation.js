/**
 * creation.js — Creación de personaje inmersiva.
 * Todo es clicable directamente: chips y tarjetas, sin barras ni arrastres.
 * El origen NO se elige: lo define la historia (Tsukimori).
 */
import { el, $, showScreen } from './ui.js';
import { Data } from './state.js';

const HAIR_COLORS = ['Negro', 'Castaño', 'Rubio', 'Pelirrojo', 'Plateado', 'Azul', 'Blanco'];
const HAIR_STYLES = ['Corto', 'Largo', 'Coleta', 'Trenzas', 'Rapado', 'Despeinado'];
const EYES = ['Marrones', 'Verdes', 'Azules', 'Grises', 'Dorados', 'Rojizos'];
const BUILDS = ['Esbelta/o', 'Atlética/o', 'Corpulenta/o', 'Menuda/o', 'Alta/o'];
const TRAITS = ['Valiente', 'Sarcástico/a', 'Reservado/a', 'Noble', 'Testarudo/a', 'Curioso/a', 'Leal', 'Soñador/a', 'Impulsivo/a', 'Calculador/a'];
const GENDERS = ['Hombre', 'Mujer', 'No binario / otro'];

/** Selector de chips (clic directo). `max` limita selecciones múltiples. */
function chipGroup(options, { multi = false, max = 1, onChange }) {
  const sel = new Set();
  const box = el('div', { class: 'chips' });
  options.forEach(o => {
    const chip = el('button', { type: 'button', class: 'chip' }, o);
    chip.addEventListener('click', () => {
      if (sel.has(o)) sel.delete(o);
      else {
        if (!multi) sel.clear();
        if (multi && sel.size >= max) return;
        sel.add(o);
      }
      box.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', sel.has(c.textContent)));
      onChange?.([...sel]);
    });
    box.append(chip);
  });
  return { node: box, get: () => [...sel] };
}

/** Construye el personaje inicial con sus técnicas de nivel 1. */
function buildPlayer(form, cls) {
  const known = cls.learnset.filter(l => l.level <= 1).map(l => l.tech);
  return {
    id: 'protagonista',
    name: form.name,
    age: form.age,
    gender: form.gender,
    appearance: form.appearance,
    personality: form.personality,
    bio: form.bio,
    origin: Data.regions.origin.id,       // fijo por la historia
    classId: cls.id,
    level: 1, xp: 0,
    stats: { ...cls.stats },
    hp: cls.stats.hp, mp: cls.stats.mp,
    techniques: { known, equipped: known.slice(0, 4) },
    status: 'ok'                          // ok | debilitado
  };
}

/** Muestra la pantalla; devuelve una promesa con el jugador, o null si se cancela. */
export function runCreation() {
  return new Promise(resolve => {
    const root = $('#screen-creation');
    let selectedClass = null;

    const nameIn = el('input', { type: 'text', maxlength: '24', placeholder: 'Tu nombre' });
    const ageIn = el('input', { type: 'number', min: '18', max: '120', value: '18' });
    const ageErr = el('div', { class: 'err' });
    const nameErr = el('div', { class: 'err' });
    const clsErr = el('div', { class: 'err' });
    const gender = chipGroup(GENDERS, {});
    const hair = chipGroup(HAIR_COLORS, {});
    const style = chipGroup(HAIR_STYLES, {});
    const eyes = chipGroup(EYES, {});
    const build = chipGroup(BUILDS, {});
    const traits = chipGroup(TRAITS, { multi: true, max: 3 });
    const notes = el('textarea', { placeholder: 'Cicatrices, ropa habitual, rasgos que te definen…' });
    const bio = el('textarea', { placeholder: 'Cuéntame cómo eres: tus manías, lo que te hace reír, lo que te enfurece…' });

    // Tarjetas de especialización
    const grid = el('div', { class: 'class-grid' });
    Data.classes.classes.forEach(c => {
      const card = el('button', { type: 'button', class: 'class-card' },
        el('div', { class: 'ico' }, c.icon),
        el('h4', {}, c.name),
        el('p', {}, c.desc),
        el('div', { class: 'stat-row' },
          ...['hp', 'mp', 'atk', 'mag', 'def', 'spd'].map(k => el('span', {}, `${k.toUpperCase()} ${c.stats[k]}`))));
      card.addEventListener('click', () => {
        selectedClass = c;
        grid.querySelectorAll('.class-card').forEach(x => x.classList.remove('on'));
        card.classList.add('on');
        clsErr.textContent = '';
      });
      grid.append(card);
    });

    const submit = () => {
      let ok = true;
      const name = nameIn.value.trim();
      const age = parseInt(ageIn.value, 10);
      nameErr.textContent = ''; ageErr.textContent = ''; clsErr.textContent = '';
      if (name.length < 2) { nameErr.textContent = 'Dime tu nombre (mínimo 2 letras).'; ok = false; }
      if (!Number.isInteger(age) || age < 18) { ageErr.textContent = 'La edad mínima es 18 años.'; ok = false; }
      else if (age > 120) { ageErr.textContent = 'Ni los demonios llegan a tanto. Máximo 120.'; ok = false; }
      if (!selectedClass) { clsErr.textContent = 'Elige una especialización.'; ok = false; }
      if (!ok) return;
      const form = {
        name, age,
        gender: gender.get()[0] || 'No binario / otro',
        appearance: {
          hair: hair.get()[0] || '—', hairStyle: style.get()[0] || '—',
          eyes: eyes.get()[0] || '—', build: build.get()[0] || '—', notes: notes.value.trim()
        },
        personality: traits.get(),
        bio: bio.value.trim()
      };
      resolve(buildPlayer(form, selectedClass));
    };

    root.replaceChildren(
      el('div', { class: 'creation' },
        el('h1', {}, 'Cuéntame quién eres'),
        el('p', { class: 'sub' }, 'Tu historia empieza en una aldea que no elegiste. Lo demás, sí.'),
        el('div', { class: 'panel' }, el('h3', {}, 'Identidad'),
          el('div', { class: 'grid2' },
            el('label', { class: 'field' }, 'Nombre', nameIn, nameErr),
            el('label', { class: 'field' }, 'Edad (mínimo 18, sin máximo práctico)', ageIn, ageErr)),
          el('div', { style: 'margin-top:12px' }, el('div', { class: 'field' }, 'Género'), gender.node)),
        el('div', { class: 'panel' }, el('h3', {}, 'Apariencia'),
          el('div', { class: 'field' }, 'Color de pelo'), hair.node,
          el('div', { class: 'field', style: 'margin-top:10px' }, 'Peinado'), style.node,
          el('div', { class: 'field', style: 'margin-top:10px' }, 'Ojos'), eyes.node,
          el('div', { class: 'field', style: 'margin-top:10px' }, 'Complexión'), build.node,
          el('label', { class: 'field', style: 'margin-top:10px' }, 'Detalles', notes)),
        el('div', { class: 'panel' }, el('h3', {}, 'Personalidad (hasta 3 rasgos)'),
          traits.node,
          el('label', { class: 'field', style: 'margin-top:10px' }, 'En tus propias palabras', bio)),
        el('div', { class: 'panel' }, el('h3', {}, 'Especialización inicial'),
          el('p', { class: 'sub' }, 'Define tus técnicas base y cómo aprendes nuevas al subir de nivel.'),
          grid, clsErr),
        el('div', { class: 'sticky-bar' },
          el('button', { class: 'btn ghost', onclick: () => { showScreen('title'); resolve(null); } }, '← Volver'),
          el('button', { class: 'btn primary', onclick: submit }, 'Comenzar la historia →'))));
    root.scrollTop = 0;
    showScreen('creation');
  });
}
