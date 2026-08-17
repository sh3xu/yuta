export interface STTEngine {
  start(): Promise<void>;
  stop(): void;
}

interface STTOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const holder = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return holder.SpeechRecognition ?? holder.webkitSpeechRecognition ?? null;
}

export class WebSpeechSTT implements STTEngine {
  private recognition: SpeechRecognitionLike | null = null;

  constructor(private readonly options: STTOptions) {}

  async start(): Promise<void> {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      this.options.onError?.('Speech recognition is not available in this WebView.');
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result?.[0]?.transcript ?? '';
      this.options.onResult(transcript, Boolean(result?.isFinal));
    };
    recognition.onerror = (event) => this.options.onError?.(event.error);
    recognition.start();
    this.recognition = recognition;
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }
}
