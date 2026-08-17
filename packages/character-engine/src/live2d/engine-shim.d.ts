declare module 'untitled-pixi-live2d-engine/cubism' {
  import type { Container, ExtensionMetadata } from 'pixi.js';

  export const Live2DPlugin: { extension: ExtensionMetadata };

  export class Live2DModel extends Container {
    static from(source: string): Promise<Live2DModel>;
    motion(group: string, index?: number): Promise<unknown>;
    internalModel?: {
      coreModel?: {
        setParameterValueById?: (id: string, value: number) => void;
      };
    };
  }
}
