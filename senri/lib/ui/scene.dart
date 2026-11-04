// Painted landscapes: the backdrop of the journey. Fully procedural (no image assets),
// one mood per language and per level — dawn at A1, full day at B1, dusk and night at C1/C2.
import 'dart:math' as math;

import 'package:flutter/material.dart';

class SceneMood {
  const SceneMood({required this.sky, required this.sun, required this.layers, required this.mist, this.night = false});
  final List<Color> sky; // top → horizon
  final Color sun;
  final List<Color> layers; // far → near
  final Color mist;
  final bool night;

  static SceneMood of(String lang, String level, Brightness b) {
    final dark = b == Brightness.dark;
    final i = const ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(level).clamp(0, 5);
    if (lang == 'it') {
      // Tuscany: rolling green-gold hills, cypress rows, ochre villas.
      const moods = [
        SceneMood(sky: [Color(0xFFF3D9CF), Color(0xFFFAEEE2)], sun: Color(0xFFF2915E), layers: [Color(0xFFD9C9B0), Color(0xFFBFB58C), Color(0xFF8E9A63), Color(0xFF5E6E44)], mist: Color(0xFFFAEEE2)),
        SceneMood(sky: [Color(0xFFC4DDEA), Color(0xFFF3EFE2)], sun: Color(0xFFF6C35E), layers: [Color(0xFFC9D0A8), Color(0xFFA8B57A), Color(0xFF7B9152), Color(0xFF4C6A3A)], mist: Color(0xFFF3EFE2)),
        SceneMood(sky: [Color(0xFF94C4E2), Color(0xFFEDF3EC)], sun: Color(0xFFFFD77E), layers: [Color(0xFFD7CF92), Color(0xFFB8B565), Color(0xFF86964A), Color(0xFF52693A)], mist: Color(0xFFEDF3EC)),
        SceneMood(sky: [Color(0xFFE9A47E), Color(0xFFF7DCB8)], sun: Color(0xFFFFE2A2), layers: [Color(0xFFD9A774), Color(0xFFB98454), Color(0xFF7F6A3C), Color(0xFF4D4528)], mist: Color(0xFFF7DCB8)),
        SceneMood(sky: [Color(0xFF5A4A73), Color(0xFFE29C82)], sun: Color(0xFFFFC793), layers: [Color(0xFF9A7C82), Color(0xFF725A66), Color(0xFF4C3C4C), Color(0xFF2B2230)], mist: Color(0xFFE29C82)),
        SceneMood(sky: [Color(0xFF14213A), Color(0xFF34476A)], sun: Color(0xFFF2ECD6), layers: [Color(0xFF34496A), Color(0xFF263A52), Color(0xFF1B2A3C), Color(0xFF111B28)], mist: Color(0xFF34476A), night: true),
      ];
      return dark ? moods[5] : moods[i];
    }
    if (lang == 'es') {
      // Castile & Andalusia: ochre plains, terracotta hills, olive groves.
      const moods = [
        SceneMood(sky: [Color(0xFFF7D9C0), Color(0xFFFBEBD9)], sun: Color(0xFFF59A4A), layers: [Color(0xFFE9B994), Color(0xFFD99A6C), Color(0xFFB9744A), Color(0xFF8C5537)], mist: Color(0xFFFBEBD9)),
        SceneMood(sky: [Color(0xFFBFDDEB), Color(0xFFF4EBDC)], sun: Color(0xFFF7B955), layers: [Color(0xFFD9C3A0), Color(0xFFC9A26F), Color(0xFF9E8150), Color(0xFF6E6A3E)], mist: Color(0xFFF4EBDC)),
        SceneMood(sky: [Color(0xFF8CC3E3), Color(0xFFEAF1EF)], sun: Color(0xFFFFD27A), layers: [Color(0xFFC6CFA6), Color(0xFFA9AF74), Color(0xFF7F8A4F), Color(0xFF55633A)], mist: Color(0xFFEAF1EF)),
        SceneMood(sky: [Color(0xFFE79A6F), Color(0xFFF6D2A8)], sun: Color(0xFFFFE0A6), layers: [Color(0xFFD78F69), Color(0xFFB86A4B), Color(0xFF8E4A39), Color(0xFF5E2F2A)], mist: Color(0xFFF6D2A8)),
        SceneMood(sky: [Color(0xFF6B4E78), Color(0xFFE59A7E)], sun: Color(0xFFFFC18A), layers: [Color(0xFFA56A7A), Color(0xFF7D4B63), Color(0xFF55334C), Color(0xFF331F33)], mist: Color(0xFFE59A7E)),
        SceneMood(sky: [Color(0xFF1C2140), Color(0xFF51457A)], sun: Color(0xFFF4E7C6), layers: [Color(0xFF3E3A66), Color(0xFF2D2A4F), Color(0xFF201E3A), Color(0xFF141327)], mist: Color(0xFF51457A), night: true),
      ];
      return dark ? moods[5] : moods[i];
    }
    // Japan: layered blue mountains, red sun, cedar ridges.
    const moods = [
      SceneMood(sky: [Color(0xFFF6D6D0), Color(0xFFFBEFE6)], sun: Color(0xFFE2553C), layers: [Color(0xFFE3C3C6), Color(0xFFC9A3B2), Color(0xFF9B7A93), Color(0xFF5E4A63)], mist: Color(0xFFFBEFE6)),
      SceneMood(sky: [Color(0xFFCFE0EA), Color(0xFFF6F0E6)], sun: Color(0xFFD9452B), layers: [Color(0xFFBCCBD6), Color(0xFF93A9BB), Color(0xFF657F96), Color(0xFF3C5068)], mist: Color(0xFFF6F0E6)),
      SceneMood(sky: [Color(0xFF9CC6DF), Color(0xFFEEF3F0)], sun: Color(0xFFE8613F), layers: [Color(0xFFAFC7C4), Color(0xFF7FA39C), Color(0xFF557C71), Color(0xFF2F4F45)], mist: Color(0xFFEEF3F0)),
      SceneMood(sky: [Color(0xFFE9A88E), Color(0xFFF8DEC6)], sun: Color(0xFFC8331F), layers: [Color(0xFFCF9C93), Color(0xFFA9737A), Color(0xFF7C5064), Color(0xFF4A3045)], mist: Color(0xFFF8DEC6)),
      SceneMood(sky: [Color(0xFF4D4A78), Color(0xFFD9909A)], sun: Color(0xFFF7C5A8), layers: [Color(0xFF7D6E9A), Color(0xFF5A507C), Color(0xFF3B355A), Color(0xFF221F38)], mist: Color(0xFFD9909A)),
      SceneMood(sky: [Color(0xFF111A33), Color(0xFF2E3B66)], sun: Color(0xFFF3ECD8), layers: [Color(0xFF2E3C63), Color(0xFF232E4E), Color(0xFF19213A), Color(0xFF0F1426)], mist: Color(0xFF2E3B66), night: true),
    ];
    return dark ? moods[5] : moods[i];
  }

