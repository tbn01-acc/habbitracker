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
      achievement_posts: {
        Row: {
          comments_count: number
          created_at: string
          description: string | null
          dislikes_count: number
          habit_id: string | null
          id: string
          image_url: string
          is_visible: boolean
          likes_count: number
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          created_at?: string
          description?: string | null
          dislikes_count?: number
          habit_id?: string | null
          id?: string
          image_url: string
          is_visible?: boolean
          likes_count?: number
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          created_at?: string
          description?: string | null
          dislikes_count?: number
          habit_id?: string | null
          id?: string
          image_url?: string
          is_visible?: boolean
          likes_count?: number
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_post_count: {
        Row: {
          created_at: string
          id: string
          post_count: number
          post_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_count?: number
          post_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_count?: number
          post_date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_verified_tasks: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          user_id: string
          verified_count: number
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          user_id: string
          verified_count?: number
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          user_id?: string
          verified_count?: number
        }
        Relationships: []
      }
      habits: {
        Row: {
          category_id: string | null
          color: string | null
          completed_dates: string[]
          created_at: string
          icon: string | null
          id: string
          name: string
          streak: number
          tags: string[] | null
          target_days: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          completed_dates?: string[]
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          streak?: number
          tags?: string[] | null
          target_days?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          completed_dates?: string[]
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          streak?: number
          tags?: string[] | null
          target_days?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          id: string
          title: string
          type: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content: string
          id?: string
          title: string
          type: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_id: string
          metadata: Json | null
          paid_at: string | null
          payment_method: string | null
          robokassa_inv_id: number | null
          status: string | null
          subscription_period: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          robokassa_inv_id?: number | null
          status?: string | null
          subscription_period?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_method?: string | null
          robokassa_inv_id?: number | null
          status?: string | null
          subscription_period?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          created_at: string
          duration: number
          id: string
          subtask_id: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration: number
          id?: string
          subtask_id?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration?: number
          id?: string
          subtask_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_visible: boolean
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_visible?: boolean
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "achievement_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "achievement_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_badges: string[] | null
          active_frame: string | null
          avatar_url: string | null
          ban_count: number | null
          ban_until: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          first_day_of_week: number | null
          id: string
          is_banned: boolean | null
          is_public: boolean | null
          public_email: string | null
          read_only_until: string | null
          referral_code: string | null
          referred_by: string | null
          telegram_username: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_badges?: string[] | null
          active_frame?: string | null
          avatar_url?: string | null
          ban_count?: number | null
          ban_until?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          first_day_of_week?: number | null
          id?: string
          is_banned?: boolean | null
          is_public?: boolean | null
          public_email?: string | null
          read_only_until?: string | null
          referral_code?: string | null
          referred_by?: string | null
          telegram_username?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_badges?: string[] | null
          active_frame?: string | null
          avatar_url?: string | null
          ban_count?: number | null
          ban_until?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          first_day_of_week?: number | null
          id?: string
          is_banned?: boolean | null
          is_public?: boolean | null
          public_email?: string | null
          read_only_until?: string | null
          referral_code?: string | null
          referred_by?: string | null
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      purchased_rewards: {
        Row: {
          created_at: string
          id: string
          is_used: boolean | null
          reward_id: string
          stars_spent: number
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean | null
          reward_id: string
          stars_spent: number
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean | null
          reward_id?: string
          stars_spent?: number
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_activity_log: {
        Row: {
          activity_date: string
          created_at: string
          id: string
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          id?: string
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          id?: string
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount_rub: number | null
          bonus_weeks: number | null
          commission_percent: number | null
          created_at: string
          earning_type: string
          id: string
          milestone_bonus_rub: number | null
          milestone_type: string | null
          payment_id: string | null
          referred_id: string
          referrer_id: string
        }
        Insert: {
          amount_rub?: number | null
          bonus_weeks?: number | null
          commission_percent?: number | null
          created_at?: string
          earning_type: string
          id?: string
          milestone_bonus_rub?: number | null
          milestone_type?: string | null
          payment_id?: string | null
          referred_id: string
          referrer_id: string
        }
        Update: {
          amount_rub?: number | null
          bonus_weeks?: number | null
          commission_percent?: number | null
          created_at?: string
          earning_type?: string
          id?: string
          milestone_bonus_rub?: number | null
          milestone_type?: string | null
          payment_id?: string | null
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_earnings_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          activated_at: string | null
          active_days: number | null
          created_at: string
          id: string
          is_active: boolean | null
          referred_has_paid: boolean
          referred_id: string
          referrer_id: string
          total_time_minutes: number | null
        }
        Insert: {
          activated_at?: string | null
          active_days?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          referred_has_paid?: boolean
          referred_id: string
          referrer_id: string
          total_time_minutes?: number | null
        }
        Update: {
          activated_at?: string | null
          active_days?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          referred_has_paid?: boolean
          referred_id?: string
          referrer_id?: string
          total_time_minutes?: number | null
        }
        Relationships: []
      }
      rewards_shop: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_stars: number
          reward_type: string
          reward_value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_stars: number
          reward_type: string
          reward_value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_stars?: number
          reward_type?: string
          reward_value?: Json | null
        }
        Relationships: []
      }
      star_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          timer_minutes: number | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          timer_minutes?: number | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          timer_minutes?: number | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          bonus_days: number
          created_at: string
          expires_at: string | null
          id: string
          is_trial: boolean | null
          period: Database["public"]["Enums"]["subscription_period"] | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          trial_bonus_months: number | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_days?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_trial?: boolean | null
          period?: Database["public"]["Enums"]["subscription_period"] | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          trial_bonus_months?: number | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_days?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_trial?: boolean | null
          period?: Database["public"]["Enums"]["subscription_period"] | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          trial_bonus_months?: number | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tag_goal_history: {
        Row: {
          actual_budget: number | null
          actual_time_minutes: number | null
          budget_goal: number | null
          created_at: string | null
          goal_achieved: boolean | null
          id: string
          period: string
          period_end: string
          period_start: string
          tag_id: string | null
          time_goal_minutes: number | null
          user_id: string
        }
        Insert: {
          actual_budget?: number | null
          actual_time_minutes?: number | null
          budget_goal?: number | null
          created_at?: string | null
          goal_achieved?: boolean | null
          id?: string
          period?: string
          period_end: string
          period_start: string
          tag_id?: string | null
          time_goal_minutes?: number | null
          user_id: string
        }
        Update: {
          actual_budget?: number | null
          actual_time_minutes?: number | null
          budget_goal?: number | null
          created_at?: string | null
          goal_achieved?: boolean | null
          id?: string
          period?: string
          period_end?: string
          period_start?: string
          tag_id?: string | null
          time_goal_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_goal_history_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "user_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_goals: {
        Row: {
          budget_goal: number | null
          created_at: string
          id: string
          notify_on_exceed: boolean | null
          notify_on_milestone: boolean | null
          period: string
          tag_id: string
          time_goal_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_goal?: number | null
          created_at?: string
          id?: string
          notify_on_exceed?: boolean | null
          notify_on_milestone?: boolean | null
          period?: string
          tag_id: string
          time_goal_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_goal?: number | null
          created_at?: string
          id?: string
          notify_on_exceed?: boolean | null
          notify_on_milestone?: boolean | null
          period?: string
          tag_id?: string
          time_goal_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_goals_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "user_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          attachments: Json | null
          category_id: string | null
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          icon: string | null
          id: string
          name: string
          priority: string
          recurrence: string | null
          status: string
          subtasks: Json | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          category_id?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          icon?: string | null
          id?: string
          name: string
          priority?: string
          recurrence?: string | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          category_id?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          icon?: string | null
          id?: string
          name?: string
          priority?: string
          recurrence?: string | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          end_time: string
          id: string
          start_time: string
          subtask_id: string | null
          task_id: string | null
          task_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: number
          end_time: string
          id?: string
          start_time: string
          subtask_id?: string | null
          task_id?: string | null
          task_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          end_time?: string
          id?: string
          start_time?: string
          subtask_id?: string | null
          task_id?: string | null
          task_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          completed: boolean
          created_at: string
          date: string
          id: string
          name: string
          recurrence: string | null
          tags: string[] | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          completed?: boolean
          created_at?: string
          date: string
          id?: string
          name: string
          recurrence?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          name?: string
          recurrence?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          analytics_enabled: boolean
          created_at: string
          data_sharing: boolean
          id: string
          notifications_enabled: boolean
          personalized_ads: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics_enabled?: boolean
          created_at?: string
          data_sharing?: boolean
          id?: string
          notifications_enabled?: boolean
          personalized_ads?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics_enabled?: boolean
          created_at?: string
          data_sharing?: boolean
          id?: string
          notifications_enabled?: boolean
          personalized_ads?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_stars: {
        Row: {
          created_at: string
          current_streak_days: number
          freeze_available: boolean | null
          freeze_used_at: string | null
          id: string
          last_activity_date: string | null
          longest_streak_days: number
          total_stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak_days?: number
          freeze_available?: boolean | null
          freeze_used_at?: string | null
          id?: string
          last_activity_date?: string | null
          longest_streak_days?: number
          total_stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak_days?: number
          freeze_available?: boolean | null
          freeze_used_at?: string | null
          id?: string
          last_activity_date?: string | null
          longest_streak_days?: number
          total_stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wallet: {
        Row: {
          balance_rub: number
          bonus_weeks_earned: number
          created_at: string
          id: string
          total_earned_rub: number
          total_withdrawn_rub: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_rub?: number
          bonus_weeks_earned?: number
          created_at?: string
          id?: string
          total_earned_rub?: number
          total_withdrawn_rub?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_rub?: number
          bonus_weeks_earned?: number
          created_at?: string
          id?: string
          total_earned_rub?: number
          total_withdrawn_rub?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount_rub: number
          applied_multiplier: number | null
          created_at: string
          id: string
          processed_at: string | null
          status: string
          user_id: string
          withdrawal_type: string
        }
        Insert: {
          amount_rub: number
          applied_multiplier?: number | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id: string
          withdrawal_type: string
        }
        Update: {
          amount_rub?: number
          applied_multiplier?: number | null
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id?: string
          withdrawal_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_referral_bonus: {
        Args: { referrer_user_id: string }
        Returns: number
      }
      calculate_referral_bonus_v2: {
        Args: { referrer_user_id: string }
        Returns: Record<string, unknown>
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      subscription_period:
        | "monthly"
        | "quarterly"
        | "semiannual"
        | "annual"
        | "biennial"
        | "lifetime"
      subscription_plan: "free" | "pro"
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
      app_role: ["admin", "moderator", "user"],
      subscription_period: [
        "monthly",
        "quarterly",
        "semiannual",
        "annual",
        "biennial",
        "lifetime",
      ],
      subscription_plan: ["free", "pro"],
    },
  },
} as const
