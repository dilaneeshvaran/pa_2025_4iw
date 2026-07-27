import { ref, onScopeDispose } from "vue";

/**
 * Accessibility: speech-to-text (dictation) and text-to-speech (read aloud)
 * for Medibot, using the browser's built-in Web Speech API. No network / key
 * required. Everything degrades gracefully where unsupported.
 */
export const useMedibotSpeech = () => {
  const isListening = ref(false);
  const isSpeaking = ref(false);
  const interimTranscript = ref("");

  const sttSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const ttsSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;

  function startListening(onResult: (finalText: string) => void) {
    if (!sttSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = false;

    interimTranscript.value = "";
    isListening.value = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      interimTranscript.value = interim;
      if (finalText) {
        onResult(finalText.trim());
        interimTranscript.value = "";
      }
    };
    recognition.onerror = () => {
      isListening.value = false;
    };
    recognition.onend = () => {
      isListening.value = false;
      interimTranscript.value = "";
    };

    try {
      recognition.start();
    } catch {
      isListening.value = false;
    }
  }

  function stopListening() {
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        /* noop */
      }
    }
    isListening.value = false;
  }

  function speak(text: string) {
    if (!ttsSupported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      // strip emojis / markdown-ish punctuation for cleaner speech
      text.replace(/[*_#`]/g, "").replace(/\s+/g, " ").trim(),
    );
    utterance.lang = "fr-FR";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => (isSpeaking.value = true);
    utterance.onend = () => (isSpeaking.value = false);
    utterance.onerror = () => (isSpeaking.value = false);
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (ttsSupported) window.speechSynthesis.cancel();
    isSpeaking.value = false;
  }

  onScopeDispose(() => {
    stopListening();
    stopSpeaking();
  });

  return {
    isListening,
    isSpeaking,
    interimTranscript,
    sttSupported,
    ttsSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};
