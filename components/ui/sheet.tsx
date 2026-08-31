"use client";
import * as Primitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Primitive.Root;
export const SheetTrigger = Primitive.Trigger;
export const SheetClose = Primitive.Close;
export const SheetTitle = Primitive.Title;
export const SheetDescription = Primitive.Description;
export function SheetContent({
  children,
  className,
  side = "right",
  closeLabel = "Fechar menu",
  ...props
}: ComponentProps<typeof Primitive.Content> & {
  side?: "right" | "bottom";
  closeLabel?: string;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-foreground/30" />
      <Primitive.Content
        data-side={side}
        className={cn(
          "sheet-content fixed z-50 flex flex-col overflow-y-auto overscroll-contain border-border bg-card p-6 shadow-xl",
          side === "right"
            ? "inset-y-0 right-0 w-[min(88vw,380px)] border-l"
            : "inset-x-0 bottom-0 mx-auto max-h-[calc(100dvh-1rem)] w-full max-w-2xl rounded-t-panel border-x border-t pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          className,
        )}
        {...props}
      >
        {children}
        <Primitive.Close
          aria-label={closeLabel}
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-muted"
        >
          <X className="size-5" aria-hidden="true" />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
