import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ComedicBrain } from "./brain.js";
import { BattleManager } from "./battle.js";
import { createCertificate } from "./certificate.js";
import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const CERTS_DIR = path.resolve(__dirname, "../dist/certificates");

export class WebGateway {
  private brain: ComedicBrain;
  private battleManager: BattleManager;
  private server: http.Server;

  constructor(brain: ComedicBrain, battleManager: BattleManager) {
    this.brain = brain;
    this.battleManager = battleManager;
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
  }

  start(port: number = 3000): Promise<number> {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`🌐 Banterbot Web Gateway running at http://localhost:${port}`);
        resolve(port);
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    // Enable CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    // --- API ROUTES ---
    if (url.pathname === "/api/chat" && req.method === "POST") {
      return this.handleChat(req, res);
    }

    if (url.pathname === "/api/register" && req.method === "POST") {
      return this.handleRegister(req, res);
    }

    if (url.pathname.startsWith("/api/stats/") && req.method === "GET") {
      const userId = decodeURIComponent(url.pathname.replace("/api/stats/", ""));
      const session = this.battleManager.getSession(userId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(session.stats));
      return;
    }

    // --- STATIC FILES (Certificates) ---
    if (url.pathname.startsWith("/certificates/")) {
      const fileName = path.basename(url.pathname);
      const filePath = path.join(CERTS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { "Content-Type": "image/png" });
        return fs.createReadStream(filePath).pipe(res);
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Certificate not found");
      return;
    }

