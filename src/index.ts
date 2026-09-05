import { Spectrum, attachment } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";
import { config } from "./config.js";
import { ComedicBrain } from "./brain.js";
import { BattleManager } from "./battle.js";
import { createCertificate } from "./certificate.js";
import { WebGateway } from "./server.js";

const isTerminalOnly = process.argv.includes("--terminal");
const isIMessageOnly = process.argv.includes("--imessage");

async function main() {
  console.log(`
  ═══════════════════════════════════════════════════
    🎭  BANTERBOT: THE SAVAGE FRIEND & ROAST BATTLER
    Chaotic, Snobbish & Playfully Rude iMessage Agent
  ═══════════════════════════════════════════════════
  `);

  const brain = new ComedicBrain();
  const battleManager = new BattleManager();
  const webGateway = new WebGateway(brain, battleManager);

  // Start Universal Web Gateway
  const port = Number(process.env.PORT) || 3000;
  await webGateway.start(port);

  const providers: any[] = [];

  if (isTerminalOnly) {
    console.log("🖥️ Mode: Terminal Console Only");
    providers.push(terminal.config());
  } else if (isIMessageOnly) {
    console.log("📱 Mode: Live iMessage Only");
    providers.push(imessage.config());
  } else {
    console.log("🌐 Mode: Dual (Live iMessage + Terminal Console)");
    providers.push(terminal.config());
    providers.push(imessage.config());
  }

  process.on("unhandledRejection", (reason) => {
    console.error("⚠️ Unhandled Rejection intercepted:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("⚠️ Uncaught Exception intercepted:", err);
  });

  let attempt = 0;
  while (true) {
    let app: any = null;
    try {
      attempt++;
      console.log(`[${new Date().toLocaleTimeString()}] 🔌 Initializing Spectrum (attempt ${attempt})...`);

      app = await Spectrum({
        projectId: config.spectrum.projectId,
        projectSecret: config.spectrum.projectSecret,
        providers,
      });

      console.log(`[${new Date().toLocaleTimeString()}] ✨ Spectrum connected! Listening for incoming messages...`);
      console.log("💡 Tip: Text '!battle' or 'fight me' to start a 3-round roast battle.");
      console.log("💡 Tip: Text '!certificate' to view your Certificate of Emotional Damage.");
      attempt = 0;

      for await (const [space, message] of app.messages) {
    try {
      // Ignore messages sent by ourselves
      if ((message as any).isSelf || (message as any).sender?.isSelf) {
        continue;
      }

      const senderId = message.sender?.id || "friend";
      let userText = "";
      let media: any = undefined;

      if (message.content.type === "text") {
        userText = (message.content as any).text || "";
      } else if (message.content.type === "attachment") {
        userText = (message.content as any).caption || "";
        const att = message.content as any;
        if (att.mimeType?.startsWith("image/") || att.mimeType?.startsWith("audio/")) {
          media = {
            mimeType: att.mimeType,
            data: att.data || Buffer.from(""),
          };
        }
      }

      const cleanText = userText.trim();
      const lower = cleanText.toLowerCase();

      console.log(`[${message.platform}] Received from ${senderId}: "${cleanText || "[Media]"}"`);

      // 1. Command handling
      if (lower === "!stats" || lower === "stats") {
        const statsMsg = battleManager.getStatsMessage(senderId);
        await space.send(statsMsg);
        continue;
      }

      if (
        lower === "!certificate" ||
        lower === "!cert" ||
        lower === "certificate" ||
        lower === "!victory" ||
        lower === "!win" ||
        lower.includes("death cert") ||
        lower.includes("victory cert")
      ) {
        await space.responding(async () => {
          const session = battleManager.getSession(senderId);
          const isWin =
            lower === "!victory" ||
            lower === "!win" ||
            lower.includes("victory cert") ||
            (session.stats.wins > 0 && !lower.includes("death"));

          if (isWin) {
            await space.send("Retrieving your Royal Decree of Concession... My pride still hasn't recovered.");
          } else {
            await space.send("Preparing your official Certificate of Emotional Damage, darling. Framing it is entirely optional.");
          }

          try {
            const certPath = await createCertificate({
              victimName: "Challenger",
              victimPhone: senderId,
              cause: isWin
                ? "Flawless psychological warfare against Lord Banterbot III"
                : "Acute chronic humiliation from Banterbot Arena",
              fatalRoast: isWin
                ? "You dared to challenge high society and somehow lived to tell the tale."
                : (session.stats.lastFatalRoast || "Your life choices are an aesthetic offense against humanity."),
              isWin: isWin,
            });
            await space.send(attachment(certPath));
          } catch (certErr) {
            console.error("Failed to generate certificate:", certErr);
            await space.send("Alas, the printer jammed from sheer emotional distress.");
          }
        });
        continue;
      }

      if (lower === "!rules" || lower === "rules") {
        await space.send(
          "📜 ROAST BATTLE RULES 📜\n1. Best 2 out of 3 rounds.\n2. Weak comebacks earn you negative respect.\n3. Legitimate burns inflict emotional damage on Banterbot.\n4. If defeated, you receive a Coroner's Death Certificate.\n5. If victorious, you receive the Royal Decree of Concession.\n6. Type '!battle' to begin."
        );
        continue;
      }

      if (lower === "!reset" || lower === "!forfeit" || lower === "forfeit") {
        const cancelMsg = battleManager.cancelBattle(senderId);
        await space.send(cancelMsg);
        continue;
      }

      if (
        !battleManager.isInBattle(senderId) &&
        (lower === "!battle" ||
          lower.includes("fight me") ||
          lower.includes("roast battle") ||
          lower === "roast me")
      ) {
        const { message: startMsg } = battleManager.startBattle(senderId);
        if (message.react) {
          try {
            await message.react("laugh");
          } catch {}
        }
        await space.send(startMsg);
        continue;
      }

      // 2. Respond with typing indicator
      await space.responding(async () => {
        const battleContext = battleManager.getBattleContext(senderId);
        const response = await brain.generateResponse(cleanText, battleContext, media);

        // Apply Apple tapback if suggested
        if (response.tapback && message.react) {
          try {
            await message.react(response.tapback);
          } catch (reactErr) {
            // Platform might not support tapback
          }
        }

        let fullReply = response.reply;

        // If in battle, record the round
        if (battleContext) {
          const outcome = battleManager.recordRound(
            senderId,
            cleanText,
            response.reply,
            Boolean(response.userEarnedPoint)
          );

          if (!outcome.isFinished) {
            const nextRound = (battleContext.round || 1) + 1;
            fullReply += `\n\n[Round ${nextRound} / 3 — Hit back!]`;
          } else if (outcome.summary) {
            fullReply += outcome.summary;
          }

          // Send outbound message
          console.log(`[${new Date().toLocaleTimeString()}] 📤 Sending battle reply to ${senderId}`);
          await space.send(fullReply);

          // If battle finished, generate and send the appropriate certificate!
          if (outcome.isFinished) {
            try {
              const isWin = Boolean(outcome.isUserWin);
              console.log(`Generating ${isWin ? "Royal Decree of Concession" : "Certificate of Emotional Damage"} for`, senderId);
              const certPath = await createCertificate({
                victimName: "Challenger",
                victimPhone: senderId,
                cause: isWin
                  ? "Lord Banterbot III Slew by Pure Audacity"
                  : "Severe existential lacerations from Banterbot knockout",
                fatalRoast: isWin
                  ? (cleanText || "A roast so sharp it cracked Banterbot's monocle.")
                  : (outcome.fatalRoast || response.reply),
                isWin: isWin,
              });
              await space.send(attachment(certPath));
            } catch (certErr) {
              console.error("Failed to generate or send certificate:", certErr);
            }
          }
          return;
        }

        // Send ambient outbound message
        console.log(`[${new Date().toLocaleTimeString()}] 📤 Sending reply to ${senderId}`);
        await space.send(fullReply);
      });
    } catch (msgErr) {
      console.error("Error processing message:", msgErr);
          try {
            await space.send("Darling, something so offensive occurred even my neural buffers jammed. Try again.");
          } catch {}
        }
      }

      console.warn("⚠️ app.messages loop ended. Re-establishing connection in 3 seconds...");
    } catch (connErr: any) {
      console.error(`💥 Spectrum connection error: ${connErr?.message || connErr}. Reconnecting in 5 seconds...`);
    } finally {
      if (app && typeof app.stop === "function") {
        try {
          await app.stop();
        } catch {}
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

main().catch((err) => {
  console.error("Fatal error in Banterbot:", err);
  process.exit(1);
});
