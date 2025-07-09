import { BlueprintNode } from "@/types";
import { extractFromHtml } from "@extractus/article-extractor";
import { GoogleGenAI } from "@google/genai";
import pLimit from "p-limit";

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const limit = pLimit(5);

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
**📘 AI REWRITING PROMPT (Formal, Academic, Hyperlinked):**

You are an advanced rewriting model trained for academic editing and professional summarization. Your task is to **rewrite the provided text into one cohesive, formally written paragraph** that meets the following criteria:

---

### ✅ REWRITING INSTRUCTIONS:

1. **Use Formal, Academic English**

   * Maintain a polished, professional tone suitable for publication or scholarly discussion.

2. **Markdown Inline Hyperlinks Only**

   * Convert all raw URLs and malformed references into **clean, inline Markdown hyperlinks**.
   * ✅ Correct: "...as outlined in the [Stanford Encyclopedia of Philosophy entry on John Locke](https://plato.stanford.edu/entries/locke-political/)"
   * ❌ Avoid: bare URLs, “click here,” or footnote-style references.

3. **Single, Logically Structured Paragraph**

   * Produce **exactly one paragraph**. No bullet points, headings, or multiple sections.
   * The paragraph should flow naturally and cover all relevant aspects from the original text.

4. **Descriptive Link Anchors**

   * Use anchor text that clearly identifies the link’s content. Avoid vague phrases like “this article” or “source.”

5. **Eliminate Redundancy and Metadata**

   * Do NOT mention:

     * Subreddit names, usernames, deleted posts
     * Platform rules, moderation, technical issues
     * AI generation disclaimers
   * Only preserve **thematic, ideological, historical, or factual** information.

6. **Preserve and Expand on Core Topics**

   * If the original content discusses political ideologies, governance, philosophy, or history, **retain and elaborate** on those subjects with academic clarity.

7. **Fix Any Gaps or Errors**

   * If source information is vague or incomplete, intelligently infer and complete it using accurate, general knowledge.
   * Do NOT use placeholders or insert fake sources.

8. **Limit Link Use to Once Per Topic**

   * Only include **one hyperlink per unique topic**, using varied phrasing and distributing them evenly throughout the paragraph.

9. **No Tags or Code Blocks**

   * The final output must be plain text—**no markdown fences, no labels, no footnotes, no commentary**.

---

**📝 INPUT:**
${content}

**🧠 OUTPUT:**
Return a single, well-formed academic paragraph, with polished prose and properly embedded descriptive Markdown hyperlinks.
`;


  const modelFallbacks = [
    { name: "gemini-2.0-flash-lite", label: "FL-2.0" },
    { name: "gemini-2.0-flash", label: "F-2.0" },
    { name: "gemini-2.5-flash-lite-preview-06-17", label: "FL-2.5" },
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
      const text = response.text!
        .replace(/---+/g, '')
        .replace(/\[([^\]]+)\][\s\n\r]*\(([^)]+)\)/g, '[$1]($2)')
        .replace(/\n{2,}/g, '\n');

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
  let markdown = `${"#".repeat(level)} ${node.name}\n\n`;

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

  await Promise.all(
    flattened.map(path =>
      limit(async () => {
        const topic = path.join(" > ");
        try {
          console.log(`Processing: ${topic}`);
          const links = await serper(topic);
          if (links.length > 0) {
            const contents = await Promise.all(links.map(extractContent));
            const combinedContent = contents
              .filter(c => c)
              .map((content, i) => {
                const cleanUrl = links[i].replace(/[\[\]\s]/g, "");
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
      })
    )
  );

  const markdown = buildHierarchicalMarkdown(tree, summaryMap);

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.status(200).send(markdown.trim());
}