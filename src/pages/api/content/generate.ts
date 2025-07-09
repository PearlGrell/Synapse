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
You are a professional rewriting assistant with deep expertise in academic writing and editorial content. Your task is to rewrite the provided content into a **single clean, logically structured paragraph** using **formal, article-grade English** and **Markdown-formatted inline hyperlinks**.

--- 

### REWRITING RULES:

1. **Markdown Hyperlinks Only**  
   - Convert all raw URLs, malformed links, and footnote-style references into **Markdown inline hyperlinks** embedded within clean sentence structure.
   - Example:  
     ❌ “(https://example.com)” or “[this topic](https://...)”  
     ✅ “...as seen in the [Wikipedia entry on theism](https://example.com)”

2. **NO Redundancy or Noise**  
   - Do **NOT** include:  
     - “Content could not be generated” messages  
     - “as seen in footnote 2”  
     - Mentions of deleted Reddit posts, usernames, or platform rules/policies (unless directly relevant to the topic)

3. **Single, Cohesive Paragraph**  
   - Always produce **exactly one full paragraph** with no section dividers, headings, footnotes, or broken sentences.  
   - Flow must be natural and academic, not robotic or templated.

4. **Link Anchors Must Be Descriptive**  
   - Use anchor text that **clearly describes the link target** (e.g., “[Christian theology on monotheism](...)”)  
   - Do NOT use:  
     - “this article,” “here,” “study guide,” or “resource” as anchor text

5. **Limit and Vary Link Usage**  
   - Only include each link once.  
   - Vary phrasing across multiple links.  
   - Distribute links naturally in the sentence, not always at the start or end.

6. **Fill Gaps with Accurate Context**  
   - If any source content is missing, incomplete, or returns an error, intelligently infer and generate a relevant academic statement to preserve paragraph coherence.  
   - Do NOT generate fake citations or insert placeholders like “(link)”.

7. **Avoid Platform or Technical Metadata**  
   - Do not mention site policies, support pages, user agreements, or CAPTCHA explanations.  
   - Focus only on the **core topic** (historical, philosophical, religious, etc.).

8. **Correct All Grammar, Capitalization, and Flow**  
   - Sentence structure must be clean, fluid, and professional.  
   - No awkward phrasing, broken punctuation, or repeated structures.

9. **No Tags or Metadata**
    - No tags like \`\`\`markdown, \`\`\`html or any other code blocks.
    - No metadata, comments, or extraneous information.
    
10. **Be Concise and Relevant yet Detailed**
    - Provide a **detailed yet concise** overview of the topic, ensuring all key points are covered without unnecessary verbosity.
    - **Maintain a formal, academic tone** throughout the paragraph.
---

### SOURCE CONTENT:
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
  }

  const markdown = buildHierarchicalMarkdown(tree, summaryMap);

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.status(200).send(markdown.trim());
}