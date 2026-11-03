import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:voya/platform/desktop.dart';

import 'flow.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('real window: onboarding → lesson → sections', (t) async {
    final desktop = await Desktop.init();
    final state = await runFlow(t, desktop: desktop);
    expect(state.completed, isNotEmpty);
  });
}
