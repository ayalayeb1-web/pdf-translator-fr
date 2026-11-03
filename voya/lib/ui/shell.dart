// The desktop shell: custom title bar, side navigation, central stage, audio player bar,
// keyboard shortcuts and the command palette.
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../audio/speech.dart';
import '../content/models.dart';
import '../core/app_state.dart';
import 'screens/dashboard.dart';
import 'screens/lesson_player.dart';
import 'screens/path_screen.dart';
import 'screens/review_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/speaking_lab.dart';
import 'screens/vocabulary_screen.dart';
import 'theme.dart';
import 'widgets.dart';

class NavItem {
  const NavItem(this.section, this.label, this.icon, this.key);
  final Section section;
  final String label;
  final IconData icon;
  final String key;
}

const navItems = [
  NavItem(Section.home, 'Aujourd’hui', Icons.wb_twilight_rounded, '1'),
  NavItem(Section.path, 'Parcours', Icons.route_rounded, '2'),
  NavItem(Section.review, 'Révisions', Icons.replay_circle_filled_rounded, '3'),
  NavItem(Section.vocabulary, 'Mon vocabulaire', Icons.bookmarks_rounded, '4'),
  NavItem(Section.speaking, 'Speaking Lab', Icons.graphic_eq_rounded, '5'),
];

class OpenPaletteIntent extends Intent {
  const OpenPaletteIntent();
}

class GoIntent extends Intent {
  const GoIntent(this.section);
  final Section section;
}

class FullScreenIntent extends Intent {
  const FullScreenIntent();
}

class HelpIntent extends Intent {
  const HelpIntent();
}

