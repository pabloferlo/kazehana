# Enemigos del juego (v0.8.0)

Formato para pasarme habilidades: `id → base → furia`.

**Reglas:** las habilidades que me pasaste (hasta Yamikage) se mantienen en los jefes que dijiste. El resto de jefes llevan habilidades nuevas pensadas para su historia. Los jefes sin habilidad esperan las tuyas.

## Habilidades

| Habilidad | Efecto |
|---|---|
| Intimidación | Mientras esté en pie, el ataque y la magia de tu equipo bajan ×0,7. |
| Dureza | Recibe un 15 % menos de daño. |
| Espinas | Devuelve un 8 % del daño de los ataques físicos al atacante. |
| Aura Helada | Mientras esté en pie, la velocidad de tu equipo baja ×0,7. |
| Aura de Brasas | Al final de cada ronda quema a tu equipo (4 % de sus PV máximos). |
| Regeneración | Recupera un 3 % de sus PV máximos al final de cada ronda. |
| Evasión | +12 % de probabilidad de esquivar. |
| Fragilidad | Su defensa baja, y su daño y su velocidad suben de forma permanente hasta que cae. |
| Ilusión | Esquiva siempre el primer ataque que recibe en las rondas impares (1, 3, 5…). En las pares puede recibirlos todos. |
| Amor filial | Tras cada ataque, golpea otra vez al mismo objetivo con un 20 % de la potencia. |
| Pararrayos | El daño de elemento rayo se reduce a un cuarto y le cura un 2 % de sus PV. |
| Sobrecarga | Al final de cada ronda un rayo cae sobre un miembro al azar de tu equipo (5 % de sus PV máximos). |
| Duelo | Cada vez que un miembro de tu equipo cae, su ataque y su velocidad suben de forma permanente. |
| Tiempo Detenido | Cada 3 rondas (3, 6, 9…) anula todas las mejoras de tu equipo: no te conviene potenciarte justo antes. |
| Velo Nocturno | Los ataques físicos le hacen un 30 % menos de daño: la noche difumina el filo. |
| Silencio | Tu equipo carga la ulti y la unión a menos de la mitad de velocidad. |
| Sol Radiante | Sus ataques de fuego y rayo hacen un 30 % más de daño, y tus ataques de hielo, un 20 % menos. |
| Plegaria | Cada 3 rondas recupera un 8 % de sus PV máximos. |
| Espejo | Refleja a quien ataca un 20 % del daño de los ataques no físicos. |
| Insomnio | No puede ser aturdido, congelado ni ralentizado, y cada vez que lo intentas se cura un 3 % de sus PV. |
| Pánico | Cuanto más herido está, más peligroso: por debajo del 75 % de PV sube su ataque, por debajo del 50 % su velocidad (permanente). |
| Polen Somnífero | Cada 4 rondas duerme (aturde 1 turno) a un miembro al azar de tu equipo. |
| Latido del Sol | Cada 4 rondas un latido de luz hace a todo tu equipo un 8 % de sus PV máximos (la mitad si te defiendes). |
| Canción de Cuna | Cada 3 rondas tu equipo pierde un 10 % de su MP y 10 puntos de carga de ulti. |
| Haz del Faro | Cada ronda marca a un miembro de tu equipo: el siguiente turno enemigo le hace un 25 % más de daño. |
| Aullido de Manada | Cada 3 rondas aúlla y sube su ataque durante 3 rondas. |
| Concha | El primer golpe que recibe cada ronda hace solo un 50 % del daño. |
| Ámbar | Cada ataque físico que recibe tiene un 35 % de ralentizar a quien lo hizo. |

## Enemigos normales

