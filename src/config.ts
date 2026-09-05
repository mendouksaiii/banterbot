import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface AppConfig {
  spectrum: {
    projectId: string;
    projectSecret: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  groq: {
    apiKey: string;
    model: string;
  };
}

const spectrumProjectId = process.env.SPECTRUM_PROJECT_ID || process.env.PROJECT_ID || "";
const spectrumProjectSecret = process.env.SPECTRUM_PROJECT_SECRET || process.env.PROJECT_SECRET || "";
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const groqApiKey = process.env.GROQ_API_KEY || "";

if (!spectrumProjectId || !spectrumProjectSecret) {
  console.warn("⚠️ Warning: SPECTRUM_PROJECT_ID or SPECTRUM_PROJECT_SECRET is not set.");
}

if (!geminiApiKey) {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not set.");
}

export const config: AppConfig = {
  spectrum: {
    projectId: spectrumProjectId,
    projectSecret: spectrumProjectSecret,
  },
  gemini: {
    apiKey: geminiApiKey,
    model: "gemini-2.5-flash",
  },
  groq: {
    apiKey: groqApiKey,
    model: "openai/gpt-oss-120b",
  },
};
