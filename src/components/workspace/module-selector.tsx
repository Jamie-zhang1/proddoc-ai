"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoProjects } from "@/lib/mock-data";
import type { DemoProject, WorkspaceDraft, WorkspaceModuleItem } from "@/lib/types";

type ModuleSelectorProps = {
  draft: WorkspaceDraft;
  onUpdateDraft: <T extends keyof WorkspaceDraft>(key: T, value: WorkspaceDraft[T]) => void;
};

function parseModuleLine(line: string): WorkspaceModuleItem | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const sepIdx = trimmed.search(/[>＞\-—]/);
  if (sepIdx === -1) {
    return { parent: "未分类", child: trimmed };
  }
  const parent = trimmed.slice(0, sepIdx).trim();
  const child = trimmed.slice(sepIdx + 1).trim();
  if (!parent || !child) return null;
  return { parent, child };
}

function dedupeModules(items: WorkspaceModuleItem[]): WorkspaceModuleItem[] {
  const seen = new Set<string>();
  const result: WorkspaceModuleItem[] = [];
  for (const item of items) {
    const key = `${item.parent}|${item.child}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function ModuleSelector({ draft, onUpdateDraft }: ModuleSelectorProps) {
  const [modules, setModules] = useState<WorkspaceModuleItem[]>(() => draft.modules ?? []);
  const [parentInput, setParentInput] = useState("");
  const [childInput, setChildInput] = useState("");
  const [batchText, setBatchText] = useState("");
  const [showBatch, setShowBatch] = useState(false);

  useEffect(() => {
    onUpdateDraft("modules", modules);
    if (modules.length > 0) {
      onUpdateDraft("parentModule", modules[0].parent);
      onUpdateDraft("moduleName", modules[0].child);
    } else {
      onUpdateDraft("parentModule", "");
      onUpdateDraft("moduleName", "");
    }
  }, [modules]);

  useEffect(() => {
    const draftModules = draft.modules ?? [];
    if (JSON.stringify(draftModules) !== JSON.stringify(modules)) {
      setModules(draftModules);
    }
  }, [draft.modules]);

  const moduleCount = modules.length;

  const groupedModules = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const m of modules) {
      if (!groups[m.parent]) groups[m.parent] = [];
      groups[m.parent].push(m.child);
    }
    return groups;
  }, [modules]);

  const addModule = useCallback((parent: string, child: string) => {
    const trimmed = { parent: parent.trim(), child: child.trim() };
    if (!trimmed.parent || !trimmed.child) return;
    setModules((prev) => {
      const exists = prev.some((m) => m.parent === trimmed.parent && m.child === trimmed.child);
      if (exists) return prev;
      return [...prev, trimmed];
    });
  }, []);

  const removeModule = useCallback((parent: string, child: string) => {
    setModules((prev) => prev.filter((m) => !(m.parent === parent && m.child === child)));
  }, []);

  const handleAddSingle = () => {
    if (!childInput.trim()) {
      toast.error("请输入功能模块名称");
      return;
    }
    addModule(parentInput.trim() || "未分类", childInput);
    setChildInput("");
    toast.success("已添加");
  };

  const handleBatchImport = () => {
    const lines = batchText.split("\n");
    const parsed = lines.map(parseModuleLine).filter(Boolean) as WorkspaceModuleItem[];
    if (parsed.length === 0) {
      toast.error("未识别到有效模块");
      return;
    }
    setModules((prev) => {
      const merged = dedupeModules([...prev, ...parsed]);
      const added = merged.length - prev.length;
      if (added > 0) toast.success(`已导入 ${added} 个模块`);
      else toast.info("所有模块已存在");
      return merged;
    });
    setBatchText("");
    setShowBatch(false);
  };

  const handleDemoFill = (project: DemoProject) => {
    const allModules: WorkspaceModuleItem[] = [];
    for (const group of project.modules) {
      for (const child of group.children) {
        allModules.push({ parent: group.name, child });
      }
    }
    setModules((prev) => {
      const merged = dedupeModules([...prev, ...allModules]);
      const added = merged.length - prev.length;
      if (added > 0) toast.success(`已导入 ${project.name} 的 ${added} 个模块`);
      else toast.info("所有模块已存在");
      return merged;
    });
  };

  return (
    <aside className="space-y-4">
      {/* Product Info */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            产品信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">产品名称</label>
            <input
              id="product-name-input"
              type="text"
              value={draft.productName}
              onChange={(e) => onUpdateDraft("productName", e.target.value)}
              placeholder="例如：CRM 客户管理系统"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">产品类型</label>
              <select
                value={draft.productType}
                onChange={(e) => onUpdateDraft("productType", e.target.value as WorkspaceDraft["productType"])}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="SaaS 系统">SaaS 系统</option>
                <option value="后台管理系统">后台管理系统</option>
                <option value="CRM 系统">CRM 系统</option>
                <option value="ERP 系统">ERP 系统</option>
                <option value="HRM 系统">HRM 系统</option>
                <option value="BI 看板">BI 看板</option>
                <option value="内容管理系统">内容管理系统</option>
                <option value="协作办公系统">协作办公系统</option>
                <option value="低代码平台">低代码平台</option>
                <option value="数据分析平台">数据分析平台</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">目标用户</label>
              <select
                value={draft.targetUser}
                onChange={(e) => onUpdateDraft("targetUser", e.target.value as WorkspaceDraft["targetUser"])}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="产品经理">产品经理</option>
                <option value="产品运营">产品运营</option>
                <option value="售前顾问">售前顾问</option>
                <option value="实施交付人员">实施交付</option>
                <option value="客户培训人员">客户培训</option>
                <option value="测试人员">测试人员</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Selection */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              功能模块
            </CardTitle>
            {moduleCount > 0 && (
              <span className="text-xs text-slate-400">{moduleCount} 个</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {/* Add Module Input */}
          <div id="module-section" className="space-y-2">
            <input
              type="text"
              value={parentInput}
              onChange={(e) => setParentInput(e.target.value)}
              placeholder="一级模块名称（可选，如：客户管理）"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSingle(); } }}
            />
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={childInput}
                onChange={(e) => setChildInput(e.target.value)}
                placeholder="功能模块名称（如：客户列表）"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSingle(); } }}
              />
              <button
                type="button"
                onClick={handleAddSingle}
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
              >
                添加
              </button>
            </div>
          </div>

          {/* Module List */}
          {moduleCount > 0 && (
            <div className="space-y-2">
              <div className="max-h-48 space-y-1.5 overflow-y-auto">
                {Object.entries(groupedModules).map(([parent, children]) => (
                  <div key={parent}>
                    <div className="mb-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {parent}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {children.map((child) => (
                        <span
                          key={`${parent}|${child}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {child}
                          <button
                            type="button"
                            onClick={() => removeModule(parent, child)}
                            className="rounded p-0.5 text-slate-400 hover:text-red-500 transition"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setModules([]); toast.success("已清空"); }}
                className="text-xs text-red-500 hover:text-red-600 transition"
              >
                清空全部
              </button>
            </div>
          )}

          {/* Batch Import Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowBatch(!showBatch)}
              className="text-xs text-indigo-600 hover:text-indigo-500 transition dark:text-indigo-400"
            >
              {showBatch ? "收起批量导入" : "批量导入模块"}
            </button>
            {showBatch && (
              <div className="mt-2 space-y-2">
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={"每行一个模块：\n首页概览>核心指标\n客户管理>客户列表\n数据报表"}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={handleBatchImport}
                  disabled={!batchText.trim()}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  导入
                </button>
              </div>
            )}
          </div>

          {/* Demo Quick Fill */}
          <div>
            <div className="mb-1.5 text-xs text-slate-400">快速填充（可选）</div>
            <div className="flex flex-wrap gap-1.5">
              {demoProjects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleDemoFill(project)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {project.name.replace(" Demo", "")}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