class ReplayIntent extends Intent {
  const ReplayIntent();
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {

  Map<ShortcutActivator, Intent> get _shortcuts => {
        const SingleActivator(LogicalKeyboardKey.keyK, control: true): const OpenPaletteIntent(),
        const SingleActivator(LogicalKeyboardKey.f11): const FullScreenIntent(),
        const SingleActivator(LogicalKeyboardKey.f1): const HelpIntent(),
        const SingleActivator(LogicalKeyboardKey.slash, control: true): const HelpIntent(),
        const SingleActivator(LogicalKeyboardKey.keyR, control: true): const ReplayIntent(),
        const SingleActivator(LogicalKeyboardKey.comma, control: true): const GoIntent(Section.settings),
        for (var i = 0; i < navItems.length; i++)
          SingleActivator(LogicalKeyboardKey(LogicalKeyboardKey.digit1.keyId + i), control: true): GoIntent(navItems[i].section),
      };

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final inActivity = app.activeLesson != null || app.reviewing;
    final immersive = !inActivity && (app.section == Section.home || app.section == Section.path);
    Widget stage;
    if (app.activeLesson != null) {
      stage = LessonPlayer(key: ValueKey('lesson-${app.activeLesson!.id}'), lesson: app.activeLesson!);
    } else if (app.reviewing) {
      stage = const ReviewSession(key: ValueKey('review-session'));
    } else {
      stage = KeyedSubtree(
        key: ValueKey('${app.section}-${app.lang}'),
        child: switch (app.section) {
          Section.home => const Dashboard(),
          Section.path => const PathScreen(),
          Section.review => const ReviewScreen(),
          Section.vocabulary => const VocabularyScreen(),
          Section.speaking => const SpeakingLab(),
          Section.settings => const SettingsScreen(),
        },
      );
    }

    return Shortcuts(
      shortcuts: _shortcuts,
      child: Actions(
        actions: {
          OpenPaletteIntent: CallbackAction<OpenPaletteIntent>(onInvoke: (_) => showCommandPalette(context)),
          GoIntent: CallbackAction<GoIntent>(onInvoke: (i) => app.go(i.section)),
          FullScreenIntent: CallbackAction<FullScreenIntent>(onInvoke: (_) => app.desktop.toggleFullScreen()),
          HelpIntent: CallbackAction<HelpIntent>(onInvoke: (_) => showShortcutHelp(context)),
          ReplayIntent: CallbackAction<ReplayIntent>(onInvoke: (_) => app.speech.replay()),
        },
        child: FocusScope(
          autofocus: true,
          child: Scaffold(
            backgroundColor: p.paper,
            body: Stack(children: [
              // stage: full-bleed under a transparent title bar on the journey screen
              Positioned.fill(
                top: immersive ? 0 : 48,
                child: Column(children: [
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(left: inActivity || immersive ? 0 : 92),
                      child: AnimatedSwitcher(
                        duration: Tokens.base,
                        switchInCurve: Tokens.ease,
                        switchOutCurve: Curves.easeIn,
                        transitionBuilder: (child, a) => FadeTransition(
                          opacity: a,
                          child: SlideTransition(position: Tween(begin: const Offset(0, 0.012), end: Offset.zero).animate(a), child: child),
                        ),
                        child: stage,
                      ),
                    ),
                  ),
                  const PlayerBar(),
                ]),
              ),
              Positioned(left: 0, right: 0, top: 0, child: TitleBar(transparent: immersive)),
              // floating navigation rail, hidden during a lesson or a review (immersion)
              AnimatedPositioned(
                duration: Tokens.base,
                curve: Tokens.ease,
                left: inActivity ? -90 : 16,
                top: 0,
                bottom: 0,
                child: const Center(child: NavRail()),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Custom, quiet title bar: drag area, breadcrumb, search, full screen and window buttons.
class TitleBar extends StatelessWidget {
  const TitleBar({super.key, this.transparent = false});
  final bool transparent;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final crumb = app.activeLesson != null
        ? '${app.activeLesson!.levelId} · ${app.activeLesson!.unitTitle} · ${app.activeLesson!.title}'
        : app.reviewing
            ? 'Session de révision'
            : app.section == Section.settings
                ? 'Paramètres'
                : navItems.firstWhere((n) => n.section == app.section).label;
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: transparent ? Colors.transparent : p.paper,
        border: Border(bottom: BorderSide(color: transparent ? Colors.transparent : p.line)),
      ),
      child: Row(children: [
        const SizedBox(width: 22),
        const VoyaMark(size: 22),
        const SizedBox(width: 10),
        Text('Voya', style: context.text.titleMedium!.copyWith(fontFamily: Tokens.display, fontSize: 17)),
        const SizedBox(width: 14),
        _LanguageChip(enabled: app.activeLesson == null && !app.reviewing),
        const SizedBox(width: 14),
        Expanded(
          child: GestureDetector(
            behavior: HitTestBehavior.translucent,
            onPanStart: (_) => app.desktop.startDrag(),
            onDoubleTap: () => app.desktop.toggleMaximize(),
            child: SizedBox.expand(
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(crumb, overflow: TextOverflow.ellipsis, style: context.text.bodySmall!.copyWith(fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ),
        _SearchField(onTap: () => showCommandPalette(context)),
        const SizedBox(width: 8),
        IconBtn(icon: Icons.fullscreen_rounded, tooltip: 'Plein écran (F11)', onTap: () => app.desktop.toggleFullScreen(), size: 32),
        IconBtn(icon: Icons.keyboard_rounded, tooltip: 'Raccourcis clavier (F1)', onTap: () => showShortcutHelp(context), size: 32),
        if (app.desktop.enabled) ...[
          const SizedBox(width: 8),
          _CaptionButton(icon: Icons.remove_rounded, tooltip: 'Réduire', onTap: app.desktop.minimize),
          _CaptionButton(icon: Icons.crop_square_rounded, tooltip: 'Agrandir', onTap: app.desktop.toggleMaximize),
          _CaptionButton(icon: Icons.close_rounded, tooltip: 'Fermer', onTap: app.desktop.close, danger: true),
        ] else
          const SizedBox(width: 12),
      ]),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 280,
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(color: p.surface, borderRadius: BorderRadius.circular(Tokens.rSm), border: Border.all(color: p.line)),
          child: Row(children: [
            Icon(Icons.search_rounded, size: 17, color: p.inkFaint),
            const SizedBox(width: 8),
            Expanded(child: Text('Rechercher une leçon, un mot…', style: context.text.bodySmall!.copyWith(color: p.inkFaint))),
            const KeyCap('Ctrl K'),
          ]),
        ),
      ),
    );
  }
}

class _CaptionButton extends StatefulWidget {
  const _CaptionButton({required this.icon, required this.tooltip, required this.onTap, this.danger = false});
  final IconData icon;
  final String tooltip;
  final Future<void> Function() onTap;
  final bool danger;
  @override
  State<_CaptionButton> createState() => _CaptionButtonState();
}

class _CaptionButtonState extends State<_CaptionButton> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Tooltip(
      message: widget.tooltip,
      child: MouseRegion(
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: Tokens.fast,
            width: 46,
            height: 48,
            color: hover ? (widget.danger ? const Color(0xFFC42B1C) : p.ink.withValues(alpha: 0.07)) : Colors.transparent,
            child: Icon(widget.icon, size: 17, color: hover && widget.danger ? Colors.white : p.inkSoft),
          ),
        ),
      ),
    );
  }
}

/// Floating navigation rail: a slim pill of icons that hovers over the content.
class NavRail extends StatelessWidget {
  const NavRail({super.key});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final items = [...navItems, const NavItem(Section.settings, 'Paramètres', Icons.tune_rounded, ',')];
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ui.ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          width: 60,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: p.surface.withValues(alpha: 0.72),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: p.ink.withValues(alpha: 0.08)),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            for (final (i, n) in items.indexed) ...[
              if (i == items.length - 1) Container(width: 24, height: 1, margin: const EdgeInsets.symmetric(vertical: 8), color: p.line),
              _RailButton(item: n, selected: app.section == n.section, badge: n.section == Section.review && app.dueCount > 0 ? app.dueCount : null),
            ],
          ]),
        ),
      ),
    );
  }
}

