// "Aujourd'hui": the landscape of your level, the trail of lessons, and a ticket for the next stop.
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../content/models.dart';
import '../../core/app_state.dart';
import '../journey.dart';
import '../scene.dart';
import '../theme.dart';
import '../widgets.dart';

class Dashboard extends StatelessWidget {
  const Dashboard({super.key});

  String _greeting() {
    final h = DateTime.now().hour;
    return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final mood = SceneMood.of(app.lang, app.levelId, Theme.of(context).brightness);
    final light = mood.night;
    final ink = light ? const Color(0xFFF6F2EA) : const Color(0xFF1A1E29);
    final next = app.nextLesson;
    final lessons = app.level.lessons.where((l) => l.written).toList();
    final ni = next == null ? lessons.length - 1 : math.max(0, lessons.indexWhere((l) => l.id == next.id));
    final from = math.max(0, ni - 3);
    final window = lessons.sublist(from, math.min(lessons.length, from + 9));
    final doneCount = lessons.where((l) => app.completed.containsKey(l.id)).length;

    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.enter): () {
          if (next != null) app.startLesson(next);
        },
      },
      child: Focus(
        autofocus: true,
        child: Stack(children: [
          Positioned.fill(child: Landscape(mood: mood, lang: app.lang, seed: app.lang == 'ja' ? 11 : 5, horizon: 0.42)),
          // legibility veil behind the text column
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: const Alignment(0.2, 0.3),
                    colors: [mood.sky.first.withValues(alpha: 0.65), mood.sky.first.withValues(alpha: 0)],
                  ),
                ),
              ),
            ),
          ),
          LayoutBuilder(builder: (context, c) {
            final trailH = math.min(300.0, c.maxHeight * 0.38);
            return Stack(children: [
              Positioned(
                left: 96,
                top: 84,
                right: 40,
                child: Reveal(
                  index: 0,
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('${_greeting().toUpperCase()}  ·  ${app.language.nativeName}  ·  ${app.level.id} ${app.level.frenchName.toUpperCase()}',
                        style: context.text.labelSmall!.copyWith(color: ink.withValues(alpha: 0.7), letterSpacing: 2)),
                    const SizedBox(height: 12),
                    Text(next?.unitTitle ?? 'Fin du chemin écrit', style: context.text.displayLarge!.copyWith(color: ink, fontSize: c.maxWidth > 1100 ? 64 : 48)),
                    const SizedBox(height: 8),
                    Text('Étape ${math.min(doneCount + 1, lessons.length)} sur ${lessons.length} du niveau ${app.level.id}',
                        style: context.text.bodyLarge!.copyWith(color: ink.withValues(alpha: 0.72))),
                    const SizedBox(height: 26),
                    if (next != null) Reveal(index: 1, child: _Ticket(lesson: next, onGo: () => app.startLesson(next))),
                    if (next == null)
                      Btn(label: 'Réviser maintenant', icon: Icons.replay_rounded, large: true, onPressed: app.dueCount > 0 ? app.startReview : null),
                  ]),
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 74,
                height: trailH,
                child: Center(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 60),
                      child: JourneyTrail(
                        lessons: window,
                        completed: app.completed,
                        nextId: next?.id,
                        onTap: app.startLesson,
                        height: trailH,
                        spacing: math.max(130, math.min(170, (c.maxWidth - 240) / math.max(1, window.length - 1))),
                        light: true,
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(left: 96, right: 40, bottom: 18, child: Reveal(index: 2, child: _Notebook())),
            ]);
          }),
        ]),
      ),
    );
  }
}

/// The next lesson as a travel ticket: perforated stub on the right holds the action.
class _Ticket extends StatefulWidget {
  const _Ticket({required this.lesson, required this.onGo});
  final Lesson lesson;
  final VoidCallback onGo;
  @override
  State<_Ticket> createState() => _TicketState();
}

