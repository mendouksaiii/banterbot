import { IntentType, InboundMedia } from "./types.js";
import { BattleContext } from "../persona.js";

const QUICK_REACTION_PATTERN =
  /^(\b(lol|lmao|lmfao|haha+|hehe+|bruh|bro|omg|smh|nah|k|ok|alright|bye|yo|shut up|what|wait+)\b|[\u{1F480}\u{1F602}\u{1F923}\u{1F62D}\u{1F921}\u{1F44D}\u{1F44E}\u{1F525}\u{1F440}\u{1F485}\u{2728}]+|\?{1,3}|!{1,3})$/iu;

export function classifyIntent(
  text: string,
  battleContext?: BattleContext,
  media?: InboundMedia
): IntentType {
  const clean = text.trim();

  // 1. Media Roast
  if (media && media.data && media.data.length > 0) {
    return "MEDIA_ROAST";
  }

  // 2. Pure Quick Reaction (e.g. "💀", "lol", "wait wait wait", "bruh")
  const isShortReaction =
    clean.length <= 15 &&
    (QUICK_REACTION_PATTERN.test(clean) ||
      clean.toLowerCase() === "wait wait waittttttttt" ||
      clean.toLowerCase().startsWith("wait"));

  if (isShortReaction && !clean.toLowerCase().startsWith("!")) {
    return "QUICK_REACTION";
  }

  // 3. Battle Punchline
  if (battleContext?.inBattle) {
    return "BATTLE_PUNCHLINE";
  }

  // 4. Default Ambient Banter
  return "AMBIENT_BANTER";
}
