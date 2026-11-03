// "Mon vocabulaire": words the learner saved (right-click → add, from any lesson),
// plus every word of the lessons they completed, with their review status.
import 'package:flutter/material.dart';

import '../../content/models.dart';
import '../../core/app_state.dart';
import '../theme.dart';
import '../widgets.dart';

enum _Filter { saved, learned, weak }

class VocabularyScreen extends StatefulWidget {
  const VocabularyScreen({super.key});
  @override
  State<VocabularyScreen> createState() => _VocabularyScreenState();
}

class _VocabularyScreenState extends State<VocabularyScreen> {
  _Filter filter = _Filter.saved;
  final search = TextEditingController();

  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final cardsById = {for (final c in app.cards) c.itemId: c};
    final items = app.course.items;
    List<(Item, String)> rows;
    switch (filter) {
      case _Filter.saved:
        rows = [for (final v in app.vocab) (items.values.where((i) => i.term == v.term).firstOrNull ?? Item(id: 'word:${v.term}', term: v.term, reading: v.reading, meaning: v.meaning), v.source)];
      case _Filter.learned:
        rows = [
          for (final c in app.cards)
            if (items[c.itemId] != null) (items[c.itemId]!, ''),
        ];
      case _Filter.weak:
        rows = [
          for (final c in app.weakCards)
            if (items[c.itemId] != null) (items[c.itemId]!, ''),
        ];
    }
    final q = search.text.trim().toLowerCase();
    if (q.isNotEmpty) {
      rows = rows.where((r) => r.$1.term.toLowerCase().contains(q) || r.$1.meaning.toLowerCase().contains(q) || r.$1.hint.toLowerCase().contains(q)).toList();
    }

    String status(Item it) {
      final c = cardsById[it.id];
      if (c == null) return 'Pas encore révisé';
      if (c.mastered) return 'Maîtrisé';
      if (c.weak) return 'Fragile';
      return 'En cours';
    }

    Color statusColor(String s) => switch (s) { 'Maîtrisé' => p.success, 'Fragile' => p.danger, 'En cours' => p.accent, _ => p.inkFaint };

    return PageFrame(
      eyebrow: '${app.language.name} · ${app.vocab.length} mot${app.vocab.length > 1 ? 's' : ''} enregistré${app.vocab.length > 1 ? 's' : ''}',
      title: 'Mon vocabulaire',
      subtitle: 'Faites un clic droit sur n’importe quel mot d’une leçon pour l’ajouter ici.',
      children: [
        Row(children: [
          SegmentedButton<_Filter>(
            segments: [
              ButtonSegment(value: _Filter.saved, label: Text('Enregistrés (${app.vocab.length})'), icon: const Icon(Icons.bookmark_rounded, size: 16)),
              ButtonSegment(value: _Filter.learned, label: Text('Étudiés (${app.cards.length})'), icon: const Icon(Icons.school_rounded, size: 16)),
              ButtonSegment(value: _Filter.weak, label: Text('Fragiles (${app.weakCards.length})'), icon: const Icon(Icons.warning_amber_rounded, size: 16)),
            ],
            selected: {filter},
            onSelectionChanged: (s) => setState(() => filter = s.first),
            showSelectedIcon: false,
          ),
          const Spacer(),
          SizedBox(
            width: 300,
            child: TextField(
              controller: search,
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search_rounded, size: 20), hintText: 'Filtrer…', isDense: true),
            ),
          ),
        ]),
        const SizedBox(height: 20),
        if (rows.isEmpty)
          Panel(
            padding: const EdgeInsets.all(40),
            child: Column(children: [
              Icon(filter == _Filter.saved ? Icons.bookmark_add_outlined : Icons.inbox_rounded, size: 40, color: p.inkFaint),
              const SizedBox(height: 14),
              Text(
                q.isNotEmpty
                    ? 'Aucun mot ne correspond à « $q ».'
                    : filter == _Filter.saved
                        ? 'Aucun mot enregistré pour l’instant.\nDans une leçon, faites un clic droit sur un mot → « Ajouter à mon vocabulaire ».'
                        : filter == _Filter.weak
                            ? 'Aucun mot fragile. Les mots ratés plusieurs fois apparaîtront ici.'
                            : 'Terminez une leçon pour voir ses mots ici.',
                textAlign: TextAlign.center,
                style: context.text.bodyMedium!.copyWith(color: p.inkSoft),
              ),
            ]),
          )
        else
          Panel(
            padding: EdgeInsets.zero,
            child: Column(children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(22, 14, 22, 12),
                child: Row(children: [
                  const Expanded(flex: 3, child: Eyebrow('Mot')),
                  Expanded(flex: 3, child: Eyebrow(app.lang == 'ja' ? 'Lecture' : 'Prononciation')),
                  const Expanded(flex: 4, child: Eyebrow('Sens')),
                  const Expanded(flex: 2, child: Eyebrow('Statut')),
                  const SizedBox(width: 92),
                ]),
              ),
              Divider(color: p.line),
              for (final (it, source) in rows)
                WordTarget(
                  text: it.term,
                  item: it,
                  source: source,
                  child: _VocabRow(item: it, source: source, status: status(it), color: statusColor(status(it))),
                ),
            ]),
          ),
      ],
    );
  }
}

class _VocabRow extends StatefulWidget {
  const _VocabRow({required this.item, required this.source, required this.status, required this.color});
  final Item item;
  final String source, status;
  final Color color;
  @override
  State<_VocabRow> createState() => _VocabRowState();
}

class _VocabRowState extends State<_VocabRow> {
  bool hover = false;
  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    final p = context.pal;
    final it = widget.item;
    return MouseRegion(
      onEnter: (_) => setState(() => hover = true),
      onExit: (_) => setState(() => hover = false),
      child: AnimatedContainer(
        duration: Tokens.fast,
        color: hover ? p.accentSoft.withValues(alpha: 0.6) : Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
        child: Row(children: [
          Expanded(flex: 3, child: Text(it.term, style: context.text.titleLarge!.copyWith(fontFamily: Tokens.display))),
          Expanded(flex: 3, child: Text(it.hint, style: context.text.bodyMedium!.copyWith(color: p.inkSoft))),
          Expanded(
            flex: 4,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(it.meaning, style: context.text.bodyMedium),
              if (widget.source.isNotEmpty) Text(widget.source, style: context.text.bodySmall),
            ]),
          ),
          Expanded(flex: 2, child: Align(alignment: Alignment.centerLeft, child: Tag(widget.status, color: widget.color))),
          SizedBox(
            width: 92,
            child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
              IconBtn(icon: Icons.volume_up_rounded, tooltip: 'Écouter', onTap: () => app.speech.speak(it.term), size: 32),
              IconBtn(
                icon: app.inVocab(it.term) ? Icons.bookmark_rounded : Icons.bookmark_add_outlined,
                tooltip: app.inVocab(it.term) ? 'Retirer de mon vocabulaire' : 'Ajouter à mon vocabulaire',
                onTap: () => app.toggleVocab(it, widget.source.isEmpty ? 'Mon vocabulaire' : widget.source),
                size: 32,
                color: app.inVocab(it.term) ? p.accent : null,
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}
