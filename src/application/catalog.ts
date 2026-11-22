import type { ModelDescriptor, RawModel } from "../domain/model.ts";
import { describeModel, freeFirst, mergeCatalog } from "../domain/model.ts";
import { CapyError, isAbort, isAuthError } from "../domain/errors.ts";
import type { CapyPublicPort } from "../ports/capy-public.ts";
import type { CachePort } from "../ports/platform.ts";

export interface CatalogUseCaseOptions {
  readonly publicPort: CapyPublicPort;
  readonly fallback: readonly RawModel[];
  readonly toolsEnabled: boolean;
  readonly cache?: CachePort;
  readonly cacheTtlMs?: number;
}

export interface CatalogSnapshot {
  readonly models: readonly ModelDescriptor[];
}

const DEFAULT_TTL_MS = 10 * 60_000;

export class CatalogUseCase {
  private readonly options: CatalogUseCaseOptions;

  constructor(options: CatalogUseCaseOptions) {
    this.options = options;
  }

  async load(apiKey: string, signal?: AbortSignal, accountKey?: string): Promise<CatalogSnapshot> {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const cacheKey = `catalog:${accountKey ?? apiKey.slice(-16)}`;
    const hit = this.options.cache?.get<CatalogSnapshot>(cacheKey);
    if (hit) return hit;
    const snapshot = await this.loadSnapshot(apiKey, signal);
    this.options.cache?.set(cacheKey, snapshot, this.options.cacheTtlMs ?? DEFAULT_TTL_MS);
    return snapshot;
  }

  private async loadSnapshot(apiKey: string, signal?: AbortSignal): Promise<CatalogSnapshot> {
    try {
      const live = await this.options.publicPort.listModels(apiKey, signal);
      return { models: this.describe(live.items) };
    } catch (error) {
      if (isAbort(error) || signal?.aborted) throw error;
      if (isAuthError(error)) throw error;
      if (this.options.fallback.length === 0) {
        throw new CapyError("upstream_unavailable", "Capy 模型目录不可用", { cause: error });
      }
      return { models: this.describe(this.options.fallback) };
    }
  }

  private describe(raw: readonly RawModel[]): readonly ModelDescriptor[] {
    return freeFirst(mergeCatalog(raw).map((item) => describeModel(item, {
      toolsEnabled: this.options.toolsEnabled,
    })));
  }
}

