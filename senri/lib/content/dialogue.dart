// Scripted conversation scenes (assets/content/dialogues.json, built by tools/dialogues.py).
import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

class DialogueChoice {
  DialogueChoice(this.text, this.fr, this.ok, this.why, this.reading);
  final String text, fr, why, reading;
  final bool ok;
}

class DialogueTurn {
  DialogueTurn.npc(this.text, this.fr, this.reading)
      : mine = false,
        task = '',
        choices = const [];
  DialogueTurn.me(this.task, this.choices)
      : mine = true,
        text = '',
        fr = '',
        reading = '';
  final bool mine;
  final String text, fr, reading, task;
  final List<DialogueChoice> choices;
}

class Expression {
  Expression(this.text, this.fr);
  final String text, fr;
}

class Dialogue {
  Dialogue({
    required this.id,
    required this.title,
    required this.level,
    required this.icon,
    required this.place,
    required this.partner,
    required this.culture,
    required this.turns,
    required this.expressions,
  });
  final String id, title, level, icon, place, partner, culture;
  final List<DialogueTurn> turns;
  final List<Expression> expressions;

  int get choiceCount => turns.where((t) => t.mine).length;

  factory Dialogue.fromJson(Map<String, dynamic> j) => Dialogue(
        id: j['id'] as String,
        title: j['title'] as String,
        level: j['level'] as String,
        icon: (j['icon'] ?? '') as String,
        place: (j['place'] ?? '') as String,
        partner: (j['partner'] ?? '') as String,
        culture: (j['culture'] ?? '') as String,
        turns: [
          for (final raw in j['turns'] as List)
            if ((raw as Map)['who'] == 'npc')
              DialogueTurn.npc(raw['text'] as String, (raw['fr'] ?? '') as String, (raw['reading'] ?? '') as String)
            else
              DialogueTurn.me(raw['task'] as String, [
                for (final c in raw['choices'] as List)
                  DialogueChoice(c['text'] as String, (c['fr'] ?? '') as String, c['ok'] == true, (c['why'] ?? '') as String, (c['reading'] ?? '') as String),
              ]),
        ],
        expressions: [for (final e in j['expressions'] as List) Expression(e['text'] as String, e['fr'] as String)],
      );

  static Map<String, List<Dialogue>> parse(String raw) {
    final j = jsonDecode(raw) as Map<String, dynamic>;
    return {for (final e in j.entries) e.key: [for (final d in e.value as List) Dialogue.fromJson(d as Map<String, dynamic>)]};
  }

  static Future<Map<String, List<Dialogue>>> load() async => parse(await rootBundle.loadString('assets/content/dialogues.json'));
}
