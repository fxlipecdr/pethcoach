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

export type ModuleRow = {
  id: string;
  problem_id: string;
  slug: string;
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_duration_minutes: number;
  setup_instructions: string;
  steps: Json;
  success_criteria: string;
  stop_conditions: string;
  tags: string[];
  contraindications: string[];
  version: number;
  status: "draft" | "reviewed" | "published" | "archived";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanRow = {
  id: string;
  user_id: string;
  dog_id: string;
  assessment_id: string;
  problem_id: string;
  status: "active" | "completed" | "paused" | "archived";
  current_day: number;
  total_days: number;
  planner_type: "deterministic_fallback" | "llm_structured";
  prompt_version: string | null;
  model_version: string | null;
  created_at: string;
  updated_at: string;
};

export type PlanTaskRow = {
  id: string;
  plan_id: string;
  day_number: number;
  order_index: number;
  module_id: string;
  status: "pending" | "completed" | "skipped";
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type EntitlementRow = {
  id: string;
  user_id: string;
  scope: "full_program" | "subscription";
  status: "active" | "past_due" | "canceled" | "expired";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyCheckinRow = {
  id: string;
  plan_id: string;
  day_number: number;
  user_id: string;
  mood: "calm" | "moderate" | "needed_pause";
  difficulty_rating: "easy" | "adequate" | "challenging";
  safety_flag: "none" | "pain_suspected" | "distress_extreme" | "aggression_risk";
  notes: string | null;
  completed_at: string;
  created_at: string;
  updated_at: string;
};

export type PlanMilestoneRow = {
  id: string;
  plan_id: string;
  user_id: string;
  key:
    | "first_training_done"
    | "pause_honored"
    | "constancia_serena"
    | "week_one_done"
    | "program_completed";
  title: string;
  description: string;
  unlocked_at: string;
  created_at: string;
};

export type PlanAdaptationRow = {
  id: string;
  plan_id: string;
  user_id: string;
  trigger_checkin_id: string | null;
  adaptation_type:
    | "consolidation"
    | "repeat_day"
    | "progression"
    | "safety_pause";
  reason: string;
  created_at: string;
};

export type BillingCustomerRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
};

export type ProcessedWebhookEventRow = {
  id: string;
  event_id: string;
  event_type: string;
  processed_at: string;
};

export type EmailPreferencesRow = {
  id: string;
  user_id: string;
  training_reminders: boolean;
  milestone_celebrations: boolean;
  billing_notifications: boolean;
  marketing_tips: boolean;
  unsubscribed_all: boolean;
  unsubscribe_token: string;
  created_at: string;
  updated_at: string;
};

export type EmailDeliveryLogRow = {
  id: string;
  user_id: string | null;
  recipient_email: string;
  template_key: string;
  idempotency_key: string;
  status: "pending" | "sent" | "skipped" | "failed";
  skip_reason: string | null;
  provider_message_id: string | null;
  metadata: Json;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export type OperatorRoleRow = {
  id: string;
  user_id: string;
  role: "admin" | "reviewer" | "operator";
  created_at: string;
  updated_at: string;
};

export type ModuleRevisionRow = {
  id: string;
  module_id: string;
  operator_id: string;
  action: "create" | "update" | "submit_review" | "approve_publish" | "archive";
  from_status: string;
  to_status: string;
  notes: string;
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
        Insert: {
          id?: string;
          anonymous_id?: string | null;
          user_id?: string | null;
          touch_type: "first" | "last";
          source?: string | null;
          medium?: string | null;
          campaign?: string | null;
          referrer?: string | null;
          landing?: string | null;
          click_ids?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          anonymous_id: string | null;
          user_id: string | null;
          touch_type: "first" | "last";
          source: string | null;
          medium: string | null;
          campaign: string | null;
          referrer: string | null;
          landing: string | null;
          click_ids: Json;
          updated_at: string;
        }>;
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
        Update: Partial<Pick<AssessmentRow, "dog_id">>;
        Relationships: [];
      };
      safety_events: {
        Row: SafetyEventRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      modules: {
        Row: ModuleRow;
        Insert: Pick<
          ModuleRow,
          | "problem_id"
          | "slug"
          | "title"
          | "category"
          | "difficulty"
          | "estimated_duration_minutes"
          | "setup_instructions"
          | "steps"
          | "success_criteria"
          | "stop_conditions"
        > &
          Partial<
            Pick<
              ModuleRow,
              | "id"
              | "tags"
              | "contraindications"
              | "version"
              | "status"
              | "reviewed_by"
              | "reviewed_at"
              | "created_at"
              | "updated_at"
            >
          >;
        Update: Partial<
          Pick<
            ModuleRow,
            | "title"
            | "category"
            | "difficulty"
            | "estimated_duration_minutes"
            | "setup_instructions"
            | "steps"
            | "success_criteria"
            | "stop_conditions"
            | "tags"
            | "contraindications"
            | "version"
            | "status"
            | "reviewed_by"
            | "reviewed_at"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      plans: {
        Row: PlanRow;
        Insert: Pick<
          PlanRow,
          "user_id" | "dog_id" | "assessment_id" | "problem_id" | "planner_type"
        > &
          Partial<
            Pick<
              PlanRow,
              | "id"
              | "status"
              | "current_day"
              | "total_days"
              | "prompt_version"
              | "model_version"
            >
          >;
        Update: Partial<
          Pick<
            PlanRow,
            "status" | "current_day"
          >
        >;
        Relationships: [];
      };
      plan_tasks: {
        Row: PlanTaskRow;
        Insert: Pick<
          PlanTaskRow,
          "plan_id" | "day_number" | "order_index" | "module_id"
        > &
          Partial<
            Pick<
              PlanTaskRow,
              "id" | "status" | "completed_at" | "notes"
            >
          >;
        Update: Partial<
          Pick<
            PlanTaskRow,
            "status" | "completed_at" | "notes"
          >
        >;
        Relationships: [];
      };
      entitlements: {
        Row: EntitlementRow;
        Insert: Pick<EntitlementRow, "user_id" | "scope"> &
          Partial<
            Pick<
              EntitlementRow,
              | "id"
              | "status"
              | "starts_at"
              | "expires_at"
              | "stripe_customer_id"
              | "stripe_subscription_id"
            >
          >;
        Update: Partial<
          Pick<
            EntitlementRow,
            | "status"
            | "expires_at"
            | "stripe_customer_id"
            | "stripe_subscription_id"
            | "updated_at"
          >
        >;
        Relationships: [];
      };
      daily_checkins: {
        Row: DailyCheckinRow;
        Insert: Pick<
          DailyCheckinRow,
          "plan_id" | "day_number" | "user_id" | "mood"
        > &
          Partial<
            Pick<
              DailyCheckinRow,
              | "id"
              | "difficulty_rating"
              | "safety_flag"
              | "notes"
              | "completed_at"
            >
          >;
        Update: Partial<
          Pick<
            DailyCheckinRow,
            "mood" | "difficulty_rating" | "safety_flag" | "notes"
          >
        >;
        Relationships: [];
      };
      plan_milestones: {
        Row: PlanMilestoneRow;
        Insert: Pick<
          PlanMilestoneRow,
          "plan_id" | "user_id" | "key" | "title" | "description"
        > &
          Partial<
            Pick<
              PlanMilestoneRow,
              "id" | "unlocked_at"
            >
          >;
        Update: never;
        Relationships: [];
      };
      plan_adaptations: {
        Row: PlanAdaptationRow;
        Insert: Pick<
          PlanAdaptationRow,
          "plan_id" | "user_id" | "adaptation_type" | "reason"
        > &
          Partial<
            Pick<
              PlanAdaptationRow,
              "id" | "trigger_checkin_id"
            >
          >;
        Update: never;
        Relationships: [];
      };
      billing_customers: {
        Row: BillingCustomerRow;
        Insert: Pick<BillingCustomerRow, "user_id" | "stripe_customer_id"> &
          Partial<Pick<BillingCustomerRow, "id">>;
        Update: Partial<Pick<BillingCustomerRow, "stripe_customer_id">>;
        Relationships: [];
      };
      processed_webhook_events: {
        Row: ProcessedWebhookEventRow;
        Insert: Pick<ProcessedWebhookEventRow, "event_id" | "event_type"> &
          Partial<Pick<ProcessedWebhookEventRow, "id" | "processed_at">>;
        Update: never;
        Relationships: [];
      };
      email_preferences: {
        Row: EmailPreferencesRow;
        Insert: Pick<EmailPreferencesRow, "user_id" | "unsubscribe_token"> &
          Partial<
            Pick<
              EmailPreferencesRow,
              | "id"
              | "training_reminders"
              | "milestone_celebrations"
              | "billing_notifications"
              | "marketing_tips"
              | "unsubscribed_all"
            >
          >;
        Update: Partial<
          Pick<
            EmailPreferencesRow,
            | "training_reminders"
            | "milestone_celebrations"
            | "billing_notifications"
            | "marketing_tips"
            | "unsubscribed_all"
            | "unsubscribe_token"
          >
        >;
        Relationships: [];
      };
      email_delivery_logs: {
        Row: EmailDeliveryLogRow;
        Insert: Pick<
          EmailDeliveryLogRow,
          "recipient_email" | "template_key" | "idempotency_key" | "status"
        > &
          Partial<
            Pick<
              EmailDeliveryLogRow,
              | "id"
              | "user_id"
              | "skip_reason"
              | "provider_message_id"
              | "metadata"
              | "error_message"
              | "sent_at"
            >
          >;
        Update: Partial<
          Pick<
            EmailDeliveryLogRow,
            | "status"
            | "skip_reason"
            | "provider_message_id"
            | "metadata"
            | "error_message"
            | "sent_at"
          >
        >;
        Relationships: [];
      };
      operator_roles: {
        Row: OperatorRoleRow;
        Insert: Pick<OperatorRoleRow, "user_id" | "role"> &
          Partial<Pick<OperatorRoleRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<Pick<OperatorRoleRow, "role">>;
        Relationships: [];
      };
      module_revisions: {
        Row: ModuleRevisionRow;
        Insert: Pick<
          ModuleRevisionRow,
          "module_id" | "operator_id" | "action" | "from_status" | "to_status" | "notes"
        > &
          Partial<Pick<ModuleRevisionRow, "id" | "created_at">>;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      claim_assessment: {
        Args: {
          p_assessment_id: string;
          p_token_hash: string;
          p_dog_id?: string | null;
        };
        Returns: {
          assessment_id: string;
          user_id: string;
          dog_id: string | null;
          problem_slug: string;
          safety_status: string;
          claimed_at: string;
        }[];
      };
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
