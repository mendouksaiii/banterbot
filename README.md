# 🎭 Banterbot: Sassy Friend & iMessage Roast Battle Agent

A production-grade, multimodal iMessage agent built with the **Photon Spectrum framework (`spectrum-ts`)**, powered by **Google Gemini 2.5 Flash** (Primary brain: text, vision, audio) with automatic failover to **Groq** (Llama 3.3 / GPT-OSS fallback).

Banterbot is your **chaotic, snobbish, playfully rude best friend** who provides ambient conversational banter throughout the day, critiques your photos, and competes in high-stakes **3-Round iMessage Roast Battles**.

---

## 🌟 Features

* **🎭 The Persona**: A chaotic aristocrat slumming it in your contact list—delivering theatrical shade, high-society condescension, and hilarious mock-outrage.
* **⚔️ 3-Round Roast Battle Arena**:
  * **Round 1**: Opening Jabs (feeling out each other's weak spots)
  * **Round 2**: Personal / Visual Roasts (encourages sending a photo or voice note)
  * **Round 3**: The Knockout Blow
  * Automatic judging, scorecard, and lifetime Win/Loss record persistence.
* **🍏 Native Apple & iMessage Superpowers**:
  * **Real-time typing bubbles**: Native Apple three-dot typing indicator while the LLM cooks.
  * **Tapback Reactions**: Automatically responds with Apple tapbacks (`😆`, `👎`, `❓`, `‼️`, `❤️`).
  * **Bubble & Screen Effects**: Supports `slam`, `gentle`, `invisible` ink, and celebratory effects.
* **🧠 Dual-Brain Architecture**:
  * **Primary**: Google Gemini 2.5 Flash (multimodal text, photo vision analysis, audio).
  * **Fallback**: Groq (ultra-fast backup when Gemini is unavailable).
* **🖥️ Dual Testing Modes**: Run in **Live iMessage Cloud Mode** or **Interactive Terminal Console Mode** for quick local testing.

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js v18+ (tested on Node v24)
* Photon Spectrum Project ID & Secret (configured in `.env`)
* Google Gemini API Key (configured in `.env`)
* Groq API Key (configured in `.env`)

### 2. Run in Terminal Mode (Instant Local Testing)
Test the conversational flow, commands, and roast battles right in your terminal console without sending an SMS/iMessage:

```bash
npm run dev:terminal
```

### 3. Run in Live iMessage Mode
Connects directly to Photon's cloud infrastructure to send and receive real iMessages on your provisioned line:

```bash
npm run dev:imessage
```

---

## 🎮 In-Game Commands

| Command | Description |
| :--- | :--- |
| `!battle` or `fight me` | Initiates an official 3-round roast battle against Banterbot. |
| `!stats` | Displays your lifetime Win/Loss/Draw record and emotional damage status. |
| `!rules` | Displays the rules of the Roast Battle Arena. |
| `!reset` or `!forfeit` | Cancels the active battle (with sarcastic commentary). |

---

## 📁 Project Structure

```
banterbot/
├── .env                  # Project secrets (Photon, Gemini, Groq)
├── package.json          # Dependencies and npm scripts
├── tsconfig.json         # TypeScript compiler configuration
├── stats.json            # Auto-generated persistent user win/loss records
├── src/
│   ├── config.ts         # Environment and model configurations
│   ├── persona.ts        # Calibrated system prompts (Ambient vs. Battle Arena)
│   ├── brain.ts          # Comedic generation engine (Gemini + Groq fallback)
│   ├── battle.ts         # 3-Round state machine and record tracking
│   ├── index.ts          # Spectrum providers (iMessage + Terminal) and event loop
│   └── test-brain.ts     # Automated smoke test suite
└── dist/                 # Compiled JavaScript output
```

---

## 🧪 Testing the Brain

Run the automated smoke test suite to verify Gemini and Groq connectivity:

```bash
npm run test:brain
```
