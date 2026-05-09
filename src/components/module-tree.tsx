"use client";

import { ChevronRight, FolderKanban } from "lucide-react";
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
    <aside className="flex max-h-[520px] w-full shrink-0 flex-col rounded-lg border border-zinc-200 bg-white shadow-sm xl:h-[calc(100vh-5.5rem)] xl:max-h-none xl:w-72">
      <div className="border-b border-zinc-200 p-4">
        <div className="flex items-center gap-2">
          <FolderKanban className="size-4 text-zinc-600" />
          <h2 className="text-sm font-semibold text-zinc-950">项目与模块</h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">选择 Demo 模块后自动填充基础信息。</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {projects.map((project) => {
            const activeProject = selectedProjectId === project.id;

            return (
              <div key={project.id} className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-2">
                <button
                  type="button"
                  onClick={() => onProjectSelect(project)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium transition hover:bg-white",
                    activeProject && "bg-white text-zinc-950 shadow-sm"
                  )}
                >
                  <span className="line-clamp-1">{project.name}</span>
                  <Badge variant="secondary" className="ml-2 text-[11px]">
                    {project.productType}
                  </Badge>
                </button>

                {activeProject ? (
                  <div className="mt-2 space-y-2">
                    {project.modules.map((module) => (
                      <div key={module.name}>
                        <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-500">
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
                                  "w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-600 transition hover:bg-white hover:text-zinc-950",
                                  active && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
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
