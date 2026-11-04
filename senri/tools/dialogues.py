"""Scripted conversation scenes for Senri (offline, no AI needed).
Writes assets/content/dialogues.json. Run: python3 tools/dialogues.py

Each scene alternates lines from the other person ("npc") and choices for the learner ("me").
A choice is either right or wrong; wrong choices carry a short explanation in French.
Several choices may be right (natural variants).
"""
import json
import os


def npc(text, fr, reading=""):
    return {"who": "npc", "text": text, "fr": fr, "reading": reading}


def me(task, *choices):
    return {"who": "me", "task": task, "choices": [
        {"text": t, "fr": fr, "ok": ok, "why": why, "reading": rd} for t, fr, ok, why, rd in
        [(c + ("",) * (5 - len(c))) for c in choices]]}


def scene(sid, title, level, icon, place, partner, culture, turns, expressions):
    return {"id": sid, "title": title, "level": level, "icon": icon, "place": place, "partner": partner,
            "culture": culture, "turns": turns, "expressions": [{"text": t, "fr": fr} for t, fr in expressions]}


JA = [
    scene("ja-cafe", "Au café", "A1", "☕", "Un café à Shibuya", "Le serveur",
          "Au Japon, on ne laisse pas de pourboire. Au moment de payer, posez l'argent sur le petit plateau (カルトン) plutôt que dans la main.",
          [npc("いらっしゃいませ。ご注文は？", "Bienvenue. Que désirez-vous ?", "irasshaimase. go-chūmon wa?"),
           me("Commandez un café.",
              ("コーヒーをください。", "Un café, s'il vous plaît.", True, "", "kōhī o kudasai."),
              ("コーヒーをあげます。", "Je (vous) donne un café.", False, "あげます veut dire « donner ». Pour demander quelque chose, on dit 〜をください.", "kōhī o agemasu."),
              ("コーヒーです、ください。", "C'est un café, donnez.", False, "Ordre et particule incorrects : l'objet demandé prend を, puis ください.", "kōhī desu, kudasai.")),
           npc("ホットとアイス、どちらになさいますか。", "Chaud ou glacé, lequel préférez-vous ?", "hotto to aisu, dochira ni nasaimasu ka."),
           me("Choisissez-le chaud.",
              ("ホットでお願いします。", "Chaud, s'il vous plaît.", True, "", "hotto de onegai shimasu."),
              ("ホットがお願いします。", "", False, "Avec お願いします on utilise で (« sous la forme de ») ou を, pas が.", "hotto ga onegai shimasu."),
              ("ホットをしてください。", "Faites chaud.", False, "してください signifie « faites ». Ici on dit ホットでお願いします.", "hotto o shite kudasai.")),
           npc("店内でお召し上がりですか。", "C'est pour consommer sur place ?", "tennai de omeshiagari desu ka."),
           me("Dites que vous le buvez sur place.",
              ("はい、ここで飲みます。", "Oui, je le bois ici.", True, "", "hai, koko de nomimasu."),
              ("いいえ、持ち帰りでお願いします。", "Non, à emporter s'il vous plaît.", True, "", "iie, mochikaeri de onegai shimasu."),
              ("はい、ここに飲みます。", "", False, "Le lieu où se déroule une action prend で, pas に (に marque une destination ou un emplacement statique).", "hai, koko ni nomimasu.")),
           npc("四百円です。", "Ça fait 400 yens.", "yonhyaku en desu."),
           me("Demandez si vous pouvez payer par carte.",
              ("カードで払えますか。", "Je peux payer par carte ?", True, "", "kādo de haraemasu ka."),
              ("カードを払えますか。", "Je peux payer la carte ?", False, "Le moyen de paiement prend で : カードで払えます.", "kādo o haraemasu ka."),
              ("カードで払いますか。", "Vous payez par carte ?", False, "払いますか demande si l'autre paie. Pour « est-ce que je peux », utilisez la forme potentielle 払えますか.", "kādo de haraimasu ka.")),
           npc("はい、大丈夫です。ありがとうございました。", "Oui, pas de problème. Merci beaucoup.", "hai, daijōbu desu. arigatō gozaimashita.")],
          [("〜をください", "… s'il vous plaît (demander un objet)"), ("〜でお願いします", "… s'il vous plaît (choisir une option)"),
           ("持ち帰り", "à emporter"), ("カードで払えますか", "Je peux payer par carte ?")]),
    scene("ja-eki", "À la gare", "A1", "🚉", "La gare de Tokyo", "Un employé",
          "Les quais s'appellent 番線 (« ligne numéro »). Les trains partent à la seconde près et des marquages au sol indiquent où faire la queue.",
          [me("Demandez où est le train pour Shinjuku.",
              ("すみません、新宿行きの電車はどこですか。", "Excusez-moi, où est le train pour Shinjuku ?", True, "", "sumimasen, shinjuku-iki no densha wa doko desu ka."),
              ("すみません、新宿へ電車はどこですか。", "", False, "Pour relier « vers Shinjuku » au nom 電車, il faut 新宿行きの電車 (ou 新宿への電車).", "sumimasen, shinjuku e densha wa doko desu ka."),
              ("ごめんね、新宿の電車どこ？", "Désolé, le train de Shinjuku, où ?", False, "Trop familier avec un inconnu : utilisez すみません et la forme polie です.", "gomen ne, shinjuku no densha doko?")),
           npc("三番線です。あちらの階段を上がってください。", "C'est le quai 3. Montez par l'escalier là-bas.", "sanban-sen desu. achira no kaidan o agatte kudasai."),
           me("Demandez combien de temps dure le trajet.",
              ("何分ぐらいかかりますか。", "Ça prend environ combien de minutes ?", True, "", "nanpun gurai kakarimasu ka."),
              ("何時ぐらいかかりますか。", "", False, "何時 demande une heure précise (« à quelle heure »). Pour une durée : 何分 ou どのぐらい.", "nanji gurai kakarimasu ka."),
              ("何分ぐらいありますか。", "", False, "ありますか demande si quelque chose existe. La durée d'un trajet se dit avec かかります.", "nanpun gurai arimasu ka.")),
           npc("十五分ぐらいです。", "Environ quinze minutes.", "jūgofun gurai desu."),
           me("Remerciez-le chaleureusement.",
              ("ありがとうございます。助かりました。", "Merci beaucoup, vous m'avez bien aidé.", True, "", "arigatō gozaimasu. tasukarimashita."),
              ("どういたしまして。", "Je vous en prie.", False, "どういたしまして répond à un remerciement : c'est l'employé qui pourrait le dire.", "dō itashimashite."),
              ("いただきます。", "", False, "いただきます se dit avant de manger.", "itadakimasu."))],
          [("〜行きの電車", "le train pour …"), ("〜番線", "quai numéro …"), ("何分ぐらいかかりますか", "Ça prend combien de temps ?"),
           ("助かりました", "Vous m'avez bien aidé")]),
    scene("ja-jikoshokai", "Faire connaissance", "A1", "🤝", "Une soirée entre collègues", "Tanaka",
          "Quand on vous complimente, la politesse japonaise veut qu'on minimise (いいえ、まだまだです). On s'incline légèrement en se présentant.",
          [npc("はじめまして。田中です。", "Enchanté. Je suis Tanaka.", "hajimemashite. tanaka desu."),
           me("Présentez-vous (Maria, venue de France).",
              ("はじめまして。マリアと申します。フランスから来ました。", "Enchantée. Je m'appelle Maria. Je viens de France.", True, "", "hajimemashite. maria to mōshimasu. furansu kara kimashita."),
              ("はじめまして。マリアさんです。", "", False, "On n'ajoute jamais さん à son propre nom.", "hajimemashite. maria-san desu."),
              ("はじめまして。マリアは名前です。", "Maria est un nom.", False, "Construction peu naturelle. Dites マリアです ou マリアと申します (plus poli).", "hajimemashite. maria wa namae desu.")),
           npc("日本語が上手ですね！", "Votre japonais est très bon !", "nihongo ga jōzu desu ne!"),
           me("Répondez au compliment.",
              ("いいえ、まだまだです。", "Oh non, j'ai encore beaucoup à apprendre.", True, "", "iie, madamada desu."),
              ("はい、とても上手です。", "Oui, il est très bon.", False, "Accepter le compliment ainsi paraît vaniteux. La réponse attendue est modeste.", "hai, totemo jōzu desu."),
              ("上手ですね。", "Il est bon, n'est-ce pas.", False, "Vous répétez le compliment : on minimise plutôt (まだまだです).", "jōzu desu ne.")),
           npc("お仕事は何ですか。", "Quel est votre travail ?", "o-shigoto wa nan desu ka."),
           me("Dites que vous êtes étudiante en japonais.",
              ("学生です。大学で日本語を勉強しています。", "Je suis étudiante, j'étudie le japonais à l'université.", True, "", "gakusei desu. daigaku de nihongo o benkyō shite imasu."),
              ("学生がいます。", "Il y a un étudiant.", False, "がいます veut dire « il y a ». Pour dire ce que vous êtes : 学生です.", "gakusei ga imasu."),
              ("大学を日本語で勉強です。", "", False, "Particules mélangées : le lieu prend で, la matière étudiée prend を (大学で日本語を勉強しています).", "daigaku o nihongo de benkyō desu.")),
           npc("そうですか。これからよろしくお願いします。", "Ah bon. Au plaisir de travailler ensemble.", "sō desu ka. korekara yoroshiku onegai shimasu."),
           me("Retournez la formule.",
              ("こちらこそ、よろしくお願いします。", "C'est moi qui vous remercie, au plaisir.", True, "", "kochira koso, yoroshiku onegai shimasu."),
              ("どうぞ、さようなら。", "Je vous en prie, au revoir.", False, "さようなら clôt la rencontre de façon définitive. On répond こちらこそ、よろしくお願いします.", "dōzo, sayōnara."))],
          [("〜と申します", "je m'appelle … (très poli)"), ("〜から来ました", "je viens de …"), ("まだまだです", "j'ai encore beaucoup à apprendre"),
           ("こちらこそ", "c'est moi qui… (retourner une politesse)")]),
]

