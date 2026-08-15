"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  const pool = english.length ? english : voices;
  if (!pool.length) return null;
  return pool.find((voice) => voice.localService) ?? pool.find((voice) => voice.default) ?? pool[0];
}

export function useQuestionSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setSupported(true);

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current = pickEnglishVoice(voices);
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      if (speakTimerRef.current) window.clearTimeout(speakTimerRef.current);
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, []);

  const cancel = useCallback(() => {
    if (speakTimerRef.current) {
      window.clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    utteranceRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string | null | undefined) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const trimmed = text?.trim();
      if (!trimmed) return;

      cancel();

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current?.lang ?? "en-US";
      utterance.onstart = () => {
        if (utteranceRef.current === utterance) setIsSpeaking(true);
      };
      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setIsSpeaking(false);
        }
      };
      utterance.onerror = () => {
        if (utteranceRef.current === utterance) {
          utteranceRef.current = null;
          setIsSpeaking(false);
        }
      };
      utteranceRef.current = utterance;
      speakTimerRef.current = window.setTimeout(() => {
        speakTimerRef.current = null;
        window.speechSynthesis.speak(utterance);
      }, 50);
    },
    [cancel],
  );

  return { speak, cancel, isSpeaking, supported };
}
