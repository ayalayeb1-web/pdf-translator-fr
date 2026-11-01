// Role-play scenarios for the Speak tab.
// Each turn: the partner says `npc`, and the learner should reply with one of `answers`.
// [japanese, romaji, english]
const SCENARIOS = [
  {
    id: "cafe", emoji: "☕", title: "At a café", level: "Beginner",
    goal: "Order a drink and pay.",
    partner: "Barista",
    turns: [
      { npc: ["いらっしゃいませ。ご注文は？", "irasshaimase. go-chuumon wa?", "Welcome. What would you like?"],
        answers: [["コーヒーをください", "koohii o kudasai", "A coffee, please."], ["おちゃをください", "ocha o kudasai", "Tea, please."]] },
      { npc: ["サイズはどうしますか？", "saizu wa dou shimasu ka?", "What size would you like?"],
        answers: [["Mサイズでおねがいします", "emu saizu de onegaishimasu", "Medium, please."], ["Sでおねがいします", "esu de onegaishimasu", "Small, please."]] },
      { npc: ["店内でお召し上がりですか？", "tennai de omeshiagari desu ka?", "For here?"],
        answers: [["はい、ここでたべます", "hai, koko de tabemasu", "Yes, I'll have it here."], ["テイクアウトでおねがいします", "teikuauto de onegaishimasu", "To go, please."]] },
      { npc: ["450円です。", "yonhyaku gojuu en desu.", "That's 450 yen."],
        answers: [["カードでいいですか", "kaado de ii desu ka", "Is card OK?"], ["はい、どうぞ", "hai, douzo", "Here you go."]] },
    ],
    outro: ["ありがとうございました！", "arigatou gozaimashita!", "Thank you very much!"],
  },
  {
    id: "intro", emoji: "🙋", title: "Introduce yourself", level: "Beginner",
    goal: "Meet someone new and say who you are.",
    partner: "New friend",
    turns: [
      { npc: ["はじめまして！おなまえは？", "hajimemashite! onamae wa?", "Nice to meet you! What's your name?"],
        answers: [["わたしはアレックスです", "watashi wa arekkusu desu", "I'm Alex."], ["はじめまして、アレックスです", "hajimemashite, arekkusu desu", "Nice to meet you, I'm Alex."]] },
      { npc: ["どこからきましたか？", "doko kara kimashita ka?", "Where are you from?"],
        answers: [["アメリカからきました", "amerika kara kimashita", "I'm from America."], ["フランスからきました", "furansu kara kimashita", "I'm from France."]] },
      { npc: ["にほんごをべんきょうしていますか？", "nihongo o benkyou shite imasu ka?", "Are you studying Japanese?"],
        answers: [["はい、べんきょうしています", "hai, benkyou shite imasu", "Yes, I'm studying."], ["はい、すこしだけ", "hai, sukoshi dake", "Yes, just a little."]] },
    ],
    outro: ["よろしくおねがいします！", "yoroshiku onegaishimasu!", "Nice to meet you! (Let's get along.)"],
  },
  {
    id: "directions", emoji: "🗺️", title: "Asking directions", level: "Beginner",
    goal: "Find the station.",
    partner: "Passer-by",
    turns: [
      { npc: ["はい、なんですか？", "hai, nan desu ka?", "Yes? Can I help?"],
        answers: [["すみません、えきはどこですか", "sumimasen, eki wa doko desu ka", "Excuse me, where is the station?"]] },
      { npc: ["まっすぐいって、みぎです。", "massugu itte, migi desu.", "Go straight, then it's on the right."],
        answers: [["とおいですか", "tooi desu ka", "Is it far?"], ["まっすぐですね", "massugu desu ne", "Straight, right?"]] },
      { npc: ["あるいて5分ぐらいですよ。", "aruite go-fun gurai desu yo.", "It's about five minutes on foot."],
        answers: [["ありがとうございます", "arigatou gozaimasu", "Thank you very much."]] },
    ],
    outro: ["いいえ、きをつけて！", "iie, ki o tsukete!", "No problem, take care!"],
  },
  {
    id: "restaurant", emoji: "🍜", title: "At a restaurant", level: "Elementary",
    goal: "Get a table, order and ask for the bill.",
    partner: "Server",
    turns: [
      { npc: ["なんめいさまですか？", "nanmei-sama desu ka?", "How many people?"],
        answers: [["ふたりです", "futari desu", "Two people."], ["ひとりです", "hitori desu", "Just one."]] },
      { npc: ["ご注文はおきまりですか？", "go-chuumon wa okimari desu ka?", "Are you ready to order?"],
        answers: [["ラーメンをひとつください", "raamen o hitotsu kudasai", "One ramen, please."], ["おすすめはなんですか", "osusume wa nan desu ka", "What do you recommend?"]] },
      { npc: ["おのみものは？", "onomimono wa?", "Anything to drink?"],
        answers: [["みずをください", "mizu o kudasai", "Water, please."], ["だいじょうぶです", "daijoubu desu", "I'm fine, thanks."]] },
      { npc: ["ほかになにかありますか？", "hoka ni nani ka arimasu ka?", "Anything else?"],
        answers: [["おかいけいおねがいします", "okaikei onegaishimasu", "The bill, please."]] },
    ],
    outro: ["ありがとうございました。またおこしください！", "arigatou gozaimashita. mata okoshi kudasai!", "Thank you. Please come again!"],
  },
  {
    id: "konbini", emoji: "🏪", title: "Convenience store", level: "Elementary",
    goal: "Buy a snack and answer the cashier's questions.",
    partner: "Cashier",
    turns: [
      { npc: ["あたためますか？", "atatamemasu ka?", "Shall I heat it up?"],
        answers: [["はい、おねがいします", "hai, onegaishimasu", "Yes, please."], ["いいえ、けっこうです", "iie, kekkou desu", "No, thank you."]] },
      { npc: ["ふくろはいりますか？", "fukuro wa irimasu ka?", "Do you need a bag?"],
        answers: [["いいえ、だいじょうぶです", "iie, daijoubu desu", "No, I'm fine."], ["はい、ください", "hai, kudasai", "Yes, please."]] },
      { npc: ["ポイントカードはおもちですか？", "pointo kaado wa omochi desu ka?", "Do you have a point card?"],
        answers: [["いいえ、もっていません", "iie, motte imasen", "No, I don't."]] },
    ],
    outro: ["ありがとうございました！", "arigatou gozaimashita!", "Thank you very much!"],
  },
];
