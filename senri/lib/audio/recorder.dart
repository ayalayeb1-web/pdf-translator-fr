// Microphone recording and playback for the Speaking Lab.
// Recordings are WAV files in the app's support folder; their paths live in the database.
import 'dart:async';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

class VoiceRecorder {
  AudioRecorder? _rec;
  AudioPlayer? _player; // created on first playback only
  StreamSubscription<Amplitude>? _ampSub;
  final _level = StreamController<double>.broadcast();

  /// 0..1 input level while recording (for the live meter).
  Stream<double> get level => _level.stream;

  Future<bool> hasPermission() async {
    try {
      _rec ??= AudioRecorder();
      return await _rec!.hasPermission();
    } catch (_) {
      return false;
    }
  }

  Future<String?> start() async {
    try {
      _rec ??= AudioRecorder();
      if (!await _rec!.hasPermission()) return null;
      final dir = Directory(p.join((await getApplicationSupportDirectory()).path, 'recordings'));
      await dir.create(recursive: true);
      final path = p.join(dir.path, 'rec_${DateTime.now().millisecondsSinceEpoch}.wav');
      await _rec!.start(const RecordConfig(encoder: AudioEncoder.wav, sampleRate: 44100, numChannels: 1), path: path);
      _ampSub = _rec!.onAmplitudeChanged(const Duration(milliseconds: 80)).listen((a) {
        // dBFS (-60..0) → 0..1
        _level.add(((a.current + 60) / 60).clamp(0.0, 1.0));
      });
      return path;
    } catch (_) {
      return null;
    }
  }

  Future<String?> stop() async {
    await _ampSub?.cancel();
    _ampSub = null;
    try {
      return await _rec?.stop();
    } catch (_) {
      return null;
    }
  }

  Future<void> play(String path) async {
    if (!File(path).existsSync()) return;
    final player = _player ??= AudioPlayer();
    await player.stop();
    final done = player.onPlayerComplete.first;
    await player.play(DeviceFileSource(path));
    await done.timeout(const Duration(seconds: 30), onTimeout: () {});
  }

  Future<void> dispose() async {
    await stop();
    await _rec?.dispose();
    await _player?.dispose();
    await _level.close();
  }
}
