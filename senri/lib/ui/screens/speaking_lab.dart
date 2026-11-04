// Speaking Lab: listen to the model, record yourself, compare A/B, judge it yourself.
//
// No automatic pronunciation score is shown: measuring pronunciation needs a speech
// assessment service (e.g. Azure Pronunciation Assessment) called from a server.
// Until such a server exists, the app records and compares, and the learner decides.
import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';

import '../../audio/recorder.dart';
import '../../content/models.dart';
import '../../core/app_state.dart';
import '../../core/store.dart';
import '../theme.dart';
import '../widgets.dart';

class SpeakingLab extends StatefulWidget {
  const SpeakingLab({super.key});
  @override
  State<SpeakingLab> createState() => _SpeakingLabState();
}

class _Phrase {
  _Phrase(this.text, this.hint, this.meaning, this.lesson);
  final String text, hint, meaning, lesson;
}

class _SpeakingLabState extends State<SpeakingLab> {
  final rec = VoiceRecorder();
  int selected = 0;
  bool accent = false; // accent coach mode
  int point = 0, example = 0;
  bool recording = false, playing = false;
  Duration elapsed = Duration.zero;
  Timer? ticker;
  double level = 0;
  StreamSubscription<double>? levelSub;
  List<Recording> history = [];
  String? error;

  AppState get app => AppScope.read(context);

  List<_Phrase> phrases(AppState a) {
    final out = <_Phrase>[];
    // sentences from the learner's level first, completed lessons first
    final lessons = a.course.level(a.levelId).lessons.where((l) => l.written).toList()
      ..sort((x, y) => (a.completed.containsKey(y.id) ? 1 : 0).compareTo(a.completed.containsKey(x.id) ? 1 : 0));
    for (final l in lessons) {
      for (final e in l.examples) {
        out.add(_Phrase(e.text, e.romaji, e.meaning, l.title));
      }
      if (l.type == LessonType.vocab) {
        for (final it in l.items.take(3)) {
          out.add(_Phrase(it.term, it.hint, it.meaning, l.title));
        }
      }
    }
    return out;
  }

