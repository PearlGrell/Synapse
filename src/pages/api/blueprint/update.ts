import { GoogleGenAI } from "@google/genai";
import { NextApiRequest, NextApiResponse } from "next";
import { jsonrepair } from "jsonrepair";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt: userInstruction, presentJson, promptHistory } = req.body;

  const model = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY!,
  });

  const prompt = `
You are an expert knowledge architect and semantic editor.

You are responsible for **updating a structured hierarchical JSON knowledge blueprint** based on precise user instructions. The JSON represents a conceptual knowledge tree.

---

## 🔧 INPUTS

### 🧩 Current JSON:
${JSON.stringify(presentJson, null, 2)}

### 📜 Instruction History:
${promptHistory?.length ? promptHistory.map((entry: string, index: number) => `Step ${index + 1}: ${entry}`).join("\n") : "No prior history."}

### 📝 New User Request:
${userInstruction}

---

## 🧠 YOUR TASK:

Update the JSON by applying **only the requested change(s)**. You may do the following, but ONLY if the user explicitly requests it:

- ✅ **Add** new nodes (as subtopics of existing ones)
- ✅ **Rename** specific nodes (match by name)
- ✅ **Delete** nodes (by exact or best semantic match)
- ✅ **Expand** a concept (intelligently add relevant subnodes)
- ✅ **Reorganize** a subtree (if told to restructure or group)

If the user gives a vague instruction like “expand to include AI ethics”:
- Do NOT just add a label “AI ethics”.
- Instead, add **semantically relevant, foundational subtopics** (e.g., fairness, bias, transparency).
- Place them under the **most logically appropriate existing parent** (or create a new branch *only if truly needed*).

---

## 🔍 DIFF + UNDO SUPPORT

After applying the update:

### 1. Output ONLY the updated JSON structure (no markdown, no commentary).
### 2. Optionally (if asked later), you should be able to return:
   - The **exact change diff** (before vs after)
   - A version with **highlighted deltas**
   - An **undo version** (revert to previous state)

You must track exactly what changed:
- What node was renamed (old → new)?
- What node was deleted (and its children)?
- What node was added (and where)?
- What structure was expanded?

This enables traceability and edit history, even across multiple edits.

---

## ✅ OUTPUT FORMAT RULES

- Output must be a **valid JSON object only**
- Do NOT wrap it in markdown or explanation
- All edits must:
  - Preserve hierarchy
  - Be logically consistent
  - Stay within 3 levels of depth unless told otherwise
- Do not add unrelated content or guess beyond the scope

---

## 📌 SUMMARY

Your job is to apply smart, precise, traceable changes to a conceptual JSON hierarchy.

Interpret the user's intent accurately. Perform:
- Clean structure updates
- Semantic expansions
- Minimal, surgical edits

Track what changed, keep the output tight, and always produce **valid, clean, hierarchical JSON.**
`;

  try {

    const result = await model.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        text: prompt,
      },
      config: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        responseMimeType: "application/json",
      },
    });

    const raw = result.text!;
    const match = raw.match(/{[\s\S]*}/);
    if (!match) {
      return res.status(400).json({
        error: "Invalid response format. Expected a JSON object.",
      });
    }

    const repairedJson = jsonrepair(match[0]);

    return res.status(200).json({
      text: repairedJson,
    });
  } catch (error) {
    console.error("Error generating updated blueprint:", error);
    return res.status(500).json({
      error: "Failed to update blueprint. Please try again.",
    });
  }
}
