import { flowToMD } from "@/utils/flow-conversions";
import { marked } from "marked";
import { NextApiRequest, NextApiResponse } from "next";
import puppeteer from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const jsonData = req.body;

  const markdown = flowToMD(jsonData);

  const html = marked.parse(markdown);

  const name = jsonData.name || "blueprint";

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.setContent(
    `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${name}</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          max-width: 850px;
          color: #2d2d2d;
          line-height: 1.75;
          font-size: 15px;
          display: flex;
          flex-direction: column;
        }

        h1, h2, h3, h4 {
          color: #1a1a1a;
          font-weight: 600;
          margin: 2em 0 0.6em;
          line-height: 1.3;
        }

        h1 {
          font-size: 2.2rem;
          border-bottom: 2px solid #ddd;
          padding-bottom: 0.4em;
        }

        h2 {
          font-size: 1.7rem;
        }

        h3 {
          font-size: 1.4rem;
        }

        h4 {
          font-size: 1.2rem;
        }

        ul li {
          font-size: 1rem;
          font-weight: 600;
          color: #222;
          margin-bottom: 0.5em;
        }

        ul li ul li {
          font-size: 0.95rem;
          font-weight: 500;
          color: #444;
        }     

        ul li ul li ul li {
          font-size: 0.9rem;
          font-weight: 400;
          color: #666;
        }

        ul li ul li ul li ul li {
         font-size: 0.85rem;
         font-weight: 400;
         color: #888;
        }

        ul li ul li ul li ul li ul li {
         font-size: 0.8rem;
         font-weight: 300;
         color: #aaa;
        }

        li {
          margin-bottom: 0.4em;
        }

        p {
          margin: 1em 0;
        }

        pre {
          background-color: #f8f8f8;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          font-family: "Courier New", monospace;
          font-size: 0.9rem;
        }

        code {
          background: #f1f1f1;
          padding: 3px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.85rem;
        }

        blockquote {
          border-left: 4px solid #ccc;
          padding-left: 16px;
          color: #555;
          font-style: italic;
          margin: 1.5em 0;
        }

        hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 2em 0;
        }
      </style>
    </head>
    <body>
      <div>
        <h1>${name}</h1>
        ${html}
      </div>
    </body>
  </html>
  `,
    { waitUntil: "networkidle0" }
  );


  const pdfBuffer = await page.pdf({
    format: "A4", margin: {
      top: "0mm",
      right: "10mm",
      bottom: "4mm",
      left: "10mm"
    },
  });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${name}.pdf"`);

  if (!Buffer.isBuffer(pdfBuffer)) {
    res.send(Buffer.from(pdfBuffer));
    return;
  }

  res.send(pdfBuffer);
}