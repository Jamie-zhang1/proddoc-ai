"use client";

import { Clipboard, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { copyText } from "@/lib/clipboard";
import type { HistoryRecord } from "@/lib/types";

type HistoryTableProps = {
  records: HistoryRecord[];
  onDelete: (id: string) => void;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function HistoryTable({ records, onDelete }: HistoryTableProps) {
  async function copyContent(content: string) {
    const copied = await copyText(content);
    if (copied) {
      toast.success("正文已复制");
      return;
    }

    toast.error("当前浏览器不支持自动复制，请手动选择文本复制");
  }

  function confirmDelete(id: string) {
    const confirmed = window.confirm("确认删除这条历史记录吗？删除后无法恢复。");
    if (confirmed) onDelete(id);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead>文档标题</TableHead>
            <TableHead>产品名称</TableHead>
            <TableHead>产品类型</TableHead>
            <TableHead>所属模块</TableHead>
            <TableHead>文档类型</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-40 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium text-slate-900 dark:text-slate-100">{record.title}</TableCell>
              <TableCell>{record.productName}</TableCell>
              <TableCell>{record.productType}</TableCell>
              <TableCell>{record.parentModule} / {record.moduleName}</TableCell>
              <TableCell>{record.documentType}</TableCell>
              <TableCell>{formatTime(record.createdAt)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{record.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="查看详情">
                        <Eye className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[82vh] max-w-3xl overflow-auto">
                      <DialogHeader>
                        <DialogTitle>{record.title}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                        <div>产品名称：{record.productName}</div>
                        <div>产品类型：{record.productType}</div>
                        <div>目标用户：{record.targetUser}</div>
                        <div>文档类型：{record.documentType}</div>
                        <div className="sm:col-span-2">
                          所属模块：{record.parentModule} / {record.moduleName}
                        </div>
                      </div>
                      <pre className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                        {record.content}
                      </pre>
                    </DialogContent>
                  </Dialog>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="复制正文"
                    onClick={() => void copyContent(record.content)}
                  >
                    <Clipboard className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="删除记录"
                    onClick={() => confirmDelete(record.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
