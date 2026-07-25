"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { Mic, Square } from "lucide-react";

// Minimal shape of the Web Speech API — not in TypeScript's lib.dom yet.
type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionAlternativeList = { 0: SpeechRecognitionResultLike; isFinal: boolean };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionAlternativeList> };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function noopSubscribe() {
  return () => {};
}
function getSupported() {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
function getServerSupported() {
  return false;
}

export function VoiceInputButton({
  onResult,
  className,
}: {
  onResult: (text: string) => void;
  className?: string;
}) {
  const supported = useSyncExternalStore(noopSubscribe, getSupported, getServerSupported);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? "Spracheingabe stoppen" : "Spracheingabe starten"}
      title={listening ? "Aufnahme läuft — klicken zum Stoppen" : "Spracheingabe"}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        listening
          ? "animate-pulse bg-danger/15 text-danger"
          : "text-foreground-muted hover:bg-surface-muted"
      } ${className ?? ""}`}
    >
      {listening ? <Square size={16} /> : <Mic size={18} />}
    </button>
  );
}
