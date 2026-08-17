import { Application, extensions, Ticker } from 'pixi.js';
import { IDLE_CHARACTER_STATE, clamp01, type CharacterState } from '@yuta/shared';
import { actionMotion, emotionParams, PARAM } from './mappings';
import type { CharacterRenderer } from '../types';

type CoreModel = {
  setParameterValueById?: (id: string, value: number) => void;
  addParameterValueById?: (id: string, value: number) => void;
};

type Live2DInstance = {
  motion: (group: string, index?: number) => Promise<unknown> | unknown;
  anchor: { set: (x: number, y?: number) => void };
  position: { set: (x: number, y: number) => void };
  scale: { set: (x: number, y?: number) => void };
  width: number;
  height: number;
  internalModel?: {
    coreModel?: CoreModel;
    originalWidth?: number;
    originalHeight?: number;
    width?: number;
    height?: number;
  };
  destroy?: () => void;
};

const FIT_PADDING = 0.78;

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
  private hopUntil = 0;
  private hopHeight = 0;
  private resizeObserver: ResizeObserver | null = null;
  private destroyed = false;
  private tickerFn: ((ticker: Ticker) => void) | null = null;

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
    const model = (await Live2DModel.from(modelUrl)) as Live2DInstance;
    if (this.destroyed) {
      model.destroy?.();
      app.destroy(true);
      return;
    }

    model.anchor.set(0.5, 0.5);
    app.stage.addChild(model as never);
    this.app = app;
    this.model = model;
    this.fit();
    requestAnimationFrame(() => this.fit());
    this.playAction('idle');
    if (this.pending) {
      this.applyState(this.pending);
      this.pending = null;
    }

    this.tickerFn = (ticker) => this.tick(ticker.deltaMS);
    app.ticker.add(this.tickerFn);
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

  destroy(): void {
    this.destroyed = true;
    this.pending = null;
    this.resizeObserver?.disconnect();
    if (this.app && this.tickerFn) this.app.ticker.remove(this.tickerFn);
    this.model?.destroy?.();
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.model = null;
    this.host = null;
  }

  private tick(deltaMs: number): void {
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

    const face = emotionParams(this.current.emotion, this.current.emotionIntensity);
    const action = actionMotion(this.current.action);
    this.setParam(PARAM.eyeLOpen, face.eyeOpen);
    this.setParam(PARAM.eyeROpen, face.eyeOpen);
    this.setParam(PARAM.eyeLSmile, face.eyeSmile);
    this.setParam(PARAM.eyeRSmile, face.eyeSmile);
    this.setParam(PARAM.browLY, face.browY);
    this.setParam(PARAM.browRY, face.browY);
    this.setParam(PARAM.mouthForm, face.mouthForm);
    this.setParam(PARAM.cheek, face.cheek);
    this.setParam(PARAM.angleZ, face.tiltZ + action.headTilt * this.current.actionIntensity);
    this.setParam(PARAM.angleX, Math.sin(performance.now() / 420) * action.headNod * 0.15);
    this.setParam(PARAM.mouthOpen, this.current.mouthOpen);
    this.applyHop(action.hop * this.current.actionIntensity);
  }

  private consumeAction(state: CharacterState): void {
    if (state.actionToken === this.lastActionToken) return;
    this.playAction(state.action);
    this.lastActionToken = state.actionToken;
  }

  private playAction(actionName: CharacterState['action']): void {
    if (!this.model) return;
    const motion = actionMotion(actionName);
    if (motion.hop > 0) {
      this.hopUntil = performance.now() + 620;
      this.hopHeight = 120 * Math.max(this.target.actionIntensity, 0.55);
    }
    void this.model.motion(motion.motionGroup, motion.motionIndex);
  }

  private fit(): void {
    if (!this.app || !this.model || !this.host || this.destroyed) return;
    const viewW = this.app.screen.width || this.host.clientWidth;
    const viewH = this.app.screen.height || this.host.clientHeight;
    const { width, height } = this.nativeSize();
    if (viewW < 2 || viewH < 2 || width < 2 || height < 2) return;
    const scale = Math.min(viewW / width, viewH / height) * FIT_PADDING;
    this.model.scale.set(scale);
    this.restX = viewW / 2;
    this.restY = viewH * 0.52;
    this.model.position.set(this.restX, this.restY);
  }

  private applyHop(hopStrength: number): void {
    if (!this.model) return;
    const now = performance.now();
    let offset = 0;
    if (now < this.hopUntil && hopStrength > 0) {
      const t = 1 - (this.hopUntil - now) / 620;
      offset = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * this.hopHeight;
      this.setParam(PARAM.bodyX, Math.sin(Math.PI * t) * -8);
    }
    this.model.position.set(this.restX, this.restY - offset);
  }

  private nativeSize(): { width: number; height: number } {
    const internal = this.model?.internalModel;
    const width = internal?.originalWidth || internal?.width || 2400;
    const height = internal?.originalHeight || internal?.height || 4800;
    return { width, height };
  }

  private setParam(id: string, value: number): void {
    const core = this.model?.internalModel?.coreModel;
    core?.setParameterValueById?.(id, value);
  }
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