| id | Nombre | Nv | PV | Habilidad → en furia | Aparece en |
|---|---|---|---|---|---|
| `diablillo` | Diablillo | 1 | 49 | — | Camino de la Niebla, Santuario del Musgo |
| `lobo_sombrio` | Lobo Sombrío | 2 | 65 | — | Camino de la Niebla, Cueva de los Susurros, Santuario del Musgo, Río Cristal, Ruinas del Puesto de Vigía |
| `murcielago_demonio` | Murciélago Demonio | 3 | 59 | — | Cueva de los Susurros, Santuario del Musgo, Río Cristal, Cueva Helada |
| `hongo_toxico` | Hongo Tóxico | 3 | 89 | — | Santuario del Musgo, Río Cristal, Santuario de la Raíz Hueca, Bosque Umbrío, Pantano Sombrío |
| `espiritu_niebla` | Espíritu de la Niebla | 4 | 73 | — | Río Cristal, Santuario de la Raíz Hueca, Cueva Helada, Santuario del Alba Rota |
| `ciervo_corrupto` | Ciervo Corrupto | 5 | 130 | — | Río Cristal, Santuario de la Raíz Hueca, Bosque Umbrío, Santuario del Alba Rota, Lago de la Luna, Gruta del Ermitaño |
| `oni_menor` | Oni Menor | 6 | 162 | — | Bosque Umbrío, Santuario del Alba Rota, Torre de Kurogane, Mina de Hierro Negro, Lago de la Luna |
| `arana_gigante` | Araña Gigante | 6 | 148 | — | Santuario de la Raíz Hueca, Bosque Umbrío, Pantano Sombrío |
| `sombra_bosque` | Sombra del Bosque | 7 | 135 | — | Cueva Helada, Bosque Umbrío, Santuario del Alba Rota, Torre de Kurogane, Lago de la Luna, Gruta del Ermitaño |
| `lobo_ventisca` | Lobo de Ventisca | 10 | 300 | — | Sendero Helado, Santuario del Silencio, Paso Ventoso, Cueva de la Manada Blanca, Santuario del Lobo Dormido, Glaciar Espejo, Bosque de Escarcha, Cabaña del Cazador Maldito |
| `golem_nieve` | Gólem de Nieve | 11 | 380 | — | Sendero Helado, Santuario del Silencio, Cueva de Cristal, Paso Ventoso, Ventisquero, Bosque de Agujas, Fortaleza Congelada |
| `espectro_ventisca` | Espectro de la Ventisca | 11 | 260 | — | Santuario del Silencio, Cueva de Cristal, Paso Ventoso, Santuario del Eco Helado, Cueva de la Manada Blanca, Ventisquero, Santuario del Lobo Dormido, Bosque de Escarcha, Cabaña del Cazador Maldito |
| `cuervo_gelido` | Cuervo Gélido | 10 | 230 | — | Sendero Helado, Santuario del Silencio, Paso Ventoso, Santuario del Eco Helado, Ventisquero, Glaciar Espejo |
| `oni_nevado` | Oni Nevado | 12 | 420 | — | Santuario del Silencio, Paso Ventoso, Santuario del Eco Helado, Ventisquero, Santuario de las Mil Campanas, Torre del Aliento Blanco, Bosque de Escarcha |
| `yeti_demonio` | Yeti Demoníaco | 12 | 500 | — | Santuario del Eco Helado, Ventisquero, Santuario de las Mil Campanas, Bosque de Agujas, Santuario del Lobo Dormido, Torre del Aliento Blanco, Glaciar Espejo, Bosque de Escarcha, Valle de los Gritos |
| `monje_corrupto` | Monje Corrupto | 13 | 420 | — | Cueva de Cristal, Ventisquero, Santuario de las Mil Campanas, Bosque de Agujas, Santuario del Lobo Dormido, Torre del Aliento Blanco, Valle de los Gritos, Templo Hundido |
| `guerrero_oni` | Guerrero Oni | 14 | 560 | — | Santuario de las Mil Campanas, Bosque de Agujas, Santuario del Lobo Dormido, Torre del Aliento Blanco, Valle de los Gritos, Templo Hundido, Cueva de la Aurora |
| `ave_trueno` | Ave del Trueno | 14 | 380 | — | Ventisquero, Santuario de las Mil Campanas, Bosque de Agujas, Santuario del Lobo Dormido, Torre del Aliento Blanco, Valle de los Gritos, Cueva de la Aurora |
| `oni_ceniza` | Oni de Ceniza | 16 | 600 | — | Llanura de Cenizas, Santuario de la Ceniza, Bosque Rojo, Camino de Brasas, Cueva del Fénix Caído |
| `perro_brasa` | Sabueso de Brasas | 16 | 480 | — | Llanura de Cenizas, Santuario de la Ceniza, Camino de Brasas, Cueva del Fénix Caído |
| `kitsune_carmesi` | Kitsune Carmesí | 17 | 510 | — | Llanura de Cenizas, Santuario de la Ceniza, Bosque Rojo, Santuario de la Seda Roja, Camino de Brasas, Cueva del Fénix Caído |
| `arana_sangre` | Araña de Sangre | 17 | 638 | — | Bosque Rojo, Santuario de la Seda Roja |
| `samurai_hueco` | Samurái Hueco | 18 | 742 | — | Bosque Rojo, Santuario de la Seda Roja, Camino de Brasas, Valle de los Espejos, Santuario del Espejo Roto, Valle de las Lápidas, Santuario de las Mil Lápidas |
| `gaki_hambriento` | Gaki Hambriento | 18 | 742 | — | Camino de Brasas, Valle de los Espejos, Santuario del Espejo Roto, Valle de las Lápidas, Santuario de las Mil Lápidas, Barranco de Huesos |
| `garuda_cenizas` | Garuda de Cenizas | 19 | 712 | — | Valle de los Espejos, Santuario del Espejo Roto, Valle de las Lápidas, Cueva del Fénix Caído, Desierto de Cristal |
| `shikigami_sello` | Shikigami del Sello | 19 | 641 | — | Valle de los Espejos, Santuario del Espejo Roto, Valle de las Lápidas, Santuario del Alba Rota |
| `oni_general` | Oni General | 20 | 1050 | — | Valle de las Lápidas, Santuario de las Mil Lápidas, Santuario del Alba Rota, Camino del Castillo, Cueva del Recuerdo, Ciudadela de Ceniza, Forja del Demonio, Río de Lava, Barranco de Huesos |
| `demonio_alba` | Demonio del Alba | 20 | 825 | — | Valle de las Lápidas, Santuario de las Mil Lápidas, Santuario del Alba Rota, Camino del Castillo, Cueva del Recuerdo, Forja del Demonio, Río de Lava, Barranco de Huesos, Abismo del Alba |
| `guardia_rey` | Guardia del Rey Demonio | 21 | 1024 | — | Camino del Castillo, Castillo del Alba Eterna |
| `hechicero_alba` | Hechicero del Alba | 21 | 788 | — | Santuario del Alba Rota, Camino del Castillo, Cueva del Recuerdo, Castillo del Alba Eterna, Cueva de los Ecos, Abismo del Alba |
| `verdugo_carmesi` | Verdugo Carmesí | 22 | 1320 | — | Camino del Castillo, Cueva del Recuerdo, Castillo del Alba Eterna, Abismo del Alba |
| `jabali_corrupto` | Jabalí Corrupto | 4 | 150 | — | Ruinas del Puesto de Vigía |
| `bandido_oni` | Oni Bandolero | 5 | 165 | — | Ruinas del Puesto de Vigía, Mina de Hierro Negro |
| `rana_veneno` | Rana Venenosa | 5 | 120 | — | Pantano Sombrío, Cueva de los Nenúfares |
| `espiritu_ramas` | Espíritu de las Ramas | 6 | 150 | — | Cueva de los Nenúfares, Lago de la Luna, Gruta del Ermitaño |
| `guardia_hierro` | Guardia de Hierro Negro | 7 | 240 | — | Mina de Hierro Negro |
| `soldado_escarcha` | Soldado de Escarcha | 11 | 440 | — | Fortaleza Congelada, Glaciar Espejo, Valle de los Gritos |
| `arquera_hielo` | Arquera Gélida | 12 | 340 | — | Fortaleza Congelada, Glaciar Espejo, Bosque de Escarcha, Cabaña del Cazador Maldito |
| `serpiente_menor` | Serpiente de Escarcha | 13 | 420 | — | Glaciar Espejo, Bosque de Escarcha, Valle de los Gritos, Templo Hundido, Cueva de la Aurora |
| `monje_hundido` | Monje Hundido | 13 | 380 | — | Valle de los Gritos, Templo Hundido, Cueva de la Aurora |
| `soldado_ceniza` | Soldado de Ceniza | 18 | 820 | — | Ciudadela de Ceniza, Forja del Demonio, Desierto de Cristal, Río de Lava |
| `arquero_brasa` | Arquero de Brasa | 19 | 680 | — | Ciudadela de Ceniza, Forja del Demonio, Desierto de Cristal, Río de Lava, Barranco de Huesos |
| `escorpion_cristal` | Escorpión de Cristal | 19 | 860 | — | Desierto de Cristal, Cámara de Cristal |
| `salamandra_lava` | Salamandra de Lava | 20 | 980 | — | Forja del Demonio, Desierto de Cristal, Río de Lava, Cámara de Cristal |
| `esqueleto_barranco` | Guerrero Esquelético | 20 | 1040 | — | Barranco de Huesos |
| `eco_sombra` | Eco de Sombra | 21 | 860 | — | Cueva de los Ecos, Abismo del Alba |
| `centinela_luz` | Centinela de Luz | 23 | 1485 | — | Llanura Dorada, Bosque sin Sombra, Santuario del Primer Rayo |
| `mariposa_alba` | Mariposa del Alba | 23 | 1100 | — | Llanura Dorada, Bosque sin Sombra, Santuario del Primer Rayo |
| `bestia_dorada` | Bestia Dorada | 24 | 1650 | — | Llanura Dorada, Bosque sin Sombra, Santuario del Primer Rayo, Desfiladero de Oro, Santuario del Segundo Rayo, Campo de Girasoles |
| `sombra_negada` | Sombra Negada | 24 | 1210 | — | Bosque sin Sombra, Santuario del Primer Rayo, Desfiladero de Oro, Cueva de la Primera Noche |
| `relojero_hueco` | Relojero Hueco | 25 | 1650 | — | Campos de Espejismo, Torre del Reloj Quieto, Santuario del Segundo Rayo |
| `arena_viva` | Arena Viva | 26 | 1155 | — | Campos de Espejismo, Torre del Reloj Quieto, Desfiladero de Oro, Santuario del Segundo Rayo, Cueva de la Primera Noche |
| `cuervo_dorado` | Cuervo Dorado | 26 | 1485 | — | Campos de Espejismo, Torre del Reloj Quieto, Desfiladero de Oro, Santuario del Segundo Rayo |
| `guardia_prisma` | Guardia del Prisma | 27 | 1870 | — | Campos de Espejismo, Torre del Reloj Quieto, Desfiladero de Oro, Santuario del Segundo Rayo |
| `girasol_centinela` | Girasol Centinela | 28 | 1925 | — | Campo de Girasoles, Observatorio del Sol Quieto, Santuario del Tercer Rayo |
| `libelula_cristal` | Libélula de Cristal | 28 | 1485 | — | Lago del Mediodía, Campo de Girasoles, Observatorio del Sol Quieto, Santuario del Tercer Rayo, Gruta del Espejo de Agua |
| `pescador_ahogado` | Pescador Ahogado | 29 | 1925 | — | Lago del Mediodía, Observatorio del Sol Quieto, Santuario del Tercer Rayo, Gruta del Espejo de Agua |
| `reflejo_errante` | Reflejo Errante | 29 | 1650 | — | Lago del Mediodía, Campo de Girasoles, Observatorio del Sol Quieto, Santuario del Tercer Rayo, Gruta del Espejo de Agua |
| `sonambulo` | Sonámbulo | 30 | 2255 | — | Colinas de Ámbar, Camino de la Vigilia, Torre de la Vigilia Eterna, Santuario del Cuarto Rayo |
| `polilla_insomne` | Polilla Insomne | 30 | 1650 | — | Colinas de Ámbar, Camino de la Vigilia, Cueva de Ámbar Viva, Torre de la Vigilia Eterna, Santuario del Cuarto Rayo |
| `soldado_vigilia` | Soldado de la Vigilia | 31 | 2475 | — | Colinas de Ámbar, Camino de la Vigilia, Cueva de Ámbar Viva, Torre de la Vigilia Eterna, Santuario del Cuarto Rayo |
| `golem_ambar` | Gólem de Ámbar | 31 | 2640 | — | Colinas de Ámbar, Camino de la Vigilia, Cueva de Ámbar Viva, Torre de la Vigilia Eterna, Santuario del Cuarto Rayo |
| `estatua_heraldo` | Estatua de Heraldo | 33 | 3200 | — | Senda de los Cinco Rayos, Jardines Dormidos, Jardines del Palacio, Palacio del Sol Quieto, Cueva de las Cunas Vacías |
| `rosa_alba` | Rosa del Alba | 33 | 2100 | — | Senda de los Cinco Rayos, Jardines Dormidos, Jardines del Palacio, Palacio del Sol Quieto, Cueva de las Cunas Vacías |
| `lobo_sueno` | Lobo de Sueño | 34 | 2650 | — | Senda de los Cinco Rayos, Jardines Dormidos, Jardines del Palacio, Palacio del Sol Quieto, Cueva de las Cunas Vacías |
| `cangrejo_cristal` | Cangrejo de Cristal | 35 | 3500 | — | Playa de Espejos, Arrecife de Cristal, Faro Hundido, Santuario de la Primera Marea, Cueva de las Perlas |
| `medusa_luz` | Medusa Lumínica | 35 | 2150 | — | Playa de Espejos, Arrecife de Cristal, Faro Hundido, Santuario de la Primera Marea, Cueva de las Perlas |
| `sirena_eco` | Sirena del Eco | 36 | 2450 | — | Playa de Espejos, Arrecife de Cristal, Faro Hundido, Santuario de la Primera Marea, Cueva de las Perlas |
| `tiburon_espectral` | Tiburón Espectral | 36 | 3150 | — | Playa de Espejos, Arrecife de Cristal, Faro Hundido, Santuario de la Primera Marea |

