"use client";

import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  FileArchive,
  FileText,
  ImagePlus,
  Loader2,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ReferenceFile, ReferenceFileKind } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReferenceMaterialUploaderProps = {
  files: ReferenceFile[];
  onChange: (files: ReferenceFile[]) => void;
};

const acceptedTypes = [
  ".txt",
  ".md",
  ".docx",
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
].join(",");

function createFileId(file: File) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${file.name}-${file.lastModified}-${random}`;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function detectKind(file: File): ReferenceFileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return "text";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name)) return "image";
  return "unknown";
}

function getKindLabel(kind: ReferenceFileKind) {
  const labels: Record<ReferenceFileKind, string> = {
    text: "TXT",
    markdown: "MD",
    docx: "DOCX",
    pdf: "PDF",
    image: "图片 OCR",
    unknown: "未知",
  };
  return labels[kind];
}

async function parsePdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;
  const pages: string[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        const maybeText = item as { str?: unknown };
        return typeof maybeText.str === "string" ? maybeText.str : "";
      })
      .filter(Boolean)
      .join(" ");
    if (pageText.trim()) pages.push(pageText);
  }

  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error("未能从 PDF 提取可复制文本，当前文件可能是扫描版。建议上传图片进行 OCR。");
  }

  return text;
}

async function parseDocx(file: File) {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();
  if (!text) throw new Error("未能从 Word 文档中提取到文本内容。");
  return text;
}

async function parseImage(file: File) {
  const { recognize } = await import("tesseract.js");
  const result = await recognize(file, "chi_sim+eng");
  const text = result.data.text.trim();
  if (!text) throw new Error("OCR 未识别到有效文字，请尝试更清晰的截图。");
  return text;
}

async function parseFile(file: File, kind: ReferenceFileKind) {
  if (kind === "text" || kind === "markdown") return file.text();
  if (kind === "docx") return parseDocx(file);
  if (kind === "pdf") return parsePdf(file);
  if (kind === "image") return parseImage(file);
  throw new Error("暂不支持该文件类型。");
}

function StatusBadge({ file }: { file: ReferenceFile }) {
  const statusMap = {
    pending: {
      label: "待解析",
      icon: FileArchive,
      className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    parsing: {
      label: file.kind === "image" ? "正在识别图片文字" : "解析中",
      icon: Loader2,
      className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    },
    parsed: {
      label: "已解析",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    failed: {
      label: "解析失败",
      icon: XCircle,
      className: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    },
  } satisfies Record<ReferenceFile["status"], { label: string; icon: typeof FileText; className: string }>;

  const current = statusMap[file.status];
  const Icon = current.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs", current.className)}>
      <Icon className={cn("size-3.5", file.status === "parsing" && "animate-spin")} />
      {current.label}
    </span>
  );
}

export function ReferenceMaterialUploader({ files, onChange }: ReferenceMaterialUploaderProps) {
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  function commit(nextFiles: ReferenceFile[]) {
    filesRef.current = nextFiles;
    onChange(nextFiles);
  }

  function updateFile(id: string, patch: Partial<ReferenceFile>) {
    commit(filesRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    const incomingFiles = Array.from(fileList);
    const validFiles = incomingFiles.filter((file) => detectKind(file) !== "unknown");
    const rejected = incomingFiles.length - validFiles.length;

    if (rejected) toast.warning(`已忽略 ${rejected} 个不支持的文件`);
    if (!validFiles.length) return;

    const nextItems: ReferenceFile[] = validFiles.map((file) => ({
      id: createFileId(file),
      name: file.name,
      kind: detectKind(file),
      mimeType: file.type || "unknown",
      size: file.size,
      status: "pending",
      extractedText: "",
    }));

    commit([...filesRef.current, ...nextItems]);

    await Promise.all(
      nextItems.map(async (item, index) => {
        const sourceFile = validFiles[index];
        updateFile(item.id, { status: "parsing", error: undefined });

        try {
          const extractedText = (await parseFile(sourceFile, item.kind)).trim();
          updateFile(item.id, {
            status: "parsed",
            extractedText,
            error: undefined,
          });
          toast.success(`${sourceFile.name} 已解析，提取 ${extractedText.length} 字`);
        } catch (error) {
          updateFile(item.id, {
            status: "failed",
            extractedText: "",
            error: error instanceof Error ? error.message : "文件解析失败",
          });
          toast.error(`${sourceFile.name} 解析失败`);
        }
      })
    );
  }

  const parsedCount = files.filter((file) => file.status === "parsed").length;
  const extractedCount = files.reduce((sum, file) => sum + file.extractedText.length, 0);

  return (
    <div className="space-y-4">
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-indigo-500/50">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <UploadCloud className="size-5" />
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-100">
          上传参考说明书、文档或截图
        </div>
        <div className="mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
          支持 TXT、Markdown、Word、PDF 和图片。系统会在浏览器中提取文本，图片会自动进行 OCR，解析内容会进入后续提示词。
        </div>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>

      {files.length ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              已上传 {files.length} 个文件
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              已解析 {parsedCount} 个
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
              提取 {extractedCount} 字
            </span>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {file.kind === "image" ? (
                        <ImagePlus className="size-4 text-indigo-600" />
                      ) : (
                        <FileText className="size-4 text-indigo-600" />
                      )}
                      <span className="max-w-[14rem] truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {file.name}
                      </span>
                      <StatusBadge file={file} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{getKindLabel(file.kind)}</span>
                      <span>{formatSize(file.size)}</span>
                      <span>{file.extractedText.length} 字</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => commit(filesRef.current.filter((item) => item.id !== file.id))}
                    aria-label={`删除 ${file.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                {file.error ? (
                  <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {file.error}
                  </p>
                ) : null}

                {file.extractedText ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      查看提取文本
                    </summary>
                    <div className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                      {file.extractedText}
                    </div>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
