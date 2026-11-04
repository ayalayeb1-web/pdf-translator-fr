// Course content model. Content ships as JSON assets (assets/content/<lang>.json),
// produced from the hand-written course by tools/export-content.mjs.
import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

enum LessonType { kana, kanji, vocab, grammar, reading }

class StudyLanguage {
  const StudyLanguage({
    required this.code,
    required this.locale,
    required this.name,
    required this.nativeName,
    required this.glyph,
    required this.examLabel,
    required this.regionNote,
  });

  final String code; // ja / es
  final String locale; // BCP-47 tag used for speech
  final String name;
  final String nativeName;
  final String glyph;
  final String examLabel;
  final String regionNote;

  static const ja = StudyLanguage(
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japonais',
    nativeName: '日本語',
    glyph: 'あ',
    examLabel: 'JLPT',
    regionNote: 'Japonais standard (Tokyo)',
  );
  static const es = StudyLanguage(
    code: 'es',
    locale: 'es-ES',
    name: 'Espagnol',
    nativeName: 'Español',
    glyph: 'ñ',
    examLabel: 'DELE',
    regionNote: 'Espagnol d’Espagne (castillan)',
  );
  static const it = StudyLanguage(
    code: 'it',
    locale: 'it-IT',
    name: 'Italien',
    nativeName: 'Italiano',
    glyph: 'è',
    examLabel: 'CILS',
    regionNote: 'Italien standard',
  );
  static const all = [ja, es, it];
  static StudyLanguage of(String code) => all.firstWhere((l) => l.code == code, orElse: () => ja);
}

class Item {
  Item({required this.id, required this.term, this.reading = '', this.romaji = '', required this.meaning});
  final String id;
  final String term;
  final String reading; // kana reading (kanji items)
  final String romaji;
  final String meaning;

  /// The pronunciation hint shown under the term, if it differs from the term itself.
  String get hint {
    final parts = <String>[];
    if (reading.isNotEmpty && reading != term) parts.add(reading);
    if (romaji.isNotEmpty && romaji != term) parts.add(romaji);
    return parts.join(' · ');
  }

  factory Item.fromJson(Map<String, dynamic> j) => Item(
        id: j['id'] as String,
        term: (j['jp'] ?? '') as String,
        reading: (j['kana'] ?? '') as String,
        romaji: (j['romaji'] ?? '') as String,
        meaning: (j['en'] ?? '') as String,
      );
}

class Example {
  Example(this.text, this.romaji, this.meaning);
  final String text, romaji, meaning;
}

class Exercise {
  Exercise({this.fill, this.options = const [], this.answer, this.order = const [], this.meaning = ''});
  final String? fill;
  final List<String> options;
  final String? answer;
  final List<String> order;
  final String meaning;
  bool get isOrder => order.isNotEmpty;

  factory Exercise.fromJson(Map<String, dynamic> j) => Exercise(
        fill: j['fill'] as String?,
        options: ((j['options'] ?? []) as List).cast<String>(),
        answer: j['answer'] as String?,
        order: ((j['order'] ?? []) as List).cast<String>(),
        meaning: (j['en'] ?? '') as String,
      );
}

class Token {
  Token(this.text, this.reading, this.meaning);
  final String text, reading, meaning;
}

class Question {
  Question(this.q, this.options, this.answer);
  final String q;
  final List<String> options;
  final String answer;
}

class Lesson {
  Lesson({
    required this.id,
    required this.title,
    required this.type,
    required this.levelId,
    required this.unitTitle,
    this.items = const [],
    this.point = '',
    this.explain = '',
    this.examples = const [],
    this.exercises = const [],
    this.tokens = const [],
    this.translation = '',
    this.questions = const [],
    this.written = true,
  });

  final String id, title, levelId, unitTitle;
  final LessonType type;
  final List<Item> items;
  final String point, explain, translation;
  final List<Example> examples;
  final List<Exercise> exercises;
  final List<Token> tokens;
  final List<Question> questions;

  /// False for syllabus entries (B1–C2) whose content has not been written yet.
  final bool written;

  String get typeLabel => switch (type) {
        LessonType.kana => 'Écriture',
        LessonType.kanji => 'Kanji',
        LessonType.vocab => 'Vocabulaire',
        LessonType.grammar => 'Grammaire',
        LessonType.reading => 'Lecture',
      };

