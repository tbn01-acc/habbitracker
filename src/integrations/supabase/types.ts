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
          is_verified: boolean | null
          is_visible: boolean
          likes_count: number
          post_type: string
          task_id: string | null
          updated_at: string
          user_id: string
          votes_count: number
        }
        Insert: {
          comments_count?: number
          created_at?: string
          description?: string | null
          dislikes_count?: number
          habit_id?: string | null
          id?: string
          image_url: string
          is_verified?: boolean | null
          is_visible?: boolean
          likes_count?: number
          post_type?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
          votes_count?: number
        }
        Update: {
          comments_count?: number
          created_at?: string
          description?: string | null
          dislikes_count?: number
          habit_id?: string | null
          id?: string
          image_url?: string
          is_verified?: boolean | null
          is_visible?: boolean
          likes_count?: number
          post_type?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
          votes_count?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      balance_status_history: {
        Row: {
          all_spheres_above_minimum: boolean | null
          created_at: string
          id: string
          level: string
          max_sphere_id: number | null
          max_value: number
          min_sphere_id: number | null
          min_value: number
          spread: number
          stars_awarded: number | null
          user_id: string
        }
        Insert: {
          all_spheres_above_minimum?: boolean | null
          created_at?: string
          id?: string
          level: string
          max_sphere_id?: number | null
          max_value: number
          min_sphere_id?: number | null
          min_value: number
          spread: number
          stars_awarded?: number | null
          user_id: string
        }
        Update: {
          all_spheres_above_minimum?: boolean | null
          created_at?: string
          id?: string
          level?: string
          max_sphere_id?: number | null
          max_value?: number
          min_sphere_id?: number | null
          min_value?: number
          spread?: number
          stars_awarded?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cloud_user_data: {
        Row: {
          checklists: Json | null
          counters: Json | null
          created_at: string
          habits: Json | null
          id: string
          notes: Json | null
          pomodoro_sessions: Json | null
          tasks: Json | null
          time_entries: Json | null
          transactions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checklists?: Json | null
          counters?: Json | null
          created_at?: string
          habits?: Json | null
          id?: string
          notes?: Json | null
          pomodoro_sessions?: Json | null
          tasks?: Json | null
          time_entries?: Json | null
          transactions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checklists?: Json | null
          counters?: Json | null
          created_at?: string
          habits?: Json | null
          id?: string
          notes?: Json | null
          pomodoro_sessions?: Json | null
          tasks?: Json | null
          time_entries?: Json | null
          transactions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cloud_user_settings: {
        Row: {
          celebration_settings: Json | null
          dashboard_layout: Json | null
          general_settings: Json | null
          id: string
          notification_settings: Json | null
          theme_settings: Json | null
          updated_at: string
          user_id: string
          widget_settings: Json | null
        }
        Insert: {
          celebration_settings?: Json | null
          dashboard_layout?: Json | null
          general_settings?: Json | null
          id?: string
          notification_settings?: Json | null
          theme_settings?: Json | null
          updated_at?: string
          user_id: string
          widget_settings?: Json | null
        }
        Update: {
          celebration_settings?: Json | null
          dashboard_layout?: Json | null
          general_settings?: Json | null
          id?: string
          notification_settings?: Json | null
          theme_settings?: Json | null
          updated_at?: string
          user_id?: string
          widget_settings?: Json | null
        }
        Relationships: []
      }
      contact_goals: {
        Row: {
          contact_id: string
          created_at: string
          goal_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          goal_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          goal_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_goals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_spheres: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          sphere_id: number
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          sphere_id: number
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          sphere_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_spheres_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_spheres_sphere_id_fkey"
            columns: ["sphere_id"]
            isOneToOne: false
            referencedRelation: "spheres"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
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
      goal_contacts: {
        Row: {
          contact_info: string | null
          contact_name: string
          contact_type: string | null
          created_at: string
          goal_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          contact_info?: string | null
          contact_name: string
          contact_type?: string | null
          created_at?: string
          goal_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          contact_info?: string | null
          contact_name?: string
          contact_type?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contacts_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          archived_at: string | null
          budget_goal: number | null
          color: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          progress_percent: number | null
          sphere_id: number | null
          status: string | null
          target_date: string | null
          time_goal_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          budget_goal?: number | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          progress_percent?: number | null
          sphere_id?: number | null
          status?: string | null
          target_date?: string | null
          time_goal_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          budget_goal?: number | null
          color?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          progress_percent?: number | null
          sphere_id?: number | null
          status?: string | null
          target_date?: string | null
          time_goal_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_sphere_id_fkey"
            columns: ["sphere_id"]
            isOneToOne: false
            referencedRelation: "spheres"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_members: {
        Row: {
          chat_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          reply_to_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          reply_to_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          reply_to_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "group_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chats: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          invite_code: string | null
          is_public: boolean | null
          max_members: number | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          max_members?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          max_members?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          archived_at: string | null
          category_id: string | null
          color: string | null
          completed_dates: string[]
          created_at: string
          goal_id: string | null
          icon: string | null
          id: string
          name: string
          postpone_count: number | null
          postponed_until: string | null
          sphere_id: number | null
          streak: number
          tags: string[] | null
          target_days: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          category_id?: string | null
          color?: string | null
          completed_dates?: string[]
          created_at?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          name: string
          postpone_count?: number | null
          postponed_until?: string | null
          sphere_id?: number | null
          streak?: number
          tags?: string[] | null
          target_days?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          category_id?: string | null
          color?: string | null
          completed_dates?: string[]
          created_at?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          postpone_count?: number | null
          postponed_until?: string | null
          sphere_id?: number | null
          streak?: number
          tags?: string[] | null
          target_days?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_sphere_id_fkey"
            columns: ["sphere_id"]
            isOneToOne: false
            referencedRelation: "spheres"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_votes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "achievement_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_aggregates: {
        Row: {
          habits_completed: number
          id: string
          period_key: string
          period_type: string
          tasks_completed: number
          total_activity_score: number
          total_likes: number
          total_stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          habits_completed?: number
          id?: string
          period_key: string
          period_type: string
          tasks_completed?: number
          total_activity_score?: number
          total_likes?: number
          total_stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          habits_completed?: number
          id?: string
          period_key?: string
          period_type?: string
          tasks_completed?: number
          total_activity_score?: number
          total_likes?: number
          total_stars?: number
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
      life_index_history: {
        Row: {
          created_at: string
          external_success: number | null
          id: string
          life_index: number
          mindfulness_level: number | null
          personal_energy: number | null
          recorded_at: string
          sphere_indices: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          external_success?: number | null
          id?: string
          life_index: number
          mindfulness_level?: number | null
          personal_energy?: number | null
          recorded_at?: string
          sphere_indices?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          external_success?: number | null
          id?: string
          life_index?: number
          mindfulness_level?: number | null
          personal_energy?: number | null
          recorded_at?: string
          sphere_indices?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          comments_notifications_enabled: boolean | null
          created_at: string
          habit_notification_enabled: boolean
          habit_notification_time: string
          id: string
          likes_notifications_enabled: boolean | null
          overdue_notification_enabled: boolean | null
          push_token: string | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          subscriptions_notifications_enabled: boolean | null
          task_notification_days_before: number
          task_notification_enabled: boolean
          task_notification_time: string
          updated_at: string
          user_id: string
          weather_notification_enabled: boolean | null
        }
        Insert: {
          comments_notifications_enabled?: boolean | null
          created_at?: string
          habit_notification_enabled?: boolean
          habit_notification_time?: string
          id?: string
          likes_notifications_enabled?: boolean | null
          overdue_notification_enabled?: boolean | null
          push_token?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          subscriptions_notifications_enabled?: boolean | null
          task_notification_days_before?: number
          task_notification_enabled?: boolean
          task_notification_time?: string
          updated_at?: string
          user_id: string
          weather_notification_enabled?: boolean | null
        }
        Update: {
          comments_notifications_enabled?: boolean | null
          created_at?: string
          habit_notification_enabled?: boolean
          habit_notification_time?: string
          id?: string
          likes_notifications_enabled?: boolean | null
          overdue_notification_enabled?: boolean | null
          push_token?: string | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          subscriptions_notifications_enabled?: boolean | null
          task_notification_days_before?: number
          task_notification_enabled?: boolean
          task_notification_time?: string
          updated_at?: string
          user_id?: string
          weather_notification_enabled?: boolean | null
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
          can_help: string | null
          created_at: string
          display_name: string | null
          dob: string | null
          email: string | null
          expertise: string | null
          first_day_of_week: number | null
          full_name: string | null
          id: string
          interests: string[] | null
          is_banned: boolean | null
          is_public: boolean | null
          job_title: string | null
          location: string | null
          phone: string | null
          public_email: string | null
          read_only_until: string | null
          referral_code: string | null
          referred_by: string | null
          status_tag: string | null
          telegram_id: number | null
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
          can_help?: string | null
          created_at?: string
          display_name?: string | null
          dob?: string | null
          email?: string | null
          expertise?: string | null
          first_day_of_week?: number | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_banned?: boolean | null
          is_public?: boolean | null
          job_title?: string | null
          location?: string | null
          phone?: string | null
          public_email?: string | null
          read_only_until?: string | null
          referral_code?: string | null
          referred_by?: string | null
          status_tag?: string | null
          telegram_id?: number | null
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
          can_help?: string | null
          created_at?: string
          display_name?: string | null
          dob?: string | null
          email?: string | null
          expertise?: string | null
          first_day_of_week?: number | null
          full_name?: string | null
          id?: string
          interests?: string[] | null
          is_banned?: boolean | null
          is_public?: boolean | null
          job_title?: string | null
          location?: string | null
          phone?: string | null
          public_email?: string | null
          read_only_until?: string | null
          referral_code?: string | null
          referred_by?: string | null
          status_tag?: string | null
          telegram_id?: number | null
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_code_uses: {
        Row: {
          id: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          bonus_days: number | null
          bonus_stars: number | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          bonus_days?: number | null
          bonus_stars?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          bonus_days?: number | null
          bonus_stars?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
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
      spheres: {
        Row: {
          color: string
          created_at: string
          group_type: string
          icon: string
          id: number
          key: string
          name_en: string
          name_es: string
          name_ru: string
          sort_order: number
        }
        Insert: {
          color: string
          created_at?: string
          group_type: string
          icon: string
          id: number
          key: string
          name_en: string
          name_es: string
          name_ru: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          group_type?: string
          icon?: string
          id?: number
          key?: string
          name_en?: string
          name_es?: string
          name_ru?: string
          sort_order?: number
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
          archived_at: string | null
          attachments: Json | null
          category_id: string | null
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          goal_id: string | null
          icon: string | null
          id: string
          name: string
          postpone_count: number | null
          postponed_until: string | null
          priority: string
          recurrence: string | null
          sphere_id: number | null
          status: string
          subtasks: Json | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          attachments?: Json | null
          category_id?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          goal_id?: string | null
          icon?: string | null
          id?: string
          name: string
          postpone_count?: number | null
          postponed_until?: string | null
          priority?: string
          recurrence?: string | null
          sphere_id?: number | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          attachments?: Json | null
          category_id?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          goal_id?: string | null
          icon?: string | null
          id?: string
          name?: string
          postpone_count?: number | null
          postponed_until?: string | null
          priority?: string
          recurrence?: string | null
          sphere_id?: number | null
          status?: string
          subtasks?: Json | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sphere_id_fkey"
            columns: ["sphere_id"]
            isOneToOne: false
            referencedRelation: "spheres"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          end_time: string
          goal_id: string | null
          id: string
          sphere_id: number | null
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
          goal_id?: string | null
          id?: string
          sphere_id?: number | null
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
          goal_id?: string | null
          id?: string
          sphere_id?: number | null
          start_time?: string
          subtask_id?: string | null
          task_id?: string | null
          task_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_sphere_id_fkey"
            columns: ["sphere_id"]
            isOneToOne: false
            referencedRelation: "spheres"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          completed: boolean
          created_at: string
          date: string
          goal_id: string | null
          id: string
          name: string
          recurrence: string | null
          sphere_id: number | null
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
          goal_id?: string | null
          id?: string
          name: string
          recurrence?: string | null
          sphere_id?: number | null
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
          goal_id?: string | null
          id?: string
          name?: string
          recurrence?: string | null
          sphere_id?: number | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sphere_id_fkey"
            columns: ["sphere_id"]
            isOneToOne: false
            referencedRelation: "spheres"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          achievement_type: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          achievement_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          achievement_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_activity: {
        Row: {
          activity_date: string
          created_at: string
          habits_completed: number
          id: string
          likes_received: number
          stars_earned: number
          tasks_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_date: string
          created_at?: string
          habits_completed?: number
          id?: string
          likes_received?: number
          stars_earned?: number
          tasks_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string
          habits_completed?: number
          id?: string
          likes_received?: number
          stars_earned?: number
          tasks_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_levels: {
        Row: {
          created_at: string
          current_level: number
          habits_completed: number
          id: string
          stars_earned: number
          tasks_completed: number
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          created_at?: string
          current_level?: number
          habits_completed?: number
          id?: string
          stars_earned?: number
          tasks_completed?: number
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          created_at?: string
          current_level?: number
          habits_completed?: number
          id?: string
          stars_earned?: number
          tasks_completed?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
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
      user_productivity_stats: {
        Row: {
          goals_achieved_count: number
          id: string
          tasks_completed_count: number
          unique_habits_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          goals_achieved_count?: number
          id?: string
          tasks_completed_count?: number
          unique_habits_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          goals_achieved_count?: number
          id?: string
          tasks_completed_count?: number
          unique_habits_count?: number
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
      user_subscriptions: {
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
      add_user_xp: {
        Args: { p_user_id: string; p_xp_amount: number; p_xp_source: string }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_total_xp: number
        }[]
      }
      calculate_level_from_xp: {
        Args: { xp: number }
        Returns: {
          level: number
          xp_for_next: number
          xp_in_current_level: number
        }[]
      }
      calculate_referral_bonus: {
        Args: { referrer_user_id: string }
        Returns: number
      }
      calculate_referral_bonus_v2: {
        Args: { referrer_user_id: string }
        Returns: Record<string, unknown>
      }
      find_user_by_telegram: {
        Args: { tg_id: number }
        Returns: {
          avatar_url: string
          display_name: string
          user_id: string
        }[]
      }
      generate_invite_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_telegram_account: {
        Args: { tg_id: number; tg_username?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "team"
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
      app_role: ["admin", "moderator", "user", "team"],
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
