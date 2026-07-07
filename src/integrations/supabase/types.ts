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
      app_settings: {
        Row: {
          default_beam_prep_charge: number
          factory_name: string
          id: number
        }
        Insert: {
          default_beam_prep_charge?: number
          factory_name?: string
          id?: number
        }
        Update: {
          default_beam_prep_charge?: number
          factory_name?: string
          id?: number
        }
        Relationships: []
      }
      beams: {
        Row: {
          assigned_date: string
          beam_number: string
          closed: boolean
          closed_date: string | null
          id: string
          jobworker_id: string
          machine_id: string
          notes: string | null
          prep_charge: number
          warp_weight_kg: number
        }
        Insert: {
          assigned_date: string
          beam_number: string
          closed?: boolean
          closed_date?: string | null
          id: string
          jobworker_id: string
          machine_id: string
          notes?: string | null
          prep_charge?: number
          warp_weight_kg?: number
        }
        Update: {
          assigned_date?: string
          beam_number?: string
          closed?: boolean
          closed_date?: string | null
          id?: string
          jobworker_id?: string
          machine_id?: string
          notes?: string | null
          prep_charge?: number
          warp_weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "beams_jobworker_id_fkey"
            columns: ["jobworker_id"]
            isOneToOne: false
            referencedRelation: "jobworkers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beams_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      jobworkers: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      ledger: {
        Row: {
          amount: number
          date: string
          id: string
          jobworker_id: string
          note: string | null
          type: string
        }
        Insert: {
          amount?: number
          date: string
          id: string
          jobworker_id: string
          note?: string | null
          type: string
        }
        Update: {
          amount?: number
          date?: string
          id?: string
          jobworker_id?: string
          note?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_jobworker_id_fkey"
            columns: ["jobworker_id"]
            isOneToOne: false
            referencedRelation: "jobworkers"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string
          id: string
          jobworker_id: string
          label: string
        }
        Insert: {
          created_at?: string
          id: string
          jobworker_id: string
          label: string
        }
        Update: {
          created_at?: string
          id?: string
          jobworker_id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_jobworker_id_fkey"
            columns: ["jobworker_id"]
            isOneToOne: false
            referencedRelation: "jobworkers"
            referencedColumns: ["id"]
          },
        ]
      }
      qualities: {
        Row: {
          deduction: number
          id: string
          name: string
          notes: string | null
          rate_per_piece: number
        }
        Insert: {
          deduction?: number
          id: string
          name: string
          notes?: string | null
          rate_per_piece?: number
        }
        Update: {
          deduction?: number
          id?: string
          name?: string
          notes?: string | null
          rate_per_piece?: number
        }
        Relationships: []
      }
      submissions: {
        Row: {
          beam_id: string
          created_at: string
          id: string
          jobworker_id: string
          machine_id: string
          pieces: number
          quality_id: string
          week_ending: string
          weight_kg: number
        }
        Insert: {
          beam_id: string
          created_at?: string
          id: string
          jobworker_id: string
          machine_id: string
          pieces?: number
          quality_id: string
          week_ending: string
          weight_kg?: number
        }
        Update: {
          beam_id?: string
          created_at?: string
          id?: string
          jobworker_id?: string
          machine_id?: string
          pieces?: number
          quality_id?: string
          week_ending?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_beam_id_fkey"
            columns: ["beam_id"]
            isOneToOne: false
            referencedRelation: "beams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_jobworker_id_fkey"
            columns: ["jobworker_id"]
            isOneToOne: false
            referencedRelation: "jobworkers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_quality_id_fkey"
            columns: ["quality_id"]
            isOneToOne: false
            referencedRelation: "qualities"
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
