// Accent coach content (assets/content/accent.json, built by tools/accent.py).
import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

class AccentExample {
  AccentExample(this.text, this.hint, this.fr);
  final String text, hint, fr;
}

class AccentPoint {
  AccentPoint(this.id, this.title, this.tip, this.explain, this.examples);
  final String id, title, tip, explain;
  final List<AccentExample> examples;

  static Map<String, List<AccentPoint>> parse(String raw) {
    final j = jsonDecode(raw) as Map<String, dynamic>;
    return {
      for (final e in j.entries)
        e.key: [
          for (final p in e.value as List)
            AccentPoint(p['id'] as String, p['title'] as String, p['tip'] as String, p['explain'] as String, [
              for (final x in p['examples'] as List) AccentExample(x['text'] as String, (x['hint'] ?? '') as String, (x['fr'] ?? '') as String),
            ]),
        ],
    };
  }

  static Future<Map<String, List<AccentPoint>>> load() async => parse(await rootBundle.loadString('assets/content/accent.json'));
}
