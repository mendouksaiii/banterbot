import { ModelRouter } from "./model-router.js";
import { RefereeVerdict, TapbackType, BubbleEffect } from "./types.js";
import { BattleContext } from "../persona.js";

const REFEREE_SYSTEM_PROMPT = `You are The Grand Arbiter of Comedy & Chief Inquisitor of the Roast Battle Arena.
You are completely neutral, objective, and unflinchingly honest. You DO NOT banter. You judge roast battles with the rigor of an Olympic referee.

YOUR RUBRIC (0.0 to 10.0 scale):
- 0.0 - 3.9 (FAIL, earnedPoint: false):
  * Generic internet clichés ("your mom", "you look like a trash can", "potato", "clown").
  * Weak comebacks, elementary playground insults, zero comedic technique.
  * Suggest tapback: "dislike" or "question"
- 4.0 - 6.4 (MEDIOCRE, earnedPoint: false):
  * Mildly funny but predictable. Good premise, weak punchline.
  * Suggest tapback: "like" or null
- 6.5 - 10.0 (VICTORIOUS STING, earnedPoint: true):
  * Specific, highly visual, unexpected, sharply worded punchlines.
  * Genuinely devastating or delightfully dark observations that crack the opponent's facade.
  * Suggest tapback: "laugh" or "emphasize"
  * Suggest effect: "slam" or "invisible" (if >= 8.5)

OUTPUT FORMAT (Valid JSON only):
{
  "score": number, // e.g. 7.5
  "earnedPoint": boolean, // true ONLY if score >= 6.5
  "critique": "One sharp sentence explaining why the roast landed or fell flat.",
  "suggestedTapback": "laugh" | "dislike" | "question" | "emphasize" | "like" | null,
  "suggestedEffect": "slam" | "gentle" | "invisible" | null
}`;

export class RefereeAgent {
  constructor(private modelRouter: ModelRouter) {}

  async evaluateRoast(
    userText: string,
    context?: BattleContext
  ): Promise<RefereeVerdict> {
    const historyText = context?.history?.length
      ? `Battle History so far:\n${context.history.join("\n")}\n\n`
      : "";

    const userPrompt = `${historyText}Current Round: ${context?.round || 1} / 3
User's Roast Punchline: "${userText}"

Evaluate this punchline according to the rubric.`;

    try {
      const result = await this.modelRouter.generateJson<any>({
        systemPrompt: REFEREE_SYSTEM_PROMPT,
        userPrompt,
        preferredTier: "FAST", // Fast evaluation on Groq / Gemini
        temperature: 0.3, // Low temperature for consistent, objective scoring
      });

      const score = Math.max(0, Math.min(10, Number(result.data.score) || 0));
      const earnedPoint = Boolean(result.data.earnedPoint ?? score >= 6.5);

      return {
        score,
        earnedPoint,
        critique: result.data.critique || (earnedPoint ? "Direct hit to the ego." : "Lacks bite."),
        suggestedTapback: (result.data.suggestedTapback as TapbackType) || (earnedPoint ? "laugh" : "dislike"),
        suggestedEffect: (result.data.suggestedEffect as BubbleEffect) || (earnedPoint ? "slam" : undefined),
      };
    } catch (err) {
      console.warn("Referee evaluation failed, falling back to heuristic scoring:", err);
      const isGoodLength = userText.length > 20 && !userText.toLowerCase().includes("your mom");
      return {
        score: isGoodLength ? 6.8 : 3.5,
        earnedPoint: isGoodLength,
        critique: isGoodLength ? "Sufficient audacity detected." : "Pedestrian effort.",
        suggestedTapback: isGoodLength ? "laugh" : "dislike",
      };
    }
  }
}
