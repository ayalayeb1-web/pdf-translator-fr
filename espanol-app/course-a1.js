// A1 (≈ DELE A1) — hand-written content. Castilian Spanish (Spain): vosotros, Spain vocabulary.
const A1_UNITS = [
  { title: "¡Hola!", icon: "👋", lessons: [
    vocabLesson("a1-greet", "Greetings", [
      ["hola", "hello"], ["buenos días", "good morning"], ["buenas tardes", "good afternoon"], ["buenas noches", "good evening / good night"],
      ["adiós", "goodbye"], ["hasta luego", "see you later"], ["gracias", "thank you"], ["por favor", "please"], ["perdón", "sorry / excuse me"],
    ]),
    grammarLesson("a1-ser", "I am…", "ser: soy, eres, es",
      "Ser means \"to be\" for identity: who you are, where you're from, your job. yo soy (I am), tú eres (you are, informal), él / ella / usted es (he / she is, you are formal). Spanish often drops the pronoun: \"Soy Ana\" is enough. In Spain tú is used a lot, even with strangers your age.",
      [
        ["Soy Ana.", "I'm Ana."],
        ["¿Eres estudiante?", "Are you a student?"],
        ["Ella es de Valencia.", "She's from Valencia."],
      ],
      [
        { fill: "Yo ＿ Carlos.", options: ["soy", "eres", "es", "son"], answer: "soy", en: "I'm Carlos." },
        { fill: "¿Tú ＿ de España?", options: ["eres", "soy", "es", "somos"], answer: "eres", en: "Are you from Spain?" },
        { fill: "Él ＿ profesor.", options: ["es", "eres", "soy", "estás"], answer: "es", en: "He's a teacher." },
        { order: ["Yo", "soy", "de", "Francia"], en: "I'm from France." },
        { order: ["¿Eres", "estudiante?"], en: "Are you a student?" },
      ]),
    grammarLesson("a1-ser2", "We are, they are", "ser: somos, sois, son",
      "Plural forms: nosotros somos (we are), vosotros sois (you all are, informal: in Spain this is the normal way to talk to friends), ellos / ellas son (they are). Ustedes son is the formal \"you all\", used with customers or older people.",
      [
        ["Somos amigos.", "We're friends."],
        ["Ellos son de Valencia.", "They're from Valencia."],
        ["¿Vosotros sois hermanos?", "Are you (guys) siblings?"],
      ],
      [
        { fill: "Nosotros ＿ estudiantes.", options: ["somos", "son", "es", "soy"], answer: "somos", en: "We're students." },
        { fill: "María y Pedro ＿ de Bilbao.", options: ["son", "somos", "es", "eres"], answer: "son", en: "María and Pedro are from Bilbao." },
        { fill: "¿Vosotros ＿ de Madrid?", options: ["sois", "son", "es", "somos"], answer: "sois", en: "Are you (guys) from Madrid?" },
        { order: ["Somos", "amigos", "de", "Ana"], en: "We're Ana's friends." },
      ]),
    vocabLesson("a1-people", "People & countries", [
      ["el amigo", "friend (male)"], ["la amiga", "friend (female)"], ["el profesor", "teacher (male)"], ["la estudiante", "student (female)"],
      ["España", "Spain"], ["Madrid", "Madrid"], ["inglés", "English"], ["francés", "French"],
    ]),
    readingLesson("a1-r-intro", "Reading: Lucía introduces herself",
      "¡Hola!{hello!} Me{myself} llamo{I_call} Lucía.{Lucía} Soy{I_am} de{from} Sevilla,{Seville} en{in} España.{Spain} Soy{I_am} estudiante{student} de{of} inglés.{English} Mi{my} amigo{friend} Tom{Tom} es{is} de{from} Londres.{London} ¡Mucho{much} gusto!{pleasure_(nice_to_meet_you)}",
      "Hi! My name is Lucía. I'm from Seville, in Spain. I'm an English student. My friend Tom is from London. Nice to meet you!",
      [
        ["Where is Lucía from?", ["Seville", "Madrid", "London", "Barcelona"], "Seville"],
        ["What does she study?", ["English", "French", "Spanish", "Math"], "English"],
        ["Where is Tom from?", ["London", "Seville", "Paris", "Chile"], "London"],
      ]),
  ]},

  { title: "Numbers & Time", icon: "🕐", lessons: [
    vocabLesson("a1-num", "Numbers 1–10", [
      ["uno", "one"], ["dos", "two"], ["tres", "three"], ["cuatro", "four"], ["cinco", "five"],
      ["seis", "six"], ["siete", "seven"], ["ocho", "eight"], ["nueve", "nine"], ["diez", "ten"],
    ]),
    vocabLesson("a1-num2", "Numbers 11–20", [
      ["once", "eleven"], ["doce", "twelve"], ["trece", "thirteen"], ["catorce", "fourteen"], ["quince", "fifteen"],
      ["dieciséis", "sixteen"], ["diecisiete", "seventeen"], ["dieciocho", "eighteen"], ["diecinueve", "nineteen"], ["veinte", "twenty"],
    ]),
    grammarLesson("a1-hora", "What time is it?", "¿Qué hora es?",
      "Use es la una for 1 o'clock (singular) and son las + number for the rest: son las tres. Add y media (half past), y cuarto (quarter past) or menos cuarto (quarter to). \"At\" a time is a la / a las: a las ocho.",
      [
        ["¿Qué hora es?", "What time is it?"],
        ["Es la una y media.", "It's half past one."],
        ["Son las cuatro menos cuarto.", "It's a quarter to four."],
        ["La clase es a las nueve.", "The class is at nine."],
      ],
      [
        { fill: "＿ la una.", options: ["Es", "Son", "Está", "Hay"], answer: "Es", en: "It's one o'clock." },
        { fill: "Son ＿ cinco.", options: ["las", "la", "los", "el"], answer: "las", en: "It's five o'clock." },
        { fill: "Son las dos y ＿.", options: ["media", "medio", "mitad", "cuarta"], answer: "media", en: "It's half past two." },
        { order: ["La", "clase", "es", "a", "las", "diez"], en: "The class is at ten." },
      ]),
    vocabLesson("a1-days", "Days of the week", [
      ["lunes", "Monday"], ["martes", "Tuesday"], ["miércoles", "Wednesday"], ["jueves", "Thursday"],
      ["viernes", "Friday"], ["sábado", "Saturday"], ["domingo", "Sunday"], ["hoy", "today"], ["mañana", "tomorrow"],
    ]),
  ]},

  { title: "Family & Things", icon: "👨‍👩‍👧", lessons: [
    vocabLesson("a1-family", "Family", [
      ["la madre", "mother"], ["el padre", "father"], ["los padres", "parents"], ["el hermano", "brother"], ["la hermana", "sister"],
      ["el hijo", "son"], ["la hija", "daughter"], ["los abuelos", "grandparents"],
    ]),
    grammarLesson("a1-articles", "The and a", "el / la / los / las · un / una",
      "Every noun is masculine or feminine. Most nouns ending in -o are masculine (el libro) and most ending in -a are feminine (la casa). \"The\": el, la, los, las. \"A / some\": un, una, unos, unas. Watch out for exceptions like el día and la mano.",
      [
        ["el libro, la casa", "the book, the house"],
        ["los libros, las casas", "the books, the houses"],
        ["Tengo un perro y una gata.", "I have a (male) dog and a (female) cat."],
      ],
      [
        { fill: "＿ casa es grande.", options: ["La", "El", "Los", "Un"], answer: "La", en: "The house is big." },
        { fill: "＿ libros son nuevos.", options: ["Los", "Las", "El", "La"], answer: "Los", en: "The books are new." },
        { fill: "Tengo ＿ perro.", options: ["un", "una", "el", "unos"], answer: "un", en: "I have a dog." },
        { fill: "Buenos días. ¿Qué tal ＿ día?", options: ["el", "la", "las", "una"], answer: "el", en: "Good morning. How's the day going?" },
      ]),
    grammarLesson("a1-poss", "My, your, his", "mi, tu, su",
      "Possessives go before the noun: mi (my), tu (your, informal), su (his / her / your formal / their). Add -s for plurals: mis hermanos (my siblings). Note tú (you) has an accent, but tu (your) doesn't.",
      [
        ["Mi madre es profesora.", "My mother is a teacher."],
        ["¿Cómo se llama tu hermano?", "What's your brother's name?"],
        ["Sus padres son de Galicia.", "His / her / their parents are from Galicia."],
      ],
      [
        { fill: "＿ padre es médico. (my)", options: ["Mi", "Tu", "Mis", "Su"], answer: "Mi", en: "My father is a doctor." },
        { fill: "¿Son ＿ hermanos? (your)", options: ["tus", "tu", "mis", "su"], answer: "tus", en: "Are they your siblings?" },
        { fill: "Ana y ＿ hermana. (her)", options: ["su", "sus", "mi", "tu"], answer: "su", en: "Ana and her sister." },
        { order: ["Mi", "madre", "es", "profesora"], en: "My mother is a teacher." },
      ]),
    vocabLesson("a1-things", "Everyday things", [
      ["el libro", "book"], ["la mesa", "table"], ["el móvil", "mobile phone"], ["el ordenador", "computer"], ["la llave", "key"], ["el coche", "car"],
      ["la ventana", "window"], ["el dinero", "money"],
    ]),
  ]},

  { title: "Café & Food", icon: "☕", lessons: [
    vocabLesson("a1-food", "Food & drink", [
      ["el agua", "water"], ["el café", "coffee"], ["el pan", "bread"], ["la leche", "milk"], ["el queso", "cheese"],
      ["el zumo", "juice"], ["las patatas", "potatoes / fries"], ["la tortilla", "Spanish omelette"], ["la caña", "small draught beer"], ["el vino", "wine"],
    ]),
    grammarLesson("a1-ar", "Verbs ending in -ar", "hablar: hablo, hablas, habla…",
      "Regular -ar verbs drop -ar and add: -o (yo), -as (tú), -a (él / ella / usted), -amos (nosotros), -áis (vosotros), -an (ellos / ustedes). Hablar → hablo, hablas, habla, hablamos, habláis, hablan. In Spain you'll use the vosotros form with friends all the time.",
      [
        ["Hablo español.", "I speak Spanish."],
        ["¿Trabajas hoy?", "Are you working today?"],
        ["Nosotros tomamos café.", "We drink coffee."],
      ],
      [
        { fill: "Yo ＿ inglés. (hablar)", options: ["hablo", "hablas", "habla", "hablan"], answer: "hablo", en: "I speak English." },
        { fill: "¿Tú ＿ aquí? (trabajar)", options: ["trabajas", "trabajo", "trabaja", "trabajamos"], answer: "trabajas", en: "Do you work here?" },
        { fill: "Ellos ＿ música. (escuchar)", options: ["escuchan", "escucha", "escuchamos", "escucho"], answer: "escuchan", en: "They listen to music." },
        { fill: "Nosotros ＿ café. (tomar)", options: ["tomamos", "toman", "tomáis", "toma"], answer: "tomamos", en: "We drink coffee." },
        { fill: "¿Vosotros ＿ español? (hablar)", options: ["habláis", "hablan", "hablamos", "hablas"], answer: "habláis", en: "Do you guys speak Spanish?" },
        { order: ["Hablo", "un", "poco", "de", "español"], en: "I speak a little Spanish." },
      ]),
    grammarLesson("a1-order", "Ordering politely", "Quiero… / Me gustaría… / ¿Me pone…?",
      "In a Spanish bar, the most natural way to order is ¿Me pone…? (could you get me…?) or ¿Me pones…? with tú. Quiero (I want) and me gustaría (I would like) also work. Ask for the bill with La cuenta, por favor, or ¿Cuánto es?",
      [
        ["¿Me pone un café con leche, por favor?", "Could I have a coffee with milk, please?"],
        ["Una caña y una ración de patatas bravas.", "A small beer and a portion of patatas bravas."],
        ["La cuenta, por favor.", "The bill, please."],
      ],
      [
        { fill: "¿Me ＿ un zumo de naranja, por favor?", options: ["pone", "pongo", "ponemos", "gusta"], answer: "pone", en: "Could I have an orange juice, please?" },
        { fill: "Me ＿ una mesa para dos.", options: ["gustaría", "gusta", "quiero", "pone"], answer: "gustaría", en: "I'd like a table for two." },
        { fill: "¿＿ cuesta?", options: ["Cuánto", "Qué", "Cómo", "Dónde"], answer: "Cuánto", en: "How much does it cost?" },
        { order: ["Un", "café", "con", "leche,", "por", "favor"], en: "A coffee with milk, please." },
      ]),
  ]},

  { title: "Daily Life", icon: "☀️", lessons: [
    grammarLesson("a1-er-ir", "Verbs ending in -er and -ir", "comer: como… · vivir: vivo…",
      "-er verbs: -o, -es, -e, -emos, -éis, -en (comer → como, comes, come, comemos, coméis, comen). -ir verbs are the same except nosotros -imos and vosotros -ís (vivir → vivimos, vivís).",
      [
        ["Como fruta todos los días.", "I eat fruit every day."],
        ["¿Dónde vives?", "Where do you live?"],
        ["Ellos beben agua.", "They drink water."],
      ],
      [
        { fill: "Yo ＿ en Madrid. (vivir)", options: ["vivo", "vives", "vive", "vivimos"], answer: "vivo", en: "I live in Madrid." },
        { fill: "¿Vosotros ＿ aquí? (vivir)", options: ["vivís", "vivéis", "viven", "vivimos"], answer: "vivís", en: "Do you guys live here?" },
        { fill: "¿Qué ＿ tú? (comer)", options: ["comes", "come", "como", "comen"], answer: "comes", en: "What are you eating?" },
        { fill: "Nosotros ＿ cartas. (escribir)", options: ["escribimos", "escribemos", "escriben", "escribo"], answer: "escribimos", en: "We write letters." },
        { fill: "Ella ＿ el periódico. (leer)", options: ["lee", "lees", "leo", "leen"], answer: "lee", en: "She reads the newspaper." },
        { order: ["¿Dónde", "vives", "tú?"], en: "Where do you live?" },
      ]),
    vocabLesson("a1-routine", "Daily routine", [
      ["trabajar", "to work"], ["estudiar", "to study"], ["comer", "to eat"], ["beber", "to drink"], ["vivir", "to live"],
      ["dormir", "to sleep"], ["leer", "to read"], ["escribir", "to write"],
    ]),
    grammarLesson("a1-tener", "I have", "tener: tengo, tienes, tiene…",
      "Tener (to have) is irregular: tengo, tienes, tiene, tenemos, tenéis, tienen. Spanish also uses tener for age (Tengo veinte años = I'm twenty) and feelings like hunger (Tengo hambre = I'm hungry).",
      [
        ["Tengo dos hermanos.", "I have two brothers."],
        ["¿Cuántos años tienes?", "How old are you?"],
        ["Tenemos hambre.", "We're hungry."],
      ],
      [
        { fill: "Yo ＿ un gato.", options: ["tengo", "tiene", "tienes", "teno"], answer: "tengo", en: "I have a cat." },
        { fill: "¿Cuántos años ＿?", options: ["tienes", "eres", "estás", "tengo"], answer: "tienes", en: "How old are you?" },
        { fill: "Tengo veinte ＿.", options: ["años", "anos", "días", "horas"], answer: "años", en: "I'm twenty years old." },
        { order: ["Tenemos", "mucha", "hambre"], en: "We're very hungry." },
      ]),
  ]},

  { title: "In the City", icon: "🏙️", lessons: [
    vocabLesson("a1-places", "Places", [
      ["la estación", "station"], ["el banco", "bank"], ["la farmacia", "pharmacy"], ["el supermercado", "supermarket"],
      ["el hotel", "hotel"], ["la playa", "beach"], ["el museo", "museum"], ["la calle", "street"],
    ]),
    grammarLesson("a1-estar-hay", "Where is it?", "estar (location) · hay",
      "Use estar for where something is: ¿Dónde está el museo? = Where is the museum? (estoy, estás, está, estamos, estáis, están). Use hay for \"there is / there are\": Hay un banco aquí = There's a bank here.",
      [
        ["¿Dónde está la estación?", "Where is the station?"],
        ["El hotel está cerca.", "The hotel is close by."],
        ["Hay una farmacia en la calle Mayor.", "There's a pharmacy on Calle Mayor."],
      ],
      [
        { fill: "¿Dónde ＿ el baño?", options: ["está", "es", "hay", "estoy"], answer: "está", en: "Where is the bathroom?" },
        { fill: "＿ un supermercado cerca.", options: ["Hay", "Está", "Es", "Tiene"], answer: "Hay", en: "There's a supermarket nearby." },
        { fill: "Nosotros ＿ en el hotel.", options: ["estamos", "somos", "hay", "están"], answer: "estamos", en: "We're at the hotel." },
        { order: ["¿Dónde", "está", "la", "playa?"], en: "Where is the beach?" },
      ]),
    grammarLesson("a1-ir", "Going places", "ir a + place",
      "Ir (to go) is irregular: voy, vas, va, vamos, vais, van. Use a for \"to\", and a + el contracts to al: Voy al museo (I'm going to the museum), Vamos a la playa (We're going to the beach).",
      [
        ["Voy al banco.", "I'm going to the bank."],
        ["¿Vas a la fiesta?", "Are you going to the party?"],
        ["Vamos a la playa.", "Let's go / We're going to the beach."],
      ],
      [
        { fill: "Yo ＿ al supermercado.", options: ["voy", "va", "vas", "vamos"], answer: "voy", en: "I'm going to the supermarket." },
        { fill: "Vamos ＿ museo.", options: ["al", "a el", "a la", "en"], answer: "al", en: "We're going to the museum." },
        { fill: "¿＿ a la estación? (you)", options: ["Vas", "Va", "Voy", "Van"], answer: "Vas", en: "Are you going to the station?" },
        { order: ["Vamos", "a", "la", "playa"], en: "Let's go to the beach." },
      ]),
  ]},

  { title: "Likes & Hobbies", icon: "🎸", lessons: [
    vocabLesson("a1-hobbies", "Hobbies", [
      ["la música", "music"], ["el fútbol", "soccer"], ["bailar", "to dance"], ["cantar", "to sing"], ["viajar", "to travel"],
      ["cocinar", "to cook"], ["las películas", "movies"], ["los libros", "books"],
    ]),
    grammarLesson("a1-gustar", "I like…", "me gusta / me gustan",
      "Gustar works backwards: the thing you like is the subject. Me gusta + one thing or a verb (Me gusta el café, Me gusta bailar). Me gustan + plural things (Me gustan los perros). Te gusta = you like, le gusta = he / she likes.",
      [
        ["Me gusta la música.", "I like music."],
        ["Me gustan los gatos.", "I like cats."],
        ["¿Te gusta bailar?", "Do you like dancing?"],
      ],
      [
        { fill: "Me ＿ el chocolate.", options: ["gusta", "gustan", "gusto", "gustas"], answer: "gusta", en: "I like chocolate." },
        { fill: "Me ＿ los libros.", options: ["gustan", "gusta", "gusto", "gustamos"], answer: "gustan", en: "I like books." },
        { fill: "¿＿ gusta viajar? (you)", options: ["Te", "Me", "Le", "Tú"], answer: "Te", en: "Do you like traveling?" },
        { order: ["Me", "gusta", "mucho", "bailar"], en: "I really like dancing." },
      ]),
  ]},

  { title: "Describing", icon: "🎨", lessons: [
    vocabLesson("a1-adj", "Adjectives", [
      ["grande", "big"], ["pequeño", "small"], ["bonito", "pretty"], ["feo", "ugly"], ["caro", "expensive"],
      ["barato", "cheap"], ["simpático", "nice, friendly"], ["cansado", "tired"],
    ]),
    grammarLesson("a1-agree", "Adjectives agree", "un chico alto · una chica alta",
      "Adjectives usually go after the noun and match it in gender and number: el coche rojo, la casa roja, los coches rojos. Adjectives ending in -e or a consonant don't change for gender: un libro grande, una casa grande.",
      [
        ["Es una ciudad bonita.", "It's a pretty city."],
        ["Tengo dos perros pequeños.", "I have two small dogs."],
        ["La película es interesante.", "The movie is interesting."],
      ],
      [
        { fill: "Una casa ＿.", options: ["bonita", "bonito", "bonitos", "bonitas"], answer: "bonita", en: "A pretty house." },
        { fill: "Los coches son ＿.", options: ["caros", "caro", "cara", "caras"], answer: "caros", en: "The cars are expensive." },
        { fill: "Una ciudad ＿.", options: ["grande", "granda", "grandes", "grando"], answer: "grande", en: "A big city." },
        { order: ["Es", "una", "chica", "muy", "simpática"], en: "She's a very nice girl." },
      ]),
    grammarLesson("a1-ser-estar", "Ser or estar?", "ser vs estar",
      "Both mean \"to be\". Ser is for what something IS: identity, origin, job, character (Es alto, Es de Cádiz). Estar is for location and temporary states or feelings (Está en casa, Estoy cansado). Compare: Es aburrido (he's boring) vs Está aburrido (he's bored).",
      [
        ["Soy de Zaragoza.", "I'm from Zaragoza."],
        ["Estoy muy cansada.", "I'm very tired."],
        ["La sopa está fría.", "The soup is cold (right now)."],
      ],
      [
        { fill: "Yo ＿ médico.", options: ["soy", "estoy", "es", "está"], answer: "soy", en: "I'm a doctor." },
        { fill: "Hoy ＿ muy contento.", options: ["estoy", "soy", "es", "hay"], answer: "estoy", en: "Today I'm very happy." },
        { fill: "Madrid ＿ en España.", options: ["está", "es", "hay", "son"], answer: "está", en: "Madrid is in Spain." },
        { fill: "Mi hermana ＿ simpática.", options: ["es", "está", "soy", "estoy"], answer: "es", en: "My sister is nice." },
      ]),
  ]},

  { title: "Weekend Plans", icon: "📅", lessons: [
    vocabLesson("a1-when", "When?", [
      ["el fin de semana", "the weekend"], ["esta noche", "tonight"], ["la semana que viene", "next week"],
      ["siempre", "always"], ["nunca", "never"], ["a veces", "sometimes"], ["luego", "later"],
    ]),
    grammarLesson("a1-ir-a", "I'm going to…", "ir a + infinitive",
      "To talk about plans, use ir + a + infinitive: Voy a comer (I'm going to eat), Vamos a ver una película (We're going to watch a movie). It's the easiest way to talk about the future.",
      [
        ["Voy a estudiar esta noche.", "I'm going to study tonight."],
        ["¿Qué vas a hacer el fin de semana?", "What are you going to do this weekend?"],
        ["Vamos a viajar a Asturias.", "We're going to travel to Asturias."],
      ],
      [
        { fill: "Voy ＿ comer pizza.", options: ["a", "de", "en", "al"], answer: "a", en: "I'm going to eat pizza." },
        { fill: "¿Qué ＿ a hacer? (you)", options: ["vas", "voy", "va", "vamos"], answer: "vas", en: "What are you going to do?" },
        { fill: "Ellos van a ＿ al fútbol. (play)", options: ["jugar", "juegan", "juego", "jugando"], answer: "jugar", en: "They're going to play soccer." },
        { order: ["Vamos", "a", "ver", "una", "película"], en: "We're going to watch a movie." },
      ]),
    readingLesson("a1-r-weekend", "Reading: Diego's weekend",
      "El{the} sábado{Saturday} Diego{Diego} va{goes} a{to} la{the} playa{beach} con{with} sus{his} amigos.{friends} Comen{they_eat} paella{paella} en{in} un{a} restaurante{restaurant} pequeño.{small} El{the} domingo{Sunday} va{he's_going} a{to} descansar{rest} en{at} casa{home} y{and} leer{read} un{a} libro.{book}",
      "On Saturday Diego goes to the beach with his friends. They eat paella in a small restaurant. On Sunday he's going to rest at home and read a book.",
      [
        ["Where does Diego go on Saturday?", ["To the beach", "To school", "To the museum", "To work"], "To the beach"],
        ["What do they eat?", ["Paella", "Pizza", "Gazpacho", "Sushi"], "Paella"],
        ["What will Diego do on Sunday?", ["Rest at home and read", "Go dancing", "Travel to Asturias", "Cook for friends"], "Rest at home and read"],
      ]),
  ]},

  { title: "Spain Expressions", icon: "💃", lessons: [
    vocabLesson("a1-exp-1", "Everyday Spain", [
      ["vale", "OK"], ["¡Venga!", "come on! / OK, bye!"], ["¡Qué guay!", "how cool!"], ["¡Qué pasada!", "amazing!"],
      ["¡Anda!", "wow! / no way!"], ["mola", "it's cool"], ["tío / tía", "dude / girl (between friends)"], ["¡Ojalá!", "I hope so!"],
    ]),
    vocabLesson("a1-exp-2", "Life in Spain", [
      ["el piso", "flat / apartment"], ["el bar", "bar / café"], ["las tapas", "tapas (small dishes)"], ["la siesta", "nap after lunch"],
      ["el metro", "the metro"], ["currar", "to work (informal)"], ["la terraza", "outdoor seating"], ["quedar", "to meet up"],
    ]),
    grammarLesson("a1-series", "Talking like a local", "¿Qué tal? · ¡No me digas! · ¿Quedamos?",
      "Spaniards chat casually: ¿Qué tal? (how's it going?), ¡No me digas! (no way! lit. don't tell me), ¡Venga! (come on! / OK then!), and ¿Quedamos? (shall we meet up?). Friends call each other tío / tía, and use vosotros for groups.",
      [
        ["¿Qué tal, tío? ¿Todo bien?", "How's it going, dude? All good?"],
        ["¡No me digas! ¿En serio?", "No way! Seriously?"],
        ["¿Quedamos a las ocho en la terraza?", "Shall we meet at eight on the terrace?"],
      ],
      [
        { fill: "¡No me ＿! ¿En serio?", options: ["digas", "dices", "dice", "decir"], answer: "digas", en: "No way! Seriously?" },
        { fill: "¿Qué ＿, tía? ¿Todo bien?", options: ["tal", "pasa", "hay", "es"], answer: "tal", en: "How's it going, girl? All good?" },
        { fill: "¿＿ mañana para tomar algo?", options: ["Quedamos", "Quedan", "Quedo", "Quedáis"], answer: "Quedamos", en: "Shall we meet up tomorrow for a drink?" },
        { order: ["¡Venga,", "vámonos", "ya!"], en: "Come on, let's go now!" },
      ]),
  ]},
];
