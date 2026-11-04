// Text-to-speech through the operating system's own voices (Windows: WinRT speech synthesis,
// Android/iOS/macOS: system voices). Exposes a small "now playing" state for the app's player bar.
//
// Accent: only voices of the course's region are used (es-ES for Spain Spanish, it-IT, ja-JP),
// ranked so that natural / neural voices come first.
// Slow mode is pedagogical: the sentence is cut into word groups with real pauses, instead of
// only lowering the rate (which makes voices sound robotic).
//
// Honest limits: the quality depends on the voices installed on the computer. Studio-quality
// neural audio would need a server that calls a cloud TTS (see docs/ARCHITECTURE.md);
// no API key is ever shipped inside the app.
import 'dart:async';

import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show MethodChannel;
import 'package:flutter_tts/flutter_tts.dart';

class VoiceInfo {
  VoiceInfo(this.name, this.locale, {this.engine = 'winrt', this.id = ''});
  final String name, locale;

  /// 'winrt' (modern Windows voices, via flutter_tts) or 'sapi' (classic SAPI 5 voices,
  /// including Narrator's natural voices when an adapter such as NaturalVoiceSAPIAdapter is installed).
  final String engine;
  final String id; // SAPI token id
  bool get sapi => engine == 'sapi';
  String get shortName => name.replaceAll(RegExp(r'^Microsoft\s+'), '').replaceAll(RegExp(r'\s*-\s*.*$'), '').replaceAll(RegExp(r'\s*\(.*\)'), '');

  /// Natural / neural voices sound far more human than the older desktop ones.
  bool get natural => RegExp(r'natural|neural|online|premium|enhanced', caseSensitive: false).hasMatch(name);

