# Equipo, rarezas, mejora y mercaderes (v0.8.0)

## Rarezas y nivel máximo de mejora
| Rareza | Nivel máx. |
|---|---|
| Común | 5 |
| Poco común | 8 |
| Raro | 10 |
| Épico | 12 |
| Legendario | 15 |
| Mítico | 20 |
| Celestial | 24 |
| Divino | 26 |
| Cósmico | 30 |

**Forja** (Menú → Equipo): cada nivel suma un 8 % a los bonus base del objeto (mínimo +0,5 por nivel) y cuesta monedas (≈4 % del precio de coleccionista × nivel actual). El nivel es por objeto (si tienes dos iguales, comparten nivel). La carga de ulti no escala.

## Rarezas por región
| Región | Tier | Botín normal | Mercader ambulante |
|---|---|---|---|
| Bosques de Kasumi | T1 | Común → Poco común (jefes: Raro) | Poco común, Raro · 35 % de **Épico** |
| Montañas de Shirogane | T2 | Poco común → Raro | Poco común, Raro · 35 % de **Épico** |
| Yermo de Akatsuki | T3 | Raro | Raro · 40 % de **Épico** |
| Reino del Amanecer | T4 | Raro → Legendario | Raro, Épico, Legendario · 25 % de **Mítico** |
| Mar de Cristal (completo, v0.8.2) | T5 | Legendario → Mítico | Mítico · probabilidad de **Celestial** |
| Cordillera del Eco Dorado (completa, v0.8.5) | T6 | Mítico → Celestial | Mítico/Celestial · probabilidad de **Divino** |
| Ciudad de Luz sin Reloj (completa, v0.9.0) | T7 | Celestial → Divino | Celestial/Divino · probabilidad de **Cósmico** |
| Cordillera del Eco Dorado (futuro) | T6 | Mítico → Celestial | Celestial · probabilidad de **Divino** |
| Ciudad de Luz sin Reloj (futuro) | T7 | Celestial → Divino | Divino · probabilidad de **Cósmico** |
| Corazón del Alba (completo, v0.9.3) | T8 | Divino → Cósmico | Solo **Cósmico** |

## Familias de arma
Cada clase del protagonista usa una familia; Yukine siempre usa **grimorios**.
| Clase | Familia |
|---|---|
| Guerrero, Espadachín Mágico | Armas de filo |
| Magos (fuego, hielo, rayo, arcano) | Grimorios |
| Monje Rúnico | Guanteletes |
| Duelista Arcano | Pistolas |

Recompensas de arma (`@w:rareza:tier`): 50 % tu familia y 50 % grimorio para Yukine; si eres mago, siempre grimorio. Armaduras (`@a`) y accesorios (`@x`) no tienen familia.

## Para añadir contenido
En `data/items.json`: `tier`, `rarity`, `wtype` (armas), `mprice` (mercader), `price` (tienda). En recompensas `"@w:epic:4"` genera un objeto de esa categoría. Mercader en `world.json` → `events`: `merchant:{name,tier,rarities,bonusRarity,bonusChance,extra}`.
