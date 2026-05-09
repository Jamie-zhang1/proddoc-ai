"use client";

import { ChevronRight, FolderKanban, LibraryBig } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DemoProject } from "@/lib/types";
import { cn } from "@/lib/utils";

type ModuleTreeProps = {
  projects: DemoProject[];
  selectedProjectId: string;
  selectedParentModule: string;
  selectedModule: string;
  onProjectSelect: (project: DemoProject) => void;
  onModuleSelect: (project: DemoProject, parentModule: string, moduleName: string) => void;
};

export function ModuleTree({
  projects,
  selectedProjectId,
  selectedParentModule,
  selectedModule,
  onProjectSelect,
  onModuleSelect,
}: ModuleTreeProps) {
  return (
    <aside className="flex max-h-[520px] w-full shrink-0 flex-col rounded-lg border border-zinc-800 bg-zinc-950 text-white shadow-xl shadow-zinc-950/15 xl:h-[calc(100vh-5.5rem)] xl:max-h-none xl:w-72">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-4 text-zinc-300" />
          <h2 className="text-sm font-semibold text-white">项目与模块</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-400">像文档目录一样选择产品模块，自动填充生成上下文。</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {projects.map((project) => {
            const activeProject = selectedProjectId === project.id;

            return (
              <div key={project.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                <button
                  type="button"
                  onClick={() => onProjectSelect(project)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white",
                    activeProject && "bg-white text-zinc-950 shadow-sm hover:bg-white hover:text-zinc-950"
                  )}
                >
                  <span className="line-clamp-1 flex items-center gap-2">
                    <LibraryBig className="size-3.5 shrink-0" />
                    {project.name}
                  </span>
                  <Badge variant="secondary" className="ml-2 bg-zinc-100 text-[11px] text-zinc-700">
                    {project.productType}
                  </Badge>
                </button>

                {activeProject ? (
                  <div className="mt-2 space-y-2">
                    {project.modules.map((module) => (
                      <div key={module.name}>
                        <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-400">
                          <ChevronRight className="size-3" />
                          {module.name}
                        </div>
                        <div className="space-y-1 pl-4">
                          {module.children.map((child) => {
                            const active =
                              selectedParentModule === module.name && selectedModule === child;

                            return (
                              <button
                                type="button"
                                key={child}
                                onClick={() => onModuleSelect(project, module.name, child)}
                                className={cn(
                                  "w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white",
                                  active && "bg-white text-zinc-950 shadow-sm hover:bg-white hover:text-zinc-950"
                                )}
                              >
                                {child}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
