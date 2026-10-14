# 🌸 KAZEHANA · Crónicas del Camino

RPG de anime para jugar **en solitario en el navegador**: creas a tu personaje, exploras un mapa generado al azar,
peleas con poderes, conoces gente, te enamoras, te casas, tienes hijos… y puedes intentar derrotar al Señor de las Sombras.

Sin servidor, sin dependencias, sin build: son archivos estáticos (HTML + CSS + JS).

## Jugar
- **En local:** abre `index.html` con doble clic.
- **GitHub Pages:** sube la carpeta a un repositorio → *Settings → Pages → Deploy from branch → main / (root)*.
- **Un solo archivo:** `python3 tools/build.py` genera `dist/kazehana-single.html` (todo incluido).

## Controles
Flechas / WASD o clic en el mapa para caminar · `C` personaje · `I` mochila · `M` misiones · `R` gente · `F` familia · `N` mapa · `J` diario. En móvil hay cruceta en pantalla.

## Qué incluye
- **Creador de personaje** con “Descríbete” (el juego interpreta tu texto: pelo, ojos, complexión…), rasgos, origen (aldea / ciudad / capital / monte / azar), 8 poderes y gustos románticos.
- **Mundo procedural** (cada partida es distinta): terreno, estaciones, día/noche, aldeas, ciudades, capital, santuarios, mazmorras y caminos.
- **~75 NPCs generados** (todos adultos) con descripción física, personalidad, estados de ánimo, gustos, sueños, miedos y secretos, y **retratos SVG** que cambian de expresión.
- **Relaciones**: charlar, bromear, cumplidos, regalos, coqueteo, citas, confesión, pareja, matrimonio, celos y ruptura. Romances sin contenido explícito.
- **Familia**: casa, hijos (embarazo o adopción), actividades con ellos y **herencia** de personaje si mueres con muerte permanente.
- **Combate por turnos** con técnicas, estados (quemadura, aturdimiento…), objetos, huida y jefes.
- **Decisiones**: ~20 eventos con tiradas, honor y fama; perdonar o no a los derrotados.
- **Misiones**: tablón del gremio, encargos de NPCs y misión principal (3 sellos + jefe final).
- **Guardado local**: IndexedDB (con respaldo en localStorage), autoguardado, 3 ranuras y exportar/importar `.json`.

## Estructura
```
index.html
css/style.css
js/utils.js        RNG con semilla y helpers
js/data.js         objetos, poderes, enemigos, eventos (edita aquí para añadir contenido)
js/data_social.js  nombres, físicos, trabajos, personalidades, frases
js/npcgen.js       generador de NPCs y descripciones
js/portraits.js    retratos SVG procedurales
js/world.js        generación del mundo
js/services.js     guardado (IndexedDB) y sonido (WebAudio)
js/game.js         lógica principal
js/combat.js       combate
js/social.js       diálogos, romance, familia
js/ui_core.js      título, creador, mapa, menús
js/ui_views.js     vistas del panel
tools/build.py     empaqueta en un solo HTML
tools/smoke.js     prueba automática (node tools/smoke.js)
```

## Añadir contenido
- **Eventos:** copia uno de `D.EVENTS` en `js/data.js`.
- **Objetos / enemigos / poderes:** mismas tablas en `js/data.js`.
- **Frases de diálogo:** `D.ACT`, `D.PERS`, `D.EMOTES` en `js/data_social.js`.
- **Tus propias imágenes de retrato:** ver `assets/portraits/README.txt`.

## Próximos pasos posibles
Base de datos en la nube (Supabase/Firebase) para sincronizar partidas, misiones de NPC con historia, compañeros de viaje, minijuegos, música.
