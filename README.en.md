<div align="center">
  <img src="assets/icon.png" width="120" alt="OpenClawHelper" />
  <h1>OpenClawHelper</h1>
  <p><strong>Visual Configurator for OpenClaw AI Gateway</strong></p>
  <p>
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue" alt="Platform" />
    <img src="https://img.shields.io/badge/Electron-35-47848F?logo=electron" alt="Electron" />
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
  </p>
  <p><a href="README.md">中文</a></p>
</div>

---

## Overview

OpenClawHelper is a desktop GUI for [OpenClaw](https://openclaw.ai) AI Gateway. Manage AI providers, switch primary and fallback models, and monitor live logs — all without touching a config file by hand.

---

## Screenshots

<table>
  <tr>
    <td align="center">
      <img src="assets/screenshots/dashboard.png" alt="Dashboard" width="480"/><br/>
      <sub>Dashboard</sub>
    </td>
    <td align="center">
      <img src="assets/screenshots/AI.png" alt="AI Models" width="480"/><br/>
      <sub>AI Models</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="assets/screenshots/log.png" alt="Live Logs" width="480"/><br/>
      <sub>Live Logs</sub>
    </td>
    <td align="center">
      <img src="assets/screenshots/config.png" alt="System Settings" width="480"/><br/>
      <sub>System Settings</sub>
    </td>
  </tr>
</table>

---

## Features

**🤖 Multi-Provider AI Management**
- 22+ providers: Anthropic, OpenAI, Google Gemini, DeepSeek, xAI Grok, Mistral, Qwen, Zhipu GLM, Doubao, ERNIE, Kimi, and more
- Configure primary model and fallback chain with a single click
- Toggle any provider or individual model on/off visually

**📊 Real-time Dashboard**
- Gateway status, port, primary model, and active provider count at a glance
- One-click restart / start / stop Gateway

**💬 Social Channel Shortcuts**
- Detects configured channels (Telegram, Discord, Slack, Feishu, WhatsApp, Teams, Signal, LINE, and more)
- Auto-detects installed desktop apps; opens app directly or falls back to web

**📋 Live Logs**
- Stream Gateway logs in real time with level filtering (trace / debug / info / warn / error / fatal)
- Keyword search, subsystem filter, virtual scroll (handles 10,000+ entries smoothly)

**⚙️ Config Management**
- Built-in JSON editor (CodeMirror) for direct config file editing
- Smart merge — never overwrites your custom fields

**🎨 Theme & Language**
- Dark / Light / System theme
- Chinese / English UI

---

## Requirements

| | Version |
|---|---|
| macOS | 12 Monterey or later |
| Windows | Windows 10 or later |
| OpenClaw | Must be installed and running |

---

## Install OpenClaw

Before using OpenClawHelper, make sure OpenClaw is installed and running.

- 📖 **Docs**: [docs.openclaw.ai](https://docs.openclaw.ai)
- 🌐 **Website**: [openclaw.ai](https://openclaw.ai)

---

## Download & Install

Go to the [Releases](../../releases) page and download the installer for your platform:

| Platform | File |
|---|---|
| macOS Apple Silicon | `OpenClawHelper-x.x.x-arm64.dmg` |
| macOS Intel | `OpenClawHelper-x.x.x.dmg` |
| Windows | `OpenClawHelper-x.x.x-Setup.exe` |

> **macOS Note**: If you see "unidentified developer" on first launch, go to System Settings → Privacy & Security → click "Open Anyway".

---

## Development

```bash
# Clone repo
git clone https://github.com/your-org/openclaw-configurator.git
cd openclaw-configurator

# Install dependencies
npm install

# Start dev mode
npm run dev

# Build
npm run build:mac    # macOS
npm run build:win    # Windows
```

---

## Supported AI Providers

| Region | Providers |
|---|---|
| International | Anthropic · OpenAI · Google Gemini · DeepSeek · xAI Grok · Mistral AI · Groq · Together AI · Perplexity · Cohere · Fireworks AI · OpenRouter |
| China | Qwen · Zhipu GLM · Doubao · ERNIE · Kimi · StepFun · SiliconFlow · 01.AI · MiMo · MiniMax |

---

## License

MIT © OpenClawHelper Contributors
