export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  voiceName?: string;
  onMouth?: (open: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export class VoiceError extends Error {
  readonly source = 'tts';

  constructor(
    readonly code: string,
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = 'VoiceError';
  }
}

export interface TTSEngine {
  speak(text: string, options?: SpeakOptions): Promise<void>;
  stop(): void;
  voices(): SpeechSynthesisVoice[];
}
