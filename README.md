# Yukine: La Senda del Vengador

RPG de anime single-player para navegador.
**Parte 2**: mapa de los Bosques de Kasumi, combate por turnos, Yukine, santuarios/cuevas/torre, pueblos, misiones, equipo y romance.

## Ejecutar
Necesita servidor HTTP: `python3 -m http.server 8000` y abre http://localhost:8000 (o sube la carpeta a GitHub Pages).

## Estructura
- `js/` — main (flujo), state (estado/datos), storage (localStorage+IndexedDB), creation, story (diálogos), combat (motor puro), combat_ui, party, world (mapa/pueblos/mazmorras), menu, quests, ui.
- `data/` — classes, techniques, enemies, items, world, quests, npcs, story, companions, regions, prologue (todo en JSON).
- `assets/portraits/<id>/<emocion>.png` y `assets/enemies/<id>.png` (opcional).

## Ampliar
- Técnica nueva: entrada en `data/techniques.json` + añadir su id al `learnset` de una clase o a un pergamino en `items.json`.
- Enemigo: `data/enemies.json`. Objeto: `data/items.json`. Escenas: `data/story.json`. Localizaciones/mazmorras: `data/world.json`.

## Depuración
En la consola: `YK.State.game` (estado) y `YK.Data` (datos).
