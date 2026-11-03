// Spaced-repetition reviews: an overview of the schedule, and the review session itself.
import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../content/models.dart';
import '../../core/app_state.dart';
import '../../core/srs.dart';
import '../theme.dart';
import '../widgets.dart';

class ReviewScreen extends StatelessWidget {
  const ReviewScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final boxes = List.filled(Srs.intervals.length, 0);
    for (final c in app.cards) {
      boxes[c.box]++;
    }
    final now = DateTime.now();
    final tomorrow = app.cards.where((c) => c.due.isAfter(now) && c.due.isBefore(now.add(const Duration(days: 1)))).length;
    const boxNames = ['Nouveau', '1 j', '3 j', '1 sem', '2 sem', '5 sem', '3 mois'];
    return PageFrame(
      eyebrow: 'Répétition espacée',
      title: 'Révisions',
      subtitle: 'Chaque mot revient juste avant que vous ne l’oubliiez. Une erreur le ramène au début et le fait revenir dans 10 minutes.',
      children: [
        Reveal(
          index: 0,
          child: Panel(
            padding: const EdgeInsets.all(28),
            child: Row(children: [
              Ring(value: app.cards.isEmpty ? 0 : 1 - app.dueCount / app.cards.length, size: 110, stroke: 10, child: Column(mainAxisSize: MainAxisSize.min, children: [
                Text('${app.dueCount}', style: context.text.displaySmall),
                Text('à revoir', style: context.text.bodySmall),
              ])),
              const SizedBox(width: 28),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(app.dueCount > 0 ? '${app.dueCount} carte${app.dueCount > 1 ? 's' : ''} vous attend${app.dueCount > 1 ? 'ent' : ''}' : 'Tout est à jour', style: context.text.headlineMedium),
                  const SizedBox(height: 6),
                  Text(
                    app.cards.isEmpty ? 'Terminez une leçon : ses mots entreront automatiquement dans vos révisions.' : '$tomorrow de plus dans les prochaines 24 h · ${app.cards.length} cartes au total · ${app.masteredCount} maîtrisées',
                    style: context.text.bodyMedium!.copyWith(color: p.inkSoft),
                  ),
                ]),
              ),
              Btn(label: 'Commencer', icon: Icons.play_arrow_rounded, large: true, onPressed: app.dueCount > 0 ? app.startReview : null),
            ]),
          ),
        ),
        const SizedBox(height: 20),
        Reveal(
          index: 1,
          child: Panel(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Eyebrow('Répartition par intervalle'),
              const SizedBox(height: 18),
              SizedBox(
                height: 150,
                child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  for (var i = 0; i < boxes.length; i++)
                    Expanded(
                      child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                        Text('${boxes[i]}', style: context.text.labelMedium),
                        const SizedBox(height: 4),
                        TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: app.cards.isEmpty ? 0 : boxes[i] / app.cards.length),
                          duration: Duration(milliseconds: 420 + i * 60),
                          curve: Tokens.ease,
                          builder: (_, v, _) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 10),
                            height: 4 + 100 * v,
                            decoration: BoxDecoration(color: i >= Srs.masteredBox ? p.success : p.accent.withValues(alpha: 0.3 + i * 0.12), borderRadius: BorderRadius.circular(6)),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(boxNames[i], style: context.text.labelSmall),
                      ]),
                    ),
                ]),
              ),
            ]),
          ),
        ),
      ],
    );
  }
}

class _Card {
  _Card(this.item, this.options, this.reverse);
  final Item item;
  final List<String> options;
  final bool reverse; // reverse: show the meaning, pick the term
}

class ReviewSession extends StatefulWidget {
  const ReviewSession({super.key});
  @override
  State<ReviewSession> createState() => _ReviewSessionState();
}

class _ReviewSessionState extends State<ReviewSession> {
  List<_Card> queue = [];
  int i = 0, right = 0, done = 0;
  String? picked;
  bool loading = true;
  final focus = FocusNode();
  final watch = Stopwatch()..start();
  Timer? t;

