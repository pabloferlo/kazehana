/**
 * credits.js — Final del juego: elige el epílogo según la relación con Yukine y muestra los créditos.
 */
import { el, openOverlay, closeOverlay, showScreen } from './ui.js';
import { Data, State } from './state.js';
import { registerAction, runScenes } from './story.js';
import { partyChars } from './party.js';
import { saveSlot } from './storage.js';

export function endingKey() {
  const g = State.game;
  if (g.flags.couple && g.romance.stage >= 5) return 'ending_5';
  if (g.flags.couple || g.romance.stage >= 4) return 'ending_4';
  if (g.romance.affinity >= 18) return 'ending_2';
  return 'ending_0';
}
const NAMES = { ending_5: 'Inseparables', ending_4: 'La senda juntos', ending_2: 'Amigos', ending_0: 'La loba de las cumbres' };

function showCredits(key) {
  const g = State.game;
  const kills = Object.values(g.kills || {}).reduce((a, b) => a + b, 0);
  const done = Object.values(g.quests || {}).filter(q => q.status === 'turned').length;
  return new Promise(res => {
    const box = el('div', { class: 'credits' },
      el('h1', {}, 'FIN DEL ACTO I'),
      el('h2', {}, 'Yukine: La Senda del Vengador'),
      el('p', { class: 'cr-end' }, `Final: ${NAMES[key]}`),
      el('div', { class: 'cr-stats' },
        el('div', {}, `⚔️ Enemigos derrotados: ${kills}`),
        el('div', {}, `📜 Misiones completadas: ${done}`),
        el('div', {}, `💗 Afinidad con Yukine: ${g.romance.affinity}`),
        el('div', {}, '👥 ' + partyChars().map(c => `${c.name} Nv.${c.level}`).join(' · '))),
      el('div', { class: 'cr-roll' },
        el('p', {}, 'Historia, sistema y diseño — creados contigo, paso a paso.'),
        el('p', {}, 'Gracias por acompañar a Yukine hasta el último amanecer... del Yermo.'),
        el('p', {}, 'El martillo y la luna caminaron juntos. Y todavía les queda camino.')),
      el('div', { class: 'menu' },
        el('button', { class: 'btn primary', onclick: () => { closeOverlay(); showScreen('story'); res('continue'); } }, '🌅 Continuar'),
        el('small', {}, 'Puedes seguir explorando el Yermo y, cuando quieras, cruzar la Fisura del Alba (al sur del castillo) hacia el Reino del Amanecer.')));
    openOverlay(box, 'credits-ov');
  });
}

registerAction('ending', async () => {
  const g = State.game;
  g.flags.game_cleared = true; g.flags.region_akatsuki_done = true;
  const key = endingKey();
  await runScenes('a2_revelacion');   // la Voz del Alba, la puerta bajo el castillo
  await runScenes(key);               // visión del futuro según tu relación con Yukine
  await runScenes('epilogue');
  await runScenes('a2_despertar');    // despedida y preparación del viaje
  await saveSlot('auto', g);
  await showCredits(key);
});
