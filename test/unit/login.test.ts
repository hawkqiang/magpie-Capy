import { expect, test } from "bun:test";

import { LoginUseCase } from "../../src/application/login.ts";
import type { CapyAppPort } from "../../src/ports/capy-app.ts";
import type { LoginCredential, LoginSourcePort } from "../../src/ports/login.ts";

const key = `capy_${"a".repeat(43)}`;

function fakeApp(overrides: Partial<CapyAppPort> = {}): CapyAppPort {
  let mintedOrg = "";
  const base = {
    async sessionJwt() { return "jwt"; },
    async me() { return { id: "user_1", email: "a@b.c", preferredOrgId: "org_2" }; },
    async organizations() { return [{ id: "org_1" }, { id: "org_2" }]; },
    async mintApiKey(_jwt: string, orgId: string) {
      mintedOrg = orgId;
      return { plaintext: key, keyId: "key_1" };
    },
    async listDevices() { return []; },
    async renameDevice() {},
    async startDeviceCode() { throw new Error("unused"); },
    async approveDeviceCode() {},
    async pollDeviceCode() { throw new Error("unused"); },
    async createJam() { throw new Error("unused"); },
    async getJam() { throw new Error("unused"); },
    async getJamEvents() { return []; },
    async interruptJam() {},
  } as CapyAppPort;
  return Object.assign(base, overrides, {
    mintedOrg: () => mintedOrg,
  }) as CapyAppPort & { mintedOrg: () => string };
}

function fakeSources(credential: LoginCredential): LoginSourcePort {
  return {
    async local() { return credential; },
    async browser() { return credential; },
  };
}

test("login：本机导入 → org 选择 → API key → AccountSession", async () => {
  const app = fakeApp();
  const useCase = new LoginUseCase({
    app,
    sources: fakeSources({
      clientJwt: "client",
      sessionId: "sess_1",
      userId: "user_1",
      clientId: "client_real",
      source: "local",
    }),
  });
  const session = await useCase.login("local");
  expect(session.accessToken).toBe(key);
  expect(session.orgId).toBe("org_2");
  expect(session.source).toBe("local");
  expect(session.clientId).toBe("client_real");
  expect(session.accountId).toBe("a@b.c");
  expect((app as unknown as { mintedOrg: () => string }).mintedOrg()).toBe("org_2");
});

test("login：credential 指定 org 优先", async () => {
  const useCase = new LoginUseCase({
    app: fakeApp(),
    sources: fakeSources({
      clientJwt: "client",
      sessionId: "sess_1",
      userId: "user_1",
      orgId: "org_1",
      source: "browser",
    }),
  });
  const session = await useCase.login("browser");
  expect(session.orgId).toBe("org_1");
  expect(session.source).toBe("browser");
  expect(session.clientId).toBe("");
});

test("login：credential orgId 为字符串 null/undefined 时按未指定处理", async () => {
  for (const bogus of ["null", "undefined"]) {
    const app = fakeApp();
    const useCase = new LoginUseCase({
      app,
      sources: fakeSources({ clientJwt: "c", sessionId: "s", userId: "u", orgId: bogus, source: "browser" }),
    });
    const session = await useCase.login("browser");
    expect(session.orgId).toBe("org_2"); // me.preferredOrgId wins
  }
});

test("login：没有组织 → invalid_request", async () => {
  const app = fakeApp({
    async me() { return { id: "user_1" }; },
    async organizations() { return []; },
  });
  const useCase = new LoginUseCase({
    app,
    sources: fakeSources({ clientJwt: "c", sessionId: "s", userId: "u", source: "local" }),
  });
  await expect(useCase.login("local")).rejects.toMatchObject({ kind: "invalid_request", status: 400 });
});
