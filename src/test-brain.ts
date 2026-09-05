import { ComedicBrain } from "./brain.js";
import { BattleManager } from "./battle.js";

async function test() {
  console.log("🔥 Testing Banterbot Agent Router, Referee & Battle Arena...\n");

  const brain = new ComedicBrain();
  const battleManager = new BattleManager();
  const testUser = "test_user_42";

  // Test 1: Sub-200ms Quick Reaction
  console.log("--- TEST 1: SUB-SECOND FAST REACTION ---");
  const quickText = "💀";
  console.log(`User: "${quickText}"`);
  const quickRes = await brain.generateResponse(quickText);
  console.log(`Intent: ${quickRes.intent}`);
  console.log(`Model Used: ${quickRes.modelUsed} (${quickRes.latencyMs}ms)`);
  console.log(`Banterbot: "${quickRes.reply}"`);
  console.log(`Tapback: ${quickRes.tapback || "none"}\n`);

  // Test 2: Ambient Banter
  console.log("--- TEST 2: AMBIENT BANTER ---");
  const text1 = "I just woke up at 2 PM and I'm eating cold cereal in bed.";
  console.log(`User: "${text1}"`);
  const res1 = await brain.generateResponse(text1);
  console.log(`Intent: ${res1.intent} (${res1.latencyMs}ms)`);
  console.log(`Banterbot: "${res1.reply}"`);
  console.log(`Suggested Tapback: ${res1.tapback || "none"}`);
  console.log(`Suggested Effect: ${res1.effect || "none"}\n`);

  // Test 3: Start Battle
  console.log("--- TEST 3: START BATTLE ARENA ---");
  const { message: startMsg, context } = battleManager.startBattle(testUser);
  console.log(`Arena Announcement:\n${startMsg}\n`);

  // Test 4: Parallel Referee + Roaster Execution (Cliché Roast)
  console.log("--- TEST 4: PARALLEL BATTLE EVALUATION (CLICHÉ ROAST) ---");
  const clicheBurn = "You are ugly and your mom dresses you funny.";
  console.log(`User Roast: "${clicheBurn}"`);
  const resCliche = await brain.generateResponse(clicheBurn, context);
  console.log(`Intent: ${resCliche.intent} (${resCliche.latencyMs}ms)`);
  console.log(`Referee Score: ${resCliche.refereeVerdict?.score}/10 (Earned Point: ${resCliche.userEarnedPoint})`);
  console.log(`Referee Critique: "${resCliche.refereeVerdict?.critique}"`);
  console.log(`Banterbot Counter-Roast: "${resCliche.reply}"`);
  console.log(`Suggested Tapback: ${resCliche.tapback}`);
  console.log(`Suggested Effect: ${resCliche.effect || "none"}\n`);

  // Test 5: Parallel Referee + Roaster Execution (Creative Burn)
  console.log("--- TEST 5: PARALLEL BATTLE EVALUATION (CREATIVE BURN) ---");
  const creativeBurn =
    "Looking at your life choices today I finally understand why ghosts prefer to haunt dark basements rather than look upon the living.";
  console.log(`User Roast: "${creativeBurn}"`);
  const resCreative = await brain.generateResponse(creativeBurn, context);
  console.log(`Intent: ${resCreative.intent} (${resCreative.latencyMs}ms)`);
  console.log(`Referee Score: ${resCreative.refereeVerdict?.score}/10 (Earned Point: ${resCreative.userEarnedPoint})`);
  console.log(`Referee Critique: "${resCreative.refereeVerdict?.critique}"`);
  console.log(`Banterbot Counter-Roast: "${resCreative.reply}"`);
  console.log(`Suggested Tapback: ${resCreative.tapback}`);
  console.log(`Suggested Effect: ${resCreative.effect || "none"}\n`);

  console.log("✅ All smoke tests passed successfully!");
}

test().catch(console.error);
