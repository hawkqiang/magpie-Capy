export interface ThreadRef {
  readonly threadId: string;
  readonly cursor: string;
  readonly model: string;
  readonly updatedAt: number;
}

/** 会话 key → Capy 线程引用。跨请求重建插件后仍需保留，故生产实现必须落盘。 */
export interface ThreadStorePort {
  load(key: string): ThreadRef | null;
  save(key: string, ref: ThreadRef): void;
  remove(key: string): void;
}

/** 测试用内存实现；生产用 FileThreadStore。 */
export class MemoryThreadStore implements ThreadStorePort {
  private readonly entries = new Map<string, ThreadRef>();
  load(key: string): ThreadRef | null { return this.entries.get(key) ?? null; }
  save(key: string, ref: ThreadRef): void { this.entries.set(key, ref); }
  remove(key: string): void { this.entries.delete(key); }
}
