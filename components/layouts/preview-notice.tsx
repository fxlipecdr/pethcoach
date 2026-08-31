import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function PreviewNotice() {
  return (
    <aside
      aria-label="Aviso da prévia"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-control border border-border bg-warning px-4 py-3 text-xs"
    >
      <span>Prévia de layout · sem conta, dados ou ações de negócio.</span>
      <Link
        href="/dev/ui-kit"
        className="inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao UI kit
      </Link>
    </aside>
  );
}
