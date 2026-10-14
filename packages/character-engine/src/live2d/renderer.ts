import { type CharacterState, clamp01, IDLE_CHARACTER_STATE } from '@yuta/shared';
import { Application, extensions, Rectangle } from 'pixi.js';
import {
  CLIPS,
  ClipPlayer,
  DANCE_LIBRARY,
  dancePlaybackRate,
  idleGapMs,
  SLOW_WAVE,
  SLOW_WAVE_RATE,
  selectIdleClip,
} from '../motion';
import {
  actionMotionRequest,
  type BodyMotion,
  bodyMotions,
  emotionBodyHints,
  loadMotionGroups,
  type MotionGroups,
  pickMotionIndex,
  withoutFoldedArmMotions,
} from '../motion/pack';
import type { CharacterRenderer } from '../types';
import { applyLive2D } from './controller';
import { PARAM } from './mappings';
import { type CoreModel, ParamTable } from './params';

type FocusController = {
  focus: (x: number, y: number, instant?: boolean) => void;
};

type InternalModel = {
  on?: (event: string, fn: () => void) => void;
  off?: (event: string, fn: () => void) => void;
  getIdSafe?: (id: string) => unknown;
  coreModel?: CoreModel;
  focusController?: FocusController;
  pose?: unknown;
  motionManager?: {
    isFinished?: () => boolean;
    groups?: { idle: string };
  };
  originalWidth?: number;
  originalHeight?: number;
  width?: number;
  height?: number;
};

type Live2DInstance = {
  automator?: { autoFocus: boolean };
  stopMotions?: () => void;
  motion?: (
    group: string,
    index?: number,
    priority?: number,
    options?: { loop?: boolean; onFinish?: () => void },
  ) => Promise<boolean>;
  anchor: { set: (x: number, y?: number) => void };
  position: { set: (x: number, y: number) => void };
  scale: { set: (x: number, y?: number) => void };
  internalModel?: InternalModel;
  destroy?: () => void;
};

const FIT_PADDING = 0.9;
const ALPHA_HIT = 20;

let pluginRegistered = false;

async function loadEngine() {
  const mod = await import('untitled-pixi-live2d-engine/cubism');
  if (!pluginRegistered) {
    extensions.add(mod.Live2DPlugin);
    pluginRegistered = true;
  }
  return mod;
}

export class Live2DRenderer implements CharacterRenderer {
  private app: Application | null = null;
  private model: Live2DInstance | null = null;
  private host: HTMLElement | null = null;
  private current: CharacterState = { ...IDLE_CHARACTER_STATE };
  private target: CharacterState = { ...IDLE_CHARACTER_STATE };
  private lastActionToken = -1;
  private lastDanceMove: CharacterState['danceMove'] = null;
  private dancing = false;
  private musicWaving = false;
  private gestureUntil = 0;
  private pending: CharacterState | null = null;
  private restX = 0;
  private restY = 0;
  private restScale = 1;
  private player = new ClipPlayer();
  private params: ParamTable | null = null;
  private motionGroups: MotionGroups = {};
  private bodyPlaylist: BodyMotion[] = [];
  private bodyCursor = 0;
  private usingPack = false;
  private packKey = '';
  private packPending = false;
  private lastPackIndex = new Map<string, number>();
  private lastTick = 0;
  private targetLookX = 0;
  private targetLookY = 0;
  private lookEnabled = true;
  private onBeforeModelUpdate: (() => void) | null = null;
  private onAfterMotionUpdate: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private destroyed = false;
  private nextIdleAt = 0;
  private lastIdleIndex: number | null = null;

  async mount(host: HTMLElement, modelUrl: string, motionFiles: string[] = []): Promise<void> {
    this.host = host;
    const { Live2DModel } = await loadEngine();
    const app = new Application();
    await app.init({
      backgroundAlpha: 0,
      antialias: true,
      preference: 'webgl',
      preserveDrawingBuffer: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      resizeTo: host,
    });
    if (this.destroyed) {
      app.destroy(true);
      return;
    }

    host.replaceChildren(app.canvas);
    app.canvas.style.display = 'block';
    app.canvas.style.width = '100%';
    app.canvas.style.height = '100%';
    app.canvas.style.maxWidth = '100%';
    app.canvas.style.maxHeight = '100%';
    app.canvas.style.pointerEvents = 'none';
    const source = await this.modelSource(modelUrl, motionFiles);
    const model = (await Live2DModel.from(source, { autoFocus: false })) as unknown as Live2DInstance;
    if (model.automator) model.automator.autoFocus = false;
    if (this.destroyed) {
      model.destroy?.();
      app.destroy(true);
      return;
    }

    model.anchor.set(0.5, 0.5);
    const internal = model.internalModel;
    if (this.usingPack && internal?.motionManager?.groups) {
      // NOTE: Cubism auto-starts group "Idle". The pack player owns playback.
      internal.motionManager.groups.idle = '';
    }
    app.stage.addChild(model as never);
    if (!this.usingPack) model.stopMotions?.();
    this.app = app;
    this.model = model;
    if (internal?.coreModel) {
      this.params = new ParamTable(internal.coreModel, (id) => internal.getIdSafe?.(id) ?? id);
    }
    this.onBeforeModelUpdate = () => this.tick();
    this.onAfterMotionUpdate = () => this.overlayPack();
    internal?.on?.('beforeModelUpdate', this.onBeforeModelUpdate);
    internal?.on?.('afterMotionUpdate', this.onAfterMotionUpdate);

    this.fit();
    requestAnimationFrame(() => this.fit());
    if (this.pending) {
      this.applyState(this.pending);
      this.pending = null;
    }

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(host);
  }

