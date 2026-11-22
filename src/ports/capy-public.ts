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
  ): AsyncIterable<UpstreamSseFrame>;
  uploadFiles(
    apiKey: string,
    files: readonly UploadCandidate[],
    signal?: AbortSignal,
  ): Promise<readonly UploadedFile[]>;
  usage(apiKey: string, signal?: AbortSignal): Promise<UsageTotals>;
  balance(apiKey: string, signal?: AbortSignal): Promise<Balance>;
}
