// Dialogues: scripted real-life conversations. The partner speaks (with translation on demand),
// the learner picks a reply; wrong replies are explained, and a report closes the scene.
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../content/dialogue.dart';
import '../../content/models.dart';
import '../../core/app_state.dart';
import '../scene.dart';
import '../theme.dart';
import '../widgets.dart';

/// "Le serveur" → "le serveur", but names stay capitalised ("Tanaka").
String _who(String partner) =>
    RegExp(r"^(Le|La|Les|L’|L'|Un|Une|Il|Lo|El|Los|Las)\b").hasMatch(partner) ? partner[0].toLowerCase() + partner.substring(1) : partner;

class DialoguesScreen extends StatelessWidget {
  const DialoguesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final list = app.dialogues;
    return PageFrame(
      eyebrow: '${app.language.name} · conversations de la vie réelle',
      title: 'Dialogues',
      subtitle: 'Votre interlocuteur parle, vous choisissez votre réplique. Chaque erreur est expliquée, et la scène se termine par un bilan.',
      children: [
        LayoutBuilder(builder: (context, c) {
          final cols = c.maxWidth > 980 ? 3 : c.maxWidth > 640 ? 2 : 1;
          final w = (c.maxWidth - (cols - 1) * 20) / cols;
          return Wrap(spacing: 20, runSpacing: 20, children: [
            for (final (i, d) in list.indexed) SizedBox(width: w, child: Reveal(index: i, child: _SceneCard(dialogue: d, index: i))),
          ]);
        }),
        const SizedBox(height: 24),
        Panel(
          color: context.pal.sidebar,
          padding: const EdgeInsets.all(18),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(Icons.info_outline_rounded, size: 18, color: context.pal.inkSoft),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Ces scènes sont écrites à l’avance et fonctionnent hors ligne. Une conversation libre avec une IA demanderait un serveur dédié (voir Paramètres).',
                style: context.text.bodySmall,
              ),
            ),
          ]),
        ),
      ],
    );
  }
}

class _SceneCard extends StatelessWidget {
  const _SceneCard({required this.dialogue, required this.index});
  final Dialogue dialogue;
  final int index;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final score = app.completed['dlg:${dialogue.id}'];
    final mood = SceneMood.of(app.lang, const ['A1', 'A2', 'B1', 'B2'][index % 4], Theme.of(context).brightness);
    return Panel(
      padding: EdgeInsets.zero,
      onTap: () => app.startDialogue(dialogue),
      semanticLabel: 'Jouer la scène ${dialogue.title}',
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        ClipRRect(
          borderRadius: const BorderRadius.vertical(top: Radius.circular(Tokens.rLg)),
          child: SizedBox(
            height: 128,
            child: Stack(children: [
              Positioned.fill(child: Landscape(mood: mood, lang: app.lang, seed: 20 + index * 7, horizon: 0.45)),
              Positioned(
                left: 16,
                bottom: 12,
                child: Tag(dialogue.level, color: mood.night ? Colors.white : const Color(0xFF1A1E29)),
              ),
              if (score != null)
                Positioned(right: 14, top: 12, child: Tag('${(score * 100).round()} %', color: p.success, icon: Icons.check_rounded)),
            ]),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(dialogue.title, style: context.text.headlineSmall),
            const SizedBox(height: 4),
            Text('${dialogue.place} · avec ${_who(dialogue.partner)}', style: context.text.bodySmall),
            const SizedBox(height: 14),
            Row(children: [
              Icon(Icons.forum_outlined, size: 16, color: p.accent),
              const SizedBox(width: 6),
              Expanded(child: Text('${dialogue.choiceCount} répliques à choisir', overflow: TextOverflow.ellipsis, style: context.text.labelMedium!.copyWith(color: p.inkSoft))),
              Text(score == null ? 'Jouer' : 'Rejouer', style: context.text.labelLarge!.copyWith(color: p.accent)),
              Icon(Icons.chevron_right_rounded, color: p.accent),
            ]),
          ]),
        ),
      ]),
    );
  }
}

class _Bubble {
  _Bubble({required this.mine, required this.text, this.fr = '', this.reading = ''});
  final bool mine;
  final String text, fr, reading;
}

