import { createAIProvider, Orchestrator } from '@yuta/ai';
import { BehaviorTracker } from '@yuta/behavior';
import { EMOTION_PROFILES, EmotionEngine } from '@yuta/emotion-engine';
import { MemoryService } from '@yuta/memory';
import {
  type ActionName,
  APP_ID,
  type CharacterState,
  type ChatTurn,
  type EmotionName,
  IDLE_CHARACTER_STATE,
  type RetrievedMemory,
} from '@yuta/shared';
import { VoiceError, WebSpeechSTT, WebSpeechTTS } from '@yuta/voice';
import { type DesktopActivity, subscribeDesktopActivity } from '../lib/activity';
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
  idleMs = 0;
  private onState: ((state: CharacterState) => void) | null = null;
  private mediaPlaying = false;
  private loopbackPlaying = false;
  private stopAudio: (() => void) | null = null;
  private stopActivity: (() => void) | null = null;
  private gate: Promise<void> = Promise.resolve();

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

  async startActivity(): Promise<void> {
    this.stopActivity?.();
    this.stopActivity = await subscribeDesktopActivity((activity) => this.applyActivity(activity));
  }

  playAction(action: ActionName, intensity = 0.85): void {
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

    return this.lock(() => this.reply(userMessage, onState, onReply));
  }

  async aside(
    onState: (state: CharacterState) => void,
    onReply?: (text: string) => void,
  ): Promise<string> {
    if (!this.orchestrator || !this.settings) {
      throw new Error('Session is not ready');
    }
    return this.lock(() => this.speakAside(onState, onReply));
  }

  private async reply(
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
      await this.speak(response.message, response.emotion.name, onState);
    }

    return response.message;
  }

  private async speakAside(
    onState: (state: CharacterState) => void,
    onReply?: (text: string) => void,
  ): Promise<string> {
    if (!this.orchestrator || !this.settings) {
      throw new Error('Session is not ready');
    }

    const { response, memories, characterState, plannedAction, llmAction } =
      await this.orchestrator.aside({
        companionName: this.settings.companionName,
        personality: this.settings.personality,
        history: this.history,
      });

    const message = response.message.trim();
    if (!message) return '';

    this.history.push({ role: 'assistant', content: message });
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
    onReply?.(message);

    if (this.settings.voiceEnabled) {
      await this.speak(message, response.emotion.name, onState);
    }
    return message;
  }

  private async speak(
    message: string,
    emotion: EmotionName,
    onState: (state: CharacterState) => void,
  ): Promise<void> {
    if (!this.settings) return;
    const voice = EMOTION_PROFILES[emotion].voice;
    try {
      await this.tts.speak(message, {
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

  private lock<T>(job: () => Promise<T>): Promise<T> {
    const previous = this.gate;
    let release: () => void = () => undefined;
    this.gate = new Promise((resolve) => {
      release = resolve;
    });
    return previous.then(job).finally(release);
  }

  listen(
    onText: (text: string, isFinal: boolean) => void,
    onError: (message: string) => void,
  ): WebSpeechSTT {
    const stt = new WebSpeechSTT({ onResult: onText, onError });
    void stt.start();
    return stt;
  }

  private applyActivity(activity: DesktopActivity): void {
    this.idleMs = activity.idleMs;
    if (this.mediaPlaying === activity.musicPlaying) return;
    this.mediaPlaying = activity.musicPlaying;
    this.publishMusicWave();
  }

  private applySystemAudio(frame: SystemAudioFrame): void {
    this.loopbackPlaying = frame.playing;
    const musicWave = this.loopbackPlaying || this.mediaPlaying;
    if (!frame.playing) {
      const alreadyQuiet =
        this.characterState.musicWave === musicWave &&
        this.characterState.musicEnergy === 0 &&
        !this.characterState.dancing;
      if (alreadyQuiet) return;
      this.characterState = {
        ...this.characterState,
        dancing: false,
        danceMove: null,
        musicEnergy: 0,
        bassEnergy: 0,
        beatPulse: 0,
        musicBpm: 0,
        musicWave,
      };
      this.onState?.(this.characterState);
      return;
    }

    this.characterState = {
      ...this.characterState,
      dancing: false,
      danceMove: null,
      musicWave: true,
      musicEnergy: frame.energy,
      bassEnergy: frame.bass,
      beatPulse: frame.beatPulse,
      musicBpm: frame.bpm,
    };
    this.onState?.(this.characterState);
  }

  private publishMusicWave(): void {
    const musicWave = this.mediaPlaying || this.loopbackPlaying;
    if (this.characterState.musicWave === musicWave) return;
    this.characterState = { ...this.characterState, musicWave };
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
    musicWave: live.musicWave,
    musicEnergy: live.musicEnergy,
    bassEnergy: live.bassEnergy,
    beatPulse: live.beatPulse,
    musicBpm: live.musicBpm,
    ...(live.dancing
      ? {
          dancing: true,
          danceMove: live.danceMove,
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
