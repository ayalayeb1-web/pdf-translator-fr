// Lesson player: discover → practise (active recall, listening, production) → result.
import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../content/models.dart';
import '../../core/app_state.dart';
import '../../core/practice.dart';
import '../theme.dart';
import '../widgets.dart';

enum _Phase { learn, practice, result }

class LessonPlayer extends StatefulWidget {
  const LessonPlayer({super.key, required this.lesson, this.random});
  final Lesson lesson;
  final Random? random;
  @override
  State<LessonPlayer> createState() => _LessonPlayerState();
}

class _LessonPlayerState extends State<LessonPlayer> {
  _Phase phase = _Phase.learn;
  late List<PracticeStep> steps;
  int index = 0;
  int firstTryCorrect = 0;
  int graded = 0;
  final Set<int> retried = {};
  final List<(String, String, String)> mistakes = []; // prompt, given, expected
  final watch = Stopwatch()..start();
  final focus = FocusNode(debugLabel: 'lesson');

  // current step state
  String? picked;
  bool? correct;
  String? note;
  final typed = TextEditingController();
  final typedFocus = FocusNode(debugLabel: 'typed');
  List<String> placed = [];
  Timer? advanceTimer;

  AppState get app => AppScope.read(context);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final a = app;
      final pool = a.course.items.values.toList();
      steps = Practice(widget.random ?? Random()).build(widget.lesson, pool, lang: a.lang);
      focus.requestFocus();
      setState(() {});
    });
    steps = [];
  }

  @override
  void dispose() {
    advanceTimer?.cancel();
    focus.dispose();
    typedFocus.dispose();
    typed.dispose();
    super.dispose();
  }

  PracticeStep get step => steps[index];

  void startPractice() {
    setState(() => phase = steps.isEmpty ? _Phase.result : _Phase.practice);
    _onStepShown();
  }

  void _onStepShown() {
    if (phase != _Phase.practice) return;
    final s = step;
    if (s.kind == StepKind.listen || s.kind == StepKind.meaning) {
      if (s.audio != null) app.speech.speak(s.audio!);
    }
    if (s.kind == StepKind.typeIt) {
      WidgetsBinding.instance.addPostFrameCallback((_) => typedFocus.requestFocus());
    } else {
      focus.requestFocus();
    }
  }

  Future<void> _grade(String given) async {
    if (correct != null) return;
    final s = step;
    final res = s.kind == StepKind.typeIt
        ? AnswerCheck.check(given, s.answer, lang: app.lang)
        : AnswerCheck(given == s.answer);
    final firstTry = !retried.contains(index);
    setState(() {
      picked = given;
      correct = res.correct;
      note = res.note;
    });
    if (firstTry) {
      graded++;
      if (res.correct) firstTryCorrect++;
    }
    final it = s.item;
    if (it != null && firstTry) await app.store.grade(app.lang, it.id, res.correct);
    if (!res.correct) {
      mistakes.add((s.kind == StepKind.listen ? '(audio) ${s.answer}' : s.prompt, given, s.answer));
      if (it != null) await app.store.logMistake(app.lang, it.id, s.prompt, given, s.answer);
      // active learning: the step comes back at the end of the lesson, once
      if (firstTry) {
        steps.add(s);
        retried.add(steps.length - 1);
      }
    } else if (s.kind != StepKind.listen && s.audio != null && s.kind != StepKind.meaning) {
      app.speech.speak(s.audio!);
    }
    if (res.correct && app.autoAdvance) {
      advanceTimer = Timer(Duration(milliseconds: note == null ? 850 : 1800), _next);
    }
  }

  void _next() {
    advanceTimer?.cancel();
    if (!mounted || correct == null) return;
    if (index + 1 >= steps.length) {
      _finish();
      return;
    }
    setState(() {
      index++;
      picked = null;
      correct = null;
      note = null;
      typed.clear();
      placed = [];
    });
    _onStepShown();
  }

  Future<void> _finish() async {
    watch.stop();
    setState(() => phase = _Phase.result);
    // make sure every taught item enters the review schedule
    for (final it in widget.lesson.items) {
      if (await app.store.card(app.lang, it.id) == null) await app.store.grade(app.lang, it.id, true);
    }
    await app.finishLesson(widget.lesson, firstTryCorrect, graded, watch.elapsed);
  }

  Future<void> _quit() async {
    if (phase == _Phase.result || index == 0 && phase == _Phase.learn) {
      app.speech.stop();
      app.closeLesson();
      return;
    }
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Quitter la leçon ?', style: ctx.text.headlineSmall),
        content: Text('Vos réponses déjà données sont enregistrées dans vos révisions, mais la leçon ne sera pas marquée comme terminée.', style: ctx.text.bodyMedium),
        actions: [
          Btn(label: 'Continuer la leçon', kind: BtnKind.secondary, onPressed: () => Navigator.pop(ctx, false)),
          Btn(label: 'Quitter', kind: BtnKind.danger, onPressed: () => Navigator.pop(ctx, true)),
        ],
      ),
    );
    if (ok == true && mounted) {
      if (watch.elapsed.inSeconds > 20) await app.store.addActivity(app.lang, seconds: watch.elapsed.inSeconds);
      app.speech.stop();
      app.closeLesson();
      app.refresh();
    }
  }

  KeyEventResult _onKey(FocusNode node, KeyEvent e) {
    if (e is! KeyDownEvent) return KeyEventResult.ignored;
    final k = e.logicalKey;
    if (k == LogicalKeyboardKey.escape) {
      _quit();
      return KeyEventResult.handled;
    }
    final typing = typedFocus.hasFocus;
    if (phase == _Phase.learn && k == LogicalKeyboardKey.enter) {
      startPractice();
      return KeyEventResult.handled;
    }
    if (phase != _Phase.practice || steps.isEmpty) return KeyEventResult.ignored;
    if (k == LogicalKeyboardKey.enter || k == LogicalKeyboardKey.numpadEnter) {
      if (correct != null) {
        _next();
      } else if (step.kind == StepKind.typeIt) {
        _grade(typed.text);
      } else if (step.kind == StepKind.order && placed.isNotEmpty) {
        _grade(placed.join(' '));
      }
      return KeyEventResult.handled;
    }
    if (typing) return KeyEventResult.ignored;
    if (k == LogicalKeyboardKey.space) {
      final a = step.audio;
      if (a != null) app.speech.speak(a);
      return KeyEventResult.handled;
    }
    const digits = [LogicalKeyboardKey.digit1, LogicalKeyboardKey.digit2, LogicalKeyboardKey.digit3, LogicalKeyboardKey.digit4, LogicalKeyboardKey.digit5, LogicalKeyboardKey.digit6];
    final d = digits.indexOf(k);
    if (d >= 0 && correct == null && d < step.options.length) {
      _grade(step.options[d]);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final total = steps.isEmpty ? 1 : steps.length;
    final progress = switch (phase) { _Phase.learn => 0.0, _Phase.practice => (index + (correct != null ? 1 : 0)) / total, _Phase.result => 1.0 };
    return Focus(
      focusNode: focus,
      onKeyEvent: _onKey,
      child: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
          child: Row(children: [
            IconBtn(icon: Icons.close_rounded, tooltip: 'Quitter (Échap)', onTap: _quit),
            const SizedBox(width: 16),
            Expanded(child: Bar(value: progress, height: 8)),
            const SizedBox(width: 16),
            Text(phase == _Phase.practice ? '${index + 1} / ${steps.length}' : phase == _Phase.learn ? 'Découverte' : 'Terminé', style: context.text.labelMedium),
          ]),
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: Tokens.base,
            transitionBuilder: (c, a) => FadeTransition(opacity: a, child: SlideTransition(position: Tween(begin: const Offset(0.02, 0), end: Offset.zero).animate(a), child: c)),
            child: switch (phase) {
              _Phase.learn => KeyedSubtree(key: const ValueKey('learn'), child: _Learn(lesson: widget.lesson, onStart: startPractice)),
              _Phase.practice when steps.isNotEmpty => KeyedSubtree(key: ValueKey('step-$index'), child: _stepView(context)),
              _Phase.practice => const SizedBox.shrink(),
              _Phase.result => KeyedSubtree(key: const ValueKey('result'), child: _result(context)),
            },
          ),
        ),
      ]),
    );
  }

  // ---------------- practice ----------------
  Widget _stepView(BuildContext context) {
    final p = context.pal;
    final s = step;
    final isRetry = retried.contains(index);
    Widget body;
    switch (s.kind) {
      case StepKind.meaning:
        body = Column(children: [
          WordTarget(
            text: s.prompt,
            item: s.item,
            source: widget.lesson.title,
            child: Text(s.prompt, textAlign: TextAlign.center, style: context.text.displayLarge!.copyWith(fontSize: s.prompt.length > 8 ? 44 : 64)),
          ),
          if (correct != null && s.hint.isNotEmpty) ...[const SizedBox(height: 8), Text(s.hint, style: context.text.bodyLarge!.copyWith(color: p.inkSoft))],
          const SizedBox(height: 14),
          SpeakButtons(s.audio ?? s.prompt),
          const SizedBox(height: 34),
          _options(context, s),
        ]);
      case StepKind.listen:
        body = Column(children: [
          GestureDetector(
            onTap: () => app.speech.speak(s.audio!),
            child: MouseRegion(
              cursor: SystemMouseCursors.click,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(color: p.accent, shape: BoxShape.circle, boxShadow: [BoxShadow(color: p.accent.withValues(alpha: 0.35), blurRadius: 30, offset: const Offset(0, 10))]),
                child: Icon(Icons.volume_up_rounded, size: 52, color: p.onAccent),
              ),
            ),
          ),
          const SizedBox(height: 14),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            const KeyCap('Espace'),
            const SizedBox(width: 8),
            Text('pour réécouter', style: context.text.bodySmall),
            const SizedBox(width: 16),
            TextButton.icon(onPressed: () => app.speech.speak(s.audio!, slow: true), icon: const Icon(Icons.slow_motion_video_rounded, size: 18), label: const Text('Plus lentement')),
          ]),
          if (!app.speech.hasVoice) ...[const SizedBox(height: 10), _NoVoiceHint()],
          const SizedBox(height: 30),
          _options(context, s, big: true),
        ]);
      case StepKind.typeIt:
        body = Column(children: [
          Text(s.prompt, textAlign: TextAlign.center, style: context.text.headlineMedium),
          const SizedBox(height: 28),
          SizedBox(
            width: 480,
            child: TextField(
              controller: typed,
              focusNode: typedFocus,
              enabled: correct == null,
              textAlign: TextAlign.center,
              style: context.text.headlineSmall!.copyWith(fontFamily: Tokens.ui),
              decoration: const InputDecoration(hintText: 'Votre réponse'),
              onSubmitted: (v) => correct == null ? _grade(v) : _next(),
            ),
          ),
          if (app.lang == 'es') ...[
            const SizedBox(height: 12),
            Wrap(spacing: 6, children: [
              for (final ch in ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'])
                ActionChip(
                  label: Text(ch, style: context.text.titleMedium),
                  onPressed: correct != null
                      ? null
                      : () {
                          final sel = typed.selection;
                          final t = typed.text;
                          final at = sel.isValid ? sel.start : t.length;
                          typed.text = t.substring(0, at) + ch + t.substring(sel.isValid ? sel.end : t.length);
                          typed.selection = TextSelection.collapsed(offset: at + 1);
                          typedFocus.requestFocus();
                        },
                ),
            ]),
          ],
          const SizedBox(height: 24),
          if (correct == null) Btn(label: 'Vérifier', shortcut: 'Entrée', onPressed: () => _grade(typed.text)),
        ]);
      case StepKind.fill:
        final parts = s.prompt.split('＿');
        body = Column(children: [
          Text.rich(
            TextSpan(children: [
              TextSpan(text: parts.first),
              WidgetSpan(
                alignment: PlaceholderAlignment.middle,
                child: AnimatedContainer(
                  duration: Tokens.fast,
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  constraints: const BoxConstraints(minWidth: 70),
                  decoration: BoxDecoration(border: Border(bottom: BorderSide(color: correct == null ? p.accent : (correct! ? p.success : p.danger), width: 3))),
                  child: Text(picked ?? ' ', textAlign: TextAlign.center, style: context.text.displaySmall!.copyWith(color: correct == null ? p.ink : (correct! ? p.success : p.danger))),
                ),
              ),
              if (parts.length > 1) TextSpan(text: parts.sublist(1).join('＿')),
            ]),
            textAlign: TextAlign.center,
            style: context.text.displaySmall,
          ),
          if (s.hint.isNotEmpty) ...[const SizedBox(height: 12), Text('« ${s.hint} »', style: context.text.bodyLarge!.copyWith(color: p.inkSoft))],
          const SizedBox(height: 34),
          _options(context, s),
        ]);
      case StepKind.order:
        final pool = <String>[...s.tiles];
        for (final t in placed) {
          pool.remove(t);
        }
        body = Column(children: [
          Text('« ${s.prompt} »', textAlign: TextAlign.center, style: context.text.headlineMedium),
          const SizedBox(height: 28),
          Container(
            constraints: const BoxConstraints(minHeight: 72, maxWidth: 760),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Tokens.rMd),
              border: Border.all(color: correct == null ? p.line : (correct! ? p.success : p.danger), width: 1.5),
              color: correct == null ? p.surface : (correct! ? p.successSoft : p.dangerSoft),
            ),
            child: Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
              for (final (i, t) in placed.indexed)
                _Tile(text: t, onTap: correct != null ? null : () => setState(() => placed.removeAt(i))),
            ]),
          ),
          const SizedBox(height: 18),
          Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: [
            for (final t in pool)
              _Tile(
                text: t,
                ghost: true,
                onTap: correct != null
                    ? null
                    : () {
                        setState(() => placed.add(t));
                        if (placed.length == s.tiles.length && app.autoAdvance) _grade(placed.join(' '));
                      },
              ),
          ]),
          const SizedBox(height: 24),
          if (correct == null && (!app.autoAdvance || placed.length < s.tiles.length))
            Btn(label: 'Vérifier', shortcut: 'Entrée', onPressed: placed.isEmpty ? null : () => _grade(placed.join(' '))),
        ]);
      case StepKind.reading:
        body = Column(children: [
          Text(s.prompt, textAlign: TextAlign.center, style: context.text.headlineMedium),
          const SizedBox(height: 10),
          TextButton.icon(onPressed: () => _showText(context), icon: const Icon(Icons.article_rounded, size: 18), label: const Text('Revoir le texte')),
          const SizedBox(height: 26),
          _options(context, s),
        ]);
    }

    return Column(children: [
      Expanded(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(40, 44, 40, 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 860),
              child: Column(children: [
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Eyebrow(s.instruction),
                  if (isRetry) ...[const SizedBox(width: 10), Tag('Seconde chance', color: p.gold, icon: Icons.refresh_rounded)],
                ]),
                const SizedBox(height: 28),
                body,
              ]),
            ),
          ),
        ),
      ),
      _FeedbackBar(correct: correct, expected: s.kind == StepKind.order ? s.answer : s.answer, note: note, onNext: _next, item: s.item, source: widget.lesson.title),
    ]);
  }

  Widget _options(BuildContext context, PracticeStep s, {bool big = false}) {
    final p = context.pal;
    return LayoutBuilder(builder: (context, c) {
      final cols = c.maxWidth > 640 ? 2 : 1;
      final w = (c.maxWidth - (cols - 1) * 14) / cols;
      return Wrap(spacing: 14, runSpacing: 14, children: [
        for (final (i, o) in s.options.indexed)
          SizedBox(
            width: w,
            child: _Option(
              label: o,
              index: i + 1,
              big: big,
              state: correct == null
                  ? _OptState.idle
                  : o == s.answer
                      ? _OptState.right
                      : o == picked
                          ? _OptState.wrong
                          : _OptState.dim,
              onTap: correct == null ? () => _grade(o) : null,
              accent: p.accent,
            ),
          ),
      ]);
    });
  }

  void _showText(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(widget.lesson.title, style: ctx.text.headlineSmall),
        content: SizedBox(width: 640, child: SingleChildScrollView(child: _ReadingText(lesson: widget.lesson))),
        actions: [Btn(label: 'Fermer', kind: BtnKind.secondary, onPressed: () => Navigator.pop(ctx))],
      ),
    );
  }

  // ---------------- result ----------------
  Widget _result(BuildContext context) {
    final p = context.pal;
    final a = AppScope.of(context);
    final pct = graded == 0 ? 1.0 : firstTryCorrect / graded;
    final next = a.nextLesson;
    final mins = max(1, (watch.elapsed.inSeconds / 60).round());
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(40, 48, 40, 40),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 860),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Reveal(
              index: 0,
              child: Row(children: [
                Ring(value: pct, size: 120, stroke: 10, color: pct >= 0.8 ? p.success : p.accent, child: Text('${(pct * 100).round()} %', style: context.text.headlineMedium)),
                const SizedBox(width: 28),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Eyebrow('Leçon terminée'),
                    const SizedBox(height: 8),
                    Text(widget.lesson.title, style: context.text.displaySmall),
                    const SizedBox(height: 8),
                    Text('$firstTryCorrect bonnes réponses du premier coup sur $graded · $mins min', style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
                  ]),
                ),
              ]),
            ),
            const SizedBox(height: 28),
            Reveal(
              index: 1,
              child: Panel(
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Icon(pct >= 0.7 ? Icons.flag_rounded : Icons.outlined_flag_rounded, color: pct >= 0.7 ? p.success : p.gold),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(pct >= 0.7 ? 'Objectif atteint' : 'Objectif en cours', style: context.text.titleMedium),
                      const SizedBox(height: 4),
                      Text(widget.lesson.objective, style: context.text.bodyMedium),
                      const SizedBox(height: 6),
                      Text(
                        pct >= 0.7
                            ? 'Les éléments de cette leçon sont programmés dans vos révisions espacées.'
                            : 'Les éléments ratés reviendront en priorité dans vos révisions, dès dans 10 minutes.',
                        style: context.text.bodySmall,
                      ),
                    ]),
                  ),
                ]),
              ),
            ),
            if (mistakes.isNotEmpty) ...[
              const SizedBox(height: 20),
              Reveal(
                index: 2,
                child: Panel(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Vos erreurs, corrigées', style: context.text.titleMedium),
                    const SizedBox(height: 12),
                    for (final (prompt, given, expected) in mistakes)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 7),
                        child: Row(children: [
                          Expanded(flex: 3, child: Text(prompt, style: context.text.bodyMedium!.copyWith(fontWeight: FontWeight.w700))),
                          Expanded(flex: 3, child: Text(given.isEmpty ? '—' : given, style: context.text.bodyMedium!.copyWith(color: p.danger, decoration: TextDecoration.lineThrough))),
                          Icon(Icons.arrow_forward_rounded, size: 16, color: p.inkFaint),
                          const SizedBox(width: 10),
                          Expanded(flex: 3, child: Text(expected, style: context.text.bodyMedium!.copyWith(color: p.success, fontWeight: FontWeight.w700))),
                        ]),
                      ),
                  ]),
                ),
              ),
            ],
            const SizedBox(height: 28),
            Reveal(
              index: 3,
              child: Wrap(spacing: 12, runSpacing: 12, children: [
                if (next != null)
                  Btn(
                    label: 'Leçon suivante : ${next.title}',
                    icon: Icons.arrow_forward_rounded,
                    large: true,
                    onPressed: () {
                      a.closeLesson();
                      a.startLesson(next);
                    },
                  ),
                Btn(label: 'Retour', kind: BtnKind.secondary, large: true, onPressed: a.closeLesson),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

class _NoVoiceHint extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final app = AppScope.read(context);
    return Text(
      'Aucune voix ${app.language.locale} n’est installée sur cet ordinateur : ajoutez-la dans Paramètres Windows → Heure et langue → Voix.',
      textAlign: TextAlign.center,
      style: context.text.bodySmall!.copyWith(color: context.pal.danger),
    );
  }
}

enum _OptState { idle, right, wrong, dim }

class _Option extends StatefulWidget {
  const _Option({required this.label, required this.index, required this.state, required this.onTap, required this.accent, this.big = false});
  final String label;
  final int index;
  final _OptState state;
  final VoidCallback? onTap;
  final Color accent;
  final bool big;
  @override
  State<_Option> createState() => _OptionState();
}

class _OptionState extends State<_Option> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final (bg, bd, fg) = switch (widget.state) {
      _OptState.idle => (hover ? p.accentSoft : p.surface, hover ? p.accent : p.line, p.ink),
      _OptState.right => (p.successSoft, p.success, p.success),
      _OptState.wrong => (p.dangerSoft, p.danger, p.danger),
      _OptState.dim => (p.surface, p.line, p.inkFaint),
    };
    return Semantics(
      button: true,
      label: widget.label,
      child: MouseRegion(
        cursor: widget.onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: Tokens.fast,
            padding: EdgeInsets.symmetric(horizontal: 18, vertical: widget.big ? 22 : 16),
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(Tokens.rMd), border: Border.all(color: bd, width: 1.5)),
            child: Row(children: [
              Container(
                width: 26,
                height: 26,
                alignment: Alignment.center,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(7), border: Border.all(color: bd)),
                child: widget.state == _OptState.right
                    ? Icon(Icons.check_rounded, size: 16, color: p.success)
                    : widget.state == _OptState.wrong
                        ? Icon(Icons.close_rounded, size: 16, color: p.danger)
                        : Text('${widget.index}', style: context.text.labelMedium!.copyWith(color: p.inkSoft)),
              ),
              const SizedBox(width: 14),
              Expanded(child: Text(widget.label, style: (widget.big ? context.text.headlineSmall : context.text.titleMedium)!.copyWith(color: fg, fontFamily: widget.big ? Tokens.display : null))),
            ]),
          ),
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.text, required this.onTap, this.ghost = false});
  final String text;
  final VoidCallback? onTap;
  final bool ghost;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return MouseRegion(
      cursor: onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: ghost ? p.raised : p.accentSoft,
            borderRadius: BorderRadius.circular(Tokens.rSm),
            border: Border.all(color: ghost ? p.line : p.accent.withValues(alpha: 0.4)),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), offset: const Offset(0, 2), blurRadius: 3)],
          ),
          child: Text(text, style: context.text.titleLarge),
        ),
      ),
    );
  }
}

