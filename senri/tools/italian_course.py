"""Italian course for Senri (standard Italian). Writes assets/content/it.json in the same
schema as the Japanese and Spanish courses. Run: python3 tools/italian_course.py

Levels A1 and A2 are fully written. B1 to C2 are a syllabus (lessons marked "ai": true),
shown in the app as a programme without fake content.
"""
import json
import os

UNIT_COLORS = ["#ff7aa2", "#7a9cff", "#4fc3a1", "#f2a541", "#b07aff", "#3cb8d8", "#ef6f6c", "#8bbf4a"]


def vocab(lid, title, words):
    return {"id": lid, "title": title, "type": "vocab",
            "items": [{"id": f"vocab:{w}", "jp": w, "romaji": w, "en": en} for w, en in words]}


def grammar(lid, title, point, explain, examples, fills, orders):
    ex = [{"fill": f, "options": o, "answer": a, "en": en} for f, o, a, en in fills]
    ex += [{"order": o.split("|"), "en": en} for o, en in orders]
    return {"id": lid, "title": title, "type": "grammar", "point": point, "explain": explain,
            "examples": [[it, "", en] for it, en in examples], "exercises": ex}


def reading(lid, title, tokens, translation, questions):
    return {"id": lid, "title": title, "type": "reading",
            "tokens": [{"t": t, "r": "", "en": en} for t, en in tokens],
            "translation": translation,
            "questions": [{"q": q, "options": o, "answer": a} for q, o, a in questions]}