ES = [
    scene("es-bar", "En el bar", "A1", "🍺", "Un bar de tapas à Madrid", "El camarero",
          "Une caña est une petite bière pression. À Grenade ou León, une tapa est souvent offerte avec chaque boisson. On mange volontiers debout au comptoir.",
          [npc("¡Hola! ¿Qué os pongo?", "Salut ! Qu'est-ce que je vous sers ?"),
           me("Commandez une bière et une tapa de tortilla.",
              ("Una caña y una tapa de tortilla, por favor.", "Une bière pression et une tapa de tortilla, s'il vous plaît.", True),
              ("¿Me pones una caña y una de tortilla?", "Tu me sers une bière et une (tapa) de tortilla ?", True),
              ("Tengo una caña y una tortilla.", "J'ai une bière et une tortilla.", False, "Tengo veut dire « j'ai ». Pour commander : una caña, por favor ou ¿me pones…?")),
           npc("¿Algo más?", "Autre chose ?"),
           me("Dites que c'est tout.",
              ("No, nada más, gracias.", "Non, rien d'autre, merci.", True),
              ("No, ninguno más.", "", False, "Ninguno remplace un nom dénombrable. Ici on dit nada más."),
              ("Sí, nada.", "Oui, rien.", False, "Contradictoire : la réponse naturelle est No, nada más.")),
           npc("Aquí tenéis.", "Voilà pour vous."),
           me("Demandez combien ça fait.",
              ("¿Cuánto es?", "Ça fait combien ?", True),
              ("¿Cuánto cuesta es?", "", False, "Deux verbes : soit ¿cuánto es?, soit ¿cuánto cuesta?"),
              ("¿Qué precio tienes?", "Quel prix as-tu ?", False, "Tournure peu naturelle. Au bar, on dit ¿Cuánto es? ou ¿Qué te debo?")),
           npc("Son tres euros con cincuenta.", "Ça fait trois euros cinquante.")],
          [("¿Qué os pongo?", "Qu'est-ce que je vous sers ?"), ("una caña", "une petite bière pression"), ("nada más", "rien d'autre"),
           ("¿Cuánto es?", "Ça fait combien ?")]),
    scene("es-estacion", "En la estación", "A1", "🚆", "La gare d'Atocha", "La taquillera",
          "Les trains grande vitesse (AVE) relient Madrid à Tolède en une demi-heure. Les billets s'achètent au guichet (taquilla) ou sur l'appli de la Renfe ; les voies s'appellent andenes.",
          [me("Demandez un billet pour Tolède.",
              ("Buenos días, un billete para Toledo, por favor.", "Bonjour, un billet pour Tolède, s'il vous plaît.", True),
              ("Buenos días, un billete por Toledo.", "", False, "La destination prend para, pas por (por = par, à travers)."),
              ("Buenos días, quiero ir Toledo.", "", False, "Il manque la préposition : ir a Toledo.")),
           npc("¿De ida y vuelta?", "Aller-retour ?"),
           me("Répondez : aller simple.",
              ("No, solo de ida.", "Non, aller simple seulement.", True),
              ("No, solo ir.", "", False, "On dit de ida (aller simple), pas ir (le verbe)."),
              ("Sí, ida solo.", "", False, "Si vous voulez un aller simple, la réponse est non : No, solo de ida.")),
           npc("Sale a las diez y cuarto del andén tres.", "Il part à dix heures et quart du quai 3."),
           me("Demandez combien de temps dure le trajet.",
              ("¿Cuánto tarda el viaje?", "Combien de temps dure le trajet ?", True),
              ("¿Cuándo tarda?", "", False, "Cuándo = quand. Pour une durée : ¿cuánto tarda?"),
              ("¿Cuánto tiempo hace el viaje?", "", False, "Hace + temps sert pour « il y a ». Pour la durée d'un trajet, on utilise tardar.")),
           npc("Unos treinta y cinco minutos.", "Environ trente-cinq minutes.")],
          [("un billete para…", "un billet pour…"), ("de ida y vuelta", "aller-retour"), ("el andén", "le quai"),
           ("¿Cuánto tarda?", "Combien de temps ça prend ?")]),
    scene("es-conocer", "Conocer a alguien", "A1", "🤝", "Une terrasse à Lavapiés", "Javier",
          "En Espagne on se salue par deux bises (dos besos), même la première fois. Vale et ¡qué guay! sont partout dans la conversation.",
          [npc("¡Hola! Soy Javier. ¿Y tú?", "Salut ! Moi c'est Javier. Et toi ?"),
           me("Présentez-vous (Claire, de Lyon).",
              ("Encantada, soy Claire. Soy de Lyon.", "Enchantée, je suis Claire. Je suis de Lyon.", True),
              ("Encantada, estoy Claire.", "", False, "Pour l'identité on utilise ser : soy Claire. Estar sert pour l'état ou le lieu."),
              ("Me llamo es Claire.", "", False, "Deux verbes : soit me llamo Claire, soit soy Claire.")),
           npc("¿Y qué haces en Madrid?", "Et tu fais quoi à Madrid ?"),
           me("Dites que vous êtes en Erasmus et étudiez l'histoire.",
              ("Estoy de Erasmus, estudio Historia.", "Je suis en Erasmus, j'étudie l'histoire.", True),
              ("Estudio a Historia.", "", False, "Pas de a devant une matière : estudio Historia (a s'utilise devant une personne)."),
              ("Hago de Erasmus.", "", False, "On dit estar de Erasmus (être en Erasmus).")),
           npc("¡Qué guay! ¿Te apetece tomar algo luego?", "Trop bien ! Ça te dit de prendre un verre plus tard ?"),
           me("Acceptez avec enthousiasme.",
              ("¡Vale, me apetece mucho!", "D'accord, ça me dit bien !", True),
              ("Sí, me gusta tú.", "", False, "Me gusta tú est incorrect (et ambigu !). Pour accepter : ¡vale! ou ¡me apetece!"),
              ("Vale, te apetezco.", "", False, "Te apetezco voudrait dire « je te fais envie ». Dites me apetece.")),
           npc("¡Genial! Te escribo luego.", "Génial ! Je t'écris plus tard.")],
          [("Encantado / Encantada", "enchanté(e)"), ("estar de Erasmus", "être en Erasmus"), ("¿Te apetece…?", "Ça te dit de… ?"),
           ("¡Qué guay!", "trop bien !")]),
]

