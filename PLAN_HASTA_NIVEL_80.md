# Plan para llevar el juego hasta el nivel 80 (y postgame hasta el 100)

## 1. Estructura de regiones
| Región | Niveles | Santuarios | Notas |
|---|---|---|---|
| Acto I (hecho): Kasumi, Shirogane, Akatsuki | 1-22 | 3+4+5 | ya jugable |
| 4. Reino del Amanecer (en curso, v0.7.x) | 23-34 | 5 | 5 Heraldos; el sol detenido; la Madre del Alba |
| 5. Mar de Cristal (provisional) | 35-46 | 5 | agua, memoria; la manada ancestral |
| 6. Cordillera del Eco Dorado (provisional) | 47-58 | 5 | campanas, cazadores; pasado de Reiga |
| 7. Ciudad de Luz sin Reloj (provisional) | 59-70 | 5 | los seguidores de la Madre; caen los Heraldos restantes |
| 8. Corazón del Alba (final) | 71-80 | 4 + jefe final | la Madre del Alba / Eclipse Eterno |

Cada región con la estructura que ya tienen Kasumi/Shirogane/Akatsuki (~25 lugares: 3-4 pueblos, 2 ruinas obligatorias con jefe, 3 zonas salvajes, 3 cuevas opcionales repetibles, 4-5 santuarios, 1 puerta). Sí: son regiones grandes, y son 5 más. Se lanzan por sectores (un "cuarto de región" por versión: v0.7.1, v0.7.2…).

## 2. Cambios técnicos necesarios (antes o durante)
- Tope de nivel por región (ahora 30) subiendo con cada sector.
- Curva de experiencia: la fórmula lineal actual (+120 por nivel) se queda pequeña; pasar a una curva suave (p. ej. ∝ nivel^1,6) para que cada región lleve ~12 niveles sin grind obligatorio.
- Estadísticas: crecen lineal (×8 a nivel 80), bien. Pero el equipo es un número fijo: habrá que escalar el equipo por tiers (cada región, tier nuevo ~×1,5) y los consumibles (curas por % o tiers nuevos).
- Técnicas: 3 técnicas nuevas por clase y región (y para Yukine); tiers de pergaminos; posible segunda ultimate / ulti mejorada por región; Unión mejorada.
- Enemigos: fórmula de escalado por nivel para generarlos en lote.

## 3. Jefe final (nivel 80) — La Madre del Alba / Eclipse Eterno
Objetivo: aunque vayas muy sobrado de nivel, hay que usar estrategia.
- **Fase 1 (100 → 50 %)**: vida enorme y daño alto. Cada 4 rondas carga «Mediodía Eterno» (daño a todo el equipo, letal si no te preparas): hay que Defender, usar una Barrera, o aguantar con curas. Habilidad: Ilusión (esquiva el primer ataque de rondas impares).
- **Fase 2 (< 50 %, la segunda fase de siempre)**: cambia de habilidad (a Aura de Brasas / Fragilidad según diseño) y alterna «Día» y «Noche» cada 2 rondas: de Día es inmune a lo luminoso y al fuego; de Noche, a lo oscuro y al hielo. Obliga a que ambos personajes tengan elementos variados, no un solo build.
- **Muerte falsa**: al llegar a 0, escena de diálogo (con Yukine, y con Yamikage/los Heraldos como recuerdos). La Madre se desploma… y revive.
- **Fase 3 «Eclipse Eterno»**: más fuerte, con una **habilidad única que nadie más tiene**: «Eterno Retorno»: cada 5 rondas recupera un 5 % y borra todos tus buffs; solo la **Unión** puede interrumpirla (así el vínculo de Yukine con el protagonista cobra sentido en el final). Además, ningún golpe puede quitarle más del 4 % de su vida máxima: no hay "one-shot", hace falta aguante, curas y gestionar MP y objetos.
- **Premio de contenido opcional**: si salvaste a la Primera Noche (cueva opcional de v0.7.1) y la llevaste al Refugio, en la fase 3 te ayuda una vez ("Aliento de Noche": quita Eterno Retorno una ronda).

## 4. Historia (hilo general)
- Acto I: Yamikage guardaba una puerta (v0.7.0).
- Reino del Amanecer: la Madre del Alba detuvo el sol cuando perdió a su hija (la primera loba blanca). Los Heraldos son sus "hijos" adoptados. Yukine es la llave/descendiente. La Primera Noche (la noche misma) está exiliada y asustada.
- Regiones 5-7: más recuerdos de la manada, el pasado de Reiga y los Heraldos, y un enemigo mayor que quiere abrir la puerta del todo.
- Final: la Madre no es "mala": quiere impedir que su hija vuelva a perderse; hay que vencerla y, con Yukine, cerrar la puerta sin destruir el reino.

## 5. Postgame (más adelante)
Niveles 81-100: Torre Infinita, Torneo, superjefes (nv 100), cuevas con jefes remix, Pokédex del bestiario.

## 6. Orden de trabajo propuesto
1. ✅ v0.7.2 (hecho): sectores 3-4 del Reino (santuarios 3-4) + nueva curva de XP + tiers de equipo.
2. ✅ v0.8.0 (hecho): fin del Reino del Amanecer (santuario 5: el *sueño* de la Madre; la Madre real es el jefe final de la región 8) + sector 1 del Mar de Cristal.
3. ✅ v0.8.1 (hecho): sector 2 del Mar de Cristal (santuarios 2-3) y técnicas nuevas niveles 21-35.
4. ✅ v0.8.2 (hecho): sector 3 y final del Mar de Cristal (santuarios 4-5, Madre Loba) y técnicas niveles 37-43. Nivel máx. 46.
5. ✅ v0.8.3 (hecho): Cordillera del Eco Dorado, sector 1 (santuarios 1-2), equipo tier 6, técnicas niveles 45-49. Nivel máx. 50.
6. ✅ v0.8.4 (hecho): Cordillera sector 2 (santuarios 3-4), técnicas niveles 51-54. Nivel máx. 54.
7. ✅ v0.8.5 (hecho): fin de la Cordillera + inicio de la Ciudad de Luz (santuario 1), tier 7, técnicas 57-60. Nivel máx. 62.
8. ✅ v0.8.6 (hecho): Ciudad de Luz sector 2 (santuarios 2-3), técnicas 63-66. Nivel máx. 66.
9. ✅ v0.9.0 (hecho): fin de la Ciudad de Luz (santuarios 4-5, la Dama de la Luz), técnicas 67-70. Nivel máx. 70.
10. ✅ v0.9.1 (hecho): Corazón del Alba sector 1 (santuarios 1-2), tier 8, técnicas 71-74. Nivel máx. 74.
11. ✅ v0.9.2 (hecho): Corazón del Alba sector 2 (santuarios 3-4), técnicas 75-78. Nivel máx. 78.
12. ✅ v0.9.3 (hecho): Palacio del Alba, Madre del Alba (jefe final, 3 fases), técnicas 79-80. Nivel máx. 80. FIN DE LA CAMPAÑA.
13. Siguiente: postgame (Torre Infinita, torneo, niveles 81-100, superjefes).


## Rarezas por región (decidido en v0.7.3)
Ver `EQUIPO.md`: Kasumi/Shirogane/Akatsuki común→raro (épico solo en mercader), Amanecer raro→legendario (mítico raro en mercader), Mar de Cristal legendario→mítico (celestial en mercader), Cordillera mítico→celestial (divino), Ciudad de Luz celestial→divino (cósmico), Corazón del Alba divino→cósmico (solo cósmico). Los enemigos suben de dificultad para que la mejora del equipo sea necesaria.