class _TicketState extends State<_Ticket> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    const paper = Color(0xFFFFF8EE);
    const ink = Color(0xFF1A1E29);
    final l = widget.lesson;
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => hover = true),
      onExit: (_) => setState(() => hover = false),
      child: GestureDetector(
        onTap: widget.onGo,
        child: AnimatedSlide(
          offset: Offset(0, hover ? -0.015 : 0),
          duration: Tokens.fast,
          child: AnimatedRotation(
            turns: hover ? 0 : -0.004,
            duration: Tokens.base,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: PhysicalShape(
                clipper: const _TicketClipper(stubWidth: 132),
                color: paper,
                elevation: hover ? 14 : 8,
                shadowColor: Colors.black.withValues(alpha: 0.4),
                child: IntrinsicHeight(
                  child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(26, 22, 22, 22),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                          Text('CONTINUER MON APPRENTISSAGE', style: context.text.labelSmall!.copyWith(color: p.accent, letterSpacing: 1.6)),
                          const SizedBox(height: 10),
                          Text(l.title, style: context.text.headlineMedium!.copyWith(color: ink, fontSize: 26)),
                          const SizedBox(height: 6),
                          Text('${l.typeLabel} · ${l.levelId}', style: context.text.bodySmall!.copyWith(color: const Color(0xFF6B6F78))),
                          const SizedBox(height: 12),
                          Text(l.objective, maxLines: 2, overflow: TextOverflow.ellipsis, style: context.text.bodyMedium!.copyWith(color: ink)),
                        ]),
                      ),
                    ),
                    CustomPaint(painter: _Perforation(), child: const SizedBox(width: 2)),
                    SizedBox(
                      width: 130,
                      child: AnimatedContainer(
                        duration: Tokens.fast,
                        color: hover ? p.accent : p.accent.withValues(alpha: 0.92),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 30),
                          const SizedBox(height: 8),
                          Text('Partir', style: context.text.titleMedium!.copyWith(color: Colors.white)),
                          const SizedBox(height: 8),
                          const KeyCap('Entrée', color: Colors.white),
                        ]),
                      ),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TicketClipper extends CustomClipper<Path> {
  const _TicketClipper({required this.stubWidth});
  final double stubWidth;
  @override
  Path getClip(Size s) {
    final x = s.width - stubWidth;
    const r = 10.0, notch = 11.0;
    final p = Path()
      ..moveTo(r, 0)
      ..lineTo(x - notch, 0)
      ..arcToPoint(Offset(x + notch, 0), radius: const Radius.circular(notch), clockwise: false)
      ..lineTo(s.width - r, 0)
      ..quadraticBezierTo(s.width, 0, s.width, r)
      ..lineTo(s.width, s.height - r)
      ..quadraticBezierTo(s.width, s.height, s.width - r, s.height)
      ..lineTo(x + notch, s.height)
      ..arcToPoint(Offset(x - notch, s.height), radius: const Radius.circular(notch), clockwise: false)
      ..lineTo(r, s.height)
      ..quadraticBezierTo(0, s.height, 0, s.height - r)
      ..lineTo(0, r)
      ..quadraticBezierTo(0, 0, r, 0)
      ..close();
    return p;
  }

  @override
  bool shouldReclip(_TicketClipper o) => o.stubWidth != stubWidth;
}

class _Perforation extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()..color = const Color(0xFFD9CDBA);
    for (double y = 16; y < s.height - 12; y += 9) {
      canvas.drawCircle(Offset(s.width / 2, y), 1.6, p);
    }
  }

  @override
  bool shouldRepaint(_Perforation o) => false;
}

/// A quiet strip of handwritten-style facts instead of a wall of stat cards.
class _Notebook extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final goal = app.dailyMinutes, today = app.todayMinutes;
    final week = app.activeDaysThisWeek;
    final weak = app.weakCards.length;
    final items = <(IconData, String, VoidCallback?)>[
      (Icons.timer_outlined, today >= goal ? 'Objectif du jour atteint · $today min' : '$today / $goal min aujourd’hui', null),
      (Icons.local_fire_department_outlined, app.streak > 0 ? 'Série de ${app.streak} jour${app.streak > 1 ? 's' : ''}' : 'Pas encore de série', null),
      (Icons.flag_outlined, 'Défi : $week / 5 jours cette semaine', null),
      (Icons.replay_rounded, app.dueCount > 0 ? '${app.dueCount} révision${app.dueCount > 1 ? 's' : ''} à faire' : 'Révisions à jour', app.dueCount > 0 ? app.startReview : null),
      if (weak > 0) (Icons.healing_outlined, '$weak mot${weak > 1 ? 's' : ''} fragile${weak > 1 ? 's' : ''}', () => app.go(Section.vocabulary)),
    ];
    return Wrap(spacing: 10, runSpacing: 8, children: [
      for (final (ic, t, onTap) in items)
        MouseRegion(
          cursor: onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
          child: GestureDetector(
            onTap: onTap,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8EE).withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: onTap != null ? context.pal.accent.withValues(alpha: 0.6) : Colors.transparent),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(ic, size: 16, color: onTap != null ? context.pal.accent : const Color(0xFF555B68)),
                const SizedBox(width: 8),
                Text(t, style: context.text.labelLarge!.copyWith(color: const Color(0xFF1A1E29), fontSize: 13)),
              ]),
            ),
          ),
        ),
    ]);
  }
}