class _FeedbackBar extends StatelessWidget {
  const _FeedbackBar({required this.correct, required this.expected, required this.note, required this.onNext, this.item, required this.source});
  final bool? correct;
  final String expected;
  final String? note;
  final VoidCallback onNext;
  final Item? item;
  final String source;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final app = AppScope.of(context);
    final c = correct;
    return AnimatedContainer(
      duration: Tokens.base,
      curve: Tokens.ease,
      height: c == null ? 0 : 92,
      decoration: BoxDecoration(color: c == null ? p.paper : (c ? p.successSoft : p.dangerSoft), border: Border(top: BorderSide(color: c == null ? p.line : (c ? p.success : p.danger).withValues(alpha: 0.4)))),
      child: c == null
          ? const SizedBox.shrink()
          : ClipRect(
              child: OverflowBox(
                maxHeight: 92,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Row(children: [
                    Icon(c ? Icons.check_circle_rounded : Icons.cancel_rounded, color: c ? p.success : p.danger, size: 30),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(c ? (note == null ? 'Exact' : 'Accepté') : 'Pas tout à fait', style: context.text.titleLarge!.copyWith(color: c ? p.success : p.danger)),
                        Text(
                          c ? (note ?? (item != null ? '${item!.term}${item!.hint.isNotEmpty ? ' · ${item!.hint}' : ''} — ${item!.meaning}' : '')) : 'Réponse attendue : $expected · elle reviendra en fin de leçon',
                          style: context.text.bodyMedium!.copyWith(color: p.ink),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ]),
                    ),
                    if (item != null)
                      IconBtn(
                        icon: app.inVocab(item!.term) ? Icons.bookmark_rounded : Icons.bookmark_add_outlined,
                        tooltip: app.inVocab(item!.term) ? 'Dans mon vocabulaire' : 'Ajouter à mon vocabulaire',
                        onTap: () => app.toggleVocab(item!, source),
                      ),
                    const SizedBox(width: 10),
                    if (!c || !app.autoAdvance) Btn(label: 'Continuer', shortcut: 'Entrée', onPressed: onNext),
                  ]),
                ),
              ),
            ),
    );
  }
}