IT = [
    scene("it-bar", "Al bar", "A1", "☕", "Un bar à Rome", "Il barista",
          "Le cappuccino se boit le matin, rarement après le repas. Boire au comptoir (al banco) coûte moins cher qu'à table, et dans certains bars on paie d'abord à la caisse avec le ticket (scontrino).",
          [npc("Buongiorno! Cosa prende?", "Bonjour ! Qu'est-ce que vous prenez ?"),
           me("Commandez un cappuccino et un croissant.",
              ("Un cappuccino e un cornetto, per favore.", "Un cappuccino et un croissant, s'il vous plaît.", True),
              ("Vorrei un cappuccino e un cornetto.", "Je voudrais un cappuccino et un croissant.", True),
              ("Ho un cappuccino e un cornetto.", "J'ai un cappuccino et un croissant.", False, "Ho veut dire « j'ai ». Pour commander : vorrei… ou un cappuccino, per favore.")),
           npc("Al banco o al tavolo?", "Au comptoir ou à table ?"),
           me("Dites : au comptoir.",
              ("Al banco, grazie.", "Au comptoir, merci.", True),
              ("In banco, grazie.", "", False, "On dit al banco (a + il)."),
              ("Sul banco, grazie.", "Sur le comptoir, merci.", False, "Sul banco voudrait dire « posé sur le comptoir ». L'expression est al banco.")),
           npc("Ecco a Lei.", "Voilà pour vous."),
           me("Demandez combien ça fait.",
              ("Quant'è?", "Ça fait combien ?", True),
              ("Quanto costa è?", "", False, "Deux verbes : soit quant'è?, soit quanto costa?"),
              ("Che prezzo hai?", "Quel prix as-tu ?", False, "Tournure peu naturelle et familière. Au bar : quant'è?")),
           npc("Due euro e cinquanta.", "Deux euros cinquante.")],
          [("Cosa prende?", "Qu'est-ce que vous prenez ?"), ("al banco", "au comptoir"), ("Quant'è?", "Ça fait combien ?"),
           ("Ecco a Lei", "Voilà pour vous")]),
    scene("it-stazione", "In stazione", "A1", "🚆", "La gare de Milano Centrale", "L'impiegato",
          "Les billets de train régional doivent être compostés (convalidare) dans les machines vertes ou jaunes avant de monter, sinon c'est l'amende. Les billets Frecciarossa à horaire fixe n'en ont pas besoin.",
          [me("Demandez un billet pour Florence.",
              ("Buongiorno, un biglietto per Firenze, per favore.", "Bonjour, un billet pour Florence, s'il vous plaît.", True),
              ("Un biglietto a Firenze.", "", False, "La destination d'un billet prend per : un biglietto per Firenze."),
              ("Vorrei andare Firenze.", "", False, "Il manque la préposition : andare a Firenze.")),
           npc("Solo andata o andata e ritorno?", "Aller simple ou aller-retour ?"),
           me("Choisissez l'aller-retour.",
              ("Andata e ritorno, grazie.", "Aller-retour, merci.", True),
              ("Andare e ritornare.", "", False, "On utilise les noms andata e ritorno, pas les verbes."),
              ("Solo andata e ritorno.", "", False, "Contradictoire : solo andata = aller simple.")),
           npc("Il treno parte alle nove dal binario cinque.", "Le train part à neuf heures du quai 5."),
           me("Demandez s'il faut composter le billet.",
              ("Devo convalidare il biglietto?", "Je dois composter le billet ?", True),
              ("Devo pagare il binario?", "Je dois payer le quai ?", False, "Il binario est le quai. Le verbe pour composter est convalidare."),
              ("Devo validare il treno?", "", False, "C'est le billet que l'on composte : convalidare il biglietto.")),
           npc("Sì, se è un regionale. Lo convalidi prima di salire.", "Oui, si c'est un régional. Compostez-le avant de monter.")],
          [("un biglietto per…", "un billet pour…"), ("andata e ritorno", "aller-retour"), ("il binario", "le quai"),
           ("convalidare il biglietto", "composter le billet")]),
    scene("it-amicizia", "Fare amicizia", "A1", "🍹", "Un aperitivo à Bologne", "Chiara",
          "L'aperitivo, vers 18h30–20h30, est un vrai rituel : un spritz ou un verre accompagné d'amuse-bouches, parfois un buffet entier.",
          [npc("Ciao! Io sono Chiara. Tu come ti chiami?", "Salut ! Moi c'est Chiara. Et toi, comment tu t'appelles ?"),
           me("Présentez-vous (Hugo).",
              ("Piacere, mi chiamo Hugo.", "Enchanté, je m'appelle Hugo.", True),
              ("Piacere, io chiamo Hugo.", "", False, "Chiamarsi est pronominal : mi chiamo Hugo."),
              ("Piacere, sono chiamato Hugo.", "", False, "Forme passive incorrecte ici. Dites mi chiamo Hugo ou sono Hugo.")),
           npc("Di dove sei?", "Tu viens d'où ?"),
           me("Dites que vous êtes français, de Marseille.",
              ("Sono francese, di Marsiglia.", "Je suis français, de Marseille.", True),
              ("Sono di francese.", "", False, "Di + ville : sono di Marsiglia. La nationalité s'emploie sans di : sono francese."),
              ("Ho francese.", "", False, "Ho veut dire « j'ai ». La nationalité se dit avec essere : sono francese.")),
           npc("Ti va di prendere un aperitivo stasera?", "Ça te dit de prendre un apéritif ce soir ?"),
           me("Acceptez et demandez l'heure.",
              ("Volentieri! A che ora?", "Avec plaisir ! À quelle heure ?", True),
              ("Sì, mi piaci!", "Oui, tu me plais !", False, "Mi piaci = « tu me plais » : sans doute pas le message voulu ! Dites volentieri!"),
              ("Volentieri, alle ore?", "", False, "Pour demander l'heure : a che ora?")),
           npc("Alle sette, in piazza Santo Stefano!", "À sept heures, piazza Santo Stefano !")],
          [("Piacere", "enchanté(e)"), ("Di dove sei?", "Tu viens d'où ?"), ("Ti va di…?", "Ça te dit de… ?"),
           ("Volentieri!", "Avec plaisir !")]),
]


def check(scenes):
    for s in scenes:
        assert s["turns"] and s["expressions"], s["id"]
        for t in s["turns"]:
            if t["who"] == "me":
                assert any(c["ok"] for c in t["choices"]), (s["id"], t["task"])
                assert all(c["ok"] or c["why"] for c in t["choices"]), (s["id"], t["task"])


if __name__ == "__main__":
    data = {"ja": JA, "es": ES, "it": IT}
    for v in data.values():
        check(v)
    out = os.path.join(os.path.dirname(__file__), "..", "assets", "content", "dialogues.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print("dialogues.json:", {k: len(v) for k, v in data.items()})
