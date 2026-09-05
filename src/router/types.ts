export type IntentType =
  | "QUICK_REACTION"
  | "BATTLE_PUNCHLINE"
  | "MEDIA_ROAST"
  | "AMBIENT_BANTER"
  | "COMMAND";

export type TapbackType = "love" | "like" | "dislike" | "laugh" | "emphasize" | "question";

export type BubbleEffect = "slam" | "gentle" | "invisible" | "loud" | "confetti" | "fireworks" | "echo";

export interface InboundMedia {
  mimeType: string;
  data: Buffer;
}

export interface RefereeVerdict {
  score: number; // 0.0 - 10.0
  earnedPoint: boolean;
  critique: string;
  suggestedTapback?: TapbackType;
  suggestedEffect?: BubbleEffect;
}

export interface AgentResponse {
  reply: string;
  tapback?: TapbackType;
  effect?: BubbleEffect;
  userEarnedPoint?: boolean;
  intent: IntentType;
  refereeVerdict?: RefereeVerdict;
  modelUsed: string;
  latencyMs: number;
}
