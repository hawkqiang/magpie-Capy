import { expect, test } from "bun:test";

import { buildUsage, money, withDeviceWindow } from "../../src/application/usage.ts";

test("buildUsage：无余额 → used=100；不显示本期消费", () => {
  const usage = buildUsage(
    { tokens: { inputTokens: 10, outputTokens: 2 } },
    { remainingDollars: null, unlimited: false },
  );
  expect(usage.windows[0]).toMatchObject({ name: "余额", used: 100 });
  expect(usage.windows[0]?.display).toContain("无可用余额");
  expect(usage.windows.every((window) => window.name !== "本期消费")).toBe(true);
  expect(usage.windows.some((window) => window.name === "Token")).toBe(true);
});

test("buildUsage：有余额 → used=0；unlimited", () => {
  const paid = buildUsage(
    { tokens: { inputTokens: 1500, outputTokens: 200 } },
    { remainingDollars: 12.25, currency: "USD", periodEnd: "2026-12-01T00:00:00.000Z" },
  );
  expect(paid.windows[0]).toMatchObject({ name: "余额", used: 0 });
  expect(paid.windows[0]?.display).toContain("$12.25");
  expect(paid.windows[0]?.resetsAt).toBe("2026-12-01T00:00:00.000Z");

  const unlimited = buildUsage({}, { unlimited: true });
  expect(unlimited.windows[0]?.display).toBe("无限额度");
  expect(unlimited.plan).toBe("Unlimited");
});

test("withDeviceWindow：已连接/未连接", () => {
  const usage = withDeviceWindow(buildUsage({}, { remainingDollars: 1 }), {
    connected: true,
    name: "magpie-headless",
  });
  const device = usage.windows.find((window) => window.name === "无头设备");
  expect(device).toMatchObject({ used: 0, aside: true });
  expect(device?.display).toContain("magpie-headless");
});

test("money", () => {
  expect(money(12.25)).toBe("$12.25");
  expect(money(120)).toBe("$120");
});
