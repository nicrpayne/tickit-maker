# TicKit Maker

Generate structured Linear tickets directly from Figma designs using Claude AI.

Screenshot your Figma artboard, drop it into TicKit Maker, and Claude identifies every screen and writes a fully structured Linear ticket for each one — user stories, acceptance criteria, requirements, and all. Review, edit, select the tickets you want, and push them to Linear in one go.

---

## Features

- **Screen analyser** *(primary)* — drop a screenshot of your Figma artboard and Claude generates a ticket per screen. Supports multiple screenshots at once. Automatically detects when screens share a reusable component pattern and consolidates them into one ticket.
- **Single generator** — paste a specific Figma frame URL for precision one-off ticket generation
- **Template library** — save and reuse ticket structures across your team
- **Bulk push** — review, select, and push multiple tickets to Linear in one go with per-ticket status
- **Inline editing** — edit ticket titles and bodies before pushing
- **Linear integration** — push to any team and workflow state in your workspace
- **Dark mode** — toggle in the nav bar

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/nicrpayne/tickit-maker.git
cd tickit-maker
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Description | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Powers ticket generation via Claude | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `FIGMA_API_TOKEN` | Used by the single generator to fetch frame images | Figma → Settings → Personal access tokens |

> **Note:** `FIGMA_API_TOKEN` is only required for the Single generator. The Screen analyser works entirely from uploaded screenshots — no Figma API needed.

Both keys are used **server-side only** and are never exposed to the browser.

### 3. Connect Linear

Your Linear API key is entered in the app on first load and stored in your browser's localStorage — it never touches the server.

To generate one: **Linear → Settings → API → Personal API keys**

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Screen analyser (recommended)

1. In Figma, screenshot your artboard showing the screens you want to ticket
2. Go to **Screen analyser** and paste (`Ctrl+V`), drag & drop, or browse to upload
3. Add more screenshots if your design spans multiple artboards
4. Optionally paste the Figma file URL — it gets embedded in every ticket's Design section
5. Select your Linear **Team** and **State**
6. Click **Analyse screens** — Claude identifies each screen and generates a full ticket
7. Review the list, deselect anything you don't want, expand to edit inline
8. Click **Push X tickets** — each ticket is pushed to Linear with live status

> **Tip:** Claude detects when multiple screens are the same component with different data (e.g. an app hub template for 5 different apps) and consolidates them into one reusable-component ticket automatically.

### Single generator

1. Open a Figma file and right-click a specific frame → **Copy link**
   - The URL must include a `?node-id=` parameter
2. Paste the URL into the Single generator
3. Optionally click **Fetch** to preview the frame before generating
4. Select your Linear **Team** and **State**, then click **Generate ticket**
5. Edit as needed, then click **Push to Linear**

### Templates

The Template library lets you save custom ticket structures. Any saved template can be loaded into the generator as a starting format.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | [Anthropic Claude](https://anthropic.com) via `@anthropic-ai/sdk` |
| Design source | Figma REST API (single generator) / screenshot upload (screen analyser) |
| Ticket destination | [Linear GraphQL API](https://developers.linear.app) |

---

## Deployment

### Vercel (recommended)

1. Push to GitHub (already done)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in the Vercel project settings:
   - `ANTHROPIC_API_KEY` — required
   - `FIGMA_API_TOKEN` — required only if using the Single generator
4. Deploy — Vercel auto-detects Next.js and handles the rest

Each team member connects their own Linear API key in the app — it's stored in their browser and never sent to the server.

---

## Notes

- The Figma images export API (used by the Single generator) has a strict rate limit. In normal use you won't hit it, but heavy testing on a single token can exhaust the hourly quota. The Screen analyser has no such limitation.
- Generated ticket content is a starting point — always review before pushing.
- Claude may produce slightly different ticket counts across runs for the same screenshots. Results are consistent for well-structured designs with clear screen boundaries.
