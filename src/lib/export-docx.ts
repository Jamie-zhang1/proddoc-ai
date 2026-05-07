"use client";

import { saveAs } from "file-saver";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { HistoryRecord } from "@/lib/types";

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

export async function exportDocx(input: ExportDocxInput) {
  if (!input.content.trim()) {
    throw new Error("不能导出空文档");
  }

  const metaRows = [
    `产品名称：${input.productName}`,
    `产品类型：${input.productType}`,
    `目标用户：${input.targetUser}`,
    `所属模块：${input.parentModule} / ${input.moduleName}`,
    `文档类型：${input.documentType}`,
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: input.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          ...metaRows.map(
            (row) =>
              new Paragraph({
                children: [new TextRun({ text: row, size: 22 })],
                spacing: { after: 80 },
              })
          ),
          new Paragraph({ text: "", spacing: { after: 160 } }),
          ...input.content
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map(lineToParagraph),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeModule = input.moduleName || "功能模块";
  const safeType = input.documentType || "产品文档";
  saveAs(blob, `${safeModule}-${safeType}.docx`);
}
