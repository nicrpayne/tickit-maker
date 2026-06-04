import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an expert product manager and technical writer. You will be given a screenshot containing one or more UI screens, frames, or design states from a product.

Identify each distinct screen or UI state visible in the image. Generate one fully structured Linear ticket per screen.

Your response must contain one block per screen using exactly this format — nothing outside these blocks:

---TICKET---
---TITLE---
<concise sentence-case title, max 10 words>
---BODY---
<full markdown body using the template below>
---END---

Repeat the block for every screen you identify.

Body template:
## User Story
As a [persona], I want to [action], so that [outcome].

## Description
[What this screen is and its role in the flow. Be specific about visible UI elements, labels, and layout.]

## Assumptions
- [assumption based on the design]

## Acceptance Criteria
- **Given** [context]
- **When** [action]
- **Then** [outcome]

## Requirements
- [specific, actionable requirement from the design]

## Design
FIGMA_LINK_PLACEHOLDER

## Implementation
[Brief notes for the dev team, or "Open to dev team."]

Rules:
- Write in sentence case throughout
- Be specific — reference visible text, buttons, icons, and patterns
- At least 3 acceptance criteria and 3 requirements per ticket

CRITICAL — know when to consolidate vs keep separate:

CONSOLIDATE into one ticket when screens are the same component with different DATA/CONFIG:
- The layout, UI elements, and interaction patterns are identical across all instances
- Only the text, icons, labels, or data differ (e.g. the same hub screen template for different apps — same card structure, same quick actions format, just different content per app)
- A developer would build this once and drive it from a config object or API response
- Generate ONE ticket describing the reusable component, list each variant's specific data in Requirements, and note the likely API call per variant

KEEP SEPARATE when screens show different STATES or MODES of the same screen:
- Each state has meaningfully different UI elements, buttons, or layout (e.g. an unread notifications screen with blue dots and "Mark all as read" vs an all-read screen with "Clear all" vs an empty state with an illustration — these have different visual elements, different actions, different implementation work)
- A developer would need to implement each state distinctly
- Generate one ticket per state

For screens with completely different purposes or layouts, always generate separate tickets.`;

interface ImageInput {
  imageBase64: string;
  mediaType: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Support both single image (legacy) and multiple images
  const images: ImageInput[] = body?.images
    ? body.images
    : body?.imageBase64 && body?.mediaType
    ? [{ imageBase64: body.imageBase64, mediaType: body.mediaType }]
    : [];

  if (images.length === 0) {
    return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  const figmaLink = body.figmaFileUrl
    ? `[Figma file](${body.figmaFileUrl}) — link specific frame after review`
    : "Add Figma link";

  const systemPrompt = SYSTEM_PROMPT.replace(/FIGMA_LINK_PLACEHOLDER/g, figmaLink);

  try {
    const client = new Anthropic({ apiKey: anthropicKey });

    const imageBlocks = images.map((img) => ({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.mediaType as "image/png" | "image/jpeg" | "image/gif" | "image/webp", data: img.imageBase64 },
    }));

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Identify every distinct screen across ${images.length > 1 ? "all " + images.length + " images" : "this image"} and generate one Linear ticket per screen using the ---TICKET--- blocks exactly as instructed. Apply the repeating component rule where relevant.`,
            },
          ],
        },
      ],
    });

    const rawText = message.content.find((b) => b.type === "text")?.text ?? "";
    const blocks = rawText.split("---TICKET---").map((s) => s.trim()).filter(Boolean);

    const tickets = blocks.flatMap((block) => {
      const titleMatch = block.match(/---TITLE---\s*([\s\S]*?)\s*---BODY---/);
      const bodyMatch = block.match(/---BODY---\s*([\s\S]*?)\s*---END---/);
      if (!titleMatch || !bodyMatch) return [];
      const title = titleMatch[1].trim();
      const ticketBody = bodyMatch[1].trim();
      if (!title || !ticketBody) return [];
      return [{ title, body: ticketBody }];
    });

    if (tickets.length === 0) {
      return NextResponse.json({ error: "No tickets could be generated from this image" }, { status: 422 });
    }

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("[/api/bulk-generate]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
