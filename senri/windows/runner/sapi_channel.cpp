// SAPI 5 bridge for Senri. Runs on the platform thread (COM is initialised as STA in main.cpp).
// Speech is asynchronous (SPF_ASYNC); Dart polls isSpeaking, so no callback threading is needed.
#include "sapi_channel.h"

#include <windows.h>
#include <sapi.h>

#include <flutter/method_channel.h>
#include <flutter/standard_method_codec.h>

#include <memory>
#include <string>

namespace {

std::wstring Widen(const std::string& s) {
  if (s.empty()) return std::wstring();
  int n = MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), nullptr, 0);
  std::wstring w(n, L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), w.data(), n);
  return w;
}

std::string Narrow(const wchar_t* w) {
  if (!w || !*w) return std::string();
  int n = WideCharToMultiByte(CP_UTF8, 0, w, -1, nullptr, 0, nullptr, nullptr);
  std::string s(n > 0 ? n - 1 : 0, '\0');
  if (n > 1) WideCharToMultiByte(CP_UTF8, 0, w, -1, s.data(), n, nullptr, nullptr);
  return s;
}

// "411;409" (hex LCIDs) -> "ja-JP"
std::string LocaleFromLangAttr(const wchar_t* attr) {
  if (!attr) return std::string();
  LCID lcid = static_cast<LCID>(wcstoul(attr, nullptr, 16));
  wchar_t name[LOCALE_NAME_MAX_LENGTH] = {0};
  if (LCIDToLocaleName(lcid, name, LOCALE_NAME_MAX_LENGTH, 0) > 0) return Narrow(name);
  return std::string();
}

ISpVoice* g_voice = nullptr;

ISpVoice* Voice() {
  if (!g_voice) {
    if (FAILED(CoCreateInstance(CLSID_SpVoice, nullptr, CLSCTX_ALL, IID_ISpVoice, reinterpret_cast<void**>(&g_voice)))) {
      g_voice = nullptr;
    }
  }
  return g_voice;
}

flutter::EncodableList ListVoices() {
  flutter::EncodableList out;
  ISpObjectTokenCategory* category = nullptr;
  if (FAILED(CoCreateInstance(CLSID_SpObjectTokenCategory, nullptr, CLSCTX_ALL, IID_ISpObjectTokenCategory,
                              reinterpret_cast<void**>(&category)))) {
    return out;
  }
  IEnumSpObjectTokens* tokens = nullptr;
  if (SUCCEEDED(category->SetId(SPCAT_VOICES, FALSE)) && SUCCEEDED(category->EnumTokens(nullptr, nullptr, &tokens))) {
    ISpObjectToken* token = nullptr;
    while (tokens->Next(1, &token, nullptr) == S_OK) {
      wchar_t* id = nullptr;
      wchar_t* desc = nullptr;
      wchar_t* lang = nullptr;
      token->GetId(&id);
      token->GetStringValue(nullptr, &desc);
      ISpDataKey* attrs = nullptr;
      if (SUCCEEDED(token->OpenKey(L"Attributes", &attrs))) {
        attrs->GetStringValue(L"Language", &lang);
        attrs->Release();
      }
      flutter::EncodableMap m;
      m[flutter::EncodableValue("id")] = flutter::EncodableValue(Narrow(id));
      m[flutter::EncodableValue("name")] = flutter::EncodableValue(Narrow(desc));
      m[flutter::EncodableValue("locale")] = flutter::EncodableValue(LocaleFromLangAttr(lang));
      out.push_back(flutter::EncodableValue(m));
      if (id) CoTaskMemFree(id);
      if (desc) CoTaskMemFree(desc);
      if (lang) CoTaskMemFree(lang);
      token->Release();
    }
    tokens->Release();
  }
  category->Release();
  return out;
}

bool Speak(const std::string& text, const std::string& id, int rate) {
  ISpVoice* v = Voice();
  if (!v) return false;
  ISpObjectToken* token = nullptr;
  if (SUCCEEDED(CoCreateInstance(CLSID_SpObjectToken, nullptr, CLSCTX_ALL, IID_ISpObjectToken, reinterpret_cast<void**>(&token)))) {
    std::wstring wid = Widen(id);
    if (SUCCEEDED(token->SetId(nullptr, wid.c_str(), FALSE))) v->SetVoice(token);
    token->Release();
  }
  v->SetRate(rate < -10 ? -10 : (rate > 10 ? 10 : rate));
  std::wstring w = Widen(text);
  return SUCCEEDED(v->Speak(w.c_str(), SPF_ASYNC | SPF_PURGEBEFORESPEAK | SPF_IS_NOT_XML, nullptr));
}

void Stop() {
  if (g_voice) g_voice->Speak(nullptr, SPF_ASYNC | SPF_PURGEBEFORESPEAK, nullptr);
}

bool IsSpeaking() {
  if (!g_voice) return false;
  SPVOICESTATUS status = {};
  if (FAILED(g_voice->GetStatus(&status, nullptr))) return false;
  return status.dwRunningState == SPRS_IS_SPEAKING;
}

const flutter::EncodableValue* Arg(const flutter::EncodableMap& m, const char* key) {
  auto it = m.find(flutter::EncodableValue(key));
  return it == m.end() ? nullptr : &it->second;
}

}  // namespace

void RegisterSapiChannel(flutter::BinaryMessenger* messenger) {
  static std::unique_ptr<flutter::MethodChannel<flutter::EncodableValue>> channel;
  channel = std::make_unique<flutter::MethodChannel<flutter::EncodableValue>>(
      messenger, "senri/sapi", &flutter::StandardMethodCodec::GetInstance());
  channel->SetMethodCallHandler([](const flutter::MethodCall<flutter::EncodableValue>& call,
                                   std::unique_ptr<flutter::MethodResult<flutter::EncodableValue>> result) {
    const std::string& method = call.method_name();
    if (method == "getVoices") {
      result->Success(flutter::EncodableValue(ListVoices()));
    } else if (method == "speak") {
      const auto* args = std::get_if<flutter::EncodableMap>(call.arguments());
      if (!args) {
        result->Error("bad_args", "Expected a map");
        return;
      }
      const auto* text = Arg(*args, "text");
      const auto* id = Arg(*args, "id");
      const auto* rate = Arg(*args, "rate");
      const std::string* t = text ? std::get_if<std::string>(text) : nullptr;
      const std::string* i = id ? std::get_if<std::string>(id) : nullptr;
      const int32_t* r = rate ? std::get_if<int32_t>(rate) : nullptr;
      result->Success(flutter::EncodableValue(Speak(t ? *t : std::string(), i ? *i : std::string(), r ? *r : 0)));
    } else if (method == "stop") {
      Stop();
      result->Success();
    } else if (method == "isSpeaking") {
      result->Success(flutter::EncodableValue(IsSpeaking()));
    } else {
      result->NotImplemented();
    }
  });
}
