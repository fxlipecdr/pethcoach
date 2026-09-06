import type { Metadata } from "next";
import { getPublicEnv } from "@/lib/env/public";
import { ConsentBanner } from "@/components/pethcoach/consent-banner";
import "./globals.css";

export function generateMetadata(): Metadata {
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  return {
    title: {
      default: "PethCoach | Uma rotina mais leve com seu cão",
      template: "%s | PethCoach",
    },
    description:
      "Um passo de cada vez para uma rotina melhor com seu cão. Orientação comportamental baseada em recompensa, com plano diário de 14 dias. O primeiro dia é gratuito.",
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    robots: { index: false, follow: false },
  };
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="antialiased">
        <a
          href="#conteudo"
          className="sr-only fixed top-3 left-3 z-50 rounded-xl bg-primary p-3 text-white focus:not-sr-only"
        >
          Pular para o conteúdo
        </a>
        {children}
        <ConsentBanner />
      </body>
    </html>
  );
}
