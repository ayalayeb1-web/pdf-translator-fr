// Extra A1/A2 content: more units, reading passages and the Anime Japanese bonus unit.
// In reading texts, underscores inside {…} stand for spaces.
function insertUnitAfter(units, afterTitle, unit) {
  const i = units.findIndex(u => u.title === afterTitle);
  units.splice(i < 0 ? units.length : i + 1, 0, unit);
}
const unitNamed = (units, title) => units.find(u => u.title === title);

// ---------- A1 ----------
unitNamed(A1_UNITS, "Hello!").lessons.push(
  readingLesson("a1-r-intro", "Reading: Maria's introduction",
    "はじめまして{nice_to_meet_you} 。 わたし{I} は{(topic)} マリア{Maria} です{am} 。 フランス人[フランスじん]{French_person} です{am} 。 学生[がくせい]{student} です{am} 。 大学[だいがく]{university} で{at} 日本語[にほんご]{Japanese} を{(object)} 勉強します[べんきょうします]{study} 。 よろしくおねがいします{please_treat_me_well} 。",
    "Nice to meet you. I'm Maria. I'm French. I'm a student. I study Japanese at university. Please treat me well.",
    [
      ["Where is Maria from?", ["France", "Japan", "America", "China"], "France"],
      ["What does Maria do?", ["She's a student", "She's a teacher", "She's a doctor", "She works at a company"], "She's a student"],
      ["What does she study?", ["Japanese", "French", "English", "Math"], "Japanese"],
    ]),
);

insertUnitAfter(A1_UNITS, "Numbers & Time", { title: "Daily Life", icon: "☀️", lessons: [
  vocabLesson("a1-routine", "Daily routine", [
    ["起きます", "okimasu", "to get up", "おきます"],
    ["寝ます", "nemasu", "to go to bed / sleep", "ねます"],
    ["働きます", "hatarakimasu", "to work", "はたらきます"],
    ["勉強します", "benkyou shimasu", "to study", "べんきょうします"],
    ["休みます", "yasumimasu", "to rest / take a day off", "やすみます"],
    ["遊びます", "asobimasu", "to play / hang out", "あそびます"],
    ["会います", "aimasu", "to meet", "あいます"],
    ["話します", "hanashimasu", "to speak", "はなします"],
  ]),
  grammarLesson("a1-ni-kara-made", "At, from, until", "〜に (time) / 〜から〜まで",
    "に marks a specific time: 7時に起きます = I get up at 7. から = from, まで = until: 9時から5時まで働きます. Words like 毎日, 今日 and 明日 don't take に.",
    [
      ["毎朝、六時に起きます。", "maiasa, rokuji ni okimasu.", "I get up at six every morning."],
      ["九時から五時まで働きます。", "kuji kara goji made hatarakimasu.", "I work from nine to five."],
      ["十一時に寝ます。", "juuichiji ni nemasu.", "I go to bed at eleven."],
    ],
    [
      { fill: "七時＿起きます。", options: ["に", "を", "で", "が"], answer: "に", en: "I get up at seven." },
      { fill: "九時＿五時まで働きます。", options: ["から", "まで", "に", "で"], answer: "から", en: "I work from nine to five." },
      { fill: "月曜日から金曜日＿学校に行きます。", options: ["まで", "から", "に", "を"], answer: "まで", en: "I go to school from Monday to Friday." },
      { order: ["まいあさ", "ろくじ", "に", "おきます"], en: "I get up at six every morning." },
    ]),
  vocabLesson("a1-colors", "Colors", [
    ["赤い", "akai", "red", "あかい"],
    ["青い", "aoi", "blue", "あおい"],
    ["白い", "shiroi", "white", "しろい"],
    ["黒い", "kuroi", "black", "くろい"],
    ["黄色い", "kiiroi", "yellow", "きいろい"],
    ["緑", "midori", "green", "みどり"],
  ]),
  kanjiLesson("a1-k-time", "Kanji: time", [
    ["時", "じ・とき", "ji / toki", "time, o'clock"],
    ["分", "ふん・ぶん・わ", "fun / bun / wa", "minute, part, divide"],
    ["半", "はん", "han", "half"],
    ["今", "いま・こん", "ima / kon", "now"],
    ["午", "ご", "go", "noon"],
    ["前", "まえ・ぜん", "mae / zen", "before, in front"],
    ["後", "あと・ご・うし", "ato / go / ushi", "after, behind"],
    ["週", "しゅう", "shuu", "week"],
  ]),
]});

