export interface UsageWindow {
  readonly name: string;
  readonly used: number;
  readonly display: string;
  readonly unit?: string;
  readonly aside?: boolean;
  readonly resetsAt?: string;
}

export interface UsageSnapshot {
  readonly windows: readonly UsageWindow[];
  readonly plan?: string;
  readonly balance?: string;
  readonly error?: string;
  readonly signIn?: "expired";
}

export interface Balance {
  readonly currency?: string;
  readonly remainingDollars?: number | null;
  readonly unlimited?: boolean;
  readonly periodEnd?: string | null;
}

export interface UsageTotals {
  readonly tokens?: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
  };
}
