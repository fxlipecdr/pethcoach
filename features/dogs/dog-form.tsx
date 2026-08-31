"use client";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Input, Select } from "@/components/ui/primitives";
import { Field } from "@/components/ui/field";
import { Feedback } from "@/components/ui/feedback";
import { saveDog } from "./actions";
import {
  dogFieldsSchema,
  dogOptions,
  emptyDogValues,
  type DogFormState,
  type DogFormValues,
} from "./contracts";

export function DogForm({
  id,
  initialValues = emptyDogValues,
  editing = false,
  preview = false,
}: {
  id: string;
  initialValues?: DogFormValues;
  editing?: boolean;
  preview?: boolean;
}) {
  const [state, action, pending] = useActionState(saveDog, {
    status: "idle",
  } as DogFormState);
  const [values, setValues] = useState(initialValues);
  const [formId] = useState(id);
  const [showServerResult, setShowServerResult] = useState(true);
  const [validation, setValidation] = useState<DogFormState>({
    status: "idle",
  });
  const formRef = useRef<HTMLFormElement>(null);
  const shown: DogFormState =
    validation.status !== "idle"
      ? validation
      : showServerResult && !pending
        ? state
        : { status: "idle" };
  const change = (key: keyof DogFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setValidation({ status: "idle" });
    setShowServerResult(false);
  };
  useEffect(() => {
    if (state.status === "error")
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [state]);
  const inputProps = (key: keyof DogFormValues) => ({
    id: `dog-${key}`,
    name: key,
    value: values[key],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => change(key, event.target.value),
    "aria-invalid": Boolean(shown.errors?.[key]),
    "aria-describedby": shown.errors?.[key] ? `dog-${key}-error` : undefined,
  });
  return (
    <form
      ref={formRef}
      method="post"
      noValidate
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const result = dogFieldsSchema.safeParse(values);
        if (!result.success) {
          const errors = Object.fromEntries(
            result.error.issues.map((issue) => [issue.path[0], issue.message]),
          );
          setValidation({
            status: "error",
            message: "Confira os campos indicados.",
            errors,
          });
          const first = result.error.issues[0]?.path[0];
          if (first)
            formRef.current
              ?.querySelector<HTMLElement>(`#dog-${String(first)}`)
              ?.focus();
          return;
        }
        if (preview) {
          setValidation({
            status: "success",
            message: "Campos validados nesta prévia. Nenhum dado foi salvo.",
          });
          return;
        }
        setValidation({ status: "idle" });
        setShowServerResult(true);
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
    >
      <noscript>
        <p>Ative o JavaScript para validar e salvar este formulário.</p>
      </noscript>
      <input type="hidden" name="id" value={formId} />
      <input type="hidden" name="mode" value={editing ? "update" : "create"} />
      <Card className="p-5 sm:p-8">
        <div className="mb-7 flex items-center gap-4">
          <span className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
            <PawPrint className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Vamos conhecer seu cão</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Só o nome é obrigatório. O restante pode ficar para depois.
            </p>
          </div>
        </div>
        <fieldset disabled={pending} className="space-y-6">
          <legend className="sr-only">Informações do cão</legend>
          <Field
            id="dog-name"
            label="Nome do cão"
            required
            error={shown.errors?.name}
          >
            <Input
              {...inputProps("name")}
              required
              maxLength={60}
              autoComplete="off"
              placeholder="Como você chama seu cão?"
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              id="dog-birth_date"
              label="Data de nascimento"
              hint="Não sabe? Pode deixar em branco."
              error={shown.errors?.birth_date}
            >
              <Input
                {...inputProps("birth_date")}
                type="date"
                min="1990-01-01"
                max={new Date().toISOString().slice(0, 10)}
                aria-describedby={`dog-birth_date-hint${shown.errors?.birth_date ? " dog-birth_date-error" : ""}`}
              />
            </Field>
            <Field id="dog-sex" label="Sexo" error={shown.errors?.sex}>
              <Select {...inputProps("sex")}>
                <option value="">Prefiro informar depois</option>
                {Object.entries(dogOptions.sex).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="dog-size" label="Porte" error={shown.errors?.size}>
              <Select {...inputProps("size")}>
                <option value="">Prefiro informar depois</option>
                {Object.entries(dogOptions.size).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="dog-breed_text"
              label="Raça ou mistura"
              error={shown.errors?.breed_text}
            >
              <Input
                {...inputProps("breed_text")}
                maxLength={80}
                placeholder="Ex.: sem raça definida"
              />
            </Field>
            <Field
              id="dog-neutered"
              label="É castrado?"
              error={shown.errors?.neutered}
            >
              <Select {...inputProps("neutered")}>
                <option value="">Prefiro informar depois</option>
                <option value="yes">Sim</option>
                <option value="no">Não</option>
              </Select>
            </Field>
            <Field
              id="dog-environment"
              label="Onde vocês moram?"
              error={shown.errors?.environment}
            >
              <Select {...inputProps("environment")}>
                <option value="">Prefiro informar depois</option>
                {Object.entries(dogOptions.environment).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </Select>
            </Field>
          </div>
        </fieldset>
      </Card>
      {shown.message ? (
        <Feedback
          announce
          tone={shown.status === "success" ? "success" : "error"}
          title={shown.message}
        />
      ) : null}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost">
          <Link href={preview ? "/dev/ui-kit" : "/app/caes"}>Voltar</Link>
        </Button>
        <Button type="submit" loading={pending} loadingText="Salvando perfil…">
          {preview
            ? "Validar prévia"
            : editing
              ? "Salvar alterações"
              : "Criar perfil do cão"}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Estas informações organizam o perfil do seu cão. Não são uma avaliação
        veterinária e não geram um plano de treino nesta etapa.
      </p>
    </form>
  );
}
