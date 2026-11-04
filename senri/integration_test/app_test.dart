import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:senri/platform/desktop.dart';

import 'flow.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('real window: onboarding → lesson → sections', (t) async {
    final desktop = await Desktop.init();
    final state = await runFlow(t, desktop: desktop);
    expect(state.completed, isNotEmpty);
    if (Platform.isWindows) {
      // classic SAPI voices (and Narrator natural voices exposed through an adapter) are listed and playable
      final sapi = state.speech.sapiVoices;
      // ignore: avoid_print
      print('SAPI voices: ${sapi.map((v) => '${v.name} [${v.locale}]').join(', ')}');
      if (sapi.isNotEmpty) await t.runAsync(() => state.speech.preview(sapi.first, 'Hello from Senri.'));
    }
    // Written only when every expectation above passed (read by the Windows CI job,
    // because flutter_tools can fail its own temp-folder cleanup after a passing test).
    final marker = Platform.environment['SENRI_TEST_OK'];
    if (marker != null) File(marker).writeAsStringSync('passed ${DateTime.now().toIso8601String()}');
  });
}
