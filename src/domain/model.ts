import { CapyError } from "./errors.ts";

export interface ModelCapabilities {
  readonly text: boolean;
  readonly image: boolean;
  readonly pdf: boolean;
  readonly attachment: boolean;
  readonly tools: boolean;
}

export interface ModelDescriptor {
  readonly id: string;
  readonly name: string;
  readonly free: boolean;
  readonly reasoningModes: readonly string[];
  readonly capabilities: ModelCapabilities;
}

export interface RawModel {
  readonly id: string;
  readonly name?: string;
  readonly reasoningModes?: readonly string[];
}



/** 公共 /models 不返回的两个 App 内免费广告模型。 */
export const EXTRA_FREE_MODELS: readonly RawModel[] = [
  {
    id: "zai/glm-5.3-flash-ads",
    name: "GLM-5.3-Flash (Free with ads)",
    reasoningModes: ["low", "high", "max"],
  },
  {
    id: "deepseek/deepseek-v4.1-flash-ads",
    name: "DeepSeek V4.1 Flash (Free with ads)",
    reasoningModes: ["none", "low", "high", "max"],
  },
];

/** App 内免费广告模型：建线程必须带 `ads-models` 客户端能力位。 */
const ADS_MODEL_IDS: ReadonlySet<string> = new Set(EXTRA_FREE_MODELS.map((model) => model.id));

/** 厂商定价页确认的 $0.00 模型。 */
const FREE_MODEL_IDS: ReadonlySet<string> = new Set(["particle/particle-1", ...ADS_MODEL_IDS]);

export function isFreeModel(id: string): boolean {
  return FREE_MODEL_IDS.has(String(id).trim());
}

export function isAdsModel(id: string): boolean {
  return ADS_MODEL_IDS.has(String(id).trim());
}

function normalizeModes(modes: readonly string[] | undefined): string[] {
  if (!modes) return [];
  const seen = new Set<string>();
  for (const raw of modes) {
    const mode = String(raw).trim().toLowerCase();
    if (mode) seen.add(mode);
  }
  return [...seen];
}

export function describeModel(raw: RawModel, options: { toolsEnabled: boolean }): ModelDescriptor {
  const id = String(raw.id).trim();
  const name = String(raw.name ?? "").trim() || id;
  const reasoningModes = normalizeModes(raw.reasoningModes);
  return {
    id,
    name,
    free: isFreeModel(id),
    reasoningModes,
    capabilities: {
      text: true,
      // Capy 的 files/附件通道接受图片和 PDF；实际是否“看懂”由模型决定。
      image: true,
      pdf: true,
      attachment: true,
      // 不是原生 tools，而是 PromptToolBridge 的提示词约定。
      tools: options.toolsEnabled,
    },
  };
}

export function mergeCatalog(live: readonly RawModel[], extras: readonly RawModel[] = EXTRA_FREE_MODELS): RawModel[] {
  const seen = new Set(live.map((item) => item.id));
  return [...live, ...extras.filter((item) => !seen.has(item.id))];
}

/** 免费模型排最前：宿主每个 provider 只展示有限数量，避免免费模型被截掉。 */
export function freeFirst<T extends { id: string }>(models: readonly T[]): T[] {
  return [...models].sort((a, b) => Number(isFreeModel(b.id)) - Number(isFreeModel(a.id)));
}

export function resolveModel(
  requested: unknown,
  models: readonly ModelDescriptor[],
): ModelDescriptor {
  const wanted = typeof requested === "string" ? requested.trim() : "";
  // 调用方没有 model 时应在建线程时省略 modelId，让 Capy 走默认链；
  // 这里只解析显式 id，不发明“第一个模型就是默认”。
  if (!wanted) throw new CapyError("invalid_request", "缺少 model");
  if (models.length === 0) throw new CapyError("model_not_found", "Capy 模型目录为空");

  const strip = (value: string) => value.replace(/^capy\//iu, "");
  const target = strip(wanted);
  const byId = models.find((model) => model.id === wanted || model.id === target);
  if (byId) return byId;

  const short = target.split("/").pop() ?? target;
  const byShort = models.find((model) => (model.id.split("/").pop() ?? model.id) === short);
  if (byShort) return byShort;

  const normalize = (value: string) => value.toLowerCase().replace(/[\s._-]+/gu, "");
  const norm = normalize(target);
  const byName = models.find(
    (model) => normalize(model.name) === norm || normalize(model.id) === norm,
  );
  if (byName) return byName;

  throw new CapyError("model_not_found", `Capy 不认识模型 "${wanted}"`, { detail: wanted });
}

export function resolveModelId(requested: unknown, models: readonly ModelDescriptor[]): string {
  return resolveModel(requested, models).id;
}

export function reasoningModeOf(request: { reasoningEffort?: string }, model: ModelDescriptor | undefined): string {
  const raw = String(request.reasoningEffort ?? "").trim().toLowerCase();
  if (!raw || !model) return "";
  return model.reasoningModes.includes(raw) ? raw : "";
}
