import { BlueprintNode } from "@/types";
import { extractFromHtml } from "@extractus/article-extractor";
import { GoogleGenAI } from "@google/genai";
import pLimit from "p-limit";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const limit = pLimit(5);

function collectAllNodes(
  node: BlueprintNode,
  path: string[] = [],
  accumulatedContent: string = ""
): { path: string[]; node: BlueprintNode; content: string }[] {
  const currentPath = [...path, node.name];
  const currentContent = accumulatedContent + `\n\n# ${node.name}\n\n`;
  const all = [{ path: currentPath, node, content: currentContent }];

  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      all.push(...collectAllNodes(child, currentPath, currentContent));
    }
  }

  return all;
}

async function serper(query: string): Promise<string[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.SERPER_KEY || ""
    },
    body: JSON.stringify({ q: query })
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  return data.organic?.map((r: any) => r.link).slice(0, 3) ?? [];
}

async function extractContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" }
    });
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
You are a domain-specific academic summarizer. Rewrite the following content into a single, structured paragraph written in professional academic tone. 

- Focus on **accuracy**, **clarity**, and **topical progression** without repeating generic background (e.g., "George Harrison, a famous musician...").
- Avoid restating facts already introduced earlier in the hierarchy.
- Emphasize only **new, thematically relevant insights** tied to the subtopic.
- Use **inline Markdown hyperlinks** only once per distinct topic using descriptive anchor text.
- Ensure the paragraph is **cohesive**, with no abrupt transitions, metadata, or references to technical processing steps.

CONTENT:
${content}`;

  const modelFallbacks = [
    { name: "gemini-2.0-flash-lite", label: "FL-2.0" },
    { name: "gemini-2.0-flash", label: "F-2.0" },
    { name: "gemini-2.5-flash-lite-preview-06-17", label: "FL-2.5" }
  ];

  for (const { name, label } of modelFallbacks) {
    try {
      const result = await genAI.models.generateContent({
        model: name,
        contents: { text: prompt }
      });
      const response = await result;
      const text = response.text!
        .replace(/---+/g, '')
        .replace(/\[([^\]]+)\][\s\n\r]*\(([^)]+)\)/g, '[$1]($2)')
        .replace(/\n{2,}/g, '\n')
        .trim();

      if (!text || text.toLowerCase().includes("could not be generated")) {
        throw new Error("Empty or invalid response");
      }

      console.log(`[${label}] Success for: ${topic}`);
      return text;
    } catch (err: any) {
      console.warn(`[${label}] Failed: ${topic}:`, err.message);
    }
  }

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
  let markdown = `${"#".repeat(level)} ${node.name}\n\n`;

  const summary = summaries.get(topicKey);
  if (summary) markdown += `${summary}\n\n`;

  if (node.children) {
    for (const child of node.children) {
      markdown += buildHierarchicalMarkdown(child, summaries, currentPath, level + 1);
    }
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

  const allNodes = collectAllNodes(tree);
  const summaryMap = new Map<string, string>();

  await Promise.all(
    allNodes.map(({ path, content }) =>
      limit(async () => {
        const topic = path.join(" > ");
        try {
          const links = await serper(topic);
          if (links.length > 0) {
            const contents = await Promise.all(links.map(extractContent));
            const combined = contents.filter(c => c).join("\n\n---\n\n");
            const summary = await generateTopicContent(topic, content + "\n\n" + combined);
            summaryMap.set(topic, summary);
          }
        } catch (err: any) {
          console.error(`Error for ${topic}:`, err.message);
          summaryMap.set(topic, `*Content for this topic could not be generated due to an error.*`);
        }
      })
    )
  );

  const markdown = buildHierarchicalMarkdown(tree, summaryMap);
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown.trim());
}