// ---------------- discovery phase ----------------
class _Learn extends StatelessWidget {
  const _Learn({required this.lesson, required this.onStart});
  final Lesson lesson;
  final VoidCallback onStart;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    Widget content;
    switch (lesson.type) {
      case LessonType.kana:
      case LessonType.kanji:
      case LessonType.vocab:
        content = LayoutBuilder(builder: (context, c) {
          final cols = c.maxWidth > 1000 ? 4 : c.maxWidth > 700 ? 3 : 2;
          final w = (c.maxWidth - (cols - 1) * 14) / cols;
          return Wrap(spacing: 14, runSpacing: 14, children: [
            for (final (i, it) in lesson.items.indexed)
              SizedBox(width: w, child: Reveal(index: min(i, 8), child: _ItemCard(item: it, source: lesson.title, big: lesson.type != LessonType.vocab))),
          ]);
        });
      case LessonType.grammar:
        content = Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Panel(
            color: p.accentSoft,
            border: p.accent.withValues(alpha: 0.25),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Eyebrow('La structure'),
              const SizedBox(height: 10),
              Text(lesson.point, style: context.text.displaySmall),
              const SizedBox(height: 14),
              Text(lesson.explain, style: context.text.bodyLarge),
            ]),
          ),
          const SizedBox(height: 22),
          const Eyebrow('Exemples à écouter'),
          const SizedBox(height: 10),
          for (final (i, e) in lesson.examples.indexed)
            Reveal(
              index: i,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: WordTarget(
                  text: e.text,
                  child: Panel(
                    padding: const EdgeInsets.all(18),
                    child: Row(children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          SelectableText(e.text, style: context.text.headlineSmall),
                          if (e.romaji.isNotEmpty) ...[const SizedBox(height: 4), Text(e.romaji, style: context.text.bodySmall)],
                          const SizedBox(height: 4),
                          Text(e.meaning, style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
                        ]),
                      ),
                      SpeakButtons(e.text),
                    ]),
                  ),
                ),
              ),
            ),
        ]);
      case LessonType.reading:
        content = Panel(child: _ReadingText(lesson: lesson, withAudio: true));
    }
    return Column(children: [
      Expanded(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(40, 36, 40, 24),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1080),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Eyebrow('${lesson.levelId} · ${lesson.unitTitle} · ${lesson.typeLabel}'),
                const SizedBox(height: 8),
                Text(lesson.title, style: context.text.displayMedium),
                const SizedBox(height: 12),
                Row(children: [
                  Icon(Icons.flag_rounded, size: 18, color: p.accent),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Objectif : ${lesson.objective}', style: context.text.bodyLarge!.copyWith(color: p.inkSoft))),
                ]),
                const SizedBox(height: 8),
                Text('Clic droit sur un mot : écouter, ajouter à votre vocabulaire, copier.', style: context.text.bodySmall),
                const SizedBox(height: 26),
                content,
              ]),
            ),
          ),
        ),
      ),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 18),
        decoration: BoxDecoration(border: Border(top: BorderSide(color: p.line))),
        child: Row(children: [
          Expanded(child: Text('Prenez le temps d’écouter chaque élément, puis passez à la pratique.', style: context.text.bodySmall)),
          Btn(label: 'Pratiquer', icon: Icons.arrow_forward_rounded, shortcut: 'Entrée', large: true, onPressed: onStart),
        ]),
      ),
    ]);
  }
}

