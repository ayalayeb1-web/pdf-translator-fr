#ifndef RUNNER_SAPI_CHANNEL_H_
#define RUNNER_SAPI_CHANNEL_H_

#include <flutter/binary_messenger.h>

// Registers the "senri/sapi" method channel: lists SAPI 5 voices (the classic Windows
// speech API, also used by adapters that expose Narrator's natural voices to programs)
// and speaks with them. Methods: getVoices, speak {text, id, rate}, stop, isSpeaking.
void RegisterSapiChannel(flutter::BinaryMessenger* messenger);

#endif  // RUNNER_SAPI_CHANNEL_H_
