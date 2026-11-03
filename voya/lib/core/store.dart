// Local persistent database (SQLite through sqflite_common_ffi; the SQLite library itself is
// bundled by package:sqlite3's build hook, so it works on Windows, Linux, macOS, Android and iOS).
import 'dart:convert';
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'srs.dart';

class ActivityDay {
  ActivityDay(this.day, this.xp, this.seconds);
  final String day; // yyyy-mm-dd
  final int xp, seconds;
}

class VocabEntry {
  VocabEntry({required this.term, required this.reading, required this.meaning, required this.source, required this.addedAt});
  final String term, reading, meaning, source;
  final DateTime addedAt;
}

class Recording {
  Recording({required this.id, required this.text, required this.path, required this.at, this.verdict});
  final int id;
  final String text, path;
  final DateTime at;
  final String? verdict; // 'ok' | 'again' | null — the learner's own judgement, never a computed score
}

class Mistake {
  Mistake(this.itemId, this.prompt, this.given, this.expected, this.at);
  final String itemId, prompt, given, expected;
  final DateTime at;
}

String dayKey(DateTime d) => '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

class Store {
  Store._(this.db, this.path);
  final Database db;
  final String path;

  static const _schemaVersion = 1;

  /// Opens (and creates if needed) the database. [inMemory] is for tests.
  static Future<Store> open({bool inMemory = false, String? directory}) async {
    sqfliteFfiInit();
    final factory = databaseFactoryFfi;
    String path;
    if (inMemory) {
      path = inMemoryDatabasePath;
    } else {
      final dir = directory ?? (await getApplicationSupportDirectory()).path;
      await Directory(dir).create(recursive: true);
      path = p.join(dir, 'voya.db');
    }
    final db = await factory.openDatabase(
      path,
      options: OpenDatabaseOptions(
        version: _schemaVersion,
        onCreate: (db, v) async {
          final b = db.batch();
          b.execute('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
          b.execute('CREATE TABLE progress (lang TEXT NOT NULL, lesson_id TEXT NOT NULL, completed_at INTEGER NOT NULL, '
              'correct INTEGER NOT NULL, total INTEGER NOT NULL, PRIMARY KEY (lang, lesson_id))');
          b.execute('CREATE TABLE cards (lang TEXT NOT NULL, item_id TEXT NOT NULL, box INTEGER NOT NULL, due INTEGER NOT NULL, '
              'reps INTEGER NOT NULL DEFAULT 0, lapses INTEGER NOT NULL DEFAULT 0, last INTEGER, PRIMARY KEY (lang, item_id))');
          b.execute('CREATE TABLE vocab (lang TEXT NOT NULL, term TEXT NOT NULL, reading TEXT NOT NULL, meaning TEXT NOT NULL, '
              'source TEXT NOT NULL, added_at INTEGER NOT NULL, PRIMARY KEY (lang, term))');
          b.execute('CREATE TABLE activity (day TEXT NOT NULL, lang TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, '
              'seconds INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, lang))');
          b.execute('CREATE TABLE mistakes (id INTEGER PRIMARY KEY AUTOINCREMENT, lang TEXT NOT NULL, item_id TEXT NOT NULL, '
              'prompt TEXT NOT NULL, given TEXT NOT NULL, expected TEXT NOT NULL, at INTEGER NOT NULL)');
          b.execute('CREATE TABLE recordings (id INTEGER PRIMARY KEY AUTOINCREMENT, lang TEXT NOT NULL, text TEXT NOT NULL, '
              'path TEXT NOT NULL, at INTEGER NOT NULL, verdict TEXT)');
          b.execute('CREATE INDEX cards_due ON cards (lang, due)');
          await b.commit(noResult: true);
        },
      ),
    );
    return Store._(db, path);
  }

  Future<void> close() => db.close();

  // ---------- settings ----------
  Future<Map<String, String>> settings() async {
    final rows = await db.query('settings');
    return {for (final r in rows) r['key'] as String: r['value'] as String};
  }

  Future<void> setSetting(String key, String value) =>
      db.insert('settings', {'key': key, 'value': value}, conflictAlgorithm: ConflictAlgorithm.replace);

  // ---------- lesson progress ----------
  Future<Map<String, double>> completed(String lang) async {
    final rows = await db.query('progress', where: 'lang = ?', whereArgs: [lang]);
    return {for (final r in rows) r['lesson_id'] as String: (r['total'] as int) == 0 ? 1.0 : (r['correct'] as int) / (r['total'] as int)};
  }

  Future<void> completeLesson(String lang, String lessonId, int correct, int total) => db.insert(
        'progress',
        {'lang': lang, 'lesson_id': lessonId, 'completed_at': DateTime.now().millisecondsSinceEpoch, 'correct': correct, 'total': total},
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

  // ---------- spaced repetition ----------
  Future<SrsCard?> card(String lang, String itemId) async {
    final rows = await db.query('cards', where: 'lang = ? AND item_id = ?', whereArgs: [lang, itemId]);
    return rows.isEmpty ? null : _card(rows.first);
  }

  SrsCard _card(Map<String, Object?> r) => SrsCard(
        itemId: r['item_id'] as String,
        box: r['box'] as int,
        due: DateTime.fromMillisecondsSinceEpoch(r['due'] as int),
        reps: r['reps'] as int,
        lapses: r['lapses'] as int,
        last: r['last'] == null ? null : DateTime.fromMillisecondsSinceEpoch(r['last'] as int),
      );

  Future<List<SrsCard>> cards(String lang) async =>
      (await db.query('cards', where: 'lang = ?', whereArgs: [lang])).map(_card).toList();

  Future<List<SrsCard>> dueCards(String lang, DateTime now, {int limit = 40}) async {
    final rows = await db.query('cards',
        where: 'lang = ? AND due <= ?', whereArgs: [lang, now.millisecondsSinceEpoch], orderBy: 'lapses DESC, due ASC', limit: limit);
    return rows.map(_card).toList();
  }

  Future<void> saveCard(String lang, SrsCard c) => db.insert(
        'cards',
        {
          'lang': lang,
          'item_id': c.itemId,
          'box': c.box,
          'due': c.due.millisecondsSinceEpoch,
          'reps': c.reps,
          'lapses': c.lapses,
          'last': c.last?.millisecondsSinceEpoch,
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

  /// Records one answer on an item and reschedules it.
  Future<SrsCard> grade(String lang, String itemId, bool correct, {DateTime? now}) async {
    final t = now ?? DateTime.now();
    final c = (await card(lang, itemId)) ?? SrsCard.fresh(itemId, t);
    final next = Srs.grade(c, correct, t);
    await saveCard(lang, next);
    return next;
  }

  // ---------- mistakes ----------
  Future<void> logMistake(String lang, String itemId, String prompt, String given, String expected) => db.insert('mistakes', {
        'lang': lang,
        'item_id': itemId,
        'prompt': prompt,
        'given': given,
        'expected': expected,
        'at': DateTime.now().millisecondsSinceEpoch,
      });

  Future<List<Mistake>> recentMistakes(String lang, {int limit = 30}) async {
    final rows = await db.query('mistakes', where: 'lang = ?', whereArgs: [lang], orderBy: 'at DESC', limit: limit);
    return rows
        .map((r) => Mistake(r['item_id'] as String, r['prompt'] as String, r['given'] as String, r['expected'] as String,
            DateTime.fromMillisecondsSinceEpoch(r['at'] as int)))
        .toList();
  }

  // ---------- personal vocabulary ----------
  Future<List<VocabEntry>> vocab(String lang) async {
    final rows = await db.query('vocab', where: 'lang = ?', whereArgs: [lang], orderBy: 'added_at DESC');
    return rows
        .map((r) => VocabEntry(
              term: r['term'] as String,
              reading: r['reading'] as String,
              meaning: r['meaning'] as String,
              source: r['source'] as String,
              addedAt: DateTime.fromMillisecondsSinceEpoch(r['added_at'] as int),
            ))
        .toList();
  }

  Future<void> addVocab(String lang, String term, String reading, String meaning, String source) => db.insert(
        'vocab',
        {'lang': lang, 'term': term, 'reading': reading, 'meaning': meaning, 'source': source, 'added_at': DateTime.now().millisecondsSinceEpoch},
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );

  Future<void> removeVocab(String lang, String term) => db.delete('vocab', where: 'lang = ? AND term = ?', whereArgs: [lang, term]);

  // ---------- activity ----------
  Future<void> addActivity(String lang, {int xp = 0, int seconds = 0, DateTime? at}) async {
    final day = dayKey(at ?? DateTime.now());
    await db.rawInsert(
      'INSERT INTO activity (day, lang, xp, seconds) VALUES (?, ?, ?, ?) '
      'ON CONFLICT(day, lang) DO UPDATE SET xp = xp + excluded.xp, seconds = seconds + excluded.seconds',
      [day, lang, xp, seconds],
    );
  }

  Future<List<ActivityDay>> activity(String lang, {int days = 60}) async {
    final since = dayKey(DateTime.now().subtract(Duration(days: days)));
    final rows = await db.query('activity', where: 'lang = ? AND day >= ?', whereArgs: [lang, since], orderBy: 'day ASC');
    return rows.map((r) => ActivityDay(r['day'] as String, r['xp'] as int, r['seconds'] as int)).toList();
  }

  // ---------- recordings ----------
  Future<int> addRecording(String lang, String text, String path) =>
      db.insert('recordings', {'lang': lang, 'text': text, 'path': path, 'at': DateTime.now().millisecondsSinceEpoch});

  Future<void> setVerdict(int id, String verdict) => db.update('recordings', {'verdict': verdict}, where: 'id = ?', whereArgs: [id]);

  Future<List<Recording>> recordings(String lang, {String? text}) async {
    final rows = await db.query('recordings',
        where: text == null ? 'lang = ?' : 'lang = ? AND text = ?', whereArgs: text == null ? [lang] : [lang, text], orderBy: 'at DESC');
    return rows
        .map((r) => Recording(
              id: r['id'] as int,
              text: r['text'] as String,
              path: r['path'] as String,
              at: DateTime.fromMillisecondsSinceEpoch(r['at'] as int),
              verdict: r['verdict'] as String?,
            ))
        .toList();
  }

  // ---------- maintenance ----------
  Future<void> resetLanguage(String lang) async {
    for (final t in ['progress', 'cards', 'vocab', 'activity', 'mistakes', 'recordings']) {
      await db.delete(t, where: 'lang = ?', whereArgs: [lang]);
    }
  }

  /// Full JSON export of the learner's data (for backup or a future sync service).
  Future<String> exportJson() async {
    final out = <String, Object?>{'app': 'Voya', 'schema': _schemaVersion, 'exportedAt': DateTime.now().toIso8601String()};
    for (final t in ['settings', 'progress', 'cards', 'vocab', 'activity', 'mistakes', 'recordings']) {
      out[t] = await db.query(t);
    }
    return const JsonEncoder.withIndent('  ').convert(out);
  }
}