A1 = [
    {"title": "Ciao!", "icon": "👋", "lessons": [
        vocab("it-a1-saluti", "Greetings", [
            ("ciao", "hi / bye (informal)"), ("buongiorno", "good morning / hello"), ("buonasera", "good evening"),
            ("buonanotte", "good night"), ("arrivederci", "goodbye"), ("grazie", "thank you"),
            ("prego", "you're welcome"), ("scusi", "excuse me (formal)"), ("per favore", "please"),
        ]),
        grammar("it-a1-essere", "I am…", "essere: sono, sei, è",
                "Essere means \"to be\". io sono (I am), tu sei (you are, informal), lui / lei è (he / she is), Lei è (you are, formal). "
                "Like Spanish, Italian usually drops the pronoun: \"Sono Marco\" is enough. Use Lei (capital L) with strangers, shop staff and older people.",
                [("Sono Giulia.", "I'm Giulia."), ("Sei italiano?", "Are you Italian?"), ("Lei è di Roma.", "She is from Rome.")],
                [("Io ＿ Marco.", ["sono", "sei", "è", "siamo"], "sono", "I'm Marco."),
                 ("Tu ＿ di Milano?", ["sei", "sono", "è", "siete"], "sei", "Are you from Milan?"),
                 ("Lui ＿ medico.", ["è", "sei", "sono", "ha"], "è", "He is a doctor."),
                 ("Scusi, Lei ＿ la signora Rossi?", ["è", "sei", "sono", "siete"], "è", "Excuse me, are you Mrs Rossi?")],
                [("Io|sono|di|Parigi", "I'm from Paris."), ("Sei|di|Napoli?", "Are you from Naples?")]),
        grammar("it-a1-essere-pl", "We are, they are", "essere: siamo, siete, sono",
                "Plural forms: noi siamo (we are), voi siete (you all are), loro sono (they are). "
                "Watch out: sono is both \"I am\" and \"they are\". The context (or the pronoun) tells you which.",
                [("Siamo amici.", "We are friends."), ("Siete studenti?", "Are you (all) students?"), ("Loro sono di Firenze.", "They are from Florence.")],
                [("Noi ＿ in vacanza.", ["siamo", "siete", "sono", "è"], "siamo", "We are on holiday."),
                 ("Voi ＿ fratelli?", ["siete", "siamo", "sei", "sono"], "siete", "Are you brothers?"),
                 ("Paolo e Anna ＿ di Torino.", ["sono", "è", "siamo", "siete"], "sono", "Paolo and Anna are from Turin.")],
                [("Noi|siamo|in|Italia", "We are in Italy."), ("Loro|sono|molto|simpatici", "They are very nice.")]),
        vocab("it-a1-persone", "People & countries", [
            ("l'amico", "friend (m)"), ("l'amica", "friend (f)"), ("il ragazzo", "boy / boyfriend"), ("la ragazza", "girl / girlfriend"),
            ("italiano", "Italian (m)"), ("francese", "French"), ("lo studente", "student (m)"), ("la studentessa", "student (f)"),
        ]),
        reading("it-a1-r-giulia", "Reading: Giulia introduces herself", [
            ("Ciao!", "hi!"), ("Mi", "myself"), ("chiamo", "I call"), ("Giulia.", "Giulia"), ("Sono", "I am"), ("di", "from"),
            ("Bologna,", "Bologna"), ("ma", "but"), ("abito", "I live"), ("a", "in"), ("Roma.", "Rome"), ("Sono", "I am"),
            ("studentessa", "student"), ("di", "of"), ("architettura.", "architecture"), ("Il", "the"), ("mio", "my"),
            ("amico", "friend"), ("Luca", "Luca"), ("è", "is"), ("francese.", "French"),
        ], "Hi! My name is Giulia. I'm from Bologna, but I live in Rome. I'm an architecture student. My friend Luca is French.",
            [("Where is Giulia from?", ["Bologna", "Rome", "Milan", "Paris"], "Bologna"),
             ("Where does she live?", ["Rome", "Bologna", "Florence", "Naples"], "Rome"),
             ("What nationality is Luca?", ["French", "Italian", "Spanish", "English"], "French")]),
    ]},
    {"title": "Numbers & Time", "icon": "🕐", "lessons": [
        vocab("it-a1-num1", "Numbers 1–10", [
            ("uno", "one"), ("due", "two"), ("tre", "three"), ("quattro", "four"), ("cinque", "five"),
            ("sei", "six"), ("sette", "seven"), ("otto", "eight"), ("nove", "nine"), ("dieci", "ten"),
        ]),
        vocab("it-a1-num2", "Numbers 11–20", [
            ("undici", "eleven"), ("dodici", "twelve"), ("tredici", "thirteen"), ("quattordici", "fourteen"), ("quindici", "fifteen"),
            ("sedici", "sixteen"), ("diciassette", "seventeen"), ("diciotto", "eighteen"), ("diciannove", "nineteen"), ("venti", "twenty"),
        ]),
        grammar("it-a1-ore", "What time is it?", "Che ore sono? / Sono le… / È l'una",
                "To give the time, use sono le + number: \"Sono le tre\" (it's three o'clock). One o'clock is singular: \"È l'una\". "
                "Noon and midnight: \"È mezzogiorno\", \"È mezzanotte\". Add e mezza (half past) or e un quarto (quarter past).",
                [("Che ore sono?", "What time is it?"), ("Sono le otto e mezza.", "It's half past eight."), ("È l'una.", "It's one o'clock.")],
                [("＿ le quattro.", ["Sono", "È", "Ha", "Sei"], "Sono", "It's four o'clock."),
                 ("È ＿ una.", ["l'", "le", "la", "il"], "l'", "It's one o'clock."),
                 ("Sono le sette e ＿.", ["mezza", "metà", "mezzo", "quarto"], "mezza", "It's half past seven.")],
                [("Che|ore|sono?", "What time is it?"), ("Sono|le|dieci|e|un|quarto", "It's quarter past ten.")]),
        vocab("it-a1-giorni", "Days of the week", [
            ("lunedì", "Monday"), ("martedì", "Tuesday"), ("mercoledì", "Wednesday"), ("giovedì", "Thursday"),
            ("venerdì", "Friday"), ("sabato", "Saturday"), ("domenica", "Sunday"), ("oggi", "today"), ("domani", "tomorrow"),
        ]),
    ]},
    {"title": "Al bar", "icon": "☕", "lessons": [
        vocab("it-a1-bar", "At the café", [
            ("il caffè", "espresso / coffee"), ("il cappuccino", "cappuccino"), ("il cornetto", "croissant"), ("l'acqua", "water"),
            ("il succo", "juice"), ("il tramezzino", "sandwich"), ("il conto", "the bill"), ("lo scontrino", "the receipt"),
        ]),
        grammar("it-a1-articoli", "The: il, lo, la, l'", "il / lo / la / l' (singular articles)",
                "Masculine nouns take il (il caffè), but lo before s + consonant, z, gn, ps (lo zucchero, lo studente). "
                "Feminine nouns take la (la pizza). Before a vowel both become l' (l'amico, l'acqua).",
                [("il cappuccino", "the cappuccino"), ("lo zucchero", "the sugar"), ("la brioche", "the brioche"), ("l'aranciata", "the orange soda")],
                [("＿ caffè è buono.", ["Il", "Lo", "La", "L'"], "Il", "The coffee is good."),
                 ("Dov'è ＿ zucchero?", ["lo", "il", "la", "l'"], "lo", "Where is the sugar?"),
                 ("＿ acqua è fredda.", ["L'", "La", "Il", "Lo"], "L'", "The water is cold."),
                 ("＿ pizza è calda.", ["La", "Il", "Lo", "L'"], "La", "The pizza is hot.")],
                [("Il|conto,|per|favore", "The bill, please.")]),
        grammar("it-a1-vorrei", "I'd like…", "vorrei + noun / verb",
                "Vorrei (I would like) is the polite way to order: \"Vorrei un caffè\". "
                "\"Prendo…\" (I'll have…) is also very common at the bar. Add per favore for politeness.",
                [("Vorrei un cappuccino, per favore.", "I'd like a cappuccino, please."), ("Prendo un cornetto.", "I'll have a croissant."),
                 ("Vorrei pagare.", "I'd like to pay.")],
                [("＿ un caffè, per favore.", ["Vorrei", "Sono", "Ho", "Siamo"], "Vorrei", "I'd like a coffee, please."),
                 ("＿ un succo d'arancia.", ["Prendo", "Prende", "Prendi", "Prendono"], "Prendo", "I'll have an orange juice."),
                 ("Vorrei ＿ il conto.", ["pagare", "pago", "paghi", "pagato"], "pagare", "I'd like to pay the bill.")],
                [("Vorrei|un|cornetto,|per|favore", "I'd like a croissant, please."), ("Prendo|un|caffè|al|banco", "I'll have a coffee at the counter.")]),
        reading("it-a1-r-bar", "Reading: a morning at the bar", [
            ("Ogni", "every"), ("mattina", "morning"), ("Marco", "Marco"), ("va", "goes"), ("al", "to the"), ("bar.", "café"),
            ("Prende", "he has"), ("un", "a"), ("caffè", "espresso"), ("al", "at the"), ("banco", "counter"), ("e", "and"),
            ("un", "a"), ("cornetto", "croissant"), ("alla", "with"), ("crema.", "custard"), ("Paga", "he pays"), ("due", "two"),
            ("euro", "euros"), ("e", "and"), ("va", "goes"), ("al", "to"), ("lavoro.", "work"),
        ], "Every morning Marco goes to the café. He has an espresso at the counter and a custard croissant. He pays two euros and goes to work.",
            [("Where does Marco drink his coffee?", ["At the counter", "At home", "At work", "On the terrace"], "At the counter"),
             ("What does he eat?", ["A custard croissant", "A sandwich", "A pizza", "Nothing"], "A custard croissant"),
             ("How much does he pay?", ["Two euros", "Five euros", "One euro", "Ten euros"], "Two euros")]),
    ]},
    {"title": "Family & Home", "icon": "🏡", "lessons": [
        vocab("it-a1-famiglia", "Family", [
            ("la madre", "mother"), ("il padre", "father"), ("il fratello", "brother"), ("la sorella", "sister"),
            ("il figlio", "son"), ("la figlia", "daughter"), ("i nonni", "grandparents"), ("la famiglia", "family"),
        ]),
        grammar("it-a1-avere", "I have…", "avere: ho, hai, ha, abbiamo, avete, hanno",
                "Avere means \"to have\". The h is silent: ho sounds like \"o\". "
                "Italian also uses avere for age: \"Ho vent'anni\" (I'm twenty, literally \"I have twenty years\"), and for hunger and thirst: \"Ho fame\", \"Ho sete\".",
                [("Ho due fratelli.", "I have two brothers."), ("Quanti anni hai?", "How old are you?"), ("Abbiamo fame.", "We're hungry.")],
                [("Io ＿ una sorella.", ["ho", "hai", "ha", "hanno"], "ho", "I have a sister."),
                 ("Quanti anni ＿ tu?", ["hai", "ho", "ha", "avete"], "hai", "How old are you?"),
                 ("Loro ＿ una casa al mare.", ["hanno", "ha", "abbiamo", "avete"], "hanno", "They have a house by the sea."),
                 ("Noi ＿ sete.", ["abbiamo", "avete", "hanno", "siamo"], "abbiamo", "We're thirsty.")],
                [("Ho|trent'anni", "I'm thirty."), ("Mia|sorella|ha|due|figli", "My sister has two children.")]),
        vocab("it-a1-casa", "At home", [
            ("la casa", "house / home"), ("l'appartamento", "flat"), ("la cucina", "kitchen"), ("la camera", "bedroom"),
            ("il bagno", "bathroom"), ("il soggiorno", "living room"), ("il letto", "bed"), ("la finestra", "window"),
        ]),
    ]},
    {"title": "In città", "icon": "🏛️", "lessons": [
        vocab("it-a1-citta", "Places in town", [
            ("la piazza", "square"), ("la stazione", "station"), ("la chiesa", "church"), ("il museo", "museum"),
            ("la farmacia", "pharmacy"), ("il supermercato", "supermarket"), ("la banca", "bank"), ("il ristorante", "restaurant"),
        ]),
        grammar("it-a1-ce", "There is / there are", "c'è / ci sono",
                "C'è (there is) + singular, ci sono (there are) + plural. "
                "Questions use the same words with a rising tone: \"C'è una farmacia qui vicino?\" (Is there a pharmacy nearby?).",
                [("C'è un bar in piazza.", "There's a café in the square."), ("Ci sono due musei.", "There are two museums."),
                 ("C'è una banca qui vicino?", "Is there a bank nearby?")],
                [("＿ una stazione qui vicino?", ["C'è", "Ci sono", "È", "Sono"], "C'è", "Is there a station nearby?"),
                 ("In piazza ＿ tre ristoranti.", ["ci sono", "c'è", "sono", "è"], "ci sono", "There are three restaurants in the square."),
                 ("Non ＿ un supermercato.", ["c'è", "ci sono", "è", "ha"], "c'è", "There isn't a supermarket.")],
                [("C'è|una|farmacia|qui|vicino?", "Is there a pharmacy nearby?")]),
        vocab("it-a1-direzioni", "Directions", [
            ("a destra", "to the right"), ("a sinistra", "to the left"), ("dritto", "straight on"), ("vicino", "near"),
            ("lontano", "far"), ("davanti a", "in front of"), ("dietro", "behind"), ("dov'è…?", "where is…?"),
        ]),
        reading("it-a1-r-roma", "Reading: a walk in Rome", [
            ("Sono", "I am"), ("in", "in"), ("piazza", "square"), ("Navona.", "Navona"), ("C'è", "there is"), ("molta", "a lot of"),
            ("gente.", "people"), ("Il", "the"), ("Pantheon", "Pantheon"), ("è", "is"), ("vicino,", "near"), ("a", "on the"),
            ("destra.", "right"), ("La", "the"), ("stazione", "station"), ("Termini", "Termini"), ("invece", "on the other hand"),
            ("è", "is"), ("lontano:", "far"), ("prendo", "I take"), ("l'autobus.", "the bus"),
        ], "I'm in Piazza Navona. There are a lot of people. The Pantheon is near, on the right. Termini station, on the other hand, is far: I take the bus.",
            [("Where is the narrator?", ["Piazza Navona", "Termini station", "The Pantheon", "At home"], "Piazza Navona"),
             ("Where is the Pantheon?", ["Near, on the right", "Far away", "On the left", "Behind the station"], "Near, on the right"),
             ("How does the narrator get to the station?", ["By bus", "On foot", "By taxi", "By train"], "By bus")]),
    ]},
    {"title": "La giornata", "icon": "☀️", "lessons": [
        vocab("it-a1-verbi", "Everyday verbs", [
            ("parlare", "to speak"), ("mangiare", "to eat"), ("lavorare", "to work"), ("abitare", "to live"),
            ("leggere", "to read"), ("scrivere", "to write"), ("dormire", "to sleep"), ("partire", "to leave"),
        ]),
        grammar("it-a1-are", "Regular -are verbs", "presente: parlo, parli, parla, parliamo, parlate, parlano",
                "Most Italian verbs end in -are. Drop -are and add: -o, -i, -a, -iamo, -ate, -ano. "
                "Parlo italiano (I speak Italian), lavoriamo a Milano (we work in Milan). Stress stays on the stem in parlano: PAR-la-no.",
                [("Parlo un po' d'italiano.", "I speak a little Italian."), ("Dove lavori?", "Where do you work?"), ("Abitano a Venezia.", "They live in Venice.")],
                [("Io ＿ francese e italiano.", ["parlo", "parli", "parla", "parlano"], "parlo", "I speak French and Italian."),
                 ("Tu dove ＿?", ["abiti", "abito", "abita", "abitiamo"], "abiti", "Where do you live?"),
                 ("Noi ＿ la pizza stasera.", ["mangiamo", "mangiate", "mangiano", "mangio"], "mangiamo", "We're eating pizza tonight."),
                 ("Loro ＿ in banca.", ["lavorano", "lavora", "lavorate", "lavoro"], "lavorano", "They work in a bank.")],
                [("Parlo|un|po'|d'italiano", "I speak a little Italian.")]),
        grammar("it-a1-ere-ire", "-ere and -ire verbs", "leggo, leggi, legge… / dormo, dormi, dorme…",
                "Verbs in -ere and -ire share almost the same endings: -o, -i, -e, -iamo, -ete / -ite, -ono. "
                "Leggo un libro (I read a book), dormiamo poco (we sleep little), partono domani (they leave tomorrow).",
                [("Leggo il giornale.", "I read the newspaper."), ("Dormi bene?", "Do you sleep well?"), ("Il treno parte alle nove.", "The train leaves at nine.")],
                [("Lei ＿ un libro.", ["legge", "leggo", "leggi", "leggono"], "legge", "She is reading a book."),
                 ("Voi ＿ troppo poco.", ["dormite", "dormiamo", "dormono", "dorme"], "dormite", "You (all) sleep too little."),
                 ("Il treno ＿ alle otto.", ["parte", "parto", "parti", "partono"], "parte", "The train leaves at eight.")],
                [("Scrivo|una|lettera|a|mia|madre", "I'm writing a letter to my mother.")]),
    ]},
]

