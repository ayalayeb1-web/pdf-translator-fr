// The trail: lessons are stops on a winding path drawn over the landscape.
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../content/models.dart';
import 'theme.dart';

class JourneyTrail extends StatefulWidget {
  const JourneyTrail({
    super.key,
    required this.lessons,
    required this.completed,
    required this.nextId,
    required this.onTap,
    this.spacing = 150,
    this.height = 260,
    this.light = false,
    this.signposts = true,
    this.leadIn = 90,
  });
  final List<Lesson> lessons;
  final Map<String, double> completed;
  final String? nextId;
  final void Function(Lesson) onTap;
  final double spacing, height, leadIn;
  final bool light; // light ink (night scenes)
  final bool signposts;

  double get width => leadIn * 2 + math.max(0, lessons.length - 1) * spacing;

  @override
  State<JourneyTrail> createState() => _JourneyTrailState();
}

class _JourneyTrailState extends State<JourneyTrail> with SingleTickerProviderStateMixin {
  late final AnimationController pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat();
  int? hover;

  @override
  void dispose() {
    pulse.dispose();
    super.dispose();
  }

  Offset point(int i) {
    final h = widget.height;
    return Offset(widget.leadIn + i * widget.spacing, h * 0.52 + math.sin(i * 0.95 + 0.6) * h * 0.2);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final ink = widget.light ? const Color(0xFFF6F2EA) : const Color(0xFF1A1E29);
    final pts = [for (var i = 0; i < widget.lessons.length; i++) point(i)];
    final nextIdx = widget.lessons.indexWhere((l) => l.id == widget.nextId);
    final doneUpTo = nextIdx < 0 ? (widget.lessons.every((l) => widget.completed.containsKey(l.id)) ? pts.length - 1 : -1) : nextIdx;
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: Stack(clipBehavior: Clip.none, children: [
        Positioned.fill(child: CustomPaint(painter: _TrailPainter(pts, doneUpTo, ink, p.accent, widget.leadIn))),
        for (var i = 0; i < widget.lessons.length; i++) ..._stop(context, i, pts[i], ink, i == nextIdx),
      ]),
    );
  }

  List<Widget> _stop(BuildContext context, int i, Offset c, Color ink, bool isNext) {
    final p = context.pal;
    final l = widget.lessons[i];
    final done = widget.completed.containsKey(l.id);
    final firstOfUnit = i == 0 || widget.lessons[i - 1].unitTitle != l.unitTitle;
    final r = isNext ? 22.0 : 13.0;
    final hov = hover == i;
    final out = <Widget>[];
    if (widget.signposts && firstOfUnit) {
      out.add(Positioned(
        left: c.dx - 8,
        top: c.dy - 96,
        child: IgnorePointer(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.unitTitle, style: TextStyle(fontFamily: Tokens.display, fontFamilyFallback: Tokens.fallback, fontSize: 19, fontWeight: FontWeight.w600, color: ink, height: 1)),
            const SizedBox(height: 4),
            Container(width: 2, height: 44, color: ink.withValues(alpha: 0.35)),
          ]),
        ),
      ));
    }
    out.add(Positioned(
      left: c.dx - 80,
      top: c.dy - r,
      width: 160,
      child: MouseRegion(
        cursor: l.written ? SystemMouseCursors.click : SystemMouseCursors.basic,
        onEnter: (_) => setState(() => hover = i),
        onExit: (_) => setState(() => hover = null),
        child: GestureDetector(
          onTap: () => widget.onTap(l),
          child: Tooltip(
            message: '${l.typeLabel} · ${l.objective}',
            waitDuration: const Duration(milliseconds: 300),
            child: Column(children: [
              AnimatedBuilder(
                animation: pulse,
                builder: (_, child) => Stack(alignment: Alignment.center, clipBehavior: Clip.none, children: [
                  if (isNext)
                    Container(
                      width: r * 2 + 26 * pulse.value,
                      height: r * 2 + 26 * pulse.value,
                      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: p.accent.withValues(alpha: 1 - pulse.value), width: 2)),
                    ),
                  child!,
                ]),
                child: AnimatedScale(
                  scale: hov ? 1.15 : 1,
                  duration: Tokens.fast,
                  child: Container(
                    width: r * 2,
                    height: r * 2,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isNext ? p.accent : done ? const Color(0xFFFFF7EC) : (l.written ? Colors.transparent : ink.withValues(alpha: 0.08)),
                      border: Border.all(color: isNext ? const Color(0xFFFFF7EC) : ink.withValues(alpha: l.written ? 0.75 : 0.3), width: isNext ? 3 : 2),
                      boxShadow: [if (isNext || done) BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: done
                        ? Icon(Icons.check_rounded, size: 15, color: p.accent)
                        : isNext
                            ? const Icon(Icons.arrow_forward_rounded, size: 20, color: Colors.white)
                            : null,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Text(
                l.title,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: Tokens.ui,
                  fontFamilyFallback: Tokens.fallback,
                  fontSize: isNext ? 14 : 12.5,
                  fontWeight: isNext || hov ? FontWeight.w800 : FontWeight.w600,
                  color: ink.withValues(alpha: l.written ? (isNext || hov ? 1 : 0.78) : 0.45),
                  height: 1.25,
                ),
              ),
            ]),
          ),
        ),
      ),
    ));
    return out;
  }
}

class _TrailPainter extends CustomPainter {
  _TrailPainter(this.pts, this.doneUpTo, this.ink, this.accent, this.leadIn);
  final List<Offset> pts;
  final int doneUpTo;
  final Color ink, accent;
  final double leadIn;

  Path _through(List<Offset> ps) {
    final path = Path();
    if (ps.isEmpty) return path;
    path.moveTo(ps.first.dx - leadIn, ps.first.dy + 20);
    path.quadraticBezierTo(ps.first.dx - leadIn / 2, ps.first.dy + 10, ps.first.dx, ps.first.dy);
    for (var i = 1; i < ps.length; i++) {
      final a = ps[i - 1], b = ps[i];
      final mx = (a.dx + b.dx) / 2;
      path.cubicTo(mx, a.dy, mx, b.dy, b.dx, b.dy);
    }
    final last = ps.last;
    path.quadraticBezierTo(last.dx + leadIn / 2, last.dy - 10, last.dx + leadIn, last.dy - 20);
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (pts.isEmpty) return;
    final full = _through(pts);
    // soft road shadow, then a dashed trail
    canvas.drawPath(full, Paint()..style = PaintingStyle.stroke..strokeWidth = 16..strokeCap = StrokeCap.round..color = ink.withValues(alpha: 0.06));
    final dash = Paint()..style = PaintingStyle.stroke..strokeWidth = 2.4..strokeCap = StrokeCap.round..color = ink.withValues(alpha: 0.45);
    for (final m in full.computeMetrics()) {
      for (double d = 0; d < m.length; d += 13) {
        canvas.drawPath(m.extractPath(d, math.min(d + 6, m.length)), dash);
      }
    }
    // the travelled part, solid accent
    if (doneUpTo >= 0) {
      final travelled = _through(pts.sublist(0, doneUpTo + 1));
      final m = travelled.computeMetrics().first;
      final cut = m.extractPath(0, m.length - leadIn * 0.95);
      canvas.drawPath(cut, Paint()..style = PaintingStyle.stroke..strokeWidth = 4..strokeCap = StrokeCap.round..color = accent);
    }
  }

  @override
  bool shouldRepaint(_TrailPainter o) => o.doneUpTo != doneUpTo || o.ink != ink || o.pts.length != pts.length;
}
