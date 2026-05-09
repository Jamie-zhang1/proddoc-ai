import { cn } from "@/lib/utils";

type CharacterCountProps = {
  value: string;
  limit?: number;
  warningAt?: number;
  className?: string;
};

export function CharacterCount({
  value,
  limit,
  warningAt = 0.85,
  className,
}: CharacterCountProps) {
  const count = value.length;
  const isOverLimit = typeof limit === "number" && count > limit;
  const isNearLimit =
    typeof limit === "number" && !isOverLimit && count >= Math.floor(limit * warningAt);

  return (
    <div
      className={cn(
        "text-right text-xs",
        isOverLimit
          ? "text-rose-500"
          : isNearLimit
            ? "text-amber-500"
            : "text-slate-400",
        className
      )}
    >
      {typeof limit === "number" ? `${count} / ${limit} 字` : `${count} 字`}
    </div>
  );
}
