"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, Input, Select } from "@/components/ui/primitives";
import { Field } from "@/components/ui/field";
import { Feedback } from "@/components/ui/feedback";
import { ChoiceCard } from "@/components/ui/choice-card";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";

type Density = "comfortable" | "compact";
export function UIKitPanels() {
  const [open, setOpen] = useState(false);
  const [density, setDensity] = useState<Density>("comfortable");
  const [draft, setDraft] = useState<Density>("comfortable");
  const [message, setMessage] = useState("");
  return (
    <>
      <Card id="paineis">
        <h2 className="text-xl font-semibold">Drawer e escolhas locais</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Um painel inferior para decisões curtas. A preferência abaixo afeta
          apenas este exemplo e não é salva.
        </p>
        <div
          className={`mt-5 rounded-control border border-border bg-muted ${density === "comfortable" ? "p-6" : "p-3"}`}
        >
          <p className="text-sm font-medium">Cartão de demonstração</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Espaçamento {density === "comfortable" ? "confortável" : "compacto"}
          </p>
        </div>
        <Drawer
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (value) setDraft(density);
          }}
        >
          <DrawerTrigger asChild>
            <Button variant="outline" className="mt-5">
              Ajustar exemplo
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="pr-10 text-xl font-semibold">
              Preferências do exemplo
            </DrawerTitle>
            <DrawerDescription className="mt-2 text-sm text-muted-foreground">
              Altere apenas o espaçamento do cartão de demonstração. Nada é
              salvo ou enviado.
            </DrawerDescription>
            <fieldset className="mt-7 space-y-3">
              <legend className="mb-3 text-sm font-medium">Espaçamento</legend>
              <ChoiceCard
                name="density"
                title="Espaçamento confortável"
                description="Mais espaço ao redor do conteúdo."
                checked={draft === "comfortable"}
                onChange={() => setDraft("comfortable")}
                value="comfortable"
              />
              <ChoiceCard
                name="density"
                title="Espaçamento compacto"
                description="Menos espaço, mantendo a leitura."
                checked={draft === "compact"}
                onChange={() => setDraft("compact")}
                value="compact"
              />
            </fieldset>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
              <Button
                onClick={() => {
                  setDensity(draft);
                  setMessage(
                    `Espaçamento ${draft === "comfortable" ? "confortável" : "compacto"} aplicado ao exemplo. Nada foi salvo.`,
                  );
                  setOpen(false);
                }}
              >
                Aplicar ao exemplo
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
        <p aria-live="polite" className="mt-3 min-h-5 text-xs text-primary-strong">
          {message}
        </p>
      </Card>
      <Card id="estados">
        <h2 className="text-xl font-semibold">Estados de formulário</h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">
          Exemplos estáticos de erro, indisponibilidade e leitura. Não são dados
          de uma conta.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="state-email"
            label="E-mail de exemplo"
            hint="Campo sem envio."
            error="Estado de erro: confira o formato do e-mail."
          >
            <Input
              id="state-email"
              type="email"
              aria-invalid="true"
              aria-describedby="state-email-hint state-email-error"
              placeholder="nome@exemplo.com"
            />
          </Field>
          <Field
            id="state-disabled"
            label="Campo indisponível"
            hint="Será liberado quando a integração existir."
          >
            <Input
              id="state-disabled"
              disabled
              placeholder="Indisponível neste exemplo"
              aria-describedby="state-disabled-hint"
            />
          </Field>
          <Field id="state-readonly" label="Informação somente leitura">
            <Input id="state-readonly" readOnly value="Demonstração local" />
          </Field>
          <Field id="state-select" label="Seleção indisponível">
            <Select id="state-select" disabled defaultValue="pending">
              <option value="pending">Em preparação</option>
            </Select>
          </Field>
        </div>
      </Card>
      <Card>
        <h2 className="mb-5 text-xl font-semibold">Feedback com contexto</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Feedback tone="info" title="Informação de exemplo">
            Explique o que acontece a seguir.
          </Feedback>
          <Feedback tone="success" title="Confirmação de exemplo">
            Confirme a ação sem depender apenas da cor.
          </Feedback>
          <Feedback tone="warning" title="Atenção de exemplo">
            Apresente o limite antes da decisão.
          </Feedback>
          <Feedback tone="error" title="Erro de exemplo">
            Explique o problema e como tentar novamente.
          </Feedback>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Confirmação de exemplo", {
                description: "Nenhum dado foi salvo.",
              })
            }
          >
            Testar toast de sucesso
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              toast.error("Erro de exemplo", {
                description: "Demonstração visual. Nenhuma requisição falhou.",
              })
            }
          >
            Testar toast de erro
          </Button>
        </div>
      </Card>
    </>
  );
}
