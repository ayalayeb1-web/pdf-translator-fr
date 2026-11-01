// Speaking gym content (Castilian Spanish). Phrase: [spanish, "", english]
const P = (es, en) => [es, "", en];
const PHRASE_PACKS = [
  { id: "bar", icon: "🍤", title: "Bar & tapas", level: "A1", phrases: [
    P("¿Me pone una caña, por favor?", "Could I have a small beer, please?"),
    P("¿Qué tapas tenéis?", "What tapas do you have?"),
    P("Una ración de croquetas, por favor.", "A portion of croquettes, please."),
    P("¿Qué me recomiendas?", "What do you recommend?"),
    P("Para mí, un café solo.", "For me, an espresso."),
    P("¿Puedo pagar con tarjeta?", "Can I pay by card?"),
    P("La cuenta, por favor.", "The bill, please."),
    P("¡Estaba todo buenísimo!", "Everything was delicious!"),
  ]},
  { id: "travel", icon: "🚆", title: "Getting around", level: "A1", phrases: [
    P("Perdone, ¿dónde está la estación?", "Excuse me, where is the station?"),
    P("Un billete de ida y vuelta a Sevilla.", "A return ticket to Seville."),
    P("¿De qué vía sale el tren?", "Which platform does the train leave from?"),
    P("¿Esta línea va a Sol?", "Does this line go to Sol?"),
    P("¿Cuánto se tarda andando?", "How long does it take on foot?"),
    P("Me he perdido.", "I'm lost."),
    P("¿Me lo puede marcar en el mapa?", "Could you mark it on the map for me?"),
    P("Me bajo en la próxima.", "I'm getting off at the next one."),
  ]},
  { id: "shop", icon: "🛍️", title: "Shopping", level: "A1", phrases: [
    P("¿Cuánto cuesta esto?", "How much is this?"),
    P("Solo estoy mirando, gracias.", "I'm just looking, thanks."),
    P("¿Me lo puedo probar?", "Can I try it on?"),
    P("¿Tiene una talla más grande?", "Do you have a bigger size?"),
    P("¿Dónde están los probadores?", "Where are the fitting rooms?"),
    P("No necesito bolsa, gracias.", "I don't need a bag, thanks."),
    P("Me lo llevo.", "I'll take it."),
  ]},
  { id: "talk", icon: "💬", title: "Small talk", level: "A2", phrases: [
    P("¿Qué tal todo?", "How's everything?"),
    P("¿A qué te dedicas?", "What do you do for a living?"),
    P("Estoy aprendiendo español.", "I'm learning Spanish."),
    P("¿Puedes repetirlo, por favor?", "Can you repeat that, please?"),
    P("¿Puedes hablar más despacio?", "Can you speak more slowly?"),
    P("¿Qué significa esto?", "What does this mean?"),
    P("¿Qué hicisteis el fin de semana?", "What did you guys do at the weekend?"),
    P("¡Venga, nos vemos!", "Right, see you!"),
  ]},
  { id: "help", icon: "🆘", title: "Emergencies", level: "A2", phrases: [
    P("¡Socorro! ¡Ayuda!", "Help!"),
    P("Me encuentro mal.", "I feel unwell."),
    P("Llame a una ambulancia, por favor.", "Please call an ambulance."),
    P("Me han robado la cartera.", "My wallet has been stolen."),
    P("¿Dónde está la comisaría?", "Where is the police station?"),
    P("¿Hay alguien que hable inglés?", "Is there anyone who speaks English?"),
    P("Soy alérgico a los frutos secos.", "I'm allergic to nuts."),
  ]},
  { id: "work", icon: "💼", title: "Polite & work", level: "B1", phrases: [
    P("Encantado de conocerle.", "Pleased to meet you. (formal)"),
    P("¿En qué puedo ayudarle?", "How can I help you? (formal)"),
    P("Ahora mismo lo compruebo.", "I'll check it right now."),
    P("Le escribo para pedir información.", "I'm writing to ask for information."),
    P("Disculpe las molestias.", "Sorry for the inconvenience."),
    P("Quedo a la espera de su respuesta.", "I look forward to your reply."),
    P("¿Le viene bien el martes?", "Does Tuesday suit you?"),
  ]},
  { id: "spain", icon: "💃", title: "Spain expressions", level: "A2", phrases: [
    P("¡Qué pasada!", "How amazing!"),
    P("¡No me digas!", "No way!"),
    P("¡Venga, vamos!", "Come on, let's go!"),
    P("Me da igual.", "I don't mind."),
    P("¡Ojalá!", "I hope so!"),
    P("Estoy flipando.", "I'm blown away."),
    P("¿Quedamos mañana?", "Shall we meet up tomorrow?"),
  ]},
];

