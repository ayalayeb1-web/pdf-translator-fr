// Shared building blocks of the Voya interface.
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../content/models.dart';
import '../core/app_state.dart';
import 'theme.dart';

/// The Voya mark: a path that dips and rises into a "V", ending on the destination dot.
/// Same geometry as assets/brand/voya-logo.svg.
class VoyaMark extends StatelessWidget {
  const VoyaMark({super.key, this.size = 36, this.progress = 1, this.tile = true});
  final double size;
  final double progress; // 0..1, draws the path (used by the splash)
  final bool tile;
  @override
  Widget build(BuildContext context) =>
      SizedBox.square(dimension: size, child: CustomPaint(painter: _MarkPainter(progress, tile)));
}

class _MarkPainter extends CustomPainter {
  _MarkPainter(this.t, this.tile);
  final double t;
  final bool tile;
  @override
  void paint(Canvas canvas, Size s) {
    final k = s.width / 512;
    canvas.scale(k);
    if (tile) {
      final r = RRect.fromRectAndRadius(const Rect.fromLTWH(0, 0, 512, 512), const Radius.circular(116));
      canvas.drawRRect(
        r,
        Paint()
          ..shader = const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF232A3D), Color(0xFF12151F)])
              .createShader(const Rect.fromLTWH(0, 0, 512, 512)),
      );
    }
    final path = Path()
      ..moveTo(118, 150)
      ..cubicTo(150, 150, 176, 172, 196, 214)
      ..lineTo(242, 330)
      ..cubicTo(248, 346, 264, 346, 270, 330)
      ..lineTo(330, 176);
    final metric = path.computeMetrics().first;
    final drawn = metric.extractPath(0, metric.length * t.clamp(0, 1));
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 50
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..shader = const LinearGradient(colors: [Color(0xFFFF6A4D), Color(0xFFF4A93B)]).createShader(const Rect.fromLTWH(100, 140, 260, 220));
    canvas.drawPath(drawn, stroke);
    if (t >= 0.98) {
      canvas.drawCircle(const Offset(378, 136), 34, Paint()..color = const Color(0xFFFFF3E2));
      canvas.drawCircle(const Offset(378, 136), 14, Paint()..color = const Color(0xFFF4A93B));
    }
  }

  @override
  bool shouldRepaint(_MarkPainter o) => o.t != t || o.tile != tile;
}

/// A surface card with an optional hover lift (desktop pointer).
class Panel extends StatefulWidget {
  const Panel({super.key, required this.child, this.padding = const EdgeInsets.all(Tokens.s6), this.onTap, this.color, this.border, this.radius = Tokens.rLg, this.semanticLabel});
  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Color? color;
  final Color? border;
  final double radius;
  final String? semanticLabel;
  @override
  State<Panel> createState() => _PanelState();
}

class _PanelState extends State<Panel> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final interactive = widget.onTap != null;
    final box = AnimatedContainer(
      duration: Tokens.fast,
      curve: Tokens.ease,
      padding: widget.padding,
      transform: Matrix4.translationValues(0, hover && interactive ? -2 : 0, 0),
      decoration: BoxDecoration(
        color: widget.color ?? p.surface,
        borderRadius: BorderRadius.circular(widget.radius),
        border: Border.all(color: widget.border ?? (hover && interactive ? p.accent.withValues(alpha: 0.45) : p.line)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: hover && interactive ? 0.08 : 0.035),
            blurRadius: hover && interactive ? 24 : 10,
            offset: Offset(0, hover && interactive ? 10 : 3),
          ),
        ],
      ),
      child: widget.child,
    );
    if (!interactive) return box;
    return Semantics(
      button: true,
      label: widget.semanticLabel,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(onTap: widget.onTap, behavior: HitTestBehavior.opaque, child: box),
      ),
    );
  }
}

enum BtnKind { primary, secondary, ghost, danger }

