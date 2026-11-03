// Senri design system — art direction "Encre & Lumière".
// Warm paper, deep ink, one luminous accent per language. Editorial serif for moments that
// matter (titles, the word being learned), a precise sans-serif for everything functional.
import 'package:flutter/material.dart';

class Tokens {
  // spacing (4-pt grid)
  static const s1 = 4.0, s2 = 8.0, s3 = 12.0, s4 = 16.0, s5 = 20.0, s6 = 24.0, s8 = 32.0, s10 = 40.0, s12 = 48.0;
  // radii
  static const rSm = 8.0, rMd = 12.0, rLg = 18.0, rXl = 26.0;
  // motion
  static const fast = Duration(milliseconds: 140), base = Duration(milliseconds: 240), slow = Duration(milliseconds: 420);
  static const ease = Curves.easeOutCubic;
  // type families
  static const display = 'Fraunces', ui = 'Manrope', jp = 'NotoSansJP';
  static const fallback = ['NotoSansJP'];
}

/// Colours that the Material [ColorScheme] does not model, available via `Theme.of(context).extension<Palette>()`.
@immutable
class Palette extends ThemeExtension<Palette> {
  const Palette({
    required this.paper,
    required this.surface,
    required this.raised,
    required this.ink,
    required this.inkSoft,
    required this.inkFaint,
    required this.line,
    required this.accent,
    required this.accentSoft,
    required this.onAccent,
    required this.success,
    required this.successSoft,
    required this.danger,
    required this.dangerSoft,
    required this.gold,
    required this.sidebar,
  });

  final Color paper, surface, raised, ink, inkSoft, inkFaint, line, accent, accentSoft, onAccent, success, successSoft, danger, dangerSoft, gold, sidebar;

  static Color accentFor(String lang, Brightness b) => lang == 'es'
      ? (b == Brightness.light ? const Color(0xFFC2611A) : const Color(0xFFF0A048)) // saffron / terracotta
      : (b == Brightness.light ? const Color(0xFFC63D2B) : const Color(0xFFF07A62)); // shu vermilion

  factory Palette.of(String lang, Brightness b) {
    final accent = accentFor(lang, b);
    if (b == Brightness.light) {
      return Palette(
        paper: const Color(0xFFF6F2EA),
        surface: const Color(0xFFFFFDF9),
        raised: const Color(0xFFFFFFFF),
        ink: const Color(0xFF1A1E29),
        inkSoft: const Color(0xFF555B68),
        inkFaint: const Color(0xFF8E918F),
        line: const Color(0xFFE6DED0),
        accent: accent,
        accentSoft: Color.alphaBlend(accent.withValues(alpha: 0.10), const Color(0xFFFFFDF9)),
        onAccent: Colors.white,
        success: const Color(0xFF2C7A5E),
        successSoft: const Color(0xFFE4F1EA),
        danger: const Color(0xFFA8323E),
        dangerSoft: const Color(0xFFF8E6E6),
        gold: const Color(0xFFB8862B),
        sidebar: const Color(0xFFEFE9DE),
      );
    }
    return Palette(
      paper: const Color(0xFF111319),
      surface: const Color(0xFF191C24),
      raised: const Color(0xFF20242E),
      ink: const Color(0xFFEDE8DF),
      inkSoft: const Color(0xFFA9ACB4),
      inkFaint: const Color(0xFF6E727C),
      line: const Color(0xFF2A2E39),
      accent: accent,
      accentSoft: Color.alphaBlend(accent.withValues(alpha: 0.14), const Color(0xFF191C24)),
      onAccent: const Color(0xFF15161A),
      success: const Color(0xFF63C39C),
      successSoft: const Color(0xFF16302A),
      danger: const Color(0xFFF08390),
      dangerSoft: const Color(0xFF3A1D23),
      gold: const Color(0xFFE2B35A),
      sidebar: const Color(0xFF0D0F14),
    );
  }

  @override
  Palette copyWith() => this;

  @override
  Palette lerp(ThemeExtension<Palette>? other, double t) {
    if (other is! Palette) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return Palette(
      paper: l(paper, other.paper),
      surface: l(surface, other.surface),
      raised: l(raised, other.raised),
      ink: l(ink, other.ink),
      inkSoft: l(inkSoft, other.inkSoft),
      inkFaint: l(inkFaint, other.inkFaint),
      line: l(line, other.line),
      accent: l(accent, other.accent),
      accentSoft: l(accentSoft, other.accentSoft),
      onAccent: l(onAccent, other.onAccent),
      success: l(success, other.success),
      successSoft: l(successSoft, other.successSoft),
      danger: l(danger, other.danger),
      dangerSoft: l(dangerSoft, other.dangerSoft),
      gold: l(gold, other.gold),
      sidebar: l(sidebar, other.sidebar),
    );
  }
}

