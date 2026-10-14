/* KAZEHANA · datos sociales: nombres, físicos, trabajos, personalidades y frases */
(function (G) {
  'use strict';
  const D = G.D;

  D.NAMES_M = ['Haruto', 'Ren', 'Kaito', 'Daichi', 'Sora', 'Ryota', 'Takeshi', 'Kenji', 'Hiroshi', 'Akira', 'Yuuto', 'Shin', 'Souta', 'Taiga', 'Raiden', 'Gen', 'Isamu', 'Masaru', 'Jiro', 'Tatsuya', 'Kazuki', 'Hayato', 'Ibuki', 'Rikuto', 'Goro', 'Seiji', 'Toma', 'Eiji', 'Nobu', 'Kuro'];
  D.NAMES_F = ['Sakura', 'Hana', 'Yuki', 'Rin', 'Mei', 'Akari', 'Aoi', 'Kaede', 'Nao', 'Mio', 'Ayame', 'Haruka', 'Chiyo', 'Emi', 'Hinata', 'Kasumi', 'Reina', 'Saya', 'Tsubaki', 'Yuna', 'Misaki', 'Natsuki', 'Shiori', 'Ran', 'Fuyu', 'Momoka', 'Airi', 'Tomoe', 'Ume', 'Kiyo'];
  D.SURNAMES = ['Takahashi', 'Kurogane', 'Shirakawa', 'Mizuno', 'Hoshino', 'Kagami', 'Tsukishiro', 'Amano', 'Fujiwara', 'Kitamura', 'Sakamoto', 'Yamabuki', 'Hayashi', 'Nakagawa', 'Ishida', 'Kuroda', 'Asakura', 'Tachibana', 'Shimizu', 'Aizawa', 'Kisaragi', 'Himura', 'Morita', 'Kagura'];

  D.HAIR_COLORS = [
    { id: 'negro', n: 'negro', hex: '#1d1b26' }, { id: 'castano', n: 'castaño', hex: '#5b3a29' }, { id: 'rubio', n: 'rubio', hex: '#e7c76e' },
    { id: 'pelirrojo', n: 'pelirrojo', hex: '#b9472b' }, { id: 'plateado', n: 'plateado', hex: '#c9cedb' }, { id: 'blanco', n: 'blanco', hex: '#f0f0f5' },
    { id: 'azul', n: 'azul', hex: '#3b6fd6' }, { id: 'rosa', n: 'rosa', hex: '#ef8ab9' }, { id: 'verde', n: 'verde', hex: '#4aa86d' }, { id: 'violeta', n: 'violeta', hex: '#8a5bd1' },
  ];
  D.EYE_COLORS = [
    { id: 'marron', n: 'marrones', hex: '#6b3f24' }, { id: 'negro', n: 'negros', hex: '#22222c' }, { id: 'verde', n: 'verdes', hex: '#3c9a5a' }, { id: 'azul', n: 'azules', hex: '#3b7bd6' },
    { id: 'gris', n: 'grises', hex: '#8d97a6' }, { id: 'dorado', n: 'dorados', hex: '#d4a62a' }, { id: 'violeta', n: 'violetas', hex: '#8f56c9' }, { id: 'rojo', n: 'rojos', hex: '#c1403d' },
  ];
  D.SKINS = ['#f8dfcd', '#efc9a9', '#e2ae87', '#c98f66', '#a56b47', '#7a4a31'];
  D.OUTFITS = ['#3b4a7a', '#7a2f3d', '#2f6b5a', '#6b4a8f', '#c27a3a', '#2e2e3a', '#a8434f', '#4a8fa8'];
  D.HAIR_STYLES = {
    short: 'corto', spiky: 'en punta', bald: 'rapado', bob: 'media melena', long: 'largo', ponytail: 'coleta', bun: 'moño', twin: 'dos coletas', medium: 'a media espalda',
  };

  // Complexiones: texto (para la descripción) + etiquetas (para gustos)
  D.BUILDS = {
    m: {
      musculoso: { t: 'hombros anchos y un cuerpo muy musculoso', tags: ['musculoso', 'fuerte'], lb: 7 },
      atletico: { t: 'cuerpo atlético, de torso definido y brazos marcados', tags: ['atletico', 'fuerte'], lb: 6 },
      corpulento: { t: 'complexión corpulenta, de pecho ancho y brazos gruesos', tags: ['robusto', 'fuerte'], lb: 3 },
      fibroso: { t: 'complexión fibrosa y ágil, todo nervio', tags: ['delgado', 'atletico'], lb: 4 },
      delgado: { t: 'complexión delgada y elegante', tags: ['delgado'], lb: 3 },
      regordete: { t: 'figura algo regordeta y de aspecto acogedor', tags: ['robusto'], lb: 0 },
    },
    f: {
      atletico: { t: 'cuerpo atlético y bien entrenado, de abdomen marcado, piernas fuertes y trasero firme', tags: ['atletico', 'fuerte'], lb: 7 },
      curvy: { t: 'figura de reloj de arena: pecho generoso, cintura estrecha y caderas anchas', tags: ['curvy'], lb: 8 },
      voluptuosa: { t: 'curvas muy marcadas, pecho abundante y un trasero redondeado', tags: ['curvy', 'voluptuoso'], lb: 8 },
      delgado: { t: 'figura esbelta y elegante, de piernas largas', tags: ['delgado'], lb: 5 },
      menudo: { t: 'complexión menuda y delicada', tags: ['menudo', 'delgado'], lb: 4 },
      robusto: { t: 'cuerpo robusto y generoso, de brazos fuertes y caderas anchas', tags: ['robusto', 'fuerte'], lb: 3 },
      musculoso: { t: 'cuerpo musculado, de hombros fuertes y piernas poderosas', tags: ['musculoso', 'fuerte'], lb: 5 },
    },
  };
  // Para el creador de personaje (jugador): mismas claves, nombres cortos
  D.BUILD_LABELS = { musculoso: 'Musculoso/a', atletico: 'Atlético/a', corpulento: 'Corpulento', fibroso: 'Fibroso', delgado: 'Delgado/a', regordete: 'Regordete', curvy: 'Curvy', voluptuosa: 'Muy curvy', menudo: 'Menudo/a', robusto: 'Robusto/a' };
  D.PLAYER_BUILDS = { m: ['musculoso', 'atletico', 'corpulento', 'fibroso', 'delgado', 'regordete'], f: ['atletico', 'curvy', 'voluptuosa', 'delgado', 'menudo', 'robusto', 'musculoso'] };
  D.HEIGHTS = { bajo: 'de baja estatura', medio: 'de estatura media', alto: 'bastante alt{x}', muyalto: 'muy alt{x}' };
  D.TYPES = [
    { id: 'musculoso', n: 'Musculoso/a' }, { id: 'atletico', n: 'Atlético/a' }, { id: 'delgado', n: 'Delgado/a' }, { id: 'curvy', n: 'Curvy' },
    { id: 'robusto', n: 'Robusto/a' }, { id: 'alto', n: 'Alto/a' }, { id: 'menudo', n: 'Bajito/a' }, { id: 'maduro', n: 'Maduro/a (45+)' },
  ];
  D.ACCS = {
    gafas: 'gafas redondas', cicatriz: 'una cicatriz que le cruza el rostro', pecas: 'pecas en la nariz y mejillas', pendientes: 'pendientes dorados', cinta: 'una cinta atada a la frente',
    sombrero: 'un sombrero de paja cónico', lunar: 'un lunar junto a la boca', marca: 'una marca pintada bajo el ojo', barba: 'barba cuidada', orejas: 'orejas de zorro (sangre de kitsune)', cuernos: 'pequeños cuernos (sangre de oni)',
  };

  /* ------ Trabajos ------ */
  const J = (id, m, f, place, col, outfit, lore, o) => (D.JOBS[id] = Object.assign({ id, m, f, place, col, outfit, lore, w: 1, settle: ['aldea', 'ciudad', 'capital', 'monte'] }, o));
  D.JOBS = {};
  J('herrero', 'herrero', 'herrera', 'mercado', ['#6b4a3a', '#c9ac7a'], 'delantal de cuero chamuscado', ['Llevo años golpeando el hierro; un buen filo vale más que mil palabras.', 'El secreto de una buena katana es la paciencia, no la fuerza.'], { w: 1.2 });
  J('cocinero', 'cocinero', 'cocinera', 'taberna', ['#a8434f', '#f1e6d2'], 'delantal blanco manchado de salsa', ['Cocinar es la mejor forma de cuidar a alguien.', 'Mi caldo lleva una receta secreta que me dejó mi abuela.'], { w: 1.3 });
  J('curandero', 'curandero', 'curandera', 'templo', ['#4a8f72', '#efe6d0'], 'túnica verde con bolsitas de hierbas', ['Las hierbas lo curan casi todo; lo difícil es curar el corazón.', 'Si te duele algo, ven a verme. Y si no te duele, también.'], {});
  J('guardia', 'guardia', 'guardia', 'plaza', ['#2e3a5a', '#c9ac7a'], 'armadura ligera con el emblema local', ['Mantener el orden es más aburrido de lo que parece... salvo cuando no lo es.', 'Aquí siempre hay problemas, pero la gente es buena.'], { w: 1.4 });
  J('mercader', 'mercader', 'mercadera', 'mercado', ['#c27a3a', '#f4d8a0'], 'abrigo con muchos bolsillos', ['Todo tiene un precio. Hasta las promesas.', 'He recorrido medio reino con este carro.'], { w: 1.3 });
  J('campesino', 'campesino', 'campesina', 'plaza', ['#7a8f4a', '#d9c99a'], 'ropa de campo remendada', ['El arroz no se planta solo; la tierra pide respeto.', 'Madrugar es de sabios, aunque duela.'], { w: 1.6, settle: ['aldea', 'monte', 'ciudad'] });
  J('monje', 'monje', 'monja', 'templo', ['#8f5a2e', '#e6d9b8'], 'hábito de monje, de tela sencilla', ['La calma es una forma de fuerza.', 'Cada mañana barro las hojas; cada tarde, mis pensamientos.'], { settle: ['aldea', 'ciudad', 'capital', 'monte'] });
  J('instructor', 'instructor', 'instructora', 'dojo', ['#2e2e3a', '#d6dcff'], 'gi de entrenamiento con cinturón negro', ['Un golpe sin corazón no es técnica: es ruido.', 'Aquí se entrena de sol a sol. ¿Vienes a sudar?'], { settle: ['ciudad', 'capital', 'monte'] });
  J('ninja', 'ninja', 'kunoichi', 'taberna', ['#25252f', '#7a2f3d'], 'ropas oscuras y vendas en las muñecas', ['Si me ves, es porque yo quiero.', 'La discreción es el mejor oficio.'], { w: 0.6, settle: ['ciudad', 'capital', 'monte'] });
  J('cazarrecompensas', 'cazarrecompensas', 'cazarrecompensas', 'gremio', ['#5a3a2a', '#b9a077'], 'capa de viaje y bolsa de cadenas', ['Se paga bien por cabezas de bandidos, pero cuesta dormir.', 'Cada recompensa tiene una historia detrás.'], { settle: ['ciudad', 'capital'] });
  J('bardo', 'bardo', 'bardesa', 'taberna', ['#6b4a8f', '#f2c14e'], 'chaleco colorido con un biwa a la espalda', ['Cada canción es una puerta a otro mundo.', 'Si me invitas a un trago, te compongo una balada.'], { w: 0.9 });
  J('erudito', 'erudito', 'erudita', 'templo', ['#3b4a7a', '#e6d9b8'], 'túnica con tinta en las mangas', ['Los libros no muerden; los lectores a veces sí.', 'Llevo décadas estudiando el Sello y sigo sin entenderlo.'], { settle: ['ciudad', 'capital', 'monte'] });
  J('pescador', 'pescador', 'pescadora', 'plaza', ['#4a8fa8', '#d9c99a'], 'chaleco impermeable y sombrero de ala ancha', ['El río no tiene prisa, y yo tampoco.', 'Hoy pica, ya lo verás.'], { w: 1.1, settle: ['aldea', 'ciudad'] });
  J('noble', 'noble', 'noble', 'plaza', ['#7a2f3d', '#f2c14e'], 'kimono de seda bordado', ['Ser noble es una carga. Una preciosa carga, eso sí.', 'En la corte, una sonrisa es un arma.'], { w: 0.7, settle: ['ciudad', 'capital'] });
  J('ladron', 'ladrón', 'ladrona', 'taberna', ['#33333f', '#c9ac7a'], 'capucha gastada y guantes finos', ['"Tomar prestado" suena mejor que robar, ¿no crees?', 'No se lo digas a la guardia, ¿vale?'], { w: 0.6, settle: ['ciudad', 'capital'] });
  J('aprendiz', 'aprendiz', 'aprendiz', 'plaza', ['#4a8f72', '#f4d8a0'], 'ropa sencilla y una bolsa de herramientas', ['Estoy aprendiendo, pero algún día seré el mejor.', 'Mi maestro dice que soy un desastre... con cariño.'], { w: 1.1 });
  J('tabernero', 'tabernero', 'tabernera', 'taberna', ['#8f5a2e', '#f1e6d2'], 'delantal oscuro y un paño al hombro', ['Aquí se oye de todo, pero yo no oigo nada.', 'Lo que se dice en mi barra, se queda en mi barra.'], { w: 1.2 });
  J('alquimista', 'alquimista', 'alquimista', 'mercado', ['#6b4a8f', '#7fe3c4'], 'bata manchada con frascos colgando', ['A veces la mezcla explota. Es parte del proceso.', 'Con la combinación correcta, hasta el plomo brilla.'], { w: 0.8, settle: ['ciudad', 'capital', 'monte'] });
  J('cazador', 'cazador', 'cazadora', 'gremio', ['#5a6b3a', '#d9c99a'], 'chaleco de piel y un arco al hombro', ['El bosque enseña más que cualquier libro.', 'Seguir rastros es escuchar lo que el bosque susurra.'], { settle: ['aldea', 'ciudad', 'monte'] });
  J('sacerdote', 'sacerdote', 'sacerdotisa', 'templo', ['#c0392b', '#f1e6d2'], 'ropas blancas y rojas de miko/sacerdote', ['Los espíritus escuchan a quien sabe callar.', 'El Sello necesita rezos... y valientes.'], { w: 0.9 });
  J('luchador', 'luchador', 'luchadora', 'arena', ['#a8434f', '#2e2e3a'], 'protecciones de arena y vendas', ['El público no perdona, pero tampoco olvida.', 'Cada combate me enseña a levantarme de nuevo.'], { w: 1.5, settle: ['capital'] });
  J('artista', 'pintor', 'pintora', 'plaza', ['#4a8fa8', '#ef8ab9'], 'blusón manchado de colores', ['Pinto lo que otros no ven.', 'Cada rostro es un paisaje.'], { w: 0.8, settle: ['ciudad', 'capital', 'aldea'] });
  J('maestro', 'maestro', 'maestra', 'templo', ['#2e2e3a', '#d6dcff'], 'túnica sabia con un bastón de nogal', ['El Sello se debilita. Tú eres la esperanza que no esperaba.', 'Hay quien nace para brillar. Y hay quien nace para sostener la luz.'], { w: 0 });
  J('rival', 'rival', 'rival', 'dojo', ['#2f6b5a', '#f2c14e'], 'gi impecable con el emblema de la capital', ['No pienso perder contra nadie. Ni siquiera contra ti.', 'Cada victoria me acerca más a mi objetivo.'], { w: 0 });

  /* ------ Personalidades ------ */
  D.PERS = {
    amable: { n: 'Amable', d: 'Cálida y atenta con todo el mundo.', base: ['alegre', 'sereno', 'neutral'], eye: 'soft',
      mod: { charlar: 0.12, cumplido: 0.1, regalar: 0.08, bromear: 0.02, coquetear: -0.02, cita: 0.06, retar: -0.1 },
      good: ['Contigo da gusto hablar.', 'Eres buena gente, ¿lo sabías?'], bad: ['Perdona... hoy no estoy de humor.'] },
    timido: { n: 'Tímido', d: 'Se pone nervioso con facilidad, pero tiene un gran corazón.', base: ['timido', 'nervioso', 'neutral'], eye: 'soft',
      mod: { charlar: -0.05, cumplido: 0.06, coquetear: -0.12, bromear: -0.08, regalar: 0.1, cita: -0.02, retar: -0.15 },
      good: ['Y-yo también lo estoy pasando bien...', 'Gracias por tener paciencia conmigo.'], bad: ['L-lo siento, es que... no sé qué decir.'] },
    orgulloso: { n: 'Orgulloso', d: 'Seguro de sí mismo y difícil de impresionar.', base: ['serio', 'burlon', 'neutral'], eye: 'sharp',
      mod: { charlar: -0.05, cumplido: 0.12, bromear: -0.1, regalar: 0, coquetear: 0.02, retar: 0.15 },
      good: ['Hmph. Tienes buen ojo.', 'No está mal. Sigue así.'], bad: ['No me hagas perder el tiempo.'] },
    bromista: { n: 'Bromista', d: 'Todo es un chiste para esta persona.', base: ['alegre', 'burlon'], eye: 'soft',
      mod: { bromear: 0.2, charlar: 0.06, cumplido: -0.02, coquetear: 0.04, retar: 0.02 },
      good: ['¡Ja! Me caes bien, rarit{o}.', 'Esto hay que repetirlo.'], bad: ['Vaya... ese humor necesita práctica.'] },
    serio: { n: 'Serio', d: 'Reservada, disciplinada y de pocas palabras.', base: ['serio', 'neutral', 'sereno'], eye: 'sharp',
      mod: { charlar: -0.08, bromear: -0.12, cumplido: 0, regalar: 0.05, retar: 0.12, coquetear: -0.08 },
      good: ['...Aprecio tu compañía.', 'Eres más interesante de lo que parecías.'], bad: ['No es el momento.'] },
    tsundere: { n: 'Tsundere', d: 'Fría por fuera, pero se ruboriza con facilidad.', base: ['avergonzado', 'enfadado', 'timido'], eye: 'sharp',
      mod: { regalar: 0.06, cumplido: -0.04, bromear: -0.04, coquetear: -0.06, charlar: -0.06, retar: 0.08 },
      good: ['¡N-no es que me alegre de verte ni nada!', '¡Tont{o}... no me mires así!'], bad: ['¡Hmph! ¡No te acerques tanto!'] },
    misterioso: { n: 'Misterioso', d: 'Habla poco y deja más preguntas que respuestas.', base: ['sereno', 'serio', 'burlon'], eye: 'sharp',
      mod: { charlar: -0.02, cumplido: 0.04, bromear: -0.04, coquetear: 0.05, retar: 0.05 },
      good: ['Interesante... eres distint{o} a los demás.', 'Quizá algún día te cuente más.'], bad: ['Hay cosas que es mejor no preguntar.'] },
    impulsivo: { n: 'Impulsivo', d: 'Energía desbordante y cero paciencia.', base: ['alegre', 'nervioso', 'enfadado'], eye: 'big',
      mod: { charlar: 0.04, bromear: 0.08, cumplido: 0.05, coquetear: 0.04, retar: 0.2, cita: 0.04 },
      good: ['¡Esto es genial! ¡Vamos a hacer algo!', '¡Me has alegrado el día!'], bad: ['¡Ugh! ¡Qué aburrimiento!'] },
    sabio: { n: 'Sabio', d: 'Tranquila, reflexiva, con respuestas para casi todo.', base: ['sereno', 'neutral'], eye: 'soft',
      mod: { charlar: 0.1, cumplido: 0.0, bromear: 0.0, coquetear: -0.04, regalar: 0.05, retar: -0.05 },
      good: ['Hablar contigo es como una buena taza de té.', 'Tienes un alma curiosa. Me gusta.'], bad: ['La paciencia es una virtud, joven viajer{o}.'] },
    coqueto: { n: 'Coqueto', d: 'Encantador/a, seguro y siempre con una sonrisa pícara.', base: ['coqueto', 'alegre', 'burlon'], eye: 'soft',
      mod: { coquetear: 0.18, cumplido: 0.1, cita: 0.1, bromear: 0.03, charlar: 0.03, retar: 0.0 },
      good: ['Mmm, me gusta cómo hablas...', 'No me importaría verte más a menudo.'], bad: ['Qué pena. Esperaba algo más de ti.'] },
    rudo: { n: 'Rudo', d: 'Directa y áspera, pero muy leal.', base: ['serio', 'enfadado', 'neutral'], eye: 'sharp',
      mod: { charlar: -0.06, bromear: 0.0, cumplido: -0.06, regalar: 0.05, retar: 0.18, coquetear: -0.04 },
      good: ['Tch. No eres tan inútil como pensaba.', 'Vale. Me caes bien. No lo repitas.'], bad: ['Piérdete.'] },
    sonador: { n: 'Soñador', d: 'Con la cabeza en las nubes y el corazón enorme.', base: ['sereno', 'alegre', 'timido'], eye: 'big',
      mod: { charlar: 0.08, cumplido: 0.06, regalar: 0.08, bromear: 0.0, coquetear: 0.0, cita: 0.06, retar: -0.12 },
      good: ['A veces creo que las estrellas te escuchan.', 'Tengo la sensación de que nos hemos conocido antes.'], bad: ['Perdona, estaba en las nubes...'] },
  };

  /* ------ Moods ------ */
  D.MOODS = {
    neutral: { l: 'Calma', e: '😐' }, alegre: { l: 'Alegría', e: '😊' }, timido: { l: 'Timidez', e: '😳' }, enfadado: { l: 'Enfado', e: '😠' },
    triste: { l: 'Tristeza', e: '😢' }, coqueto: { l: 'Picardía', e: '😏' }, sorprendido: { l: 'Sorpresa', e: '😲' }, serio: { l: 'Seriedad', e: '🧐' },
    burlon: { l: 'Guasa', e: '😜' }, avergonzado: { l: 'Vergüenza', e: '🙈' }, enamorado: { l: 'Enamoramiento', e: '😍' }, nervioso: { l: 'Nervios', e: '😅' }, sereno: { l: 'Serenidad', e: '😌' },
  };
  D.EMOTES = {
    neutral: ['Te mira con tranquilidad.', 'Asiente despacio.'],
    alegre: ['Sonríe de oreja a oreja.', 'Se le ilumina la cara.'],
    timido: ['Se sonroja y juega con el borde de su ropa.', 'Desvía la mirada, con las mejillas encendidas.'],
    enfadado: ['Frunce el ceño y cruza los brazos.', 'Aprieta los dientes.'],
    triste: ['Baja la mirada, con un suspiro.', 'Se le humedecen los ojos.'],
    coqueto: ['Te guiña un ojo con una sonrisa traviesa.', 'Ladea la cabeza y te sostiene la mirada.'],
    sorprendido: ['Abre los ojos como platos.', 'Parpadea, sin saber qué decir.'],
    serio: ['Te observa con gesto serio.', 'Se queda en silencio un momento.'],
    burlon: ['Se ríe por lo bajo, con aire divertido.', 'Arquea una ceja con media sonrisa.'],
    avergonzado: ['Se tapa la cara con las manos.', 'Se pone roj{x} hasta las orejas.'],
    enamorado: ['Te mira con el corazón en los ojos.', 'Suspira, con la mirada perdida en ti.'],
    nervioso: ['Se rasca la nuca, con nervios.', 'Se ríe con torpeza.'],
    sereno: ['Respira hondo y sonríe en calma.', 'Cierra los ojos un instante, en paz.'],
  };

  /* ------ Frases por acción y resultado: great / good / meh / bad ------ */
  D.ACT = {
    charlar: {
      great: ['Me encanta charlar contigo, {p}. Se me pasa el tiempo volando.', 'Qué bien me siento cuando hablamos... gracias por escucharme.'],
      good: ['Hacía tiempo que no tenía una conversación así.', 'Sí, tienes razón en eso. Me has dado qué pensar.'],
      meh: ['Mm. Sí, claro... el tiempo, el trabajo, lo de siempre.', 'Ya... pues eso, ya ves.'],
      bad: ['Tengo cosas que hacer, {p}. Quizá otro día.', 'No me apetece hablar ahora mismo.'] },
    bromear: {
      great: ['¡JAJAJA! ¡Para, que me duele la barriga!', 'Ese ha sido buenísimo. ¡Cuéntame otro!'],
      good: ['Jeje, no está mal.', 'Ja... vale, esa me ha hecho gracia.'],
      meh: ['...¿Era un chiste? Ah. Ya.', 'Mmm. Una sonrisa por esfuerzo.'],
      bad: ['Eso ha sido de mal gusto, {p}.', 'No tengo el cuerpo para bromas.'] },
    cumplido: {
      great: ['¿D-de verdad piensas eso de mí...? Me has alegrado el día entero.', 'Nadie me había dicho algo tan bonito.'],
      good: ['Oh... gracias. Eso ha sonado sincero.', 'Vaya, qué amable. Me has hecho sonreír.'],
      meh: ['Eh... gracias, supongo.', 'Mm. Dicen muchas cosas por ahí.'],
      bad: ['Eso... ¿se supone que me tiene que gustar?', 'No hace falta que me adules, {p}.'] },
    coquetear: {
      great: ['Si sigues mirándome así, voy a olvidarme de todo lo demás...', 'Cuidado, {p}. Me estás poniendo el corazón a mil.'],
      good: ['Vaya... no esperaba que fueses tan direct{o}. Aunque no me disgusta.', 'Jeje... sigue, sigue, no pares.'],
      meh: ['Eh... ¿eso era un coqueteo? Hay que practicarlo.', 'Me estás tomando el pelo, ¿verdad?'],
      bad: ['Para. Me estás incomodando.', 'No es el momento ni el lugar, {p}.'],
      no: ['Lo siento, {p}. Mi corazón no va por ahí, pero me caes bien.', 'Eres muy maj{o}... pero solo te veo como amistad.'] },
    regalar: {
      love: ['¡Es justo lo que me gusta! ¿Cómo lo sabías? ¡Gracias, gracias, gracias!', 'No me lo puedo creer... Es perfecto. Lo guardaré siempre.'],
      like: ['Oh, gracias, es un detalle precioso.', 'Me encanta. Qué considerado.'],
      neutral: ['Gracias... supongo. Es un detalle.', 'Vaya, no hacía falta. Gracias.'],
      dislike: ['...¿Esto? Mejor no digo lo que pienso.', 'Eh... gracias, pero no es lo mío.'] },
    confesar: {
      yes: ['Yo... también siento lo mismo. Llevaba tiempo esperando que lo dijeras.', 'Sí... ¡sí! Mi corazón no ha dejado de latir así desde que te conocí.'],
      no: ['Lo siento, {p}. No quiero perder tu amistad, pero no siento eso por ti.', 'Necesito más tiempo... lo siento. No es un no del todo... pero tampoco un sí.'] },
    proponer: {
      yes: ['¡Sí! ¡Claro que quiero casarme contigo! Esto es lo mejor que me ha pasado en la vida.', 'Sí... sí... ¡mil veces sí!'],
      no: ['Es muy pronto... necesito un poco más de tiempo. Lo siento.', 'Te quiero, pero aún no estoy list{x} para eso.'] },
    terminar: ['...Lo entiendo. Gracias por lo que vivimos.', 'Así que es el final. Cuídate mucho, {p}.'],
    retar: {
      win: ['Hah... hah... buen combate. Has ganado.', 'Reconozco tu fuerza. La próxima vez no seré tan bland{x}.'],
      lose: ['¡Ja! Aún te falta entrenar, {p}.', 'Una buena lección, ¿no? Vuelve cuando seas más fuerte.'] },
    ayuda: {
      give: ['Si de verdad quieres ayudarme... necesito esto.', 'Te lo agradecería muchísimo. Confío en ti.'],
      none: ['Ahora mismo no necesito nada, pero gracias por preguntar.', 'Ya hiciste bastante por mí. Descuida.'],
      done: ['¡Lo has conseguido! No sé cómo agradecértelo.', 'Sabía que podía contar contigo.'] },
    entrenar: {
      good: ['¡Vamos a darlo todo! Sígueme el ritmo.', 'Buen trabajo. Se nota que te lo tomas en serio.'],
      bad: ['Hoy no estoy para entrenar. Otro día.'] },
  };
  D.DATES = {
    paseo: { n: 'Pasear juntos', e: '🌸', cost: 0, steps: 6, d: 'Un paseo tranquilo por los alrededores.', great: 'Pasáis la tarde caminando y riendo; sus dedos rozan los tuyos más de una vez, y ninguno de los dos se aparta.', good: 'Camináis charlando de cosas sin importancia. Es agradable, y se nota que disfrutáis de la compañía.', meh: 'El paseo es correcto, aunque con silencios algo incómodos.', bad: 'El paseo es un desastre: pisadas, malentendidos y miradas al suelo.' },
    cena: { n: 'Cenar a la luz de las linternas', e: '🍜', cost: 40, steps: 8, d: 'Una cena íntima (40 ryo).', great: 'La cena se alarga hasta que las linternas se apagan. Os miráis más de lo que coméis, y os reís sin motivo.', good: 'La cena transcurre entre risas y confidencias. Os vais más cerca de lo que llegasteis.', meh: 'La cena es buena, pero se nota que a alguien le pesa la cabeza.', bad: 'La conversación se estanca y la cena sabe a ceniza.' },
    entrenar: { n: 'Entrenar juntos', e: '🥋', cost: 0, steps: 6, d: 'Un rato de combate amistoso (+XP).', great: 'Entrenáis hasta caer rendidos. Terminas riéndote en el suelo, con la respiración mezclada con la suya.', good: 'Practicáis golpes y paradas, entre sonrisas competitivas.', meh: 'Entrenáis, pero sin demasiada chispa.', bad: 'El entrenamiento acaba en discusión sobre quién tiene más razón.' },
    estrellas: { n: 'Mirar las estrellas', e: '🌌', cost: 0, steps: 6, d: 'Solo de noche. Íntimo y tranquilo.', night: 1, great: 'Os tumbáis en la hierba. Apoya la cabeza en tu hombro; el silencio dice más que mil palabras.', good: 'Contempláis las estrellas hablando bajito. Es mágico.', meh: 'Hace frío y las nubes tapan el cielo.', bad: 'Entre el frío y los mosquitos, la noche se estropea.' },
  };
  D.NIGHT_LINES = [
    'Os quedáis hablando hasta tarde. Una cosa lleva a la otra, las voces se vuelven susurros y la luz de la vela se apaga... (la escena se funde a negro).',
    'La noche se alarga entre caricias, besos y risas bajas. Al amanecer, os despertáis abrazados, con una sonrisa tonta.',
    'Entre besos y confidencias, el tiempo se detiene. Cuando vuelve a correr, ya es de madrugada. (fundido a negro)',
  ];
  D.DREAMS = [
    'Quiero convertirme en la mejor persona de mi oficio de todo el reino.', 'Sueño con ver el mar al amanecer, aunque nunca he salido de aquí.',
    'Algún día quiero ser tan fuerte que nadie pueda hacerle daño a los míos.', 'Quiero formar una familia grande y ruidosa, con niños corriendo por toda la casa.',
    'Sueño con escribir un libro con todas las historias que he oído.', 'Me gustaría aprender un poder de verdad, de esos que hacen temblar el suelo.',
    'Quiero encontrar a alguien con quien envejecer sin prisas.', 'Sueño con descubrir qué hay más allá de las montañas del este.',
    'Quiero reparar el nombre de mi familia, que cayó en desgracia hace años.', 'Querría una casita junto a un río, con un huerto y un gato.',
    'Quiero ganar el torneo de la capital algún año.', 'Quiero abrir mi propio negocio y que mi nombre se conozca en todas partes.',
  ];
  D.FEARS = [
    'Me aterra quedarme sol{x} y que nadie me recuerde.', 'Le tengo miedo a las tormentas desde niñ{x}... pero no se lo cuentes a nadie.',
    'Temo no ser suficientemente fuerte cuando más me necesiten.', 'Me da pánico el fuego. Perdí a alguien en un incendio.',
    'Tengo miedo de que, si me abro del todo, la gente se aleje.', 'Le temo a las sombras... a las de verdad, las que se mueven.',
    'Me asusta fallar a quienes confían en mí.', 'Temo que mi poder se descontrole algún día.',
  ];
  D.SECRETS = [
    'En realidad no soy de aquí. Huí de una vida que no quería y cambié de nombre.', 'Estoy enamorad{x} de alguien que no puede saberlo.',
    'Guardo algo que brilla cuando hay peligro. Creo que es un fragmento del Sello Ancestral.', 'Fui de la Orden de la Sombra, hace años. Me arrepiento cada día.',
    'Soy más fuerte de lo que aparento. Escondo mi poder porque me da miedo usarlo.', 'Tengo un hijo que no sabe quién soy.',
    'Sé dónde hay una cueva con un tesoro, pero me da miedo ir sol{x}.', 'Cada noche escucho una voz que me llama desde el monte.',
  ];
  D.CHILD_NAMES_M = ['Hikaru', 'Yuu', 'Kai', 'Mamoru', 'Shouta', 'Aki', 'Riku', 'Tsubasa', 'Daiki', 'Haru'];
  D.CHILD_NAMES_F = ['Himari', 'Sora', 'Mika', 'Hotaru', 'Nanami', 'Yui', 'Suzu', 'Aya', 'Koharu', 'Hikari'];
  D.CHILD_TRAITS = ['curios{x}', 'valiente', 'imaginativ{x}', 'travies{x}', 'tranquil{x}', 'cabezota', 'cariños{x}', 'listísim{x}'];
})((window.G = window.G || {}));
