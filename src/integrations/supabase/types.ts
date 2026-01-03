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
      activity_feed: {
        Row: {
          activity_type: string
          content: Json | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          content?: Json | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          content?: Json | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_blocked_users: {
        Row: {
          blocked_by: string
          created_at: string | null
          evidence: Json | null
          id: string
          reason: string
          status: string | null
          unblocked_at: string | null
          user_id: string
        }
        Insert: {
          blocked_by: string
          created_at?: string | null
          evidence?: Json | null
          id?: string
          reason: string
          status?: string | null
          unblocked_at?: string | null
          user_id: string
        }
        Update: {
          blocked_by?: string
          created_at?: string | null
          evidence?: Json | null
          id?: string
          reason?: string
          status?: string | null
          unblocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_blocked_users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_blocked_users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_blocked_users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_blocked_users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_blocked_users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_realtime_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          notification_type: string
          priority: string
          read_at: string | null
          read_by: string | null
          title: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          priority?: string
          read_at?: string | null
          read_by?: string | null
          title: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          priority?: string
          read_at?: string | null
          read_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_realtime_notifications_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_realtime_notifications_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_realtime_notifications_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_realtime_notifications_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_realtime_notifications_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      angel_ai_achievements: {
        Row: {
          achievement_type: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      angel_ai_chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      angel_ai_stories: {
        Row: {
          completed: boolean | null
          content: Json
          created_at: string | null
          id: string
          theme: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          content?: Json
          created_at?: string | null
          id?: string
          theme?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          content?: Json
          created_at?: string | null
          id?: string
          theme?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blocked_games: {
        Row: {
          child_id: string
          created_at: string | null
          game_id: string
          id: string
          parent_id: string
          reason: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          game_id: string
          id?: string
          parent_id: string
          reason?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          game_id?: string
          id?: string
          parent_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_signals: {
        Row: {
          call_id: string
          created_at: string
          id: string
          sender_id: string
          signal_data: Json
          signal_type: string
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: string
          sender_id: string
          signal_data: Json
          signal_type: string
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          signal_data?: Json
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_signals_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "video_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_signals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "call_signals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "call_signals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_signals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_signals_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      camly_claims: {
        Row: {
          amount: number
          claim_type: Database["public"]["Enums"]["claim_type"]
          claimed_at: string | null
          created_at: string
          game_id: string | null
          id: string
          parent_approval_required: boolean | null
          parent_approved_at: string | null
          parent_approved_by: string | null
          status: string
          tx_hash: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          amount: number
          claim_type: Database["public"]["Enums"]["claim_type"]
          claimed_at?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          parent_approval_required?: boolean | null
          parent_approved_at?: string | null
          parent_approved_by?: string | null
          status?: string
          tx_hash?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          amount?: number
          claim_type?: Database["public"]["Enums"]["claim_type"]
          claimed_at?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          parent_approval_required?: boolean | null
          parent_approved_at?: string | null
          parent_approved_by?: string | null
          status?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "camly_claims_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
        ]
      }
      camly_coin_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          transaction_date: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_date?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_date?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      charity_wallet_stats: {
        Row: {
          id: string
          last_updated: string
          total_donated: number
          total_transactions: number
        }
        Insert: {
          id?: string
          last_updated?: string
          total_donated?: number
          total_transactions?: number
        }
        Update: {
          id?: string
          last_updated?: string
          total_donated?: number
          total_transactions?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          is_read: boolean | null
          message: string
          pinned_at: string | null
          pinned_by: string | null
          reply_to_message_id: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean | null
          message: string
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_message_id?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_read?: boolean | null
          message?: string
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_message_id?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          game_id: string | null
          id: string
          name: string | null
          room_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          game_id?: string | null
          id?: string
          name?: string | null
          room_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          game_id?: string | null
          id?: string
          name?: string | null
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      child_play_sessions: {
        Row: {
          child_id: string
          created_at: string | null
          duration_minutes: number
          ended_at: string | null
          game_id: string | null
          id: string
          session_date: string
          started_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          duration_minutes?: number
          ended_at?: string | null
          game_id?: string | null
          id?: string
          session_date?: string
          started_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          duration_minutes?: number
          ended_at?: string | null
          game_id?: string | null
          id?: string
          session_date?: string
          started_at?: string | null
        }
        Relationships: []
      }
      child_time_limits: {
        Row: {
          bedtime_end: string | null
          bedtime_start: string | null
          child_id: string
          created_at: string | null
          daily_limit_minutes: number
          id: string
          is_active: boolean | null
          parent_id: string
          updated_at: string | null
          weekend_limit_minutes: number
        }
        Insert: {
          bedtime_end?: string | null
          bedtime_start?: string | null
          child_id: string
          created_at?: string | null
          daily_limit_minutes?: number
          id?: string
          is_active?: boolean | null
          parent_id: string
          updated_at?: string | null
          weekend_limit_minutes?: number
        }
        Update: {
          bedtime_end?: string | null
          bedtime_start?: string | null
          child_id?: string
          created_at?: string | null
          daily_limit_minutes?: number
          id?: string
          is_active?: boolean | null
          parent_id?: string
          updated_at?: string | null
          weekend_limit_minutes?: number
        }
        Relationships: []
      }
      claimed_referral_tiers: {
        Row: {
          claimed_at: string
          id: string
          reward_amount: number
          tier_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_amount: number
          tier_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_amount?: number
          tier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claimed_referral_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "claimed_referral_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "claimed_referral_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claimed_referral_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claimed_referral_tiers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_active_periods: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          period_end: string
          period_start: string
          period_type: string
          top_combo: number
          top_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          period_end: string
          period_start: string
          period_type: string
          top_combo?: number
          top_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          period_end?: string
          period_start?: string
          period_type?: string
          top_combo?: number
          top_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "combo_active_periods_top_user_id_fkey"
            columns: ["top_user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "combo_active_periods_top_user_id_fkey"
            columns: ["top_user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "combo_active_periods_top_user_id_fkey"
            columns: ["top_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_active_periods_top_user_id_fkey"
            columns: ["top_user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_active_periods_top_user_id_fkey"
            columns: ["top_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      combo_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          difficulty: string
          icon: string | null
          id: string
          is_active: boolean
          prize_amount: number
          prize_type: string
          required_level: number | null
          target_combo: number
          time_limit_seconds: number | null
          title: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          difficulty: string
          icon?: string | null
          id?: string
          is_active?: boolean
          prize_amount?: number
          prize_type?: string
          required_level?: number | null
          target_combo: number
          time_limit_seconds?: number | null
          title: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          difficulty?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          prize_amount?: number
          prize_type?: string
          required_level?: number | null
          target_combo?: number
          time_limit_seconds?: number | null
          title?: string
        }
        Relationships: []
      }
      combo_period_winners: {
        Row: {
          claimed: boolean
          created_at: string
          highest_combo: number
          id: string
          period_end: string
          period_start: string
          period_type: string
          prize_amount: number
          prize_type: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          highest_combo: number
          id?: string
          period_end: string
          period_start: string
          period_type: string
          prize_amount?: number
          prize_type?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          highest_combo?: number
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          prize_amount?: number
          prize_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_period_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "combo_period_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "combo_period_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_period_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combo_period_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_reports: {
        Row: {
          comment_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "uploaded_game_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_earnings: {
        Row: {
          created_at: string
          creator_id: string
          daily_earnings_today: number
          first_play_earnings: number
          first_plays_count: number
          game_id: string
          game_type: string
          id: string
          last_daily_reset: string | null
          milestone_100_claimed: boolean
          milestone_1000_claimed: boolean
          milestone_500_claimed: boolean
          royalty_earnings: number
          total_earnings: number
          total_milestone_earnings: number
          total_play_minutes: number
          updated_at: string
          upload_bonus_amount: number
          upload_bonus_claimed: boolean
        }
        Insert: {
          created_at?: string
          creator_id: string
          daily_earnings_today?: number
          first_play_earnings?: number
          first_plays_count?: number
          game_id: string
          game_type?: string
          id?: string
          last_daily_reset?: string | null
          milestone_100_claimed?: boolean
          milestone_1000_claimed?: boolean
          milestone_500_claimed?: boolean
          royalty_earnings?: number
          total_earnings?: number
          total_milestone_earnings?: number
          total_play_minutes?: number
          updated_at?: string
          upload_bonus_amount?: number
          upload_bonus_claimed?: boolean
        }
        Update: {
          created_at?: string
          creator_id?: string
          daily_earnings_today?: number
          first_play_earnings?: number
          first_plays_count?: number
          game_id?: string
          game_type?: string
          id?: string
          last_daily_reset?: string | null
          milestone_100_claimed?: boolean
          milestone_1000_claimed?: boolean
          milestone_500_claimed?: boolean
          royalty_earnings?: number
          total_earnings?: number
          total_milestone_earnings?: number
          total_play_minutes?: number
          updated_at?: string
          upload_bonus_amount?: number
          upload_bonus_claimed?: boolean
        }
        Relationships: []
      }
      daily_claim_logs: {
        Row: {
          amount_claimed: number
          claim_date: string
          created_at: string
          id: string
          tx_hash: string | null
          user_id: string
        }
        Insert: {
          amount_claimed?: number
          claim_date?: string
          created_at?: string
          id?: string
          tx_hash?: string | null
          user_id: string
        }
        Update: {
          amount_claimed?: number
          claim_date?: string
          created_at?: string
          id?: string
          tx_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_combo_challenges: {
        Row: {
          challenge_date: string
          challenge_id: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          total_completions: number
        }
        Insert: {
          challenge_date: string
          challenge_id: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          total_completions?: number
        }
        Update: {
          challenge_date?: string
          challenge_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          total_completions?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_combo_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "combo_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_login_rewards: {
        Row: {
          amount: number
          claim_date: string
          claimed_at: string
          created_at: string
          id: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount?: number
          claim_date?: string
          claimed_at?: string
          created_at?: string
          id?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          claim_date?: string
          claimed_at?: string
          created_at?: string
          id?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      daily_play_rewards: {
        Row: {
          age_group: string | null
          created_at: string
          daily_cap: number
          id: string
          new_game_count: number
          new_game_rewards_earned: number
          reward_date: string
          time_rewards_earned: number
          total_play_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          daily_cap?: number
          id?: string
          new_game_count?: number
          new_game_rewards_earned?: number
          reward_date?: string
          time_rewards_earned?: number
          total_play_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          age_group?: string | null
          created_at?: string
          daily_cap?: number
          id?: string
          new_game_count?: number
          new_game_rewards_earned?: number
          reward_date?: string
          time_rewards_earned?: number
          total_play_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_quiz_completions: {
        Row: {
          camly_earned: number | null
          completed_at: string | null
          id: string
          quiz_date: string | null
          score: number | null
          streak_count: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          camly_earned?: number | null
          completed_at?: string | null
          id?: string
          quiz_date?: string | null
          score?: number | null
          streak_count?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          camly_earned?: number | null
          completed_at?: string | null
          id?: string
          quiz_date?: string | null
          score?: number | null
          streak_count?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_upload_rewards: {
        Row: {
          created_at: string
          id: string
          reward_count: number
          reward_date: string
          total_coins_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reward_count?: number
          reward_date?: string
          total_coins_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reward_count?: number
          reward_date?: string
          total_coins_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "education_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "education_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      education_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "education_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      education_posts: {
        Row: {
          category: string
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fraud_logs: {
        Row: {
          action_taken: string | null
          amount_affected: number | null
          description: string | null
          detected_at: string | null
          fraud_type: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          amount_affected?: number | null
          description?: string | null
          detected_at?: string | null
          fraud_type: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          amount_affected?: number | null
          description?: string | null
          detected_at?: string | null
          fraud_type?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_id: {
        Row: {
          avatar_glow_color: string | null
          created_at: string | null
          display_name: string | null
          energy_level: number | null
          id: string
          last_activity_at: string | null
          last_angel_message: string | null
          light_points: number | null
          role: string | null
          soul_nft_id: string | null
          soul_nft_name: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          avatar_glow_color?: string | null
          created_at?: string | null
          display_name?: string | null
          energy_level?: number | null
          id?: string
          last_activity_at?: string | null
          last_angel_message?: string | null
          light_points?: number | null
          role?: string | null
          soul_nft_id?: string | null
          soul_nft_name?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          avatar_glow_color?: string | null
          created_at?: string | null
          display_name?: string | null
          energy_level?: number | null
          id?: string
          last_activity_at?: string | null
          last_angel_message?: string | null
          light_points?: number | null
          role?: string | null
          soul_nft_id?: string | null
          soul_nft_name?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      game_cleanup_rewards: {
        Row: {
          claim_date: string
          claimed_at: string
          game_id: string
          id: string
          reward_amount: number
          user_id: string
        }
        Insert: {
          claim_date?: string
          claimed_at?: string
          game_id: string
          id?: string
          reward_amount?: number
          user_id: string
        }
        Update: {
          claim_date?: string
          claimed_at?: string
          game_id?: string
          id?: string
          reward_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      game_plays: {
        Row: {
          game_id: string
          id: string
          played_at: string
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          played_at?: string
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          played_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_plays_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_progress: {
        Row: {
          created_at: string
          game_id: string
          highest_level_completed: number
          id: string
          total_stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          highest_level_completed?: number
          id?: string
          total_stars?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          highest_level_completed?: number
          id?: string
          total_stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_progress_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_ratings: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          liked: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          liked?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          liked?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_reviews: {
        Row: {
          created_at: string
          game_id: string
          id: string
          notes: string | null
          reviewer_id: string
          status: Database["public"]["Enums"]["game_status"]
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          notes?: string | null
          reviewer_id: string
          status: Database["public"]["Enums"]["game_status"]
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          notes?: string | null
          reviewer_id?: string
          status?: Database["public"]["Enums"]["game_status"]
        }
        Relationships: [
          {
            foreignKeyName: "game_reviews_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "game_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          game_id: string
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          game_id: string
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          game_id?: string
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          component_name: string
          created_at: string | null
          description: string | null
          difficulty: string | null
          genre: Database["public"]["Enums"]["game_genre"]
          how_to_play: string | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          total_likes: number | null
          total_plays: number | null
          updated_at: string | null
        }
        Insert: {
          component_name: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          genre: Database["public"]["Enums"]["game_genre"]
          how_to_play?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          total_likes?: number | null
          total_plays?: number | null
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          genre?: Database["public"]["Enums"]["game_genre"]
          how_to_play?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          total_likes?: number | null
          total_plays?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gold_miner_combos: {
        Row: {
          created_at: string
          highest_combo: number
          id: string
          level_achieved: number
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highest_combo?: number
          id?: string
          level_achieved?: number
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          highest_combo?: number
          id?: string
          level_achieved?: number
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      healing_music_432hz: {
        Row: {
          artist: string | null
          category: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          storage_path: string
          title: string
        }
        Insert: {
          artist?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          storage_path: string
          title: string
        }
        Update: {
          artist?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          storage_path?: string
          title?: string
        }
        Relationships: []
      }
      ip_blacklist: {
        Row: {
          blocked_by: string | null
          created_at: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          reason: string
          updated_at: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          reason: string
          updated_at?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          reason?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ip_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ip_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lovable_games: {
        Row: {
          approved: boolean | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          project_url: string
          title: string
          user_id: string | null
          zip_url: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          project_url: string
          title: string
          user_id?: string | null
          zip_url?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          project_url?: string
          title?: string
          user_id?: string | null
          zip_url?: string | null
        }
        Relationships: []
      }
      message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      minted_achievement_nfts: {
        Row: {
          achievement_type: string
          created_at: string
          id: string
          minted_at: string
          token_id: string
          tx_hash: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          achievement_type: string
          created_at?: string
          id?: string
          minted_at?: string
          token_id: string
          tx_hash: string
          user_id: string
          wallet_address: string
        }
        Update: {
          achievement_type?: string
          created_at?: string
          id?: string
          minted_at?: string
          token_id?: string
          tx_hash?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      nexus_leaderboard: {
        Row: {
          created_at: string | null
          highest_tile: number
          id: string
          level_reached: number
          score: number
          time_played: number
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          highest_tile: number
          id?: string
          level_reached?: number
          score: number
          time_played?: number
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          highest_tile?: number
          id?: string
          level_reached?: number
          score?: number
          time_played?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "nexus_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "nexus_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexus_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_child_links: {
        Row: {
          approved_at: string | null
          child_id: string
          created_at: string | null
          id: string
          parent_id: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          child_id: string
          created_at?: string | null
          id?: string
          parent_id: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          child_id?: string
          created_at?: string | null
          id?: string
          parent_id?: string
          status?: string
        }
        Relationships: []
      }
      pending_rewards: {
        Row: {
          amount: number
          claimed: boolean
          claimed_at: string | null
          created_at: string
          game_id: string | null
          id: string
          source: string
          tx_hash: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          amount?: number
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          source: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          amount?: number
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          source?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_rewards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_donations: {
        Row: {
          amount: number
          created_at: string | null
          donation_type: string | null
          id: string
          is_anonymous: boolean | null
          is_onchain: boolean | null
          message: string | null
          tx_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          donation_type?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_onchain?: boolean | null
          message?: string | null
          tx_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          donation_type?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_onchain?: boolean | null
          message?: string | null
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "platform_donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "platform_donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      play_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          game_id: string
          game_type: string
          id: string
          is_valid: boolean
          last_activity_at: string
          rewards_earned: number
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          game_id: string
          game_type?: string
          id?: string
          is_valid?: boolean
          last_activity_at?: string
          rewards_earned?: number
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          game_id?: string
          game_type?: string
          id?: string
          is_valid?: boolean
          last_activity_at?: string
          rewards_earned?: number
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_items: {
        Row: {
          added_at: string | null
          id: string
          music_id: string
          playlist_id: string
          position: number
        }
        Insert: {
          added_at?: string | null
          id?: string
          music_id: string
          playlist_id: string
          position?: number
        }
        Update: {
          added_at?: string | null
          id?: string
          music_id?: string
          playlist_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_music_id_fkey"
            columns: ["music_id"]
            isOneToOne: false
            referencedRelation: "user_music"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          feeling: string | null
          id: string
          image_url: string | null
          likes_count: number | null
          privacy: string | null
          shares_count: number | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          feeling?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          privacy?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          feeling?: string | null
          id?: string
          image_url?: string | null
          likes_count?: number | null
          privacy?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          attachment_url: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "private_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bio_full: string | null
          cover_url: string | null
          created_at: string | null
          education: string | null
          email: string
          id: string
          leaderboard_score: number | null
          location: string | null
          referral_code: string | null
          relationship_status: string | null
          total_friends: number | null
          total_likes: number | null
          total_messages: number | null
          total_plays: number | null
          updated_at: string | null
          username: string
          wallet_address: string | null
          wallet_balance: number | null
          workplace: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bio_full?: string | null
          cover_url?: string | null
          created_at?: string | null
          education?: string | null
          email: string
          id: string
          leaderboard_score?: number | null
          location?: string | null
          referral_code?: string | null
          relationship_status?: string | null
          total_friends?: number | null
          total_likes?: number | null
          total_messages?: number | null
          total_plays?: number | null
          updated_at?: string | null
          username: string
          wallet_address?: string | null
          wallet_balance?: number | null
          workplace?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bio_full?: string | null
          cover_url?: string | null
          created_at?: string | null
          education?: string | null
          email?: string
          id?: string
          leaderboard_score?: number | null
          location?: string | null
          referral_code?: string | null
          relationship_status?: string | null
          total_friends?: number | null
          total_likes?: number | null
          total_messages?: number | null
          total_plays?: number | null
          updated_at?: string | null
          username?: string
          wallet_address?: string | null
          wallet_balance?: number | null
          workplace?: string | null
        }
        Relationships: []
      }
      project_wallet_stats: {
        Row: {
          id: string
          last_updated: string | null
          total_claimed: number | null
          total_distributed: number | null
          total_pending: number | null
          total_supply: number | null
        }
        Insert: {
          id?: string
          last_updated?: string | null
          total_claimed?: number | null
          total_distributed?: number | null
          total_pending?: number | null
          total_supply?: number | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          total_claimed?: number | null
          total_distributed?: number | null
          total_pending?: number | null
          total_supply?: number | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          reward_paid: boolean
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          reward_paid?: boolean
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_paid?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_approval_queue: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          rejection_reason: string | null
          reward_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          rejection_reason?: string | null
          reward_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          rejection_reason?: string | null
          reward_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_approval_queue_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reward_approval_queue_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reward_approval_queue_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_approval_queue_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_approval_queue_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_approval_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reward_approval_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reward_approval_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_approval_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_approval_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suspicious_activity_logs: {
        Row: {
          action_taken: string | null
          activity_type: string
          created_at: string | null
          details: Json | null
          id: string
          reviewed: boolean | null
          reviewed_by: string | null
          risk_score: number | null
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          activity_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          reviewed?: boolean | null
          reviewed_by?: string | null
          risk_score?: number | null
          user_id: string
        }
        Update: {
          action_taken?: string | null
          activity_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          reviewed?: boolean | null
          reviewed_by?: string | null
          risk_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspicious_activity_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suspicious_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          notification_type: string | null
          priority: string | null
          read_by: string[] | null
          scheduled_at: string | null
          sent_at: string | null
          target_audience: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          notification_type?: string | null
          priority?: string | null
          read_by?: string[] | null
          scheduled_at?: string | null
          sent_at?: string | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          notification_type?: string | null
          priority?: string | null
          read_by?: string[] | null
          scheduled_at?: string | null
          sent_at?: string | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "system_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "system_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_game_rewards: {
        Row: {
          claimed_at: string
          game_id: string
          id: string
          reward_amount: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          game_id: string
          id?: string
          reward_amount?: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          game_id?: string
          id?: string
          reward_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      uploaded_file_hashes: {
        Row: {
          bitrate: number | null
          created_at: string
          duration_ms: number | null
          file_hash: string
          file_size: number | null
          id: string
          music_id: string | null
          rewarded: boolean
          sample_rate: number | null
          user_id: string
        }
        Insert: {
          bitrate?: number | null
          created_at?: string
          duration_ms?: number | null
          file_hash: string
          file_size?: number | null
          id?: string
          music_id?: string | null
          rewarded?: boolean
          sample_rate?: number | null
          user_id: string
        }
        Update: {
          bitrate?: number | null
          created_at?: string
          duration_ms?: number | null
          file_hash?: string
          file_size?: number | null
          id?: string
          music_id?: string | null
          rewarded?: boolean
          sample_rate?: number | null
          user_id?: string
        }
        Relationships: []
      }
      uploaded_game_comments: {
        Row: {
          comment: string
          created_at: string
          game_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          game_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          game_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_game_comments_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_game_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_game_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_game_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_game_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_game_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_game_hashes: {
        Row: {
          created_at: string | null
          file_hash: string
          file_size: number | null
          game_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_hash: string
          file_size?: number | null
          game_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_hash?: string
          file_size?: number | null
          game_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_game_hashes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_game_ratings: {
        Row: {
          created_at: string
          game_id: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_game_ratings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "uploaded_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_game_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      uploaded_games: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: Database["public"]["Enums"]["game_category"]
          created_at: string
          delete_reason: string | null
          delete_reason_detail: string | null
          deleted_at: string | null
          description: string | null
          download_count: number
          external_url: string | null
          game_file_path: string
          id: string
          play_count: number
          rating: number | null
          rating_count: number
          rejection_note: string | null
          status: Database["public"]["Enums"]["game_status"]
          tags: string[] | null
          thumbnail_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: Database["public"]["Enums"]["game_category"]
          created_at?: string
          delete_reason?: string | null
          delete_reason_detail?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          external_url?: string | null
          game_file_path: string
          id?: string
          play_count?: number
          rating?: number | null
          rating_count?: number
          rejection_note?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          tags?: string[] | null
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: Database["public"]["Enums"]["game_category"]
          created_at?: string
          delete_reason?: string | null
          delete_reason_detail?: string | null
          deleted_at?: string | null
          description?: string | null
          download_count?: number
          external_url?: string | null
          game_file_path?: string
          id?: string
          play_count?: number
          rating?: number | null
          rating_count?: number
          rejection_note?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "uploaded_games_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_games_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_games_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_games_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_games_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "uploaded_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploaded_games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_background_videos: {
        Row: {
          created_at: string | null
          duration: string | null
          file_size: number | null
          id: string
          is_active: boolean | null
          storage_path: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          storage_path: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          storage_path?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_background_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_background_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_background_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_background_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_background_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenge_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          current_combo: number
          daily_challenge_id: string
          highest_combo: number
          id: string
          missed_count: number
          prize_claimed: boolean
          started_at: string | null
          time_taken_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_combo?: number
          daily_challenge_id: string
          highest_combo?: number
          id?: string
          missed_count?: number
          prize_claimed?: boolean
          started_at?: string | null
          time_taken_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_combo?: number
          daily_challenge_id?: string
          highest_combo?: number
          id?: string
          missed_count?: number
          prize_claimed?: boolean
          started_at?: string | null
          time_taken_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_daily_challenge_id_fkey"
            columns: ["daily_challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_combo_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenge_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_game_plays: {
        Row: {
          created_at: string
          first_play_at: string
          game_id: string
          game_type: string
          id: string
          last_play_at: string
          new_game_reward_amount: number
          new_game_reward_claimed: boolean
          session_count: number
          total_play_seconds: number
          total_time_rewards: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_play_at?: string
          game_id: string
          game_type?: string
          id?: string
          last_play_at?: string
          new_game_reward_amount?: number
          new_game_reward_claimed?: boolean
          session_count?: number
          total_play_seconds?: number
          total_time_rewards?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_play_at?: string
          game_id?: string
          game_type?: string
          id?: string
          last_play_at?: string
          new_game_reward_amount?: number
          new_game_reward_claimed?: boolean
          session_count?: number
          total_play_seconds?: number
          total_time_rewards?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_login_history: {
        Row: {
          device_fingerprint: string | null
          id: string
          ip_address: string
          login_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_fingerprint?: string | null
          id?: string
          ip_address: string
          login_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_fingerprint?: string | null
          id?: string
          ip_address?: string
          login_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_music: {
        Row: {
          artist: string | null
          created_at: string
          duration: string | null
          file_size: number | null
          genre: string | null
          id: string
          parent_approved: boolean | null
          pending_approval: boolean | null
          storage_path: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          artist?: string | null
          created_at?: string
          duration?: string | null
          file_size?: number | null
          genre?: string | null
          id?: string
          parent_approved?: boolean | null
          pending_approval?: boolean | null
          storage_path: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          artist?: string | null
          created_at?: string
          duration?: string | null
          file_size?: number | null
          genre?: string | null
          id?: string
          parent_approved?: boolean | null
          pending_approval?: boolean | null
          storage_path?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_nexus_stats: {
        Row: {
          created_at: string | null
          daily_streak: number
          games_played: number
          highest_tile: number
          id: string
          last_login_date: string | null
          nexus_tokens: number
          total_score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_streak?: number
          games_played?: number
          highest_tile?: number
          id?: string
          last_login_date?: string | null
          nexus_tokens?: number
          total_score?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_streak?: number
          games_played?: number
          highest_tile?: number
          id?: string
          last_login_date?: string | null
          nexus_tokens?: number
          total_score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_nexus_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_nexus_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_nexus_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_nexus_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_nexus_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          claimed_amount: number
          created_at: string
          daily_claimed: number
          id: string
          last_claim_amount: number | null
          last_claim_at: string | null
          last_claim_date: string | null
          pending_amount: number
          total_earned: number
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          claimed_amount?: number
          created_at?: string
          daily_claimed?: number
          id?: string
          last_claim_amount?: number | null
          last_claim_at?: string | null
          last_claim_date?: string | null
          pending_amount?: number
          total_earned?: number
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          claimed_amount?: number
          created_at?: string
          daily_claimed?: number
          id?: string
          last_claim_amount?: number | null
          last_claim_at?: string | null
          last_claim_date?: string | null
          pending_amount?: number
          total_earned?: number
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_role_selections: {
        Row: {
          id: string
          selected_at: string
          selected_role: string
          user_id: string
        }
        Insert: {
          id?: string
          selected_at?: string
          selected_role: string
          user_id: string
        }
        Update: {
          id?: string
          selected_at?: string
          selected_role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_calls: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          quality_stats: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          call_type?: string
          callee_id: string
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          quality_stats?: Json | null
          started_at?: string | null
          status?: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          quality_stats?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_calls_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_calls_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_calls_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_auth_nonces: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          nonce: string
          used: boolean
          wallet_address: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce: string
          used?: boolean
          wallet_address: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string
          used?: boolean
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_blacklist: {
        Row: {
          blocked_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          reason: string
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          blocked_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_blacklist_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_history: {
        Row: {
          action: string
          created_at: string
          id: string
          previous_wallet: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          previous_wallet?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          previous_wallet?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_reset_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_wallet: string | null
          id: string
          reason: string
          requested_wallet: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_wallet?: string | null
          id?: string
          reason: string
          requested_wallet?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_wallet?: string | null
          id?: string
          reason?: string
          requested_wallet?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_reset_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_reset_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string | null
          gas_fee: number | null
          id: string
          notes: string | null
          recipients_count: number | null
          status: string
          to_user_id: string | null
          token_type: string
          transaction_hash: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id?: string | null
          gas_fee?: number | null
          id?: string
          notes?: string | null
          recipients_count?: number | null
          status?: string
          to_user_id?: string | null
          token_type?: string
          transaction_hash?: string | null
          transaction_type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string | null
          gas_fee?: number | null
          id?: string
          notes?: string | null
          recipients_count?: number | null
          status?: string
          to_user_id?: string | null
          token_type?: string
          transaction_hash?: string | null
          transaction_type?: string
        }
        Relationships: []
      }
      web3_reward_transactions: {
        Row: {
          amount: number
          claim_date: string | null
          claimed_to_wallet: boolean
          created_at: string
          description: string | null
          id: string
          leaderboard_score: number | null
          metadata: Json | null
          reward_type: string
          status: string | null
          transaction_hash: string | null
          tx_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          claim_date?: string | null
          claimed_to_wallet?: boolean
          created_at?: string
          description?: string | null
          id?: string
          leaderboard_score?: number | null
          metadata?: Json | null
          reward_type: string
          status?: string | null
          transaction_hash?: string | null
          tx_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          claim_date?: string | null
          claimed_to_wallet?: boolean
          created_at?: string
          description?: string | null
          id?: string
          leaderboard_score?: number | null
          metadata?: Json | null
          reward_type?: string
          status?: string | null
          transaction_hash?: string | null
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web3_reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web3_reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web3_reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web3_reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web3_reward_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      web3_rewards: {
        Row: {
          camly_balance: number
          created_at: string
          daily_streak: number
          first_game_claimed: boolean
          first_wallet_claimed: boolean
          id: string
          last_daily_checkin: string | null
          referral_earnings: number
          total_claimed_to_wallet: number
          total_referrals: number
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          camly_balance?: number
          created_at?: string
          daily_streak?: number
          first_game_claimed?: boolean
          first_wallet_claimed?: boolean
          id?: string
          last_daily_checkin?: string | null
          referral_earnings?: number
          total_claimed_to_wallet?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          camly_balance?: number
          created_at?: string
          daily_streak?: number
          first_game_claimed?: boolean
          first_wallet_claimed?: boolean
          id?: string
          last_daily_checkin?: string | null
          referral_earnings?: number
          total_claimed_to_wallet?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web3_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "camly_leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web3_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "leaderboard_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "web3_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web3_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web3_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      camly_leaderboard: {
        Row: {
          avatar_url: string | null
          camly_balance: number | null
          user_id: string | null
          username: string | null
        }
        Relationships: []
      }
      leaderboard_stats: {
        Row: {
          avatar_url: string | null
          pending_balance: number | null
          total_claimed: number | null
          total_earned: number | null
          user_id: string | null
          username: string | null
          wallet_address: string | null
        }
        Relationships: []
      }
      public_leaderboard: {
        Row: {
          avatar_url: string | null
          id: string | null
          leaderboard_score: number | null
          total_likes: number | null
          total_plays: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          leaderboard_score?: number | null
          total_likes?: number | null
          total_plays?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          leaderboard_score?: number | null
          total_likes?: number | null
          total_plays?: number | null
          username?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          id: string | null
          leaderboard_score: number | null
          total_friends: number | null
          total_likes: number | null
          total_plays: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string | null
          leaderboard_score?: number | null
          total_friends?: number | null
          total_likes?: number | null
          total_plays?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string | null
          leaderboard_score?: number | null
          total_friends?: number | null
          total_likes?: number | null
          total_plays?: number | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_pending_reward: {
        Args: {
          p_amount: number
          p_game_id?: string
          p_source: string
          p_user_id?: string
          p_wallet_address: string
        }
        Returns: string
      }
      add_reward_safely: {
        Args: {
          p_amount: number
          p_description?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: {
          message: string
          new_balance: number
          success: boolean
        }[]
      }
      add_user_pending_reward: {
        Args: { p_amount: number; p_source: string; p_user_id: string }
        Returns: number
      }
      admin_block_users_by_ip: {
        Args: { p_admin_id: string; p_ip_address: string; p_reason?: string }
        Returns: {
          blocked_count: number
          reset_amount: number
          user_ids: string[]
        }[]
      }
      admin_reset_user_rewards: {
        Args: {
          p_admin_user_id: string
          p_reason?: string
          p_target_user_id: string
        }
        Returns: Json
      }
      admin_sync_all_rewards: {
        Args: never
        Returns: {
          claimed: number
          pending: number
          total_earned: number
          user_id: string
        }[]
      }
      can_claim_daily_login: { Args: { p_user_id: string }; Returns: boolean }
      can_claim_reward: {
        Args: { p_transaction_type: string; p_user_id: string }
        Returns: boolean
      }
      check_duplicate_ranking_claim: {
        Args: { p_score: number; p_user_id: string }
        Returns: boolean
      }
      check_file_hash_exists: {
        Args: { p_file_hash: string; p_user_id: string }
        Returns: {
          exists_for_others: boolean
          exists_for_user: boolean
          original_user_id: string
        }[]
      }
      check_ip_eligibility: {
        Args: { p_ip_address: string; p_max_accounts?: number }
        Returns: {
          existing_accounts: number
          is_blacklisted: boolean
          is_eligible: boolean
          reason: string
        }[]
      }
      check_similar_file_exists: {
        Args: {
          p_bitrate: number
          p_duration_ms: number
          p_tolerance_ms?: number
          p_user_id: string
        }
        Returns: boolean
      }
      check_wallet_eligibility: {
        Args: { p_user_id: string; p_wallet_address: string }
        Returns: {
          can_connect: boolean
          existing_user_id: string
          reason: string
          wallet_changes_count: number
        }[]
      }
      claim_challenge_reward_safe: {
        Args: { p_challenge_id: string; p_reward_amount: number }
        Returns: Json
      }
      claim_combo_prize_safe: { Args: { p_prize_id: string }; Returns: Json }
      claim_daily_login_reward: {
        Args: { p_user_id: string; p_wallet_address?: string }
        Returns: {
          already_claimed: boolean
          amount: number
          message: string
          success: boolean
        }[]
      }
      claim_from_pending: {
        Args: { p_amount: number; p_user_id: string; p_wallet_address: string }
        Returns: {
          daily_remaining: number
          error_message: string
          new_claimed: number
          new_pending: number
          success: boolean
        }[]
      }
      claim_game_cleanup_safe: { Args: { p_game_id: string }; Returns: Json }
      claim_game_complete_safe: {
        Args: { p_game_id: string; p_game_title?: string; p_level: number }
        Returns: Json
      }
      claim_game_win_safe: {
        Args: { p_coins: number; p_game_id: string; p_game_title?: string }
        Returns: Json
      }
      claim_pending_rewards: {
        Args: { p_tx_hash: string; p_wallet_address: string }
        Returns: number
      }
      claim_ranking_reward_safe: {
        Args: { p_amount: number; p_score: number; p_user_id: string }
        Returns: Json
      }
      claim_referral_tier_safe: {
        Args: { p_tier_id: string; p_tier_reward: number }
        Returns: Json
      }
      claim_upload_reward_safe: {
        Args: { p_game_id: string; p_game_title?: string }
        Returns: Json
      }
      cleanup_duplicate_rewards: {
        Args: { p_transaction_type: string }
        Returns: {
          amount_removed: number
          duplicates_removed: number
          user_id: string
        }[]
      }
      cleanup_expired_nonces: { Args: never; Returns: undefined }
      cleanup_old_deleted_games: { Args: never; Returns: undefined }
      complete_daily_quiz: {
        Args: { p_score: number; p_total_questions?: number; p_user_id: string }
        Returns: {
          already_completed: boolean
          camly_earned: number
          new_streak: number
        }[]
      }
      detect_ip_fraud_rings: {
        Args: { min_accounts?: number }
        Returns: {
          account_count: number
          first_seen: string
          ip_address: string
          last_seen: string
          total_balance: number
          user_ids: string[]
          usernames: string[]
        }[]
      }
      find_user_for_transfer: {
        Args: { p_search_input: string }
        Returns: {
          user_id: string
          username: string
          wallet_address: string
        }[]
      }
      get_daily_claim_remaining: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_daily_login_stats: {
        Args: { p_date?: string }
        Returns: {
          total_amount: number
          total_claims: number
          unique_users: number
        }[]
      }
      get_fraud_ip_stats: {
        Args: never
        Returns: {
          blacklisted_ips: number
          recent_fraud_rings: number
          total_affected_accounts: number
          total_affected_balance: number
          total_suspicious_ips: number
        }[]
      }
      get_or_create_daily_reward: {
        Args: { p_user_id: string }
        Returns: {
          can_receive_reward: boolean
          remaining_rewards: number
          reward_count: number
        }[]
      }
      get_or_create_user_rewards: {
        Args: { p_user_id: string }
        Returns: {
          claimed_amount: number
          created_at: string
          daily_claimed: number
          id: string
          last_claim_amount: number | null
          last_claim_at: string | null
          last_claim_date: string | null
          pending_amount: number
          total_earned: number
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user_rewards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_pending_rewards_total: {
        Args: { p_wallet_address: string }
        Returns: number
      }
      get_quiz_streak: { Args: { p_user_id: string }; Returns: number }
      get_user_ip_history: {
        Args: { p_user_id: string }
        Returns: {
          first_login: string
          ip_address: string
          last_login: string
          login_count: number
          other_users_on_ip: number
          user_agent: string
        }[]
      }
      get_wallet_fraud_stats: {
        Args: never
        Returns: {
          blacklisted_wallets: number
          suspicious_patterns: number
          total_wallets: number
          users_with_multiple_changes: number
        }[]
      }
      has_claimed_first_wallet: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      has_claimed_today: {
        Args: {
          p_claim_type: Database["public"]["Enums"]["claim_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_daily_reward: {
        Args: { p_coins_amount?: number; p_user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      log_wallet_connection: {
        Args: {
          p_previous_wallet?: string
          p_user_id: string
          p_wallet_address: string
        }
        Returns: boolean
      }
      process_reward_claim: {
        Args: {
          p_amount: number
          p_tx_hash?: string
          p_user_id: string
          p_wallet_address: string
        }
        Returns: Json
      }
      sync_user_reward_balances: { Args: { p_user_id: string }; Returns: Json }
      update_wallet_balance: {
        Args: { p_amount: number; p_operation?: string; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "kid" | "parent" | "dev"
      claim_type:
        | "first_wallet"
        | "game_completion"
        | "game_upload"
        | "arbitrary"
      game_category:
        | "action"
        | "puzzle"
        | "adventure"
        | "casual"
        | "educational"
        | "racing"
        | "sports"
        | "arcade"
      game_genre:
        | "adventure"
        | "puzzle"
        | "racing"
        | "educational"
        | "casual"
        | "brain"
      game_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "moderator", "user", "kid", "parent", "dev"],
      claim_type: [
        "first_wallet",
        "game_completion",
        "game_upload",
        "arbitrary",
      ],
      game_category: [
        "action",
        "puzzle",
        "adventure",
        "casual",
        "educational",
        "racing",
        "sports",
        "arcade",
      ],
      game_genre: [
        "adventure",
        "puzzle",
        "racing",
        "educational",
        "casual",
        "brain",
      ],
      game_status: ["pending", "approved", "rejected"],
    },
  },
} as const