insertUnitAfter(A1_UNITS, "Eat & Drink", { title: "Shopping", icon: "🛍️", lessons: [
  vocabLesson("a1-shop", "At the shop", [
    ["いくら", "ikura", "how much?"],
    ["円", "en", "yen", "えん"],
    ["百", "hyaku", "hundred", "ひゃく"],
    ["千", "sen", "thousand", "せん"],
    ["万", "man", "ten thousand", "まん"],
    ["店員", "ten'in", "shop clerk", "てんいん"],
    ["レジ", "reji", "cash register"],
    ["カード", "kaado", "card"],
  ]),
  vocabLesson("a1-count", "Counting things", [
    ["ひとつ", "hitotsu", "one (thing)"],
    ["ふたつ", "futatsu", "two (things)"],
    ["みっつ", "mittsu", "three (things)"],
    ["よっつ", "yottsu", "four (things)"],
    ["いつつ", "itsutsu", "five (things)"],
    ["いくつ", "ikutsu", "how many?"],
  ]),
  grammarLesson("a1-kudasai", "Buying things", "〜をください / 〜はいくらですか",
    "Ask for something with 〜をください (please give me). Add a number after を: りんごをみっつください. Ask the price with 〜はいくらですか.",
    [
      ["これはいくらですか。", "kore wa ikura desu ka.", "How much is this?"],
      ["三百円です。", "sanbyaku en desu.", "It's 300 yen."],
      ["りんごをふたつください。", "ringo o futatsu kudasai.", "Two apples, please."],
    ],
    [
      { fill: "このかばんは＿ですか。", options: ["いくら", "いくつ", "どこ", "なに"], answer: "いくら", en: "How much is this bag?" },
      { fill: "コーヒーを＿。", options: ["ください", "います", "あります", "です"], answer: "ください", en: "A coffee, please." },
      { fill: "りんごを＿ください。(3 things)", options: ["みっつ", "さん", "みつ", "さんつ"], answer: "みっつ", en: "Three apples, please." },
      { order: ["これ", "は", "いくら", "です", "か"], en: "How much is this?" },
    ]),
  kanjiLesson("a1-k-money", "Kanji: numbers & money", [
    ["百", "ひゃく", "hyaku", "hundred"],
    ["千", "せん", "sen", "thousand"],
    ["万", "まん", "man", "ten thousand"],
    ["円", "えん", "en", "yen, circle"],
    ["本", "ほん・もと", "hon / moto", "book, origin"],
  ]),
]});

unitNamed(A1_UNITS, "There Is…").lessons.push(
  kanjiLesson("a1-k-people", "Kanji: people", [
    ["男", "おとこ・だん", "otoko / dan", "man"],
    ["女", "おんな・じょ", "onna / jo", "woman"],
    ["子", "こ・し", "ko / shi", "child"],
    ["父", "ちち・ふ", "chichi / fu", "father"],
    ["母", "はは・ぼ", "haha / bo", "mother"],
    ["友", "とも・ゆう", "tomo / yuu", "friend"],
    ["名", "な・めい", "na / mei", "name"],
  ]),
);

