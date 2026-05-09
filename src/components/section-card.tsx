import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card className={cn("border-zinc-200 bg-white/95 shadow-sm backdrop-blur", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-zinc-950">{title}</CardTitle>
        {description ? (
          <p className="text-sm leading-6 text-zinc-500">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
