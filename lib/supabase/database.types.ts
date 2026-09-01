import type {
  Database as GeneratedDatabase,
  Json,
} from "./database.generated.types";

type PublicTables = GeneratedDatabase["public"]["Tables"];

export type DogRow = Omit<
  PublicTables["dogs"]["Row"],
  "environment" | "sex" | "size"
> & {
  environment: "apartment" | "house" | "other" | null;
  sex: "male" | "female" | null;
  size: "small" | "medium" | "large" | "giant" | null;
};

type DogEditable = Pick<
  DogRow,
  | "name"
  | "birth_date"
  | "sex"
  | "size"
  | "breed_text"
  | "neutered"
  | "environment"
>;

type AttributionRow = Omit<
  PublicTables["attribution_touches"]["Row"],
  "click_ids" | "touch_type"
> & {
  click_ids: Json;
  touch_type: "first" | "last";
};

/**
 * GeneratedDatabase reflects the physical schema. This refinement also models
 * check constraints and authenticated column grants that pg-meta cannot infer.
 */
export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: {
      profiles: {
        Row: PublicTables["profiles"]["Row"];
        Insert: Pick<
          PublicTables["profiles"]["Insert"],
          "id" | "locale" | "name" | "timezone"
        >;
        Update: Pick<
          PublicTables["profiles"]["Update"],
          "locale" | "name" | "timezone"
        >;
        Relationships: PublicTables["profiles"]["Relationships"];
      };
      dogs: {
        Row: DogRow;
        Insert: Pick<DogRow, "owner_id" | "name"> &
          Partial<DogEditable> & { id?: string };
        Update: Partial<DogEditable>;
        Relationships: PublicTables["dogs"]["Relationships"];
      };
      attribution_touches: {
        Row: AttributionRow;
        Insert: never;
        Update: never;
        Relationships: PublicTables["attribution_touches"]["Relationships"];
      };
    };
  };
};
