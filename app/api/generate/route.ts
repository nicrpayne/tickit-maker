import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fetchFigmaImageUrl, figmaImageToBase64 } from "@/lib/figma";

const SYSTEM_PROMPT = `You are an expert product manager and technical writer. Given a screenshot of a Figma design frame, generate a well-structured Linear issue using the following markdown template exactly.

Your output must be valid JSON with two fields:
- "title": a concise, sentence-case issue title (no more than 10 words)
- "body": the full markdown body using the template below

Template:
## User Story
As a [persona], I want to [action], so that [outcome].

## Description
[What this screen/feature is and its role in the flow. Be specific about what you see in the design.]

## Assumptions
- [assumption based on the design]

## Acceptance Criteria
- **Given** [context]
- **When** [action]
- **Then** [outcome]

## Requirements
- [specific, actionable requirement from the design]

## Design
[Figma embed link — provided by the caller]

## Implementation
[Brief notes for the dev team, or "Open to dev team."]

Rules:
- Infer the feature type and context from the visual design
- Write in sentence case throughout
- Be specific — reference visible UI elements, labels, and patterns from the screenshot
- Generate at least 3 acceptance criteria and 3 requirements
- Keep the user story realistic for the apparent user type`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const fileKey = searchParams.get("fileKey");
  const nodeId = searchParams.get("nodeId");

  if (action !== "preview" || !fileKey || !nodeId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = process.env.FIGMA_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Figma token not configured" }, { status: 500 });

  try {
    const imageUrl = await fetchFigmaImageUrl(fileKey, nodeId, token);
    return NextResponse.json({ imageUrl });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.fileKey || !body?.nodeId) {
    return NextResponse.json({ error: "fileKey and nodeId are required" }, { status: 400 });
  }

  const figmaToken = process.env.FIGMA_API_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!figmaToken) return NextResponse.json({ error: "FIGMA_API_TOKEN not set" }, { status: 500 });
  if (!anthropicKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });

  try {
    const imageUrl = await fetchFigmaImageUrl(body.fileKey, body.nodeId, figmaToken);
    const imageBase64 = await figmaImageToBase64(imageUrl);

    const client = new Anthropic({ apiKey: anthropicKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/png", data: imageBase64 },
            },
            {
              type: "text",
              text: "Generate a Linear ticket for this Figma design frame. Return only valid JSON with 'title' and 'body' fields.",
            },
          ],
        },
      ],
    });

    const rawText = message.content.find((b) => b.type === "text")?.text ?? "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude did not return valid JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.title || !parsed.body) throw new Error("Missing title or body in Claude response");

    return NextResponse.json({ title: parsed.title, body: parsed.body });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
