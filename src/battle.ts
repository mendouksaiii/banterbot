import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BattleContext } from "./persona.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATS_FILE = path.resolve(__dirname, "../stats.json");

export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  emotionalDamage: string;
  lastFatalRoast?: string;
}

export interface UserSession {
  userId: string;
  stats: UserStats;
  currentBattle?: {
    round: number; // 1, 2, 3
    userScore: number;
    botScore: number;
    history: string[];
  };
}

export class BattleManager {
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.loadStats();
  }

  private loadStats() {
    try {
      if (fs.existsSync(STATS_FILE)) {
        const raw = fs.readFileSync(STATS_FILE, "utf-8");
        const data = JSON.parse(raw);
        for (const [id, stats] of Object.entries(data)) {
          this.sessions.set(id, {
            userId: id,
            stats: stats as UserStats,
          });
        }
      }
    } catch (e) {
      console.warn("Could not load stats.json, initializing fresh store:", e);
    }
  }

  private saveStats() {
    try {
      const data: Record<string, UserStats> = {};
      for (const [id, session] of this.sessions.entries()) {
        data[id] = session.stats;
      }
      fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save stats.json:", e);
    }
  }

  getSession(userId: string): UserSession {
    let session = this.sessions.get(userId);
    if (!session) {
      session = {
        userId,
        stats: {
          wins: 0,
          losses: 0,
          draws: 0,
          emotionalDamage: "Minimal (for now)",
        },
      };
      this.sessions.set(userId, session);
    }
    return session;
  }

  startBattle(userId: string): { message: string; context: BattleContext } {
    const session = this.getSession(userId);
    session.currentBattle = {
      round: 1,
      userScore: 0,
      botScore: 0,
      history: [],
    };

    const context: BattleContext = {
      inBattle: true,
      round: 1,
      userScore: 0,
      botScore: 0,
      history: [],
    };

    return {
      message: `🔔 ROAST BATTLE ARENA: ROUND 1 / 3 🔔\n\nDarling, prepare your feeble ego. Opening jabs only. Hit me with whatever weak insult you spent all morning thinking up.`,
      context,
    };
  }

  isInBattle(userId: string): boolean {
    return Boolean(this.getSession(userId).currentBattle);
  }

  getBattleContext(userId: string): BattleContext | undefined {
    const battle = this.getSession(userId).currentBattle;
    if (!battle) return undefined;
    return {
      inBattle: true,
      round: battle.round,
      userScore: battle.userScore,
      botScore: battle.botScore,
      history: battle.history,
    };
  }

  recordRound(
    userId: string,
    userText: string,
    botReply: string,
    userEarnedPoint: boolean
  ): { isFinished: boolean; summary?: string; isUserLoss?: boolean; isUserWin?: boolean; fatalRoast?: string } {
    const session = this.getSession(userId);
    const battle = session.currentBattle;
    if (!battle) return { isFinished: false };

    if (userEarnedPoint) {
      battle.userScore += 1;
    } else {
      battle.botScore += 1;
    }

    battle.history.push(`User: ${userText}`);
    battle.history.push(`Banterbot: ${botReply}`);

    if (battle.round < 3) {
      battle.round += 1;
      return { isFinished: false };
    }

    // Battle finished after Round 3!
    const isFinished = true;
    let summary = "";
    const isUserLoss = battle.botScore > battle.userScore;
    const isUserWin = battle.userScore > battle.botScore;

    if (isUserWin) {
      session.stats.wins += 1;
      session.stats.emotionalDamage = "Banterbot in tears";
      summary = `\n\n🏆 FINAL SCORE: You: ${battle.userScore} | Banterbot: ${battle.botScore}\nUNBELIEVABLE. You actually won. I will be consulting my therapist and estate lawyer immediately. Dispatching your Royal Decree of Concession...`;
    } else if (isUserLoss) {
      session.stats.losses += 1;
      session.stats.emotionalDamage = "Catastrophic";
      session.stats.lastFatalRoast = botReply;
      summary = `\n\n💀 FINAL SCORE: Banterbot: ${battle.botScore} | You: ${battle.userScore}\nFlawless victory for high society. Apply ice directly to your wounded pride, darling. Preparing your official Coroner's Report...`;
    } else {
      session.stats.draws += 1;
      session.stats.emotionalDamage = "Mutual disdain";
      summary = `\n\n🤝 FINAL SCORE: TIE (${battle.userScore} - ${battle.botScore})\nA draw. Disappointing for both of us, but mostly embarrassing for you.`;
    }

    session.currentBattle = undefined;
    this.saveStats();
    return { isFinished, summary, isUserLoss, isUserWin, fatalRoast: botReply };
  }

  getStatsMessage(userId: string): string {
    const stats = this.getSession(userId).stats;
    return `📊 YOUR BANTERBOT RECORD 📊\n• Wins: ${stats.wins}\n• Losses: ${stats.losses}\n• Draws: ${stats.draws}\n• Emotional Damage: ${stats.emotionalDamage}\n\nType '!battle' for a rematch or '!certificate' to view your official credential.`;
  }

  cancelBattle(userId: string): string {
    const session = this.getSession(userId);
    if (!session.currentBattle) {
      return "We aren't even in a battle, darling. Stop shadowboxing.";
    }
    session.currentBattle = undefined;
    return "Battle forfeit! Running away like a coward, I see. Expected, but noted.";
  }
}
