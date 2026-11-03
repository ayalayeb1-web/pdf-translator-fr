import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/app_state.dart';
import 'ui/screens/onboarding.dart';
import 'ui/shell.dart';
import 'ui/theme.dart';
import 'ui/widgets.dart';

class VoyaApp extends StatefulWidget {
  const VoyaApp({super.key, required this.boot, this.minSplash = const Duration(milliseconds: 1100)});
  final Future<AppState> Function() boot;
  final Duration minSplash;
  @override
  State<VoyaApp> createState() => _VoyaAppState();
}

class _VoyaAppState extends State<VoyaApp> {
  AppState? state;
  Object? error;

  @override
  void initState() {
    super.initState();
    Future.wait([widget.boot(), Future<void>.delayed(widget.minSplash)]).then((r) {
      if (mounted) setState(() => state = r[0] as AppState);
    }, onError: (Object e) {
      if (mounted) setState(() => error = e);
    });
  }

  @override
  Widget build(BuildContext context) {
    final s = state;
    if (s == null) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: buildTheme('ja', Brightness.light),
        darkTheme: buildTheme('ja', Brightness.dark),
        home: Splash(error: error),
      );
    }
    return AppScope(
      state: s,
      child: ListenableBuilder(
        listenable: s,
        builder: (context, _) => MaterialApp(
          title: 'Voya',
          debugShowCheckedModeBanner: false,
          themeMode: s.themeMode,
          theme: buildTheme(s.lang, Brightness.light),
          darkTheme: buildTheme(s.lang, Brightness.dark),
          themeAnimationDuration: Tokens.slow,
          locale: const Locale('fr'),
          supportedLocales: const [Locale('fr'), Locale('en')],
          localizationsDelegates: GlobalMaterialLocalizations.delegates,
          home: s.firstRun ? const Onboarding() : const Shell(),
        ),
      ),
    );
  }
}

/// In-app splash: the Voya path draws itself while the database and courses load.
class Splash extends StatelessWidget {
  const Splash({super.key, this.error});
  final Object? error;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF151925),
      body: Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: const Duration(milliseconds: 900),
            curve: Curves.easeInOutCubic,
            builder: (_, v, _) => VoyaMark(size: 132, progress: v, tile: false),
          ),
          const SizedBox(height: 8),
          const Text('Voya', style: TextStyle(fontFamily: Tokens.display, fontSize: 40, fontWeight: FontWeight.w500, color: Color(0xFFF6F2EA), letterSpacing: -0.5)),
          const SizedBox(height: 6),
          Text(
            error == null ? 'Japonais · Espagnol' : 'Impossible de démarrer : $error',
            style: const TextStyle(fontFamily: Tokens.ui, fontSize: 13, color: Color(0xFF8D909A), fontWeight: FontWeight.w600, letterSpacing: 1.2),
          ),
        ]),
      ),
    );
  }
}
