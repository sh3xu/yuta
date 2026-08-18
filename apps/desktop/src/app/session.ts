import { createAIProvider, Orchestrator } from '@yuta/ai';
import { BehaviorTracker } from '@yuta/behavior';
import { EMOTION_PROFILES, EmotionEngine } from '@yuta/emotion-engine';
import { MemoryService } from '@yuta/memory';
import {
  type ActionName,
  APP_ID,
  type CharacterState,
  type ChatTurn,
  IDLE_CHARACTER_STATE,
  type RetrievedMemory,
} from '@yuta/shared';
import { VoiceError, WebSpeechSTT, WebSpeechTTS } from '@yuta/voice';
import { BrowserFileSystem } from '../lib/browser-fs';
import { type AppSettings, loadSettings, saveSettings } from '../lib/settings';
import { isTauri, TauriFileSystem } from '../lib/tauri-fs';

export interface AppError {
  source: 'ai' | 'tts' | 'stt' | 'memory';
  message: string;
  detail?: string;
}

export interface DebugInfo {
  provider: string;
  loadedMemories: RetrievedMemory[];
  behavior: string;
  lastError?: AppError;
  llmAction?: string;
  plannedAction?: string;
  playedAction?: string;
}

export class CompanionSession {
  settings: AppSettings | null = null;
  orchestrator: Orchestrator | null = null;
  memory: MemoryService | null = null;
  behavior = new BehaviorTracker();
  emotion = new EmotionEngine();
  tts = new WebSpeechTTS();
  history: ChatTurn[] = [];
  characterState: CharacterState = { ...IDLE_CHARACTER_STATE };
  debug: DebugInfo = { provider: 'mock', loadedMemories: [], behavior: '' };

  async init(): Promise<AppSettings> {
    const settings = await loadSettings();
    this.configure(settings);
    return settings;
  }

  configure(settings: AppSettings): void {
    this.settings = settings;
    const fs = isTauri() ? new TauriFileSystem() : new BrowserFileSystem();
    this.memory = new MemoryService(fs, `${APP_ID}/memory`);
    const provider = createAIProvider({
      apiKey: settings.geminiApiKey,
      model: settings.geminiModel,
    });
    this.orchestrator = new Orchestrator({
      provider,
      memory: this.memory,
      behavior: this.behavior,
      emotion: this.emotion,
    });
    this.debug.provider = provider.id;
  }

  async persist(settings: AppSettings): Promise<void> {
    this.configure(settings);
    await saveSettings(settings);
  }

  preview(action: ActionName, intensity = 1): CharacterState {
    const characterState = this.emotion.apply({
      emotion: this.emotion.currentEmotion(),
      action: { name: action, intensity },
    });
    this.characterState = {
      ...characterState,
      speaking: this.characterState.speaking,
      mouthOpen: this.characterState.mouthOpen,
    };
    this.debug = {
      ...this.debug,
      llmAction: undefined,
      plannedAction: action,
      playedAction: action,
    };
    return this.characterState;
  }

  async send(userMessage: string, onState: (state: CharacterState) => void): Promise<string> {
    if (!this.orchestrator || !this.settings) {
      throw new Error('Session is not ready');
    }

    this.history.push({ role: 'user', content: userMessage });
    const { response, memories, characterState, plannedAction, llmAction } =
      await this.orchestrator.respond({
        companionName: this.settings.companionName,
        personality: this.settings.personality,
        userMessage,
        history: this.history,
      });

    this.history.push({ role: 'assistant', content: response.message });
    this.characterState = { ...characterState, speaking: this.settings.voiceEnabled };
    this.debug = {
      provider: this.debug.provider,
      loadedMemories: memories,
      behavior: this.behavior.getHint().summary,
      lastError: undefined,
      llmAction: llmAction?.name,
      plannedAction: plannedAction?.name,
      playedAction: this.characterState.action ?? undefined,
    };
    onState(this.characterState);

    if (this.settings.voiceEnabled) {
      const voice = EMOTION_PROFILES[response.emotion.name].voice;
      try {
        await this.tts.speak(response.message, {
          pitch: voice.pitch,
          rate: voice.speed,
          voiceName: this.settings.voiceName || undefined,
          onMouth: (mouthOpen) => {
            this.characterState = { ...this.characterState, speaking: true, mouthOpen };
            onState(this.characterState);
          },
          onEnd: () => {
            this.characterState = { ...this.characterState, speaking: false, mouthOpen: 0 };
            onState(this.characterState);
          },
        });
      } catch (error) {
        this.characterState = { ...this.characterState, speaking: false, mouthOpen: 0 };
        onState(this.characterState);
        this.debug.lastError = toAppError('tts', error);
        console.error('[yuta:tts]', this.debug.lastError);
      }
    }

    return response.message;
  }

  listen(
    onText: (text: string, isFinal: boolean) => void,
    onError: (message: string) => void,
  ): WebSpeechSTT {
    const stt = new WebSpeechSTT({ onResult: onText, onError });
    void stt.start();
    return stt;
  }
}

export const session = new CompanionSession();

function toAppError(source: AppError['source'], error: unknown): AppError {
  if (error instanceof VoiceError) {
    return {
      source,
      message: error.message,
      detail: [error.code, error.hint].filter(Boolean).join(' — '),
    };
  }
  if (error instanceof Error) {
    return { source, message: error.message, detail: error.stack };
  }
  return { source, message: String(error) };
}
