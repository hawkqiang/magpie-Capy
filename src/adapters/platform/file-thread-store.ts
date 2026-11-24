import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ThreadRef, ThreadStorePort } from "../../ports/thread-store.ts";

const STATE_VERSION = 1;
const TTL_MS = 12 * 3600_000;
const MAX_ENTRIES = 500;

function stateDir(): string {
  const override = String(process.env.MAGPIE_CAPY_STATE_DIR ?? "").trim();
  if (override) return path.resolve(override);
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "magpie-capy");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "magpie-capy");
  }
  return path.join(os.homedir(), ".local", "state", "magpie-capy");
}

/**
 * 文件线程存储：Magpie 按请求重建插件，实例级缓存无法跨请求存活，
 * 因此把会话 key → 线程引用落到 stateDir（与设备凭据同一目录）。
 * 只存线程 id / cursor / model / 时间，不存消息内容。
 */
export class FileThreadStore implements ThreadStorePort {
  private readonly dir: string;
  private readonly file: string;

  constructor(baseDir = stateDir()) {
    this.dir = baseDir;
    this.file = path.join(baseDir, "threads.json");
  }

  load(key: string): ThreadRef | null {
    const doc = this.read();
    const entry = doc.entries[key];
    if (!entry) return null;
    if (!this.valid(entry)) {
      delete doc.entries[key];
      this.write(doc);
      return null;
    }
    return entry;
  }

  save(key: string, ref: ThreadRef): void {
    const doc = this.read();
    const now = ref.updatedAt;
    for (const [k, entry] of Object.entries(doc.entries)) {
      if (!entry || entry.updatedAt + TTL_MS < now) delete doc.entries[k];
    }
    doc.entries[key] = ref;
    const keys = Object.keys(doc.entries);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys.sort((a, b) => (doc.entries[a]?.updatedAt ?? 0) - (doc.entries[b]?.updatedAt ?? 0));
      for (const k of sorted.slice(0, keys.length - MAX_ENTRIES)) delete doc.entries[k];
    }
    this.write(doc);
  }

  remove(key: string): void {
    const doc = this.read();
    delete doc.entries[key];
    this.write(doc);
  }

  private valid(entry: ThreadRef): boolean {
    return typeof entry.threadId === "string"
      && entry.threadId.startsWith("jam_")
      && typeof entry.cursor === "string"
      && typeof entry.updatedAt === "number"
      && entry.updatedAt + TTL_MS >= Date.now();
  }

  private read(): { version: number; entries: Record<string, ThreadRef> } {
    try {
      const doc = JSON.parse(fs.readFileSync(this.file, "utf8")) as {
        version?: unknown;
        entries?: unknown;
      };
      if (doc.version !== STATE_VERSION || !doc.entries || typeof doc.entries !== "object") {
        return { version: STATE_VERSION, entries: {} };
      }
      return { version: STATE_VERSION, entries: doc.entries as Record<string, ThreadRef> };
    } catch {
      return { version: STATE_VERSION, entries: {} };
    }
  }

  private write(doc: { version: number; entries: Record<string, ThreadRef> }): void {
    try {
      fs.mkdirSync(this.dir, { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(doc, null, 2), { mode: 0o600 });
      fs.renameSync(tmp, this.file);
    } catch {
      // 存储失败不阻断请求：退化为每次新建线程。
    }
  }
}