class Btn extends StatefulWidget {
  const Btn({super.key, required this.label, this.onPressed, this.icon, this.kind = BtnKind.primary, this.large = false, this.shortcut, this.expand = false});
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final BtnKind kind;
  final bool large;
  final String? shortcut; // shown as a key cap, e.g. "Entrée"
  final bool expand;
  @override
  State<Btn> createState() => _BtnState();
}

class _BtnState extends State<Btn> {
  bool hover = false, down = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final enabled = widget.onPressed != null;
    final (bg, fg, bd) = switch (widget.kind) {
      BtnKind.primary => (p.accent, p.onAccent, p.accent),
      BtnKind.secondary => (p.raised, p.ink, p.line),
      BtnKind.ghost => (Colors.transparent, p.inkSoft, Colors.transparent),
      BtnKind.danger => (p.dangerSoft, p.danger, p.dangerSoft),
    };
    final hoverBg = widget.kind == BtnKind.primary
        ? Color.lerp(bg, Colors.black, 0.08)!
        : widget.kind == BtnKind.ghost
            ? p.ink.withValues(alpha: 0.06)
            : Color.lerp(bg, p.ink, 0.04)!;
    final content = Row(
      mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.icon != null) ...[Icon(widget.icon, size: widget.large ? 20 : 18, color: fg), const SizedBox(width: 8)],
        Flexible(child: Text(widget.label, overflow: TextOverflow.ellipsis, style: context.text.labelLarge!.copyWith(color: fg, fontSize: widget.large ? 15.5 : 14))),
        if (widget.shortcut != null) ...[const SizedBox(width: 10), KeyCap(widget.shortcut!, color: fg)],
      ],
    );
    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      excludeSemantics: true,
      child: MouseRegion(
        cursor: enabled ? SystemMouseCursors.click : SystemMouseCursors.forbidden,
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(
          onTapDown: enabled ? (_) => setState(() => down = true) : null,
          onTapUp: enabled ? (_) => setState(() => down = false) : null,
          onTapCancel: () => setState(() => down = false),
          onTap: widget.onPressed,
          child: AnimatedScale(
            scale: down ? 0.97 : 1,
            duration: Tokens.fast,
            child: AnimatedOpacity(
              opacity: enabled ? 1 : 0.45,
              duration: Tokens.fast,
              child: AnimatedContainer(
                duration: Tokens.fast,
                padding: EdgeInsets.symmetric(horizontal: widget.large ? 26 : 18, vertical: widget.large ? 16 : 11),
                decoration: BoxDecoration(
                  color: hover && enabled ? hoverBg : bg,
                  borderRadius: BorderRadius.circular(Tokens.rMd),
                  border: Border.all(color: bd),
                ),
                child: content,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class KeyCap extends StatelessWidget {
  const KeyCap(this.label, {super.key, this.color});
  final String label;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    final c = color ?? context.pal.inkSoft;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(border: Border.all(color: c.withValues(alpha: 0.45)), borderRadius: BorderRadius.circular(5)),
      child: Text(label, style: TextStyle(fontFamily: Tokens.ui, fontSize: 10.5, fontWeight: FontWeight.w700, color: c.withValues(alpha: 0.9))),
    );
  }
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key, this.color});
  final String text;
  final Color? color;
  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(), style: context.text.labelSmall!.copyWith(color: color));
}

class Tag extends StatelessWidget {
  const Tag(this.text, {super.key, this.color, this.icon});
  final String text;
  final Color? color;
  final IconData? icon;
  @override
  Widget build(BuildContext context) {
    final c = color ?? context.pal.inkSoft;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.10), borderRadius: BorderRadius.circular(99)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        if (icon != null) ...[Icon(icon, size: 13, color: c), const SizedBox(width: 4)],
        Text(text, style: context.text.labelMedium!.copyWith(color: c)),
      ]),
    );
  }
}

