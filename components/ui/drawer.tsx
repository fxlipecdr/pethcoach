"use client";
import type { ComponentProps } from "react";
import { SheetContent } from "./sheet";
export {
  Sheet as Drawer,
  SheetTrigger as DrawerTrigger,
  SheetClose as DrawerClose,
  SheetTitle as DrawerTitle,
  SheetDescription as DrawerDescription,
} from "./sheet";

export function DrawerContent(
  props: Omit<ComponentProps<typeof SheetContent>, "side">,
) {
  return <SheetContent side="bottom" closeLabel="Fechar painel" {...props} />;
}
