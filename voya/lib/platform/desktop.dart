// Desktop integration (window, full screen, native notifications), isolated so that the
// Android / iOS builds simply get no-ops here.
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:local_notifier/local_notifier.dart';
import 'package:window_manager/window_manager.dart';

class Desktop {
  Desktop._(this.enabled);
  final bool enabled;
  bool _notifierReady = false;

  static bool get isDesktop => Platform.isWindows || Platform.isLinux || Platform.isMacOS;

  static Future<Desktop> init({bool headless = false}) async {
    if (!isDesktop || headless) return Desktop._(false);
    await windowManager.ensureInitialized();
    const options = WindowOptions(
      size: Size(1360, 860),
      minimumSize: Size(1040, 680),
      center: true,
      title: 'Voya',
      titleBarStyle: TitleBarStyle.hidden,
      backgroundColor: Color(0xFFF6F2EA),
    );
    await windowManager.waitUntilReadyToShow(options, () async {
      await windowManager.show();
      await windowManager.focus();
    });
    final d = Desktop._(true);
    try {
      await localNotifier.setup(appName: 'Voya', shortcutPolicy: ShortcutPolicy.requireCreate);
      d._notifierReady = true;
    } catch (_) {}
    return d;
  }

  Future<void> toggleFullScreen() async {
    if (!enabled) return;
    await windowManager.setFullScreen(!await windowManager.isFullScreen());
  }

  Future<bool> isFullScreen() async => enabled && await windowManager.isFullScreen();

  Future<void> minimize() async => enabled ? windowManager.minimize() : null;

  Future<void> toggleMaximize() async {
    if (!enabled) return;
    if (await windowManager.isMaximized()) {
      await windowManager.unmaximize();
    } else {
      await windowManager.maximize();
    }
  }

  Future<void> close() async => enabled ? windowManager.close() : null;

  Future<void> startDrag() async => enabled ? windowManager.startDragging() : null;

  /// A native toast (Windows Action Center / Linux notification daemon).
  void notify(String title, String body) {
    if (!enabled || !_notifierReady) return;
    try {
      LocalNotification(title: title, body: body).show();
    } catch (_) {}
  }
}
