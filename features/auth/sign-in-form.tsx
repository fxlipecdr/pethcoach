"use client";

import Link from "next/link";
import { useActionState, useState, useSyncExternalStore } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { Field } from "@/components/ui/field";
import { Feedback } from "@/components/ui/feedback";
import { readAnonymousContext } from "@/features/onboarding/local-context";
import { requestMagicLink } from "./actions";
import { initialAuthState } from "./contracts";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function hasLocalContext() {
  try {
    return Boolean(readAnonymousContext(window.localStorage));
  } catch {
    return false;
  }
}

export function SignInForm({
  enabled,
  next,
  linkError,
}: {
  enabled: boolean;
  next: string;
  linkError: boolean;
}) {
  const [state, action, pending] = useActionState(
    requestMagicLink,
    initialAuthState,
  );
  const [email, setEmail] = useState("");
  const hasDraft = useSyncExternalStore(
    subscribeToStorage,
    hasLocalContext,
    () => false,
  );
  return (
    <Card className="p-6 sm:p-8">
      <span className="mb-6 inline-flex size-12 items-center justify-center rounded-control bg-secondary text-primary">
        <Mail className="size-5" aria-hidden="true" />
      </span>
      <p className="eyebrow mb-3">SUA CONTA PETHCOACH</p>
      <h1 className="app-heading">Um lugar para a rotina de vocês</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Entre ou crie sua conta com um link no e-mail. Sem precisar lembrar de
        mais uma senha.
      </p>
      {!enabled ? (
        <Feedback className="mt-6" title="Acesso aguardando configuração">
          O Supabase ainda não está conectado neste ambiente. Nenhum cadastro,
          e-mail ou pagamento é realizado nesta tela.
        </Feedback>
      ) : null}
      {linkError ? (
        <Feedback
          className="mt-6"
          tone="error"
          title="Não conseguimos confirmar o acesso"
        >
          O link pode ter expirado, já ter sido usado ou ter sido aberto em
          outro navegador. Solicite um novo link abaixo.
        </Feedback>
      ) : null}
      {hasDraft ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Sua etapa anterior permanece salva neste navegador. Entrar não apaga
          esse contexto.
        </p>
      ) : null}
      <form action={action} className="mt-6 space-y-5">
        <input type="hidden" name="next" value={next} />
        <Field
          id="email"
          label="Seu e-mail"
          error={state.fieldError}
          hint="Abra o link neste mesmo navegador. Enviaremos somente o acesso à sua conta."
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!enabled || pending}
            aria-invalid={Boolean(state.fieldError)}
            aria-describedby={`email-hint${state.fieldError ? " email-error" : ""}`}
            placeholder="voce@exemplo.com"
          />
        </Field>
        {state.message ? (
          <Feedback
            announce
            tone={state.status === "success" ? "success" : "error"}
            title={
              state.status === "success"
                ? "Confira seu e-mail"
                : "Não foi possível continuar"
            }
          >
            {state.message}
          </Feedback>
        ) : null}
        <Button
          type="submit"
          className="w-full justify-between"
          disabled={!enabled}
          loading={pending}
          loadingText="Solicitando link…"
        >
          {state.status === "success"
            ? "Pedir outro link"
            : "Receber link de acesso"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        No primeiro acesso, uma conta será criada para salvar os perfis dos seus
        cães. Planos e cobranças ainda não estão disponíveis.
      </p>
      <Link href="/#problemas" className="nav-link mt-5 text-sm text-primary">
        Conhecer os programas
      </Link>
    </Card>
  );
}
