// Settings: voice, practice, appearance, data — and an honest list of what needs a server.
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import '../../audio/speech.dart';
import '../../core/app_state.dart';
import '../theme.dart';
import '../widgets.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final pal = context.pal;
    final voices = app.speech.voicesFor(app.language.locale);
    final current = app.speech.voiceName;
    return PageFrame(
      eyebrow: 'Senri',
      title: 'Paramètres',
      maxWidth: 900,
      children: [
        _Group(title: 'Voix · ${app.language.name}', icon: Icons.record_voice_over_rounded, children: [
          if (!app.speech.available)
            _Row(title: 'Synthèse vocale indisponible', subtitle: app.speech.error ?? 'Ce système ne fournit pas de voix.')
          else if (voices.isEmpty)
            _Row(
              title: 'Aucune voix ${app.language.locale} installée',
              subtitle: 'Windows : Paramètres → Heure et langue → Voix → Ajouter des voix → ${const {'ja': 'Japonais', 'es': 'Espagnol (Espagne)', 'it': 'Italien (Italie)'}[app.lang]}. Redémarrez ensuite Senri.',
              warn: true,
            )
          else
            _VoicePicker(voices: voices, current: current),
          if (app.speech.otherRegions(app.language.locale).isNotEmpty && app.lang == 'es')
            _Row(
              title: 'Voix d’autres régions ignorées',
              subtitle: '${app.speech.otherRegions(app.language.locale).map((v) => '${v.shortName} (${v.region})').join(', ')} : Senri n’utilise que des voix d’Espagne pour enseigner l’accent castillan.',
              muted: true,
            ),
          if (voices.isNotEmpty && !voices.any((v) => v.natural))
            const _Row(
              title: 'Astuce : voix plus naturelles',
              subtitle: 'Vos voix sont des voix standard. Sous Windows 11, ajoutez des voix dans Paramètres → Heure et langue → Voix ; certaines voix « naturelles » ne sont toutefois pas accessibles aux applications. Senri choisit automatiquement la meilleure voix disponible.',
              muted: true,
            ),
          _Row(
            title: 'Vitesse naturelle',
            subtitle: 'La lecture lente découpe la phrase en groupes de mots avec des pauses, pour bien entendre chaque son.',
            trailing: SizedBox(
              width: 260,
              child: Slider(
                value: app.speechRate.clamp(0.3, 0.7),
                min: 0.3,
                max: 0.7,
                divisions: 8,
                label: '${(app.speechRate / 0.5 * 100).round()} %',
                onChanged: (v) async {
                  await app.set('rate', v.toStringAsFixed(2));
                  app.speech.normalRate = v;
                  app.speech.slowRate = (v * 0.64).clamp(0.15, 1.0);
                },
                onChangeEnd: (_) => app.speech.speak(const {'ja': 'ゆっくり話してください。', 'es': 'Más despacio, por favor.', 'it': 'Più piano, per favore.'}[app.lang]!),
              ),
            ),
          ),
          _Row(
            title: 'Tester',
            subtitle: 'Écoutez une phrase type à vitesse naturelle puis lente.',
            trailing: SpeakButtons(const {'ja': '駅はどこですか。', 'es': '¿Dónde está la estación?', 'it': 'Dov\'è la stazione?'}[app.lang]!),
          ),
        ]),
        _Group(title: 'Pratique', icon: Icons.bolt_rounded, children: [
          _Row(
            title: 'Correction et passage automatiques',
            subtitle: 'Une bonne réponse passe seule à la suivante. Une erreur attend toujours que vous ayez lu la correction.',
            trailing: Switch(value: app.autoAdvance, onChanged: (v) => app.set('auto', v ? '1' : '0')),
          ),
          _Row(
            title: 'Objectif quotidien',
            subtitle: 'Temps de pratique visé chaque jour.',
            trailing: SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 5, label: Text('5 min')),
                ButtonSegment(value: 10, label: Text('10')),
                ButtonSegment(value: 15, label: Text('15')),
                ButtonSegment(value: 20, label: Text('20')),
              ],
              selected: {app.dailyMinutes},
              showSelectedIcon: false,
              onSelectionChanged: (s) => app.set('minutes', '${s.first}'),
            ),
          ),
          _Row(
            title: 'Notifications Windows',
            subtitle: 'Prévient quand l’objectif du jour est atteint, et des révisions en attente au démarrage.',
            trailing: Switch(value: app.notifications, onChanged: (v) => app.set('notify', v ? '1' : '0')),
          ),
        ]),
        _Group(title: 'Apparence', icon: Icons.palette_rounded, children: [
          _Row(
            title: 'Thème',
            trailing: SegmentedButton<ThemeMode>(
              segments: const [
                ButtonSegment(value: ThemeMode.system, label: Text('Système'), icon: Icon(Icons.computer_rounded, size: 16)),
                ButtonSegment(value: ThemeMode.light, label: Text('Clair'), icon: Icon(Icons.light_mode_rounded, size: 16)),
                ButtonSegment(value: ThemeMode.dark, label: Text('Sombre'), icon: Icon(Icons.dark_mode_rounded, size: 16)),
              ],
              selected: {app.themeMode},
              showSelectedIcon: false,
              onSelectionChanged: (s) => app.set('theme', switch (s.first) { ThemeMode.light => 'light', ThemeMode.dark => 'dark', _ => 'system' }),
            ),
          ),
        ]),
        _Group(title: 'Données', icon: Icons.storage_rounded, children: [
          _Row(title: 'Base de données locale', subtitle: app.store.path, selectable: true),
          _Row(
            title: 'Exporter mes données',
            subtitle: 'Progression, révisions, vocabulaire et historique au format JSON.',
            trailing: Btn(
              label: 'Exporter',
              kind: BtnKind.secondary,
              icon: Icons.download_rounded,
              onPressed: () async {
                final json = await app.store.exportJson();
                final dir = await getApplicationDocumentsDirectory();
                final f = File(p.join(dir.path, 'senri-export-${DateTime.now().millisecondsSinceEpoch}.json'));
                await f.writeAsString(json);
                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exporté : ${f.path}')));
              },
            ),
          ),
          _Row(
            title: 'Réinitialiser le ${app.language.name.toLowerCase()}',
            subtitle: 'Efface la progression, les révisions, le vocabulaire et les enregistrements de cette langue.',
            trailing: Btn(
              label: 'Réinitialiser',
              kind: BtnKind.danger,
              onPressed: () async {
                final ok = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: Text('Tout effacer pour le ${app.language.name.toLowerCase()} ?', style: ctx.text.headlineSmall),
                    content: Text('Cette action est définitive.', style: ctx.text.bodyMedium),
                    actions: [
                      Btn(label: 'Annuler', kind: BtnKind.secondary, onPressed: () => Navigator.pop(ctx, false)),
                      Btn(label: 'Effacer', kind: BtnKind.danger, onPressed: () => Navigator.pop(ctx, true)),
                    ],
                  ),
                );
                if (ok == true) await app.resetLanguage();
              },
            ),
          ),
        ]),
        _Group(title: 'Nécessite un service externe (non inclus)', icon: Icons.cloud_off_rounded, children: [
          for (final (t, d) in const [
            ('Voix neuronales studio', 'Un serveur Senri appellerait Azure Speech / Google / ElevenLabs avec une clé stockée côté serveur, puis mettrait l’audio en cache. Aucune clé n’est jamais intégrée à l’application.'),
            ('Analyse de prononciation', 'Azure Pronunciation Assessment (ou équivalent) via le même serveur : mots mal prononcés, phonèmes. Tant qu’il n’existe pas, Senri n’affiche aucune note.'),
            ('Partenaire de conversation IA', 'Un modèle de langage via le serveur, avec rapport de fin (erreurs, corrections, expressions). Non disponible dans cette version.'),
          ])
            _Row(title: t, subtitle: d, muted: true),
        ]),
        Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Row(children: [
            const SenriMark(size: 28),
            const SizedBox(width: 12),
            Expanded(child: Text('Senri 0.1.0 · données stockées localement', style: context.text.bodySmall, overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 16),
            Flexible(
              child: Text('${current == null ? 'Aucune voix' : VoiceInfo(current, '').shortName} · ${app.language.regionNote}',
                  overflow: TextOverflow.ellipsis, textAlign: TextAlign.end, style: context.text.bodySmall!.copyWith(color: pal.inkFaint)),
            ),
          ]),
        ),
      ],
    );
  }
}