  applyState(state: CharacterState): void {
    this.target = state;
    if (!this.model) {
      this.pending = state;
      return;
    }
    this.consumeAction(state);
  }

  setLookEnabled(enabled: boolean): void {
    this.lookEnabled = enabled;
  }

  setLookTarget(x: number, y: number): void {
    const lookX = Number.isFinite(x) ? x : 0;
    const lookY = Number.isFinite(y) ? y : 0;
    this.targetLookX = Math.min(1, Math.max(-1, lookX));
    this.targetLookY = Math.min(1, Math.max(-1, lookY));
    this.pushFocus();
  }

  hitTest(clientX: number, clientY: number): boolean {
    const canvas = this.app?.canvas;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return false;
    return this.opaqueAt(x, y, rect.width, rect.height);
  }

  destroy(): void {
    this.destroyed = true;
    this.pending = null;
    this.resizeObserver?.disconnect();
    if (this.onBeforeModelUpdate) {
      this.model?.internalModel?.off?.('beforeModelUpdate', this.onBeforeModelUpdate);
    }
    if (this.onAfterMotionUpdate) {
      this.model?.internalModel?.off?.('afterMotionUpdate', this.onAfterMotionUpdate);
    }
    this.model?.destroy?.();
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.model = null;
    this.host = null;
    this.params = null;
    this.targetLookX = 0;
    this.targetLookY = 0;
  }

  private tick(): void {
    if (!this.params) return;
    const now = performance.now();
    const deltaMs = this.lastTick === 0 ? 16 : now - this.lastTick;
    this.lastTick = now;
    const t = clamp01(deltaMs / 120);
    this.current = {
      ...this.current,
      emotion: this.target.emotion,
      action: this.target.action,
      actionToken: this.target.actionToken,
      emotionIntensity: lerp(this.current.emotionIntensity, this.target.emotionIntensity, t),
      actionIntensity: lerp(this.current.actionIntensity, this.target.actionIntensity, t),
      speaking: this.target.speaking,
      mouthOpen: lerp(this.current.mouthOpen, this.target.mouthOpen, 0.35),
      dancing: this.target.dancing,
      danceMove: this.target.danceMove,
      musicEnergy: lerp(this.current.musicEnergy, this.target.musicEnergy, 0.32),
      bassEnergy: lerp(this.current.bassEnergy, this.target.bassEnergy, 0.38),
      beatPulse: lerp(this.current.beatPulse, this.target.beatPulse, 0.55),
      musicBpm: this.target.musicBpm,
      musicWave: this.target.musicWave,
    };
    if (this.usingPack) {
      this.syncPack();
      this.pushFocus();
      return;
    }
    this.syncMusicWave(now);
    const motion = this.player.sample(now);
    this.maybeIdle(now);
    applyLive2D(this.params, this.current, motion, now, { x: 0, y: 0 });
    this.pushFocus();
  }

  private pushFocus(): void {
    const focus = this.model?.internalModel?.focusController;
    if (!focus) return;
    if (!this.lookEnabled || this.packKey.startsWith('action:')) {
      focus.focus(0, 0);
      return;
    }
    focus.focus(this.targetLookX, this.targetLookY);
  }

