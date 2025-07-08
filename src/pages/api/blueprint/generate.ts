import { GoogleGenAI } from "@google/genai";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { prompt } = req.body;

  const model = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const prompt_template = `You are a world-class knowledge architect. Your task is to design a **clean, structured, high-level conceptual map** for the topic: "${prompt}". The output should resemble a **summary-level Table of Contents** for a short but comprehensive **introductory book or curriculum**.

This structure will be used as a blueprint for learning, so it must emphasize **clarity, hierarchy, and balanced coverage** of the topic — without diving into too much detail.

🎯 OBJECTIVE
- Produce a concise JSON tree that captures the **essential pillars and core subtopics** of the subject.
- Think in terms of **major ideas, big-picture themes, and critical concepts** — not exhaustive detail, trivia, or advanced theory.
- Prioritize clarity, thematic grouping, and conceptual coverage.

🧱 STRUCTURE SPECIFICATIONS
- You must output a **single valid JSON object**, in the format described below.
- This is a hierarchical tree with exactly **3 levels of depth maximum**:  
  - Root node (the overall topic)  
  - Level 1 children
  - Level 2 children (key concepts under each major pillar)  
- No level should go deeper than this. Most branches should be shallow (2 levels).

📏 STRICT CONSTRAINTS
1. **Total Nodes:** The entire tree must not be too dense.
2. **Depth:** Maximum of 3 levels:
   - Root → Pillar → Subtopic
3. **Breadth:**
   - Root must have **children** — these are the top-level conceptual sections.
   - Each section (pillar) can have **0 to 6 children**. Subtopics should not be excessive.
4. **Naming:**
   - Use clear, readable, self-explanatory names.
   - Avoid technical jargon unless it’s widely known.
   - Use sentence case or title case (not ALL CAPS).
5. **Content Focus:**
   - Focus only on the **core, foundational components**.
   - Avoid niche specializations, historical trivia, implementation details, or named individuals.
   - Every node should represent a **relevant, teachable concept or section** of the topic.

🧾 OUTPUT FORMAT
Use this exact structure:

{
  "name": "Main Topic",
  "children": [
    {
      "name": "Major Pillar 1",
      "children": [
        {
          "name": "Key Concept 1.1",
          "children": []
        },
        {
          "name": "Key Concept 1.2",
          "children": []
        }
      ]
    },
    {
      "name": "Major Pillar 2",
      "children": [
        {
          "name": "Key Concept 2.1",
          "children": []
        }
      ]
    },
    ...
  ]
}

📤 FINAL OUTPUT RULES
- Return **only the raw JSON object** — no explanations, no code blocks, no markdown, no commentary.
- Output must be a **valid, parseable JSON object** matching all rules above.
- Do not include blank nodes, null values, or extra metadata.`;

  try {
    const response = await model.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        text: prompt_template,
      },
      config: {
        temperature: 0.7,
        topK: 1,
        topP: 0.9,
        responseMimeType: "application/json"
      }
    });

    return res.status(200).json({
      text: response.text,
    });
  }
  catch (error) {
    console.error("Error generating blueprint:", error);
    return res.status(500).json({
      error: "Failed to generate blueprint. Please try again.",
    });
  }
}