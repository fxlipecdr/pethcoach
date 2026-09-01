import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 py-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-primary hover:bg-secondary",
        destructive:
          "border border-destructive bg-danger-surface text-destructive hover:bg-danger-surface/70",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> &
  (
    | { asChild: true; loading?: never; loadingText?: never }
    | { asChild?: false; loading?: boolean; loadingText?: string }
  );

export function Button({
  asChild,
  className,
  variant,
  children,
  disabled,
  loading = false,
  loadingText,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant }), className)}
      {...props}
      type={asChild ? undefined : (props.type ?? "button")}
      disabled={disabled || loading}
      aria-busy={loading || props["aria-busy"] || undefined}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading ? (
            <LoaderCircle
              className="motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : null}
          {loading && loadingText ? loadingText : children}
        </>
      )}
    </Component>
  );
}