class _ItemCard extends StatelessWidget {
  const _ItemCard({required this.item, required this.source, this.big = false});
  final Item item;
  final String source;
  final bool big;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final app = AppScope.of(context);
    return WordTarget(
      text: item.term,
      item: item,
      source: source,
      child: Panel(
        padding: const EdgeInsets.all(18),
        onTap: () => app.speech.speak(item.term),
        semanticLabel: 'Écouter ${item.term}',
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(
              child: Text(item.term, style: big ? context.text.displayMedium : context.text.headlineMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
            if (app.inVocab(item.term)) Icon(Icons.bookmark_rounded, size: 18, color: p.accent),
          ]),
          const SizedBox(height: 6),
          if (item.hint.isNotEmpty) Text(item.hint, style: context.text.bodySmall),
          const SizedBox(height: 4),
          Text(item.meaning, style: context.text.titleSmall!.copyWith(color: p.inkSoft)),
          const SizedBox(height: 12),
          SpeakButtons(item.term, compact: true),
        ]),
      ),
    );
  }
}

class _ReadingText extends StatefulWidget {
  const _ReadingText({required this.lesson, this.withAudio = false});
  final Lesson lesson;
  final bool withAudio;
  @override
  State<_ReadingText> createState() => _ReadingTextState();
}