class _Miss {
  _Miss(this.task, this.wrong, this.why, this.right);
  final String task, wrong, why, right;
}

class DialoguePlayer extends StatefulWidget {
  const DialoguePlayer({super.key, required this.dialogue});
  final Dialogue dialogue;
  @override
  State<DialoguePlayer> createState() => _DialoguePlayerState();
}

class _DialoguePlayerState extends State<DialoguePlayer> {
  final bubbles = <_Bubble>[];
  final misses = <_Miss>[];
  final tried = <int>{}; // choices already tried on the current turn
  final scroll = ScrollController();
  final focus = FocusNode(debugLabel: 'dialogue');
  final watch = Stopwatch()..start();
  int turn = 0;
  int firstTry = 0;
  bool showFr = false;
  bool partnerTyping = false;
  bool finished = false;
  bool saved = false;
  Timer? timer;

  AppState get app => AppScope.read(context);
  Dialogue get d => widget.dialogue;
  DialogueTurn? get current => turn < d.turns.length ? d.turns[turn] : null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      focus.requestFocus();
      _play();
    });
  }

  @override
  void dispose() {
    timer?.cancel();
    scroll.dispose();
    focus.dispose();
    super.dispose();
  }

  void _toBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (scroll.hasClients) scroll.animateTo(scroll.position.maxScrollExtent, duration: Tokens.base, curve: Tokens.ease);
    });
  }

  /// Plays partner lines until it is the learner's turn (or the scene ends).
  void _play() {
    final t = current;
    if (t == null) {
      _finish();
      return;
    }
    if (t.mine) {
      setState(() => tried.clear());
      _toBottom();
      return;
    }
    setState(() => partnerTyping = true);
    _toBottom();
    timer = Timer(const Duration(milliseconds: 650), () async {
      if (!mounted) return;
      setState(() {
        partnerTyping = false;
        bubbles.add(_Bubble(mine: false, text: t.text, fr: t.fr, reading: t.reading));
      });
      _toBottom();
      await app.speech.speak(t.text);
      if (!mounted) return;
      timer = Timer(const Duration(milliseconds: 250), () {
        if (!mounted) return;
        setState(() => turn++);
        _play();
      });
    });
  }

  Future<void> _choose(int i) async {
    final t = current;
    if (t == null || !t.mine || tried.contains(i) && !t.choices[i].ok) return;
    final c = t.choices[i];
    if (!c.ok) {
      setState(() => tried.add(i));
      misses.add(_Miss(t.task, c.text, c.why, t.choices.firstWhere((x) => x.ok).text));
      await app.store.logMistake(app.lang, 'dlg:${d.id}', t.task, c.text, t.choices.firstWhere((x) => x.ok).text);
      return;
    }
    if (tried.isEmpty) firstTry++;
    setState(() {
      bubbles.add(_Bubble(mine: true, text: c.text, fr: c.fr, reading: c.reading));
      turn++;
    });
    _toBottom();
    await app.speech.speak(c.text);
    if (mounted) _play();
  }

  Future<void> _finish() async {
    if (finished) return;
    setState(() => finished = true);
    _toBottom();
    watch.stop();
    if (!saved) {
      saved = true;
      await app.store.completeLesson(app.lang, 'dlg:${d.id}', firstTry, d.choiceCount);
      await app.store.addActivity(app.lang, xp: 8 + firstTry * 3, seconds: watch.elapsed.inSeconds);
    }
  }

  void _restart() {
    timer?.cancel();
    app.speech.stop();
    setState(() {
      bubbles.clear();
      misses.clear();
      tried.clear();
      turn = 0;
      firstTry = 0;
      finished = false;
      saved = false;
    });
    watch
      ..reset()
      ..start();
    _play();
  }

  void _quit() {
    timer?.cancel();
    app.speech.stop();
    if (!finished && watch.elapsed.inSeconds > 20) app.store.addActivity(app.lang, seconds: watch.elapsed.inSeconds);
    app.closeDialogue();
  }

  KeyEventResult _key(FocusNode n, KeyEvent e) {
    if (e is! KeyDownEvent) return KeyEventResult.ignored;
    final k = e.logicalKey;
    if (k == LogicalKeyboardKey.escape) {
      _quit();
      return KeyEventResult.handled;
    }
    if (k == LogicalKeyboardKey.keyT) {
      setState(() => showFr = !showFr);
      return KeyEventResult.handled;
    }
    if (k == LogicalKeyboardKey.space) {
      final last = bubbles.lastWhere((b) => !b.mine, orElse: () => _Bubble(mine: false, text: ''));
      if (last.text.isNotEmpty) app.speech.speak(last.text);
      return KeyEventResult.handled;
    }
    if (finished && k == LogicalKeyboardKey.enter) {
      _quit();
      return KeyEventResult.handled;
    }
    final t = current;
    final idx = [LogicalKeyboardKey.digit1, LogicalKeyboardKey.digit2, LogicalKeyboardKey.digit3, LogicalKeyboardKey.digit4].indexOf(k);
    if (t != null && t.mine && idx >= 0 && idx < t.choices.length) {
      _choose(idx);
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final t = current;
    return Focus(
      focusNode: focus,
      onKeyEvent: _key,
      child: Column(children: [
        // header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
          decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
          child: Row(children: [
            IconBtn(icon: Icons.close_rounded, tooltip: 'Quitter (Échap)', onTap: _quit),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(d.title, style: context.text.titleMedium),
                Text('${d.place} · avec ${_who(d.partner)}', style: context.text.bodySmall),
              ]),
            ),
            SizedBox(width: 160, child: Bar(value: d.choiceCount == 0 ? 1 : (bubbles.where((b) => b.mine).length / d.choiceCount), height: 6)),
            const SizedBox(width: 16),
            TextButton.icon(
              onPressed: () => setState(() => showFr = !showFr),
              icon: Icon(showFr ? Icons.visibility_off_rounded : Icons.translate_rounded, size: 18),
              label: Text(showFr ? 'Masquer la traduction  (T)' : 'Traduction  (T)'),
            ),
          ]),
        ),
        Expanded(
          child: Scrollbar(
            controller: scroll,
            child: SingleChildScrollView(
              controller: scroll,
              padding: const EdgeInsets.fromLTRB(32, 28, 32, 28),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 780),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    for (final b in bubbles) _BubbleView(bubble: b, showFr: showFr, partner: d.partner),
                    if (partnerTyping) const _Typing(),
                    if (finished) _Report(dialogue: d, firstTry: firstTry, misses: misses, onReplay: _restart, onDone: _quit),
                  ]),
                ),
              ),
            ),
          ),
        ),
        // choices
        AnimatedSize(
          duration: Tokens.base,
          curve: Tokens.ease,
          child: t != null && t.mine && !finished
              ? Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(32, 18, 32, 22),
                  decoration: BoxDecoration(color: p.surface, border: Border(top: BorderSide(color: p.line))),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 780),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Row(children: [
                          Icon(Icons.record_voice_over_rounded, size: 18, color: p.accent),
                          const SizedBox(width: 8),
                          Expanded(child: Text(t.task, style: context.text.titleMedium)),
                          Text('1 · 2 · 3', style: context.text.labelSmall),
                        ]),
                        const SizedBox(height: 12),
                        for (final (i, c) in t.choices.indexed) _ChoiceView(index: i, choice: c, wrong: tried.contains(i), showFr: showFr, onTap: () => _choose(i)),
                      ]),
                    ),
                  ),
                )
              : const SizedBox(width: double.infinity),
        ),
      ]),
    );
  }
}