class _RailButton extends StatefulWidget {
  const _RailButton({required this.item, required this.selected, this.badge});
  final NavItem item;
  final bool selected;
  final int? badge;
  @override
  State<_RailButton> createState() => _RailButtonState();
}

class _RailButtonState extends State<_RailButton> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.read(context);
    final p = context.pal;
    final sel = widget.selected;
    return Tooltip(
      message: '${widget.item.label}   Ctrl ${widget.item.key}',
      preferBelow: false,
      verticalOffset: 0,
      margin: const EdgeInsets.only(left: 70),
      child: Semantics(
        button: true,
        selected: sel,
        label: widget.item.label,
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          onEnter: (_) => setState(() => hover = true),
          onExit: (_) => setState(() => hover = false),
          child: GestureDetector(
            onTap: () => app.go(widget.item.section),
            child: AnimatedContainer(
              duration: Tokens.fast,
              width: 44,
              height: 44,
              margin: const EdgeInsets.symmetric(vertical: 3),
              decoration: BoxDecoration(
                color: sel ? p.accent : (hover ? p.ink.withValues(alpha: 0.07) : Colors.transparent),
                shape: BoxShape.circle,
              ),
              child: Stack(alignment: Alignment.center, clipBehavior: Clip.none, children: [
                Icon(widget.item.icon, size: 21, color: sel ? p.onAccent : p.inkSoft),
                if (widget.badge != null)
                  Positioned(
                    right: 2,
                    top: 2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      constraints: const BoxConstraints(minWidth: 16),
                      decoration: BoxDecoration(color: sel ? p.onAccent : p.accent, borderRadius: BorderRadius.circular(99)),
                      child: Text('${widget.badge}', textAlign: TextAlign.center, style: TextStyle(fontFamily: Tokens.ui, fontSize: 9.5, fontWeight: FontWeight.w800, color: sel ? p.accent : p.onAccent)),
                    ),
                  ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class _LanguageChip extends StatelessWidget {
  const _LanguageChip({required this.enabled});
  final bool enabled;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    return PopupMenuButton<String>(
      enabled: enabled,
      tooltip: 'Changer de langue',
      offset: const Offset(0, 40),
      onSelected: app.switchLanguage,
      itemBuilder: (_) => [
        for (final l in StudyLanguage.all)
          PopupMenuItem(
            value: l.code,
            child: Row(children: [
              SizedBox(width: 26, child: Text(l.glyph, style: const TextStyle(fontFamily: Tokens.display, fontFamilyFallback: Tokens.fallback, fontSize: 18))),
              const SizedBox(width: 8),
              Text('${l.name} · ${l.nativeName}'),
              if (l.code == app.lang) ...[const SizedBox(width: 10), Icon(Icons.check_rounded, size: 18, color: p.accent)],
            ]),
          ),
      ],
      child: Container(
        padding: const EdgeInsets.fromLTRB(6, 4, 10, 4),
        decoration: BoxDecoration(color: p.surface.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(99), border: Border.all(color: p.ink.withValues(alpha: 0.08))),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 22,
            height: 22,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: p.accent, shape: BoxShape.circle),
            child: Text(app.language.glyph, style: TextStyle(fontFamily: Tokens.display, fontFamilyFallback: Tokens.fallback, fontSize: 13, fontWeight: FontWeight.w700, color: p.onAccent, height: 1.1)),
          ),
          const SizedBox(width: 8),
          Text('${app.language.name} · ${app.levelId}', style: context.text.labelMedium),
          const SizedBox(width: 4),
          Icon(Icons.expand_more_rounded, size: 16, color: p.inkFaint),
        ]),
      ),
    );
  }
}

/// Integrated audio player: shows what is being spoken, replays, slows down, stops.
class PlayerBar extends StatelessWidget {
  const PlayerBar({super.key});
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    return ValueListenableBuilder<NowPlaying>(
      valueListenable: app.speech.nowPlaying,
      builder: (context, now, _) {
        final visible = now.text.isNotEmpty;
        return AnimatedContainer(
          duration: Tokens.base,
          curve: Tokens.ease,
          height: visible ? 56 : 0,
          decoration: BoxDecoration(color: p.surface, border: Border(top: BorderSide(color: p.line))),
          child: ClipRect(
            child: OverflowBox(
              maxHeight: 56,
              alignment: Alignment.topCenter,
              child: SizedBox(
                height: 56,
                child: Row(children: [
                  const SizedBox(width: 20),
                  _Equalizer(active: now.playing),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(now.text, maxLines: 1, overflow: TextOverflow.ellipsis, style: context.text.titleSmall!.copyWith(fontSize: 14)),
                      Text(
                        '${app.speech.voiceName != null ? VoiceInfo(app.speech.voiceName!, '').shortName : 'Voix système'} · ${now.slow ? 'lent' : 'vitesse naturelle'}',
                        style: context.text.bodySmall,
                      ),
                    ]),
                  ),
                  IconBtn(icon: Icons.replay_rounded, tooltip: 'Réécouter (Ctrl R)', onTap: () => app.speech.speak(now.text, slow: now.slow)),
                  IconBtn(icon: Icons.slow_motion_video_rounded, tooltip: 'Réécouter lentement', active: now.slow, onTap: () => app.speech.speak(now.text, slow: true)),
                  IconBtn(icon: now.playing ? Icons.stop_rounded : Icons.play_arrow_rounded, tooltip: now.playing ? 'Arrêter' : 'Lire', onTap: () => now.playing ? app.speech.stop() : app.speech.speak(now.text, slow: now.slow)),
                  IconBtn(icon: Icons.close_rounded, tooltip: 'Fermer le lecteur', onTap: () {
                    app.speech.stop();
                    app.speech.nowPlaying.value = const NowPlaying();
                  }),
                  const SizedBox(width: 14),
                ]),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Equalizer extends StatefulWidget {
  const _Equalizer({required this.active});
  final bool active;
  @override
  State<_Equalizer> createState() => _EqualizerState();
}

class _EqualizerState extends State<_Equalizer> with SingleTickerProviderStateMixin {
  late final c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
  @override
  void didUpdateWidget(covariant _Equalizer old) {
    super.didUpdateWidget(old);
    widget.active ? c.repeat() : c.stop();
  }

  @override
  void initState() {
    super.initState();
    if (widget.active) c.repeat();
  }

  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return AnimatedBuilder(
      animation: c,
      builder: (_, _) => Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          for (var i = 0; i < 4; i++)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              width: 4,
              height: widget.active ? 6 + 16 * (0.5 + 0.5 * _wave(c.value * 6.283 + i * 1.3)) : 6,
              decoration: BoxDecoration(color: p.accent, borderRadius: BorderRadius.circular(2)),
            ),
        ],
      ),
    );
  }

  double _wave(double x) => (x % 6.283) < 3.1415 ? ((x % 3.1415) / 3.1415) : 1 - ((x % 3.1415) / 3.1415);
}

// ---------------- command palette ----------------

class _PaletteEntry {
  _PaletteEntry(this.title, this.subtitle, this.icon, this.run);
  final String title, subtitle;
  final IconData icon;
  final VoidCallback run;
}

Future<void> showCommandPalette(BuildContext context) {
  final app = AppScope.read(context);
  if (app.activeLesson != null || app.reviewing) return Future.value();
  return showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.25),
    builder: (ctx) => AppScope(state: app, child: const _CommandPalette()),
  );
}