class Ring extends StatelessWidget {
  const Ring({super.key, required this.value, this.size = 64, this.stroke = 7, this.child, this.color});
  final double value;
  final double size, stroke;
  final Widget? child;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value.clamp(0, 1)),
      duration: Tokens.slow,
      curve: Tokens.ease,
      builder: (_, v, _) => SizedBox.square(
        dimension: size,
        child: CustomPaint(
          painter: _RingPainter(v, stroke, color ?? p.accent, p.line),
          child: Center(child: child),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.v, this.w, this.c, this.bg);
  final double v, w;
  final Color c, bg;
  @override
  void paint(Canvas canvas, Size s) {
    final r = Rect.fromLTWH(w / 2, w / 2, s.width - w, s.height - w);
    canvas.drawArc(r, 0, math.pi * 2, false, Paint()..style = PaintingStyle.stroke..strokeWidth = w..color = bg);
    canvas.drawArc(r, -math.pi / 2, math.pi * 2 * v, false, Paint()..style = PaintingStyle.stroke..strokeWidth = w..strokeCap = StrokeCap.round..color = c);
  }

  @override
  bool shouldRepaint(_RingPainter o) => o.v != v || o.c != c;
}

class Bar extends StatelessWidget {
  const Bar({super.key, required this.value, this.height = 6, this.color});
  final double value, height;
  final Color? color;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return ClipRRect(
      borderRadius: BorderRadius.circular(height),
      child: Stack(children: [
        Container(height: height, color: p.line),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: value.clamp(0, 1)),
          duration: Tokens.slow,
          curve: Tokens.ease,
          builder: (_, v, _) => FractionallySizedBox(widthFactor: v, child: Container(height: height, color: color ?? p.accent)),
        ),
      ]),
    );
  }
}

/// Speaker buttons (normal / slow) wired to the shared speech service.
class SpeakButtons extends StatelessWidget {
  const SpeakButtons(this.text, {super.key, this.compact = false});
  final String text;
  final bool compact;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.read(context);
    return Row(mainAxisSize: MainAxisSize.min, children: [
      _RoundIcon(icon: Icons.volume_up_rounded, tooltip: 'Écouter (vitesse naturelle)', onTap: () => app.speech.speak(text), size: compact ? 32 : 40),
      const SizedBox(width: 6),
      _RoundIcon(icon: Icons.slow_motion_video_rounded, tooltip: 'Écouter lentement', onTap: () => app.speech.speak(text, slow: true), size: compact ? 32 : 40),
    ]);
  }
}

class _RoundIcon extends StatefulWidget {
  const _RoundIcon({required this.icon, required this.tooltip, required this.onTap, this.size = 40});
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;
  final double size;
  @override
  State<_RoundIcon> createState() => _RoundIconState();
}

class _RoundIconState extends State<_RoundIcon> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Tooltip(
      message: widget.tooltip,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => setState(() => hover = true),
        onExit: (_) => setState(() => hover = false),
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: Tokens.fast,
            width: widget.size,
            height: widget.size,
            decoration: BoxDecoration(color: hover ? p.accent : p.accentSoft, shape: BoxShape.circle),
            child: Icon(widget.icon, size: widget.size * 0.5, color: hover ? p.onAccent : p.accent),
          ),
        ),
      ),
    );
  }
}

class IconBtn extends StatelessWidget {
  const IconBtn({super.key, required this.icon, required this.tooltip, required this.onTap, this.size = 36, this.color, this.active = false});
  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;
  final double size;
  final Color? color;
  final bool active;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Tooltip(
      message: tooltip,
      child: Material(
        color: active ? p.accentSoft : Colors.transparent,
        borderRadius: BorderRadius.circular(Tokens.rSm),
        child: InkWell(
          borderRadius: BorderRadius.circular(Tokens.rSm),
          onTap: onTap,
          child: SizedBox.square(dimension: size, child: Icon(icon, size: size * 0.5, color: color ?? (active ? p.accent : p.inkSoft))),
        ),
      ),
    );
  }
}

