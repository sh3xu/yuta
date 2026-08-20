import { createAIProvider, Orchestrator } from '@yuta/ai';
import { BehaviorTracker } from '@yuta/behavior';
import { selectDanceMove } from '@yuta/character-engine';
import { EMOTION_PROFILES, EmotionEngine } from '@yuta/emotion-engine';
import { MemoryService } from '@yuta/memory';
import {
  APP_ID,
  type ActionName,
  type CharacterState,
  type ChatTurn,
  type DanceMoveName,
  IDLE_CHARACTER_STATE,
  type RetrievedMemory,
} from '@yuta/shared';
import { VoiceError, WebSpeechSTT, WebSpeechTTS } from '@yuta/voice';
import { BrowserFileSystem } from '../lib/browser-fs';
import { type AppSettings, loadSettings, saveSettings } from '../lib/settings';
import { type SystemAudioFrame, subscribeSystemAudio } from '../lib/system-audio';
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
  private onState: ((state: CharacterState) => void) | null = null;
  private danceMove: DanceMoveName | null = null;
  private lastBeatIndex = -1;
  private stopAudio: (() => void) | null = null;

  setStateHandler(handler: ((state: CharacterState) => void) | null): void {
    this.onState = handler;
  }

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

  async startSystemAudio(): Promise<void> {
    this.stopAudio?.();
    this.stopAudio = await subscribeSystemAudio((frame) => this.applySystemAudio(frame));
  }

  playAction(action: ActionName, intensity = 0.85): void {
    if (this.characterState.dancing || this.characterState.speaking) return;
    this.characterState = {
      ...this.characterState,
      action,
      actionIntensity: intensity,
      actionToken: this.characterState.actionToken + 1,
      emotion: action === 'wave' ? 'happy' : this.characterState.emotion,
      emotionIntensity:
        action === 'wave'
          ? Math.max(this.characterState.emotionIntensity, 0.6)
          : this.characterState.emotionIntensity,
    };
    this.onState?.(this.characterState);
  }

  async send(
    userMessage: string,
    onState: (state: CharacterState) => void,
    onReply?: (text: string) => void,
  ): Promise<string> {
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
    this.characterState = mergeDanceState(characterState, this.characterState, {
      speaking: this.settings.voiceEnabled,
    });
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
    onReply?.(response.message);

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

  private applySystemAudio(frame: SystemAudioFrame): void {
    if (this.characterState.speaking) return;
    if (!frame.playing) {
      if (!this.characterState.dancing) return;
      this.danceMove = null;
      this.lastBeatIndex = -1;
      this.characterState = {
        ...this.characterState,
        dancing: false,
        danceMove: null,
        musicEnergy: 0,
        bassEnergy: 0,
        beatPulse: 0,
        musicBpm: 0,
        action: 'wave',
        actionIntensity: 0.8,
        actionToken: this.characterState.actionToken + 1,
        emotion: 'happy',
      };
      this.onState?.(this.characterState);
      return;
    }

    const starting = !this.characterState.dancing;
    if (frame.beatIndex !== this.lastBeatIndex && frame.beatIndex % 2 === 0) {
      this.lastBeatIndex = frame.beatIndex;
      this.danceMove = selectDanceMove({
        energy: frame.energy,
        bass: frame.bass,
        mid: frame.mid,
        treble: frame.treble,
        beatPulse: frame.beatPulse,
        previous: this.danceMove,
      });
    } else if (!this.danceMove) {
      this.danceMove = selectDanceMove({
        energy: frame.energy,
        bass: frame.bass,
        mid: frame.mid,
        treble: frame.treble,
        beatPulse: frame.beatPulse,
        previous: null,
      });
    }

    this.characterState = {
      ...this.characterState,
      dancing: true,
      danceMove: this.danceMove,
      musicEnergy: frame.energy,
      bassEnergy: frame.bass,
      beatPulse: frame.beatPulse,
      musicBpm: frame.bpm,
      action: 'dance',
      actionIntensity: Math.max(0.5, frame.energy),
      emotion: starting ? 'happy' : this.characterState.emotion,
      emotionIntensity: starting ? 0.75 : this.characterState.emotionIntensity,
    };
    this.onState?.(this.characterState);
  }
}

export const session = new CompanionSession();

function mergeDanceState(
  next: CharacterState,
  live: CharacterState,
  extras: Partial<CharacterState>,
): CharacterState {
  return {
    ...next,
    ...extras,
    ...(live.dancing
      ? {
          dancing: true,
          danceMove: live.danceMove,
          musicEnergy: live.musicEnergy,
          bassEnergy: live.bassEnergy,
          beatPulse: live.beatPulse,
          musicBpm: live.musicBpm,
          action: 'dance' as const,
          actionIntensity: live.actionIntensity,
        }
      : {}),
  };
}

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