unitNamed(A1_UNITS, "Past & Plans").lessons.push(
  kanjiLesson("a1-k-weather", "Kanji: nature & weather", [
    ["天", "てん", "ten", "heaven, sky"],
    ["気", "き", "ki", "spirit, air"],
    ["雨", "あめ・う", "ame / u", "rain"],
    ["花", "はな・か", "hana / ka", "flower"],
    ["空", "そら・くう", "sora / kuu", "sky, empty"],
    ["白", "しろ・はく", "shiro / haku", "white"],
    ["毎", "まい", "mai", "every"],
  ]),
  readingLesson("a1-r-weekend", "Reading: my weekend",
    "土曜日[どようび]{Saturday} に{on} 友だち[ともだち]{friend} と{with} 駅[えき]{station} の{'s} 近く[ちかく]{near} の{(of)} 店[みせ]{shop} へ{to} 行きました[いきました]{went} 。 そこ{there} で{at} ラーメン{ramen} を{(object)} 食べました[たべました]{ate} 。 とても{very} おいしかったです{was_delicious} 。 日曜日[にちようび]{Sunday} は{(topic)} 家[いえ]{home} で{at} 本[ほん]{book} を{(object)} 読みました[よみました]{read} 。",
    "On Saturday I went with a friend to a shop near the station. We ate ramen there. It was very delicious. On Sunday I read a book at home.",
    [
      ["Who did the writer go out with on Saturday?", ["A friend", "Their mother", "A teacher", "Nobody"], "A friend"],
      ["What did they eat?", ["Ramen", "Sushi", "Bread", "Fish"], "Ramen"],
      ["What did the writer do on Sunday?", ["Read a book at home", "Went to the station", "Watched a movie", "Went to school"], "Read a book at home"],
    ]),
);

A1_UNITS.push({ title: "Anime Japanese", icon: "🎌", lessons: [
  vocabLesson("a1-anime-1", "Anime reactions", [
    ["すごい", "sugoi", "amazing!"],
    ["やった", "yatta", "I did it! / yay!"],
    ["大丈夫", "daijoubu", "it's OK / are you OK?", "だいじょうぶ"],
    ["がんばって", "ganbatte", "do your best! / good luck!"],
    ["まじで", "majide", "seriously?!"],
    ["うそ", "uso", "no way! (lit. a lie)"],
    ["なに", "nani", "what?!"],
    ["ちょっと待って", "chotto matte", "wait a sec!", "ちょっとまって"],
  ]),
  vocabLesson("a1-anime-2", "Anime story words", [
    ["先輩", "senpai", "senior (at school/work)", "せんぱい"],
    ["後輩", "kouhai", "junior", "こうはい"],
    ["仲間", "nakama", "comrade / teammate", "なかま"],
    ["夢", "yume", "dream", "ゆめ"],
    ["約束", "yakusoku", "promise", "やくそく"],
    ["守る", "mamoru", "to protect", "まもる"],
    ["信じる", "shinjiru", "to believe", "しんじる"],
    ["絶対", "zettai", "absolutely / definitely", "ぜったい"],
  ]),
  grammarLesson("a1-anime-speech", "How anime characters talk", "俺・僕・ぞ・ぜ・わ",
    "Anime characters show personality through words for \"I\": 俺 (ore, rough male), 僕 (boku, gentle male), 私 (watashi, neutral/polite), うち (uchi, Kansai girls). Sentence endings add attitude: ぞ / ぜ sound tough and determined, わ sounds soft and feminine (in fiction). In real life, use わたし and です/ます with people you don't know well!",
    [
      ["俺は絶対にあきらめないぞ！", "ore wa zettai ni akiramenai zo!", "I'll never give up!"],
      ["僕が守るよ。", "boku ga mamoru yo.", "I'll protect you."],
      ["行くぜ、仲間たち！", "iku ze, nakama-tachi!", "Let's go, guys!"],
      ["きれいな花だわ。", "kirei na hana da wa.", "What a pretty flower."],
    ],
    [
      { fill: "＿は絶対にあきらめないぞ！(tough hero)", options: ["俺", "わたくし", "うち", "わし"], answer: "俺", en: "I'll never give up!" },
      { fill: "先輩、手伝って＿ありがとうございます。", options: ["くれて", "あげて", "もらって", "いて"], answer: "くれて", en: "Senpai, thank you for helping me." },
      { fill: "僕＿守るよ。", options: ["が", "を", "に", "で"], answer: "が", en: "I'll protect you." },
      { fill: "行く＿、仲間たち！(tough, determined)", options: ["ぜ", "わ", "の", "か"], answer: "ぜ", en: "Let's go, guys!" },
      { order: ["おれ", "は", "ぜったい", "に", "あきらめない", "ぞ"], en: "I'll never give up!" },
    ]),
]});

