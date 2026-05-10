"use client";

import { saveAs } from "file-saver";
import type { HistoryRecord } from "@/lib/types";

type ExportFormat = "formal" | "minimal" | "with-header-footer";

type ExportDocxInput = Pick<
  HistoryRecord,
  | "title"
  | "productName"
  | "productType"
  | "targetUser"
  | "parentModule"
  | "moduleName"
  | "documentType"
  | "content"
>;

type DocxModule = typeof import("docx");

function lineToParagraph(docx: DocxModule, line: string) {
  const { Paragraph, HeadingLevel, TextRun } = docx;
  if (line.startsWith("# ")) {
    return new Paragraph({
      text: line.replace("# ", ""),
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    });
  }

  if (line.startsWith("## ")) {
    return new Paragraph({
      text: line.replace("## ", ""),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    });
  }

  if (line.startsWith("- ")) {
    return new Paragraph({
      children: [new TextRun(line.replace("- ", ""))],
      bullet: { level: 0 },
      spacing: { after: 100 },
    });
  }

  return new Paragraph({
    children: [new TextRun(line)],
    spacing: { after: 120 },
  });
}

export async function exportDocx(input: ExportDocxInput, options?: { format?: ExportFormat }) {
  if (!input.content.trim()) {
    throw new Error("不能导出空文档");
  }

  const docx = await import("docx");
  const { AlignmentType, Document, HeadingLevel, PageNumber, Packer, Paragraph, TextRun, Header, Footer } = docx;

  const format = options?.format ?? "formal";

  const contentParagraphs = input.content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => lineToParagraph(docx, line));

  const metaRows =
    format === "minimal"
      ? []
      : [
          `产品名称：${input.productName}`,
          `产品类型：${input.productType}`,
          `目标用户：${input.targetUser}`,
          `所属模块：${input.parentModule} / ${input.moduleName}`,
          `文档类型：${input.documentType}`,
        ];

  const metaParagraphs = metaRows.map(
    (row) =>
      new Paragraph({
        children: [new TextRun({ text: row, size: 22 })],
        spacing: { after: 80 },
      })
  );

  const sectionChildren = [
    ...(format !== "minimal"
      ? [
          new Paragraph({
            text: input.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          ...metaParagraphs,
          new Paragraph({ text: "", spacing: { after: 160 } }),
        ]
      : []),
    ...contentParagraphs,
  ];

  const sectionProps = format === "with-header-footer"
    ? {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: input.title, size: 18, color: "888888" })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "第 ", size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
                  new TextRun({ text: " 页", size: 18 }),
                ],
              }),
            ],
          }),
        },
      }
    : {};

  const doc = new Document({
    sections: [
      {
        properties: {},
        ...sectionProps,
        children: sectionChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeModule = input.moduleName || "功能模块";
  const safeType = input.documentType || "产品文档";
  saveAs(blob, `${safeModule}-${safeType}.docx`);
}

/* ------------------------------------------------------------------ */
/*  PDF export (via print)                                              */
/* ------------------------------------------------------------------ */

export function exportPdf(input: ExportDocxInput) {
  if (!input.content.trim()) {
    throw new Error("不能导出空文档");
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("无法打开打印窗口，请检查浏览器弹窗设置。");

  const htmlContent = input.content
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1 style="text-align:center;font-size:1.5em;margin:0.5em 0;">${escapeHtml(line.replace("# ", ""))}</h1>`;
      if (line.startsWith("## ")) return `<h2 style="font-size:1.2em;margin:1em 0 0.5em;border-bottom:1px solid #eee;padding-bottom:0.3em;">${escapeHtml(line.replace("## ", ""))}</h2>`;
      if (line.startsWith("- ")) return `<li style="margin:0.2em 0;">${escapeHtml(line.replace("- ", ""))}</li>`;
      if (line.trim() === "") return "<br/>";
      return `<p style="margin:0.3em 0;line-height:1.6;">${escapeHtml(line)}</p>`;
    })
    .join("\n");

  const meta = [
    `产品名称：${input.productName}`,
    `产品类型：${input.productType}`,
    `目标用户：${input.targetUser}`,
    `所属模块：${input.parentModule} / ${input.moduleName}`,
    `文档类型：${input.documentType}`,
  ]
    .map((line) => `<div style="color:#666;font-size:0.9em;">${escapeHtml(line)}</div>`)
    .join("\n");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="utf-8"/>
      <title>${escapeHtml(input.title)}</title>
      <style>
        body { font-family: "SimSun", "宋体", serif; max-width: 800px; margin: 0 auto; padding: 2em; color: #333; line-height: 1.8; }
        h1, h2 { color: #1a1a1a; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1 style="text-align:center;border-bottom:2px solid #333;padding-bottom:0.5em;">${escapeHtml(input.title)}</h1>
      <div style="margin:1em 0;padding:1em;background:#f9f9f9;border-radius:8px;">${meta}</div>
      <hr style="margin:1.5em 0;border:none;border-top:1px solid #ddd;"/>
      ${htmlContent}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ------------------------------------------------------------------ */
/*  Markdown export                                                    */
/* ------------------------------------------------------------------ */

export function exportMarkdown(input: ExportDocxInput) {
  if (!input.content.trim()) {
    throw new Error("不能导出空文档");
  }

  const frontmatter = [
    `---`,
    `title: "${input.title}"`,
    `productName: "${input.productName}"`,
    `productType: "${input.productType}"`,
    `targetUser: "${input.targetUser}"`,
    `module: "${input.parentModule} / ${input.moduleName}"`,
    `documentType: "${input.documentType}"`,
    `exportedAt: "${new Date().toISOString()}"`,
    `---`,
    ``,
  ].join("\n");

  const md = frontmatter + input.content;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const safeModule = input.moduleName || "功能模块";
  const safeType = input.documentType || "产品文档";
  saveAs(blob, `${safeModule}-${safeType}.md`);
}

/* ------------------------------------------------------------------ */
/*  Batch export                                                       */
/* ------------------------------------------------------------------ */

export async function batchExportDocx(records: ExportDocxInput[]) {
  if (!records.length) throw new Error("没有可导出的记录");

  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const [
    { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType },
  ] = await Promise.all([
    import("docx"),
  ]);

  for (const record of records) {
    if (!record.content.trim()) continue;

    const contentParagraphs = record.content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        if (line.startsWith("# ")) {
          return new Paragraph({
            text: line.replace("# ", ""),
            heading: HeadingLevel.TITLE,
            spacing: { after: 240 },
          });
        }
        if (line.startsWith("## ")) {
          return new Paragraph({
            text: line.replace("## ", ""),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 },
          });
        }
        if (line.startsWith("- ")) {
          return new Paragraph({
            children: [new TextRun(line.replace("- ", ""))],
            bullet: { level: 0 },
            spacing: { after: 100 },
          });
        }
        return new Paragraph({
          children: [new TextRun(line)],
          spacing: { after: 120 },
        });
      });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: record.title,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
            }),
            ...contentParagraphs,
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const safeModule = record.moduleName || "功能模块";
    const safeType = record.documentType || "产品文档";
    zip.file(`${safeModule}-${safeType}.docx`, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `proddoc-export-${new Date().toISOString().slice(0, 10)}.zip`);
}
