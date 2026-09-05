"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Loader2,
  ShieldCheck,
  Mail,
  CreditCard,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/primitives";
import { searchInspectorAction } from "@/features/admin/actions";
import type { InspectorSearchResult } from "@/features/admin/contracts";

export function InspectorSearchPanel() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<
    "all" | "assessment" | "customer" | "email"
  >("all");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [results, setResults] = useState<InspectorSearchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 3) {
      setErrorMessage("Digite pelo menos 3 caracteres para buscar.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const res = await searchInspectorAction({
        query: query.trim(),
        searchType,
      });

      if (!res.ok || !res.data) {
        setErrorMessage(res.error || "Erro ao consultar registros.");
        setResults(null);
      } else {
        setResults(res.data);
        setHasSearched(true);
      }
    });
  };

  const totalHits = results
    ? results.assessments.length +
      results.entitlements.length +
      results.emailLogs.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Search Input Card */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label
              htmlFor="inspector-query"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Termo de Busca Diagnóstica
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  id="inspector-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isPending}
                  placeholder="ID da avaliação, ID de cliente Stripe (cus_...) ou endereço de e-mail"
                  className="w-full rounded-control border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
              </div>
              <Button type="submit" disabled={isPending || !query.trim()} className="gap-2">
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                <span>Buscar</span>
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Consultas por e-mail mascaram automaticamente os dados para conformidade com a LGPD.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground mr-1">Filtrar escopo:</span>
            {[
              { id: "all", label: "Tudo" },
              { id: "assessment", label: "Avaliações" },
              { id: "customer", label: "Habilitações / Clientes" },
              { id: "email", label: "Logs de E-mail" },
            ].map((opt) => (
              <Button
                key={opt.id}
                type="button"
                variant={searchType === opt.id ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-7"
                onClick={() => setSearchType(opt.id as typeof searchType)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </form>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </Card>

      {/* Results View */}
      {hasSearched && results ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Resultados encontrados: {totalHits}</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="size-3.5" />
              Conformidade LGPD Ativa (Zero PII)
            </span>
          </div>

          {totalHits === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum registro encontrado para &ldquo;{query}&rdquo;.
              </p>
            </Card>
          ) : null}

          {/* Section 1: Assessments */}
          {results.assessments.length > 0 ? (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <ClipboardList className="size-4 text-primary-strong" />
                <h3>Avaliações Comportamentais ({results.assessments.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {results.assessments.map((a) => (
                  <div key={a.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {a.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={`text-[10px] ${
                            a.safetyStatus === "CONTINUE"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                              : a.safetyStatus === "REFER"
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-destructive/10 text-destructive border-destructive/30"
                          }`}
                        >
                          {a.safetyStatus}
                        </Badge>
                        <Badge className="text-[10px] bg-muted text-foreground border-border">
                          {a.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span>Problema: {a.problemSlug}</span>
                      {a.segment ? <span>Segmento: {a.segment}</span> : null}
                      <span>Conta Vinculada: {a.hasUser ? "Sim" : "Não (Anônimo)"}</span>
                      <span>Início: {new Date(a.startedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Section 2: Entitlements */}
          {results.entitlements.length > 0 ? (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <CreditCard className="size-4 text-primary-strong" />
                <h3>Habilitações e Assinaturas ({results.entitlements.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {results.entitlements.map((e) => (
                  <div key={e.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {e.scope}
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          e.status === "active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-muted text-foreground border-border"
                        }`}
                      >
                        {e.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      {e.stripeCustomerId ? (
                        <span className="font-mono">Stripe: {e.stripeCustomerId}</span>
                      ) : (
                        <span>Stripe: Não associado</span>
                      )}
                      <span>Início: {new Date(e.startsAt).toLocaleDateString("pt-BR")}</span>
                      {e.expiresAt ? (
                        <span>Expira em: {new Date(e.expiresAt).toLocaleDateString("pt-BR")}</span>
                      ) : (
                        <span>Sem expiração</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {/* Section 3: Email Delivery Logs */}
          {results.emailLogs.length > 0 ? (
            <Card className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Mail className="size-4 text-primary-strong" />
                <h3>Logs de Entrega Transacional ({results.emailLogs.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {results.emailLogs.map((log) => (
                  <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {log.maskedEmail}
                      </span>
                      <div className="flex items-center gap-1">
                        {log.status === "sent" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <CheckCircle2 className="size-3" /> Enviado
                          </span>
                        ) : log.status === "skipped" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                            <AlertCircle className="size-3" /> Ignorado ({log.skipReason || "opt-out"})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-destructive font-medium">
                            <XCircle className="size-3" /> Falhou
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-mono">Template: {log.templateKey}</span>
                      <span className="font-mono text-[10px] truncate max-w-[200px]">
                        Idemp: {log.idempotencyKey}
                      </span>
                      <span>
                        Data: {new Date(log.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
