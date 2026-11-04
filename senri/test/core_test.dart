import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:senri/content/models.dart';
import 'package:senri/core/practice.dart';
import 'package:senri/core/srs.dart';
import 'package:senri/core/store.dart';

Course load(String code) => Course.fromJson(jsonDecode(File('assets/content/$code.json').readAsStringSync()) as Map<String, dynamic>);

void main() {
  group('content', () {
    for (final code in ['ja', 'es', 'it']) {
      test('$code course parses with written A1/A2 and syllabus B1+', () {
        final c = load(code);
        expect(c.levels.map((l) => l.id), ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
        expect(c.level('A1').written, isTrue);
        expect(c.level('B1').written, isFalse);
        expect(c.writtenLessons.length, greaterThan(30));
        for (final l in c.writtenLessons) {
          expect(l.objective, isNotEmpty);
          final steps = Practice(Random(1)).build(l, c.items.values.toList(), lang: code);
          expect(steps, isNotEmpty, reason: l.id);
          for (final s in steps) {
            if (s.options.isNotEmpty) expect(s.options, contains(s.answer), reason: '${l.id} ${s.prompt}');
            if (s.kind == StepKind.order) expect(s.tiles.join(' ').length, s.answer.length);
          }
        }
      });
    }
  });

  group('answer check', () {
    test('Japanese romaji is forgiving about long vowels, case and spaces', () {
      expect(AnswerCheck.check('Arigato', 'arigatou', lang: 'ja').correct, isTrue);
      expect(AnswerCheck.check('ohayō gozaimasu', 'ohayou gozaimasu', lang: 'ja').correct, isTrue);
      expect(AnswerCheck.check('hito', 'ichi / hito', lang: 'ja').correct, isTrue);
      expect(AnswerCheck.check('sayonara', 'konnichiwa', lang: 'ja').correct, isFalse);
    });
    test('Spanish accepts missing accents but says so', () {
      final r = AnswerCheck.check('adios', 'adiós', lang: 'es');
      expect(r.correct, isTrue);
      expect(r.note, contains('adiós'));
      expect(AnswerCheck.check('manana', 'mañana', lang: 'es').correct, isTrue);
      expect(AnswerCheck.check('¡Hola!', 'hola', lang: 'es').note, isNull);
      expect(AnswerCheck.check('', 'hola', lang: 'es').correct, isFalse);
    });
    test('Italian accepts missing accents but says so', () {
      final r = AnswerCheck.check('caffe', 'il caffè', lang: 'it');
      expect(r.correct, isFalse); // the article is part of the expected answer
      final ok = AnswerCheck.check('lunedi', 'lunedì', lang: 'it');
      expect(ok.correct, isTrue);
      expect(ok.note, contains('lunedì'));
      expect(AnswerCheck.check('perché', 'perché', lang: 'it').note, isNull);
    });
  });

  group('srs', () {
    final t0 = DateTime(2026, 1, 1, 12);
    test('correct answers climb boxes and space out reviews', () {
      var c = SrsCard.fresh('x', t0);
      c = Srs.grade(c, true, t0);
      expect(c.box, 1);
      expect(c.due, t0.add(const Duration(days: 1)));
      c = Srs.grade(c, true, t0);
      expect(c.box, 2);
    });
    test('a mistake resets the card, counts a lapse and brings it back in 10 minutes', () {
      var c = SrsCard(itemId: 'x', box: 4, due: t0);
      c = Srs.grade(c, false, t0);
      expect(c.box, 0);
      expect(c.lapses, 1);
      expect(c.due, t0.add(const Duration(minutes: 10)));
      c = Srs.grade(c, false, t0);
      expect(c.weak, isTrue);
    });
  });

  group('store (SQLite)', () {
    late Store s;
    setUp(() async => s = await Store.open(inMemory: true));
    tearDown(() => s.close());

    test('settings, progress, cards, vocab and activity persist', () async {
      await s.setSetting('lang', 'es');
      expect((await s.settings())['lang'], 'es');
      await s.completeLesson('es', 'a1-ser', 4, 5);
      expect((await s.completed('es'))['a1-ser'], 0.8);
      await s.grade('es', 'vocab:hola', false);
      final due = await s.dueCards('es', DateTime.now().add(const Duration(minutes: 11)));
      expect(due.single.lapses, 1);
      await s.addVocab('es', 'hola', '', 'hello', 'Saludos');
      await s.addVocab('es', 'hola', '', 'hello', 'Saludos'); // no duplicate
      expect((await s.vocab('es')).length, 1);
      await s.addActivity('es', xp: 10, seconds: 60);
      await s.addActivity('es', xp: 5, seconds: 30);
      final a = await s.activity('es');
      expect(a.single.seconds, 90);
      expect(a.single.xp, 15);
      final export = jsonDecode(await s.exportJson()) as Map<String, dynamic>;
      expect((export['vocab'] as List).length, 1);
      await s.resetLanguage('es');
      expect(await s.completed('es'), isEmpty);
    });

    test('database file survives reopening', () async {
      final dir = await Directory.systemTemp.createTemp('senri');
      final a = await Store.open(directory: dir.path);
      await a.completeLesson('ja', 'hira-0', 5, 5);
      await a.close();
      final b = await Store.open(directory: dir.path);
      expect((await b.completed('ja')).keys, contains('hira-0'));
      await b.close();
      await dir.delete(recursive: true);
    });
  });
}
