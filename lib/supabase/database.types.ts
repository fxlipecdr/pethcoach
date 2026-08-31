// Hand-maintained against migrations; compare with CLI-generated types once Supabase is connected.
export type DogRow = {
  id: string;
  owner_id: string;
  name: string;
  birth_date: string | null;
  sex: "male" | "female" | null;
  size: "small" | "medium" | "large" | "giant" | null;
  breed_text: string | null;
  neutered: boolean | null;
  environment: "apartment" | "house" | "other" | null;
  created_at: string;
  updated_at: string;
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
type AttributionRow = {
  id: string;
  anonymous_id: string | null;
  user_id: string | null;
  touch_type: "first" | "last";
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  landing: string | null;
  click_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
};
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          locale: string;
          timezone: string;
          onboarding_source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          locale?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: { name?: string | null; locale?: string; timezone?: string };
        Relationships: [];
      };
      dogs: {
        Row: DogRow;
        Insert: Pick<DogRow, "owner_id" | "name"> &
          Partial<DogEditable> & { id?: string };
        Update: Partial<DogEditable>;
        Relationships: [];
      };
      attribution_touches: {
        Row: AttributionRow;
        Insert: Pick<AttributionRow, "touch_type"> & Partial<AttributionRow>;
        Update: Partial<AttributionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
