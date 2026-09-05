export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          anonymous_id: string
          anonymous_token_hash: string
          answers_json: Json
          completed_at: string | null
          created_at: string
          dog_id: string | null
          id: string
          problem_id: string
          quiz_version: number
          safety_evaluated_at: string | null
          safety_rule_version: string | null
          safety_status: string
          segment: string | null
          started_at: string
          status: string
          token_expires_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          anonymous_token_hash: string
          answers_json?: Json
          completed_at?: string | null
          created_at?: string
          dog_id?: string | null
          id: string
          problem_id: string
          quiz_version: number
          safety_evaluated_at?: string | null
          safety_rule_version?: string | null
          safety_status?: string
          segment?: string | null
          started_at?: string
          status?: string
          token_expires_at: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          anonymous_token_hash?: string
          answers_json?: Json
          completed_at?: string | null
          created_at?: string
          dog_id?: string | null
          id?: string
          problem_id?: string
          quiz_version?: number
          safety_evaluated_at?: string | null
          safety_rule_version?: string | null
          safety_status?: string
          segment?: string | null
          started_at?: string
          status?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      attribution_touches: {
        Row: {
          anonymous_id: string | null
          campaign: string | null
          click_ids: Json
          created_at: string
          id: string
          landing: string | null
          medium: string | null
          referrer: string | null
          source: string | null
          touch_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          campaign?: string | null
          click_ids?: Json
          created_at?: string
          id?: string
          landing?: string | null
          medium?: string | null
          referrer?: string | null
          source?: string | null
          touch_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          campaign?: string | null
          click_ids?: Json
          created_at?: string
          id?: string
          landing?: string | null
          medium?: string | null
          referrer?: string | null
          source?: string | null
          touch_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          completed_at: string
          created_at: string
          day_number: number
          difficulty_rating: string
          id: string
          mood: string
          notes: string | null
          plan_id: string
          safety_flag: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          day_number: number
          difficulty_rating?: string
          id?: string
          mood: string
          notes?: string | null
          plan_id: string
          safety_flag?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          day_number?: number
          difficulty_rating?: string
          id?: string
          mood?: string
          notes?: string | null
          plan_id?: string
          safety_flag?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          birth_date: string | null
          breed_text: string | null
          created_at: string
          environment: string | null
          id: string
          name: string
          neutered: boolean | null
          owner_id: string
          sex: string | null
          size: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          breed_text?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          name: string
          neutered?: boolean | null
          owner_id: string
          sex?: string | null
          size?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          breed_text?: string | null
          created_at?: string
          environment?: string | null
          id?: string
          name?: string
          neutered?: boolean | null
          owner_id?: string
          sex?: string | null
          size?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_delivery_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          metadata: Json
          provider_message_id: string | null
          recipient_email: string
          sent_at: string | null
          skip_reason: string | null
          status: string
          template_key: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          provider_message_id?: string | null
          recipient_email: string
          sent_at?: string | null
          skip_reason?: string | null
          status: string
          template_key: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          provider_message_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          skip_reason?: string | null
          status?: string
          template_key?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          billing_notifications: boolean
          created_at: string
          id: string
          marketing_tips: boolean
          milestone_celebrations: boolean
          training_reminders: boolean
          unsubscribe_token: string
          unsubscribed_all: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_notifications?: boolean
          created_at?: string
          id?: string
          marketing_tips?: boolean
          milestone_celebrations?: boolean
          training_reminders?: boolean
          unsubscribe_token: string
          unsubscribed_all?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_notifications?: boolean
          created_at?: string
          id?: string
          marketing_tips?: boolean
          milestone_celebrations?: boolean
          training_reminders?: boolean
          unsubscribe_token?: string
          unsubscribed_all?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          scope: string
          starts_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          scope: string
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          scope?: string
          starts_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_revisions: {
        Row: {
          action: string
          created_at: string
          from_status: string
          id: string
          module_id: string
          notes: string
          operator_id: string
          to_status: string
        }
        Insert: {
          action: string
          created_at?: string
          from_status: string
          id?: string
          module_id: string
          notes: string
          operator_id: string
          to_status: string
        }
        Update: {
          action?: string
          created_at?: string
          from_status?: string
          id?: string
          module_id?: string
          notes?: string
          operator_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_revisions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string
          contraindications: string[]
          created_at: string
          difficulty: string
          estimated_duration_minutes: number
          id: string
          problem_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          setup_instructions: string
          slug: string
          status: string
          steps: Json
          stop_conditions: string
          success_criteria: string
          tags: string[]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          contraindications?: string[]
          created_at?: string
          difficulty: string
          estimated_duration_minutes: number
          id: string
          problem_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          setup_instructions: string
          slug: string
          status?: string
          steps: Json
          stop_conditions: string
          success_criteria: string
          tags?: string[]
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          contraindications?: string[]
          created_at?: string
          difficulty?: string
          estimated_duration_minutes?: number
          id?: string
          problem_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          setup_instructions?: string
          slug?: string
          status?: string
          steps?: Json
          stop_conditions?: string
          success_criteria?: string
          tags?: string[]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_adaptations: {
        Row: {
          adaptation_type: string
          created_at: string
          id: string
          plan_id: string
          reason: string
          trigger_checkin_id: string | null
          user_id: string
        }
        Insert: {
          adaptation_type: string
          created_at?: string
          id?: string
          plan_id: string
          reason: string
          trigger_checkin_id?: string | null
          user_id: string
        }
        Update: {
          adaptation_type?: string
          created_at?: string
          id?: string
          plan_id?: string
          reason?: string
          trigger_checkin_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_adaptations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_adaptations_trigger_checkin_id_fkey"
            columns: ["trigger_checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_milestones: {
        Row: {
          created_at: string
          description: string
          id: string
          key: string
          plan_id: string
          title: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          key: string
          plan_id: string
          title: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key?: string
          plan_id?: string
          title?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_milestones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          day_number: number
          id: string
          module_id: string
          notes: string | null
          order_index: number
          plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_number: number
          id?: string
          module_id: string
          notes?: string | null
          order_index: number
          plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_number?: number
          id?: string
          module_id?: string
          notes?: string | null
          order_index?: number
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_tasks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          assessment_id: string
          created_at: string
          current_day: number
          dog_id: string
          id: string
          model_version: string | null
          planner_type: string
          problem_id: string
          prompt_version: string | null
          status: string
          total_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          current_day?: number
          dog_id: string
          id?: string
          model_version?: string | null
          planner_type: string
          problem_id: string
          prompt_version?: string | null
          status?: string
          total_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          current_day?: number
          dog_id?: string
          id?: string
          model_version?: string | null
          planner_type?: string
          problem_id?: string
          prompt_version?: string | null
          status?: string
          total_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          created_at: string
          id: string
          quiz_version: number
          seo_meta: Json
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          quiz_version?: number
          seo_meta?: Json
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          quiz_version?: number
          seo_meta?: Json
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          processed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          locale: string
          name: string | null
          onboarding_source: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id: string
          locale?: string
          name?: string | null
          onboarding_source?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          locale?: string
          name?: string | null
          onboarding_source?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          created_at: string
          help_text: string | null
          id: string
          key: string
          options_json: Json
          order_index: number
          problem_id: string
          prompt: string
          rules_json: Json
          status: string
          type: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          help_text?: string | null
          id: string
          key: string
          options_json: Json
          order_index: number
          problem_id: string
          prompt: string
          rules_json?: Json
          status?: string
          type: string
          updated_at?: string
          version: number
        }
        Update: {
          created_at?: string
          help_text?: string | null
          id?: string
          key?: string
          options_json?: Json
          order_index?: number
          problem_id?: string
          prompt?: string
          rules_json?: Json
          status?: string
          type?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_events: {
        Row: {
          assessment_id: string
          code: string
          created_at: string
          evidence_tags: string[]
          id: string
          message_key: string
          outcome: string
          recommended_action: string
          rule_version: string
          severity: string
          user_action: string | null
        }
        Insert: {
          assessment_id: string
          code: string
          created_at?: string
          evidence_tags?: string[]
          id?: string
          message_key: string
          outcome: string
          recommended_action: string
          rule_version: string
          severity: string
          user_action?: string | null
        }
        Update: {
          assessment_id?: string
          code?: string
          created_at?: string
          evidence_tags?: string[]
          id?: string
          message_key?: string
          outcome?: string
          recommended_action?: string
          rule_version?: string
          severity?: string
          user_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_account: { Args: never; Returns: undefined }
      claim_assessment: {
        Args: {
          p_assessment_id: string
          p_dog_id?: string
          p_token_hash: string
        }
        Returns: {
          assessment_id: string
          claimed_at: string
          dog_id: string
          problem_slug: string
          safety_status: string
          user_id: string
        }[]
      }
      complete_anonymous_assessment: {
        Args: { p_assessment_id: string; p_token_hash: string }
        Returns: {
          assessment_status: string
          completed_at: string
          safety_codes: string[]
          safety_rule_version: string
          safety_status: string
        }[]
      }
      consume_action_rate_limit: {
        Args: { p_action: string }
        Returns: boolean
      }
      create_anonymous_assessment: {
        Args: {
          p_anonymous_id: string
          p_assessment_id: string
          p_problem_slug: string
          p_rate_key: string
          p_token_expires_at: string
          p_token_hash: string
        }
        Returns: {
          assessment_id: string
          problem_slug: string
          quiz_version: number
          started_at: string
        }[]
      }
      read_anonymous_assessment: {
        Args: { p_assessment_id: string; p_token_hash: string }
        Returns: {
          answers_json: Json
          assessment_id: string
          assessment_status: string
          completed_at: string
          problem_slug: string
          quiz_version: number
          safety_codes: string[]
          safety_evaluated_at: string
          safety_rule_version: string
          safety_status: string
          started_at: string
        }[]
      }
      update_anonymous_assessment_answer: {
        Args: {
          p_assessment_id: string
          p_option_key: string
          p_question_key: string
          p_token_hash: string
        }
        Returns: {
          answers_json: Json
          updated_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

