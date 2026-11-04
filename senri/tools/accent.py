"""Accent coach content for Senri: the sounds French speakers find hardest in each language,
with contrasting examples to listen to, imitate and record. Writes assets/content/accent.json.
Run: python3 tools/accent.py
"""
import json
import os


def point(pid, title, tip, explain, examples):
    return {"id": pid, "title": title, "tip": tip, "explain": explain,
            "examples": [{"text": t, "hint": h, "fr": fr} for t, h, fr in examples]}


JA = [
    point("ja-long", "Voyelles longues", "おばさん ≠ おばあさん",
          "En japonais, la durée d'une voyelle change le sens. Une voyelle longue dure deux temps : tenez-la deux fois plus longtemps, sans changer de note. Écoutez la paire, puis imitez en comptant « ta-taa ».",
          [("おばさん", "obasan", "tante"), ("おばあさん", "obaasan", "grand-mère"), ("ゆき", "yuki", "neige"), ("ゆうき", "yūki", "courage"),
           ("ここ", "koko", "ici"), ("こうこう", "kōkō", "lycée")]),
    point("ja-tsu", "Le petit っ (consonne double)", "きて ≠ きって",
          "Le petit っ est une pause d'un temps juste avant la consonne : la bouche se prépare, puis relâche. On ne prononce pas de son pendant ce silence. Imitez en marquant un petit arrêt.",
          [("きて", "kite", "viens"), ("きって", "kitte", "timbre"), ("さか", "saka", "pente"), ("さっか", "sakka", "écrivain"),
           ("おと", "oto", "son"), ("おっと", "otto", "mari")]),
    point("ja-u", "Le u qui disparaît", "です → « dess »",
          "Entre deux consonnes sourdes ou en fin de phrase, i et u deviennent presque muets : です sonne « dess », します « shimass ». Ne prononcez pas un u français appuyé.",
          [("です", "desu", "c'est"), ("します", "shimasu", "je fais"), ("すき", "suki", "j'aime"), ("ひと", "hito", "personne"),
           ("おいしいです", "oishii desu", "c'est délicieux")]),
    point("ja-r", "Le r japonais", "ら・り・る・れ・ろ",
          "Le r japonais est une petite tape de la langue derrière les dents du haut, entre un l et un r roulé très bref. Pas de r de gorge à la française.",
          [("ありがとう", "arigatō", "merci"), ("さくら", "sakura", "cerisier"), ("くるま", "kuruma", "voiture"), ("ふろ", "furo", "bain"),
           ("れんしゅう", "renshū", "entraînement")]),
    point("ja-pitch", "L'accent de hauteur", "はし (箸) ≠ はし (橋)",
          "Le japonais n'accentue pas par la force mais par la hauteur : certaines syllabes montent, d'autres descendent. Copiez la mélodie de la voix modèle plutôt que les lettres.",
          [("箸", "HA-shi (aigu puis grave)", "baguettes"), ("橋", "ha-SHI (grave puis aigu)", "pont"), ("雨", "A-me", "pluie"), ("飴", "a-ME", "bonbon")]),
    point("ja-n", "Le ん", "せんぱい · こんにちは",
          "ん compte pour un temps entier. Devant b, p ou m il se prononce m (せんぱい = « sempai ») ; ailleurs, c'est un n nasal sans voyelle après.",
          [("せんぱい", "senpai (« sempai »)", "aîné"), ("こんにちは", "konnichiwa", "bonjour"), ("しんぶん", "shinbun (« shimbun »)", "journal"),
           ("ほん", "hon", "livre")]),
]