A2 = [
    {"title": "Il weekend scorso", "icon": "📸", "lessons": [
        grammar("it-a2-pp-avere", "What did you do?", "passato prossimo con avere: ho mangiato",
                "The passato prossimo is the everyday past tense: avere + past participle. -are → -ato (mangiato), -ere → -uto (venduto), -ire → -ito (dormito). "
                "Common irregulars: fatto (done), visto (seen), preso (taken), letto (read).",
                [("Ho mangiato una pizza.", "I ate a pizza."), ("Hai visto il film?", "Did you see the film?"), ("Abbiamo fatto una passeggiata.", "We went for a walk.")],
                [("Ieri ＿ lavorato molto.", ["ho", "sono", "hai", "è"], "ho", "Yesterday I worked a lot."),
                 ("Hai ＿ il libro?", ["letto", "leggere", "leggi", "legge"], "letto", "Have you read the book?"),
                 ("Che cosa avete ＿ sabato?", ["fatto", "fare", "fate", "faccio"], "fatto", "What did you do on Saturday?")],
                [("Ho|visto|un|bel|film", "I saw a good film."), ("Abbiamo|mangiato|al|ristorante", "We ate at the restaurant.")]),
        grammar("it-a2-pp-essere", "Where did you go?", "passato prossimo con essere: sono andato / andata",
                "Verbs of movement and change (andare, venire, partire, arrivare, uscire, restare…) use essere. "
                "The participle agrees like an adjective: sono andato (m), sono andata (f), siamo andati (m pl), siamo andate (f pl).",
                [("Sono andata a Napoli.", "I (f) went to Naples."), ("Siete usciti ieri sera?", "Did you (pl) go out last night?"), ("Marco è arrivato tardi.", "Marco arrived late.")],
                [("Anna ＿ partita lunedì.", ["è", "ha", "sono", "hai"], "è", "Anna left on Monday."),
                 ("Noi siamo ＿ al mare.", ["andati", "andato", "andata", "andare"], "andati", "We went to the seaside."),
                 ("Luca è ＿ a casa.", ["restato", "restata", "restati", "restare"], "restato", "Luca stayed at home.")],
                [("Sono|andato|a|Firenze|in|treno", "I went to Florence by train.")]),
        vocab("it-a2-tempo", "Time expressions", [
            ("ieri", "yesterday"), ("ieri sera", "last night"), ("la settimana scorsa", "last week"), ("l'anno scorso", "last year"),
            ("fa", "ago"), ("già", "already"), ("non… ancora", "not… yet"), ("poi", "then"),
        ]),
        reading("it-a2-r-weekend", "Reading: a weekend in Florence", [
            ("Sabato", "on Saturday"), ("sono", "I"), ("andata", "went"), ("a", "to"), ("Firenze", "Florence"), ("con", "with"),
            ("mia", "my"), ("sorella.", "sister"), ("Abbiamo", "we"), ("visitato", "visited"), ("gli", "the"), ("Uffizi", "Uffizi"),
            ("e", "and"), ("abbiamo", "we"), ("mangiato", "ate"), ("una", "a"), ("bistecca", "steak"), ("enorme.", "huge"),
            ("Domenica", "on Sunday"), ("siamo", "we"), ("tornate", "came back"), ("a", "to"), ("casa", "home"), ("stanche", "tired"),
            ("ma", "but"), ("felici.", "happy"),
        ], "On Saturday I went to Florence with my sister. We visited the Uffizi and we ate a huge steak. On Sunday we came back home tired but happy.",
            [("Who did the narrator travel with?", ["Her sister", "Her brother", "Her mother", "Alone"], "Her sister"),
             ("What did they visit?", ["The Uffizi", "The Colosseum", "A beach", "A market"], "The Uffizi"),
             ("How did they feel on Sunday?", ["Tired but happy", "Sad", "Bored", "Ill"], "Tired but happy")]),
    ]},
    {"title": "Al mercato", "icon": "🍅", "lessons": [
        vocab("it-a2-cibo", "Food", [
            ("il pane", "bread"), ("il formaggio", "cheese"), ("i pomodori", "tomatoes"), ("la frutta", "fruit"),
            ("la verdura", "vegetables"), ("il prosciutto", "ham"), ("l'olio", "oil"), ("un etto", "100 grams"),
        ]),
        grammar("it-a2-piacere", "I like…", "mi piace / mi piacciono",
                "Piacere works \"backwards\": the thing you like is the subject. Mi piace + singular or a verb (mi piace la pizza, mi piace cucinare), "
                "mi piacciono + plural (mi piacciono i pomodori). Ti piace? = Do you like it?",
                [("Mi piace il gelato.", "I like ice cream."), ("Ti piacciono i film italiani?", "Do you like Italian films?"), ("Non mi piace cucinare.", "I don't like cooking.")],
                [("Mi ＿ la pasta.", ["piace", "piacciono", "piaccio", "piaci"], "piace", "I like pasta."),
                 ("Ti ＿ le olive?", ["piacciono", "piace", "piaci", "piacete"], "piacciono", "Do you like olives?"),
                 ("A Marco ＿ viaggiare.", ["piace", "piacciono", "piaccio", "piacete"], "piace", "Marco likes travelling.")],
                [("Mi|piacciono|molto|i|mercati", "I really like markets.")]),
        grammar("it-a2-partitivo", "Some…", "del, dello, della, dei, degli, delle",
                "To say \"some\", combine di with the article: del pane (some bread), della frutta (some fruit), dei pomodori (some tomatoes), degli spinaci, delle mele. "
                "At the market you will also hear un etto di (100 g of) and un chilo di (a kilo of).",
                [("Vorrei del pane.", "I'd like some bread."), ("Compro dei pomodori.", "I'm buying some tomatoes."), ("Un etto di prosciutto, per favore.", "100 g of ham, please.")],
                [("Vorrei ＿ formaggio.", ["del", "della", "dei", "delle"], "del", "I'd like some cheese."),
                 ("Compriamo ＿ frutta.", ["della", "del", "dei", "degli"], "della", "We're buying some fruit."),
                 ("Ci sono ＿ mele?", ["delle", "dei", "della", "del"], "delle", "Are there any apples?")],
                [("Un|chilo|di|pomodori,|per|favore", "A kilo of tomatoes, please.")]),
        reading("it-a2-r-mercato", "Reading: at the market", [
            ("Buongiorno!", "good morning!"), ("Vorrei", "I'd like"), ("due", "two"), ("etti", "hundred grams"), ("di", "of"),
            ("prosciutto", "ham"), ("e", "and"), ("un", "a"), ("po'", "little"), ("di", "of"), ("parmigiano.", "parmesan"),
            ("Le", "the"), ("pesche", "peaches"), ("sono", "are"), ("dolci?", "sweet?"), ("Sì,", "yes"), ("signora,", "madam"),
            ("sono", "they are"), ("buonissime.", "delicious"), ("Allora", "then"), ("ne", "of them"), ("prendo", "I'll take"),
            ("un", "a"), ("chilo.", "kilo"),
        ], "Good morning! I'd like two hundred grams of ham and a little parmesan. Are the peaches sweet? Yes, madam, they're delicious. Then I'll take a kilo.",
            [("How much ham does the customer want?", ["200 g", "100 g", "1 kg", "500 g"], "200 g"),
             ("What does she ask about the peaches?", ["If they are sweet", "The price", "Where they come from", "If they are ripe"], "If they are sweet"),
             ("How many peaches does she buy?", ["A kilo", "Two", "None", "Half a kilo"], "A kilo")]),
    ]},
    {"title": "In viaggio", "icon": "🚆", "lessons": [
        vocab("it-a2-viaggio", "Travel", [
            ("il biglietto", "ticket"), ("il treno", "train"), ("il binario", "platform"), ("l'aereo", "plane"),
            ("la valigia", "suitcase"), ("l'albergo", "hotel"), ("la prenotazione", "booking"), ("in ritardo", "late"),
        ]),
        grammar("it-a2-futuro", "The future", "futuro semplice: partirò, andrai, sarà…",
                "Future endings: -ò, -ai, -à, -emo, -ete, -anno, added to the infinitive (-are becomes -er-): parlerò, partirai, prenderà. "
                "Irregular stems: sarò (essere), avrò (avere), andrò (andare), farò (fare). Italians often use the present for near plans too.",
                [("Domani partirò presto.", "Tomorrow I'll leave early."), ("Dove andrai in vacanza?", "Where will you go on holiday?"), ("Sarà bellissimo.", "It will be wonderful.")],
                [("L'anno prossimo ＿ in Sicilia.", ["andrò", "vado", "andato", "andare"], "andrò", "Next year I'll go to Sicily."),
                 ("Il treno ＿ in ritardo.", ["sarà", "sarò", "sarai", "saranno"], "sarà", "The train will be late."),
                 ("Che cosa ＿ stasera?", ["farai", "farò", "fa", "fatto"], "farai", "What will you do tonight?")],
                [("Domani|prenderemo|il|treno|delle|otto", "Tomorrow we'll take the eight o'clock train.")]),
        grammar("it-a2-riflessivi", "Reflexive verbs", "mi alzo, ti svegli, si lava…",
                "Reflexive verbs carry a pronoun: mi, ti, si, ci, vi, si. Mi alzo alle sette (I get up at seven), ci vediamo domani (see you tomorrow). "
                "In the passato prossimo they take essere: mi sono svegliata tardi.",
                [("Mi sveglio alle sette.", "I wake up at seven."), ("Come ti chiami?", "What's your name?"), ("Ci vediamo stasera!", "See you tonight!")],
                [("Io ＿ alzo presto.", ["mi", "ti", "si", "ci"], "mi", "I get up early."),
                 ("Come ＿ chiami?", ["ti", "mi", "si", "vi"], "ti", "What's your name?"),
                 ("Ieri mi ＿ svegliato tardi.", ["sono", "ho", "è", "sei"], "sono", "Yesterday I woke up late.")],
                [("Ci|vediamo|domani|in|stazione", "See you tomorrow at the station.")]),
        reading("it-a2-r-treno", "Reading: at the station", [
            ("Il", "the"), ("treno", "train"), ("per", "for"), ("Venezia", "Venice"), ("parte", "leaves"), ("dal", "from"),
            ("binario", "platform"), ("sei", "six"), ("con", "with"), ("venti", "twenty"), ("minuti", "minutes"), ("di", "of"),
            ("ritardo.", "delay"), ("Compro", "I buy"), ("un", "a"), ("caffè", "coffee"), ("e", "and"), ("aspetto.", "I wait"),
            ("Arriverò", "I'll arrive"), ("in", "in"), ("albergo", "the hotel"), ("stasera.", "tonight"),
        ], "The train to Venice leaves from platform six, twenty minutes late. I buy a coffee and wait. I'll get to the hotel tonight.",
            [("Where is the train going?", ["Venice", "Rome", "Milan", "Naples"], "Venice"),
             ("Which platform?", ["Six", "Two", "Twenty", "Ten"], "Six"),
             ("How late is the train?", ["Twenty minutes", "One hour", "Five minutes", "On time"], "Twenty minutes")]),
    ]},
]

