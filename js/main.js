/**
 * main.js — Arranque y flujo general: menú → creación → prólogo → mundo → combate…
 */
import { $, el, showScreen, openModal, closeModal, openOverlay, closeOverlay, applyBgImage } from './ui.js';
import { Data, State, loadData, newGame, setGame } from './state.js';
import { runCreation } from './creation.js';
import { runScenes } from './story.js';
import { startWorld, setHooks, autosave, safe } from './world.js';
import { openMenu, setMenuHooks, slotModal } from './menu.js';
import './credits.js';

async function startPrologue() {
  await safe(() => runScenes(Data.prologue.scenes));
  State.game.flags.prologue_done = true;
  await autosave();
  startWorld();
}

/** Reanuda una partida cargada. */
function resumeGame(data) {
  setGame(data);
  closeOverlay();
  if (!State.game.flags.prologue_done) startPrologue(); else startWorld();
}

/** Pantalla de fin de partida (ambos personajes debilitados). */
function gameOver() {
  openOverlay(el('div', { class: 'gameover' },
    el('h1', {}, 'FIN DE LA SENDA'),
    el('p', {}, 'Ambos habéis caído. La venganza tendrá que esperar…'),
    el('div', { class: 'menu' },
      el('button', { class: 'btn primary', onclick: () => slotModal('load') }, '📂 Cargar un punto de guardado'),
      el('button', { class: 'btn', onclick: () => { closeOverlay(); showScreen('title'); } }, '🏠 Volver al menú principal'))), 'gameover-ov');
}

/** Lista las ilustraciones que el jugador debe colocar manualmente. */
function showImagesNeeded() {
  const box = el('div', {}, el('h3', {}, 'Ilustraciones necesarias'),
    el('p', {}, 'PNG con fondo transparente (recomendado ~800×1200). Colócalas en:'),
    el('code', {}, 'assets/portraits/<id>/<emocion>.png'));
  const list = el('ul', {});
  Data.npcs.npcs.filter(n => n.id !== 'protagonista' || true).forEach(n => list.append(el('li', {},
    el('strong', {}, `${n.name} (${n.id})`), ': ', n.emotions.join(', '), el('br'), el('small', {}, n.desc))));
  box.append(list, el('p', {}, 'Retratos extra usados en la historia: kagero, kurogane, reiga, yamikage, jorogumo, centinela (neutral, smug, angry, sad). Los NPCs de cada aldea están en la lista de arriba.'),
    el('p', {}, 'Enemigos (opcional): assets/enemies/<id>.png — si no existe se usa un emoji. IDs en data/enemies.json.'),
    el('p', {}, 'Fondos (opcional): assets/backgrounds/<id>.jpg — lista completa de ids en assets/backgrounds/LEEME.md. Imágenes de ulti: assets/ultimates/LEEME.md.'),
    el('p', {}, 'Si falta una imagen, el juego usa neutral.png y, si tampoco existe, un recuadro de aviso.'));
  openModal(box);
}

async function init() {
  try { await loadData(); }
  catch (e) {
    $('#screen-title .title-box').append(el('p', { class: 'err' },
      'No se pudieron cargar los datos. Abre el juego desde un servidor (GitHub Pages o "python -m http.server"), no con doble clic al HTML.'));
    console.error(e); return;
  }
  applyBgImage($('#screen-title'), ['titulo'], 0.4);
  setHooks({ openMenu: () => openMenu(), gameOver });
  setMenuHooks({ resume: resumeGame, toTitle: () => showScreen('title'), images: showImagesNeeded });
  $('#modal-close').addEventListener('click', closeModal);
  $('#btn-load').addEventListener('click', () => slotModal('load'));
  $('#btn-about').addEventListener('click', () => openModal(el('div', {},
    el('h3', {}, 'Yukine: La Senda del Vengador'), el('small', {}, 'Versión 0.9.0'),
    el('p', {}, 'RPG de anime single-player. Juego completo: Bosques de Kasumi, Cumbres Shirogane y Yermo Akatsuki. Combate por turnos, Yukine (con su despertar lunar), santuarios, jefes, misiones, bestiario y cuatro finales según tu relación con ella.'))));
  $('#btn-new').addEventListener('click', async () => {
    const player = await runCreation();
    if (!player) return;
    newGame(player);
    await autosave();
    startPrologue();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#screen-world').classList.contains('active') && $('#overlay').classList.contains('hidden') && State.game) openMenu();
  });
}

window.YK = { State, Data }; // útil para depurar desde la consola
window.__yukineBooted = true;
init();
