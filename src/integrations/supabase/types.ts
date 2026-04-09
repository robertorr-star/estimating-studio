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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      estimate_cost_summary: {
        Row: {
          avg_hours_per_trade: number | null
          contract_value: number | null
          cost_joseph: number | null
          cost_per_sqft_of_estimate: number | null
          cost_robert: number | null
          cost_sigfried: number | null
          created_at: string
          estimate_id: string
          estimate_number: string
          estimate_status: string | null
          estimator_primary: string | null
          estimator_secondary: string | null
          id: string
          last_updated: string | null
          loss_reason: string | null
          project_name: string
          return_on_estimate: number | null
          total_estimate_cost: number | null
          total_hours_all: number | null
          total_hours_joseph: number | null
          total_hours_robert: number | null
          total_hours_sigfried: number | null
          won: boolean | null
        }
        Insert: {
          avg_hours_per_trade?: number | null
          contract_value?: number | null
          cost_joseph?: number | null
          cost_per_sqft_of_estimate?: number | null
          cost_robert?: number | null
          cost_sigfried?: number | null
          created_at?: string
          estimate_id: string
          estimate_number?: string
          estimate_status?: string | null
          estimator_primary?: string | null
          estimator_secondary?: string | null
          id?: string
          last_updated?: string | null
          loss_reason?: string | null
          project_name?: string
          return_on_estimate?: number | null
          total_estimate_cost?: number | null
          total_hours_all?: number | null
          total_hours_joseph?: number | null
          total_hours_robert?: number | null
          total_hours_sigfried?: number | null
          won?: boolean | null
        }
        Update: {
          avg_hours_per_trade?: number | null
          contract_value?: number | null
          cost_joseph?: number | null
          cost_per_sqft_of_estimate?: number | null
          cost_robert?: number | null
          cost_sigfried?: number | null
          created_at?: string
          estimate_id?: string
          estimate_number?: string
          estimate_status?: string | null
          estimator_primary?: string | null
          estimator_secondary?: string | null
          id?: string
          last_updated?: string | null
          loss_reason?: string | null
          project_name?: string
          return_on_estimate?: number | null
          total_estimate_cost?: number | null
          total_hours_all?: number | null
          total_hours_joseph?: number | null
          total_hours_robert?: number | null
          total_hours_sigfried?: number | null
          won?: boolean | null
        }
        Relationships: []
      }
      estimate_emails: {
        Row: {
          created_at: string
          email_type: string | null
          estimate_id: string
          id: string
          sent_at: string | null
          sent_to: string
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email_type?: string | null
          estimate_id: string
          id?: string
          sent_at?: string | null
          sent_to: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email_type?: string | null
          estimate_id?: string
          id?: string
          sent_at?: string | null
          sent_to?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_emails_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          account_code: string | null
          cost_type: string | null
          created_at: string
          description: string | null
          estimate_id: string
          ext_cost: number | null
          id: string
          item_number: number | null
          line_total: number | null
          material_tax_applied: boolean | null
          notes: string | null
          profit_amount: number | null
          profit_pct: number | null
          quantity: number | null
          sort_order: number | null
          sub_duration_days: number | null
          subcontractor_name: string | null
          trade_id: string
          unit: string | null
          unit_cost: number | null
        }
        Insert: {
          account_code?: string | null
          cost_type?: string | null
          created_at?: string
          description?: string | null
          estimate_id: string
          ext_cost?: number | null
          id?: string
          item_number?: number | null
          line_total?: number | null
          material_tax_applied?: boolean | null
          notes?: string | null
          profit_amount?: number | null
          profit_pct?: number | null
          quantity?: number | null
          sort_order?: number | null
          sub_duration_days?: number | null
          subcontractor_name?: string | null
          trade_id: string
          unit?: string | null
          unit_cost?: number | null
        }
        Update: {
          account_code?: string | null
          cost_type?: string | null
          created_at?: string
          description?: string | null
          estimate_id?: string
          ext_cost?: number | null
          id?: string
          item_number?: number | null
          line_total?: number | null
          material_tax_applied?: boolean | null
          notes?: string | null
          profit_amount?: number | null
          profit_pct?: number | null
          quantity?: number | null
          sort_order?: number | null
          sub_duration_days?: number | null
          subcontractor_name?: string | null
          trade_id?: string
          unit?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "estimate_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_projects: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          built_by: string | null
          built_completed_at: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_signed_date: string | null
          converted_date: string | null
          cost_per_sqft: number | null
          created_at: string
          created_by: string | null
          current_reviewer: string | null
          estimate_number: string
          estimated_duration_days: number | null
          estimated_end_date: string | null
          gross_margin_pct: number | null
          id: string
          internal_notes: string | null
          leo_approved_at: string | null
          leo_send_backs: number | null
          material_tax_rate: number | null
          notes: string | null
          project_address: string | null
          project_name: string
          project_start_date: string | null
          project_type: string | null
          reviewed_by: string | null
          robert_approved_at: string | null
          robert_send_backs: number | null
          sigfried_approved_at: string | null
          sigfried_send_backs: number | null
          status: string
          submitted_date: string | null
          total_build_cost: number | null
          total_contract_price: number | null
          total_profit: number | null
          total_sq_ft: number | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          built_by?: string | null
          built_completed_at?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_signed_date?: string | null
          converted_date?: string | null
          cost_per_sqft?: number | null
          created_at?: string
          created_by?: string | null
          current_reviewer?: string | null
          estimate_number: string
          estimated_duration_days?: number | null
          estimated_end_date?: string | null
          gross_margin_pct?: number | null
          id?: string
          internal_notes?: string | null
          leo_approved_at?: string | null
          leo_send_backs?: number | null
          material_tax_rate?: number | null
          notes?: string | null
          project_address?: string | null
          project_name?: string
          project_start_date?: string | null
          project_type?: string | null
          reviewed_by?: string | null
          robert_approved_at?: string | null
          robert_send_backs?: number | null
          sigfried_approved_at?: string | null
          sigfried_send_backs?: number | null
          status?: string
          submitted_date?: string | null
          total_build_cost?: number | null
          total_contract_price?: number | null
          total_profit?: number | null
          total_sq_ft?: number | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          built_by?: string | null
          built_completed_at?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_signed_date?: string | null
          converted_date?: string | null
          cost_per_sqft?: number | null
          created_at?: string
          created_by?: string | null
          current_reviewer?: string | null
          estimate_number?: string
          estimated_duration_days?: number | null
          estimated_end_date?: string | null
          gross_margin_pct?: number | null
          id?: string
          internal_notes?: string | null
          leo_approved_at?: string | null
          leo_send_backs?: number | null
          material_tax_rate?: number | null
          notes?: string | null
          project_address?: string | null
          project_name?: string
          project_start_date?: string | null
          project_type?: string | null
          reviewed_by?: string | null
          robert_approved_at?: string | null
          robert_send_backs?: number | null
          sigfried_approved_at?: string | null
          sigfried_send_backs?: number | null
          status?: string
          submitted_date?: string | null
          total_build_cost?: number | null
          total_contract_price?: number | null
          total_profit?: number | null
          total_sq_ft?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      estimate_schedule: {
        Row: {
          created_at: string
          end_date: string | null
          estimate_id: string
          id: string
          lead: string | null
          pct_complete: number | null
          predecessor_id: string | null
          remarks: string | null
          sort_order: number | null
          start_date: string | null
          task_name: string
          trade_id: string | null
          wbs: string | null
          work_days: number | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          estimate_id: string
          id?: string
          lead?: string | null
          pct_complete?: number | null
          predecessor_id?: string | null
          remarks?: string | null
          sort_order?: number | null
          start_date?: string | null
          task_name: string
          trade_id?: string | null
          wbs?: string | null
          work_days?: number | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          estimate_id?: string
          id?: string
          lead?: string | null
          pct_complete?: number | null
          predecessor_id?: string | null
          remarks?: string | null
          sort_order?: number | null
          start_date?: string | null
          task_name?: string
          trade_id?: string | null
          wbs?: string | null
          work_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_schedule_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_schedule_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "estimate_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_schedule_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "estimate_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_time_sessions: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number | null
          estimate_id: string
          id: string
          keystrokes_detected: boolean | null
          notes: string | null
          session_end: string | null
          session_start: string
          user_name: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          estimate_id: string
          id?: string
          keystrokes_detected?: boolean | null
          notes?: string | null
          session_end?: string | null
          session_start?: string
          user_name?: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          estimate_id?: string
          id?: string
          keystrokes_detected?: boolean | null
          notes?: string | null
          session_end?: string | null
          session_start?: string
          user_name?: string
        }
        Relationships: []
      }
      estimate_trades: {
        Row: {
          created_at: string
          estimate_id: string
          id: string
          inspection_notes: string | null
          inspection_required: boolean | null
          inspection_type: string | null
          is_active: boolean | null
          lag_days: number | null
          predecessor_trade_id: string | null
          relationship_type: string | null
          schedule_duration_days: number | null
          schedule_end_date: string | null
          schedule_start_date: string | null
          sort_order: number
          sub_duration_days: number | null
          subcontractor_name: string | null
          team_size: number | null
          total_equipment_cost: number | null
          total_ext_cost: number | null
          total_labor_cost: number | null
          total_labor_hours: number | null
          total_materials_cost: number | null
          total_other_cost: number | null
          total_price: number | null
          total_profit: number | null
          total_subcontract_cost: number | null
          trade_group: string
          trade_name: string
        }
        Insert: {
          created_at?: string
          estimate_id: string
          id?: string
          inspection_notes?: string | null
          inspection_required?: boolean | null
          inspection_type?: string | null
          is_active?: boolean | null
          lag_days?: number | null
          predecessor_trade_id?: string | null
          relationship_type?: string | null
          schedule_duration_days?: number | null
          schedule_end_date?: string | null
          schedule_start_date?: string | null
          sort_order?: number
          sub_duration_days?: number | null
          subcontractor_name?: string | null
          team_size?: number | null
          total_equipment_cost?: number | null
          total_ext_cost?: number | null
          total_labor_cost?: number | null
          total_labor_hours?: number | null
          total_materials_cost?: number | null
          total_other_cost?: number | null
          total_price?: number | null
          total_profit?: number | null
          total_subcontract_cost?: number | null
          trade_group: string
          trade_name: string
        }
        Update: {
          created_at?: string
          estimate_id?: string
          id?: string
          inspection_notes?: string | null
          inspection_required?: boolean | null
          inspection_type?: string | null
          is_active?: boolean | null
          lag_days?: number | null
          predecessor_trade_id?: string | null
          relationship_type?: string | null
          schedule_duration_days?: number | null
          schedule_end_date?: string | null
          schedule_start_date?: string | null
          sort_order?: number
          sub_duration_days?: number | null
          subcontractor_name?: string | null
          team_size?: number | null
          total_equipment_cost?: number | null
          total_ext_cost?: number | null
          total_labor_cost?: number | null
          total_labor_hours?: number | null
          total_materials_cost?: number | null
          total_other_cost?: number | null
          total_price?: number | null
          total_profit?: number | null
          total_subcontract_cost?: number | null
          trade_group?: string
          trade_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_trades_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimate_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_trades_predecessor_trade_id_fkey"
            columns: ["predecessor_trade_id"]
            isOneToOne: false
            referencedRelation: "estimate_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      estimator_rates: {
        Row: {
          created_at: string
          effective_date: string
          estimator_name: string
          hourly_rate: number
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          effective_date?: string
          estimator_name: string
          hourly_rate?: number
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          estimator_name?: string
          hourly_rate?: number
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      material_library: {
        Row: {
          cost_type: string
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          notes: string | null
          profit_pct: number | null
          supplier: string | null
          trade_code: string
          trade_name: string
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          cost_type?: string
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          profit_pct?: number | null
          supplier?: string | null
          trade_code: string
          trade_name: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          cost_type?: string
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          profit_pct?: number | null
          supplier?: string | null
          trade_code?: string
          trade_name?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