## Jefes

| id | Nombre | Nv | PV | Habilidad → en furia | Aparece en |
|---|---|---|---|---|---|
| `lobo_alfa` | Lobo Alfa Corrupto | 4 | 380 | Intimidación | Cueva de los Susurros |
| `golem_escarcha` | Gólem de Escarcha Corrupta | 7 | 640 | Dureza | Cueva Helada |
| `guardian_musgo` | Guardián del Musgo | 5 | 600 | Dureza | Santuario del Musgo |
| `madre_arana` | Madre Tejeraíces | 7 | 915 | Amor filial | Santuario de la Raíz Hueca |
| `kagero` | Kagerō, la Zorra Espectral | 8 | 974 | Evasión → Ilusión | Santuario del Alba Rota |
| `kurogane` | Kurogane, el Oni de Hierro | 10 | 1944 | Dureza → Intimidación | Torre de Kurogane |
| `rin` | Rin, la Espadachina Errante | 13 | 1610 | — |  |
| `reina_cristal` | Reina de Cristal | 11 | 1800 | Dureza → Fragilidad | Cueva de Cristal |
| `lobo_ancestral` | Lobo Ancestral Corrupto | 13 | 2400 | Intimidación → Regeneración | Cueva de la Manada Blanca |
| `monje_silencio` | Monje del Silencio | 12 | 1530 | — | Santuario del Silencio |
| `wendigo` | Wendigo de Escarcha | 13 | 2280 | Aura Helada | Santuario del Eco Helado |
| `tengu_campanas` | Tengu de las Mil Campanas | 14 | 2640 | — | Santuario de las Mil Campanas |
| `sombra_alfa` | Sombra del Alfa Ancestral | 15 | 3120 | Evasión → Intimidación | Santuario del Lobo Dormido |
| `reiga` | Reiga, el Cazador Gélido | 16 | 3409 | Aura Helada → Intimidación | Torre del Aliento Blanco |
| `kaen_oni` | Kaen, el Oni de Ceniza | 17 | 4485 | — | Santuario de la Ceniza |
| `jorogumo_carmesi` | Jorōgumo Carmesí | 18 | 4934 | Evasión → Espinas | Santuario de la Seda Roja |
| `espejo_del_vengador` | El Espejo del Vengador | 19 | 5744 | — | Santuario del Espejo Roto |
| `gashadokuro` | Gashadokuro | 20 | 6440 | — | Santuario de las Mil Lápidas |
| `centinela_alba` | Centinela del Alba Rota | 21 | 7146 | Dureza → Evasión | Santuario del Alba Rota |
| `fenix_caido` | Fénix Caído | 19 | 5589 | Regeneración → Aura de Brasas | Cueva del Fénix Caído |
| `kurogane_renacido` | Kurogane Renacido | 22 | 7894 | Intimidación → Aura de Brasas | Cueva del Recuerdo |
| `yamikage` | Yamikage, el Rey Demonio | 22 | 7803 | Dureza → Intimidación | Castillo del Alba Eterna |
| `yamikage_alba` | Yamikage, Alba Eterna | 22 | 9302 | Intimidación → Aura de Brasas | Castillo del Alba Eterna |
| `daichi_duelo` | Daichi, el Capitán Veterano | 19 | 3120 | — |  |
| `capitan_tessen` | Capitán Tessen | 5 | 660 | — | Ruinas del Puesto de Vigía |
| `capataz_dogo` | Capataz Dogo | 7 | 1000 | — | Mina de Hierro Negro |
| `reina_rana` | Reina Rana | 6 | 800 | — | Cueva de los Nenúfares |
| `ciervo_espectral` | Ciervo Espectral | 8 | 1240 | — | Gruta del Ermitaño |
| `general_escarcha` | General Hakuren | 11 | 2990 | — | Fortaleza Congelada |
| `serpiente_hielo` | Serpiente Abisal | 14 | 3100 | — | Templo Hundido |
| `cazador_fantasma` | Cazador Fantasma | 12 | 2660 | — | Cabaña del Cazador Maldito |
| `dragon_nieve` | Dragón de Nieve | 14 | 3600 | — | Cueva de la Aurora |
| `monje_abad` | Abad Genshin | 13 | 2700 | — |  |
| `general_ceniza` | General Karasu | 20 | 5200 | — | Ciudadela de Ceniza |
| `herrero_demonio` | Herrero Maldito Kuroda | 21 | 6200 | — | Forja del Demonio |
| `rey_cristal` | Rey de Cristal | 20 | 4050 | Dureza → Fragilidad | Cámara de Cristal |
| `voz_perdida` | Voz Perdida | 21 | 5220 | — | Cueva de los Ecos |
| `guardian_alba` | Guardián del Abismo | 22 | 8280 | — | Abismo del Alba |
| `heraldo_rayo` | Heraldo del Primer Rayo | 24 | 7820 | Pararrayos → Sobrecarga | Santuario del Primer Rayo |
| `relojero_eterno` | Relojero Eterno Tokei | 26 | 6440 | Tiempo Detenido → Fragilidad | Torre del Reloj Quieto |
| `heraldo_segundo` | Heraldo del Segundo Rayo | 27 | 10810 | Duelo → Sobrecarga | Santuario del Segundo Rayo |
| `primera_noche` | La Primera Noche | 27 | 6785 | Velo Nocturno → Silencio | Cueva de la Primera Noche |
| `vigia_solar` | Vigía del Sol Quieto | 29 | 9775 | Sol Radiante → Aura de Brasas | Observatorio del Sol Quieto |
| `heraldo_tercero` | Heraldo del Tercer Rayo | 30 | 10600 | Plegaria → Sobrecarga | Santuario del Tercer Rayo |
| `reflejo_mediodia` | Reflejo del Mediodía | 29 | 7820 | Espejo → Evasión | Gruta del Espejo de Agua |
| `capitan_insomne` | Capitán Insomne | 31 | 9890 | Insomnio → Intimidación | Torre de la Vigilia Eterna |
| `heraldo_cuarto` | Heraldo del Cuarto Rayo | 32 | 13570 | Pánico → Fragilidad | Santuario del Cuarto Rayo |
| `resina_ancestral` | Resina Ancestral | 31 | 11270 | Ámbar → Dureza | Cueva de Ámbar Viva |
| `guardiana_jardin` | Hanae, Jardinera Eterna | 33 | 13200 | Polen Somnífero → Espinas | Jardines del Palacio |
| `nodriza_vacia` | Nodriza de las Cunas Vacías | 33 | 8200 | Canción de Cuna → Dureza | Cueva de las Cunas Vacías |
| `sueno_madre` | Sueño de la Madre del Alba | 34 | 16200 | Latido del Sol → Duelo | Palacio del Sol Quieto |
| `farero_ahogado` | El Farero Ahogado | 36 | 11500 | Haz del Faro → Aura Helada | Faro Hundido |
| `gran_ostra` | Gran Ostra Perlada | 36 | 9800 | Concha → Dureza | Cueva de las Perlas |
| `loba_memorial` | Loba del Recuerdo | 37 | 10800 | Aullido de Manada → Intimidación | Santuario de la Primera Marea |
