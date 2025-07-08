import { NextApiRequest, NextApiResponse } from "next";
import { marked } from "marked";
import puppeteer from "puppeteer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { markdown, fileName = "download" } = req.body;

    if (!markdown) {
      return res.status(400).json({ error: "Markdown is required" });
    }

    const _html = marked.parse(markdown);

    const html = `
      <html>
        <head>
          <style>
            @page {
              margin: 0.5in;
            }
            body {
              font-family: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #222;
              padding: 0;
              margin: 0;
              position: relative;
            }
            h1, h2, h3, h4 {
              color: #111;
              margin-top: 2rem;
              margin-bottom: 1rem;
            }
            p {
              margin: 0.5rem 0;
            }
            pre {
              background: #f4f4f4;
              padding: 1rem;
              overflow-x: auto;
              border-radius: 6px;
              font-family: Consolas, Monaco, "Courier New", monospace;
              font-size: 13px;
            }
            code {
              background: #eee;
              padding: 2px 4px;
              border-radius: 4px;
              font-family: Consolas, Monaco, "Courier New", monospace;
              font-size: 13px;
            }
            ul, ol {
              padding-left: 1.5rem;
              margin: 1rem 0;
            }

            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          ${_html}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      margin: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.8in",
        left: "0.5in",
      },
      footerTemplate: "<div style='width: 100%; text-align: right; font-size: 10px; color: #999; margin-right: 0.5in'>Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>",
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.pdf"`);
    res.end(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}
