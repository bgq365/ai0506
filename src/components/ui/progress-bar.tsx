import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? <div className="text-sm text-muted-foreground">{label}</div> : null}
      <div className="h-3 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
