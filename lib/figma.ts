export function parseFigmaUrl(url: string): { fileKey: string; nodeId: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const designIdx = parts.findIndex((p) => p === "design" || p === "file" || p === "proto");
    if (designIdx === -1 || !parts[designIdx + 1]) return null;
    const fileKey = parts[designIdx + 1];
    const nodeId = u.searchParams.get("node-id");
    if (!nodeId) return null;
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

export async function fetchFigmaNode(fileKey: string, nodeId: string, token: string) {
  const encoded = nodeId.replace(/-/g, ":");
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(encoded)}`,
    { headers: { "X-Figma-Token": token } }
  );
  if (!res.ok) throw new Error(`Figma API error: ${res.status}`);
  return res.json();
}

export async function fetchFigmaImageUrl(fileKey: string, nodeId: string, token: string): Promise<string> {
  const encoded = nodeId.replace(/-/g, ":");
  const res = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${encodeURIComponent(encoded)}&format=png&scale=2`,
    { headers: { "X-Figma-Token": token } }
  );
  if (!res.ok) throw new Error(`Figma images API error: ${res.status}`);
  const data = await res.json();
  if (data.err) throw new Error(`Figma image error: ${data.err}`);
  const imageUrl = data.images?.[encoded] ?? data.images?.[Object.keys(data.images)[0]];
  if (!imageUrl) throw new Error("No image URL returned from Figma");
  return imageUrl;
}

export async function figmaImageToBase64(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Failed to fetch Figma frame image");
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}