ES = [
    point("es-theta", "Le « c / z » d'Espagne", "casa ≠ caza",
          "En Espagne, z et c devant e/i se prononcent comme le th anglais de « think » : langue entre les dents. C'est la distinción, typique de l'espagnol castillan. Le s reste un s.",
          [("casa", "« kassa »", "maison"), ("caza", "« katha »", "chasse"), ("cena", "« thena »", "dîner"), ("zapato", "« thapato »", "chaussure"),
           ("gracias", "« grathias »", "merci")]),
    point("es-jota", "La jota", "jamón · gente",
          "Le j (et le g devant e/i) est un souffle rauque au fond de la gorge, comme un « r » français très frotté, mais sans voix. Plus fort en Espagne qu'en Amérique latine.",
          [("jamón", "« xamón »", "jambon"), ("gente", "« xente »", "gens"), ("ajo", "« axo »", "ail"), ("Juan", "« xouan »", "Juan"),
           ("mujer", "« mouxer »", "femme")]),
    point("es-rr", "R simple et R roulé", "pero ≠ perro",
          "Le r simple est une seule tape de la langue (comme le d rapide de « adorer »). Le rr, et le r en début de mot, est roulé : plusieurs vibrations. Le r de gorge français n'existe pas.",
          [("pero", "1 tape", "mais"), ("perro", "roulé", "chien"), ("caro", "1 tape", "cher"), ("carro", "roulé", "chariot"),
           ("rojo", "roulé (début de mot)", "rouge")]),
    point("es-bv", "B et V : le même son", "vino · bueno",
          "En espagnol, b et v se prononcent pareil. En début de phrase c'est un b ; entre deux voyelles, c'est un b très doux, les lèvres ne se touchent presque pas. Jamais de v français.",
          [("vino", "« bino »", "vin"), ("bueno", "« bouéno »", "bon"), ("uva", "b doux", "raisin"), ("Valencia", "« Balenthia »", "Valence")]),
    point("es-stress", "L'accent tonique", "papa ≠ papá",
          "Chaque mot espagnol a une syllabe plus forte, indiquée par l'accent écrit quand elle est inattendue. Déplacer l'accent change le sens : appuyez nettement sur la bonne syllabe.",
          [("papa", "PA-pa", "pomme de terre"), ("papá", "pa-PÁ", "papa"), ("hablo", "HA-blo", "je parle"), ("habló", "ha-BLÓ", "il a parlé"),
           ("médico", "MÉ-di-co", "médecin")]),
    point("es-d", "Le d final doux", "Madrid · usted",
          "En fin de mot, le d espagnol est très faible, presque un th doux, voire muet dans la conversation : « Madri(d) ». Entre voyelles il est aussi adouci : « cansa(d)o ».",
          [("Madrid", "« Madrith »", "Madrid"), ("usted", "« oustéth »", "vous"), ("verdad", "« berdath »", "vérité"), ("cansado", "d doux", "fatigué")]),
]

IT = [
    point("it-double", "Les consonnes doubles", "pala ≠ palla",
          "En italien, une consonne double se tient plus longtemps (comme une petite pause avant de la relâcher). C'est la faute la plus fréquente des francophones : elle change le sens.",
          [("pala", "pa-la", "pelle"), ("palla", "pal-la", "ballon"), ("caro", "ca-ro", "cher"), ("carro", "car-ro", "chariot"),
           ("sono", "so-no", "je suis"), ("sonno", "son-no", "sommeil")]),
    point("it-c-g", "C et G : doux ou durs", "cena · casa · gelato · gatto",
          "Devant e et i, c se dit « tch » et g se dit « dj ». Devant a, o, u ils sont durs (k, g). Pour garder le son dur devant e/i, on ajoute un h : chi = « ki », ghi = « gui ».",
          [("cena", "« tchéna »", "dîner"), ("casa", "« kasa »", "maison"), ("gelato", "« djélato »", "glace"), ("gatto", "« gatto »", "chat"),
           ("chiesa", "« kiéza »", "église"), ("spaghetti", "« spaguétti »", "spaghetti")]),
    point("it-gli-gn", "GLI et GN", "figlio · gnocchi",
          "gli se prononce comme un l mouillé (proche de « lli » dans « million »), gn comme le gn français de « montagne ». Collez bien la langue au palais.",
          [("figlio", "« fillio »", "fils"), ("famiglia", "« familia » mouillé", "famille"), ("gnocchi", "« gnokki »", "gnocchis"),
           ("bagno", "« bagno »", "salle de bain")]),
    point("it-sc", "SC : « ch » ou « sk »", "scena ≠ scuola",
          "sc devant e ou i se dit « ch » (comme dans « chat »). Devant a, o, u, c'est « sk ».",
          [("scena", "« chéna »", "scène"), ("pesce", "« péché »", "poisson"), ("scuola", "« skouola »", "école"), ("pesca", "« péska »", "pêche")]),
    point("it-z", "Le z italien", "pizza · zero",
          "Le z se prononce « ts » (pizza = « pittsa ») ou « dz » (zero = « dzéro ») selon le mot, jamais comme le z français. Écoutez et imitez chaque mot.",
          [("pizza", "« pittsa »", "pizza"), ("grazie", "« gratsié »", "merci"), ("zero", "« dzéro »", "zéro"), ("zanzara", "« dzandzara »", "moustique")]),
    point("it-stress", "L'accent tonique", "àncora ≠ ancòra",
          "La plupart des mots italiens sont accentués sur l'avant-dernière syllabe, mais pas tous. L'accent écrit (città, perché) indique une finale accentuée : appuyez nettement dessus.",
          [("città", "cit-TÀ", "ville"), ("perché", "per-CHÉ", "pourquoi"), ("àncora", "ÀN-co-ra", "ancre"), ("ancora", "an-CÓ-ra", "encore"),
           ("telefono", "te-LÉ-fo-no", "téléphone")]),
]

if __name__ == "__main__":
    data = {"ja": JA, "es": ES, "it": IT}
    for lang, pts in data.items():
        ids = [p["id"] for p in pts]
        assert len(ids) == len(set(ids)) and all(p["examples"] for p in pts), lang
    out = os.path.join(os.path.dirname(__file__), "..", "assets", "content", "accent.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print("accent.json:", {k: len(v) for k, v in data.items()})