OUTLINE = {
    "B1": [
        ("Il congiuntivo", "🌱", [("it-b1-cong-pres", "Present subjunctive", "congiuntivo presente: che io parli, che tu abbia"),
                                  ("it-b1-cong-opinione", "Opinions", "penso che / credo che + congiuntivo"),
                                  ("it-b1-cong-volonta", "Wishes", "voglio che / spero che + congiuntivo"),
                                  ("it-b1-cong-emozione", "Emotions", "sono contento che / mi dispiace che")]),
        ("Raccontare il passato", "📖", [("it-b1-imperfetto", "When I was little", "imperfetto: ero, avevo, andavo"),
                                         ("it-b1-imp-pp", "Two past tenses", "imperfetto o passato prossimo?"),
                                         ("it-b1-trapassato", "Had done", "trapassato prossimo: avevo già mangiato"),
                                         ("it-b1-connettivi", "Telling a story", "mentre, quando, all'improvviso, alla fine")]),
        ("Cortesia e ipotesi", "🎩", [("it-b1-condizionale", "Would", "condizionale presente: vorrei, potrei, dovrei"),
                                      ("it-b1-consigli", "Advice", "al posto tuo… / dovresti…"),
                                      ("it-b1-pronomi", "Object pronouns", "lo, la, li, le / gli, le"),
                                      ("it-b1-ne-ci", "Ne and ci", "ne prendo due / ci vado domani")]),
        ("Lettura", "📖", [("it-b1-lettura", "Reading: an email from Turin", "an informal email describing a new job and city")]),
    ],
    "B2": [
        ("Congiuntivo avanzato", "🧠", [("it-b2-cong-imp", "Imperfect subjunctive", "se avessi tempo… / volevo che tu venissi"),
                                        ("it-b2-periodo-ipotetico", "If clauses", "se + congiuntivo imperfetto + condizionale"),
                                        ("it-b2-concordanza", "Sequence of tenses", "concordanza dei tempi"),
                                        ("it-b2-benche", "Although", "benché / nonostante + congiuntivo")]),
        ("Argomentare", "🗣️", [("it-b2-opinione", "Arguing a point", "secondo me, a mio avviso, d'altra parte"),
                                 ("it-b2-passivo", "The passive", "essere / venire + participio"),
                                 ("it-b2-si-impersonale", "One does…", "si impersonale e si passivante"),
                                 ("it-b2-gerundio", "Gerund", "stando così le cose / pur essendo")]),
        ("Lettura", "📖", [("it-b2-lettura", "Reading: a newspaper column", "an opinion piece on city life and tourism")]),
    ],
    "C1": [
        ("Stile e registro", "🖋️", [("it-c1-registri", "Registers", "linguaggio formale, burocratico e colloquiale"),
                                      ("it-c1-passato-remoto", "Literary past", "passato remoto: fu, ebbe, andò"),
                                      ("it-c1-connettivi", "Formal connectors", "pertanto, tuttavia, ciononostante"),
                                      ("it-c1-nominalizzazione", "Nominal style", "nominalizzazione nei testi scritti")]),
        ("Lettura", "📖", [("it-c1-lettura", "Reading: an essay extract", "a cultural essay on Italian regions and dialects")]),
    ],
    "C2": [
        ("Sfumature", "🎭", [("it-c2-modi-di-dire", "Idioms", "in bocca al lupo, essere al verde, fare il ponte"),
                             ("it-c2-dialetti", "Regional Italian", "tratti del napoletano, del romanesco e del veneto"),
                             ("it-c2-letteratura", "Literary Italian", "leggere Calvino e Ginzburg"),
                             ("it-c2-ironia", "Irony & nuance", "attenuazione, ironia, sottintesi")]),
        ("Lettura", "📖", [("it-c2-lettura", "Reading: a literary passage", "a short passage of contemporary fiction")]),
    ],
}

