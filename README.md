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

## Cities & buildings

Switch cities from the rail near the top. Each city has its own buildings:

- **🎨 Creator City** — **Suno Helper**, **Book Helper**, Design Tower, Editing Library
- **🏬 Business City** — **Business Builder**, **App Trend Builder**, Design Tower, Operations Center
- **🧠 Mind City** — JARVIS Core, Memory Vault, Research District, Neural Forge
- **👁 Vision City** — Vision Lab, Data Vault, Comms Tower, Sentinel
- **🚀 Launch City** — Project Lab, Operations Center, Design Tower, Data Vault

### The two headline guides (Creator City)

1. **🎙️ Suno Helper** — generate lyrics & hooks, **Suno prompts**, **music video ideas**,
   and album concepts. Pick a genre + mood, record voice notes, save drafts.
2. **📖 Book Helper** — generate book outlines, chapters, blurbs, characters and titles —
   plus a **Humanizer** that rewrites AI-sounding text to read like a real person, with a
   live "human score".

### Business City — two AI agent buildings

1. **🏬 Business Builder** — one agent for a whole brand: clothing design briefs &
   print prompts, Shopify listings + store names, Canva template concepts, **printables /
   POD** (planners, wall art, journals), TikTok content plans, brand kits, niche finder,
   pricing & margins, a 7-day launch calendar, email/SMS flows and ad copy. Hit
   **Build Everything** for a full brand pack tuned to your niche, audience and vibe.
2. **💡 App Trend Builder** — invents **brand-new app ideas on demand** by fusing two
   unrelated domains with emerging tech and a retention mechanic, so ideas are original
   rather than clones. Each card includes the problem, solution, why it's new, core
   features, monetization, a viral growth hook, MVP scope and a tech stack. Generate one
   or five at a time, pin the winners, or send to Project Lab.

## Make it genuinely smart — Connect AI

By default every guide works **offline** using built-in generators, so the app
runs with zero setup. For genuinely intelligent, original output, tap
**✨ Connect AI** in the top bar and paste your own **Anthropic API key**:

- The orb's "ask anything" and all four guides (Suno, Book, Business, App ideas)
  then call **Claude (Opus 4.8)** directly and **stream** the answer live.
- The **Book Helper's Humanizer** uses Claude to rewrite AI-sounding text so it
  reads like a real person — the headline "sound human, not AI" feature.
- Your key is stored **only in your browser** (localStorage) and sent **directly
  to Anthropic** — never to any other server. Get a key at console.anthropic.com.
- No key? Everything still works with the offline generators.

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
- `styles/` — themed CSS per area
