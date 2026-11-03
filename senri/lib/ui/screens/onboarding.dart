// First run: language → level (with an optional 8-question check) → goal → daily time → first lesson.
import 'dart:math';

import 'package:flutter/material.dart';

import '../../content/models.dart';
import '../../core/app_state.dart';
import '../theme.dart';
import '../widgets.dart';

class Onboarding extends StatefulWidget {
  const Onboarding({super.key});
  @override
  State<Onboarding> createState() => _OnboardingState();
}

class _Q {
  _Q(this.item, this.options, this.level);
  final Item item;
  final List<String> options;
  final String level;
}

class _OnboardingState extends State<Onboarding> {
  int step = 0;
  String lang = 'ja';
  String level = 'A1';
  String goal = 'voyage';
  int minutes = 10;
  // placement
  List<_Q>? quiz;
  int qi = 0;
  final Map<String, int> score = {'A1': 0, 'A2': 0};

  static const steps = ['Langue', 'Niveau', 'Objectif', 'Rythme'];

  void _startQuiz(AppState app) {
    final rnd = Random();
    final course = app.courses[lang]!;
    List<_Q> pick(String lvl, int n) {
      final items = course.level(lvl).lessons.where((l) => l.type == LessonType.vocab).expand((l) => l.items).toList()..shuffle(rnd);
      final meanings = course.items.values.map((i) => i.meaning).toSet().toList();
      return items.take(n).map((it) {
        final opts = (meanings.where((m) => m != it.meaning).toList()..shuffle(rnd)).take(3).toList()
          ..add(it.meaning)
          ..shuffle(rnd);
        return _Q(it, opts, lvl);
      }).toList();
    }

    setState(() {
      quiz = [...pick('A1', 4), ...pick('A2', 4)];
      qi = 0;
      score.updateAll((_, _) => 0);
    });
  }

  void _answer(String o) {
    final q = quiz![qi];
    if (o == q.item.meaning) score[q.level] = score[q.level]! + 1;
    if (qi + 1 >= quiz!.length) {
      setState(() {
        level = score['A1']! >= 3 && score['A2']! >= 3 ? 'A2' : 'A1';
        quiz = null;
        step = 2;
      });
    } else {
      setState(() => qi++);
    }
  }