  String get region {
    final l = locale.replaceAll('_', '-').toLowerCase();
    return const {
          'es-es': 'Espagne',
          'es-mx': 'Mexique',
          'es-us': 'États-Unis',
          'ja-jp': 'Japon',
          'it-it': 'Italie',
          'it-ch': 'Suisse',
        }[l] ??
        locale;
  }
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
  VoiceInfo? _active; // the voice that speaks right now (the chosen one, or a preview)
  static const _sapi = MethodChannel('senri/sapi');
  int _gen = 0; // incremented by every new speak/stop: older loops stop by themselves
  static const _platformTimeout = Duration(seconds: 2);

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
      tts.setCompletionHandler(_chunkDone);
      tts.setCancelHandler(_chunkDone);
      tts.setErrorHandler((m) {
        error = '$m';
        _chunkDone();
      });
      // Never let the platform block: completion arrives through the handlers, with a timeout.
      await tts.awaitSpeakCompletion(false);
      final raw = await Future<dynamic>.value(tts.getVoices).timeout(const Duration(seconds: 5), onTimeout: () => const []);
      _voices = [
        for (final v in (raw as List? ?? const []))
          if (v is Map) VoiceInfo('${v['name'] ?? ''}', '${v['locale'] ?? v['language'] ?? ''}'),
      ];
      _tts = tts;
      available = true;
      if (Platform.isWindows) {
        try {
          final list = await _sapi.invokeMethod<List<dynamic>>('getVoices').timeout(const Duration(seconds: 5), onTimeout: () => const []);
          for (final v in list ?? const []) {
            if (v is Map && '${v['name']}'.isNotEmpty) {
              _voices.add(VoiceInfo('${v['name']}', '${v['locale']}', engine: 'sapi', id: '${v['id']}'));
            }
          }
        } catch (_) {
          // SAPI bridge unavailable: modern voices only
        }
      }
    } catch (e) {
      available = false;
      error = '$e'.contains('MissingPlugin')
          ? 'La synthèse vocale n’est pas prise en charge sur ce système (elle l’est sous Windows, macOS, Android et iOS).'
          : 'Synthèse vocale indisponible : $e';
    }
  }

  void _chunkDone() {
    _done?.complete();
    _done = null;
  }

  static String _norm(String l) => l.replaceAll('_', '-').toLowerCase();

  static int _score(VoiceInfo v, String locale) => (v.natural ? 10 : 0) + (_norm(v.locale) == _norm(locale) ? 5 : 0) - (RegExp('desktop', caseSensitive: false).hasMatch(v.name) ? 2 : 0);

  /// Voices for a locale ("es-ES"), best first. Never another region of Spanish:
  /// a Mexican voice would teach the wrong accent for a Spain Spanish course.
  List<VoiceInfo> voicesFor(String locale) {
    final lang = _norm(locale).split('-').first;
    final exact = _voices.where((v) => _norm(v.locale) == _norm(locale)).toList();
    final list = exact.isNotEmpty || lang == 'es' ? exact : _voices.where((v) => _norm(v.locale).startsWith(lang)).toList();
    return list..sort((a, b) => _score(b, locale).compareTo(_score(a, locale)));
  }

  /// Voices of the same language but another region (shown for information only).
  List<VoiceInfo> otherRegions(String locale) {
    final lang = _norm(locale).split('-').first;
    return _voices.where((v) => _norm(v.locale).startsWith(lang) && _norm(v.locale) != _norm(locale)).toList();
  }

  String? get voiceName => _voiceName;
  VoiceInfo? get voice => _voices.where((v) => v.name == _voiceName).firstOrNull;
  List<VoiceInfo> get sapiVoices => _voices.where((v) => v.sapi).toList();

  Future<void> _apply(VoiceInfo? v) async {
    _active = v;
    final tts = _tts;
    if (tts == null || (v != null && v.sapi)) return; // SAPI voices are chosen per utterance
    try {
      await tts.setLanguage(_locale).timeout(_platformTimeout, onTimeout: () => null);
      if (v != null) await tts.setVoice({'name': v.name, 'locale': v.locale}).timeout(_platformTimeout, onTimeout: () => null);
    } catch (_) {}
  }

  Future<void> configure(String locale, String? voiceName) async {
    _locale = locale;
    final list = voicesFor(locale);
    final chosen = list.where((v) => v.name == voiceName).firstOrNull ?? list.firstOrNull; // best voice by default
    _voiceName = chosen?.name;
    await _apply(chosen);
  }

  bool get hasVoice => available && voicesFor(_locale).isNotEmpty;

  /// Word groups for pedagogical slow speech: cut at punctuation, then keep groups short.
  static List<String> chunks(String text) {
    final parts = text.split(RegExp(r'(?<=[、。，,．.!?！？;；:：])\s*')).map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    final out = <String>[];
    for (final p in parts) {
      final words = p.split(RegExp(r'\s+'));
      if (words.length <= 4) {
        out.add(p);
      } else {
        for (var i = 0; i < words.length; i += 3) {
          out.add(words.sublist(i, i + 3 > words.length ? words.length : i + 3).join(' '));
        }
      }
    }
    return out.isEmpty ? [text] : out;
  }

  /// flutter_tts rate (0.5 = natural) → SAPI rate (-10…10, 0 = natural).
  static int sapiRate(double rate) => ((rate - 0.5) * 20).round().clamp(-10, 10);

  Future<void> _speakSapi(String text, double rate, int gen) async {
    final v = _active!;
    try {
      final ok = await _sapi.invokeMethod<bool>('speak', {'text': text, 'id': v.id, 'rate': sapiRate(rate)}).timeout(_platformTimeout, onTimeout: () => false);
      if (ok != true) return;
      final limit = DateTime.now().add(Duration(milliseconds: 2500 + (text.length * 300 * (0.5 / rate)).round()));
      await Future<void>.delayed(const Duration(milliseconds: 250));
      while (gen == _gen && DateTime.now().isBefore(limit)) {
        final speaking = await _sapi.invokeMethod<bool>('isSpeaking').timeout(_platformTimeout, onTimeout: () => false);
        if (speaking != true) break;
        await Future<void>.delayed(const Duration(milliseconds: 120));
      }
    } catch (e) {
      error = '$e';
    }
  }

  Future<void> _speakRaw(String text, double rate, int gen) async {
    if (gen != _gen) return;
    if (_active != null && _active!.sapi) return _speakSapi(text, rate, gen);
    final tts = _tts;
    if (tts == null) return;
    _done = Completer<void>();
    final done = _done!.future;
    try {
      await tts.setSpeechRate(rate).timeout(_platformTimeout, onTimeout: () => null);
      if (gen != _gen) return;
      unawaited(Future.sync(() => tts.speak(text)).catchError((Object e) {
        error = '$e';
        _chunkDone();
        return null;
      }));
    } catch (e) {
      error = '$e';
      _chunkDone();
    }
    await done.timeout(Duration(milliseconds: 1500 + (text.length * 260 * (0.5 / rate)).round()), onTimeout: () {});
  }

  Future<void> speak(String text, {bool slow = false}) async {
    if (_tts == null || text.trim().isEmpty) return;
    await stop();
    final gen = ++_gen;
    nowPlaying.value = NowPlaying(text: text, playing: true, slow: slow);
    final parts = slow ? chunks(text) : [text];
    for (var i = 0; i < parts.length; i++) {
      if (gen != _gen) return;
      await _speakRaw(parts[i], slow ? slowRate : normalRate, gen);
      if (slow && i < parts.length - 1) await Future<void>.delayed(const Duration(milliseconds: 420));
    }
    if (gen == _gen) nowPlaying.value = NowPlaying(text: text, playing: false, slow: slow);
  }

  /// Plays a sample with another voice, then restores the chosen one.
  Future<void> preview(VoiceInfo v, String text) async {
    final current = voice;
    await stop();
    await _apply(v);
    await speak(text);
    await _apply(current);
  }

  Future<void> replay() async {
    final n = nowPlaying.value;
    if (n.text.isNotEmpty) await speak(n.text, slow: n.slow);
  }

  Future<void> stop() async {
    _gen++;
    if (!nowPlaying.value.playing) return; // calling the native stop() while idle is unsafe on some platforms
    try {
      if (_active != null && _active!.sapi) {
        await _sapi.invokeMethod<void>('stop').timeout(_platformTimeout, onTimeout: () {});
      } else {
        await _tts?.stop().timeout(_platformTimeout, onTimeout: () => null);
      }
    } catch (_) {}
    _chunkDone();
    nowPlaying.value = NowPlaying(text: nowPlaying.value.text, playing: false, slow: nowPlaying.value.slow);
  }
}
