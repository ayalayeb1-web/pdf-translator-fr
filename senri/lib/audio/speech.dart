// Text-to-speech through the operating system's own voices (Windows: WinRT speech synthesis,
// Android/iOS/macOS: system voices). Exposes a small "now playing" state for the app's player bar.
//
// Honest limits: the quality depends on the voices installed on the computer. On Windows,
// install "Japanese" / "Spanish (Spain)" voices in Settings → Time & language → Speech.
// Studio-quality neural audio would need a server that calls a cloud TTS (see docs/ARCHITECTURE.md);
// no API key is ever shipped inside the app.
import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class VoiceInfo {
  VoiceInfo(this.name, this.locale);
  final String name, locale;
  String get shortName => name.replaceAll(RegExp(r'^Microsoft\s+'), '').replaceAll(RegExp(r'\s*-\s*.*$'), '');
}

class NowPlaying {
  const NowPlaying({this.text = '', this.playing = false, this.slow = false});
  final String text;
  final bool playing, slow;
}

class Speech {
  Speech();
  FlutterTts? _tts;
  bool available = false;
  String? error;
  final nowPlaying = ValueNotifier(const NowPlaying());
  List<VoiceInfo> _voices = [];
  String _locale = 'ja-JP';
  String? _voiceName;
  double normalRate = 0.5; // flutter_tts scale: 0.5 ≈ the voice's natural pace on Windows
  double slowRate = 0.32;
  Completer<void>? _done;
  bool _busy = false;

  /// Build with --dart-define=SENRI_NO_TTS=true to disable native speech (diagnostics / CI).
  static const disabled = bool.fromEnvironment('SENRI_NO_TTS');

  Future<void> init() async {
    if (disabled) {
      available = false;
      error = 'Synthèse vocale désactivée pour ce build';
      return;
    }
    try {
      final tts = FlutterTts();
      tts.setCompletionHandler(_finished);
      tts.setCancelHandler(_finished);
      tts.setErrorHandler((m) {
        error = '$m';
        _finished();
      });
      await tts.awaitSpeakCompletion(true);
      final raw = await tts.getVoices;
      _voices = [
        for (final v in (raw as List? ?? const []))
          if (v is Map) VoiceInfo('${v['name'] ?? ''}', '${v['locale'] ?? v['language'] ?? ''}'),
      ];
      _tts = tts;
      available = true;
    } catch (e) {
      available = false;
      error = 'Synthèse vocale indisponible sur cette plateforme ($e)';
    }
  }

  void _finished() {
    nowPlaying.value = NowPlaying(text: nowPlaying.value.text, playing: false, slow: nowPlaying.value.slow);
    _done?.complete();
    _done = null;
  }

  static String _norm(String l) => l.replaceAll('_', '-').toLowerCase();

  /// Voices installed for a locale ("ja-JP"); falls back to the language ("ja").
  List<VoiceInfo> voicesFor(String locale) {
    final exact = _voices.where((v) => _norm(v.locale) == _norm(locale)).toList();
    if (exact.isNotEmpty) return exact;
    final lang = _norm(locale).split('-').first;
    // Never fall back to another region for Spanish (es-MX would be the wrong accent for this course).
    if (lang == 'es') return [];
    return _voices.where((v) => _norm(v.locale).startsWith(lang)).toList();
  }

  String? get voiceName => _voiceName;

  Future<void> configure(String locale, String? voiceName) async {
    _locale = locale;
    final list = voicesFor(locale);
    final chosen = list.where((v) => v.name == voiceName).firstOrNull ?? list.firstOrNull;
    _voiceName = chosen?.name;
    final tts = _tts;
    if (tts == null) return;
    try {
      await tts.setLanguage(locale);
      if (chosen != null) await tts.setVoice({'name': chosen.name, 'locale': chosen.locale});
    } catch (_) {}
  }

  bool get hasVoice => available && voicesFor(_locale).isNotEmpty;

  Future<void> speak(String text, {bool slow = false}) async {
    final tts = _tts;
    if (tts == null || text.trim().isEmpty) return;
    if (_busy) return;
    _busy = true;
    await stop();
    _busy = false;
    nowPlaying.value = NowPlaying(text: text, playing: true, slow: slow);
    _done = Completer<void>();
    try {
      await tts.setSpeechRate(slow ? slowRate : normalRate);
      await tts.speak(text);
    } catch (e) {
      error = '$e';
      _finished();
    }
    // Some platforms resolve speak() immediately; wait for the completion handler with a safety timeout.
    await _done?.future.timeout(Duration(milliseconds: 1500 + text.length * 260), onTimeout: _finished);
  }

  Future<void> replay() async {
    final n = nowPlaying.value;
    if (n.text.isNotEmpty) await speak(n.text, slow: n.slow);
  }

  Future<void> stop() async {
    if (!nowPlaying.value.playing) return; // calling the native stop() while idle is unsafe on some platforms
    try {
      await _tts?.stop();
    } catch (_) {}
    _finished();
  }
}
