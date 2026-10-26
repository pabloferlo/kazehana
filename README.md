# Yukine: La Senda del Vengador

RPG de anime single-player para navegador.
**v0.8.0** — Final del Reino del Amanecer (Senda de los Cinco Rayos, Campamento de los Vigilantes, Jardines del Palacio, Palacio del Sol Quieto con el sueño de la Madre del Alba, Cueva de las Cunas Vacías) y primer sector del **Mar de Cristal** (nueva región): Puerto de las Brumas, Faro Hundido, Santuario de la Primera Marea, Cueva de las Perlas. 6 habilidades de jefe nuevas, equipo de tier 5, nivel máx. 38.

**v0.7.3** — Habilidades de jefe nuevas con sentido de historia (las tuyas se mantienen), rarezas por región, mejora de nivel del equipo (Forja), mercaderes con suerte y jefes/enemigos del Amanecer más duros.

**v0.7.2** — Reino del Amanecer, sectores 3 y 4 (Aldea del Mediodía, Ciudad Insomne, Santuarios del Tercer y Cuarto Rayo, 6 jefes, 5 misiones), nueva curva de experiencia (nivel máx. 34), 9 rarezas de equipo, armas por familia según tu clase (ver `EQUIPO.md`) y mercaderes ambulantes en cada región.

**v0.7.1** — Reino del Amanecer, sector 2: Refugio de las Sombras, Torre del Reloj Quieto, Santuario del Segundo Rayo, Cueva de la Primera Noche, 3 misiones, nivel máx. 30.
**v0.7.0** — nuevo final del Acto I (la Voz del Alba, la visión del futuro, la despedida), puerta bajo el castillo y comienzo del Reino del Amanecer (región 4), nivel máx. 30, habilidades Fragilidad / Ilusión / Amor filial, IMAGENES_Y_PROMPTS.md completo.
**v0.6.1** — habilidad Intimidación de Yukine (loba), cuevas opcionales repetibles, guía de estados.
**v0.6.0 — regiones ampliadas**: +15 localizaciones nuevas por región (pueblos, ruinas con jefe obligatorio, zonas salvajes y cuevas opcionales), misiones secundarias, jefes más duros.
**Juego completo**: 3 regiones (Kasumi, Shirogane, Akatsuki), 12 santuarios, 6 cuevas opcionales, 3 señores demoníacos + Rey Demonio en dos fases, nivel máx. 30, bestiario, 4 finales según tu relación con Yukine, créditos y post-juego.

## Ejecutar
**No abras index.html con doble clic.** Ejecuta `jugar.bat` (Windows) o `jugar.command`/`jugar.sh` (Mac/Linux), o `python3 -m http.server 8000` y abre http://localhost:8000 (o sube la carpeta a GitHub Pages).

## Estructura
- `js/` — main (flujo), state (estado/datos), storage (localStorage+IndexedDB), creation, story (diálogos), combat (motor puro), combat_ui, party, world (mapa/pueblos/mazmorras), menu, quests, ui.
- `data/` — classes, techniques, enemies, items, world, quests, npcs, story, companions, regions, prologue (todo en JSON).
- `assets/portraits/<id>/<emocion>.png` y `assets/enemies/<id>.png` (opcional).

## Ampliar
- Técnica nueva: entrada en `data/techniques.json` + añadir su id al `learnset` de una clase o a un pergamino en `items.json`.
- Enemigo: `data/enemies.json`. Objeto: `data/items.json`. Escenas: `data/story.json`. Localizaciones/mazmorras: `data/world.json`.

## Depuración
En la consola: `YK.State.game` (estado) y `YK.Data` (datos).

## Imágenes de ultimate
Pon PNG en `assets/ultimates/` (ver `assets/ultimates/LEEME.md`): aparecen detrás del nombre de la ulti.

## Fondos de imagen
Pon imágenes en `assets/backgrounds/` (ids en `assets/backgrounds/LEEME.md`): escenas, mapas, combates, pueblos/mazmorras y título.

## Ataque de Unión
Se desbloquea al romper el 4º sello de Akatsuki. Datos en `data/unison.json` (uno por clase). Imagen: `assets/ultimates/unison_<clase>.png` (o `unison.png`).
