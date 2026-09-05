import { ModelRouter } from "./model-router.js";
import { classifyIntent } from "./intent.js";
import { RefereeAgent } from "./referee.js";
import { RoasterAgent } from "./roaster.js";
import { ReactorAgent } from "./reactor.js";
import { AgentResponse, InboundMedia, RefereeVerdict } from "./types.js";
import { BattleContext } from "../persona.js";

export class AgentRouter {
  private modelRouter: ModelRouter;
  private referee: RefereeAgent;
  private roaster: RoasterAgent;
  private reactor: ReactorAgent;

  constructor() {
    this.modelRouter = new ModelRouter();
    this.referee = new RefereeAgent(this.modelRouter);
    this.roaster = new RoasterAgent(this.modelRouter);
    this.reactor = new ReactorAgent(this.modelRouter);
  }

  async route(
    userText: string,
    context?: BattleContext,
    media?: InboundMedia
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const intent = classifyIntent(userText, context, media);

    console.log(`[AgentRouter] Routing intent: "${intent}" (text: "${userText.slice(0, 30)}...")`);

    // 1. Quick Reaction (Sub-200ms)
    if (intent === "QUICK_REACTION") {
      const fastResult = await this.reactor.react(userText);
      const latencyMs = Date.now() - startTime;
      return {
        reply: fastResult.reply,
        tapback: fastResult.tapback,
        effect: fastResult.effect,
        userEarnedPoint: false,
        intent,
        modelUsed: "llama-3.1-8b-instant",
        latencyMs,
      };
    }

    // 2. Battle Punchline: Parallel Execution of Referee + Roaster!
    if (intent === "BATTLE_PUNCHLINE") {
      const [refereeVerdict, roasterOutput] = await Promise.all([
        this.referee.evaluateRoast(userText, context),
        this.roaster.generateRoast(userText, context, media),
      ]);

      const latencyMs = Date.now() - startTime;
      console.log(
        `[AgentRouter] Referee Score: ${refereeVerdict.score}/10 | Point: ${refereeVerdict.earnedPoint} (${latencyMs}ms)`
      );

      return {
        reply: roasterOutput.reply,
        tapback: refereeVerdict.earnedPoint
          ? refereeVerdict.suggestedTapback || "laugh"
          : roasterOutput.tapback || "dislike",
        effect: refereeVerdict.earnedPoint
          ? refereeVerdict.suggestedEffect || "slam"
          : roasterOutput.effect,
        userEarnedPoint: refereeVerdict.earnedPoint,
        intent,
        refereeVerdict,
        modelUsed: "parallel-referee-roaster",
        latencyMs,
      };
    }

    // 3. Media Roast or Ambient Banter
    const roasterOutput = await this.roaster.generateRoast(userText, context, media);
    const latencyMs = Date.now() - startTime;

    return {
      reply: roasterOutput.reply,
      tapback: roasterOutput.tapback,
      effect: roasterOutput.effect,
      userEarnedPoint: false,
      intent,
      modelUsed: media ? "gemini-vision" : "balanced-roaster",
      latencyMs,
    };
  }
}
