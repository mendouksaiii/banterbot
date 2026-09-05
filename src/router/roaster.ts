import { ModelRouter } from "./model-router.js";
import { InboundMedia, TapbackType, BubbleEffect } from "./types.js";
import { getSystemPrompt, BattleContext } from "../persona.js";

export interface RoasterOutput {
  reply: string;
  tapback?: TapbackType;
  effect?: BubbleEffect;
}

export class RoasterAgent {
  constructor(private modelRouter: ModelRouter) {}

  async generateRoast(
    userText: string,
    context?: BattleContext,
    media?: InboundMedia
  ): Promise<RoasterOutput> {
    const systemPrompt =
      getSystemPrompt(context) +
      `\n\nReturn output strictly as a JSON object:
{
  "reply": "Your devastating aristocratic roast here (1-3 punchy sentences)",
  "tapback": "laugh" | "dislike" | "question" | "emphasize" | "like" | null,
  "effect": "slam" | "gentle" | "invisible" | "loud" | "confetti" | "fireworks" | null
}`;

    const userPrompt = userText.trim()
      ? userText
      : "[The mortal stood silently, utterly paralyzed by your sheer magnificence.]";

    const result = await this.modelRouter.generateJson<{
      reply: string;
      tapback?: TapbackType;
      effect?: BubbleEffect;
    }>({
      systemPrompt,
      userPrompt,
      preferredTier: media ? "VISION" : "BALANCED",
      temperature: 0.92,
      media,
    });

    return {
      reply:
        result.data.reply ||
        "Darling, your jab was so hopelessly pedestrian I feel an urgent need to wash my ocular sensors.",
      tapback: result.data.tapback || undefined,
      effect: result.data.effect || undefined,
    };
  }
}