class _ReadingTextState extends State<_ReadingText> {
  bool translation = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final l = widget.lesson;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (widget.withAudio)
        Row(children: [
          SpeakButtons(l.readingText),
          const SizedBox(width: 14),
          Expanded(child: Text('Survolez un mot pour sa lecture et son sens.', style: context.text.bodySmall)),
          TextButton.icon(
            onPressed: () => setState(() => translation = !translation),
            icon: Icon(translation ? Icons.visibility_off_rounded : Icons.translate_rounded, size: 18),
            label: Text(translation ? 'Masquer la traduction' : 'Afficher la traduction'),
          ),
        ]),
      const SizedBox(height: 16),
      Wrap(runSpacing: 6, children: [
        for (final t in l.tokens)
          t.meaning.isEmpty
              ? Text(t.text, style: context.text.headlineSmall!.copyWith(height: 1.9))
              : WordTarget(
                  text: t.text,
                  item: Item(id: 'word:${t.text}', term: t.text, reading: t.reading, meaning: t.meaning),
                  source: l.title,
                  child: Tooltip(
                    message: '${t.reading.isNotEmpty ? '${t.reading} · ' : ''}${t.meaning}',
                    child: MouseRegion(
                      cursor: SystemMouseCursors.help,
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 1),
                        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.accent.withValues(alpha: 0.35), width: 1.5))),
                        child: Text(t.text, style: context.text.headlineSmall!.copyWith(height: 1.9)),
                      ),
                    ),
                  ),
                ),
      ]),
      AnimatedCrossFade(
        duration: Tokens.base,
        crossFadeState: translation ? CrossFadeState.showSecond : CrossFadeState.showFirst,
        firstChild: const SizedBox(width: double.infinity),
        secondChild: Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Text(l.translation, style: context.text.bodyLarge!.copyWith(color: p.inkSoft, fontStyle: FontStyle.italic)),
        ),
      ),
    ]);
  }
}
