"use client";

import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ScreenshotItem } from "@/lib/types";

type ScreenshotUploaderProps = {
  screenshots: ScreenshotItem[];
  onChange: (screenshots: ScreenshotItem[]) => void;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createImageId(file: File) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${file.name}-${file.lastModified}-${random}`;
}

export function ScreenshotUploader({ screenshots, onChange }: ScreenshotUploaderProps) {
  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    const rejectedCount = files.length - imageFiles.length;

    if (rejectedCount > 0) {
      toast.warning("已忽略非图片文件");
    }

    if (!imageFiles.length) return;

    const nextItems = await Promise.all(
      imageFiles.map(async (file) => ({
        id: createImageId(file),
        name: file.name,
        dataUrl: await readFileAsDataUrl(file),
      }))
    );

    onChange([...screenshots, ...nextItems]);
  }

  return (
    <div className="space-y-3">
      <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center transition hover:border-slate-400 hover:bg-slate-50">
        <div className="flex size-11 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm ring-1 ring-zinc-200">
          <UploadCloud className="size-5" />
        </div>
        <div className="mt-3 text-sm font-medium text-zinc-950">上传页面截图</div>
        <div className="mt-1 text-xs leading-5 text-zinc-500">
          支持多张图片，仅用于辅助组织提示词和文档说明，不进行 OCR。
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>

      {screenshots.length ? (
        <div className="grid grid-cols-2 gap-3">
          {screenshots.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.dataUrl} alt={item.name} className="h-24 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-600">
                  <ImagePlus className="size-3.5 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </div>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onChange(screenshots.filter((screenshot) => screenshot.id !== item.id))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