  AppState get app => AppScope.read(context);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    t?.cancel();
    focus.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final rnd = Random();
    final due = await app.store.dueCards(app.lang, DateTime.now(), limit: 30);
    final items = app.course.items;
    final all = items.values.toList();
    final cards = <_Card>[];
    for (final (n, c) in due.indexed) {
      final it = items[c.itemId];
      if (it == null) continue;
      final reverse = n.isOdd && it.meaning.isNotEmpty;
      final correct = reverse ? it.term : it.meaning;
      final pool = (all.map((x) => reverse ? x.term : x.meaning).where((x) => x != correct && x.isNotEmpty).toSet().toList()..shuffle(rnd)).take(3);
      cards.add(_Card(it, ([correct, ...pool]..shuffle(rnd)), reverse));
    }
    setState(() {
      queue = cards;
      loading = false;
    });
    _show();
  }

  void _show() {
    focus.requestFocus();
    if (i < queue.length && !queue[i].reverse) app.speech.speak(queue[i].item.term);
  }

  Future<void> _pick(String o) async {
    if (picked != null) return;
    final c = queue[i];
    final ok = o == (c.reverse ? c.item.term : c.item.meaning);
    setState(() {
      picked = o;
      done++;
      if (ok) right++;
    });
    await app.store.grade(app.lang, c.item.id, ok);
    if (!ok) await app.store.logMistake(app.lang, c.item.id, c.reverse ? c.item.meaning : c.item.term, o, c.reverse ? c.item.term : c.item.meaning);
    if (c.reverse) app.speech.speak(c.item.term);
    if (ok && app.autoAdvance) t = Timer(const Duration(milliseconds: 800), _next);
  }

  void _next() {
    t?.cancel();
    if (picked == null) return;
    setState(() {
      i++;
      picked = null;
    });
    if (i >= queue.length) {
      app.store.addActivity(app.lang, xp: right, seconds: watch.elapsed.inSeconds);
    } else {
      _show();
    }
  }

  KeyEventResult _key(FocusNode n, KeyEvent e) {
    if (e is! KeyDownEvent) return KeyEventResult.ignored;
    if (e.logicalKey == LogicalKeyboardKey.escape) {
      _close();
      return KeyEventResult.handled;
    }
    if (i >= queue.length) return KeyEventResult.ignored;
    if (e.logicalKey == LogicalKeyboardKey.enter) {
      _next();
      return KeyEventResult.handled;
    }
    if (e.logicalKey == LogicalKeyboardKey.space) {
      app.speech.speak(queue[i].item.term);
      return KeyEventResult.handled;
    }
    final d = [LogicalKeyboardKey.digit1, LogicalKeyboardKey.digit2, LogicalKeyboardKey.digit3, LogicalKeyboardKey.digit4].indexOf(e.logicalKey);
    if (d >= 0 && d < queue[i].options.length) {
      _pick(queue[i].options[d]);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  void _close() {
    if (done > 0 && i < queue.length) app.store.addActivity(app.lang, xp: right, seconds: watch.elapsed.inSeconds);
    app.closeReview();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    if (loading) return const Center(child: CircularProgressIndicator());
    final finished = i >= queue.length;
    return Focus(
      focusNode: focus,
      autofocus: true,
      onKeyEvent: _key,
      child: Column(children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
          child: Row(children: [
            IconBtn(icon: Icons.close_rounded, tooltip: 'Terminer (Échap)', onTap: _close),
            const SizedBox(width: 16),
            Expanded(child: Bar(value: queue.isEmpty ? 1 : i / queue.length, height: 8)),
            const SizedBox(width: 16),
            Text('${min(i + 1, queue.length)} / ${queue.length}', style: context.text.labelMedium),
          ]),
        ),
        Expanded(
          child: AnimatedSwitcher(
            duration: Tokens.base,
            child: finished
                ? Center(
                    key: const ValueKey('done'),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Ring(value: done == 0 ? 0 : right / done, size: 120, stroke: 10, color: p.success, child: Text('$right/$done', style: context.text.headlineMedium)),
                      const SizedBox(height: 24),
                      Text(queue.isEmpty ? 'Rien à réviser pour l’instant' : 'Révision terminée', style: context.text.displaySmall),
                      const SizedBox(height: 8),
                      Text('Les cartes ratées reviendront dans 10 minutes ; les autres s’espacent.', style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
                      const SizedBox(height: 28),
                      Btn(label: 'Terminer', large: true, onPressed: _close),
                    ]),
                  )
                : _cardView(context, queue[i]),
          ),
        ),
      ]),
    );
  }

  Widget _cardView(BuildContext context, _Card c) {
    final p = context.pal;
    final answer = c.reverse ? c.item.term : c.item.meaning;
    return SingleChildScrollView(
      key: ValueKey('card-$i'),
      padding: const EdgeInsets.fromLTRB(40, 56, 40, 40),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 820),
          child: Column(children: [
            Eyebrow(c.reverse ? 'Comment dit-on ?' : 'Que signifie ?'),
            const SizedBox(height: 22),
            WordTarget(
              text: c.item.term,
              item: c.item,
              source: 'Révisions',
              child: Text(c.reverse ? c.item.meaning : c.item.term, textAlign: TextAlign.center, style: c.reverse ? context.text.displaySmall : context.text.displayLarge),
            ),
            if (picked != null && c.item.hint.isNotEmpty) ...[const SizedBox(height: 8), Text(c.item.hint, style: context.text.bodyLarge!.copyWith(color: p.inkSoft))],
            const SizedBox(height: 14),
            SpeakButtons(c.item.term),
            const SizedBox(height: 36),
            LayoutBuilder(builder: (context, cons) {
              final w = (cons.maxWidth - 14) / 2;
              return Wrap(spacing: 14, runSpacing: 14, children: [
                for (final (k, o) in c.options.indexed)
                  SizedBox(
                    width: w,
                    child: Panel(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                      onTap: picked == null ? () => _pick(o) : null,
                      color: picked == null ? null : (o == answer ? p.successSoft : o == picked ? p.dangerSoft : null),
                      border: picked == null ? null : (o == answer ? p.success : o == picked ? p.danger : null),
                      radius: Tokens.rMd,
                      child: Row(children: [
                        KeyCap('${k + 1}'),
                        const SizedBox(width: 14),
                        Expanded(child: Text(o, style: c.reverse ? context.text.headlineSmall : context.text.titleMedium)),
                      ]),
                    ),
                  ),
              ]);
            }),
            const SizedBox(height: 28),
            if (picked != null && (picked != answer || !app.autoAdvance)) Btn(label: 'Continuer', shortcut: 'Entrée', onPressed: _next),
          ]),
        ),
      ),
    );
  }
}
