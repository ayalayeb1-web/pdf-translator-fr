// B1–C2 curriculum outline (Castilian Spanish, DELE levels). Lessons are written by AI
// on first open and saved on the device. Format: [id, title, grammar point]
const ADVANCED_OUTLINE = {
  B1: [
    ["The Subjunctive Begins", "🌱", [
      ["b1-subj-pres", "Present subjunctive", "presente de subjuntivo (hable, coma, viva)"],
      ["b1-subj-deseo", "Wishes", "quiero que / espero que / ojalá + subjuntivo"],
      ["b1-subj-emocion", "Emotions", "me alegra que / me molesta que + subjuntivo"],
      ["b1-subj-duda", "Doubt vs certainty", "no creo que + subjuntivo vs creo que + indicativo"],
    ]],
    ["Stories in the Past", "📖", [
      ["b1-pluscuam", "Had done", "pluscuamperfecto (había hecho)"],
      ["b1-narrar", "Telling a story", "indefinido vs imperfecto vs perfecto in narration"],
      ["b1-estilo-ind", "Reported speech", "estilo indirecto (dijo que…)"],
      ["b1-marcadores", "Story connectors", "de repente, al final, mientras, en cuanto"],
    ]],
    ["Polite & Hypothetical", "🎩", [
      ["b1-condicional", "Would", "condicional simple (haría, podría)"],
      ["b1-consejos", "Giving advice", "deberías / yo que tú / te aconsejo que"],
      ["b1-usted", "Formal Spanish", "usted / ustedes in formal situations"],
      ["b1-por-para", "Por vs para", "por y para"],
    ]],
    ["Everyday Spain", "🏠", [
      ["b1-pronombres-dobles", "Double pronouns", "se lo / me la (pronombres dobles)"],
      ["b1-se-impersonal", "Impersonal se", "se habla / se vende / se puede"],
      ["b1-perifrasis", "Verb phrases", "acabar de, volver a, dejar de, seguir + gerundio"],
      ["b1-relativos", "Who, which, where", "que, quien, donde, lo que"],
    ]],
  ],
  B2: [
    ["Subjunctive Mastery", "🧠", [
      ["b2-subj-imperf", "Imperfect subjunctive", "imperfecto de subjuntivo (hablara / hablase)"],
      ["b2-si-cond", "If I were…", "si + imperfecto de subjuntivo + condicional"],
      ["b2-cuando-subj", "When (future)", "cuando / en cuanto / hasta que + subjuntivo"],
      ["b2-aunque", "Although / even if", "aunque + indicativo vs subjuntivo"],
    ]],
    ["Arguing & Opinions", "🗣️", [
      ["b2-opinar", "Expressing opinions", "en mi opinión, desde mi punto de vista, no es que…"],
      ["b2-conectores", "Formal connectors", "sin embargo, no obstante, por lo tanto, puesto que"],
      ["b2-pasiva", "The passive", "pasiva con ser y pasiva refleja"],
      ["b2-concesivas", "Concessions", "a pesar de que, por mucho que, aun así"],
    ]],
    ["Spain Today", "📰", [
      ["b2-noticias", "Reading the news", "titulares y lenguaje periodístico"],
      ["b2-email-formal", "Formal emails", "correos formales: Estimado/a, Le escribo para…"],
      ["b2-trabajo", "Job interviews", "entrevistas de trabajo y currículum"],
      ["b2-coloquial", "Colloquial Spain", "expresiones coloquiales: estar hasta las narices, flipar…"],
    ]],
  ],
  C1: [
    ["Fine Grammar", "💎", [
      ["c1-subj-plusc", "Would have", "pluscuamperfecto de subjuntivo + condicional compuesto"],
      ["c1-ser-estar", "Ser vs estar nuances", "ser / estar con cambio de significado (ser listo / estar listo)"],
      ["c1-perifrasis", "Advanced verb phrases", "llevar + gerundio, venir a + infinitivo, andar + gerundio"],
      ["c1-marcadores", "Discourse markers", "es decir, o sea, en cambio, de hecho, en definitiva"],
    ]],
    ["Register & Style", "🎭", [
      ["c1-registro", "Formal vs informal register", "registro formal y coloquial"],
      ["c1-academico", "Academic writing", "escritura académica y argumentativa"],
      ["c1-modismos", "Idioms", "modismos españoles (tomar el pelo, meter la pata…)"],
      ["c1-refranes", "Proverbs", "refranes populares"],
    ]],
    ["Culture", "🏛️", [
      ["c1-historia", "Spanish history in brief", "vocabulario histórico y cultural"],
      ["c1-variedades", "Spanish across Spain", "variedades: andaluz, canario, castellano del norte"],
      ["c1-humor", "Humour & irony", "ironía y humor en español"],
      ["c1-debate", "Debating", "debatir y rebatir argumentos"],
    ]],
  ],
  C2: [
    ["Literary Spanish", "📜", [
      ["c2-literatura", "Literary style", "lenguaje literario: Cervantes, Lorca, Machado"],
      ["c2-futuro-subj", "Rare forms", "futuro de subjuntivo en textos legales y refranes"],
      ["c2-figuras", "Figures of speech", "metáforas y recursos estilísticos"],
      ["c2-poesia", "Poetry", "leer poesía española"],
    ]],
    ["Native-like Nuance", "🎯", [
      ["c2-matices", "Subtle nuance", "matices de significado y sinónimos"],
      ["c2-coloquial", "Street Spanish", "argot y lenguaje juvenil de España"],
      ["c2-juridico", "Legal & administrative", "lenguaje jurídico y administrativo"],
      ["c2-oratoria", "Public speaking", "discursos y oratoria"],
    ]],
  ],
};
const AI_READING = {
  B1: ["b1-read", "Reading: a blog post", "a personal blog post from Spain about a trip or daily life"],
  B2: ["b2-read", "Reading: a news article", "a short news article from a Spanish newspaper"],
  C1: ["c1-read", "Reading: an opinion column", "an opinion column (columna de opinión) from the Spanish press"],
  C2: ["c2-read", "Reading: literature", "a short original literary passage in rich peninsular Spanish"],
};
