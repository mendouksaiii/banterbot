import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CertificateData {
  victimName: string;
  victimPhone: string;
  cause: string;
  fatalRoast: string;
  isWin?: boolean;
}

export function createCertificate(data: CertificateData): Promise<string> {
  return new Promise((resolve, reject) => {
    const certsDir = path.resolve(__dirname, "../dist/certificates");
    osEnsureDir(certsDir);

    const isWin = Boolean(data.isWin);
    const prefix = isWin ? "victory" : "cert";
    const outputPath = path.resolve(certsDir, `${prefix}_${Date.now()}.png`);

    let scriptPath = path.resolve(__dirname, "./generate_certificate.py");
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.resolve(__dirname, "../src/generate_certificate.py");
    }

    const args = [
      scriptPath,
      data.victimName || "Challenger",
      data.victimPhone || "Unidentified Mortal",
      data.cause || (isWin ? "Extreme luck and sheer audacity" : "Catastrophic blunt-force verbal trauma"),
      data.fatalRoast || (isWin ? "You actually pulled it off." : "Your life choices are an aesthetic offense."),
      outputPath,
      isWin ? "true" : "false",
    ];

    execFile("python", args, (err, stdout, stderr) => {
      if (err) {
        console.error("Certificate generation error:", stderr || err.message);
        reject(err);
      } else {
        resolve(outputPath);
      }
    });
  });
}

function osEnsureDir(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch {}
}
