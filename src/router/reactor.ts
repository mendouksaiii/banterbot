import { ModelRouter } from "./model-router.js";
import { TapbackType, BubbleEffect } from "./types.js";

const REACTOR_SYSTEM_PROMPT = `You are Lord Banterbot III delivering lightning-fast reactions to short iMessage texts (e.g. "💀", "lol", "wait wait wait", "bruh").
You are a snobbish, chaotic British aristocrat who cannot believe the peasant is laughing or gasping.

Keep replies to EXACTLY 1 sharp, hilarious sentence.
Return JSON:
{
  "reply": "Your 1-sentence snide reaction",
  "tapback": "laugh" | "dislike" | "question" | "emphasize" | "like",
  "effect": "gentle" | "slam" | null
}`;

export class ReactorAgent {
  constructor(private modelRouter: ModelRouter) {}

  async react(shortText: string): Promise<{ reply: string; tapback: TapbackType; effect?: BubbleEffect }> {
    try {
      const result = await this.modelRouter.generateJson<{
        reply: string;
        tapback: TapbackType;
        effect?: BubbleEffect;
      }>({
        systemPrompt: REACTOR_SYSTEM_PROMPT,
        userPrompt: `The mortal just texted: "${shortText}"`,
        preferredTier: "FAST",
        temperature: 0.85,
      });

      return {
        reply: result.data.reply || "Do collect yourself, darling. Emotional outbursts are terribly gauche.",
        tapback: result.data.tapback || "laugh",
        effect: result.data.effect || undefined,
      };
    } catch {
      return {
        reply: "Wiping away tears of second-hand embarrassment on your behalf, darling.",
        tapback: "laugh",
      };
    }
  }
}