class _BubbleView extends StatefulWidget {
  const _BubbleView({required this.bubble, required this.showFr, required this.partner});
  final _Bubble bubble;
  final bool showFr;
  final String partner;
  @override
  State<_BubbleView> createState() => _BubbleViewState();
}

class _BubbleViewState extends State<_BubbleView> {
  bool reveal = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final app = AppScope.read(context);
    final b = widget.bubble;
    final fr = widget.showFr || reveal;
    final bg = b.mine ? p.accent : p.surface;
    final fg = b.mine ? p.onAccent : p.ink;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Tokens.base,
      curve: Tokens.ease,
      builder: (_, v, child) => Opacity(opacity: v, child: Transform.translate(offset: Offset(0, (1 - v) * 10), child: child)),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(
          mainAxisAlignment: b.mine ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!b.mine) ...[
              CircleAvatar(radius: 16, backgroundColor: p.sidebar, child: Text(widget.partner.replaceAll(RegExp(r'^(Le|La|L’|L\x27|Un|Une|El|Il|Lo)\s+'), '').characters.first.toUpperCase(), style: context.text.labelLarge)),
              const SizedBox(width: 10),
            ],
            Flexible(
              child: WordTarget(
                text: b.text,
                item: Item(id: 'phrase:${b.text}', term: b.text, reading: b.reading, meaning: b.fr),
                source: 'Dialogues',
                child: GestureDetector(
                  onTap: () => setState(() => reveal = !reveal),
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 560),
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                    decoration: BoxDecoration(
                      color: bg,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(b.mine ? 18 : 4),
                        bottomRight: Radius.circular(b.mine ? 4 : 18),
                      ),
                      border: b.mine ? null : Border.all(color: p.line),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(b.text, style: context.text.titleLarge!.copyWith(color: fg, fontWeight: FontWeight.w600)),
                      if (fr && b.reading.isNotEmpty) ...[const SizedBox(height: 2), Text(b.reading, style: context.text.bodySmall!.copyWith(color: fg.withValues(alpha: 0.75)))],
                      if (fr && b.fr.isNotEmpty) ...[const SizedBox(height: 4), Text(b.fr, style: context.text.bodyMedium!.copyWith(color: fg.withValues(alpha: 0.8), fontStyle: FontStyle.italic))],
                    ]),
                  ),
                ),
              ),
            ),
            if (!b.mine) ...[const SizedBox(width: 6), IconBtn(icon: Icons.volume_up_rounded, tooltip: 'Réécouter (Espace)', onTap: () => app.speech.speak(b.text), size: 30)],
          ],
        ),
      ),
    );
  }
}

