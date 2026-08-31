"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/primitives";
import { Field } from "@/components/ui/field";
import { Feedback } from "@/components/ui/feedback";
import { initialAuthState } from "@/features/auth/contracts";
import { signOut } from "@/features/auth/actions";
import { saveProfile } from "./actions";

export function AccountForm({ name }: { name: string | null }) {
  const [state, action, pending] = useActionState(
    saveProfile,
    initialAuthState,
  );
  const [value, setValue] = useState(name ?? "");
  return (
    <form action={action} className="space-y-5">
      <Field
        id="profile-name"
        label="Como podemos chamar você?"
        hint="Opcional. Use o nome pelo qual prefere ser chamado."
        error={state.fieldError}
      >
        <Input
          id="profile-name"
          name="name"
          autoComplete="given-name"
          maxLength={100}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          readOnly={pending}
          aria-invalid={Boolean(state.fieldError)}
          aria-describedby={`profile-name-hint${state.fieldError ? " profile-name-error" : ""}`}
        />
      </Field>
      {state.message ? (
        <Feedback
          announce
          tone={state.status === "success" ? "success" : "error"}
          title={state.message}
        />
      ) : null}
      <Button type="submit" loading={pending} loadingText="Salvando…">
        Salvar meu nome
      </Button>
    </form>
  );
}
export function SignOutForm() {
  const [state, action, pending] = useActionState(signOut, initialAuthState);
  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <Feedback tone="error" announce title={state.message} />
      ) : null}
      <Button
        type="submit"
        variant="outline"
        loading={pending}
        loadingText="Saindo…"
      >
        Sair desta conta
      </Button>
    </form>
  );
}
