import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

/**
 * DESIGN.md §18 e §19: o primário sobe 2px e ganha sombra no hover;
 * a seta interna anda 4px (classe `arrow-nudge`).
 */
export const buttonVariants = cva(
  "arrow-nudge inline-flex cursor-pointer items-center justify-center gap-2 rounded-control font-semibold select-none transition-[transform,box-shadow,background-color,border-color,color] duration-[250ms] ease-playful disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-card hover:bg-primary-hover hover:shadow-card-hover motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]",
        accent:
          "bg-accent text-accent-foreground shadow-card hover:shadow-card-hover motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]",
        lime: "bg-lime text-ink shadow-soft hover:shadow-card motion-safe:hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-primary-strong hover:bg-secondary/70 motion-safe:hover:-translate-y-0.5",
        outline:
          "border border-border bg-card text-foreground shadow-soft hover:border-primary/40 hover:text-primary-strong motion-safe:hover:-translate-y-0.5",
        ghost: "text-primary-strong hover:bg-secondary",
        link: "h-auto min-h-0 gap-1.5 rounded-sm px-0 text-primary-strong underline-offset-4 hover:underline",
        destructive:
          "border border-destructive/30 bg-danger-surface text-destructive hover:border-destructive/60",
      },
      size: {
        default: "min-h-13 px-6 py-3 text-sm",
        sm: "min-h-10 px-4 py-2 text-xs",
        lg: "min-h-14 px-8 py-3.5 text-base",
        icon: "size-11 p-0",
      },
    },
    compoundVariants: [{ variant: "link", size: "default", class: "px-0 py-0" }],
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