// ---------- A2 ----------
unitNamed(A2_UNITS, "Experiences").lessons.push(
  readingLesson("a2-r-kyoto", "Reading: a trip to Kyoto",
    "去年[きょねん]{last_year} の{'s} 夏[なつ]{summer} 、 家族[かぞく]{family} と{with} 京都[きょうと]{Kyoto} へ{to} 旅行しました[りょこうしました]{traveled} 。 古い[ふるい]{old} お寺[おてら]{temple} を{(object)} たくさん{many} 見ました[みました]{saw} 。 着物[きもの]{kimono} を{(object)} 着て[きて]{put_on_and} 写真[しゃしん]{photo} を{(object)} とりました{took} 。 京都[きょうと]{Kyoto} は{(topic)} 東京[とうきょう]{Tokyo} より{than} 静か[しずか]{quiet} で{and} 、 また{again} 行きたい[いきたい]{want_to_go} と{(quote)} 思います[おもいます]{I_think} 。",
    "Last summer I traveled to Kyoto with my family. We saw lots of old temples. We put on kimono and took photos. Kyoto is quieter than Tokyo, and I think I want to go again.",
    [
      ["When did the writer go to Kyoto?", ["Last summer", "Last winter", "Next year", "Yesterday"], "Last summer"],
      ["What did they wear for photos?", ["Kimono", "School uniforms", "Suits", "Raincoats"], "Kimono"],
      ["How does the writer describe Kyoto compared to Tokyo?", ["Quieter", "Bigger", "More expensive", "Noisier"], "Quieter"],
    ]),
);

unitNamed(A2_UNITS, "Reasons & Rules").lessons.push(
  readingLesson("a2-r-doctor", "Reading: at the doctor's",
    "昨日[きのう]{yesterday} から{since} 頭[あたま]{head} が{(subject)} 痛くて[いたくて]{hurts,_and} 、 熱[ねつ]{fever} も{also} あります{have} 。 病院[びょういん]{hospital} へ{to} 行ったら[いったら]{when_I_went} 、 医者[いしゃ]{doctor} に{by} 「 三日間[みっかかん]{for_three_days} 休まなければなりません[やすまなければなりません]{you_must_rest} 」 と{(quote)} 言われました[いわれました]{I_was_told} 。 だから{so} 、 今週[こんしゅう]{this_week} は{(topic)} 仕事[しごと]{work} に{to} 行きません[いきません]{won't_go} 。",
    "I've had a headache since yesterday, and I also have a fever. When I went to the hospital, the doctor told me, \"You must rest for three days.\" So I won't go to work this week.",
    [
      ["What are the writer's symptoms?", ["A headache and a fever", "A stomachache", "A toothache", "A cough"], "A headache and a fever"],
      ["How long must they rest?", ["Three days", "One week", "One day", "Two weeks"], "Three days"],
      ["Will they go to work this week?", ["No", "Yes", "Only on Monday", "Only in the morning"], "No"],
    ]),
);