class _Group extends StatelessWidget {
  const _Group({required this.title, required this.icon, required this.children});
  final String title;
  final IconData icon;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [Icon(icon, size: 18, color: p.accent), const SizedBox(width: 10), Text(title, style: context.text.titleMedium)]),
        const SizedBox(height: 10),
        Panel(
          padding: EdgeInsets.zero,
          child: Column(children: [
            for (var i = 0; i < children.length; i++) ...[if (i > 0) Divider(color: p.line, indent: 20, endIndent: 20), children[i]],
          ]),
        ),
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.title, this.subtitle, this.trailing, this.warn = false, this.muted = false, this.selectable = false});
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool warn, muted, selectable;
  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: context.text.titleSmall!.copyWith(color: warn ? p.danger : muted ? p.inkSoft : p.ink, fontSize: 14)),
            if (subtitle != null) ...[
              const SizedBox(height: 3),
              selectable ? SelectableText(subtitle!, style: context.text.bodySmall) : Text(subtitle!, style: context.text.bodySmall),
            ],
          ]),
        ),
        if (trailing != null) ...[const SizedBox(width: 20), trailing!],
      ]),
    );
  }
}

class _VoicePicker extends StatelessWidget {
  const _VoicePicker({required this.voices, required this.current});
  final List<VoiceInfo> voices;
  final String? current;

