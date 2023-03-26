// src/custom-types.d.ts

declare module 'global' {
  global {
    interface SpeechRecognitionEvent extends Event {
      resultIndex: number;
      results: SpeechRecognitionResultList;
    }
  }
}
