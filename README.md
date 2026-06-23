# JARVIS — AI City

A TikTok-style neon **pink AI city**. Tap the central orb to power it on and JARVIS
greets you — *"Hello Jess"* — in a British voice. Each city holds different buildings,
and every building is an AI guide you can open and use.

## Preview it

No build step required. Just open `index.html` in a modern browser
(Chrome/Edge recommended for voice). Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Click the **JARVIS orb** in the centre to power on the city and hear the greeting.
Use the **mic** (orb or the input bar) to ask anything, or type a message.

The scene is a neon-pink futuristic **cityscape**: a nebula starfield sky with drifting
clouds, flowing light-trail highways, and a skyline of 3D glowing towers with lit windows
— **each tower is an AI agent**. Click a tower to open that guide; power on to light the
windows. Switching cities swaps which agents (towers) appear.

## Cities & buildings

Switch cities from the rail near the top. Each city has its own buildings:

> **Every tower is an agent with a job — not decoration.** Each building exists to produce a
> useful deliverable you can act on (a priority plan, an image prompt, a memory structure, an AI
> workflow, a drafted message, a risk check, and so on). Even the abstract-sounding *core* towers
> (DIVA Core, Vision Lab, Data Vault, Neural Forge, Comms Tower, Sentinel) do real work — see
> **[Real-world actions](#real-world-actions-agents-that-do-things)** below.

- **🎨 Creator City** — **Suno Helper**, **Book Helper**, Design Tower, Editing Library
- **🧠 Mind City** — JARVIS Core, Memory Vault, Research District, Neural Forge
- **👁 Vision City** — Vision Lab, Data Vault, Comms Tower, Sentinel
- **🚀 Launch City** — Project Lab, Operations Center, Design Tower, Data Vault
- **👑 Empire City** — **Business Builder**, **App Trend Builder**, Design Tower, Project Lab

### Empire City guides

1. **👑 Business Builder** — build a clothing brand end-to-end: brand name + tagline ideas,
   a product line with fabrics & mockup briefs, full **Shopify** listings, **Canva** template
   plans, **printables / print-on-demand** products, a 14-day **TikTok** content calendar
   with viral hooks, an interactive **profit calculator**, an email-flow generator, and a
   launch checklist — plus a grid of sub-agents (Brand, Product, Shopify, Canva, Printables,
   TikTok, Pricing, Email, Launch, Growth).
2. **📱 App Trend Builder** — invents **brand-new, original** app ideas by combining domains,
   mechanics, audiences and twists, then passing each through a **clone filter** so it never
   copies a known app. Expand any idea into a full spec (problem, features, monetization, tech
   stack, MVP plan, go-to-market), browse a **trend radar**, and generate registrable app names.

### The two headline guides (Creator City)

1. **🎙️ Suno Helper** — generate lyrics & hooks, **Suno prompts**, **music video ideas**,
   and album concepts. Pick a genre + mood, record voice notes, save drafts.
2. **📖 Book Helper** — generate book outlines, chapters, blurbs, characters and titles —
   plus a **Humanizer** that rewrites AI-sounding text to read like a real person, with a
   live "human score".

## Live AI (optional) — truly generative output

By default every building generates from rich local templates (no API key needed —
just open `index.html`). To make JARVIS *truly generative*, run the included
zero-dependency proxy with a Claude API key:

```bash
ANTHROPIC_API_KEY=sk-ant-... node server.js
# then open http://localhost:8000

# Optional: add a human-level DIVA voice with ElevenLabs
ANTHROPIC_API_KEY=sk-ant-... ELEVENLABS_API_KEY=sk_... node server.js
```

The proxy (`server.js`) serves the app **and** forwards prompts to the Claude API
(`claude-opus-4-8`) — the key stays on the server and never reaches the browser.
When it's live:

- The HUD shows **AI LIVE**, and the orb/chat "ask anything" answers come straight
  from Claude (in JARVIS's British voice).
- **Business Builder → ✨ AI Boost** turns any template draft into sharper,
  brand-specific, ready-to-use copy.
- **App Trend Builder → ✨ AI Ideas** invents genuinely original app concepts with
  the model (with a "no clones" instruction), not just the combinatorial engine.

- **Human-level voice (ElevenLabs):** set `ELEVENLABS_API_KEY` and DIVA speaks
  through a real ElevenLabs voice (default **"Alice"**, British female — override
  with `ELEVENLABS_VOICE_ID`). The audio is streamed via `/api/tts` so the key
  stays on the server. Without it, DIVA uses the browser's built-in British voice.

### Make the human voice work on the live (GitHub Pages) site

The Pages site is static, so the human voice needs the backend hosted somewhere.
It's one-click ready:

1. Deploy this repo to a Node host (free tiers work). On **Render**: New → Blueprint
   → pick this repo (it reads `render.yaml`), or use the included `Dockerfile`/`Procfile`
   on Railway/Fly/etc. `npm start` runs `node server.js`.
2. In the host's dashboard set the secrets: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`
   (and optionally `ELEVENLABS_VOICE_ID`, `ALLOWED_ORIGIN`). Keys live there, never in the repo.
3. Copy your deployed URL into **`js/config.js`** → `window.JARVIS_API_BASE = 'https://your-app.onrender.com';`
   and commit. The live site then uses that backend for live Claude + the ElevenLabs voice.

- **Live market data (Polygon):** set `POLYGON_API_KEY` and the **Trade Desk**
  agent auto-fills real prices — `/api/quote` and `/api/recap` (indices + top
  gainers/losers). The key stays on the server. Without it, Trade Desk uses its
  rule-based templates and shows how to wire the feed. *Educational only — not
  financial advice.*

## Real-world actions (agents that DO things)

Every building — including the abstract-sounding *core* towers — is a working agent whose chips map
to a clear user goal and return a **concrete deliverable** (offline templates, or full AI output
when **✨ Connect AI** is on). No more "for-looks" checklists:

| Tower | Job (user goal) | Deliverable it produces |
| --- | --- | --- |
| 🧠 **DIVA Core** | Untangle messy goals | A **priority plan** — top-3 + backlog + first step |
| 👁 **Vision Lab** | Turn an idea into visuals | A **visual brief + ready-to-paste image prompts** |
| 📚 **Data Vault** | Organise scattered notes | A **memory structure** — folders, tags, cheat sheet |
| ⚡ **Neural Forge** | Stop redoing the same task | A **reusable AI workflow / prompt system** |
| 📡 **Comms Tower** | Send the message | A **drafted email / reply** (send it via a webhook) |
| 🛡 **Sentinel** | Ship safely | A **risk gate** — red flags + a safer version |
| 📝 **Editing Library** | Make text human | **Polished, ready-to-publish copy** |
| 🔬 **Research District** | Answer a question well | A **research plan + key findings** |
| 🧱 **Project Lab** | Actually ship a project | A **sprint plan** — tasks, milestones, retro |
| 🛠 **Operations Center** | Automate the boring stuff | An **automation map** — trigger → action + SOP |

- **Automation webhook (works with no server):** in **✨ Connect AI** paste a free
  **Zapier Catch Hook / Make / n8n** webhook URL. Every agent's **⚡ Run automation**
  button POSTs `{agent, action, input, result}` to it — your automation then sends
  the email, posts, adds a row, etc. The URL lives only in your browser.
- **Email (hosted):** set `RESEND_API_KEY` (+ `MAIL_FROM`) and `POST /api/send-email`
  sends real email server-side.

Until `JARVIS_API_BASE` is set, **nothing changes** — DIVA keeps the current browser British voice.

Without the server, those buttons explain how to enable live AI and the app keeps
working on templates. Copy `.env.example` for the variables you can set.

## Voice & "ask anything"

- British-accented greeting that says **Hello Jess** on power-on.
- The orb and the conversation bar both listen via the mic.
- A local **JARVIS brain** answers anything — small talk, the time/date, quick maths,
  what it can do — and routes creative requests ("write me a song", "help me write a book")
  straight to the right building.

## Project layout

- `index.html` — app shell
- `js/main.js` — city/state/router, voice engine, workspace modal, **CityManager**
- `js/jarvis-brain.js` — local "ask anything" responder
- `js/songwriting-studio.js` — Suno Helper workspace
- `js/book-helper.js` — Book Helper workspace + Humanizer
- `js/design-tower.js`, `js/memory-vault.js` — additional building workspaces
- `js/business-builder.js` — Business Builder workspace (brand, Shopify, Canva, printables, TikTok, pricing)
- `js/app-trend-builder.js` — App Trend Builder workspace (original app-idea generator)
- `server.js` — optional zero-dependency static server + Claude API proxy (`/api/generate`)
- `js/ai-client.js` — browser bridge to the proxy; falls back to templates when offline
- `styles/` — themed CSS per area
