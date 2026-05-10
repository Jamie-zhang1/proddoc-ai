"use client";

import { saveAs } from "file-saver";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
} from "docx";
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

function lineToParagraph(line: string) {
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

  const format = options?.format ?? "formal";

  const contentParagraphs = input.content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map(lineToParagraph);

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
