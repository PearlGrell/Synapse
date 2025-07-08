import { BlueprintNode } from "@/types";
import { extractFromHtml } from "@extractus/article-extractor";
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function flatten(node: BlueprintNode, path: string[] = []): string[][] {
  const current = [...path, node.name];
  if (!node.children || node.children.length === 0) return [current];
  return node.children.flatMap(child => flatten(child, current));
}

async function serper(query: string): Promise<string[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": process.env.SERPER_KEY || "" },
    body: JSON.stringify({ q: query }),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return data.organic?.map((r: any) => r.link).slice(0, 3) ?? [];
}

async function extractContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } });
    const html = await res.text();
    const article = await extractFromHtml(html, url);
    return article?.content || "";
  } catch (err: any) {
    console.warn(`Failed to extract from ${url}:`, err.message);
    return "";
  }
}

async function generateTopicContent(topic: string, content: string): Promise<string> {
  const prompt = `
You are a content synthesizer. Your one and only task is to rewrite a block of text, transforming all source references into inline Markdown hyperlinks embedded in the narrative.

### EXAMPLE TRANSFORMATION
Input:
"...as detailed here: (https://example.com/history-of-gods)"

Output:
"...as detailed in the [history of gods](https://example.com/history-of-gods)..."

### RULES:
1. **Rewrite** all content into a single clear paragraph.
2. **Embed links** using natural phrasing. Do not use "Source: (URL)" or raw links.
3. **Clean URLs:** Never include brackets or whitespace inside links.
4. **Avoid repetition:** Use each link once unless it refers to a distinct section.
5. **Maintain logic and flow:** Keep the text concise and readable.

### TEXT TO TRANSFORM:
${content}
`;

  const modelFallbacks = [
    { name: "gemini-2.0-flash", label: "Primary" },
    { name: "gemini-2.0-flash-lite", label: "Fallback 1" },
    { name: "gemini-2.5-flash-lite-preview-06-17", label: "Fallback 2" }
  ];

  for (const { name, label } of modelFallbacks) {
    try {
      const result = await genAI.models.generateContent({
        model: name,
        contents: {
          text: prompt,
        }
      });
      const response = await result;
      const text = response.text!.trim().replace(/\[([^\]]+)\]\s+\(([^)]+)\)/g, '[$1]($2)');

      if (!text || text.toLowerCase().includes("could not be generated")) {
        throw new Error("Empty or invalid response");
      }

      console.log(`[${label}] Successfully generated content for topic "${topic}"`);

      return text;
    } catch (err: any) {
      console.warn(`[${label}] Failed for topic "${topic}":`, err?.message || err);
    }
  }

  console.error(`All model attempts failed for topic "${topic}".`);
  return `*Content for this topic could not be generated due to an error.*`;
}


function buildHierarchicalMarkdown(
  node: BlueprintNode,
  summaries: Map<string, string>,
  path: string[] = [],
  level: number = 1
): string {
  const currentPath = [...path, node.name];
  const topicKey = currentPath.join(" > ");
  let markdown = `${'#'.repeat(level)} ${node.name}\n\n`;

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      markdown += buildHierarchicalMarkdown(child, summaries, currentPath, level + 1);
    }
  } else {
    const summary = summaries.get(topicKey) || `*Content for this topic could not be generated.*`;
    markdown += `${summary}\n\n`;
  }
  return markdown;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tree: BlueprintNode = req.body;
  if (!tree || !tree.name) {
    return res.status(400).json({ error: "Invalid blueprint structure" });
  }

  const flattened = flatten(tree);
  const summaryMap = new Map<string, string>();

  for (const path of flattened) {
    const topic = path.join(" > ");
    try {
      console.log(`Processing: ${topic}`);
      const links = await serper(topic);
      if (links.length > 0) {
        const contents = await Promise.all(links.map(extractContent));
        const combinedContent = contents
          .filter(c => c)
          .map((content, i) => {
            const cleanUrl = links[i].replace(/[\[\]\s]/g, '');
            return `${content}\n\n(${cleanUrl})`;
          })
          .join("\n\n---\n\n");

        if (combinedContent) {
          const summary = await generateTopicContent(topic, combinedContent);
          summaryMap.set(topic, summary);
        }
      }
    } catch (err: any) {
      console.error(`Failed to process topic "${topic}":`, err.message);
      summaryMap.set(topic, `*Content for this topic could not be generated due to an error.*`);
    }

    await delay(4000);
  }

  const markdown = buildHierarchicalMarkdown(tree, summaryMap);

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.status(200).send(markdown.trim());
}