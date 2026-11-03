import 'package:flutter/material.dart';

import 'app.dart';
import 'audio/speech.dart';
import 'content/models.dart';
import 'core/app_state.dart';
import 'core/store.dart';
import 'platform/desktop.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final desktop = await Desktop.init();
  runApp(VoyaApp(boot: () => bootstrap(desktop)));
}

/// Opens the database, loads both courses and the system voices.
Future<AppState> bootstrap(Desktop desktop, {bool inMemory = false}) async {
  final results = await Future.wait([
    Store.open(inMemory: inMemory),
    Course.load('ja'),
    Course.load('es'),
  ]);
  final speech = Speech();
  await speech.init();
  final state = AppState(
    store: results[0] as Store,
    courses: {'ja': results[1] as Course, 'es': results[2] as Course},
    speech: speech,
    desktop: desktop,
  );
  await state.load();
  if (state.onboarded && state.notifications && state.dueCount > 0) {
    desktop.notify('Révisions en attente', '${state.dueCount} carte${state.dueCount > 1 ? 's' : ''} à revoir en ${state.language.name.toLowerCase()}.');
  }
  return state;
}
