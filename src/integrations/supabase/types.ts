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
      markets: {
        Row: {
          app_id: string
          category: string
          created_at: string
          fee_bps: number | null
          id: string
          no_total: number | null
          oracle_address: string | null
          outcome_ref: string | null
          region: string
          resolution_criteria: string | null
          status: string
          title: string
          updated_at: string
          yes_total: number | null
        }
        Insert: {
          app_id: string
          category: string
          created_at?: string
          fee_bps?: number | null
          id?: string
          no_total?: number | null
          oracle_address?: string | null
          outcome_ref?: string | null
          region?: string
          resolution_criteria?: string | null
          status?: string
          title: string
          updated_at?: string
          yes_total?: number | null
        }
        Update: {
          app_id?: string
          category?: string
          created_at?: string
          fee_bps?: number | null
          id?: string
          no_total?: number | null
          oracle_address?: string | null
          outcome_ref?: string | null
          region?: string
          resolution_criteria?: string | null
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
      [_ in never]: never
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