  /// A concrete, checkable objective for the lesson.
  String get objective {
    switch (type) {
      case LessonType.kana:
        return 'Lire et reconnaître à l’oreille ${items.length} caractères : ${items.map((i) => i.term).join(' ')}';
      case LessonType.kanji:
        return 'Reconnaître ${items.length} kanji, leur sens et leur lecture';
      case LessonType.vocab:
        return 'Comprendre et prononcer ${items.length} mots du thème « $title »';
      case LessonType.grammar:
        return written ? 'Utiliser la structure « $point » dans une phrase' : 'Programme : $point';
      case LessonType.reading:
        return written ? 'Comprendre un court texte authentique et répondre à ${questions.length} questions' : 'Programme : $point';
    }
  }

  static LessonType _type(String t) => LessonType.values.firstWhere((e) => e.name == t, orElse: () => LessonType.vocab);

  factory Lesson.fromJson(Map<String, dynamic> j, String levelId, String unitTitle) {
    List<T> list<T>(String k, T Function(dynamic) f) => ((j[k] ?? []) as List).map(f).toList();
    return Lesson(
      id: j['id'] as String,
      title: (j['title'] ?? '') as String,
      type: _type((j['type'] ?? 'vocab') as String),
      levelId: levelId,
      unitTitle: unitTitle,
      items: list('items', (e) => Item.fromJson(e as Map<String, dynamic>)),
      point: (j['point'] ?? '') as String,
      explain: (j['explain'] ?? '') as String,
      examples: list('examples', (e) {
        final l = (e as List).cast<String>();
        return Example(l[0], l.length > 1 ? l[1] : '', l.length > 2 ? l[2] : '');
      }),
      exercises: list('exercises', (e) => Exercise.fromJson(e as Map<String, dynamic>)),
      tokens: list('tokens', (e) {
        final m = e as Map<String, dynamic>;
        return Token((m['t'] ?? '') as String, (m['r'] ?? '') as String, (m['en'] ?? '') as String);
      }),
      translation: (j['translation'] ?? '') as String,
      questions: list('questions', (e) {
        final m = e as Map<String, dynamic>;
        return Question(m['q'] as String, (m['options'] as List).cast<String>(), m['answer'] as String);
      }),
      written: j['ai'] != true,
    );
  }

  /// Every item the lesson teaches, including grammar examples' vocabulary.
  String get readingText => tokens.map((t) => t.text).join();
}

class Unit {
  Unit({required this.title, required this.icon, required this.lessons});
  final String title, icon;
  final List<Lesson> lessons;
}

class Level {
  Level({required this.id, required this.exam, required this.name, required this.desc, required this.units, required this.written});
  final String id, exam, name, desc;
  final List<Unit> units;
  final bool written;
  List<Lesson> get lessons => [for (final u in units) ...u.lessons];

  String get frenchName => const {
        'Beginner': 'Découverte',
        'Elementary': 'Survie',
        'Intermediate': 'Seuil',
        'Upper-intermediate': 'Avancé',
        'Advanced': 'Autonome',
        'Mastery': 'Maîtrise',
      }[name] ??
      name;
}

class Course {
  Course(this.language, this.levels);
  final StudyLanguage language;
  final List<Level> levels;

  List<Lesson> get lessons => [for (final l in levels) ...l.lessons];
  List<Lesson> get writtenLessons => lessons.where((l) => l.written).toList();
  Level level(String id) => levels.firstWhere((l) => l.id == id, orElse: () => levels.first);
  Lesson? lesson(String id) {
    for (final l in lessons) {
      if (l.id == id) return l;
    }
    return null;
  }

  /// All teachable items keyed by id (for reviews and the vocabulary list).
  Map<String, Item> get items => {
        for (final l in writtenLessons) ...{for (final i in l.items) i.id: i},
      };

  static Course fromJson(Map<String, dynamic> j) {
    final lang = StudyLanguage.of(j['lang'] as String);
    final levels = (j['levels'] as List).map((raw) {
      final l = raw as Map<String, dynamic>;
      final id = l['id'] as String;
      final units = (l['units'] as List).map((ru) {
        final u = ru as Map<String, dynamic>;
        final title = (u['title'] ?? '') as String;
        return Unit(
          title: title,
          icon: (u['icon'] ?? '') as String,
          lessons: (u['lessons'] as List).map((e) => Lesson.fromJson(e as Map<String, dynamic>, id, title)).toList(),
        );
      }).toList();
      return Level(
        id: id,
        exam: (l['jlpt'] ?? '') as String,
        name: (l['name'] ?? '') as String,
        desc: (l['desc'] ?? '') as String,
        units: units,
        written: l['ai'] != true,
      );
    }).toList();
    return Course(lang, levels);
  }

  static Future<Course> load(String code) async {
    final raw = await rootBundle.loadString('assets/content/$code.json');
    return fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }
}
