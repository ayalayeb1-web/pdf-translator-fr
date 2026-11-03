// Builds the activities of a lesson and checks answers. Pure Dart, fully unit-tested.
import 'dart:math';

import '../content/models.dart';

enum StepKind { meaning, listen, typeIt, fill, order, reading }

class PracticeStep {
  PracticeStep({required this.kind, required this.prompt, required this.answer, this.options = const [], this.item, this.audio, this.hint = '', this.tiles = const []});
  final StepKind kind;
  final String prompt; // text shown to the learner
  final String answer; // the expected answer (for order: tiles joined with spaces)
  final List<String> options;
  final List<String> tiles; // order exercises, shuffled
  final Item? item; // item this step trains (for SRS)
  final String? audio; // text to speak for this step
  final String hint;

  String get instruction => switch (kind) {
        StepKind.meaning => 'Que signifie ce mot ?',
        StepKind.listen => 'Écoutez et choisissez ce que vous entendez',
        StepKind.typeIt => 'Écrivez-le',
        StepKind.fill => 'Complétez la phrase',
        StepKind.order => 'Remettez la phrase dans l’ordre',
        StepKind.reading => 'Répondez à partir du texte',
      };
}

class Practice {
  Practice(this.random);
  final Random random;

  List<T> _shuffled<T>(Iterable<T> xs) => xs.toList()..shuffle(random);

  List<String> _options(String correct, Iterable<String> pool, int n) {
    final others = _shuffled(pool.where((x) => x != correct).toSet()).take(n - 1);
    return _shuffled([correct, ...others]);
  }

  /// Activities for one lesson. [pool] supplies distractors from the whole course.
  List<PracticeStep> build(Lesson lesson, List<Item> pool, {required String lang}) {
    final typeTerm = lang == 'es';
    final sep = lang == 'ja' ? '' : ' ';
    final meanings = pool.map((i) => i.meaning).where((m) => m.isNotEmpty).toList();
    final terms = pool.map((i) => i.term).toList();
    final steps = <PracticeStep>[];
    switch (lesson.type) {
      case LessonType.kana:
      case LessonType.kanji:
      case LessonType.vocab:
        final items = lesson.items;
        final local = lesson.type == LessonType.kana ? items.map((i) => i.romaji).toList() : items.map((i) => i.meaning).toList();
        for (final it in items) {
          final m = lesson.type == LessonType.kana ? it.romaji : it.meaning;
          steps.add(PracticeStep(
            kind: StepKind.meaning,
            prompt: it.term,
            answer: m,
            options: _options(m, local.length >= 4 ? local : [...local, ...meanings], 4),
            item: it,
            audio: it.term,
            hint: it.hint,
          ));
        }
        for (final it in _shuffled(items).take((items.length / 2).ceil())) {
          final localTerms = items.map((i) => i.term).toList();
          steps.add(PracticeStep(
            kind: StepKind.listen,
            prompt: '',
            answer: it.term,
            options: _options(it.term, localTerms.length >= 4 ? localTerms : [...localTerms, ...terms], 4),
            item: it,
            audio: it.term,
          ));
        }
        for (final it in _shuffled(items).take(min(3, items.length))) {
          final expected = typeTerm ? it.term : it.romaji;
          steps.add(PracticeStep(
            kind: StepKind.typeIt,
            prompt: lesson.type == LessonType.kana ? 'Écrivez en rōmaji : ${it.term}' : 'Écrivez « ${it.meaning} »${typeTerm ? '' : ' en rōmaji'}',
            answer: expected,
            item: it,
            audio: it.term,
          ));
        }
        // interleave: never two identical kinds on the same item back to back
        final meaning = steps.where((s) => s.kind == StepKind.meaning).toList();
        final rest = _shuffled(steps.where((s) => s.kind != StepKind.meaning));
        return [...meaning, ...rest];
      case LessonType.grammar:
        for (final e in lesson.exercises) {
          if (e.isOrder) {
            steps.add(PracticeStep(kind: StepKind.order, prompt: e.meaning, answer: e.order.join(' '), tiles: _shuffled(e.order), audio: e.order.join(sep)));
          } else if (e.fill != null && e.answer != null) {
            steps.add(PracticeStep(
              kind: StepKind.fill,
              prompt: e.fill!,
              answer: e.answer!,
              options: _shuffled(e.options),
              hint: e.meaning,
              audio: e.fill!.replaceAll('＿', e.answer!),
            ));
          }
        }
        return steps;
      case LessonType.reading:
        for (final q in lesson.questions) {
          steps.add(PracticeStep(kind: StepKind.reading, prompt: q.q, answer: q.answer, options: _shuffled(q.options)));
        }
        return steps;
    }
  }
}

/// Answer checking that is forgiving about things that are not the point of the exercise
/// (case, spaces, punctuation, long-vowel spelling in rōmaji, missing Spanish accents)
/// and tells the learner when it forgave something.
class AnswerCheck {
  AnswerCheck(this.correct, {this.note});
  final bool correct;
  final String? note;

  static String _basic(String s) => s
      .toLowerCase()
      .trim()
      .replaceAll(RegExp(r'[\s\.,!\?¡¿。、！？「」・\-’\x27"]'), '');

  /// Long vowels are spelled many ways in rōmaji (ō, ou, oo, o): compare them collapsed.
  static String _romaji(String s) => _basic(s)
      .replaceAll('ā', 'a')
      .replaceAll('ī', 'i')
      .replaceAll('ū', 'u')
      .replaceAll('ē', 'e')
      .replaceAll('ō', 'o')
      .replaceAll('ou', 'o')
      .replaceAllMapped(RegExp(r'([aeiou])\1+'), (m) => m[1]!);

  static String stripAccents(String s) {
    const from = 'áéíóúüñÁÉÍÓÚÜÑ';
    const to = 'aeiouunAEIOUUN';
    final b = StringBuffer();
    for (final ch in s.split('')) {
      final i = from.indexOf(ch);
      b.write(i >= 0 ? to[i] : ch);
    }
    return b.toString();
  }

  static AnswerCheck check(String given, String expected, {required String lang}) {
    if (given.trim().isEmpty) return AnswerCheck(false);
    // a slash-separated expectation ("ichi / hito") accepts any of its parts
    final variants = expected.split('/').map((v) => v.trim()).where((v) => v.isNotEmpty).toList();
    for (final v in variants.isEmpty ? [expected] : variants) {
      if (_basic(given) == _basic(v)) return AnswerCheck(true);
      if (lang == 'ja' && _romaji(given) == _romaji(v)) return AnswerCheck(true);
      if (lang == 'es' && stripAccents(_basic(given)) == stripAccents(_basic(v))) {
        return AnswerCheck(true, note: 'Accepté — attention aux accents : « $v »');
      }
    }
    return AnswerCheck(false);
  }
}
