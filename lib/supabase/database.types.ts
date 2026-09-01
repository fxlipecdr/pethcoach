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

export type ProblemRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  quiz_version: number;
  seo_meta: Json;
  created_at: string;
  updated_at: string;
};

export type QuizQuestionRow = {
  id: string;
  problem_id: string;
  key: string;
  type: "single_choice";
  prompt: string;
  help_text: string | null;
  options_json: Json;
  rules_json: Json;
  order_index: number;
  version: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

export type AssessmentRow = {
  id: string;
  user_id: string | null;
  anonymous_id: string;
  dog_id: string | null;
  problem_id: string;
  quiz_version: number;
  answers_json: Json;
  safety_status: "pending" | "continue" | "refer" | "block";
  safety_rule_version: string | null;
  safety_evaluated_at: string | null;
  segment: string | null;
  status: "in_progress" | "completed";
  anonymous_token_hash: string;
  token_expires_at: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SafetyEventRow = {
  id: string;
  assessment_id: string;
  code: string;
  severity: "info" | "caution" | "urgent";
  outcome: "continue" | "refer" | "block";
  rule_version: string;
  message_key: string;
  evidence_tags: string[];
  recommended_action: string;
  user_action: string | null;
  created_at: string;
};

/**
 * GeneratedDatabase reflects the physical schema. This refinement also models
 * check constraints and authenticated column grants that pg-meta cannot infer.
 */
export type Database = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables" | "Functions"> & {
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
      problems: {
        Row: ProblemRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      quiz_questions: {
        Row: QuizQuestionRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      assessments: {
        Row: AssessmentRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      safety_events: {
        Row: SafetyEventRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      create_anonymous_assessment: {
        Args: {
          p_assessment_id: string;
          p_anonymous_id: string;
          p_problem_slug: string;
          p_token_hash: string;
          p_token_expires_at: string;
          p_rate_key: string;
        };
        Returns: {
          assessment_id: string;
          problem_slug: string;
          quiz_version: number;
          started_at: string;
        }[];
      };
      read_anonymous_assessment: {
        Args: { p_assessment_id: string; p_token_hash: string };
        Returns: {
          assessment_id: string;
          problem_slug: string;
          quiz_version: number;
          answers_json: Json;
          assessment_status: string;
          safety_status: string;
          safety_codes: string[];
          safety_rule_version: string | null;
          safety_evaluated_at: string | null;
          started_at: string;
          completed_at: string | null;
        }[];
      };
      update_anonymous_assessment_answer: {
        Args: {
          p_assessment_id: string;
          p_token_hash: string;
          p_question_key: string;
          p_option_key: string;
        };
        Returns: { answers_json: Json; updated_at: string }[];
      };
      complete_anonymous_assessment: {
        Args: { p_assessment_id: string; p_token_hash: string };
        Returns: {
          assessment_status: string;
          safety_status: string;
          safety_codes: string[];
          safety_rule_version: string;
          completed_at: string;
        }[];
      };
    };
  };
};
