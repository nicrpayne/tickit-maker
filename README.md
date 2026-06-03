# TicKit Maker

Generate structured Linear tickets directly from Figma designs using Claude AI.

Paste a Figma frame URL, TicKit Maker fetches a screenshot of the frame, sends it to Claude, and returns a fully formatted Linear ticket with a user story, acceptance criteria, requirements, and more — ready to review, edit, and push to Linear in one click.

---

## Features

- **AI generator** — paste any Figma frame URL and Claude drafts a structured ticket from the visual design
- **Template library** — save and reuse ticket structures across your team
- **Linear integration** — push tickets directly to any team and workflow state in your Linear workspace
- **Dark mode** — toggle in the nav bar
- **Editable output** — review and edit the generated ticket before pushing

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
| `FIGMA_API_TOKEN` | Fetches frame images from Figma | Figma → Settings → Personal access tokens |

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

### Generating a ticket

1. Open a Figma file and right-click a frame → **Copy link**
   - The URL must include a `?node-id=` parameter — link to a specific frame, not a whole page
2. Paste the URL into the AI generator
3. Optionally click **Fetch** to preview the frame before generating
4. Select your Linear **Team** and **State**
5. Click **Generate ticket** — Claude analyses the design and writes the ticket
6. Edit the output as needed, then click **Push to Linear**

> **Tip:** Frames with visible text labels, component names, and clear hierarchy produce the best tickets. Avoid linking to a whole Figma page.

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
| Design source | [Figma REST API](https://www.figma.com/developers/api) |
| Ticket destination | [Linear GraphQL API](https://developers.linear.app) |

---

## Deployment

The easiest path is [Vercel](https://vercel.com):

1. Push to GitHub (already done)
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add `ANTHROPIC_API_KEY` and `FIGMA_API_TOKEN` as environment variables in the Vercel project settings
4. Deploy — Vercel auto-detects Next.js and handles the rest

---

## Notes

- The Figma images export API has a rate limit. In normal use (a few tickets per session) you won't hit it. If you do, wait a few minutes and try again.
- Linear API keys are stored in localStorage per-browser. Each team member connects their own key.
- Generated ticket content is a starting point — always review before pushing.