LEVEL_INFO = [
    ("A1", "CILS A1", "Beginner", "Greetings, essere & avere, the café, family, the city, everyday verbs"),
    ("A2", "CILS A2", "Elementary", "The past, food & markets, likes, travel, the future"),
    ("B1", "CILS UNO", "Intermediate", "Subjunctive, past narration, conditional, pronouns"),
    ("B2", "CILS DUE", "Upper-intermediate", "Advanced subjunctive, if clauses, arguing, the passive"),
    ("C1", "CILS TRE", "Advanced", "Registers, literary past, formal writing"),
    ("C2", "CILS QUATTRO", "Mastery", "Idioms, regional Italian, literature, nuance"),
]


def build():
    levels = []
    for lid, exam, name, desc in LEVEL_INFO:
        if lid == "A1":
            units = A1
        elif lid == "A2":
            units = A2
        else:
            units = [{"title": t, "icon": ic, "ai": True,
                      "lessons": [{"id": i, "title": tt, "point": p, "type": "reading" if i.endswith("lettura") else "grammar", "ai": True, "level": lid}
                                  for i, tt, p in ls]} for t, ic, ls in OUTLINE[lid]]
        for i, u in enumerate(units):
            u.setdefault("color", UNIT_COLORS[i % len(UNIT_COLORS)])
        levels.append({"id": lid, "jlpt": exam, "name": name, "desc": desc, "units": units, "ai": lid not in ("A1", "A2")})
    return {"lang": "it", "levels": levels}


def check(course):
    ids = set()
    for lv in course["levels"]:
        for u in lv["units"]:
            for l in u["lessons"]:
                assert l["id"] not in ids, l["id"]
                ids.add(l["id"])
                for e in l.get("exercises", []):
                    if "fill" in e:
                        assert "＿" in e["fill"] and e["answer"] in e["options"] and len(set(e["options"])) == 4, e
                for q in l.get("questions", []):
                    assert q["answer"] in q["options"], q
    return len(ids)


if __name__ == "__main__":
    course = build()
    n = check(course)
    out = os.path.join(os.path.dirname(__file__), "..", "assets", "content", "it.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(course, f, ensure_ascii=False)
    written = sum(1 for lv in course["levels"] for u in lv["units"] for l in u["lessons"] if not l.get("ai"))
    print(f"it.json: {n} lessons, {written} written")
