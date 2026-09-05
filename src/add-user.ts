import { config } from "./config.js";

const phone = process.argv[2];
const name = process.argv[3] || "Friend";

if (!phone) {
  console.log("Usage: npm run add-friend <phone_number_with_country_code> [name]");
  console.log("Example: npm run add-friend +15551234567 Dave");
  process.exit(1);
}

async function addFriend() {
  const projectId = config.spectrum.projectId;
  const projectSecret = config.spectrum.projectSecret;
  const authHeader = "Basic " + Buffer.from(`${projectId}:${projectSecret}`).toString("base64");

  console.log(`Registering ${name} (${phone}) on Banterbot...`);

  const res = await fetch(`https://spectrum.photon.codes/projects/${projectId}/users/`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "shared",
      phoneNumber: phone,
      firstName: name,
    }),
  });

  const data = (await res.json()) as any;

  if (res.ok && data.succeed) {
    console.log(`\n🎉 Success! ${name} has been authorized to access Banterbot.`);
    console.log(`👉 Tell them to text iMessage to: ${data.data.assignedPhoneNumber}\n`);
  } else {
    console.error("Failed to add friend:", data);
  }
}

addFriend().catch(console.error);