  static const samples = {
    'ja': 'こんにちは。今日はいい天気ですね。',
    'es': 'Hola, ¿qué tal? Hoy hace un día estupendo.',
    'it': 'Ciao, come stai? Oggi è una bellissima giornata.',
  };

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final selected = voices.any((v) => v.name == current) ? current : voices.first.name;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Voix des leçons', style: context.text.titleSmall!.copyWith(fontSize: 14)),
        const SizedBox(height: 3),
        Text('${voices.length} voix ${app.language.regionNote.toLowerCase()} · la meilleure est choisie automatiquement. Écoutez-les et gardez celle que vous préférez.', style: context.text.bodySmall),
        const SizedBox(height: 12),
        for (final v in voices)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: v.name == selected ? p.accentSoft : p.raised,
              borderRadius: BorderRadius.circular(Tokens.rMd),
              child: InkWell(
                borderRadius: BorderRadius.circular(Tokens.rMd),
                onTap: () async {
                  await app.set('voice_${app.lang}', v.name);
                  await app.speech.configure(app.language.locale, v.name);
                  app.speech.speak(samples[app.lang]!);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(Tokens.rMd),
                    border: Border.all(color: v.name == selected ? p.accent : p.line),
                  ),
                  child: Row(children: [
                    Icon(v.name == selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded, size: 18, color: v.name == selected ? p.accent : p.inkFaint),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(v.shortName, style: context.text.titleSmall),
                        Text('${v.region} · ${v.locale}', style: context.text.bodySmall),
                      ]),
                    ),
                    if (v.natural) ...[Tag('Naturelle', color: p.success, icon: Icons.auto_awesome_rounded), const SizedBox(width: 8)],
                    IconBtn(icon: Icons.play_arrow_rounded, tooltip: 'Écouter cette voix', onTap: () => app.speech.preview(v, samples[app.lang]!), size: 32),
                  ]),
                ),
              ),
            ),
          ),
      ]),
    );
  }
}
