import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { config } from "../config.js";
import { InboundMedia } from "./types.js";

export interface GenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  preferredTier?: "FAST" | "BALANCED" | "VISION" | "DEEP";
  temperature?: number;
  media?: InboundMedia;
}

export interface ModelResult<T = any> {
  data: T;
  rawText: string;
  model: string;
  provider: "groq" | "gemini" | "openrouter";
  latencyMs: number;
}

export class ModelRouter {
  private gemini?: GoogleGenerativeAI;
  private groq?: Groq;
  private openRouterKey?: string;

  constructor() {
    if (config.gemini.apiKey) {
      this.gemini = new GoogleGenerativeAI(config.gemini.apiKey);
    }
    if (config.groq.apiKey) {
      this.groq = new Groq({ apiKey: config.groq.apiKey });
    }
    this.openRouterKey = process.env.OPENROUTER_API_KEY;
  }

  /**
   * Generates a structured JSON object with automatic multi-model failover.
   */
  async generateJson<T = any>(opts: GenerateOptions): Promise<ModelResult<T>> {
    const start = Date.now();

    // 1. If media is provided, we MUST use a vision-capable provider (Gemini first)
    if (opts.media) {
      try {
        const res = await this.callGeminiVision<T>(opts);
        return {
          ...res,
          latencyMs: Date.now() - start,
        };
      } catch (geminiErr) {
        console.warn("⚠️ Gemini Vision failed, attempting text-only fallback:", geminiErr);
        const res = await this.callGroqJson<T>({
          ...opts,
          userPrompt: `[User sent an image/audio which could not be rendered: ${opts.userPrompt}]`,
        });
        return { ...res, latencyMs: Date.now() - start };
      }
    }

    // 2. Fast Tier (Groq Llama 3.1 8B instant for sub-200ms reactions)
    if (opts.preferredTier === "FAST" && this.groq) {
      try {
        const res = await this.callGroqFastJson<T>(opts);
        return { ...res, latencyMs: Date.now() - start };
      } catch (fastErr) {
        console.warn("⚠️ Groq Fast tier failed, falling back to Gemini:", fastErr);
      }
    }

    // 3. Balanced Tier: Gemini 2.5 Flash first, failover to Groq 70B
    if (this.gemini) {
      try {
        const res = await this.callGeminiJson<T>(opts);
        return { ...res, latencyMs: Date.now() - start };
      } catch (geminiErr) {
        console.warn("⚠️ Gemini request failed, falling back to Groq 70B:", geminiErr);
      }
    }

    // 4. Groq 70B
    if (this.groq) {
      try {
        const res = await this.callGroqJson<T>(opts);
        return { ...res, latencyMs: Date.now() - start };
      } catch (groqErr) {
        console.warn("⚠️ Groq request failed, checking OpenRouter:", groqErr);
      }
    }

    // 5. OpenRouter fallback if configured
    if (this.openRouterKey) {
      try {
        const res = await this.callOpenRouterJson<T>(opts);
        return { ...res, latencyMs: Date.now() - start };
      } catch (openRouterErr) {
        console.error("💥 All model router providers failed:", openRouterErr);
      }
    }

    throw new Error("All model providers failed or are unconfigured.");
  }

  // --- Provider Implementations ---

  private async callGroqFastJson<T>(opts: GenerateOptions): Promise<{ data: T; rawText: string; model: string; provider: "groq" }> {
    const model = "openai/gpt-oss-20b";
    const completion = await this.groq!.chat.completions.create({
      model,
      messages: [
        { role: "system", content: opts.systemPrompt + "\n\nReturn output ONLY as valid JSON." },
        { role: "user", content: opts.userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: opts.temperature ?? 0.8,
    });
    const rawText = completion.choices[0]?.message?.content || "{}";
    return { data: JSON.parse(rawText), rawText, model, provider: "groq" };
  }

  private async callGroqJson<T>(opts: GenerateOptions): Promise<{ data: T; rawText: string; model: string; provider: "groq" }> {
    const model = config.groq.model || "llama-3.3-70b-versatile";
    const completion = await this.groq!.chat.completions.create({
      model,
      messages: [
        { role: "system", content: opts.systemPrompt + "\n\nReturn output ONLY as valid JSON." },
        { role: "user", content: opts.userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: opts.temperature ?? 0.9,
    });
    const rawText = completion.choices[0]?.message?.content || "{}";
    return { data: JSON.parse(rawText), rawText, model, provider: "groq" };
  }

  private async callGeminiJson<T>(opts: GenerateOptions): Promise<{ data: T; rawText: string; model: string; provider: "gemini" }> {
    const modelName = config.gemini.model || "gemini-2.5-flash";
    const model = this.gemini!.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: opts.temperature ?? 0.9,
      },
      systemInstruction: opts.systemPrompt + "\n\nReturn output strictly as a valid JSON object.",
    });

    const result = await model.generateContent(opts.userPrompt);
    const rawText = result.response.text();
    return { data: JSON.parse(rawText), rawText, model: modelName, provider: "gemini" };
  }

  private async callGeminiVision<T>(opts: GenerateOptions): Promise<{ data: T; rawText: string; model: string; provider: "gemini" }> {
    const modelName = config.gemini.model || "gemini-2.5-flash";
    const model = this.gemini!.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: opts.temperature ?? 0.9,
      },
      systemInstruction: opts.systemPrompt + "\n\nReturn output strictly as a valid JSON object.",
    });

    const parts: any[] = [
      {
        inlineData: {
          mimeType: opts.media!.mimeType,
          data: opts.media!.data.toString("base64"),
        },
      },
      {
        text: opts.userPrompt || "[Roast this visual evidence with aristocratic condescension]",
      },
    ];

    const result = await model.generateContent(parts);
    const rawText = result.response.text();
    return { data: JSON.parse(rawText), rawText, model: modelName, provider: "gemini" };
  }

  private async callOpenRouterJson<T>(opts: GenerateOptions): Promise<{ data: T; rawText: string; model: string; provider: "openrouter" }> {
    const model = "meta-llama/llama-3.3-70b-instruct";
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.systemPrompt + "\n\nReturn output ONLY as valid JSON." },
          { role: "user", content: opts.userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: opts.temperature ?? 0.9,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter HTTP ${res.status}: ${await res.text()}`);
    }
    const json: any = await res.json();
    const rawText = json.choices[0]?.message?.content || "{}";
    return { data: JSON.parse(rawText), rawText, model, provider: "openrouter" };
  }
}
