"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      containerAriaLabel="Notificações"
      closeButton
      toastOptions={{
        className: "peth-toast",
        duration: 4500,
        closeButtonAriaLabel: "Fechar notificação",
      }}
    />
  );
}
