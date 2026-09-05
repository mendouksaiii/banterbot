import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { config } from "./config.js";

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.log("Usage: node dist/ping.js <phone_number_with_country_code>");
  console.log("Example: node dist/ping.js +15551234567");
  process.exit(1);
}

async function run() {
  console.log(`Connecting to Spectrum to message ${phoneNumber}...`);

  const app = await Spectrum({
    projectId: config.spectrum.projectId,
    projectSecret: config.spectrum.projectSecret,
    providers: [imessage.config()],
  });

  try {
    const im = imessage(app);
    console.log(`Resolving iMessage user for: ${phoneNumber}...`);
    const targetUser = await im.user(phoneNumber);
    console.log(`User found: ${targetUser.address}, service: ${(targetUser as any).service || "iMessage"}`);

    console.log("Creating conversation space...");
    const space = await im.space.create(targetUser);

    console.log("Sending opening message from Banterbot...");
    await space.send(
      "🎭 Darling, prepare your fragile ego. Banterbot has officially arrived in your iMessage. Type '!battle' if you feel like humbling yourself today."
    );

    console.log("✅ Opening message successfully sent! Check your iMessage app.");
  } catch (err) {
    console.error("Error sending initial message:", err);
  } finally {
    if (app.stop) {
      await app.stop();
    }
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
