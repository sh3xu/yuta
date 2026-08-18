import { type CharacterState, clamp01, IDLE_CHARACTER_STATE } from '@yuta/shared';
import { Application, extensions } from 'pixi.js';
import { CLIPS, ClipPlayer } from '../motion';
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

  async mount(host: HTMLElement, modelUrl: string): Promise<void> {
    this.host = host;
    const { Live2DModel } = await loadEngine();
    const app = new Application();
    await app.init({
      backgroundAlpha: 0,
      antialias: true,
      preference: 'webgl',
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
    };
    this.lookX = lerp(this.lookX, this.targetLookX, 0.28);
    this.lookY = lerp(this.lookY, this.targetLookY, 0.28);
    applyLive2D(this.params, this.current, this.player.sample(now), now, {
      x: this.lookX,
      y: this.lookY,
    });
  }

  private consumeAction(state: CharacterState): void {
    if (state.actionToken === this.lastActionToken) return;
    this.lastActionToken = state.actionToken;
    const clip = CLIPS[state.action ?? 'idle'];
    if (!clip) {
      this.player.stop();
      return;
    }
    this.player.play(clip, state.actionIntensity);
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
