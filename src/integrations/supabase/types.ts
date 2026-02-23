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
      blog_articles: {
        Row: {
          author: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string | null
          excerpt: string
          id: string
          is_free: boolean
          paywall_preview_length: number | null
          published_at: string | null
          related_issue_id: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string | null
          excerpt: string
          id?: string
          is_free?: boolean
          paywall_preview_length?: number | null
          published_at?: string | null
          related_issue_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string
          id?: string
          is_free?: boolean
          paywall_preview_length?: number | null
          published_at?: string | null
          related_issue_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      digital_access: {
        Row: {
          access_type: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          issue_id: string | null
          stripe_checkout_session_id: string | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          issue_id?: string | null
          stripe_checkout_session_id?: string | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          issue_id?: string | null
          stripe_checkout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_access_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "digital_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_issues: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          is_current: boolean | null
          issue_number: string
          pdf_url: string | null
          physical_price_cents: number | null
          physical_stock: number | null
          preview_pages: number | null
          price_cents: number | null
          published_at: string | null
          title: string
          youtube_video_url: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_current?: boolean | null
          issue_number: string
          pdf_url?: string | null
          physical_price_cents?: number | null
          physical_stock?: number | null
          preview_pages?: number | null
          price_cents?: number | null
          published_at?: string | null
          title: string
          youtube_video_url?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_current?: boolean | null
          issue_number?: string
          pdf_url?: string | null
          physical_price_cents?: number | null
          physical_stock?: number | null
          preview_pages?: number | null
          price_cents?: number | null
          published_at?: string | null
          title?: string
          youtube_video_url?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          address_line1: string
          address_line2: string | null
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          city: string
          comment: string | null
          country: string
          created_at: string
          currency: string
          email: string
          first_name: string
          id: string
          is_processed: boolean
          is_recurring: boolean
          items: Json
          last_name: string
          order_type: string
          payment_method: string
          payment_status: string
          phone: string | null
          postal_code: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          subscriber_number: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_type: string | null
          total_amount: number
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          city: string
          comment?: string | null
          country?: string
          created_at?: string
          currency?: string
          email: string
          first_name: string
          id?: string
          is_processed?: boolean
          is_recurring?: boolean
          items?: Json
          last_name: string
          order_type: string
          payment_method: string
          payment_status?: string
          phone?: string | null
          postal_code: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscriber_number?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          total_amount: number
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          city?: string
          comment?: string | null
          country?: string
          created_at?: string
          currency?: string
          email?: string
          first_name?: string
          id?: string
          is_processed?: boolean
          is_recurring?: boolean
          items?: Json
          last_name?: string
          order_type?: string
          payment_method?: string
          payment_status?: string
          phone?: string | null
          postal_code?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          subscriber_number?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_type?: string | null
          total_amount?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_location: string | null
          author_name: string
          avatar_url: string | null
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          review_text: string
        }
        Insert: {
          author_location?: string | null
          author_name: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          review_text: string
        }
        Update: {
          author_location?: string | null
          author_name?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          review_text?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
