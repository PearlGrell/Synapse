import { flowToMD } from "@/utils/flow-conversions";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const jsonData = req.body;
  const name = jsonData.name || "blueprint";

  const markdown = `# ${name}\n${flowToMD(jsonData)}`;

  const css = `
  @page {
    margin: 0.5in;
  }

  body {
    font-family: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }

  h1 {
    font-size: 2em;
    margin-bottom: 0.6em;
    border-bottom: 2px solid #ccc;
  }

  h2 {
    font-size: 1.5em;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  p {
    margin: 0 0 0.6em 0;
  }

  ul, ol {
    margin: 0.8em 0;
    padding-left: 1.4em;
  }

  li {
    margin-bottom: 0.4em;
  }

  body > *:last-child {
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
`;

  const response = await fetch("https://md-2-pdf.onrender.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      markdown,
      css,
      engine: "weasyprint"
    })
  });

  if (!response.ok) {
    console.error("PDF service failed:", await response.text());
    return res.status(500).json({ error: "PDF generation failed" });
  }

  const pdfBuffer = await response.arrayBuffer();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);
  res.send(Buffer.from(pdfBuffer));
}
