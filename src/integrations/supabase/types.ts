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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          anime_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          message: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          message?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          anime_id: string
          anime_image: string | null
          anime_title: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          anime_id: string
          anime_image?: string | null
          anime_title: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          anime_image?: string | null
          anime_title?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          anime_id: string
          created_at: string
          id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: string
          created_at?: string
          id?: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          created_at?: string
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          role: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          role?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          autoplay: boolean
          community_notifs: boolean
          created_at: string
          default_quality: string
          default_volume: number
          email_updates: boolean
          font: string
          id: string
          language: string
          notifications: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          autoplay?: boolean
          community_notifs?: boolean
          created_at?: string
          default_quality?: string
          default_volume?: number
          email_updates?: boolean
          font?: string
          id?: string
          language?: string
          notifications?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          autoplay?: boolean
          community_notifs?: boolean
          created_at?: string
          default_quality?: string
          default_volume?: number
          email_updates?: boolean
          font?: string
          id?: string
          language?: string
          notifications?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          anime_id: string
          anime_image: string | null
          anime_title: string
          created_at: string
          duration: number
          episode_no: number
          id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          anime_id: string
          anime_image?: string | null
          anime_title: string
          created_at?: string
          duration?: number
          episode_no?: number
          id?: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          anime_id?: string
          anime_image?: string | null
          anime_title?: string
          created_at?: string
          duration?: number
          episode_no?: number
          id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          anime_id: string
          anime_image: string | null
          anime_title: string
          created_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          anime_id: string
          anime_image?: string | null
          anime_title: string
          created_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          anime_id?: string
          anime_image?: string | null
          anime_title?: string
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