  Color get near => layers.last;
  bool get lightText => night || layers.last.computeLuminance() < 0.08 && sky.first.computeLuminance() < 0.25;
}

/// Animated landscape. [drift] slowly moves clouds and mist; [parallax] shifts layers with scrolling.
class Landscape extends StatefulWidget {
  const Landscape({super.key, required this.mood, this.seed = 7, this.parallax = 0, this.horizon = 0.58, this.lang = 'ja'});
  final SceneMood mood;
  final int seed;
  final double parallax;
  final double horizon; // 0..1, where the farthest ridge sits
  final String lang;
  @override
  State<Landscape> createState() => _LandscapeState();
}

class _LandscapeState extends State<Landscape> with SingleTickerProviderStateMixin {
  late final AnimationController c = AnimationController(vsync: this, duration: const Duration(seconds: 90))..repeat();
  @override
  void dispose() {
    c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: c,
        builder: (_, _) => CustomPaint(
          painter: _LandscapePainter(widget.mood, widget.seed, widget.parallax, c.value, widget.horizon, widget.lang),
          size: Size.infinite,
        ),
      ),
    );
  }
}

class _LandscapePainter extends CustomPainter {
  _LandscapePainter(this.m, this.seed, this.parallax, this.t, this.horizon, this.lang);
  final SceneMood m;
  final int seed;
  final double parallax, t, horizon;
  final String lang;

