import { STATIC_CATALOG } from "../adapters/capy/static-catalog.ts";
import { CAPY_PUBLIC } from "../adapters/capy/endpoints.ts";
import {
  describeModel,
  EXTRA_FREE_MODELS,
  freeFirst,
  isAdsModel,
  mergeCatalog,
  type ModelDescriptor,
} from "../domain/model.ts";

const SDK = "@ai-sdk/openai-compatible";

export interface MagpieModel {
  readonly id: string;
  readonly providerID: string;
  readonly name: string;
  readonly description?: string;
  readonly free: boolean;
  readonly tool_call: boolean;
  readonly attachment: boolean;
  readonly api: { readonly id: string; readonly url: string; readonly npm: string };
  readonly status: "active";
  readonly headers: Record<string, string>;
  readonly options: Record<string, unknown>;
  readonly limit: Record<string, unknown>;
  readonly modalities: { readonly input: readonly string[]; readonly output: readonly string[] };
  readonly capabilities: {
    readonly temperature: boolean;
    readonly reasoning: boolean;
    readonly attachment: boolean;
    readonly toolcall: boolean;
    readonly input: Record<string, boolean>;
    readonly output: Record<string, boolean>;
    readonly interleaved: boolean;
  };
  readonly variants?: Record<string, Record<string, unknown>>;
}

function toMagpieModel(model: ModelDescriptor, providerId: string): MagpieModel {
  const variants = model.reasoningModes.length > 0
    ? Object.fromEntries(model.reasoningModes.map((mode) => [mode, {}]))
    : undefined;
  const ads = isAdsModel(model.id);
  return {
    id: model.id,
    providerID: providerId,
    name: ads ? `${model.name} · US/CA/UK/AU/NZ/IE` : model.name,
    ...(ads ? { description: "Free with ads — only US / CA / UK / AU / NZ / IE egress IP" } : {}),
    free: model.free,
    tool_call: model.capabilities.tools,
    attachment: model.capabilities.attachment,
    api: { id: model.id, url: CAPY_PUBLIC, npm: SDK },
    status: "active",
    headers: {},
    options: {},
    limit: {},
    modalities: { input: ["text", ...(model.capabilities.image ? ["image"] : [])], output: ["text"] },
    capabilities: {
      temperature: false,
      reasoning: model.reasoningModes.length > 0,
      attachment: model.capabilities.attachment,
      toolcall: model.capabilities.tools,
      input: {
        text: model.capabilities.text,
        image: model.capabilities.image,
        audio: false,
        video: false,
        pdf: model.capabilities.pdf,
      },
      output: { text: true, image: false, audio: false, video: false, pdf: false },
      interleaved: false,
    },
    ...(variants ? { variants } : {}),
  };
}

export function modelMap(
  models: readonly ModelDescriptor[],
  providerId: string,
): Record<string, MagpieModel> {
  return Object.fromEntries(
    models.map((model) => [model.id, toMagpieModel(model, providerId)]),
  );
}

export function staticModels(providerId: string, toolsEnabled: boolean): Record<string, MagpieModel> {
  const models = freeFirst(
    mergeCatalog(STATIC_CATALOG, EXTRA_FREE_MODELS)
      .map((raw) => describeModel(raw, { toolsEnabled })),
  );
  return modelMap(models, providerId);
}
