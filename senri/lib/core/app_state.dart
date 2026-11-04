// Central application state. Plain ChangeNotifier: no framework lock-in, easy to port to mobile.
import 'dart:math';

import 'package:flutter/material.dart';

import '../audio/speech.dart';
import '../content/accent.dart';
import '../content/dialogue.dart';
import '../content/models.dart';
import '../platform/desktop.dart';
import 'srs.dart';
import 'store.dart';

enum Section { home, path, dialogues, review, vocabulary, speaking, settings }

class AppState extends ChangeNotifier {
  AppState({required this.store, required this.courses, required this.speech, required this.desktop, this.allDialogues = const {}, this.allAccent = const {}});

  final Store store;
  final Map<String, Course> courses;
  final Speech speech;
  final Desktop desktop;
  final Map<String, List<Dialogue>> allDialogues;
  final Map<String, List<AccentPoint>> allAccent;
  List<AccentPoint> get accentPoints => allAccent[lang] ?? const [];
  Dialogue? activeDialogue; // a conversation being played

  List<Dialogue> get dialogues => allDialogues[lang] ?? const [];

  Map<String, String> _settings = {};
  Map<String, double> completed = {};
  List<SrsCard> cards = [];
  List<ActivityDay> activity = [];
  List<VocabEntry> vocab = [];
  int dueCount = 0;
  Section section = Section.home;
  Lesson? activeLesson; // a lesson being played
  bool reviewing = false;

  // ---------- settings ----------
  String get lang => _settings['lang'] ?? 'ja';
  bool get onboarded => _settings['onboarded_$lang'] == '1' || _settings['onboarded'] == '1';
  bool get firstRun => _settings['onboarded'] != '1';
  String get levelId => _settings['level_$lang'] ?? 'A1';
  int get dailyMinutes => int.tryParse(_settings['minutes'] ?? '') ?? 10;
  String get goal => _settings['goal'] ?? 'voyage';
  bool get autoAdvance => _settings['auto'] != '0';
  bool get notifications => _settings['notify'] != '0';
  ThemeMode get themeMode => switch (_settings['theme']) { 'light' => ThemeMode.light, 'dark' => ThemeMode.dark, _ => ThemeMode.system };
  String? voiceFor(String l) => _settings['voice_$l'];
  double get speechRate => double.tryParse(_settings['rate'] ?? '') ?? 0.5;

  Course get course => courses[lang]!;
  StudyLanguage get language => course.language;
  Level get level => course.level(levelId);

  Future<void> set(String key, String value) async {
    _settings[key] = value;
    await store.setSetting(key, value);
    notifyListeners();
  }

  Future<void> load() async {
    _settings = await store.settings();
    speech.normalRate = speechRate;
    speech.slowRate = (speechRate * 0.64).clamp(0.15, 1.0);
    await speech.configure(language.locale, voiceFor(lang));
    await refresh();
  }

  Future<void> refresh() async {
    completed = await store.completed(lang);
    cards = await store.cards(lang);
    activity = await store.activity(lang);
    vocab = await store.vocab(lang);
    dueCount = cards.where((c) => !c.due.isAfter(DateTime.now())).length;
    notifyListeners();
  }

  Future<void> switchLanguage(String code) async {
    await set('lang', code);
    await speech.configure(language.locale, voiceFor(code));
    section = Section.home;
    await refresh();
  }

  void go(Section s) {
    if (inActivity) return; // finish or leave the activity first
    section = s;
    notifyListeners();
  }

  // ---------- learning flow ----------
  /// The lesson the learner should do next: first unfinished written lesson of the current level,
  /// then of the following levels.
  Lesson? get nextLesson {
    final levels = course.levels;
    final start = max(0, levels.indexWhere((l) => l.id == levelId));
    for (final l in levels.skip(start)) {
      for (final lesson in l.lessons) {
        if (lesson.written && !completed.containsKey(lesson.id)) return lesson;
      }
    }
    return null;
  }

  double levelProgress(Level l) {
    final ls = l.lessons.where((x) => x.written).toList();
    if (ls.isEmpty) return 0;
    return ls.where((x) => completed.containsKey(x.id)).length / ls.length;
  }

  bool get inActivity => activeLesson != null || reviewing || activeDialogue != null;

  void startDialogue(Dialogue d) {
    activeDialogue = d;
    notifyListeners();
  }

  void closeDialogue() {
    activeDialogue = null;
    refresh();
  }

  void startLesson(Lesson l) {
    if (!l.written) return;
    activeLesson = l;
    notifyListeners();
  }

  void closeLesson() {
    activeLesson = null;
    notifyListeners();
  }

  void startReview() {
    reviewing = true;
    notifyListeners();
  }

  void closeReview() {
    reviewing = false;
    refresh();
  }

  Future<void> finishLesson(Lesson l, int correct, int total, Duration spent) async {
    await store.completeLesson(lang, l.id, correct, total);
    await store.addActivity(lang, xp: 10 + correct * 2, seconds: spent.inSeconds);
    await refresh();
    if (todayMinutes >= dailyMinutes && notifications) {
      desktop.notify('Objectif du jour atteint', '$todayMinutes min de ${language.name.toLowerCase()} aujourd’hui. Bravo !');
    }
  }

  // ---------- stats (computed from real data only) ----------
  int get todayMinutes => ((activity.where((a) => a.day == dayKey(DateTime.now())).firstOrNull?.seconds ?? 0) / 60).round();

  int get streak {
    final days = activity.where((a) => a.seconds > 0 || a.xp > 0).map((a) => a.day).toSet();
    var d = DateTime.now();
    if (!days.contains(dayKey(d))) d = d.subtract(const Duration(days: 1));
    var n = 0;
    while (days.contains(dayKey(d))) {
      n++;
      d = d.subtract(const Duration(days: 1));
    }
    return n;
  }

  /// Active days in the current week (Monday → today).
  int get activeDaysThisWeek {
    final now = DateTime.now();
    final monday = DateTime(now.year, now.month, now.day).subtract(Duration(days: now.weekday - 1));
    return activity.where((a) => !DateTime.parse(a.day).isBefore(monday) && (a.seconds > 0 || a.xp > 0)).length;
  }

  int get masteredCount => cards.where((c) => c.mastered).length;
  List<SrsCard> get weakCards => (cards.where((c) => c.weak).toList()..sort((a, b) => b.lapses.compareTo(a.lapses)));

  Item? item(String id) => course.items[id];

  bool inVocab(String term) => vocab.any((v) => v.term == term);

  Future<void> toggleVocab(Item it, String source) async {
    if (inVocab(it.term)) {
      await store.removeVocab(lang, it.term);
    } else {
      await store.addVocab(lang, it.term, it.hint, it.meaning, source);
    }
    await refresh();
  }

  Future<void> resetLanguage() async {
    await store.resetLanguage(lang);
    await refresh();
  }
}

/// Makes [AppState] available to the widget tree.
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);
  static AppState of(BuildContext context) => context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
  static AppState read(BuildContext context) => context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
