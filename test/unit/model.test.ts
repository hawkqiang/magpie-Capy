import { expect, test } from "bun:test";

import {
  describeModel,
  freeFirst,
  isAdsModel,
  isFreeModel,
  mergeCatalog,
  reasoningModeOf,
  resolveModelId,
} from "../../src/domain/model.ts";

const models = [
  describeModel({ id: "openai/gpt-6.2-astra", reasoningModes: ["high"] }, { toolsEnabled: true }),
  describeModel({ id: "particle/particle-1", name: "Particle-1", reasoningModes: ["low"] }, { toolsEnabled: true }),
  describeModel({ id: "zai/glm-5.3-flash-ads", name: "GLM-5.3-Flash (Free with ads)" }, { toolsEnabled: true }),
  describeModel({ id: "deepseek/deepseek-v4.1-flash-ads" }, { toolsEnabled: true }),
];

test("免费模型：集合 + 排最前", () => {
  expect(isFreeModel("particle/particle-1")).toBe(true);
  expect(isAdsModel("zai/glm-5.3-flash-ads")).toBe(true);
  expect(isAdsModel("deepseek/deepseek-v4.1-flash-ads")).toBe(true);
  expect(isAdsModel("particle/particle-1")).toBe(false);
  expect(isFreeModel("openai/gpt-6.2-astra")).toBe(false);
  const ids = freeFirst(models).map((model) => model.id);
  expect(ids.slice(0, 3).every((id) => isFreeModel(id))).toBe(true);
});

test("mergeCatalog：补上公共目录缺失的免费广告模型", () => {
  const merged = mergeCatalog([{ id: "particle/particle-1" }]);
  expect(merged.some((model) => model.id === "zai/glm-5.3-flash-ads")).toBe(true);
  expect(merged.some((model) => model.id === "deepseek/deepseek-v4.1-flash-ads")).toBe(true);
});

test("resolveModelId：精确 / capy 前缀 / 短名 / 展示名 / 未知 / 缺失", () => {
  expect(resolveModelId("particle/particle-1", models)).toBe("particle/particle-1");
  expect(resolveModelId("capy/particle/particle-1", models)).toBe("particle/particle-1");
  expect(resolveModelId("gpt-6.2-astra", models)).toBe("openai/gpt-6.2-astra");
  expect(resolveModelId("Particle-1", models)).toBe("particle/particle-1");
  expect(() => resolveModelId("nope", models)).toThrow();
  expect(() => resolveModelId("", models)).toThrow("缺少 model");
});

test("reasoningModeOf：只接受模型档位", () => {
  const model = models[0];
  expect(reasoningModeOf({ reasoningEffort: "HIGH" }, model)).toBe("high");
  expect(reasoningModeOf({ reasoningEffort: "low" }, model)).toBe("");
  expect(reasoningModeOf({}, model)).toBe("");
});

test("describeModel：能力/厂商", () => {
  const model = describeModel({ id: "anthropic/claude-fable-5.2", reasoningModes: ["high"] }, { toolsEnabled: true });
  expect(model.capabilities.image).toBe(true);
  expect(model.capabilities.pdf).toBe(true);
  expect(model.capabilities.tools).toBe(true);
  expect(model.reasoningModes).toEqual(["high"]);
});