  private consumeAction(state: CharacterState): void {
    if (this.usingPack) return;
    if (state.dancing && state.danceMove) {
      const def = DANCE_LIBRARY[state.danceMove];
      if (!def) return;
      const rate = dancePlaybackRate(def, state.musicBpm);
      const intensity = Math.max(state.actionIntensity, state.musicEnergy, 0.45);
      if (!this.dancing || this.lastDanceMove !== state.danceMove) {
        this.dancing = true;
        this.lastDanceMove = state.danceMove;
        this.nextIdleAt = 0;
        this.player.play(def.clip, intensity, performance.now(), { loop: true, rate });
        return;
      }
      this.player.setRate(rate);
      this.player.setIntensity(intensity);
      return;
    }

    if (this.dancing) {
      this.dancing = false;
      this.lastDanceMove = null;
      this.nextIdleAt = 0;
      this.player.stop();
    }

    if (state.actionToken === this.lastActionToken) return;
    this.lastActionToken = state.actionToken;
    this.nextIdleAt = 0;
    const clip = CLIPS[state.action ?? 'idle'];
    if (!clip) {
      this.gestureUntil = 0;
      this.player.stop();
      return;
    }
    this.gestureUntil = performance.now() + clip.duration;
    this.musicWaving = false;
    this.player.play(clip, state.actionIntensity);
  }

  private syncMusicWave(now: number): void {
    if (this.current.speaking || this.dancing) {
      if (this.musicWaving) {
        this.musicWaving = false;
        this.player.stop(now);
      }
      return;
    }
    if (now < this.gestureUntil) {
      this.musicWaving = false;
      return;
    }
    if (!this.current.musicWave) {
      if (this.musicWaving) {
        this.musicWaving = false;
        this.nextIdleAt = 0;
        this.player.stop(now);
      }
      return;
    }
    if (this.musicWaving) return;
    this.musicWaving = true;
    this.nextIdleAt = 0;
    this.player.play(SLOW_WAVE, 0.62, now, { loop: true, rate: SLOW_WAVE_RATE });
  }

  private maybeIdle(now: number): void {
    if (this.dancing || this.musicWaving || this.current.musicWave || this.current.speaking) {
      this.nextIdleAt = now + 900;
      return;
    }
    if (this.player.busy) return;
    if (this.nextIdleAt === 0) {
      this.nextIdleAt = now + idleGapMs();
      return;
    }
    if (now < this.nextIdleAt) return;
    const picked = selectIdleClip(this.lastIdleIndex);
    this.lastIdleIndex = picked.index;
    this.player.play(picked.clip, 0.48 + Math.random() * 0.28, now);
    this.nextIdleAt = now + picked.clip.duration + 280 + idleGapMs();
  }

  private async modelSource(modelUrl: string, motionFiles: string[]): Promise<string> {
    this.motionGroups = await loadMotionGroups(motionFiles, modelUrl);
    this.bodyPlaylist = bodyMotions(this.motionGroups);
    this.usingPack = Object.keys(this.motionGroups).length > 0;
    if (!this.usingPack) return modelUrl;
    const response = await fetch(modelUrl);
    const json = (await response.json()) as {
      url?: string;
      FileReferences?: {
        Motions?: Record<string, { File: string; FadeInTime: number; FadeOutTime: number }[]>;
      };
    };
    json.url = new URL(modelUrl, window.location.href).href;
    json.FileReferences = json.FileReferences ?? {};
    const motions = { ...(json.FileReferences.Motions ?? {}) };
    for (const [group, entries] of Object.entries(motions)) {
      motions[group] = withoutFoldedArmMotions(entries);
    }
    for (const [group, entries] of Object.entries(this.motionGroups)) {
      motions[group] = entries.map((entry) => ({
        File: entry.File,
        FadeInTime: entry.FadeInTime,
        FadeOutTime: entry.FadeOutTime,
      }));
    }
    json.FileReferences.Motions = motions;
    return json as unknown as string;
  }

  private syncPack(): void {
    if (this.packPending) return;
    const state = this.current;
    if (state.action && state.action !== 'idle' && state.actionToken !== this.lastActionToken) {
      this.lastActionToken = state.actionToken;
      const request = actionMotionRequest(state.action);
      this.playPack(`action:${state.actionToken}`, request.group, request.hint, false);
      return;
    }
    if (this.packKey.startsWith('action:')) {
      if (!this.motionFinished()) return;
      this.packKey = '';
    }
    if (state.speaking) {
      this.playLargest('talk', 'talk', true);
      return;
    }
    if (state.musicWave || state.dancing) {
      this.playSway();
      return;
    }
    if (this.packKey.startsWith('body:')) {
      if (!this.motionFinished()) return;
      this.packKey = '';
    }
    this.playBody();
  }

  private playPack(key: string, group: string, hint: string, loop: boolean): void {
    const resolved = this.motionGroups[group]?.length ? group : 'idle';
    const entries = this.motionGroups[resolved];
    if (!entries?.length) return;
    const index = pickMotionIndex(
      entries,
      resolved === group ? hint : '',
      this.lastPackIndex.get(resolved) ?? null,
    );
    if (index < 0) return;
    this.playAt(key, resolved, index, loop);
  }

