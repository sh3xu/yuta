import { createMouthEnvelope } from '../lip-sync/amplitude';
import { VoiceError, type SpeakOptions, type TTSEngine } from './types';

const RETRY_CODES = new Set(['synthesis-failed', 'synthesis-unavailable', 'network']);

export class WebSpeechTTS implements TTSEngine {
  voices(): SpeechSynthesisVoice[] {
    return window.speechSynthesis?.getVoices() ?? [];
  }

  stop(): void {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!window.speechSynthesis) {
      throw new VoiceError(
        'unsupported',
        'This WebView has no speechSynthesis API.',
        'Turn off Voice replies in Settings, or use a WebView with system voices.',
      );
    }

    await this.ready();
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
      await wait(80);
    }

    try {
      await this.utter(text, options, true);
    } catch (error) {
      const code = error instanceof VoiceError ? error.code : 'synthesis-failed';
      if (!RETRY_CODES.has(code)) throw error;
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      await wait(80);
      await this.utter(text, { ...options, voiceName: undefined }, false);
    }
  }

  private async ready(): Promise<void> {
    if (this.voices().length > 0) return;
    await Promise.race([
      new Promise<void>((resolve) => {
        const done = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', done);
          resolve();
        };
        window.speechSynthesis.addEventListener('voiceschanged', done);
        void window.speechSynthesis.getVoices();
      }),
      wait(800),
    ]);
  }

  private utter(text: string, options: SpeakOptions, usePreferredVoice: boolean): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = options.pitch ?? 1;
    utterance.rate = options.rate ?? 1;
    if (usePreferredVoice) {
      const voice = pickVoice(this.voices(), options.voiceName);
      if (voice) utterance.voice = voice;
    }

    const envelope = options.onMouth ? createMouthEnvelope(options.onMouth) : null;

    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        envelope?.start();
        options.onStart?.();
      };
      utterance.onend = () => {
        envelope?.stop();
        options.onEnd?.();
        resolve();
      };
      utterance.onerror = (event) => {
        envelope?.stop();
        options.onEnd?.();
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve();
          return;
        }
        reject(toVoiceError(event.error));
      };
      window.speechSynthesis.speak(utterance);
    });
  }
}

function pickVoice(voices: SpeechSynthesisVoice[], preferredName?: string): SpeechSynthesisVoice | undefined {
  if (preferredName) {
    const match = voices.find((voice) => voice.name === preferredName);
    if (match) return match;
  }
  const localEnglish = voices.find((voice) => voice.localService && /^en(-|$)/i.test(voice.lang));
  return (
    localEnglish ??
    voices.find((voice) => voice.localService) ??
    voices.find((voice) => /^en(-|$)/i.test(voice.lang))
  );
}

function toVoiceError(code: string): VoiceError {
  if (code === 'synthesis-failed') {
    return new VoiceError(
      code,
      'System TTS failed to play the reply.',
      'The text is still shown. WebView often hits this if cancel() races speak(), or no local Windows voice is installed. Retry used the default voice; you can also turn Voice replies off in Settings.',
    );
  }
  if (code === 'synthesis-unavailable') {
    return new VoiceError(
      code,
      'No speech engine is available in this WebView.',
      'Install a Windows speech voice, or disable Voice replies in Settings.',
    );
  }
  return new VoiceError(code, `TTS error: ${code}.`);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
