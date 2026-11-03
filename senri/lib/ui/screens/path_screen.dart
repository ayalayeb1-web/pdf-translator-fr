// The course as a journey: one landscape per CEFR level, and the whole level as a trail
// you scroll through (mouse wheel scrolls sideways). Each unit is a signposted region.
import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import '../../content/models.dart';
import '../../core/app_state.dart';
import '../journey.dart';
import '../scene.dart';
import '../theme.dart';
import '../widgets.dart';

class PathScreen extends StatefulWidget {
  const PathScreen({super.key});
  @override
  State<PathScreen> createState() => _PathScreenState();
}

class _PathScreenState extends State<PathScreen> {
  String? shown;
  final scroll = ScrollController();
  double offset = 0;

  @override
  void initState() {
    super.initState();
    scroll.addListener(() => setState(() => offset = scroll.offset));
    WidgetsBinding.instance.addPostFrameCallback((_) => _centerOnNext());
  }

  @override
  void dispose() {
    scroll.dispose();
    super.dispose();
  }

  void _centerOnNext() {
    if (!mounted || !scroll.hasClients) return;
    final app = AppScope.read(context);
    final lessons = app.course.level(shown ?? app.levelId).lessons;
    final i = lessons.indexWhere((l) => l.id == app.nextLesson?.id);
    if (i <= 0) return;
    final target = (90 + i * 170 - scroll.position.viewportDimension / 2).clamp(0.0, scroll.position.maxScrollExtent);
    scroll.animateTo(target, duration: Tokens.slow, curve: Tokens.ease);
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final level = app.course.level(shown ?? app.levelId);
    final mood = SceneMood.of(app.lang, level.id, Theme.of(context).brightness);
    final ink = mood.night ? const Color(0xFFF6F2EA) : const Color(0xFF1A1E29);
    final lessons = level.lessons;
    final done = lessons.where((l) => app.completed.containsKey(l.id)).length;

    return Stack(children: [
      Positioned.fill(
        child: AnimatedSwitcher(
          duration: Tokens.slow,
          child: Landscape(key: ValueKey('${app.lang}-${level.id}'), mood: mood, lang: app.lang, seed: level.id.codeUnitAt(0) + level.id.codeUnitAt(1), parallax: offset, horizon: 0.36),
        ),
      ),
      Positioned(
        left: 104,
        top: 84,
        right: 40,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Wrap(spacing: 4, children: [
            for (final l in app.course.levels)
              _LevelTab(
                level: l,
                selected: l.id == level.id,
                current: l.id == app.levelId,
                ink: ink,
                onTap: () {
                  setState(() => shown = l.id);
                  if (scroll.hasClients) scroll.jumpTo(0);
                  WidgetsBinding.instance.addPostFrameCallback((_) => _centerOnNext());
                },
              ),
          ]),
          const SizedBox(height: 22),
          Text('${level.frenchName} · ${level.exam}', style: context.text.labelSmall!.copyWith(color: ink.withValues(alpha: 0.7), letterSpacing: 2)),
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 780),
            child: Text(level.desc, style: context.text.displayMedium!.copyWith(color: ink)),
          ),
          const SizedBox(height: 10),
          Text(
            level.written
                ? '${lessons.length} étapes · $done franchie${done > 1 ? 's' : ''}. Molette ou glisser pour voyager ; survolez une étape pour son objectif.'
                : 'Programme du niveau : ces étapes ne sont pas encore rédigées. Elles montrent la progression, sans contenu factice.',
            style: context.text.bodyMedium!.copyWith(color: ink.withValues(alpha: 0.75)),
          ),
          if (level.id != app.levelId) ...[
            const SizedBox(height: 14),
            Btn(label: 'En faire mon niveau', kind: BtnKind.secondary, icon: Icons.my_location_rounded, onPressed: () => app.set('level_${app.lang}', level.id)),
          ],
        ]),
      ),
      Positioned(
        left: 0,
        right: 0,
        bottom: 40,
        child: LayoutBuilder(builder: (context, c) {
          final h = math.min(330.0, MediaQuery.sizeOf(context).height * 0.42);
          return Listener(
            // vertical wheel → horizontal travel
            onPointerSignal: (e) {
              if (e is PointerScrollEvent && scroll.hasClients) {
                final d = e.scrollDelta.dy.abs() > e.scrollDelta.dx.abs() ? e.scrollDelta.dy : e.scrollDelta.dx;
                scroll.jumpTo((scroll.offset + d).clamp(0.0, scroll.position.maxScrollExtent));
              }
            },
            child: ScrollConfiguration(
              behavior: const _DragAll(),
              child: SingleChildScrollView(
                controller: scroll,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.only(left: 110, right: 80, top: 100),
                child: JourneyTrail(
                  lessons: lessons,
                  completed: app.completed,
                  nextId: app.nextLesson?.id,
                  height: h,
                  spacing: 170,
                  light: true,
                  onTap: (l) {
                    if (l.written) {
                      app.startLesson(l);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('« ${l.title} » fait partie du programme ${l.levelId} : contenu pas encore rédigé.')));
                    }
                  },
                ),
              ),
            ),
          );
        }),
      ),
    ]);
  }
}

class _DragAll extends MaterialScrollBehavior {
  const _DragAll();
  @override
  Set<PointerDeviceKind> get dragDevices => PointerDeviceKind.values.toSet();
}

class _LevelTab extends StatefulWidget {
  const _LevelTab({required this.level, required this.selected, required this.current, required this.ink, required this.onTap});
  final Level level;
  final bool selected, current;
  final Color ink;
  final VoidCallback onTap;
  @override
  State<_LevelTab> createState() => _LevelTabState();
}

class _LevelTabState extends State<_LevelTab> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final l = widget.level;
    return Tooltip(
      message: '${l.frenchName} · ${l.exam}${l.written ? '' : ' · programme'}',
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: Tokens.fast,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: widget.selected ? const Color(0xFFFFF8EE) : (hover ? const Color(0xFFFFF8EE).withValues(alpha: 0.5) : Colors.transparent),
              borderRadius: BorderRadius.circular(99),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(
                l.id,
                style: TextStyle(
                  fontFamily: Tokens.display,
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: widget.selected ? p.accent : widget.ink.withValues(alpha: l.written ? 0.85 : 0.45),
                ),
              ),
              if (widget.current) ...[const SizedBox(width: 6), Icon(Icons.my_location_rounded, size: 13, color: widget.selected ? p.accent : widget.ink)],
            ]),
          ),
        ),
      ),
    );
  }
}
