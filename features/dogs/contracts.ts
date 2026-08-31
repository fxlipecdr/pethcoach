import { z } from "zod";

export const dogOptions = {
  sex: { male: "Macho", female: "Fêmea" },
  size: {
    small: "Pequeno",
    medium: "Médio",
    large: "Grande",
    giant: "Gigante",
  },
  environment: { apartment: "Apartamento", house: "Casa", other: "Outro" },
} as const;
const optionalValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    schema.nullable(),
  );
export const dogFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do cão.")
    .max(60, "Use até 60 caracteres."),
  birth_date: optionalValue(
    z.iso
      .date({ error: "Informe uma data válida." })
      .refine(
        (value) =>
          value >= "1990-01-01" &&
          value <= new Date().toISOString().slice(0, 10),
        "Use uma data entre 1990 e hoje.",
      ),
  ),
  sex: optionalValue(z.enum(["male", "female"])),
  size: optionalValue(z.enum(["small", "medium", "large", "giant"])),
  breed_text: z.preprocess(
    (value) =>
      typeof value === "string" && !value.trim() ? null : (value ?? null),
    z.string().trim().max(80, "Use até 80 caracteres.").nullable(),
  ),
  neutered: z
    .enum(["", "yes", "no"])
    .default("")
    .transform((value) => (value === "" ? null : value === "yes")),
  environment: optionalValue(z.enum(["apartment", "house", "other"])),
});
export const dogMutationSchema = dogFieldsSchema.extend({
  id: z.uuid(),
  mode: z.enum(["create", "update"]),
});
export type DogFields = z.output<typeof dogFieldsSchema>;
export type DogFormValues = {
  name: string;
  birth_date: string;
  sex: string;
  size: string;
  breed_text: string;
  neutered: string;
  environment: string;
};
export type DogFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  errors?: Partial<Record<keyof DogFormValues, string>>;
  values?: DogFormValues;
};
export const emptyDogValues: DogFormValues = {
  name: "",
  birth_date: "",
  sex: "",
  size: "",
  breed_text: "",
  neutered: "",
  environment: "",
};
export function dogFormValues(form: FormData): DogFormValues {
  return Object.fromEntries(
    Object.keys(emptyDogValues).map((key) => [
      key,
      typeof form.get(key) === "string" ? form.get(key) : "",
    ]),
  ) as DogFormValues;
}