/// Right-click (or long-press) menu for any word or sentence of the course.
Future<void> showWordMenu(BuildContext context, Offset position, {required String text, Item? item, String source = ''}) async {
  final app = AppScope.read(context);
  final overlay = Overlay.of(context).context.findRenderObject() as RenderBox;
  final inVocab = item != null && app.inVocab(item.term);
  final choice = await showMenu<String>(
    context: context,
    position: RelativeRect.fromRect(position & const Size(1, 1), Offset.zero & overlay.size),
    items: [
      const PopupMenuItem(value: 'play', child: _MenuRow(Icons.volume_up_rounded, 'Écouter')),
      const PopupMenuItem(value: 'slow', child: _MenuRow(Icons.slow_motion_video_rounded, 'Écouter lentement')),
      if (item != null)
        PopupMenuItem(
          value: 'vocab',
          child: _MenuRow(inVocab ? Icons.bookmark_remove_rounded : Icons.bookmark_add_rounded, inVocab ? 'Retirer de mon vocabulaire' : 'Ajouter à mon vocabulaire'),
        ),
      const PopupMenuDivider(),
      const PopupMenuItem(value: 'copy', child: _MenuRow(Icons.copy_rounded, 'Copier')),
    ],
  );
  if (!context.mounted) return;
  switch (choice) {
    case 'play':
      app.speech.speak(text);
    case 'slow':
      app.speech.speak(text, slow: true);
    case 'vocab':
      await app.toggleVocab(item!, source);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(inVocab ? '« ${item.term} » retiré de votre vocabulaire' : '« ${item.term} » ajouté à votre vocabulaire')));
      }
    case 'copy':
      await Clipboard.setData(ClipboardData(text: text));
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copié dans le presse-papiers'), duration: Duration(seconds: 2)));
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow(this.icon, this.label);
  final IconData icon;
  final String label;
  @override
  Widget build(BuildContext context) => Row(children: [Icon(icon, size: 18, color: context.pal.inkSoft), const SizedBox(width: 12), Text(label)]);
}

/// Wraps a widget so that right-click / long-press opens the word menu.
class WordTarget extends StatelessWidget {
  const WordTarget({super.key, required this.text, this.item, this.source = '', required this.child});
  final String text;
  final Item? item;
  final String source;
  final Widget child;
  @override
  Widget build(BuildContext context) => GestureDetector(
        onSecondaryTapUp: (d) => showWordMenu(context, d.globalPosition, text: text, item: item, source: source),
        onLongPressStart: (d) => showWordMenu(context, d.globalPosition, text: text, item: item, source: source),
        child: child,
      );
}

/// Page scaffold for the central area: generous margins, a title block and scrolling content.
class PageFrame extends StatelessWidget {
  const PageFrame({super.key, required this.title, this.eyebrow, this.subtitle, this.actions = const [], required this.children, this.maxWidth = 1180});
  final String title;
  final String? eyebrow, subtitle;
  final List<Widget> actions;
  final List<Widget> children;
  final double maxWidth;
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, c) {
      final pad = c.maxWidth > 1300 ? 56.0 : c.maxWidth > 1000 ? 40.0 : 24.0;
      return Scrollbar(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(pad, 28, pad, 48),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: maxWidth),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (eyebrow != null) ...[Eyebrow(eyebrow!), const SizedBox(height: 8)],
                      Text(title, style: context.text.displaySmall),
                      if (subtitle != null) ...[const SizedBox(height: 6), Text(subtitle!, style: context.text.bodyMedium!.copyWith(color: context.pal.inkSoft))],
                    ]),
                  ),
                  ...actions,
                ]),
                const SizedBox(height: 28),
                ...children,
              ]),
            ),
          ),
        ),
      );
    });
  }
}

/// Fades and slides children in, one after another.
class Reveal extends StatelessWidget {
  const Reveal({super.key, required this.index, required this.child});
  final int index;
  final Widget child;
  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: 1),
        duration: Duration(milliseconds: 380 + index * 70),
        curve: Interval(math.min(0.6, index * 0.1), 1, curve: Tokens.ease),
        builder: (_, v, c) => Opacity(opacity: v, child: Transform.translate(offset: Offset(0, (1 - v) * 14), child: c)),
        child: child,
      );
}