  @override
  void initState() {
    super.initState();
    levelSub = rec.level.listen((v) => setState(() => level = v));
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadHistory());
  }

  @override
  void dispose() {
    ticker?.cancel();
    levelSub?.cancel();
    rec.dispose();
    super.dispose();
  }

  /// The sentence currently being practised (a lesson phrase, or an accent-coach example).
  _Phrase? current(AppState a) {
    if (accent) {
      final pts = a.accentPoints;
      if (pts.isEmpty) return null;
      final pt = pts[point.clamp(0, pts.length - 1)];
      final ex = pt.examples[example.clamp(0, pt.examples.length - 1)];
      return _Phrase(ex.text, ex.hint, ex.fr, pt.title);
    }
    final list = phrases(a);
    return list.isEmpty ? null : list[selected.clamp(0, list.length - 1)];
  }

  Future<void> _loadHistory() async {
    final ph = current(app);
    if (ph == null) return;
    final h = await app.store.recordings(app.lang, text: ph.text);
    if (mounted) setState(() => history = h);
  }

  Future<void> _toggleRecord(_Phrase ph) async {
    if (recording) {
      ticker?.cancel();
      final path = await rec.stop();
      setState(() {
        recording = false;
        level = 0;
      });
      if (path != null && File(path).existsSync()) {
        await app.store.addRecording(app.lang, ph.text, path);
        await app.store.addActivity(app.lang, seconds: elapsed.inSeconds + 10);
        await _loadHistory();
      }
      return;
    }
    await app.speech.stop();
    final path = await rec.start();
    if (path == null) {
      setState(
        () => error =
            'Impossible d’accéder au micro. Vérifiez Paramètres Windows → Confidentialité et sécurité → Microphone → « Autoriser les applications de bureau ».',
      );
      return;
    }
    setState(() {
      error = null;
      recording = true;
      elapsed = Duration.zero;
    });
    ticker = Timer.periodic(const Duration(milliseconds: 100), (_) {
      setState(() => elapsed += const Duration(milliseconds: 100));
      if (elapsed.inSeconds >= 20) _toggleRecord(ph); // safety stop
    });
  }

  Future<void> _playMine(Recording r) async {
    setState(() => playing = true);
    await rec.play(r.path);
    if (mounted) setState(() => playing = false);
  }

  Future<void> _compare(_Phrase ph, Recording r) async {
    setState(() => playing = true);
    await app.speech.speak(ph.text);
    await Future<void>.delayed(const Duration(milliseconds: 350));
    await rec.play(r.path);
    if (mounted) setState(() => playing = false);
  }

  @override
  Widget build(BuildContext context) {
    final a = AppScope.of(context);
    final p = context.pal;
    final list = phrases(a);
    final pts = a.accentPoints;
    if (point >= pts.length) point = 0;
    if (selected >= list.length) selected = 0;
    final ph = current(a);
    if (ph == null) {
      return const PageFrame(title: 'Speaking Lab', children: [Text('Aucune phrase disponible à ce niveau.')]);
    }
    void pick(VoidCallback f) {
      if (recording) return;
      setState(f);
      _loadHistory();
    }

    final last = history.firstOrNull;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          width: 330,
          decoration: BoxDecoration(
            border: Border(right: BorderSide(color: p.line)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment(value: false, label: Text('Phrases'), icon: Icon(Icons.short_text_rounded, size: 16)),
                        ButtonSegment(value: true, label: Text('Accent'), icon: Icon(Icons.record_voice_over_rounded, size: 16)),
                      ],
                      selected: {accent},
                      showSelectedIcon: false,
                      onSelectionChanged: (v) => pick(() => accent = v.first),
                    ),
                    const SizedBox(height: 16),
                    Eyebrow(accent ? 'Coach d’accent · ${a.language.name}' : 'Phrases · niveau ${a.levelId}'),
                    const SizedBox(height: 4),
                    Text(accent ? '${pts.length} sons clés pour un francophone' : '${list.length} phrases tirées de vos leçons', style: context.text.bodySmall),
                  ],
                ),
              ),
              Expanded(
                child: accent
                    ? ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 20),
                        itemCount: pts.length,
                        itemBuilder: (_, i) {
                          final pt = pts[i];
                          final sel = i == point;
                          return Material(
                            color: sel ? p.surface : Colors.transparent,
                            borderRadius: BorderRadius.circular(Tokens.rMd),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(Tokens.rMd),
                              onTap: () => pick(() {
                                point = i;
                                example = 0;
                              }),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(Tokens.rMd),
                                  border: Border.all(color: sel ? p.line : Colors.transparent),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      pt.title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: context.text.titleMedium!.copyWith(color: sel ? p.ink : p.inkSoft),
                                    ),
                                    Text(pt.tip, maxLines: 1, overflow: TextOverflow.ellipsis, style: context.text.bodySmall),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 20),
                        itemCount: list.length,
                        itemBuilder: (_, i) {
                          final x = list[i];
                          final sel = i == selected;
                          return Material(
                            color: sel ? p.surface : Colors.transparent,
                            borderRadius: BorderRadius.circular(Tokens.rMd),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(Tokens.rMd),
                              onTap: () => pick(() => selected = i),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(Tokens.rMd),
                                  border: Border.all(color: sel ? p.line : Colors.transparent),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      x.text,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: context.text.titleMedium!.copyWith(color: sel ? p.ink : p.inkSoft),
                                    ),
                                    Text(x.lesson, maxLines: 1, overflow: TextOverflow.ellipsis, style: context.text.bodySmall),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
        Expanded(
          child: PageFrame(
            eyebrow: 'Speaking Lab',
            title: 'Écouter · s’enregistrer · comparer',
            maxWidth: 900,
            children: [
              if (accent && pts.isNotEmpty) ...[
                Panel(
                  color: p.accentSoft,
                  border: p.accent.withValues(alpha: 0.25),
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text(pts[point].title, style: context.text.headlineSmall)),
                          Tag(pts[point].tip, color: p.accent),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(pts[point].explain, style: context.text.bodyLarge),
                      const SizedBox(height: 16),
                      Text('Exemples à écouter et imiter', style: context.text.titleSmall),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final (i, ex) in pts[point].examples.indexed)
                            ChoiceChip(
                              label: Text('${ex.text}  ·  ${ex.fr}'),
                              selected: i == example,
                              onSelected: (_) {
                                pick(() => example = i);
                                a.speech.speak(ex.text);
                              },
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
              ],
              Panel(
                padding: const EdgeInsets.all(32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [const Eyebrow('1 · Le modèle'), const Spacer(), SpeakButtons(ph.text)]),
                    const SizedBox(height: 16),
                    WordTarget(
                      text: ph.text,
                      child: SelectableText(ph.text, style: context.text.displaySmall),
                    ),
                    if (ph.hint.isNotEmpty && ph.hint != ph.text) ...[
                      const SizedBox(height: 6),
                      Text(ph.hint, style: context.text.bodyLarge!.copyWith(color: p.inkSoft)),
                    ],
                    const SizedBox(height: 6),
                    Text(ph.meaning, style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Panel(
                padding: const EdgeInsets.all(28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Eyebrow('2 · À vous'),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        _RecordButton(recording: recording, level: level, onTap: () => _toggleRecord(ph)),
                        const SizedBox(width: 22),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                recording ? 'Enregistrement… ${(elapsed.inMilliseconds / 1000).toStringAsFixed(1)} s' : 'Lisez la phrase à voix haute',
                                style: context.text.titleLarge,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                recording
                                    ? 'Cliquez à nouveau pour arrêter.'
                                    : 'Conseil : écoutez d’abord la version lente, puis imitez le rythme et la mélodie de la version naturelle.',
                                style: context.text.bodySmall,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (error != null) ...[const SizedBox(height: 14), Text(error!, style: context.text.bodySmall!.copyWith(color: p.danger))],
                    if (last != null && !recording) ...[
                      const SizedBox(height: 22),
                      Divider(color: p.line),
                      const SizedBox(height: 18),
                      const Eyebrow('3 · Comparer'),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          Btn(label: 'Ma voix', icon: Icons.play_arrow_rounded, kind: BtnKind.secondary, onPressed: playing ? null : () => _playMine(last)),
                          Btn(label: 'Modèle puis ma voix', icon: Icons.compare_arrows_rounded, onPressed: playing ? null : () => _compare(ph, last)),
                        ],
                      ),
                      const SizedBox(height: 18),
                      Text('Votre avis sur cet essai', style: context.text.titleSmall),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 10,
                        children: [
                          ChoiceChip(
                            label: const Text('Satisfait·e'),
                            selected: last.verdict == 'ok',
                            onSelected: (_) async {
                              await a.store.setVerdict(last.id, 'ok');
                              _loadHistory();
                            },
                          ),
                          ChoiceChip(
                            label: const Text('À retravailler'),
                            selected: last.verdict == 'again',
                            onSelected: (_) async {
                              await a.store.setVerdict(last.id, 'again');
                              _loadHistory();
                            },
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              if (history.length > 1) ...[
                const SizedBox(height: 18),
                Panel(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Eyebrow('Vos essais sur cette phrase (${history.length})'),
                      const SizedBox(height: 10),
                      for (final r in history.take(8))
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              IconBtn(icon: Icons.play_arrow_rounded, tooltip: 'Écouter cet essai', onTap: playing ? null : () => _playMine(r), size: 32),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_when(r.at), style: context.text.bodyMedium)),
                              if (r.verdict != null) Tag(r.verdict == 'ok' ? 'Satisfait·e' : 'À retravailler', color: r.verdict == 'ok' ? p.success : p.gold),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),
              Panel(
                color: p.sidebar,
                padding: const EdgeInsets.all(18),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded, size: 18, color: p.inkSoft),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Pas de note automatique : évaluer une prononciation de façon fiable demande un service de reconnaissance vocale spécialisé '
                        '(par ex. Azure Pronunciation Assessment), appelé depuis un serveur pour ne jamais exposer de clé dans l’application. '
                        'Vos enregistrements restent sur cet ordinateur.',
                        style: context.text.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _when(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inMinutes < 1) return 'à l’instant';
    if (diff.inHours < 1) return 'il y a ${diff.inMinutes} min';
    if (diff.inDays < 1) return 'il y a ${diff.inHours} h';
    return 'le ${dayKey(d)}';
  }
}

class _RecordButton extends StatelessWidget {
  const _RecordButton({required this.recording, required this.level, required this.onTap});
  final bool recording;
  final double level;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Tooltip(
      message: recording ? 'Arrêter' : 'Enregistrer',
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: onTap,
          child: SizedBox.square(
            dimension: 96,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 90),
                  width: 70 + (recording ? 26 * level : 0),
                  height: 70 + (recording ? 26 * level : 0),
                  decoration: BoxDecoration(
                    color: p.danger.withValues(alpha: recording ? 0.18 : 0),
                    shape: BoxShape.circle,
                  ),
                ),
                AnimatedContainer(
                  duration: Tokens.fast,
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(color: recording ? p.danger : p.accent, shape: BoxShape.circle),
                  child: Icon(recording ? Icons.stop_rounded : Icons.mic_rounded, size: 34, color: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
