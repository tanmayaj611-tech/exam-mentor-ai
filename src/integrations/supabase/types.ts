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
      chat_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          sdk_message_id: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          sdk_message_id?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          sdk_message_id?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          correct_answer: string
          created_at: string
          error_type: string
          explanation: string | null
          id: string
          question: string
          revise_on: string
          revised: boolean
          student_answer: string | null
          subject_id: string | null
          topic: string
          user_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          error_type?: string
          explanation?: string | null
          id?: string
          question: string
          revise_on?: string
          revised?: boolean
          student_answer?: string | null
          subject_id?: string | null
          topic: string
          user_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          error_type?: string
          explanation?: string | null
          id?: string
          question?: string
          revise_on?: string
          revised?: boolean
          student_answer?: string | null
          subject_id?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_hours: number
          exam_date: string | null
          full_name: string | null
          id: string
          language: string
          last_active_date: string | null
          level: number
          streak_days: number
          target_exam: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_hours?: number
          exam_date?: string | null
          full_name?: string | null
          id: string
          language?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          target_exam?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_hours?: number
          exam_date?: string | null
          full_name?: string | null
          id?: string
          language?: string
          last_active_date?: string | null
          level?: number
          streak_days?: number
          target_exam?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_option: number
          created_at: string
          difficulty: number
          explanation: string
          id: string
          is_correct: boolean | null
          options: Json
          position: number
          question: string
          quiz_id: string
          section: string | null
          shortcut: string | null
          student_answer: number | null
          topic: string | null
          user_id: string
        }
        Insert: {
          correct_option: number
          created_at?: string
          difficulty?: number
          explanation?: string
          id?: string
          is_correct?: boolean | null
          options?: Json
          position: number
          question: string
          quiz_id: string
          section?: string | null
          shortcut?: string | null
          student_answer?: number | null
          topic?: string | null
          user_id: string
        }
        Update: {
          correct_option?: number
          created_at?: string
          difficulty?: number
          explanation?: string
          id?: string
          is_correct?: boolean | null
          options?: Json
          position?: number
          question?: string
          quiz_id?: string
          section?: string | null
          shortcut?: string | null
          student_answer?: number | null
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          accuracy: number | null
          correct_count: number
          created_at: string
          difficulty: number
          id: string
          incorrect_count: number
          kind: string
          mode: string
          negative_marking: number
          pattern: string | null
          status: string
          subject_id: string | null
          submitted_at: string | null
          time_limit_seconds: number | null
          time_taken_seconds: number | null
          topic: string
          total_questions: number
          unattempted_count: number
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          correct_count?: number
          created_at?: string
          difficulty?: number
          id?: string
          incorrect_count?: number
          kind?: string
          mode?: string
          negative_marking?: number
          pattern?: string | null
          status?: string
          subject_id?: string | null
          submitted_at?: string | null
          time_limit_seconds?: number | null
          time_taken_seconds?: number | null
          topic: string
          total_questions?: number
          unattempted_count?: number
          user_id: string
        }
        Update: {
          accuracy?: number | null
          correct_count?: number
          created_at?: string
          difficulty?: number
          id?: string
          incorrect_count?: number
          kind?: string
          mode?: string
          negative_marking?: number
          pattern?: string | null
          status?: string
          subject_id?: string | null
          submitted_at?: string | null
          time_limit_seconds?: number | null
          time_taken_seconds?: number | null
          topic?: string
          total_questions?: number
          unattempted_count?: number
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          id: string
          minutes: number
          session_date: string
          subject_id: string | null
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          minutes?: number
          session_date?: string
          subject_id?: string | null
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          minutes?: number
          session_date?: string
          subject_id?: string | null
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          name: string
          sort_order: number
          subject_id: string
        }
        Insert: {
          id?: string
          name: string
          sort_order?: number
          subject_id: string
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