  double _ridge(double x, int layer, double w) {
    // a smooth pseudo-random ridge line: sum of a few sines with layer-specific phases
    final r = math.Random(seed * 31 + layer);
    var y = 0.0;
    for (var k = 1; k <= 4; k++) {
      final f = (0.6 + r.nextDouble() * 1.4) * k / w * math.pi * 2;
      final ph = r.nextDouble() * 6.283;
      final a = (lang == 'ja' ? 1.0 : lang == 'it' ? 0.75 : 0.55) / (k * k * 0.9);
      y += math.sin(x * f + ph) * a;
    }
    return y;
  }

  @override
  void paint(Canvas canvas, Size s) {
    final w = s.width, h = s.height;
    // sky
    canvas.drawRect(Offset.zero & s, Paint()..shader = LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: m.sky).createShader(Offset.zero & s));

    // stars at night
    if (m.night) {
      final r = math.Random(seed);
      final p = Paint();
      for (var i = 0; i < 90; i++) {
        final tw = 0.4 + 0.6 * (0.5 + 0.5 * math.sin(t * 6.283 * 3 + i));
        p.color = Colors.white.withValues(alpha: 0.5 * tw * r.nextDouble());
        canvas.drawCircle(Offset(r.nextDouble() * w, r.nextDouble() * h * horizon * 0.9), 0.6 + r.nextDouble() * 1.2, p);
      }
    }

    // sun / moon with halo
    final sunC = Offset(w * 0.72 - parallax * 0.05, h * (horizon - 0.2));
    final sunR = math.min(w, h) * 0.085;
    canvas.drawCircle(sunC, sunR * 3.2, Paint()..shader = RadialGradient(colors: [m.sun.withValues(alpha: 0.28), m.sun.withValues(alpha: 0)]).createShader(Rect.fromCircle(center: sunC, radius: sunR * 3.2)));
    canvas.drawCircle(sunC, sunR, Paint()..color = m.sun);

    // drifting cloud bands
    final cloud = Paint()..color = Colors.white.withValues(alpha: m.night ? 0.05 : 0.35);
    for (var i = 0; i < 3; i++) {
      final y = h * (0.12 + i * 0.09);
      final x = ((t * (0.4 + i * 0.15) + i * 0.37) % 1.3 - 0.2) * w;
      final rr = RRect.fromRectAndRadius(Rect.fromLTWH(x, y, w * (0.22 - i * 0.04), h * 0.018), const Radius.circular(99));
      canvas.drawRRect(rr, cloud);
      canvas.drawRRect(rr.shift(Offset(w * 0.05, h * 0.022)), cloud);
    }