// Ear training: pairs that differ by one sound. [a, sound hint a, meaning a, b, sound hint b, meaning b, the point]
const MINIMAL_PAIRS = [
  ["pero", "PE-ro", "but", "perro", "PE-rro", "dog", "single r (a tap) vs rr (a roll)"],
  ["caro", "CA-ro", "expensive", "carro", "CA-rro", "cart", "single r (a tap) vs rr (a roll)"],
  ["coro", "CO-ro", "choir", "corro", "CO-rro", "I run", "single r (a tap) vs rr (a roll)"],
  ["casa", "CA-sa", "house", "caza", "CA-tha", "hunting", "s vs z (a \"th\" sound in Spain)"],
  ["coser", "co-SER", "to sew", "cocer", "co-THER", "to boil", "s vs c (a \"th\" sound in Spain)"],
  ["siento", "SIEN-to", "I feel", "ciento", "THIEN-to", "hundred", "s vs c (a \"th\" sound in Spain)"],
  ["papa", "PA-pa", "potato", "papá", "pa-PÁ", "dad", "stress: the accent moves the beat"],
  ["hablo", "HA-blo", "I speak", "habló", "ha-BLÓ", "he spoke", "stress: present vs past"],
  ["termino", "ter-MI-no", "I finish", "terminó", "ter-mi-NÓ", "he finished", "stress: present vs past"],
  ["esta", "ES-ta", "this", "está", "es-TÁ", "is", "stress: the accent moves the beat"],
  ["cana", "CA-na", "grey hair", "caña", "CA-ña", "small beer", "n vs ñ (\"ny\")"],
  ["pena", "PE-na", "sorrow", "peña", "PE-ña", "group of friends", "n vs ñ (\"ny\")"],
];

// Offline missions (used when AI isn't available). [task, example answer, "", english]
const STATIC_MISSIONS = [
  ["Introduce yourself in 3 sentences: name, where you're from, one hobby.", "Hola, me llamo Alex. Soy de Inglaterra. Me encanta viajar y bailar.", "", "Hi, my name is Alex. I'm from England. I love travelling and dancing."],
  ["Describe what you ate today.", "Hoy he desayunado una tostada con tomate. A mediodía he comido paella. ¡Estaba buenísima!", "", "Today I had toast with tomato for breakfast. At lunch I had paella. It was delicious!"],
  ["Order breakfast in a Spanish bar.", "¿Me pone un café con leche y una tostada con tomate, por favor?", "", "Could I have a coffee with milk and toast with tomato, please?"],
  ["Say what you'll do this weekend.", "Este fin de semana voy a quedar con mis amigos y vamos a ir al cine.", "", "This weekend I'm going to meet my friends and we're going to the cinema."],
  ["Ask someone how to get to the station.", "Perdone, ¿cómo se va a la estación de Atocha?", "", "Excuse me, how do you get to Atocha station?"],
  ["Describe your home in 2-3 sentences.", "Vivo en un piso pequeño en el centro. Tiene dos habitaciones y una terraza. Me gusta mucho.", "", "I live in a small flat in the centre. It has two bedrooms and a terrace. I really like it."],
  ["Say why you're learning Spanish.", "Estoy aprendiendo español porque quiero vivir en España y me encanta la cultura.", "", "I'm learning Spanish because I want to live in Spain and I love the culture."],
];
