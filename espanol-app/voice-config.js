// Voice configuration for Spanish: three regional accents, voice profiles and the voices that fit them.
// A voice is only ever used for its own region (es-ES ≠ es-MX ≠ es-CO), so accents never mix.
// Edge exposes Azure neural voices ("Microsoft Elvira Online (Natural) - Spanish (Spain)"),
// Apple uses names like "Mónica" / "Paulina", Chrome offers "Google español" (Spain).
const VOICE_LANG = { code: "es", name: "Spanish", mascot: "Lía", icon: "🐾", other: "Japanese" };
const VOICE_ACCENTS = [
  {
    id: "es-ES", flag: "🇪🇸", name: "Castilian · Madrid", native: "castellano (Madrid)",
    note: "Distinguishes /s/ and /θ/ (casa ≠ caza, cerveza with a “th”), strong /x/ in jamón, vosotros. The lessons are written in this Spanish.",
    sample: "Hola, ¿cómo estás? Me alegra mucho conocerte.",
    profiles: {
      "f-soft": [/elvira/i, /\blia\b|lía/i, /m[oó]nica/i, /google español$/i, /helena/i, /laura/i],
      "f-bright": [/ximena/i, /abril/i, /triana/i, /vera/i, /estrella/i, /elvira/i, /m[oó]nica/i, /google español$/i],
      "m-calm": [/[aá]lvaro/i, /dar[ií]o/i, /jorge/i, /pablo/i],
      "m-deep": [/arnau/i, /sa[uú]l/i, /el[ií]as/i, /[aá]lvaro/i, /jorge/i, /pablo/i],
    },
  },
  {
    id: "es-MX", flag: "🇲🇽", name: "Mexican · Mexico City", native: "mexicano (CDMX)",
    note: "Seseo (no /θ/), clear full vowels, softer /x/, melodic rising intonation. Note: the lessons use Spain's vosotros forms.",
    sample: "¿Qué hiciste ayer? ¿Te gustaría salir a tomar un café?",
    profiles: {
      "f-soft": [/dalia/i, /paulina/i, /sabina/i, /beatriz/i],
      "f-bright": [/renata/i, /larissa/i, /marina/i, /candela/i, /carlota/i, /dalia/i, /paulina/i],
      "m-calm": [/jorge/i, /juan/i, /ra[uú]l/i, /yago/i],
      "m-deep": [/cecilio/i, /gerardo/i, /liberto/i, /luciano/i, /pelayo/i, /jorge/i, /juan/i],
    },
  },
  {
    id: "es-CO", flag: "🇨🇴", name: "Colombian · Bogotá", native: "colombiano (Bogotá)",
    note: "Seseo, very clear and careful articulation, calm even rhythm; usted is common even between friends.",
    sample: "No te preocupes, todo va a salir bien.",
    profiles: {
      "f-soft": [/salom[eé]/i, /soledad/i, /ximena/i],
      "f-bright": [/salom[eé]/i, /soledad/i],
      "m-calm": [/gonzalo/i],
      "m-deep": [/gonzalo/i],
    },
  },
];
const VOICE_FEMALE = /elvira|ximena|abril|triana|vera|estrella|irene|laia|\blia\b|lía|m[oó]nica|helena|laura|dalia|paulina|sabina|beatriz|renata|larissa|marina|candela|carlota|nuria|salom[eé]|soledad|google|female/i;
const VOICE_MALE = /[aá]lvaro|arnau|dar[ií]o|el[ií]as|nil|sa[uú]l|teo|jorge|pablo|juan|ra[uú]l|cecilio|gerardo|liberto|luciano|pelayo|yago|gonzalo|male/i;
const VOICE_TEST_SENTENCES = [
  "Hola, ¿cómo estás? Me alegra mucho conocerte.",
  "¿Qué hiciste ayer? ¿Te gustaría salir a tomar un café?",
  "No te preocupes, todo va a salir bien.",
];
const MASCOT_SAMPLE = "¡Hola! Soy Lía. ¿Aprendemos español juntos?";
const VOICE_SOURCES = [
  ["Microsoft Edge", "🇪🇸 Elvira ♀ · Álvaro ♂ · 🇲🇽 Dalia ♀ · Jorge ♂ · 🇨🇴 Salomé ♀ · Gonzalo ♂", "✨ Azure neural voices, free, nothing to install", "Open the app in Edge"],
  ["Google Chrome", "🇪🇸 Google español ♀", "Good neural quality (Spain only), needs internet", "Open the app in Chrome"],
  ["iPhone · iPad · Mac", "🇪🇸 Mónica ♀ · Jorge ♂ · 🇲🇽 Paulina ♀ · Juan ♂", "✨ Natural with the Enhanced / Premium download", "Settings → Accessibility → Spoken Content → Voices → Spanish"],
  ["Android", "Google voices (Spain, Mexico…)", "✨ Neural", "Settings → Text-to-speech → Google → Install voice data → Spanish"],
  ["Windows", "Helena ♀ · Laura ♀ · Pablo ♂ (Spain)", "🤖 Older generation, robotic", "Built in. Use Edge for natural voices"],
];