    // --- STATIC FILES (Web App UI) ---
    let filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PUBLIC_DIR, "index.html");
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css",
        ".js": "application/javascript",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".json": "application/json",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "text/plain" });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }

  private async handleChat(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      const body = await this.readJsonBody(req);
      const userText = (body.message || "").trim();
      const userId = body.userId || "web_guest";
      const media = body.media ? { mimeType: body.media.mimeType, data: Buffer.from(body.media.base64, "base64") } : undefined;
      const lower = userText.toLowerCase();

      // 1. Command handling
      if (lower === "!rules" || lower === "rules") {
        return this.sendJson(res, {
          reply: "📜 ROAST BATTLE RULES 📜\n1. Best 2 out of 3 rounds.\n2. Weak comebacks earn 0 respect.\n3. Legitimate burns inflict emotional damage on Banterbot.\n4. If defeated, you receive a Coroner's Death Certificate.\n5. If victorious, you receive the Royal Decree of Concession.\n6. Type '!battle' to begin.",
          tapback: "like",
        });
      }

      if (lower === "!stats" || lower === "stats") {
        const statsMsg = this.battleManager.getStatsMessage(userId);
        return this.sendJson(res, { reply: statsMsg, tapback: "emphasize" });
      }

      if (lower === "!forfeit" || lower === "!reset") {
        const cancelMsg = this.battleManager.cancelBattle(userId);
        return this.sendJson(res, { reply: cancelMsg, tapback: "dislike" });
      }

      if (
        lower === "!certificate" ||
        lower === "!cert" ||
        lower === "!victory" ||
        lower === "!win" ||
        lower.includes("death cert")
      ) {
        const session = this.battleManager.getSession(userId);
        const isWin = lower === "!victory" || lower === "!win" || (session.stats.wins > 0 && !lower.includes("death"));
        const certPath = await createCertificate({
          victimName: "Web Challenger",
          victimPhone: userId,
          cause: isWin ? "Flawless psychological warfare" : "Acute chronic humiliation from Banterbot Arena",
          fatalRoast: isWin ? "You dared to challenge high society and somehow survived." : (session.stats.lastFatalRoast || "Your life choices are an aesthetic offense."),
          isWin,
        });
        const certFileName = path.basename(certPath);
        return this.sendJson(res, {
          reply: isWin ? "Retrieving your Royal Decree of Concession... My pride remains in critical condition." : "Official Coroner's Report issued. Framing it is entirely optional.",
          certificateUrl: `/certificates/${certFileName}`,
          tapback: isWin ? "emphasize" : "laugh",
          effect: isWin ? "confetti" : "slam",
        });
      }

      if (
        !this.battleManager.isInBattle(userId) &&
        (lower === "!battle" || lower.includes("fight me") || lower.includes("roast battle") || lower === "roast me")
      ) {
        const { message: startMsg } = this.battleManager.startBattle(userId);
        return this.sendJson(res, {
          reply: startMsg,
          tapback: "laugh",
          inBattle: true,
          round: 1,
        });
      }

      // 2. Normal / Battle response via Agent Router
      const battleContext = this.battleManager.getBattleContext(userId);
      const response = await this.brain.generateResponse(userText, battleContext, media);

      let fullReply = response.reply;
      let certificateUrl: string | undefined = undefined;

      if (battleContext) {
        const outcome = this.battleManager.recordRound(
          userId,
          userText,
          response.reply,
          Boolean(response.userEarnedPoint)
        );

        if (!outcome.isFinished) {
          const nextRound = (battleContext.round || 1) + 1;
          fullReply += `\n\n[Round ${nextRound} / 3 — Hit back!]`;
        } else if (outcome.summary) {
          fullReply += outcome.summary;
        }

        if (outcome.isFinished) {
          const isWin = Boolean(outcome.isUserWin);
          const certPath = await createCertificate({
            victimName: "Web Challenger",
            victimPhone: userId,
            cause: isWin ? "Lord Banterbot III Slew by Pure Audacity" : "Severe existential lacerations from knockout",
            fatalRoast: isWin ? (userText || "A roast so sharp it cracked Banterbot's monocle.") : (outcome.fatalRoast || response.reply),
            isWin,
          });
          certificateUrl = `/certificates/${path.basename(certPath)}`;
        }

        return this.sendJson(res, {
          reply: fullReply,
          tapback: response.tapback,
          effect: response.effect,
          inBattle: !outcome.isFinished,
          round: battleContext.round,
          userEarnedPoint: response.userEarnedPoint,
          refereeVerdict: (response as any).refereeVerdict,
          certificateUrl,
          stats: this.battleManager.getSession(userId).stats,
        });
      }

      // Ambient reply
      return this.sendJson(res, {
        reply: fullReply,
        tapback: response.tapback,
        effect: response.effect,
        stats: this.battleManager.getSession(userId).stats,
      });
    } catch (err: any) {
      console.error("WebGateway chat error:", err);
      return this.sendJson(res, { error: err.message || "Something went wrong." }, 500);
    }
  }

  private async handleRegister(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
      const body = await this.readJsonBody(req);
      const phone = (body.phoneNumber || "").trim();
      const name = (body.firstName || "Friend").trim();

      if (!phone) {
        return this.sendJson(res, { error: "Phone number is required." }, 400);
      }

      const authHeader = "Basic " + Buffer.from(`${config.spectrum.projectId}:${config.spectrum.projectSecret}`).toString("base64");
      const resp = await fetch(`https://spectrum.photon.codes/projects/${config.spectrum.projectId}/users/`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "shared",
          phoneNumber: phone,
          firstName: name,
        }),
      });

      const data = (await resp.json()) as any;
      if (resp.ok && data.succeed) {
        return this.sendJson(res, {
          success: true,
          assignedPhoneNumber: data.data.assignedPhoneNumber,
          message: `Success! ${name} is authorized. Text +1 (415) 595-2354 on iMessage to begin!`,
        });
      } else {
        return this.sendJson(res, { error: data.message || "Failed to register on carrier network." }, 400);
      }
    } catch (err: any) {
      return this.sendJson(res, { error: err.message || "Registration failed." }, 500);
    }
  }

  private readJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  private sendJson(res: http.ServerResponse, data: any, status: number = 200) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
}
