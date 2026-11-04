// End-to-end scenario shared by the widget test (headless) and the integration test
// (real Windows/Linux window): onboarding → first lesson → result → every section.
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:senri/app.dart';
import 'package:senri/core/app_state.dart';
import 'package:senri/main.dart';
import 'package:senri/platform/desktop.dart';

Future<void> settle(WidgetTester t, [int frames = 12]) async {
  for (var i = 0; i < frames; i++) {
    await t.pump(const Duration(milliseconds: 100));
  }
}

/// Lets real asynchronous work (SQLite, platform channels) finish until [done] holds.
Future<void> waitFor(WidgetTester t, bool Function() done, {int tries = 60}) async {
  for (var i = 0; i < tries && !done(); i++) {
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 50)));
    await t.pump(const Duration(milliseconds: 50));
  }
}

Future<void> tapText(WidgetTester t, String text) async {
  final f = find.text(text);
  expect(f, findsWidgets, reason: 'missing "$text"');
  await t.ensureVisible(f.first);
  await t.tap(f.first, warnIfMissed: false);
  await settle(t);
}

final _shotKey = GlobalKey();

/// Saves a PNG of the app when SENRI_SHOTS points to a folder (used to review the real UI).
Future<void> shot(WidgetTester t, String name) async {
  final dir = Platform.environment['SENRI_SHOTS'];
  if (dir == null) return;
  await t.runAsync(() async {
    final b = _shotKey.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    final img = await b.toImage(pixelRatio: 1);
    final data = await img.toByteData(format: ui.ImageByteFormat.png);
    await File('$dir/$name.png').writeAsBytes(data!.buffer.asUint8List());
  });
}

Future<AppState> runFlow(WidgetTester t, {required Desktop desktop}) async {
  late AppState state;
  await t.pumpWidget(RepaintBoundary(
    key: _shotKey,
    child: SenriApp(
      minSplash: Duration.zero,
      boot: () async => state = await bootstrap(desktop, inMemory: true),
    ),
  ));
  for (var i = 0; i < 60 && find.text('Quelle langue voulez-vous apprendre ?').evaluate().isEmpty; i++) {
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 100)));
    await t.pump(const Duration(milliseconds: 50));
  }
  expect(find.text('Quelle langue voulez-vous apprendre ?'), findsOneWidget);

  // ---- onboarding
  await shot(t, '01-onboarding-langue');
  final flowLang = Platform.environment['SENRI_FLOW_LANG'] ?? 'es';
  await tapText(t, const {'es': 'Espagnol · Español', 'it': 'Italien · Italiano', 'ja': 'Japonais · 日本語'}[flowLang]!);
  await tapText(t, 'Continuer');
  await tapText(t, 'Je débute');
  await tapText(t, 'Continuer');
  await tapText(t, 'Voyager');
  await tapText(t, 'Continuer');
  await tapText(t, '10 minutes');
  await shot(t, '02-onboarding-rythme');
  await tapText(t, 'Commencer ma première leçon');
  await waitFor(t, () => state.activeLesson != null);
  await settle(t);
  expect(state.activeLesson, isNotNull);
  expect(state.lang, flowLang);

  // ---- lesson: discover, then practise until the result screen
  await shot(t, '03-lecon-decouverte');
  await tapText(t, 'Pratiquer');
  await settle(t);
  await shot(t, '04-lecon-exercice');
  var shotFeedback = false;
  for (var i = 0; i < 120 && find.text('LEÇON TERMINÉE').evaluate().isEmpty; i++) {
    final field = find.byType(TextField);
    if (find.text('Continuer').evaluate().isNotEmpty) {
      await t.tap(find.text('Continuer').first, warnIfMissed: false);
    } else if (field.evaluate().isNotEmpty) {
      await t.enterText(field.first, 'hola');
      await t.testTextInput.receiveAction(TextInputAction.done);
    } else {
      await t.sendKeyEvent(LogicalKeyboardKey.digit1);
    }
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 60)));
    await settle(t, 3);
    if (!shotFeedback && find.text('Pas tout à fait').evaluate().isNotEmpty) {
      shotFeedback = true;
      await shot(t, '05-lecon-correction');
    }
    await settle(t, 11);
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 30)));
  }
  await waitFor(t, () => state.completed.isNotEmpty);
  await settle(t);
  expect(find.text('LEÇON TERMINÉE'), findsOneWidget);
  await shot(t, '06-lecon-resultat');
  expect(state.completed.length, 1, reason: 'lesson stored in SQLite');
  expect(state.cards, isNotEmpty, reason: 'items scheduled for review');
  await tapText(t, 'Retour');

  // ---- every section through the keyboard shortcuts
  Future<void> ctrl(LogicalKeyboardKey k) async {
    await t.sendKeyDownEvent(LogicalKeyboardKey.controlLeft);
    await t.sendKeyEvent(k);
    await t.sendKeyUpEvent(LogicalKeyboardKey.controlLeft);
    await t.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 150)));
    await settle(t);
  }

  expect(find.text('CONTINUER MON APPRENTISSAGE'), findsOneWidget);
  await shot(t, '07-aujourdhui');
  await ctrl(LogicalKeyboardKey.digit2);
  expect(state.section, Section.path);
  expect(find.text('A2'), findsWidgets);
  await shot(t, '08-parcours');
  await ctrl(LogicalKeyboardKey.digit3);
  expect(find.text('Révisions'), findsWidgets);
  await shot(t, '09-revisions');
  await ctrl(LogicalKeyboardKey.digit4);
  expect(find.text('Mon vocabulaire'), findsWidgets);
  await shot(t, '10-vocabulaire');
  await ctrl(LogicalKeyboardKey.digit5);
  expect(find.text('Écouter · s’enregistrer · comparer'), findsOneWidget);
  await shot(t, '11-speaking-lab');
  await ctrl(LogicalKeyboardKey.comma);
  expect(find.text('Paramètres'), findsWidgets);
  await shot(t, '12-parametres');
  await ctrl(LogicalKeyboardKey.digit1);

  // ---- command palette
  await ctrl(LogicalKeyboardKey.keyK);
  expect(find.byType(TextField), findsOneWidget);
  await t.enterText(find.byType(TextField), 'hola');
  await settle(t);
  expect(find.text('hola'), findsWidgets);
  await shot(t, '13-recherche');
  await t.sendKeyEvent(LogicalKeyboardKey.escape);
  await settle(t);
  return state;
}
