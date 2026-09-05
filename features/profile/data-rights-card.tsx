"use client";

import { useActionState, useId, useState } from "react";
import { Download, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { Field } from "@/components/ui/field";
import { Feedback } from "@/components/ui/feedback";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { initialAuthState } from "@/features/auth/contracts";
import { deleteAccount } from "./actions";
import { deleteAccountConfirmation } from "./contracts";

/**
 * P14 — direitos do titular. A exportação é um download direto; a exclusão
 * exige confirmação digitada e explica o que fica e o que sai.
 */
export function DataRightsCard() {
  const [state, action, pending] = useActionState(
    deleteAccount,
    initialAuthState,
  );
  const [open, setOpen] = useState(false);
  const confirmationId = useId();

  return (
    <Card>
      <h2 className="text-lg font-semibold">Seus dados</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Você pode levar uma cópia de tudo que guardamos sobre você e seus cães,
        ou encerrar a conta de vez.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline">
          <a href="/api/conta/exportar" download>
            <Download aria-hidden="true" />
            Baixar meus dados
          </a>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 aria-hidden="true" />
              Excluir minha conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Excluir sua conta</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>

            <div className="mt-5 space-y-4 text-sm leading-relaxed">
              <div>
                <p className="font-bold text-foreground">O que é apagado</p>
                <p className="mt-1 text-muted-foreground">
                  Seu nome, os perfis dos seus cães, avaliações, planos de
                  treino, check-ins, marcos e preferências de e-mail.
                </p>
              </div>
              <div>
                <p className="font-bold text-foreground">O que é mantido</p>
                <p className="mt-1 text-muted-foreground">
                  Os registros de pagamentos já realizados, exigidos por
                  obrigação fiscal. Eles deixam de estar ligados ao seu nome ou
                  ao seu e-mail.
                </p>
              </div>
            </div>

            <form action={action} className="mt-6 space-y-5">
              {state.message ? (
                <Feedback tone="error" announce title={state.message} />
              ) : null}
              <Field
                id={confirmationId}
                label={`Digite ${deleteAccountConfirmation} para confirmar`}
                error={state.fieldError}
                required
              >
                <Input
                  id={confirmationId}
                  name="confirmacao"
                  autoComplete="off"
                  autoCapitalize="characters"
                  required
                  aria-invalid={state.fieldError ? true : undefined}
                  aria-describedby={
                    state.fieldError ? `${confirmationId}-error` : undefined
                  }
                />
              </Field>
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  type="submit"
                  variant="destructive"
                  loading={pending}
                  loadingText="Excluindo…"
                >
                  <TriangleAlert aria-hidden="true" />
                  Excluir definitivamente
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Manter minha conta
                  </Button>
                </DialogClose>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
