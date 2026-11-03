import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:voya/platform/desktop.dart';

import '../integration_test/flow.dart';

void main() {
  testWidgets('onboarding → first lesson → all sections (headless)', (t) async {
    t.view.physicalSize = const Size(1440, 900);
    t.view.devicePixelRatio = 1;
    addTearDown(t.view.reset);
    final desktop = await Desktop.init(headless: true);
    final state = await runFlow(t, desktop: desktop);
    expect(state.onboarded, isTrue);
  });
}