class _Typing extends StatefulWidget {
  const _Typing();
  @override
  State<_Typing> createState() => _TypingState();
}

class _TypingState extends State<_Typing> with SingleTickerProviderStateMixin {
  late final c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Padding(
      padding: const EdgeInsets.only(left: 42, bottom: 14),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: p.line)),
          child: AnimatedBuilder(
            animation: c,
            builder: (_, _) => Row(mainAxisSize: MainAxisSize.min, children: [
              for (var i = 0; i < 3; i++)
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: p.inkFaint.withValues(alpha: ((c.value * 3 - i) % 3) < 1 ? 1 : 0.35),
                    shape: BoxShape.circle,
                  ),
                ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _ChoiceView extends StatefulWidget {
  const _ChoiceView({required this.index, required this.choice, required this.wrong, required this.showFr, required this.onTap});
  final int index;
  final DialogueChoice choice;
  final bool wrong, showFr;
  final VoidCallback onTap;
  @override
  State<_ChoiceView> createState() => _ChoiceViewState();
}

class _ChoiceViewState extends State<_ChoiceView> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final c = widget.choice;
    final wrong = widget.wrong;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: MouseRegion(
        cursor: wrong ? SystemMouseCursors.basic : SystemMouseCursors.click,
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(
          onTap: wrong ? null : widget.onTap,
          child: AnimatedContainer(
            duration: Tokens.fast,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: wrong ? p.dangerSoft : (hover ? p.accentSoft : p.raised),
              borderRadius: BorderRadius.circular(Tokens.rMd),
              border: Border.all(color: wrong ? p.danger.withValues(alpha: 0.5) : (hover ? p.accent : p.line), width: 1.4),
            ),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Padding(padding: const EdgeInsets.only(top: 3), child: KeyCap('${widget.index + 1}', color: wrong ? p.danger : null)),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(c.text, style: context.text.titleMedium!.copyWith(color: wrong ? p.danger : p.ink, decoration: wrong ? TextDecoration.lineThrough : null)),
                  if (widget.showFr && c.reading.isNotEmpty) Text(c.reading, style: context.text.bodySmall),
                  if (wrong) ...[
                    const SizedBox(height: 6),
                    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Icon(Icons.lightbulb_outline_rounded, size: 16, color: p.danger),
                      const SizedBox(width: 6),
                      Expanded(child: Text(c.why, style: context.text.bodyMedium!.copyWith(color: p.ink))),
                    ]),
                  ],
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _Report extends StatelessWidget {
  const _Report({required this.dialogue, required this.firstTry, required this.misses, required this.onReplay, required this.onDone});
  final Dialogue dialogue;
  final int firstTry;
  final List<_Miss> misses;
  final VoidCallback onReplay, onDone;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final total = dialogue.choiceCount;
    final pct = total == 0 ? 1.0 : firstTry / total;
    return Reveal(
      index: 0,
      child: Container(
        margin: const EdgeInsets.only(top: 18),
        child: Panel(
          padding: const EdgeInsets.all(28),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Ring(value: pct, size: 84, stroke: 8, color: pct >= 0.75 ? p.success : p.accent, child: Text('$firstTry/$total', style: context.text.titleLarge)),
              const SizedBox(width: 20),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Eyebrow('Scène terminée'),
                  const SizedBox(height: 6),
                  Text(pct == 1 ? 'Conversation parfaite' : 'Conversation réussie', style: context.text.headlineSmall),
                  Text('$firstTry réplique${firstTry > 1 ? 's' : ''} juste${firstTry > 1 ? 's' : ''} du premier coup sur $total', style: context.text.bodySmall),
                ]),
              ),
            ]),
            if (misses.isNotEmpty) ...[
              const SizedBox(height: 22),
              Text('Vos corrections', style: context.text.titleMedium),
              const SizedBox(height: 8),
              for (final m in misses)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(m.task, style: context.text.labelMedium!.copyWith(color: p.inkSoft)),
                    const SizedBox(height: 2),
                    Text.rich(TextSpan(children: [
                      TextSpan(text: m.wrong, style: TextStyle(color: p.danger, decoration: TextDecoration.lineThrough)),
                      const TextSpan(text: '   →   '),
                      TextSpan(text: m.right, style: TextStyle(color: p.success, fontWeight: FontWeight.w800)),
                    ]), style: context.text.bodyLarge),
                    Text(m.why, style: context.text.bodySmall),
                  ]),
                ),
            ],
            const SizedBox(height: 22),
            Text('Expressions à retenir', style: context.text.titleMedium),
            const SizedBox(height: 8),
            for (final e in dialogue.expressions)
              Builder(builder: (context) {
                final it = Item(id: 'expr:${e.text}', term: e.text, meaning: e.fr);
                final saved = app.inVocab(e.text);
                return WordTarget(
                  text: e.text,
                  item: it,
                  source: 'Dialogue · ${dialogue.title}',
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(children: [
                      Expanded(flex: 4, child: Text(e.text, style: context.text.titleMedium!.copyWith(fontFamily: Tokens.display))),
                      Expanded(flex: 4, child: Text(e.fr, style: context.text.bodyMedium!.copyWith(color: p.inkSoft))),
                      IconBtn(icon: Icons.volume_up_rounded, tooltip: 'Écouter', onTap: () => app.speech.speak(e.text), size: 30),
                      IconBtn(
                        icon: saved ? Icons.bookmark_rounded : Icons.bookmark_add_outlined,
                        tooltip: saved ? 'Dans mon vocabulaire' : 'Ajouter à mon vocabulaire',
                        color: saved ? p.accent : null,
                        onTap: () => app.toggleVocab(it, 'Dialogue · ${dialogue.title}'),
                        size: 30,
                      ),
                    ]),
                  ),
                );
              }),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: p.accentSoft, borderRadius: BorderRadius.circular(Tokens.rMd)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Icon(Icons.public_rounded, size: 18, color: p.accent),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Le saviez-vous ?', style: context.text.titleSmall!.copyWith(color: p.accent)),
                    const SizedBox(height: 4),
                    Text(dialogue.culture, style: context.text.bodyMedium),
                  ]),
                ),
              ]),
            ),
            const SizedBox(height: 22),
            Wrap(spacing: 12, runSpacing: 12, children: [
              Btn(label: 'Terminer', icon: Icons.check_rounded, shortcut: 'Entrée', onPressed: onDone),
              Btn(label: 'Rejouer la scène', icon: Icons.replay_rounded, kind: BtnKind.secondary, onPressed: onReplay),
            ]),
          ]),
        ),
      ),
    );
  }
}
