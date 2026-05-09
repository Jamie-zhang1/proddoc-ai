import { TemplateCard } from "@/components/template-card";
import { templates } from "@/lib/mock-data";

export default function TemplatesPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6">
      <section className="mb-6">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">文档模板</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            选择适合当前输出目标的结构模板，用于组织提示词和文档初稿。模板保持通用软件产品语境，可复用于多类产品说明、交付和培训场景。
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </section>
    </main>
  );
}