  private playLargest(key: string, group: string, loop: boolean): void {
    const entries = this.motionGroups[group];
    if (!entries?.length) {
      this.playSway();
      return;
    }
    let index = 0;
    let best = -1;
    entries.forEach((entry, entryIndex) => {
      if (entry.body <= best) return;
      best = entry.body;
      index = entryIndex;
    });
    this.playAt(key, group, index, loop);
  }

  private playSway(): void {
    const sway = this.bodyPlaylist
      .filter((item) => item.file.toLowerCase().includes('sway'))
      .sort((a, b) => {
        const left = this.motionGroups[a.group]?.[a.index]?.body ?? 0;
        const right = this.motionGroups[b.group]?.[b.index]?.body ?? 0;
        return right - left;
      })[0];
    if (!sway) {
      this.playBody();
      return;
    }
    this.playAt('music', sway.group, sway.index, true);
  }

  private playBody(): void {
    if (this.bodyPlaylist.length === 0) {
      this.releaseToIdle();
      return;
    }
    const hints = emotionBodyHints(this.current.emotion);
    const preferred = hints.length
      ? this.bodyPlaylist.filter((item) =>
          hints.some((hint) => item.file.toLowerCase().includes(hint)),
        )
      : [];
    const pool = preferred.length > 0 ? preferred : this.bodyPlaylist;
    const item = pool[this.bodyCursor % pool.length];
    this.bodyCursor += 1;
    if (!item) return;
    this.playAt(
      `body:${item.group}:${item.index}:${this.bodyCursor}`,
      item.group,
      item.index,
      false,
    );
  }

  private playAt(key: string, group: string, index: number, loop: boolean): void {
    if (this.packPending || this.packKey === key || !this.model?.motion) return;
    this.packKey = key;
    this.packPending = true;
    this.lastPackIndex.set(group, index);
    // NOTE: this engine drops the motion onFinish option, so syncPack watches isFinished instead.
    void this.model.motion(group, index, 3, { loop }).then((started) => {
      this.packPending = false;
      if (!started && this.packKey === key) this.packKey = '';
    });
  }

  private motionFinished(): boolean {
    return this.model?.internalModel?.motionManager?.isFinished?.() ?? true;
  }

  private releaseToIdle(): void {
    if (this.packKey === 'idle') return;
    const looping = this.packKey === 'talk' || this.packKey === 'music';
    this.packKey = 'idle';
    if (looping) this.model?.stopMotions?.();
  }

  private overlayPack(): void {
    if (!this.usingPack || !this.params) return;
    if (this.current.speaking) this.params.set(PARAM.mouthOpen, this.current.mouthOpen);
  }

  private fit(): void {
    if (!this.app || !this.model || !this.host || this.destroyed) return;
    const viewW = this.app.screen.width || this.host.clientWidth;
    const viewH = this.app.screen.height || this.host.clientHeight;
    const { width, height } = this.nativeSize();
    if (viewW < 2 || viewH < 2 || width < 2 || height < 2) return;
    this.restScale = Math.min(viewW / width, viewH / height) * FIT_PADDING;
    this.restX = viewW / 2;
    this.restY = viewH * 0.5;
    this.model.scale.set(this.restScale);
    this.model.position.set(this.restX, this.restY);
  }

  private opaqueAt(cssX: number, cssY: number, cssW: number, cssH: number): boolean {
    const app = this.app;
    if (!app) return false;
    const stageX = cssX * (app.screen.width / Math.max(1, cssW));
    const stageY = cssY * (app.screen.height / Math.max(1, cssH));
    try {
      const extracted = app.renderer.extract.pixels({
        target: app.stage,
        frame: new Rectangle(stageX, stageY, 2, 2),
      });
      const pixels = extracted.pixels;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > ALPHA_HIT) return true;
      }
    } catch {
      // NOTE: some GPU paths refuse extract; fall through to the backbuffer.
    }
    const canvas = app.canvas;
    const gl = (app.renderer as { gl?: WebGLRenderingContext | WebGL2RenderingContext }).gl;
    if (!gl) return false;
    const px = Math.min(
      canvas.width - 1,
      Math.max(0, Math.floor(cssX * (canvas.width / Math.max(1, cssW)))),
    );
    const py = Math.min(
      canvas.height - 1,
      Math.max(0, Math.floor(cssY * (canvas.height / Math.max(1, cssH)))),
    );
    const pixel = new Uint8Array(4);
    gl.readPixels(px, canvas.height - py - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return pixel[3] > ALPHA_HIT;
  }

  private nativeSize(): { width: number; height: number } {
    const internal = this.model?.internalModel;
    const width = internal?.originalWidth || internal?.width || 2400;
    const height = internal?.originalHeight || internal?.height || 4800;
    return { width, height };
  }
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
