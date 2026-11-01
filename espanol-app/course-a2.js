// A2 (≈ DELE A2) — hand-written content. Castilian Spanish (Spain).
const A2_UNITS = [
  { title: "What Have You Done?", icon: "✅", lessons: [
    grammarLesson("a2-perfecto", "Today I have…", "pretérito perfecto: he hablado",
      "In Spain, the perfect tense is used for things that happened today, this week, this year, or ever: haber (he, has, ha, hemos, habéis, han) + participle. Participles: -ar → -ado (hablado), -er / -ir → -ido (comido, vivido). Hoy he comido paella = I had paella today.",
      [
        ["Hoy he trabajado mucho.", "I've worked a lot today."],
        ["¿Has estado en Sevilla?", "Have you ever been to Seville?"],
        ["Esta semana hemos ido al cine.", "This week we've been to the cinema."],
      ],
      [
        { fill: "Hoy ＿ comido en casa.", options: ["he", "has", "ha", "hemos"], answer: "he", en: "Today I had lunch at home." },
        { fill: "¿＿ estado en Barcelona? (tú)", options: ["Has", "He", "Ha", "Habéis"], answer: "Has", en: "Have you been to Barcelona?" },
        { fill: "Esta mañana hemos ＿ mucho. (trabajar)", options: ["trabajado", "trabajando", "trabajamos", "trabajido"], answer: "trabajado", en: "This morning we've worked a lot." },
        { fill: "¿Vosotros ＿ terminado?", options: ["habéis", "han", "hemos", "has"], answer: "habéis", en: "Have you guys finished?" },
        { order: ["Hoy", "he", "comido", "paella"], en: "I had paella today." },
      ]),
    grammarLesson("a2-participios", "Irregular participles", "hecho, visto, dicho, escrito…",
      "Some common verbs have irregular participles: hacer → hecho, ver → visto, decir → dicho, escribir → escrito, volver → vuelto, poner → puesto, abrir → abierto, romper → roto.",
      [
        ["¿Qué has hecho hoy?", "What have you done today?"],
        ["Nunca he visto el mar.", "I've never seen the sea."],
        ["Ya han vuelto de vacaciones.", "They've already come back from holiday."],
      ],
      [
        { fill: "¿Qué has ＿ este fin de semana? (hacer)", options: ["hecho", "hacido", "hizo", "haciendo"], answer: "hecho", en: "What have you done this weekend?" },
        { fill: "No he ＿ esa película. (ver)", options: ["visto", "veído", "vido", "vista"], answer: "visto", en: "I haven't seen that film." },
        { fill: "¿Quién ha ＿ eso? (decir)", options: ["dicho", "decido", "dijo", "decidido"], answer: "dicho", en: "Who has said that?" },
        { fill: "Hemos ＿ la ventana. (abrir)", options: ["abierto", "abrido", "abrió", "abierta"], answer: "abierto", en: "We've opened the window." },
      ]),
    vocabLesson("a2-time-markers", "Time words", [
      ["hoy", "today"], ["esta mañana", "this morning"], ["esta semana", "this week"], ["ya", "already"],
      ["todavía no", "not yet"], ["alguna vez", "ever"], ["nunca", "never"], ["ayer", "yesterday"],
    ]),
  ]},

  { title: "Yesterday & Last Year", icon: "📸", lessons: [
    grammarLesson("a2-indefinido", "The simple past", "pretérito indefinido: hablé, comí",
      "For finished times (ayer, el lunes pasado, en 2019) Spain uses the simple past. -ar: -é, -aste, -ó, -amos, -asteis, -aron (hablé, hablaste, habló…). -er / -ir: -í, -iste, -ió, -imos, -isteis, -ieron (comí, comiste, comió…). Watch the accents: hablo (I speak) vs habló (he spoke).",
      [
        ["Ayer hablé con mi madre.", "Yesterday I spoke with my mother."],
        ["El verano pasado viajamos a Galicia.", "Last summer we travelled to Galicia."],
        ["¿Qué comisteis anoche?", "What did you guys eat last night?"],
      ],
      [
        { fill: "Ayer ＿ con Ana. (hablar, yo)", options: ["hablé", "hablo", "habló", "he hablado"], answer: "hablé", en: "Yesterday I spoke with Ana." },
        { fill: "Él ＿ a las diez. (llegar)", options: ["llegó", "llego", "llegué", "llegaste"], answer: "llegó", en: "He arrived at ten." },
        { fill: "Anoche ＿ pizza. (comer, nosotros)", options: ["comimos", "comemos", "comieron", "comí"], answer: "comimos", en: "Last night we ate pizza." },
        { fill: "¿Dónde ＿ el año pasado? (vivir, vosotros)", options: ["vivisteis", "vivís", "vivieron", "vivimos"], answer: "vivisteis", en: "Where did you guys live last year?" },
        { order: ["El", "verano", "pasado", "viajamos", "a", "Galicia"], en: "Last summer we travelled to Galicia." },
      ]),
    grammarLesson("a2-indef-irr", "Irregular simple past", "fui, tuve, hice, estuve…",
      "Very common irregulars: ser / ir → fui, fuiste, fue, fuimos, fuisteis, fueron (same forms!). tener → tuve, hacer → hice (él hizo), estar → estuve, poder → pude, venir → vine, decir → dije (ellos dijeron). These irregular forms have no accents.",
      [
        ["Fui a Granada en mayo.", "I went to Granada in May."],
        ["¿Qué hiciste el sábado?", "What did you do on Saturday?"],
        ["Tuvimos un problema con el coche.", "We had a problem with the car."],
      ],
      [
        { fill: "El lunes ＿ al médico. (ir, yo)", options: ["fui", "fue", "iba", "voy"], answer: "fui", en: "On Monday I went to the doctor." },
        { fill: "¿Qué ＿ ayer? (hacer, tú)", options: ["hiciste", "haciste", "hizo", "hacías"], answer: "hiciste", en: "What did you do yesterday?" },
        { fill: "Ella ＿ la cena. (hacer)", options: ["hizo", "hició", "hace", "hice"], answer: "hizo", en: "She made dinner." },
        { fill: "Ayer no ＿ venir. (poder, yo)", options: ["pude", "podí", "podé", "puedo"], answer: "pude", en: "Yesterday I couldn't come." },
        { order: ["¿Qué", "hiciste", "el", "sábado?"], en: "What did you do on Saturday?" },
      ]),
    readingLesson("a2-r-granada", "Reading: a trip to Granada",
      "El{the} mes{month} pasado{last} fui{I_went} a{to} Granada{Granada} con{with} mi{my} hermana.{sister} Visitamos{we_visited} la{the} Alhambra{Alhambra} por{in} la{the} mañana{morning} y{and} por{in} la{the} tarde{afternoon} comimos{we_ate} tapas{tapas} en{in} el{the} Albaicín.{Albaicín_(old_quarter)} Las{the} tapas{tapas} eran{were} gratis{free} con{with} la{the} bebida.{drink} ¡Fue{it_was} un{a} viaje{trip} precioso!{lovely}",
      "Last month I went to Granada with my sister. We visited the Alhambra in the morning, and in the afternoon we ate tapas in the Albaicín. The tapas were free with the drink. It was a lovely trip!",
      [
        ["Who did the writer travel with?", ["Their sister", "Their parents", "A friend", "Nobody"], "Their sister"],
        ["What did they visit in the morning?", ["The Alhambra", "The beach", "A museum in Madrid", "A football stadium"], "The Alhambra"],
        ["What was special about the tapas?", ["They were free with the drink", "They were very expensive", "They were vegetarian", "They came from Madrid"], "They were free with the drink"],
      ]),
  ]},

  { title: "When I Was Little", icon: "🧸", lessons: [
    grammarLesson("a2-imperfecto", "Used to / was -ing", "imperfecto: hablaba, comía",
      "The imperfect describes the past: habits, background, how things were. -ar: -aba, -abas, -aba, -ábamos, -abais, -aban. -er / -ir: -ía, -ías, -ía, -íamos, -íais, -ían. Only three irregulars: ser (era), ir (iba), ver (veía).",
      [
        ["De pequeño, vivía en un pueblo.", "As a child, I lived in a village."],
        ["Mi abuela siempre cocinaba los domingos.", "My grandmother always cooked on Sundays."],
        ["Era una casa muy bonita.", "It was a very pretty house."],
      ],
      [
        { fill: "De niño, ＿ al fútbol. (jugar, yo)", options: ["jugaba", "jugué", "juego", "jugaré"], answer: "jugaba", en: "As a child, I used to play football." },
        { fill: "La casa ＿ grande. (ser)", options: ["era", "fue", "es", "estaba"], answer: "era", en: "The house was big." },
        { fill: "Siempre ＿ a la playa en verano. (ir, nosotros)", options: ["íbamos", "fuimos", "vamos", "iremos"], answer: "íbamos", en: "We always used to go to the beach in summer." },
        { fill: "¿Qué ＿ de pequeños? (hacer, vosotros)", options: ["hacíais", "hicisteis", "hacéis", "hacían"], answer: "hacíais", en: "What did you guys use to do as kids?" },
      ]),
    grammarLesson("a2-imp-vs-indef", "Which past?", "imperfecto vs indefinido",
      "Indefinido = a finished action (Llegué a las ocho). Imperfecto = the background or a habit (Llovía, Siempre llegaba tarde). Together: Cuando llegué, llovía = When I arrived, it was raining.",
      [
        ["Cuando llegué a casa, mi hermano dormía.", "When I got home, my brother was sleeping."],
        ["Leía un libro cuando sonó el móvil.", "I was reading a book when the phone rang."],
      ],
      [
        { fill: "Cuando ＿ a casa, llovía. (llegar, yo)", options: ["llegué", "llegaba", "llego", "he llegado"], answer: "llegué", en: "When I got home, it was raining." },
        { fill: "Leía cuando ＿ el teléfono. (sonar)", options: ["sonó", "sonaba", "suena", "sonará"], answer: "sonó", en: "I was reading when the phone rang." },
        { fill: "Antes ＿ en Valencia. (vivir, yo)", options: ["vivía", "viví", "vivo", "viviré"], answer: "vivía", en: "I used to live in Valencia." },
        { order: ["Cuando", "llegué,", "mi", "hermano", "dormía"], en: "When I arrived, my brother was sleeping." },
      ]),
  ]},

  { title: "My Daily Routine", icon: "🚿", lessons: [
    vocabLesson("a2-routine", "Routine verbs", [
      ["levantarse", "to get up"], ["ducharse", "to shower"], ["vestirse", "to get dressed"], ["acostarse", "to go to bed"],
      ["despertarse", "to wake up"], ["lavarse los dientes", "to brush your teeth"], ["desayunar", "to have breakfast"], ["irse", "to leave"],
    ]),
    grammarLesson("a2-reflexive", "Reflexive verbs", "me levanto, te duchas, se acuesta…",
      "Reflexive verbs use a pronoun that matches the subject: me, te, se, nos, os, se. Levantarse → me levanto, te levantas, se levanta, nos levantamos, os levantáis, se levantan. Some change their stem: acostarse → me acuesto, despertarse → me despierto.",
      [
        ["Me levanto a las siete.", "I get up at seven."],
        ["¿A qué hora os acostáis?", "What time do you guys go to bed?"],
        ["Mi hermano se ducha por la noche.", "My brother showers at night."],
      ],
      [
        { fill: "＿ levanto a las ocho.", options: ["Me", "Te", "Se", "Nos"], answer: "Me", en: "I get up at eight." },
        { fill: "¿A qué hora te ＿? (acostarse)", options: ["acuestas", "acostas", "acuesta", "acostáis"], answer: "acuestas", en: "What time do you go to bed?" },
        { fill: "Nosotros ＿ duchamos por la mañana.", options: ["nos", "os", "se", "me"], answer: "nos", en: "We shower in the morning." },
        { fill: "¿Vosotros ＿ despertáis temprano?", options: ["os", "se", "nos", "te"], answer: "os", en: "Do you guys wake up early?" },
        { order: ["Me", "levanto", "a", "las", "siete"], en: "I get up at seven." },
      ]),
  ]},

  { title: "Shopping & Comparing", icon: "🛍️", lessons: [
    vocabLesson("a2-clothes", "Clothes", [
      ["la camiseta", "T-shirt"], ["los vaqueros", "jeans"], ["la chaqueta", "jacket"], ["los zapatos", "shoes"],
      ["el jersey", "sweater"], ["la talla", "size"], ["el probador", "fitting room"], ["las rebajas", "the sales"],
    ]),
    grammarLesson("a2-compare", "Bigger, better", "más… que · tan… como · mejor",
      "más + adjective + que = more … than; menos … que = less … than; tan … como = as … as. Irregulars: bueno → mejor, malo → peor. Esta chaqueta es más barata que esa = This jacket is cheaper than that one.",
      [
        ["Madrid es más grande que Sevilla.", "Madrid is bigger than Seville."],
        ["Este jersey es tan bonito como ese.", "This sweater is as nice as that one."],
        ["Esta tienda es mejor.", "This shop is better."],
      ],
      [
        { fill: "El tren es más rápido ＿ el autobús.", options: ["que", "como", "de", "tan"], answer: "que", en: "The train is faster than the bus." },
        { fill: "Este es ＿ caro como ese.", options: ["tan", "más", "tanto", "muy"], answer: "tan", en: "This one is as expensive as that one." },
        { fill: "Esta tienda es ＿ que la otra. (better)", options: ["mejor", "más buena", "buenísima", "peor"], answer: "mejor", en: "This shop is better than the other one." },
        { order: ["¿Tiene", "una", "talla", "más", "grande?"], en: "Do you have a bigger size?" },
      ]),
    grammarLesson("a2-pronouns", "It and them", "lo, la, los, las",
      "Direct object pronouns replace a thing or person: lo (it / him), la (it / her), los, las (them). They go before the verb: ¿La chaqueta? La compro = The jacket? I'll buy it. With infinitives they can attach: Voy a comprarla.",
      [
        ["¿Te gusta este jersey? Sí, me lo llevo.", "Do you like this sweater? Yes, I'll take it."],
        ["¿Tienes las llaves? No, no las tengo.", "Do you have the keys? No, I don't have them."],
        ["Voy a comprarlos.", "I'm going to buy them."],
      ],
      [
        { fill: "¿El libro? ＿ tengo yo.", options: ["Lo", "La", "Los", "Le"], answer: "Lo", en: "The book? I've got it." },
        { fill: "¿Las entradas? No ＿ he comprado.", options: ["las", "los", "la", "les"], answer: "las", en: "The tickets? I haven't bought them." },
        { fill: "Esta camiseta... voy a ＿.", options: ["comprarla", "comprarlo", "la comprar", "comprarle"], answer: "comprarla", en: "This T-shirt… I'm going to buy it." },
        { order: ["Sí,", "me", "lo", "llevo"], en: "Yes, I'll take it." },
      ]),
  ]},

  { title: "Instructions & Advice", icon: "🧭", lessons: [
    grammarLesson("a2-imperative", "Do it!", "imperativo: habla, comed, ven",
      "Commands for tú: use the él form of the present (habla, come, escribe). For vosotros: change the final -r of the infinitive to -d (hablad, comed, escribid). Irregular tú commands: ven, haz, pon, di, sal, ten, ve, sé.",
      [
        ["Gira a la derecha y sigue recto.", "Turn right and go straight on."],
        ["¡Ven aquí!", "Come here!"],
        ["Chicos, abrid los libros.", "Guys, open your books."],
      ],
      [
        { fill: "＿ a la izquierda. (girar, tú)", options: ["Gira", "Giras", "Girad", "Giro"], answer: "Gira", en: "Turn left." },
        { fill: "¡＿ aquí ahora mismo! (venir, tú)", options: ["Ven", "Viene", "Venid", "Vienes"], answer: "Ven", en: "Come here right now!" },
        { fill: "Niños, ＿ la cena. (comer, vosotros)", options: ["comed", "comen", "comid", "come"], answer: "comed", en: "Kids, eat your dinner." },
        { fill: "＿ los deberes. (hacer, tú)", options: ["Haz", "Hace", "Haced", "Hazlo"], answer: "Haz", en: "Do your homework." },
      ]),
    vocabLesson("a2-directions", "Directions", [
      ["a la derecha", "to the right"], ["a la izquierda", "to the left"], ["todo recto", "straight on"], ["la esquina", "the corner"],
      ["el semáforo", "traffic light"], ["cerca de", "near"], ["lejos de", "far from"], ["enfrente de", "opposite"],
    ]),
    vocabLesson("a2-health", "At the doctor's", [
      ["me duele la cabeza", "I have a headache"], ["la fiebre", "fever"], ["el resfriado", "a cold"], ["la receta", "prescription"],
      ["las pastillas", "pills"], ["el centro de salud", "health centre"], ["tos", "cough"], ["estar mareado", "to feel dizzy"],
    ]),
  ]},

  { title: "The Future", icon: "🔮", lessons: [
    grammarLesson("a2-futuro", "I will…", "futuro: hablaré, comeré",
      "Add the endings to the whole infinitive: -é, -ás, -á, -emos, -éis, -án (hablaré, comerás, vivirá). Irregular stems: tener → tendré, hacer → haré, poder → podré, salir → saldré, venir → vendré, decir → diré, querer → querré.",
      [
        ["Mañana lloverá en el norte.", "Tomorrow it will rain in the north."],
        ["El año que viene viviré en Madrid.", "Next year I'll live in Madrid."],
        ["¿Vendréis a la fiesta?", "Will you guys come to the party?"],
      ],
      [
        { fill: "Mañana ＿ a mis abuelos. (visitar, yo)", options: ["visitaré", "visito", "visité", "visitaba"], answer: "visitaré", en: "Tomorrow I'll visit my grandparents." },
        { fill: "El sábado ＿ una fiesta. (hacer, nosotros)", options: ["haremos", "hacermos", "hacemos", "hicimos"], answer: "haremos", en: "On Saturday we'll have a party." },
        { fill: "¿＿ tiempo mañana? (tener, tú)", options: ["Tendrás", "Tenerás", "Tienes", "Tuviste"], answer: "Tendrás", en: "Will you have time tomorrow?" },
        { order: ["El", "año", "que", "viene", "viviré", "en", "Madrid"], en: "Next year I'll live in Madrid." },
      ]),
    readingLesson("a2-r-piso", "Reading: looking for a flat",
      "Me{myself} llamo{I'm_called} Sara{Sara} y{and} el{the} mes{month} que{that} viene{comes} me{myself} mudaré{I'll_move} a{to} Madrid.{Madrid} Busco{I'm_looking_for} un{a} piso{flat} compartido{shared} cerca{near} del{of_the} metro.{metro} No{not} quiero{I_want} pagar{to_pay} más{more} de{than} 500{500} euros{euros} al{per} mes.{month} Ayer{yesterday} vi{I_saw} uno{one} en{in} Lavapiés,{Lavapiés} pero{but} era{it_was} muy{very} pequeño{small} y{and} no{didn't} tenía{have} ventanas.{windows}",
      "My name is Sara and next month I'll move to Madrid. I'm looking for a shared flat near the metro. I don't want to pay more than 500 euros a month. Yesterday I saw one in Lavapiés, but it was very small and had no windows.",
      [
        ["Where is Sara moving?", ["Madrid", "Seville", "Barcelona", "Valencia"], "Madrid"],
        ["What's her maximum budget?", ["500 euros a month", "300 euros a month", "800 euros a month", "500 euros a week"], "500 euros a month"],
        ["What was wrong with the flat in Lavapiés?", ["It was small and had no windows", "It was too expensive", "It was far from the metro", "It had no kitchen"], "It was small and had no windows"],
      ]),
  ]},
];
