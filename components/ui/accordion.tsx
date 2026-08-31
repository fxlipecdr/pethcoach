"use client";
import * as Primitive from "@radix-ui/react-accordion";
import type { ComponentProps } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = Primitive.Root;
export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn("border-b border-border", className)}
      {...props}
    />
  );
}
export function AccordionTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Header>
      <Primitive.Trigger
        className={cn(
          "group flex min-h-18 w-full items-center justify-between gap-5 py-5 text-left text-base font-medium transition-colors hover:text-primary [&[data-state=open]_svg]:rotate-45",
          className,
        )}
        {...props}
      >
        {children}
        <Plus
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-200"
          aria-hidden="true"
        />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}
export function AccordionContent({
  children,
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content className="accordion-content overflow-hidden" {...props}>
      <div
        className={cn(
          "pr-8 pb-6 text-sm leading-relaxed text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    </Primitive.Content>
  );
}
