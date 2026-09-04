import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-control font-bold select-none transition-all duration-150 motion-safe:active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-tactile border-b-4 border-primary-hover hover:brightness-105 active:border-b-0 active:translate-y-1 active:shadow-none",
        accent:
          "bg-accent text-[#062549] shadow-tactile-accent border-b-4 border-[#d65231] hover:brightness-105 active:border-b-0 active:translate-y-1 active:shadow-none",
        secondary:
          "bg-secondary text-primary border-2 border-primary/20 hover:bg-secondary/80 active:translate-y-0.5",
        outline:
          "border-2 border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted active:translate-y-0.5 shadow-xs",
        ghost: "text-primary hover:bg-secondary active:scale-[0.97]",
        destructive:
          "border-2 border-destructive bg-danger-surface text-destructive hover:bg-danger-surface/80 active:translate-y-0.5",
      },
      size: {
        default: "min-h-12 px-6 py-3 text-sm",
        sm: "min-h-9 px-4 py-2 text-xs",
        lg: "min-h-13 px-8 py-3.5 text-base",
        icon: "size-10 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
  size,
  children,
  disabled,
  loading = false,
  loadingText,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
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
