import { type CharacterState, clamp01, IDLE_CHARACTER_STATE } from '@yuta/shared';
import { Application, extensions, Rectangle } from 'pixi.js';
import { CLIPS, ClipPlayer, DANCE_LIBRARY, dancePlaybackRate, idleGapMs, selectIdleClip } from '../motion';
import type { CharacterRenderer } from '../types';
import { applyLive2D } from './controller';
import { type CoreModel, ParamTable } from './params';

type InternalModel = {
  on?: (event: string, fn: () => void) => void;
  off?: (event: string, fn: () => void) => void;
  getIdSafe?: (id: string) => unknown;
  coreModel?: CoreModel;
  pose?: unknown;
  originalWidth?: number;
  originalHeight?: number;
  width?: number;
  height?: number;
};

type Live2DInstance = {
  stopMotions?: () => void;
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
  private pending: CharacterState | null = null;
  private restX = 0;
  private restY = 0;
  private restScale = 1;
  private player = new ClipPlayer();
  private params: ParamTable | null = null;
  private lastTick = 0;
  private lookX = 0;
  private lookY = 0;
  private targetLookX = 0;
  private targetLookY = 0;
  private onBeforeModelUpdate: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private destroyed = false;
  private nextIdleAt = 0;
  private lastIdleIndex: number | null = null;

  async mount(host: HTMLElement, modelUrl: string): Promise<void> {
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
    const model = (await Live2DModel.from(modelUrl)) as unknown as Live2DInstance;
    if (this.destroyed) {
      model.destroy?.();
      app.destroy(true);
      return;
    }

    model.anchor.set(0.5, 0.5);
    app.stage.addChild(model as never);
    model.stopMotions?.();
    this.app = app;
    this.model = model;

    const internal = model.internalModel;
    if (internal) internal.pose = null;
    if (internal?.coreModel) {
      this.params = new ParamTable(internal.coreModel, (id) => internal.getIdSafe?.(id) ?? id);
    }
    this.onBeforeModelUpdate = () => this.tick();
    internal?.on?.('beforeModelUpdate', this.onBeforeModelUpdate);

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

  setLookTarget(x: number, y: number): void {
    this.targetLookX = Math.min(1, Math.max(-1, x));
    this.targetLookY = Math.min(1, Math.max(-1, y));
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
    this.model?.destroy?.();
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.model = null;
    this.host = null;
    this.params = null;
    this.lookX = 0;
    this.lookY = 0;
    this.targetLookX = 0;
    this.targetLookY = 0;
  }

  private tick(): void {
    if (!this.params) return;
    if (this.model?.internalModel) this.model.internalModel.pose = null;
    const now = performance.now();
    const deltaMs = this.lastTick === 0 ? 16 : now - this.lastTick;
    this.lastTick = now;
    const t = clamp01(deltaMs / 120);
    this.current = {
      ...this.current,
      emotion: this.target.emotion,
      action: this.target.action,
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
    };
    this.lookX = lerp(this.lookX, this.targetLookX, 0.28);
    this.lookY = lerp(this.lookY, this.targetLookY, 0.28);
    const motion = this.player.sample(now);
    this.maybeIdle(now);
    applyLive2D(this.params, this.current, motion, now, {
      x: this.lookX,
      y: this.lookY,
    });
  }

  private consumeAction(state: CharacterState): void {
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
      this.player.stop();
      return;
    }
    this.player.play(clip, state.actionIntensity);
  }

  private maybeIdle(now: number): void {
    if (this.dancing || this.current.speaking) {
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
      } as never) as Uint8Array | Uint8ClampedArray | { pixels?: Uint8Array };
      const pixels = extracted instanceof Uint8Array || extracted instanceof Uint8ClampedArray
        ? extracted
        : (extracted.pixels ?? new Uint8Array());
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] > ALPHA_HIT) return true;
      }
    } catch {
      // NOTE: some GPU paths refuse extract; fall through to the backbuffer.
    }
    const canvas = app.canvas;
    const gl = (app.renderer as { gl?: WebGLRenderingContext | WebGL2RenderingContext }).gl;
    if (!gl) return false;
    const px = Math.min(canvas.width - 1, Math.max(0, Math.floor(cssX * (canvas.width / Math.max(1, cssW)))));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.floor(cssY * (canvas.height / Math.max(1, cssH)))));
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
