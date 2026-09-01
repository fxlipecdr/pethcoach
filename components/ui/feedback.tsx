import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const tones = {
  info: { icon: Info, classes: "bg-secondary text-foreground" },
  success: { icon: CircleCheck, classes: "bg-success-surface text-foreground" },
  warning: { icon: TriangleAlert, classes: "bg-warning-surface text-foreground" },
  error: { icon: CircleAlert, classes: "bg-danger-surface text-foreground" },
};
export function Feedback({
  tone = "info",
  title,
  children,
  announce = false,
  className,
}: {
  tone?: keyof typeof tones;
  title: string;
  children?: ReactNode;
  announce?: boolean;
  className?: string;
}) {
  const { icon: Icon, classes } = tones[tone];
  return (
    <div
      role={announce ? (tone === "error" ? "alert" : "status") : undefined}
      className={cn(
        "flex gap-3 rounded-card border border-border p-4",
        classes,
        className,
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        {children ? (
          <div className="mt-1 text-sm leading-relaxed">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
