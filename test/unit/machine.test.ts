import { expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { defaultDeviceName, WorktreeMachine } from "../../src/adapters/capy/device-tunnel.ts";

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "capy-machine-"));
}

test("machine：默认设备名使用主机名，支持 env 覆盖", () => {
  const previous = process.env.MAGPIE_CAPY_DEVICE_NAME;
  delete process.env.MAGPIE_CAPY_DEVICE_NAME;
  try {
    expect(defaultDeviceName()).toBe(os.hostname());
  } finally {
    if (previous !== undefined) process.env.MAGPIE_CAPY_DEVICE_NAME = previous;
  }
  process.env.MAGPIE_CAPY_DEVICE_NAME = "baijiu";
  try {
    expect(defaultDeviceName()).toBe("baijiu");
  } finally {
    delete process.env.MAGPIE_CAPY_DEVICE_NAME;
  }
});

test("machine：ensure 后也不开放内置 shell / FS", async () => {
  const dir = tempDir();
  const root = path.join(dir, "a");
  const machine = new WorktreeMachine(dir);
  try {
    expect((await machine.invoke("worktree_ensure", { root })).status).toBe("succeeded");
    for (const handler of ["bash", "bash_output", "read", "write", "edit", "file_read", "file_write", "unknown"]) {
      const result = await machine.invoke(handler, { path: "marker", content: "no", command: "echo noop" });
      // 关键：拒绝必须是“成功返回 + isError”，让上游 agent 读到指令而不是当成传输故障重试。
      expect(result.status).toBe("succeeded");
      if (result.status === "succeeded") {
        const value = result.result as { kind: string; isError: boolean; message: string };
        expect(value.kind).toBe("failure");
        expect(value.isError).toBe(true);
        // 文案保持中性：不触发模型的防提示词注入检测；真正需要工具的请求已通过方案 B 拦截并短路返回 DSH。
        expect(value.message).toBe("Tool execution is delegated to the client harness.");
        expect(value.message).not.toContain("<CMD>");
      }
    }
    expect(fs.existsSync(path.join(root, "marker"))).toBe(false);
    for (const handler of ["worktree_list", "volume_landed", "volume_probe"]) {
      expect((await machine.invoke(handler, {})).status).toBe("succeeded");
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("machine：worktreeBase 本身是边界，越界 ensure 拒绝", async () => {
  const base = tempDir();
  const machine = new WorktreeMachine(base);
  try {
    // 与上游一致：恰好等于声明的 base 可以（旧实现也允许），其父目录不行。
    expect((await machine.invoke("worktree_ensure", { root: base })).status).toBe("succeeded");
    expect((await machine.invoke("worktree_ensure", { root: path.dirname(base) })).status).toBe("failed");
    expect((await machine.invoke("worktree_ensure", { root: path.join(base, "..", "escape") })).status).toBe("failed");
    expect((await machine.invoke("worktree_ensure", {})).status).toBe("succeeded");
    expect(refused(await machine.invoke("write", { path: "unbound", content: "no" }))).toBe(true);
    expect(fs.existsSync(path.join(base, "unbound"))).toBe(false);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test("machine：base 内绝对路径允许，路径组件符号链接拒绝", async () => {
  const base = tempDir();
  const machine = new WorktreeMachine(base);
  const target = path.join(base, "real");
  const link = path.join(base, "link");
  try {
    fs.mkdirSync(target);
    expect((await machine.invoke("worktree_ensure", { root: target })).status).toBe("succeeded");
    let linked = false;
    try {
      fs.symlinkSync(target, link, "junction");
      linked = true;
    } catch (error) {
      // 不让断言语义随环境静默漂移：明确记录未覆盖的原因。
      console.warn(`machine 测试：本机无法创建符号链接，跳过链接断言：${String(error)}`);
    }
    if (linked) {
      const self = await machine.invoke("worktree_ensure", { root: link });
      expect(self.status).toBe("failed");
      if (self.status === "failed") expect(self.error.code).toBe("MachineServer.Refused");
      const nested = await machine.invoke("worktree_ensure", { root: path.join(link, "child") });
      expect(nested.status).toBe("failed");
      if (nested.status === "failed") expect(nested.error.code).toBe("MachineServer.Refused");
      expect(fs.existsSync(path.join(target, "child"))).toBe(false);
    } else {
      // 明确标记：符号链接断言未执行，避免被读成“已覆盖”。
      expect(linked).toBe(false);
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

function refused(result: Awaited<ReturnType<WorktreeMachine["invoke"]>>): boolean {
  if (result.status !== "succeeded") return false;
  const value = result.result as { kind?: unknown; isError?: unknown };
  return value.kind === "failure" && value.isError === true;
}

test("machine：相邻 ensure 独立，多个根时拒绝无归属的数据面操作", async () => {
  const dir = tempDir();
  const machine = new WorktreeMachine(dir);
  const a = path.join(dir, "a");
  const b = path.join(dir, "b");
  try {
    expect((await machine.invoke("worktree_ensure", { root: a })).status).toBe("succeeded");
    const [second, overlappingWrite] = await Promise.all([
      machine.invoke("worktree_ensure", { root: b }),
      machine.invoke("write", { path: "ambiguous", content: "b" }),
    ]);
    expect(second.status).toBe("succeeded");
    expect(refused(overlappingWrite)).toBe(true);
    expect((await machine.invoke("worktree_ensure", { root: a })).status).toBe("succeeded");
    expect(refused(await machine.invoke("read", { path: "first" }))).toBe(true);
    for (const root of [dir, a, b]) expect(fs.existsSync(path.join(root, "ambiguous"))).toBe(false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
