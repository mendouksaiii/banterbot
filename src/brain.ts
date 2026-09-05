import { AgentRouter } from "./router/agent-router.js";
import { AgentResponse, InboundMedia, TapbackType, BubbleEffect } from "./router/types.js";
import { BattleContext } from "./persona.js";

export { AgentResponse, InboundMedia, TapbackType, BubbleEffect };

export class ComedicBrain {
  private router: AgentRouter;

  constructor() {
    this.router = new AgentRouter();
  }

  /**
   * Main generation method: delegates directly to the Agent Router.
   */
  async generateResponse(
    userText: string,
    context?: BattleContext,
    media?: InboundMedia
  ): Promise<AgentResponse> {
    return this.router.route(userText, context, media);
  }
}
