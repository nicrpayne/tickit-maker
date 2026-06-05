# TicKit

Turn Figma designs into Linear tickets — instantly, with AI.

TicKit connects your design tool to your project management tool. Screenshot an artboard, drop it in, and Claude reads every screen and writes a fully structured ticket for each one — complete with user stories, acceptance criteria, and requirements. Review them, edit if you need to, and push straight to Linear. What used to take an afternoon takes minutes.

---

## What it does

<!-- Screenshot: Dashboard -->
> 📸 _Add a screenshot of the dashboard here_

TicKit has two modes and a template library:

**Circuit** (the main event) — drop a screenshot of your Figma artboard and Claude identifies every distinct screen, writes a ticket per screen, and streams them into a live list as it goes. You see results in seconds, not after a long wait. Smart enough to recognise when multiple screens are the same component with different data — it writes one reusable-component ticket instead of five near-identical ones.

**Spark** — when you want precision on a single screen. Paste a Figma frame URL and Claude fetches the frame image and writes one focused ticket. Good for revisiting a specific screen or generating a standalone ticket mid-sprint.

**Template library** — define your own ticket structures with draggable sections and Claude hints. Reuse them across your team to keep output consistent.

---

## Features at a glance

- **Streaming results** — tickets appear one by one as Claude writes them, no long blank waits
- **Bulk push** — select any combination of generated tickets and push them all to Linear in one go, with live per-ticket status
- **Ticket preview shelf** — slide-out panel with formatted preview, inline editing, and a field to paste the specific Figma frame link per ticket
- **Smart consolidation** — Claude detects repeated component patterns and writes one data-driven ticket instead of duplicates
- **Multiple screenshots** — paste several artboard screenshots at once for a complete flow
- **Inline editing** — edit any ticket's title or body before pushing
- **Template editor** — drag sections to reorder, add hints that guide what Claude writes in each section
- **Dark mode** — toggle in the nav bar
- **Per-browser Linear key** — each team member connects their own key; it never leaves their browser

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- A [Linear](https://linear.app) workspace
- An [Anthropic API key](https://console.anthropic.com)
- A Figma personal access token _(only needed for Spark — Circuit works without it)_

### 1. Clone and install

```bash
git clone https://github.com/nicrpayne/tickit-maker.git
cd tickit-maker
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

| Variable | What it's for | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Powers all AI generation via Claude | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `FIGMA_API_TOKEN` | Lets Spark fetch frame images from Figma | Figma → Settings → Personal access tokens (needs at least read access) |

Both values are used **server-side only** and are never sent to the browser.

> **Circuit doesn't need `FIGMA_API_TOKEN`** — it works entirely from uploaded screenshots. You can deploy without it and Spark will show a clear error if someone tries it.

### 3. Connect Linear

On first load the app will prompt you for a Linear personal API key. It's stored in your browser's localStorage and never sent anywhere.

Generate one at: **Linear → Settings → API → Personal API keys**

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using Circuit

<!-- Screenshot: Circuit with tickets streaming in -->
> 📸 _Add a screenshot of Circuit mid-generation here_

Circuit is the fastest way to turn a design sprint into a backlog.

1. **Screenshot your Figma artboard** — select the frames you want to ticket and take a screenshot. You don't need to export anything or copy URLs.
2. **Drop it in** — paste with `Ctrl+V`, drag and drop onto the upload zone, or click to browse. Add as many screenshots as you need for a complete flow.
3. **Optionally add a Figma file URL** — if you paste your Figma file URL, it gets embedded in every ticket's Design section as a reference link. You can add specific frame links per ticket in the preview shelf after generation.
4. **Choose your Linear team and state**, then hit **Analyse screens**.
5. **Watch tickets stream in** — Claude identifies each screen and sends tickets to the list as it writes them. The first one typically appears within 5–8 seconds.
6. **Review and edit** — expand any ticket to edit inline, or click the eye icon to open the preview shelf. The shelf shows formatted output, lets you edit the title and body, and has a field to paste the exact Figma frame URL for that screen.
7. **Push** — select the tickets you want (all selected by default), then **Push X tickets**. Each one pushes to Linear individually with a live status indicator.

> **Tip:** Frames with visible labels, component names, and clear layout generate the most accurate tickets. The more information Claude can see, the better the output.

> **Tip:** Claude consolidates repeated component patterns automatically. If your artboard shows the same hub screen for five different apps, you'll get one reusable-component ticket describing the pattern — not five duplicates.

---

## Using Spark

<!-- Screenshot: Spark with a generated ticket -->
> 📸 _Add a screenshot of Spark here_

Spark is for when you want one ticket, done precisely.

1. In Figma, right-click a specific frame → **Copy link**. The URL must include a `?node-id=` parameter — link to a frame, not a whole page.
2. Paste the URL into Spark.
3. Click **Fetch** to preview the frame image before generating (optional but useful for confirming you've got the right one).
4. Choose your **Team** and **State**, then **Generate ticket**.
5. Edit the output in the panel, or click **Preview** to open the shelf view.
6. **Push to Linear** when ready.

---

## Template library

<!-- Screenshot: Template editor -->
> 📸 _Add a screenshot of the template editor here_

Templates define the structure Claude uses when writing tickets. Three defaults come built in — Standard feature, Bug report, and Tech spike. You can customise any of them or create new ones from scratch.

Each section in a template has a **heading** (the `##` section name) and a **content field** (a hint or placeholder that Claude uses when generating). The more specific your hints, the more targeted the output.

Drag sections to reorder them. Use **Customise** on a default template to create an editable copy without touching the original.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, TypeScript) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| AI | [Anthropic Claude](https://anthropic.com) via `@anthropic-ai/sdk` — streaming responses |
| Drag and drop | [@dnd-kit](https://dndkit.com) |
| Design source | Figma REST API (Spark) / screenshot upload (Circuit) |
| Ticket destination | [Linear GraphQL API](https://developers.linear.app) |
| Hosting | [Vercel](https://vercel.com) |

---

## Deploying to Vercel

The easiest path:

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add environment variables in the project settings:
   - `ANTHROPIC_API_KEY` — required
   - `FIGMA_API_TOKEN` — optional, only needed for Spark
4. Deploy — Vercel detects Next.js automatically

Each team member who uses the deployed app connects their own Linear API key through the app interface.

---

## Good to know

**Ticket quality** depends on the clarity of your designs. Annotated frames with visible labels and component names produce the most accurate output. Claude gives you a strong first draft — always review before pushing.

**Circuit vs Spark** — Circuit is faster for batches and doesn't need a Figma API token. Spark is more precise for individual frames and includes a frame preview before generation. Use whichever fits the moment.

**The Figma images API** (used by Spark) has a rate limit. In normal use you won't hit it. If you do, a new Figma personal access token resets the quota immediately. Circuit has no such limitation.

**Ticket counts vary slightly** across runs for the same screenshots — Claude is generative, not deterministic. Well-structured designs with clear screen boundaries produce the most consistent results.