    // ridges, far to near, each with mist at its foot
    final n = m.layers.length;
    for (var l = 0; l < n; l++) {
      final base = h * (horizon + l * (0.11 + (lang == 'es' ? 0.0 : 0.01)));
      final amp = h * (lang == 'ja' ? (0.09 - l * 0.012) : lang == 'it' ? (0.05 - l * 0.006) : (0.035 - l * 0.004));
      final shift = parallax * (0.08 + l * 0.12);
      final path = Path()..moveTo(0, h);
      for (double x = 0; x <= w + 8; x += 8) {
        path.lineTo(x, base - amp * (1 + _ridge(x + shift, l, w)));
      }
      path
        ..lineTo(w, h)
        ..close();
      canvas.drawPath(path, Paint()..color = m.layers[l]);
      // trees / houses on the two nearest layers
      if (l == n - 2) _details(canvas, s, l, base, amp, shift);
      // mist band
      final mistRect = Rect.fromLTWH(0, base - amp * 0.2, w, h * 0.12);
      canvas.drawRect(mistRect, Paint()..shader = LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [m.mist.withValues(alpha: 0.0), m.mist.withValues(alpha: l == n - 1 ? 0.0 : 0.35), m.mist.withValues(alpha: 0)]).createShader(mistRect));
    }
  }

  void _details(Canvas canvas, Size s, int l, double base, double amp, double shift) {
    final r = math.Random(seed * 7 + l);
    final paint = Paint()..color = Color.lerp(m.layers[l], Colors.black, 0.18)!;
    final count = lang == 'ja' ? 26 : lang == 'it' ? 22 : 14;
    for (var i = 0; i < count; i++) {
      final x = r.nextDouble() * s.width;
      final y = base - amp * (1 + _ridge(x + shift, l, s.width));
      if (lang == 'it') {
        if (r.nextDouble() < 0.72) {
          // cypress: a tall narrow flame shape
          final hgt = 18 + r.nextDouble() * 26.0 * (l - 1);
          final w = hgt * 0.17;
          final path = Path()
            ..moveTo(x, y - hgt)
            ..quadraticBezierTo(x + w * 1.4, y - hgt * 0.45, x + w * 0.6, y + 2)
            ..lineTo(x - w * 0.6, y + 2)
            ..quadraticBezierTo(x - w * 1.4, y - hgt * 0.45, x, y - hgt)
            ..close();
          canvas.drawPath(path, Paint()..color = Color.lerp(m.layers[l], const Color(0xFF16261A), 0.55)!);
        } else {
          // ochre villa with a low terracotta roof
          final hw = 14 + r.nextDouble() * 12;
          canvas.drawRect(Rect.fromLTWH(x, y - hw * 0.62, hw, hw * 0.62 + 3), Paint()..color = Color.lerp(const Color(0xFFE8C48E), m.mist, 0.25)!);
          canvas.drawPath(
            Path()
              ..moveTo(x - 2, y - hw * 0.62)
              ..lineTo(x + hw / 2, y - hw * 0.86)
              ..lineTo(x + hw + 2, y - hw * 0.62)
              ..close(),
            Paint()..color = const Color(0xFFB4553A),
          );
        }
      } else if (lang == 'ja') {
        // cedar: a tall slim triangle
        final hgt = 14 + r.nextDouble() * 22.0 * (l - 1);
        final path = Path()
          ..moveTo(x, y - hgt)
          ..lineTo(x - hgt * 0.22, y + 2)
          ..lineTo(x + hgt * 0.22, y + 2)
          ..close();
        canvas.drawPath(path, paint);
      } else if (r.nextBool()) {
        // olive tree: round crown
        final rr = 5 + r.nextDouble() * 6 * (l - 1);
        canvas.drawCircle(Offset(x, y - rr * 0.6), rr, paint);
      } else {
        // whitewashed house
        final hw = 10 + r.nextDouble() * 10;
        final house = Paint()..color = Color.lerp(m.mist, Colors.white, 0.4)!.withValues(alpha: 0.85);
        canvas.drawRect(Rect.fromLTWH(x, y - hw * 0.7, hw, hw * 0.7 + 3), house);
        canvas.drawPath(
          Path()
            ..moveTo(x - 1, y - hw * 0.7)
            ..lineTo(x + hw / 2, y - hw * 1.05)
            ..lineTo(x + hw + 1, y - hw * 0.7)
            ..close(),
          Paint()..color = const Color(0xFFB8613D),
        );
      }
    }
  }

  @override
  bool shouldRepaint(_LandscapePainter o) => o.t != t || o.parallax != parallax || o.m != m;
}
