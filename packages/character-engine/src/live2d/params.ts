import { PARAM, PART } from './mappings';

export type CoreModel = {
  getModel?: () => CoreArrays | undefined;
  parameters?: CoreArrays['parameters'];
  parts?: CoreArrays['parts'];
  addParameterValueById?: (id: unknown, value: number) => void;
  setParameterValueById?: (id: unknown, value: number) => void;
  setPartOpacityById?: (id: unknown, value: number) => void;
  getParameterCount?: () => number;
  getParameterId?: (index: number) => unknown;
  getParameterIndex?: (id: unknown) => number;
  getParameterValueByIndex?: (index: number) => number;
  setParameterValueByIndex?: (index: number, value: number) => void;
  getParameterMinimumValue?: (index: number) => number;
  getParameterMaximumValue?: (index: number) => number;
  getPartCount?: () => number;
  getPartId?: (index: number) => unknown;
  getPartIndex?: (id: unknown) => number;
  setPartOpacityByIndex?: (index: number, value: number) => void;
};

type CoreArrays = {
  parameters?: {
    count?: number;
    ids: ArrayLike<unknown>;
    values: Float32Array;
    minimumValues: Float32Array;
    maximumValues: Float32Array;
  };
  parts?: {
    count?: number;
    ids: ArrayLike<unknown>;
    opacities: Float32Array;
    parentIndices?: ArrayLike<number>;
  };
};

type ResolveId = (id: string) => unknown;

type ParamSlot = {
  id: string;
  index: number;
  min: number;
  max: number;
  values?: Float32Array;
};

export class ParamTable {
  private readonly paramIndex = new Map<string, ParamSlot>();
  private readonly partIndex = new Map<string, number>();
  private readonly partOpacities: Float32Array | null;
  private readonly parentIndices: ArrayLike<number> | null;
  private readonly partCount: number;
  private readonly armAParts: number[] = [];
  private readonly armBParts: number[] = [];

  constructor(
    private readonly core: CoreModel,
    private readonly resolveId?: ResolveId,
  ) {
    const arrays = core.getModel?.() ?? (core.parameters || core.parts ? core : undefined);
    this.partOpacities = arrays?.parts?.opacities ?? null;
    this.parentIndices = arrays?.parts?.parentIndices ?? null;
    this.partCount = core.getPartCount?.() ?? arrays?.parts?.count ?? arrays?.parts?.ids.length ?? 0;
    this.indexParams(arrays);
    this.indexParts(arrays);
    this.indexKnown(arrays);
    this.indexArmParts(arrays);
  }

  add(id: string, value: number): void {
    if (value === 0) return;
    const slot = this.paramIndex.get(id);
    if (slot) {
      this.writeParam(slot, clamp(this.readParam(slot) + value, slot.min, slot.max));
      return;
    }
    this.core.addParameterValueById?.(this.idOf(id), value);
  }

  set(id: string, value: number): void {
    const slot = this.paramIndex.get(id);
    if (slot) {
      this.writeParam(slot, clamp(value, slot.min, slot.max));
      return;
    }
    this.core.setParameterValueById?.(this.idOf(id), value);
  }

  setPart(id: string, opacity: number): void {
    this.writePart(id, clamp(opacity, 0, 1));
  }

  setArmPose(pose: number): void {
    const t = clamp(pose, 0, 1);
    const armA = 1 - t;
    const armB = t;
    this.writePart(PART.armA, armA);
    this.writePart(PART.armB, armB);
    for (const index of this.armAParts) this.writePartIndex(index, armA);
    for (const index of this.armBParts) this.writePartIndex(index, armB);
  }

  private indexParams(arrays?: CoreArrays): void {
    const count =
      this.core.getParameterCount?.() ??
      arrays?.parameters?.count ??
      arrays?.parameters?.ids.length ??
      0;
    for (let index = 0; index < count; index += 1) {
      const id = this.core.getParameterId?.(index) ?? arrays?.parameters?.ids[index];
      if (id === undefined) continue;
      this.paramIndex.set(idKey(id), this.slot(idKey(id), index, arrays));
    }
  }

