"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { Stepper } from "@/components/ui/stepper";
import { Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Field } from "@/components/ui/field";
import { UIKitPanels } from "@/components/pethcoach/ui-kit-panels";
import {
  Badge,
  Card,
  Input,
  Select,
  Skeleton,
  Progress,
  EmptyState,
} from "@/components/ui/primitives";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { PethMascot, type MascotMood } from "@/components/pethcoach/peth-mascot";

const mascotMoods: Array<{ mood: MascotMood; label: string; description: string }> = [
  { mood: "happy", label: "Feliz", description: "Boas-vindas e incentivo geral" },
  { mood: "celebrating", label: "Comemorando", description: "Conquistas e fim de etapas" },
  { mood: "encouraging", label: "Encorajador", description: "Progresso e motivação diária" },
  { mood: "thinking", label: "Pensando", description: "Perguntas de quiz e reflexão" },
  { mood: "pointing", label: "Apontando", description: "Focos de atenção e dicas práticas" },
  { mood: "neutral", label: "Neutro", description: "Instruções objetivas e contexto" },
  { mood: "surprised", label: "Atento", description: "Gatilhos e estímulos do cão" },
  { mood: "resting", label: "Descansando", description: "Pausas e descompressão" },
];

const sampleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe pelo menos 2 caracteres.")
    .max(40, "Use até 40 caracteres."),
  size: z.enum(["small", "medium", "large"]),
});
type Sample = z.infer<typeof sampleSchema>;

export function UIKit() {
  const [feedback, setFeedback] = useState(false);
  const [choice, setChoice] = useState("short");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Sample>({
    resolver: zodResolver(sampleSchema),
    defaultValues: { name: "", size: "small" },
  });
  return (
    <div className="space-y-8">
      <Toaster />
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          {
            name: "Marca",
            color: "bg-brand-700",
            text: "text-white",
            value: "--brand-700",
          },
          {
            name: "Ação",
            color: "bg-primary",
            text: "text-white",
            value: "--primary",
          },
          {
            name: "Suporte",
            color: "bg-secondary",
            text: "text-brand-700",
            value: "--secondary",
          },
          {
            name: "Superfície",
            color: "bg-card",
            text: "text-foreground",
            value: "--card",
          },
        ].map((token) => (
          <div
            key={token.name}
            className={`rounded-xl border border-border p-5 ${token.color} ${token.text}`}
          >
            <p className="font-medium">{token.name}</p>
            <p className="mt-5 text-xs">{token.value}</p>
          </div>
        ))}
      </div>
      <Card className="rounded-3xl p-6 sm:p-8">
        <h2 className="mb-5 text-xl font-bold tracking-tight">Ações e estados</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setFeedback(true)}>Mostrar confirmação</Button>
          <Button variant="outline" onClick={() => setFeedback(false)}>
            Limpar confirmação
          </Button>
          <Button disabled>Indisponível</Button>
          <Button
            variant="outline"
            onClick={() =>
              toast("Notificação de exemplo", {
                description: "Demonstração local. Nenhum dado foi enviado.",
              })
            }
          >
            Testar notificação
          </Button>
          <Button loading loadingText="Carregando exemplo">
            Ação de exemplo
          </Button>
        </div>
        <div
          id="sample-feedback"
          role="status"
          aria-live="polite"
          className="mt-4 min-h-7 text-sm font-medium text-primary"
        >
          {feedback ? (
            <span className="flex items-center gap-2">
              <Check className="size-4" aria-hidden="true" /> Exemplo
              confirmado. Nenhum dado foi salvo.
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Badge>Em preparação</Badge>
          <Badge className="bg-success-surface text-foreground">Concluído</Badge>
          <Badge className="bg-warning-surface text-foreground">Atenção</Badge>
        </div>
      </Card>

      <Card className="rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Mascote Peth (Expressões & Emoções)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Vetor SVG proprietário com 8 estados emocionais adaptados para microinterações do usuário.
            </p>
          </div>
          <Badge>DESIGN SYSTEM</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mascotMoods.map((item) => (
            <div
              key={item.mood}
              className="flex flex-col items-center text-center p-4 rounded-2xl border border-border/70 bg-secondary/40 hover:bg-secondary/70 transition-colors"
            >
              <div className="flex size-20 items-center justify-center">
                <PethMascot mood={item.mood} size={64} />
              </div>
              <span className="mt-2 text-sm font-bold text-foreground">{item.label}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Formulário de demonstração</h2>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Validação local. Não cria um perfil e não envia dados.
          </p>
          <form
            noValidate
            onSubmit={handleSubmit(() => setFeedback(true))}
            className="space-y-5"
          >
            <Field
              id="sample-name"
              label="Nome do cão"
              error={errors.name?.message}
              required
            >
              <Input
                id="sample-name"
                required
                autoComplete="off"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "sample-name-error" : undefined}
                {...register("name")}
              />
            </Field>
            <div>
              <label
                htmlFor="sample-size"
                className="mb-2 block text-sm font-medium"
              >
                Porte
              </label>
              <Select id="sample-size" {...register("size")}>
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </Select>
            </div>
            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Validando exemplo"
            >
              Validar exemplo
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-5 text-xl font-semibold">Escolhas e progresso</h2>
          <fieldset>
            <legend className="mb-3 text-sm">Qual ritmo cabe na rotina?</legend>
            <div className="space-y-3">
              {[
                { id: "short", text: "Um passo curto por vez" },
                { id: "steady", text: "Uma rotina com mais tempo" },
              ].map((option) => (
                <ChoiceCard
                  key={option.id}
                  title={option.text}
                  name="sample-rhythm"
                  value={option.id}
                  checked={choice === option.id}
                  onChange={() => setChoice(option.id)}
                />
              ))}
              <ChoiceCard
                name="sample-rhythm"
                value="disabled"
                title="Opção indisponível"
                description="Exemplo de escolha desabilitada."
                disabled
              />
            </div>
          </fieldset>
          <div className="mt-7">
            <div className="mb-6">
              <Stepper
                steps={["Contexto", "Rotina", "Revisão"]}
                current={1}
                label="Exemplo de etapas"
              />
            </div>
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Exemplo de progresso</span>
              <span>1 de 3 etapas</span>
            </div>
            <Progress value={33} label="Exemplo: 1 de 3 etapas" />
          </div>
        </Card>
      </div>
      <Card>
        <h2 className="mb-5 text-xl font-semibold">Diálogo acessível</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Abrir exemplo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="pr-8 text-xl font-semibold">
              No ritmo de vocês
            </DialogTitle>
            <DialogDescription className="mt-3 text-muted-foreground">
              Este diálogo demonstra foco, navegação por teclado e fechamento
              com Escape. Nenhuma ação é realizada.
            </DialogDescription>
            <DialogClose asChild>
              <Button className="mt-6">Entendi</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </Card>
      <UIKitPanels />
      <div className="flex gap-3 rounded-2xl border border-border bg-secondary p-5">
        <ShieldCheck
          className="size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-medium text-brand-700">
            Um limite de segurança precisa ser visível.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Exemplo visual de aviso. Mensagens de triagem serão implementadas e
            revisadas na fase P5.
          </p>
        </div>
      </div>
      <EmptyState title="Ainda não há um plano">
        <p>
          Quando essa etapa estiver disponível, o próximo passo aparecerá aqui.
        </p>
      </EmptyState>
      <Card aria-busy="true">
        <span className="sr-only">Exemplo de carregamento</span>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-4 h-4 w-full" />
      </Card>
    </div>
  );
}