extension PaletteX on BuildContext {
  Palette get pal => Theme.of(this).extension<Palette>()!;
  TextTheme get text => Theme.of(this).textTheme;
}

ThemeData buildTheme(String lang, Brightness b) {
  final p = Palette.of(lang, b);
  final scheme = ColorScheme.fromSeed(seedColor: p.accent, brightness: b).copyWith(
    primary: p.accent,
    onPrimary: p.onAccent,
    surface: p.surface,
    onSurface: p.ink,
    error: p.danger,
    outline: p.line,
  );
  TextStyle ui(double size, FontWeight w, {double h = 1.35, double ls = 0, Color? c}) =>
      TextStyle(fontFamily: Tokens.ui, fontFamilyFallback: Tokens.fallback, fontSize: size, fontWeight: w, height: h, letterSpacing: ls, color: c ?? p.ink);
  TextStyle disp(double size, {FontWeight w = FontWeight.w600, double h = 1.12}) =>
      TextStyle(fontFamily: Tokens.display, fontFamilyFallback: Tokens.fallback, fontSize: size, fontWeight: w, height: h, letterSpacing: -0.4, color: p.ink);

  final text = TextTheme(
    displayLarge: disp(56, w: FontWeight.w500, h: 1.04),
    displayMedium: disp(40, w: FontWeight.w500),
    displaySmall: disp(30),
    headlineMedium: disp(24),
    headlineSmall: disp(20),
    titleLarge: ui(18, FontWeight.w700),
    titleMedium: ui(15, FontWeight.w700),
    titleSmall: ui(13, FontWeight.w700, ls: 0.2),
    bodyLarge: ui(16, FontWeight.w500, h: 1.55),
    bodyMedium: ui(14, FontWeight.w500, h: 1.5),
    bodySmall: ui(12.5, FontWeight.w500, c: p.inkSoft),
    labelLarge: ui(14, FontWeight.w700),
    labelMedium: ui(12, FontWeight.w700, ls: 0.3),
    labelSmall: ui(10.5, FontWeight.w800, ls: 1.1, c: p.inkFaint),
  );

  return ThemeData(
    useMaterial3: true,
    brightness: b,
    colorScheme: scheme,
    scaffoldBackgroundColor: p.paper,
    canvasColor: p.paper,
    fontFamily: Tokens.ui,
    fontFamilyFallback: Tokens.fallback,
    textTheme: text,
    extensions: [p],
    splashFactory: InkSparkle.splashFactory,
    dividerTheme: DividerThemeData(color: p.line, thickness: 1, space: 1),
    tooltipTheme: TooltipThemeData(
      decoration: BoxDecoration(color: p.ink, borderRadius: BorderRadius.circular(Tokens.rSm)),
      textStyle: ui(12, FontWeight.w600, c: p.paper),
      waitDuration: const Duration(milliseconds: 450),
    ),
    popupMenuTheme: PopupMenuThemeData(
      color: p.raised,
      surfaceTintColor: Colors.transparent,
      elevation: 8,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.rMd), side: BorderSide(color: p.line)),
      textStyle: ui(13.5, FontWeight.w600),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.rLg)),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: p.ink,
      contentTextStyle: ui(13.5, FontWeight.w600, c: p.paper),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Tokens.rMd)),
      width: 460,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.raised,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(Tokens.rMd), borderSide: BorderSide(color: p.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(Tokens.rMd), borderSide: BorderSide(color: p.line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(Tokens.rMd), borderSide: BorderSide(color: p.accent, width: 1.6)),
      hintStyle: ui(14, FontWeight.w500, c: p.inkFaint),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.onAccent : p.inkFaint),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? p.accent : p.line),
      trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
    ),
    sliderTheme: SliderThemeData(activeTrackColor: p.accent, thumbColor: p.accent, inactiveTrackColor: p.line, overlayColor: p.accent.withValues(alpha: 0.12)),
    scrollbarTheme: ScrollbarThemeData(
      thumbColor: WidgetStateProperty.all(p.inkFaint.withValues(alpha: 0.35)),
      radius: const Radius.circular(8),
      thickness: WidgetStateProperty.all(6),
    ),
  );
}