  Future<void> _finish(AppState app) async {
    await app.set('lang', lang);
    await app.set('level_$lang', level);
    await app.set('goal', goal);
    await app.set('minutes', '$minutes');
    await app.set('onboarded', '1');
    await app.switchLanguage(lang);
    final first = app.nextLesson;
    if (first != null) app.startLesson(first);
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final accent = Palette.accentFor(lang, Theme.of(context).brightness);
    return Theme(
      data: buildTheme(lang, Theme.of(context).brightness),
      child: Builder(builder: (context) {
        return Scaffold(
          backgroundColor: p.paper,
          body: Row(children: [
            // left: brand column
            Container(
              width: 380,
              color: const Color(0xFF151925),
              padding: const EdgeInsets.all(44),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const SenriMark(size: 40),
                  const SizedBox(width: 14),
                  Text('Senri', style: context.text.headlineMedium!.copyWith(color: const Color(0xFFF6F2EA))),
                ]),
                const Spacer(),
                Text('Une langue,\nun voyage.', style: context.text.displaySmall!.copyWith(color: const Color(0xFFF6F2EA), fontSize: 34)),
                const SizedBox(height: 18),
                Text('Japonais et espagnol d’Espagne, du niveau A1 au C2. Des leçons courtes avec un objectif clair, des révisions qui s’adaptent à vos erreurs, et un laboratoire pour travailler votre prononciation.',
                    style: context.text.bodyMedium!.copyWith(color: const Color(0xFFB9BBC4))),
                const SizedBox(height: 36),
                for (final (i, s) in steps.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(children: [
                      AnimatedContainer(
                        duration: Tokens.base,
                        width: 26,
                        height: 26,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: i < step ? accent : Colors.transparent,
                          border: Border.all(color: i <= step ? accent : const Color(0xFF3A3F4E), width: 1.5),
                        ),
                        child: i < step
                            ? const Icon(Icons.check_rounded, size: 15, color: Colors.white)
                            : Text('${i + 1}', style: context.text.labelMedium!.copyWith(color: i == step ? accent : const Color(0xFF6E727C))),
                      ),
                      const SizedBox(width: 12),
                      Text(s, style: context.text.titleSmall!.copyWith(color: i <= step ? const Color(0xFFF6F2EA) : const Color(0xFF6E727C))),
                    ]),
                  ),
              ]),
            ),
            Expanded(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 760),
                  child: Padding(
                    padding: const EdgeInsets.all(48),
                    child: AnimatedSwitcher(
                      duration: Tokens.base,
                      transitionBuilder: (c, a) => FadeTransition(opacity: a, child: SlideTransition(position: Tween(begin: const Offset(0.03, 0), end: Offset.zero).animate(a), child: c)),
                      child: KeyedSubtree(key: ValueKey('$step-${quiz != null}-$qi'), child: _page(context, app)),
                    ),
                  ),
                ),
              ),
            ),
          ]),
        );
      }),
    );
  }

  Widget _page(BuildContext context, AppState app) {
    final p = context.pal;
    Widget choice(String key, String title, String subtitle, {String? glyph, IconData? icon, required bool selected, required VoidCallback onTap}) => Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Panel(
            onTap: onTap,
            semanticLabel: title,
            padding: const EdgeInsets.all(20),
            border: selected ? p.accent : null,
            color: selected ? p.accentSoft : null,
            child: Row(children: [
              if (glyph != null)
                Container(
                  width: 52,
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: selected ? p.accent : p.sidebar, borderRadius: BorderRadius.circular(14)),
                  child: Text(glyph, style: TextStyle(fontFamily: Tokens.display, fontFamilyFallback: Tokens.fallback, fontSize: 26, fontWeight: FontWeight.w700, color: selected ? p.onAccent : p.ink)),
                )
              else if (icon != null)
                Icon(icon, color: selected ? p.accent : p.inkSoft),
              const SizedBox(width: 18),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: context.text.titleLarge),
                  const SizedBox(height: 2),
                  Text(subtitle, style: context.text.bodySmall),
                ]),
              ),
              AnimatedOpacity(opacity: selected ? 1 : 0, duration: Tokens.fast, child: Icon(Icons.check_circle_rounded, color: p.accent)),
            ]),
          ),
        );

    Widget nav({required VoidCallback onNext, String label = 'Continuer'}) => Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Row(children: [
            if (step > 0) Btn(label: 'Retour', kind: BtnKind.ghost, icon: Icons.arrow_back_rounded, onPressed: () => setState(() => step--)),
            const Spacer(),
            Btn(label: label, icon: Icons.arrow_forward_rounded, large: true, onPressed: onNext),
          ]),
        );

    if (quiz != null) {
      final q = quiz![qi];
      return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Eyebrow('Estimation du niveau · ${qi + 1} / ${quiz!.length}'),
        const SizedBox(height: 10),
        Bar(value: qi / quiz!.length),
        const SizedBox(height: 36),
        Center(child: Text(q.item.term, style: context.text.displayLarge)),
        const SizedBox(height: 8),
        Center(child: Text('Que signifie ce mot ?', style: context.text.bodyMedium!.copyWith(color: p.inkSoft))),
        const SizedBox(height: 30),
        for (final o in q.options) choice(o, o, '', selected: false, onTap: () => _answer(o)),
        Align(alignment: Alignment.centerLeft, child: Btn(label: 'Je ne sais pas', kind: BtnKind.ghost, onPressed: () => _answer(''))),
      ]);
    }

    switch (step) {
      case 0:
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Quelle langue voulez-vous apprendre ?', style: context.text.displaySmall),
          const SizedBox(height: 8),
          Text('Vous pourrez apprendre l’autre plus tard ; chaque langue a sa propre progression.', style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
          const SizedBox(height: 28),
          for (final l in StudyLanguage.all)
            choice(l.code, '${l.name} · ${l.nativeName}', '${l.regionNote} · repères ${l.examLabel}', glyph: l.glyph, selected: lang == l.code, onTap: () => setState(() => lang = l.code)),
          nav(onNext: () => setState(() => step = 1)),
        ]);
      case 1:
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Où en êtes-vous ?', style: context.text.displaySmall),
          const SizedBox(height: 8),
          Text('Le contenu rédigé couvre aujourd’hui les niveaux A1 et A2. B1 à C2 sont présentés comme programme.', style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
          const SizedBox(height: 28),
          choice('A1', 'Je débute', lang == 'ja' ? 'A1 · JLPT N5 — hiragana, katakana, premières phrases' : 'A1 · DELE A1 — se présenter, premières phrases', icon: Icons.spa_rounded, selected: level == 'A1', onTap: () => setState(() => level = 'A1')),
          choice('A2', 'J’ai déjà des bases', lang == 'ja' ? 'A2 · JLPT N4 — forme en te, envies, langage familier' : 'A2 · DELE A2 — passé, routines, conversations simples', icon: Icons.terrain_rounded, selected: level == 'A2', onTap: () => setState(() => level = 'A2')),
          Panel(
            onTap: () => _startQuiz(app),
            semanticLabel: 'Estimer mon niveau',
            padding: const EdgeInsets.all(18),
            color: p.sidebar,
            child: Row(children: [
              Icon(Icons.quiz_rounded, color: p.accent),
              const SizedBox(width: 14),
              Expanded(child: Text('Pas sûr·e ? Répondez à 8 questions pour estimer votre niveau.', style: context.text.titleSmall)),
              Icon(Icons.chevron_right_rounded, color: p.inkFaint),
            ]),
          ),
          nav(onNext: () => setState(() => step = 2)),
        ]);
      case 2:
        const goals = [
          ('voyage', 'Voyager', 'Se débrouiller sur place, comprendre et se faire comprendre', Icons.flight_takeoff_rounded),
          ('culture', 'Culture, films, séries', 'Comprendre sans sous-titres, lire', Icons.movie_filter_rounded),
          ('travail', 'Travail', 'Échanges professionnels, politesse', Icons.work_rounded),
          ('etudes', 'Études ou examen', 'Préparer le JLPT ou le DELE', Icons.school_rounded),
          ('proches', 'Famille et amis', 'Parler avec des proches', Icons.favorite_rounded),
        ];
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Pourquoi apprenez-vous ?', style: context.text.displaySmall),
          if (level == 'A2') ...[const SizedBox(height: 8), Tag('Niveau retenu : A2', color: p.success, icon: Icons.check_rounded)],
          const SizedBox(height: 24),
          for (final (k, t, s, ic) in goals) choice(k, t, s, icon: ic, selected: goal == k, onTap: () => setState(() => goal = k)),
          nav(onNext: () => setState(() => step = 3)),
        ]);
      default:
        return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('Combien de temps par jour ?', style: context.text.displaySmall),
          const SizedBox(height: 8),
          Text('La régularité compte plus que la durée. Vous pourrez changer ce choix dans les paramètres.', style: context.text.bodyMedium!.copyWith(color: p.inkSoft)),
          const SizedBox(height: 28),
          for (final (m, t) in const [(5, 'Une pause café'), (10, 'Régulier — recommandé'), (15, 'Soutenu'), (20, 'Intensif')])
            choice('$m', '$m minutes', t, icon: Icons.timer_rounded, selected: minutes == m, onTap: () => setState(() => minutes = m)),
          nav(onNext: () => _finish(app), label: 'Commencer ma première leçon'),
        ]);
    }
  }
}