A2_UNITS.push({ title: "Health & Body", icon: "🩺", lessons: [
  vocabLesson("a2-health", "Health", [
    ["頭", "atama", "head", "あたま"],
    ["おなか", "onaka", "stomach / belly"],
    ["歯", "ha", "tooth", "は"],
    ["熱", "netsu", "fever", "ねつ"],
    ["かぜ", "kaze", "a cold"],
    ["薬", "kusuri", "medicine", "くすり"],
    ["医者", "isha", "doctor", "いしゃ"],
    ["痛い", "itai", "painful / it hurts", "いたい"],
  ]),
  grammarLesson("a2-temo-ii", "Permission & prohibition", "〜てもいいです / 〜てはいけません",
    "te-form + もいいです = you may / it's OK to. te-form + はいけません = you must not. Ask permission with 〜てもいいですか.",
    [
      ["写真をとってもいいですか。", "shashin o totte mo ii desu ka.", "May I take a photo?"],
      ["ここでたばこを吸ってはいけません。", "koko de tabako o sutte wa ikemasen.", "You must not smoke here."],
      ["もう帰ってもいいですよ。", "mou kaette mo ii desu yo.", "You can go home now."],
    ],
    [
      { fill: "窓を開けて＿いいですか。", options: ["も", "は", "を", "が"], answer: "も", en: "May I open the window?" },
      { fill: "ここで写真をとって＿いけません。", options: ["は", "も", "が", "に"], answer: "は", en: "You must not take photos here." },
      { fill: "トイレに＿もいいですか。(行く)", options: ["行って", "行いて", "行んで", "行きて"], answer: "行って", en: "May I go to the toilet?" },
      { order: ["しゃしん", "を", "とっても", "いい", "です", "か"], en: "May I take a photo?" },
    ]),
  kanjiLesson("a2-k-health", "Kanji: health", [
    ["体", "からだ・たい", "karada / tai", "body"],
    ["病", "びょう・やまい", "byou / yamai", "illness"],
    ["院", "いん", "in", "institution"],
    ["薬", "くすり・やく", "kusuri / yaku", "medicine"],
    ["医", "い", "i", "doctor, medicine"],
    ["者", "しゃ・もの", "sha / mono", "person"],
    ["休", "やす・きゅう", "yasu / kyuu", "rest"],
  ]),
]});

A2_UNITS.push({ title: "Giving & Receiving", icon: "🎁", lessons: [
  vocabLesson("a2-gifts", "Gifts", [
    ["あげる", "ageru", "to give (to someone else)"],
    ["くれる", "kureru", "to give (to me / my group)"],
    ["もらう", "morau", "to receive"],
    ["プレゼント", "purezento", "present"],
    ["誕生日", "tanjoubi", "birthday", "たんじょうび"],
    ["お土産", "omiyage", "souvenir gift", "おみやげ"],
  ]),
  grammarLesson("a2-ageru", "Giving and receiving", "あげる・くれる・もらう",
    "あげる = I (or someone) give to someone else. くれる = someone gives to me or my group. もらう = I receive from someone (に or から marks the giver).",
    [
      ["友だちに花をあげました。", "tomodachi ni hana o agemashita.", "I gave flowers to a friend."],
      ["母がケーキをくれました。", "haha ga keeki o kuremashita.", "My mom gave me a cake."],
      ["先生に本をもらいました。", "sensei ni hon o moraimashita.", "I received a book from my teacher."],
    ],
    [
      { fill: "姉がプレゼントを＿。(to me)", options: ["くれました", "あげました", "もらいました", "ください"], answer: "くれました", en: "My older sister gave me a present." },
      { fill: "わたしは弟に本を＿。", options: ["あげました", "くれました", "もらいました", "いました"], answer: "あげました", en: "I gave my younger brother a book." },
      { fill: "友だち＿お土産をもらいました。", options: ["に", "を", "で", "へ"], answer: "に", en: "I got a souvenir from a friend." },
      { order: ["はは", "が", "ケーキ", "を", "くれました"], en: "My mom gave me a cake." },
    ]),
  kanjiLesson("a2-k-adj", "Kanji: describing words", [
    ["近", "ちか・きん", "chika / kin", "near"],
    ["遠", "とお・えん", "too / en", "far"],
    ["早", "はや・そう", "haya / sou", "early"],
    ["長", "なが・ちょう", "naga / chou", "long, chief"],
    ["新", "あたら・しん", "atara / shin", "new"],
    ["古", "ふる・こ", "furu / ko", "old"],
    ["高", "たか・こう", "taka / kou", "tall, expensive"],
  ]),
]});

// ---------- AI reading lessons for B1–C2 ----------
const AI_READING = {
  B1: ["b1-read", "Reading: a blog post", "an everyday blog post about a weekend or hobby"],
  B2: ["b2-read", "Reading: a news article", "a short news article about society or technology"],
  C1: ["c1-read", "Reading: an opinion column", "an opinion column (コラム) in written である style"],
  C2: ["c2-read", "Reading: literature", "a short literary passage with rich, natural description"],
};
