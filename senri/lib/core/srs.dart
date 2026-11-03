// Spaced repetition: a Leitner scheduler that reacts to mistakes.
//
//  * A correct answer moves the card up one box; the next review is further away.
//  * A wrong answer sends it back to box 0 and brings it back within 10 minutes,
//    and counts a lapse. Cards with several lapses are reviewed first ("points faibles").
class SrsCard {
  SrsCard({required this.itemId, required this.box, required this.due, this.reps = 0, this.lapses = 0, this.last});
  final String itemId;
  final int box;
  final DateTime due;
  final int reps, lapses;
  final DateTime? last;

  factory SrsCard.fresh(String id, DateTime now) => SrsCard(itemId: id, box: 0, due: now);

  bool get mastered => box >= Srs.masteredBox;
  bool get weak => lapses >= 2 && box < 3;
}

class Srs {
  /// Interval after reaching each box.
  static const intervals = [
    Duration(minutes: 10),
    Duration(days: 1),
    Duration(days: 3),
    Duration(days: 7),
    Duration(days: 16),
    Duration(days: 35),
    Duration(days: 90),
  ];
  static const masteredBox = 4;
  static const relearn = Duration(minutes: 10);

  static SrsCard grade(SrsCard c, bool correct, DateTime now) {
    if (correct) {
      final box = (c.box + 1).clamp(0, intervals.length - 1);
      return SrsCard(itemId: c.itemId, box: box, due: now.add(intervals[box]), reps: c.reps + 1, lapses: c.lapses, last: now);
    }
    return SrsCard(itemId: c.itemId, box: 0, due: now.add(relearn), reps: c.reps + 1, lapses: c.lapses + 1, last: now);
  }
}