  private indexParts(arrays?: CoreArrays): void {
    const count =
      this.core.getPartCount?.() ?? arrays?.parts?.count ?? arrays?.parts?.ids.length ?? 0;
    for (let index = 0; index < count; index += 1) {
      const id = this.core.getPartId?.(index) ?? arrays?.parts?.ids[index];
      if (id === undefined) continue;
      this.partIndex.set(idKey(id), index);
    }
  }

  private indexKnown(arrays?: CoreArrays): void {
    for (const id of Object.values(PARAM)) {
      if (this.paramIndex.has(id)) continue;
      const index = this.core.getParameterIndex?.(this.idOf(id));
      if (index === undefined || index < 0) continue;
      this.paramIndex.set(id, this.slot(id, index, arrays));
    }
    for (const id of Object.values(PART)) {
      const index = this.resolvePartIndex(id);
      if (index === undefined) continue;
      this.partIndex.set(id, index);
    }
  }

  private indexArmParts(arrays?: CoreArrays): void {
    const roots = { a: this.resolvePartIndex(PART.armA), b: this.resolvePartIndex(PART.armB) };
    for (let index = 0; index < this.partCount; index += 1) {
      const id = idKey(this.core.getPartId?.(index) ?? arrays?.parts?.ids[index] ?? '');
      const lower = id.toLowerCase();
      if (lower.includes('armb') || this.isDescendant(index, roots.b)) this.armBParts.push(index);
      else if (lower.includes('arma') || this.isDescendant(index, roots.a)) this.armAParts.push(index);
    }
  }

  private isDescendant(index: number, root: number | undefined): boolean {
    if (root === undefined || !this.parentIndices) return false;
    let current = index;
    const seen = new Set<number>();
    while (current >= 0 && !seen.has(current)) {
      if (current === root) return true;
      seen.add(current);
      current = this.parentIndices[current] ?? -1;
    }
    return false;
  }

  private resolvePartIndex(id: string): number | undefined {
    const cached = this.partIndex.get(id);
    if (cached !== undefined) return cached;
    const byHandle = this.core.getPartIndex?.(this.idOf(id));
    if (byHandle !== undefined && byHandle >= 0) return byHandle;
    const byString = this.core.getPartIndex?.(id);
    if (byString !== undefined && byString >= 0) return byString;
    for (let index = 0; index < this.partCount; index += 1) {
      if (idKey(this.core.getPartId?.(index) ?? '') === id) return index;
    }
    return undefined;
  }

  private writePart(id: string, opacity: number): void {
    const index = this.resolvePartIndex(id);
    if (index !== undefined) this.writePartIndex(index, opacity);
    this.core.setPartOpacityById?.(this.idOf(id), opacity);
    this.core.setPartOpacityById?.(id, opacity);
  }

  private writePartIndex(index: number, opacity: number): void {
    if (this.partOpacities) this.partOpacities[index] = opacity;
    this.core.setPartOpacityByIndex?.(index, opacity);
  }

  private slot(id: string, index: number, arrays?: CoreArrays): ParamSlot {
    return {
      id,
      index,
      min:
        this.core.getParameterMinimumValue?.(index) ??
        arrays?.parameters?.minimumValues[index] ??
        -30,
      max:
        this.core.getParameterMaximumValue?.(index) ??
        arrays?.parameters?.maximumValues[index] ??
        30,
      values: arrays?.parameters?.values,
    };
  }

  private readParam(slot: ParamSlot): number {
    if (this.core.getParameterValueByIndex) return this.core.getParameterValueByIndex(slot.index);
    return slot.values?.[slot.index] ?? 0;
  }

  private writeParam(slot: ParamSlot, value: number): void {
    this.core.setParameterValueByIndex?.(slot.index, value);
    if (slot.values) slot.values[slot.index] = value;
    this.core.setParameterValueById?.(this.idOf(slot.id), value);
  }

  private idOf(id: string): unknown {
    return this.resolveId?.(id) ?? id;
  }
}

function idKey(id: unknown): string {
  if (typeof id === 'string') return id;
  if (!id || typeof id !== 'object') return String(id);
  const obj = id as Record<string, unknown>;
  if (typeof obj.id === 'string') return obj.id;
  if (typeof obj.s === 'string') return obj.s;
  if (typeof obj._id === 'string') return obj._id;
  if (typeof obj.getString === 'function') {
    const value = obj.getString();
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 's' in value && typeof value.s === 'string')
      return value.s;
  }
  return String(id);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
