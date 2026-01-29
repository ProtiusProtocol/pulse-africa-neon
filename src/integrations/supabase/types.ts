export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_recipients: {
        Row: {
          alert_types: string[]
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
        }
        Insert: {
          alert_types?: string[]
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
        }
        Update: {
          alert_types?: string[]
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
        }
        Relationships: []
      }
      attention_categories: {
        Row: {
          category_group: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          keywords: Json
          name: string
        }
        Insert: {
          category_group: string
          code: string
          created_at?: string
          description?: string | null
          display_order: number
          id?: string
          keywords?: Json
          name: string
        }
        Update: {
          category_group?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          keywords?: Json
          name?: string
        }
        Relationships: []
      }
      attention_scores: {
        Row: {
          attention_score: number
          category_id: string
          combined_score: number | null
          created_at: string
          engagement_score: number
          id: string
          market_worthiness_score: number
          raw_data: Json | null
          updated_at: string
          week_id: string
        }
        Insert: {
          attention_score?: number
          category_id: string
          combined_score?: number | null
          created_at?: string
          engagement_score?: number
          id?: string
          market_worthiness_score?: number
          raw_data?: Json | null
          updated_at?: string
          week_id: string
        }
        Update: {
          attention_score?: number
          category_id?: string
          combined_score?: number | null
          created_at?: string
          engagement_score?: number
          id?: string
          market_worthiness_score?: number
          raw_data?: Json | null
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attention_scores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "attention_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      attention_snapshots: {
        Row: {
          created_at: string
          deprioritised_topics: Json | null
          generated_at: string | null
          id: string
          recommended_markets: Json | null
          sport_percentage: number | null
          summary_md: string | null
          updated_at: string
          week_id: string
        }
        Insert: {
          created_at?: string
          deprioritised_topics?: Json | null
          generated_at?: string | null
          id?: string
          recommended_markets?: Json | null
          sport_percentage?: number | null
          summary_md?: string | null
          updated_at?: string
          week_id: string
        }
        Update: {
          created_at?: string
          deprioritised_topics?: Json | null
          generated_at?: string | null
          id?: string
          recommended_markets?: Json | null
          sport_percentage?: number | null
          summary_md?: string | null
          updated_at?: string
          week_id?: string
        }
        Relationships: []
      }
      community_responses: {
        Row: {
          created_at: string
          id: string
          question_text: string
          report_type: string
          respondent_name: string | null
          response_text: string
          week_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_text: string
          report_type: string
          respondent_name?: string | null
          response_text: string
          week_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_text?: string
          report_type?: string
          respondent_name?: string | null
          response_text?: string
          week_id?: string
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          country: string
          created_at: string
          email: string
          id: string
          name: string
          predictor_type: string
          whatsapp: string
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          id?: string
          name: string
          predictor_type: string
          whatsapp: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          predictor_type?: string
          whatsapp?: string
        }
        Relationships: []
      }
      email_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          subscribed_to: string[]
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_to?: string[]
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_to?: string[]
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      fragility_signals: {
        Row: {
          core_components: Json
          created_at: string
          current_direction: string | null
          description: string
          id: string
          last_updated: string | null
          name: string
          region: string
          signal_code: string
          source: string
          updated_at: string
          weekly_update_md: string | null
          why_it_matters: string
        }
        Insert: {
          core_components?: Json
          created_at?: string
          current_direction?: string | null
          description: string
          id?: string
          last_updated?: string | null
          name: string
          region?: string
          signal_code: string
          source?: string
          updated_at?: string
          weekly_update_md?: string | null
          why_it_matters: string
        }
        Update: {
          core_components?: Json
          created_at?: string
          current_direction?: string | null
          description?: string
          id?: string
          last_updated?: string | null
          name?: string
          region?: string
          signal_code?: string
          source?: string
          updated_at?: string
          weekly_update_md?: string | null
          why_it_matters?: string
        }
        Relationships: []
      }
      market_suggestions: {
        Row: {
          ai_reasoning: string | null
          created_at: string
          created_market_id: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          signal_code: string
          source_signal_direction: string | null
          status: string
          suggested_category: string
          suggested_deadline: string | null
          suggested_outcome_ref: string
          suggested_region: string
          suggested_resolution_criteria: string | null
          suggested_title: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          created_at?: string
          created_market_id?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signal_code: string
          source_signal_direction?: string | null
          status?: string
          suggested_category?: string
          suggested_deadline?: string | null
          suggested_outcome_ref: string
          suggested_region?: string
          suggested_resolution_criteria?: string | null
          suggested_title: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          created_at?: string
          created_market_id?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signal_code?: string
          source_signal_direction?: string | null
          status?: string
          suggested_category?: string
          suggested_deadline?: string | null
          suggested_outcome_ref?: string
          suggested_region?: string
          suggested_resolution_criteria?: string | null
          suggested_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_suggestions_created_market_id_fkey"
            columns: ["created_market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_translations: {
        Row: {
          created_at: string
          field: string
          id: string
          language: string
          source_id: string
          source_table: string
          translated_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          language: string
          source_id: string
          source_table: string
          translated_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          language?: string
          source_id?: string
          source_table?: string
          translated_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      markets: {
        Row: {
          app_id: string
          category: string
          created_at: string
          deadline: string | null
          fee_bps: number | null
          id: string
          linked_signals: string[] | null
          no_total: number | null
          oracle_address: string | null
          outcome_ref: string
          region: string
          resolution_criteria: string | null
          resolution_criteria_full: string | null
          resolved_outcome: string | null
          status: string
          title: string
          updated_at: string
          yes_total: number | null
        }
        Insert: {
          app_id: string
          category: string
          created_at?: string
          deadline?: string | null
          fee_bps?: number | null
          id?: string
          linked_signals?: string[] | null
          no_total?: number | null
          oracle_address?: string | null
          outcome_ref: string
          region?: string
          resolution_criteria?: string | null
          resolution_criteria_full?: string | null
          resolved_outcome?: string | null
          status?: string
          title: string
          updated_at?: string
          yes_total?: number | null
        }
        Update: {
          app_id?: string
          category?: string
          created_at?: string
          deadline?: string | null
          fee_bps?: number | null
          id?: string
          linked_signals?: string[] | null
          no_total?: number | null
          oracle_address?: string | null
          outcome_ref?: string
          region?: string
          resolution_criteria?: string | null
          resolution_criteria_full?: string | null
          resolved_outcome?: string | null
          status?: string
          title?: string
          updated_at?: string
          yes_total?: number | null
        }
        Relationships: []
      }
      news_sources: {
        Row: {
          category: string
          created_at: string
          feed_type: string
          feed_url: string | null
          id: string
          is_active: boolean
          name: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          feed_type?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          feed_type?: string
          feed_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          url?: string
        }
        Relationships: []
      }
      outcomes_watchlist: {
        Row: {
          ai_analysis: string | null
          category: string
          created_at: string
          deadline: string
          drift_direction: string | null
          id: string
          linked_market_id: string | null
          probability_current: number | null
          probability_previous: number | null
          question_text: string
          region: string
          research_context: string | null
          resolution_criteria: string | null
          signal_code: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          category?: string
          created_at?: string
          deadline: string
          drift_direction?: string | null
          id?: string
          linked_market_id?: string | null
          probability_current?: number | null
          probability_previous?: number | null
          question_text: string
          region?: string
          research_context?: string | null
          resolution_criteria?: string | null
          signal_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          category?: string
          created_at?: string
          deadline?: string
          drift_direction?: string | null
          id?: string
          linked_market_id?: string | null
          probability_current?: number | null
          probability_previous?: number | null
          question_text?: string
          region?: string
          research_context?: string | null
          resolution_criteria?: string | null
          signal_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_watchlist_linked_market_id_fkey"
            columns: ["linked_market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trades: {
        Row: {
          amount: number
          created_at: string
          id: string
          market_id: string
          side: string
          status: string
          tx_id: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          market_id: string
          side: string
          status?: string
          tx_id?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          market_id?: string
          side?: string
          status?: string
          tx_id?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trades_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_admin_inputs: {
        Row: {
          contrarian_view: string | null
          created_at: string
          id: string
          sensitive_avoid: string | null
          submitted_at: string | null
          submitted_by: string | null
          top_drivers: string[] | null
          updated_at: string
          week_id: string
        }
        Insert: {
          contrarian_view?: string | null
          created_at?: string
          id?: string
          sensitive_avoid?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          top_drivers?: string[] | null
          updated_at?: string
          week_id: string
        }
        Update: {
          contrarian_view?: string | null
          created_at?: string
          id?: string
          sensitive_avoid?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          top_drivers?: string[] | null
          updated_at?: string
          week_id?: string
        }
        Relationships: []
      }
      weekly_digest: {
        Row: {
          citations: Json | null
          created_at: string
          id: string
          market_moves_md: string | null
          market_snapshot: Json
          news_digest_md: string | null
          updated_at: string
          week_end: string
          week_id: string
          week_start: string
        }
        Insert: {
          citations?: Json | null
          created_at?: string
          id?: string
          market_moves_md?: string | null
          market_snapshot?: Json
          news_digest_md?: string | null
          updated_at?: string
          week_end: string
          week_id: string
          week_start: string
        }
        Update: {
          citations?: Json | null
          created_at?: string
          id?: string
          market_moves_md?: string | null
          market_snapshot?: Json
          news_digest_md?: string | null
          updated_at?: string
          week_end?: string
          week_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          content_md: string
          created_at: string
          id: string
          published_at: string | null
          report_type: string
          status: string
          updated_at: string
          version: number
          week_id: string
        }
        Insert: {
          content_md: string
          created_at?: string
          id?: string
          published_at?: string | null
          report_type: string
          status?: string
          updated_at?: string
          version?: number
          week_id: string
        }
        Update: {
          content_md?: string
          created_at?: string
          id?: string
          published_at?: string | null
          report_type?: string
          status?: string
          updated_at?: string
          version?: number
          week_id?: string
        }
        Relationships: []
      }
      weekly_source_items: {
        Row: {
          datapoints: Json | null
          fetched_at: string
          id: string
          published_at: string | null
          raw_content: string | null
          source_id: string | null
          summary_bullets: Json | null
          tags: string[] | null
          title: string
          url: string
          week_id: string
        }
        Insert: {
          datapoints?: Json | null
          fetched_at?: string
          id?: string
          published_at?: string | null
          raw_content?: string | null
          source_id?: string | null
          summary_bullets?: Json | null
          tags?: string[] | null
          title: string
          url: string
          week_id: string
        }
        Update: {
          datapoints?: Json | null
          fetched_at?: string
          id?: string
          published_at?: string | null
          raw_content?: string | null
          source_id?: string | null
          summary_bullets?: Json | null
          tags?: string[] | null
          title?: string
          url?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_source_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