class _CommandPalette extends StatefulWidget {
  const _CommandPalette();
  @override
  State<_CommandPalette> createState() => _CommandPaletteState();
}

class _CommandPaletteState extends State<_CommandPalette> {
  final ctrl = TextEditingController();
  int sel = 0;

  List<_PaletteEntry> entries(AppState app) {
    final q = ctrl.text.trim().toLowerCase();
    final out = <_PaletteEntry>[
      for (final n in navItems) _PaletteEntry(n.label, 'Aller à · Ctrl ${n.key}', n.icon, () => app.go(n.section)),
      _PaletteEntry('Paramètres', 'Voix, apparence, données · Ctrl ,', Icons.tune_rounded, () => app.go(Section.settings)),
      for (final l in StudyLanguage.all.where((l) => l.code != app.lang)) _PaletteEntry('Passer au ${l.name.toLowerCase()}', l.nativeName, Icons.translate_rounded, () => app.switchLanguage(l.code)),
    ];
    if (q.isNotEmpty) {
      for (final l in app.course.writtenLessons) {
        if (l.title.toLowerCase().contains(q) || l.unitTitle.toLowerCase().contains(q) || l.point.toLowerCase().contains(q)) {
          out.add(_PaletteEntry(l.title, 'Leçon · ${l.levelId} · ${l.unitTitle}', Icons.play_lesson_rounded, () => app.startLesson(l)));
        }
      }
      for (final it in app.course.items.values) {
        if (it.term.toLowerCase().contains(q) || it.meaning.toLowerCase().contains(q) || it.romaji.toLowerCase().contains(q)) {
          out.add(_PaletteEntry(it.term, '${it.meaning}${it.hint.isNotEmpty ? ' · ${it.hint}' : ''}', Icons.volume_up_rounded, () => app.speech.speak(it.term)));
        }
        if (out.length > 60) break;
      }
      return out.where((e) => e.title.toLowerCase().contains(q) || e.subtitle.toLowerCase().contains(q) || e.icon == Icons.volume_up_rounded || e.icon == Icons.play_lesson_rounded).toList();
    }
    return out;
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final list = entries(app);
    if (sel >= list.length) sel = list.isEmpty ? 0 : list.length - 1;
    void run(_PaletteEntry e) {
      Navigator.of(context).pop();
      e.run();
    }

    return Align(
      alignment: const Alignment(0, -0.55),
      child: Material(
        color: Colors.transparent,
        child: Container(
          width: 620,
          constraints: const BoxConstraints(maxHeight: 460),
          decoration: BoxDecoration(
            color: p.raised,
            borderRadius: BorderRadius.circular(Tokens.rLg),
            border: Border.all(color: p.line),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 40, offset: const Offset(0, 18))],
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: CallbackShortcuts(
                bindings: {
                  const SingleActivator(LogicalKeyboardKey.arrowDown): () => setState(() => sel = (sel + 1).clamp(0, list.length - 1)),
                  const SingleActivator(LogicalKeyboardKey.arrowUp): () => setState(() => sel = (sel - 1).clamp(0, list.length - 1)),
                },
                child: TextField(
                  controller: ctrl,
                  autofocus: true,
                  onChanged: (_) => setState(() => sel = 0),
                  onSubmitted: (_) => list.isNotEmpty ? run(list[sel]) : null,
                  decoration: const InputDecoration(prefixIcon: Icon(Icons.search_rounded), hintText: 'Leçon, mot, section… (↑ ↓ puis Entrée)'),
                ),
              ),
            ),
            Flexible(
              child: list.isEmpty
                  ? Padding(padding: const EdgeInsets.all(24), child: Text('Aucun résultat pour « ${ctrl.text} »', style: context.text.bodyMedium))
                  : ListView.builder(
                      shrinkWrap: true,
                      padding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
                      itemCount: list.length,
                      itemBuilder: (_, i) {
                        final e = list[i];
                        return Material(
                          color: i == sel ? p.accentSoft : Colors.transparent,
                          borderRadius: BorderRadius.circular(Tokens.rSm),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(Tokens.rSm),
                            onTap: () => run(e),
                            onHover: (h) => h ? setState(() => sel = i) : null,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              child: Row(children: [
                                Icon(e.icon, size: 18, color: i == sel ? p.accent : p.inkSoft),
                                const SizedBox(width: 12),
                                Expanded(child: Text(e.title, style: context.text.titleSmall, overflow: TextOverflow.ellipsis)),
                                const SizedBox(width: 12),
                                Flexible(child: Text(e.subtitle, style: context.text.bodySmall, overflow: TextOverflow.ellipsis)),
                              ]),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ]),
        ),
      ),
    );
  }
}

