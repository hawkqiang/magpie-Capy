import type { RawModel } from "../domain/model.ts";
import type { Balance, UsageTotals } from "../domain/usage.ts";

export interface UpstreamSseFrame {
  readonly event: string;
  readonly data: string;
  readonly id?: string;
}

export interface UploadCandidate {
  readonly name: string;
  readonly mediaType: string;
  readonly bytes: Uint8Array;
}

export interface UploadedFile {
  readonly fileId: string;
  readonly name: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
}

export interface CapyPublicPort {
  listModels(apiKey: string, signal?: AbortSignal): Promise<{
    readonly items: readonly RawModel[];
  }>;
  streamThread(
    apiKey: string,
    threadId: string,
    signal?: AbortSignal,
    /** 从该 transcript cursor 之后开始推送；复用线程时用来跳过旧记录。 */
    after?: string,
  ): AsyncIterable<UpstreamSseFrame>;
  sendMessage(
    apiKey: string,
    threadId: string,
    text: string,
    clientKey: string,
    signal?: AbortSignal,
  ): Promise<void>;
  uploadFiles(
    apiKey: string,
    files: readonly UploadCandidate[],
    signal?: AbortSignal,
  ): Promise<readonly UploadedFile[]>;
  usage(apiKey: string, signal?: AbortSignal): Promise<UsageTotals>;
  balance(apiKey: string, signal?: AbortSignal): Promise<Balance>;
}