Future<void> showShortcutHelp(BuildContext context) {
  const rows = [
    ('Ctrl 1 … 5', 'Aller à une section'),
    ('Ctrl ,', 'Paramètres'),
    ('Ctrl K', 'Rechercher (leçons, mots, sections)'),
    ('F11', 'Plein écran'),
    ('Ctrl R', 'Réécouter le dernier audio'),
    ('1 · 2 · 3 · 4', 'Choisir une réponse pendant un exercice'),
    ('Entrée', 'Valider / continuer'),
    ('Espace', 'Écouter l’audio de l’exercice (hors saisie)'),
    ('Échap', 'Quitter une leçon ou une révision'),
    ('Clic droit', 'Menu d’un mot : écouter, ajouter au vocabulaire, copier'),
  ];
  return showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text('Raccourcis clavier', style: ctx.text.headlineSmall),
      content: SizedBox(
        width: 460,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          for (final (k, d) in rows)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(children: [SizedBox(width: 130, child: Align(alignment: Alignment.centerLeft, child: KeyCap(k))), Expanded(child: Text(d, style: ctx.text.bodyMedium))]),
            ),
        ]),
      ),
      actions: [Btn(label: 'Fermer', kind: BtnKind.secondary, onPressed: () => Navigator.pop(ctx))],
    ),
  );
}
