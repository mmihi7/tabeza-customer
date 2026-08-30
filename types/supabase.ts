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
      anon_customer_map: {
        Row: {
          anon_customer_id: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          anon_customer_id: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          anon_customer_id?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          bar_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          staff_id: string | null
          tab_id: string | null
        }
        Insert: {
          action: string
          bar_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          staff_id?: string | null
          tab_id?: string | null
        }
        Update: {
          action?: string
          bar_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          staff_id?: string | null
          tab_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "audit_logs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "audit_logs_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_configuration_archive: {
        Row: {
          badge_level: string
          created_at: string
          id: string
          min_spend_amount: number
          updated_at: string
        }
        Insert: {
          badge_level: string
          created_at?: string
          id?: string
          min_spend_amount: number
          updated_at?: string
        }
        Update: {
          badge_level?: string
          created_at?: string
          id?: string
          min_spend_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      bar_categories: {
        Row: {
          bar_id: string
          created_at: string
          id: string
          kind: string
          name: string
          sort_order: number
        }
        Insert: {
          bar_id: string
          created_at?: string
          id?: string
          kind?: string
          name: string
          sort_order?: number
        }
        Update: {
          bar_id?: string
          created_at?: string
          id?: string
          kind?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bar_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "bar_categories_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_products: {
        Row: {
          active: boolean | null
          bar_id: string | null
          category: string
          created_at: string | null
          custom_product_id: string | null
          description: string | null
          id: string
          image_url: string | null
          is_promo: boolean | null
          is_standard: boolean | null
          name: string
          product_id: string | null
          promo_order: number | null
          sale_price: number
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bar_id?: string | null
          category: string
          created_at?: string | null
          custom_product_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_promo?: boolean | null
          is_standard?: boolean | null
          name: string
          product_id?: string | null
          promo_order?: number | null
          sale_price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bar_id?: string | null
          category?: string
          created_at?: string | null
          custom_product_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_promo?: boolean | null
          is_standard?: boolean | null
          name?: string
          product_id?: string | null
          promo_order?: number | null
          sale_price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bar_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "bar_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_spend_tiers: {
        Row: {
          bar_id: string
          created_at: string
          high_threshold: number
          id: string
          low_threshold: number
          medium_threshold: number
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          high_threshold?: number
          id?: string
          low_threshold?: number
          medium_threshold?: number
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          high_threshold?: number
          id?: string
          low_threshold?: number
          medium_threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_spend_tiers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_spend_tiers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "bar_spend_tiers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      bar_suppliers: {
        Row: {
          bar_id: string
          created_at: string
          supplier_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          supplier_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bar_suppliers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_suppliers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "bar_suppliers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bar_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      bars: {
        Row: {
          active: boolean | null
          address: string | null
          alert_custom_audio_name: string | null
          alert_custom_audio_url: string | null
          alert_sound_enabled: boolean | null
          alert_timeout: number | null
          alert_volume: number | null
          area: string | null
          authority_configured_at: string | null
          authority_mode:
            | Database["public"]["Enums"]["authority_mode_enum"]
            | null
          billing_parent_bar_id: string | null
          bronze_threshold: number
          business_24_hours: boolean | null
          business_hours_advanced: Json | null
          business_hours_mode: string | null
          business_hours_simple: Json | null
          card_provider: string | null
          created_at: string | null
          customer_ordering_enabled: boolean
          drink_discount_percent: number | null
          email: string | null
          feature_analytics_enabled: boolean
          feature_promos_enabled: boolean
          food_discount_percent: number | null
          gold_threshold: number
          id: string
          last_cleanup_at: string | null
          latitude: number | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          main_bar_crew_id: string | null
          max_menu_categories_override: number | null
          max_menu_products_override: number | null
          max_staff_seats: number
          menu_enabled: boolean | null
          menu_plan: string
          menu_type: string | null
          mode_last_changed_at: string | null
          mpesa_business_shortcode: string | null
          mpesa_consumer_key_encrypted: string | null
          mpesa_consumer_secret_encrypted: string | null
          mpesa_enabled: boolean | null
          mpesa_environment: string | null
          mpesa_last_test_at: string | null
          mpesa_passkey_encrypted: string | null
          mpesa_setup_completed: boolean | null
          mpesa_test_status: string | null
          name: string
          notification_new_orders: boolean | null
          notification_payments: boolean | null
          notification_pending_approvals: boolean | null
          onboarding_completed: boolean | null
          payment_card_enabled: boolean | null
          payment_cash_enabled: boolean | null
          pdf_menu_url: string | null
          phone: string | null
          plan_activated_at: string | null
          plan_expires_at: string | null
          plan_status: string
          pos_integration_enabled: boolean | null
          pos_receipt_credits: number
          printer_required: boolean | null
          qr_code_url: string | null
          show_customer_menu: boolean
          show_customer_ordering: boolean
          show_customer_promos: boolean
          silver_threshold: number
          slideshow_settings: Json | null
          slug: string | null
          static_menu_type: string | null
          static_menu_url: string | null
          subscription_tier: string | null
          table_count: number | null
          table_setup_enabled: boolean | null
          timezone: string | null
          updated_at: string | null
          venue_mode: Database["public"]["Enums"]["venue_mode_enum"] | null
          venue_plan: string
          venue_type: string
          webhook_url: string | null
          webhooks_enabled: boolean
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          alert_custom_audio_name?: string | null
          alert_custom_audio_url?: string | null
          alert_sound_enabled?: boolean | null
          alert_timeout?: number | null
          alert_volume?: number | null
          area?: string | null
          authority_configured_at?: string | null
          authority_mode?:
            | Database["public"]["Enums"]["authority_mode_enum"]
            | null
          billing_parent_bar_id?: string | null
          bronze_threshold?: number
          business_24_hours?: boolean | null
          business_hours_advanced?: Json | null
          business_hours_mode?: string | null
          business_hours_simple?: Json | null
          card_provider?: string | null
          created_at?: string | null
          customer_ordering_enabled?: boolean
          drink_discount_percent?: number | null
          email?: string | null
          feature_analytics_enabled?: boolean
          feature_promos_enabled?: boolean
          food_discount_percent?: number | null
          gold_threshold?: number
          id?: string
          last_cleanup_at?: string | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          main_bar_crew_id?: string | null
          max_menu_categories_override?: number | null
          max_menu_products_override?: number | null
          max_staff_seats?: number
          menu_enabled?: boolean | null
          menu_plan?: string
          menu_type?: string | null
          mode_last_changed_at?: string | null
          mpesa_business_shortcode?: string | null
          mpesa_consumer_key_encrypted?: string | null
          mpesa_consumer_secret_encrypted?: string | null
          mpesa_enabled?: boolean | null
          mpesa_environment?: string | null
          mpesa_last_test_at?: string | null
          mpesa_passkey_encrypted?: string | null
          mpesa_setup_completed?: boolean | null
          mpesa_test_status?: string | null
          name: string
          notification_new_orders?: boolean | null
          notification_payments?: boolean | null
          notification_pending_approvals?: boolean | null
          onboarding_completed?: boolean | null
          payment_card_enabled?: boolean | null
          payment_cash_enabled?: boolean | null
          pdf_menu_url?: string | null
          phone?: string | null
          plan_activated_at?: string | null
          plan_expires_at?: string | null
          plan_status?: string
          pos_integration_enabled?: boolean | null
          pos_receipt_credits?: number
          printer_required?: boolean | null
          qr_code_url?: string | null
          show_customer_menu?: boolean
          show_customer_ordering?: boolean
          show_customer_promos?: boolean
          silver_threshold?: number
          slideshow_settings?: Json | null
          slug?: string | null
          static_menu_type?: string | null
          static_menu_url?: string | null
          subscription_tier?: string | null
          table_count?: number | null
          table_setup_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          venue_mode?: Database["public"]["Enums"]["venue_mode_enum"] | null
          venue_plan?: string
          venue_type?: string
          webhook_url?: string | null
          webhooks_enabled?: boolean
        }
        Update: {
          active?: boolean | null
          address?: string | null
          alert_custom_audio_name?: string | null
          alert_custom_audio_url?: string | null
          alert_sound_enabled?: boolean | null
          alert_timeout?: number | null
          alert_volume?: number | null
          area?: string | null
          authority_configured_at?: string | null
          authority_mode?:
            | Database["public"]["Enums"]["authority_mode_enum"]
            | null
          billing_parent_bar_id?: string | null
          bronze_threshold?: number
          business_24_hours?: boolean | null
          business_hours_advanced?: Json | null
          business_hours_mode?: string | null
          business_hours_simple?: Json | null
          card_provider?: string | null
          created_at?: string | null
          customer_ordering_enabled?: boolean
          drink_discount_percent?: number | null
          email?: string | null
          feature_analytics_enabled?: boolean
          feature_promos_enabled?: boolean
          food_discount_percent?: number | null
          gold_threshold?: number
          id?: string
          last_cleanup_at?: string | null
          latitude?: number | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          main_bar_crew_id?: string | null
          max_menu_categories_override?: number | null
          max_menu_products_override?: number | null
          max_staff_seats?: number
          menu_enabled?: boolean | null
          menu_plan?: string
          menu_type?: string | null
          mode_last_changed_at?: string | null
          mpesa_business_shortcode?: string | null
          mpesa_consumer_key_encrypted?: string | null
          mpesa_consumer_secret_encrypted?: string | null
          mpesa_enabled?: boolean | null
          mpesa_environment?: string | null
          mpesa_last_test_at?: string | null
          mpesa_passkey_encrypted?: string | null
          mpesa_setup_completed?: boolean | null
          mpesa_test_status?: string | null
          name?: string
          notification_new_orders?: boolean | null
          notification_payments?: boolean | null
          notification_pending_approvals?: boolean | null
          onboarding_completed?: boolean | null
          payment_card_enabled?: boolean | null
          payment_cash_enabled?: boolean | null
          pdf_menu_url?: string | null
          phone?: string | null
          plan_activated_at?: string | null
          plan_expires_at?: string | null
          plan_status?: string
          pos_integration_enabled?: boolean | null
          pos_receipt_credits?: number
          printer_required?: boolean | null
          qr_code_url?: string | null
          show_customer_menu?: boolean
          show_customer_ordering?: boolean
          show_customer_promos?: boolean
          silver_threshold?: number
          slideshow_settings?: Json | null
          slug?: string | null
          static_menu_type?: string | null
          static_menu_url?: string | null
          subscription_tier?: string | null
          table_count?: number | null
          table_setup_enabled?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          venue_mode?: Database["public"]["Enums"]["venue_mode_enum"] | null
          venue_plan?: string
          venue_type?: string
          webhook_url?: string | null
          webhooks_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bars_billing_parent_bar_id_fkey"
            columns: ["billing_parent_bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_billing_parent_bar_id_fkey"
            columns: ["billing_parent_bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "bars_billing_parent_bar_id_fkey"
            columns: ["billing_parent_bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_main_bar_crew_id_fkey"
            columns: ["main_bar_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_main_bar_crew_id_fkey"
            columns: ["main_bar_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "bars_main_bar_crew_id_fkey"
            columns: ["main_bar_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_main_bar_crew_id_fkey"
            columns: ["main_bar_crew_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bars_venue_plan_fk"
            columns: ["venue_plan"]
            isOneToOne: false
            referencedRelation: "venue_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      bars_slug_backup: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          slug: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          image_url: string
          name: string
        }
        Insert: {
          created_at?: string | null
          image_url: string
          name: string
        }
        Update: {
          created_at?: string | null
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      check_in_requests: {
        Row: {
          bar_id: string
          created_at: string
          crew_member_id: string
          id: string
          requested_at: string
          responded_at: string | null
          responded_by: string | null
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          crew_member_id: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          responded_by?: string | null
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          crew_member_id?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          responded_by?: string | null
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_in_requests_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "check_in_requests_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "check_in_requests_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "check_in_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_in_requests_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "v_crew_shift_summary"
            referencedColumns: ["shift_id"]
          },
        ]
      }
      consent_records: {
        Row: {
          app_version: string
          birthday_day: number | null
          birthday_month: number | null
          birthday_year: number | null
          consented_at: string
          decision: string
          id: string
          outbound_promo_opted_in: boolean
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          app_version?: string
          birthday_day?: number | null
          birthday_month?: number | null
          birthday_year?: number | null
          consented_at?: string
          decision: string
          id?: string
          outbound_promo_opted_in?: boolean
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          app_version?: string
          birthday_day?: number | null
          birthday_month?: number | null
          birthday_year?: number | null
          consented_at?: string
          decision?: string
          id?: string
          outbound_promo_opted_in?: boolean
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      crew_availability: {
        Row: {
          availability_type: string
          available_from: string
          available_until: string
          created_at: string
          crew_member_id: string
          day_of_week: number | null
          id: string
          notes: string | null
          specific_date: string | null
        }
        Insert: {
          availability_type?: string
          available_from?: string
          available_until?: string
          created_at?: string
          crew_member_id: string
          day_of_week?: number | null
          id?: string
          notes?: string | null
          specific_date?: string | null
        }
        Update: {
          availability_type?: string
          available_from?: string
          available_until?: string
          created_at?: string
          crew_member_id?: string
          day_of_week?: number | null
          id?: string
          notes?: string | null
          specific_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_availability_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "staff_availability_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_availability_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          address: string | null
          area: string | null
          availability_status: string
          bio: string | null
          created_at: string
          credentials: Json | null
          display_name: string
          face_photo_url: string | null
          face_thumbnail_url: string | null
          half_body_photo_url: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          marketplace_visible: boolean
          onboarding_status: string
          performance_score: number | null
          phone_number: string
          photo_crop_x: number | null
          photo_crop_y: number | null
          photo_focus_mode: string | null
          photo_zoom: number | null
          preferred_roles: string[] | null
          skills: Json | null
          total_approved_orders: number
          total_likes: number
          total_shifts_completed: number
          total_tips_received: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area?: string | null
          availability_status?: string
          bio?: string | null
          created_at?: string
          credentials?: Json | null
          display_name: string
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          half_body_photo_url?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          marketplace_visible?: boolean
          onboarding_status?: string
          performance_score?: number | null
          phone_number: string
          photo_crop_x?: number | null
          photo_crop_y?: number | null
          photo_focus_mode?: string | null
          photo_zoom?: number | null
          preferred_roles?: string[] | null
          skills?: Json | null
          total_approved_orders?: number
          total_likes?: number
          total_shifts_completed?: number
          total_tips_received?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area?: string | null
          availability_status?: string
          bio?: string | null
          created_at?: string
          credentials?: Json | null
          display_name?: string
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          half_body_photo_url?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          marketplace_visible?: boolean
          onboarding_status?: string
          performance_score?: number | null
          phone_number?: string
          photo_crop_x?: number | null
          photo_crop_y?: number | null
          photo_focus_mode?: string | null
          photo_zoom?: number | null
          preferred_roles?: string[] | null
          skills?: Json | null
          total_approved_orders?: number
          total_likes?: number
          total_shifts_completed?: number
          total_tips_received?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crew_notifications: {
        Row: {
          acted_on_at: string | null
          action_url: string | null
          bar_id: string | null
          body: string
          created_at: string
          crew_member_id: string
          expires_at: string | null
          id: string
          notification_type: string
          priority: string
          push_sent_at: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
        }
        Insert: {
          acted_on_at?: string | null
          action_url?: string | null
          bar_id?: string | null
          body: string
          created_at?: string
          crew_member_id: string
          expires_at?: string | null
          id?: string
          notification_type: string
          priority?: string
          push_sent_at?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
        }
        Update: {
          acted_on_at?: string | null
          action_url?: string | null
          bar_id?: string | null
          body?: string
          created_at?: string
          crew_member_id?: string
          expires_at?: string | null
          id?: string
          notification_type?: string
          priority?: string
          push_sent_at?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "staff_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notifications_recipient_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notifications_recipient_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "staff_notifications_recipient_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_notifications_recipient_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_performance_events: {
        Row: {
          bar_id: string
          comment_text: string | null
          created_at: string
          crew_member_id: string
          customer_id: string | null
          event_type: string
          id: string
          points_awarded: number
          tab_id: string | null
          tip_amount: number | null
        }
        Insert: {
          bar_id: string
          comment_text?: string | null
          created_at?: string
          crew_member_id: string
          customer_id?: string | null
          event_type: string
          id?: string
          points_awarded?: number
          tab_id?: string | null
          tip_amount?: number | null
        }
        Update: {
          bar_id?: string
          comment_text?: string | null
          created_at?: string
          crew_member_id?: string
          customer_id?: string | null
          event_type?: string
          id?: string
          points_awarded?: number
          tab_id?: string | null
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_performance_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "staff_performance_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_events_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_events_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "staff_performance_events_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_events_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_performance_events_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "staff_performance_events_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_profile_photos: {
        Row: {
          approved_at: string | null
          crew_member_id: string
          id: string
          is_primary: boolean
          is_public: boolean
          photo_type: string
          thumbnail_url: string | null
          uploaded_at: string
          url: string
        }
        Insert: {
          approved_at?: string | null
          crew_member_id: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          photo_type: string
          thumbnail_url?: string | null
          uploaded_at?: string
          url: string
        }
        Update: {
          approved_at?: string | null
          crew_member_id?: string
          id?: string
          is_primary?: boolean
          is_public?: boolean
          photo_type?: string
          thumbnail_url?: string | null
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_photos_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_photos_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "staff_profile_photos_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_photos_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_tips: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          crew_member_id: string
          customer_id: string
          id: string
          mpesa_phone_number: string
          mpesa_transaction_code: string | null
          status: string
          tab_id: string | null
          tip_method: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          crew_member_id: string
          customer_id: string
          id?: string
          mpesa_phone_number: string
          mpesa_transaction_code?: string | null
          status?: string
          tab_id?: string | null
          tip_method?: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          crew_member_id?: string
          customer_id?: string
          id?: string
          mpesa_phone_number?: string
          mpesa_transaction_code?: string | null
          status?: string
          tab_id?: string | null
          tip_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tips_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tips_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tips_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "staff_tips_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tips_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tips_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "staff_tips_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_products: {
        Row: {
          active: boolean | null
          bar_id: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bar_id?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bar_id?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "custom_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_account_links: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          device_identifier: string
          id: string
          initiated_by: string
          liability_acknowledged: boolean
          linked_customer_id: string
          primary_customer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          device_identifier: string
          id?: string
          initiated_by?: string
          liability_acknowledged?: boolean
          linked_customer_id: string
          primary_customer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          device_identifier?: string
          id?: string
          initiated_by?: string
          liability_acknowledged?: boolean
          linked_customer_id?: string
          primary_customer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_badges_archive: {
        Row: {
          awarded_at: string
          badge_level: string
          badge_rank: number | null
          created_at: string
          customer_id: string
          earned_at_bar_id: string
          id: string
          is_active: boolean
          spend_amount_at_venue: number
          updated_at: string
        }
        Insert: {
          awarded_at?: string
          badge_level: string
          badge_rank?: number | null
          created_at?: string
          customer_id: string
          earned_at_bar_id: string
          id?: string
          is_active?: boolean
          spend_amount_at_venue: number
          updated_at?: string
        }
        Update: {
          awarded_at?: string
          badge_level?: string
          badge_rank?: number | null
          created_at?: string
          customer_id?: string
          earned_at_bar_id?: string
          id?: string
          is_active?: boolean
          spend_amount_at_venue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_badges_earned_at_bar_id_fkey"
            columns: ["earned_at_bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_badges_earned_at_bar_id_fkey"
            columns: ["earned_at_bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "customer_badges_earned_at_bar_id_fkey"
            columns: ["earned_at_bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_crew_ratings: {
        Row: {
          bar_id: string
          comment_text: string | null
          created_at: string
          crew_member_id: string
          customer_id: string
          id: string
          rating_type: string
          tab_id: string | null
        }
        Insert: {
          bar_id: string
          comment_text?: string | null
          created_at?: string
          crew_member_id: string
          customer_id: string
          id?: string
          rating_type: string
          tab_id?: string | null
        }
        Update: {
          bar_id?: string
          comment_text?: string | null
          created_at?: string
          crew_member_id?: string
          customer_id?: string
          id?: string
          rating_type?: string
          tab_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_staff_ratings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "customer_staff_ratings_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          item_category: string | null
          item_name: string
          item_type: string
          last_ordered: string
          order_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          item_category?: string | null
          item_name: string
          item_type: string
          last_ordered?: string
          order_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          item_category?: string | null
          item_name?: string
          item_type?: string
          last_ordered?: string
          order_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favorites_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          action_url: string | null
          bar_id: string | null
          body: string
          created_at: string
          device_id: string | null
          id: string
          notification_type: string
          push_sent_at: string | null
          tab_id: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          bar_id?: string | null
          body: string
          created_at?: string
          device_id?: string | null
          id?: string
          notification_type: string
          push_sent_at?: string | null
          tab_id?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          bar_id?: string | null
          body?: string
          created_at?: string
          device_id?: string | null
          id?: string
          notification_type?: string
          push_sent_at?: string | null
          tab_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "customer_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notifications_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "customer_notifications_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_product_units: {
        Row: {
          anon_customer_id: string
          created_at: string
          id: string
          period: string
          product_id: string
          supplier_id: string | null
          units: number
        }
        Insert: {
          anon_customer_id: string
          created_at?: string
          id?: string
          period: string
          product_id: string
          supplier_id?: string | null
          units?: number
        }
        Update: {
          anon_customer_id?: string
          created_at?: string
          id?: string
          period?: string
          product_id?: string
          supplier_id?: string | null
          units?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_product_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_product_units_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_promo_consent: {
        Row: {
          bar_id: string
          consented_at: string
          customer_id: string | null
          device_id: string
          id: string
          scope: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          bar_id: string
          consented_at?: string
          customer_id?: string | null
          device_id: string
          id?: string
          scope: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          bar_id?: string
          consented_at?: string
          customer_id?: string | null
          device_id?: string
          id?: string
          scope?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_promo_consent_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_promo_consent_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "customer_promo_consent_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_saved_bars: {
        Row: {
          bar_id: string
          customer_id: string
          id: string
          saved_at: string
        }
        Insert: {
          bar_id: string
          customer_id: string
          id?: string
          saved_at?: string
        }
        Update: {
          bar_id?: string
          customer_id?: string
          id?: string
          saved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_saved_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_saved_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "customer_saved_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_saved_bars_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_visit_details: {
        Row: {
          bar_id: string
          bottles_ordered: number
          created_at: string
          customer_id: string
          id: string
          spend_amount: number
          tab_id: string | null
          updated_at: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          bar_id: string
          bottles_ordered?: number
          created_at?: string
          customer_id: string
          id?: string
          spend_amount?: number
          tab_id?: string | null
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Update: {
          bar_id?: string
          bottles_ordered?: number
          created_at?: string
          customer_id?: string
          id?: string
          spend_amount?: number
          tab_id?: string | null
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_visit_details_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visit_details_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "customer_visit_details_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visit_details_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_visit_details_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "customer_visit_details_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_visit_details_backup: {
        Row: {
          bar_id: string | null
          bottles_ordered: number | null
          created_at: string | null
          customer_id: string | null
          id: string | null
          spend_amount: number | null
          tab_id: string | null
          updated_at: string | null
          visit_date: string | null
          visit_type: string | null
        }
        Insert: {
          bar_id?: string | null
          bottles_ordered?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          spend_amount?: number | null
          tab_id?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_type?: string | null
        }
        Update: {
          bar_id?: string | null
          bottles_ordered?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          spend_amount?: number | null
          tab_id?: string | null
          updated_at?: string | null
          visit_date?: string | null
          visit_type?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          current_month_visit_count: number
          first_visit_at: string
          id: string
          last_visit_at: string | null
          loyalty_tier: string
          total_spent: number
          updated_at: string
          user_id: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          current_month_visit_count?: number
          first_visit_at?: string
          id: string
          last_visit_at?: string | null
          loyalty_tier?: string
          total_spent?: number
          updated_at?: string
          user_id: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          current_month_visit_count?: number
          first_visit_at?: string
          id?: string
          last_visit_at?: string | null
          loyalty_tier?: string
          total_spent?: number
          updated_at?: string
          user_id?: string
          visit_count?: number
        }
        Relationships: []
      }
      devices: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          device_id: string
          device_memory: number | null
          fingerprint: string
          hardware_concurrency: number | null
          id: string
          install_count: number
          is_active: boolean | null
          is_suspicious: boolean
          language: string | null
          last_bar_id: string | null
          last_install_at: string | null
          last_seen: string | null
          platform: string | null
          pwa_installed: boolean | null
          screen_resolution: string | null
          suspicious_activity_count: number | null
          timezone: string | null
          total_amount_spent: number | null
          total_tabs_created: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          device_id: string
          device_memory?: number | null
          fingerprint: string
          hardware_concurrency?: number | null
          id?: string
          install_count?: number
          is_active?: boolean | null
          is_suspicious?: boolean
          language?: string | null
          last_bar_id?: string | null
          last_install_at?: string | null
          last_seen?: string | null
          platform?: string | null
          pwa_installed?: boolean | null
          screen_resolution?: string | null
          suspicious_activity_count?: number | null
          timezone?: string | null
          total_amount_spent?: number | null
          total_tabs_created?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          device_id?: string
          device_memory?: number | null
          fingerprint?: string
          hardware_concurrency?: number | null
          id?: string
          install_count?: number
          is_active?: boolean | null
          is_suspicious?: boolean
          language?: string | null
          last_bar_id?: string | null
          last_install_at?: string | null
          last_seen?: string | null
          platform?: string | null
          pwa_installed?: boolean | null
          screen_resolution?: string | null
          suspicious_activity_count?: number | null
          timezone?: string | null
          total_amount_spent?: number | null
          total_tabs_created?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_last_bar_id_fkey"
            columns: ["last_bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_last_bar_id_fkey"
            columns: ["last_bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "devices_last_bar_id_fkey"
            columns: ["last_bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_receipts: {
        Row: {
          bar_id: string
          created_at: string | null
          delivered_at: string | null
          id: string
          paid_at: string | null
          print_job_id: string | null
          receipt_data: Json
          receipt_number: string | null
          status: string
          tab_id: string
          total_amount: number
          viewed_at: string | null
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          paid_at?: string | null
          print_job_id?: string | null
          receipt_data: Json
          receipt_number?: string | null
          status?: string
          tab_id: string
          total_amount: number
          viewed_at?: string | null
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          paid_at?: string | null
          print_job_id?: string | null
          receipt_data?: Json
          receipt_number?: string | null
          status?: string
          tab_id?: string
          total_amount?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "digital_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_receipts_print_job_id_fkey"
            columns: ["print_job_id"]
            isOneToOne: false
            referencedRelation: "print_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_receipts_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "digital_receipts_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_rules: {
        Row: {
          bar_id: string
          created_at: string
          drink_discount_percent: number
          food_discount_percent: number
          id: string
          loyalty_tier: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          drink_discount_percent?: number
          food_discount_percent?: number
          id?: string
          loyalty_tier: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          drink_discount_percent?: number
          food_discount_percent?: number
          id?: string
          loyalty_tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "discount_rules_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_requests: {
        Row: {
          auto_score: number
          created_at: string
          email: string
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          name: string
          notes: string | null
          phone: string | null
          poll_responses: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["early_access_status"]
          updated_at: string
          venue_name: string
        }
        Insert: {
          auto_score?: number
          created_at?: string
          email: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          poll_responses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["early_access_status"]
          updated_at?: string
          venue_name: string
        }
        Update: {
          auto_score?: number
          created_at?: string
          email?: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          poll_responses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["early_access_status"]
          updated_at?: string
          venue_name?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          bar_name: string | null
          created_at: string | null
          email: string
          id: string
          message: string
        }
        Insert: {
          bar_name?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
        }
        Update: {
          bar_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      food_products: {
        Row: {
          active: boolean | null
          bar_id: string | null
          category: string
          created_at: string | null
          custom_product_id: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          product_id: string | null
          sale_price: number
          sku: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bar_id?: string | null
          category: string
          created_at?: string | null
          custom_product_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          product_id?: string | null
          sale_price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bar_id?: string | null
          category?: string
          created_at?: string | null
          custom_product_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          product_id?: string | null
          sale_price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "food_products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_requests: {
        Row: {
          bar_id: string
          crew_member_id: string
          expires_at: string
          id: string
          message: string | null
          pay_amount: number | null
          pay_currency: string
          requested_by: string
          responded_at: string | null
          response_message: string | null
          resulting_shift_id: string | null
          role: string
          sent_at: string
          shift_date: string
          shift_end: string
          shift_start: string
          status: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          crew_member_id: string
          expires_at?: string
          id?: string
          message?: string | null
          pay_amount?: number | null
          pay_currency?: string
          requested_by: string
          responded_at?: string | null
          response_message?: string | null
          resulting_shift_id?: string | null
          role: string
          sent_at?: string
          shift_date: string
          shift_end: string
          shift_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          crew_member_id?: string
          expires_at?: string
          id?: string
          message?: string | null
          pay_amount?: number | null
          pay_currency?: string
          requested_by?: string
          responded_at?: string | null
          response_message?: string | null
          resulting_shift_id?: string | null
          role?: string
          sent_at?: string
          shift_date?: string
          shift_end?: string
          shift_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_requests_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "hire_requests_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_resulting_shift_id_fkey"
            columns: ["resulting_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_resulting_shift_id_fkey"
            columns: ["resulting_shift_id"]
            isOneToOne: false
            referencedRelation: "v_crew_shift_summary"
            referencedColumns: ["shift_id"]
          },
          {
            foreignKeyName: "hire_requests_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "hire_requests_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_analytics: {
        Row: {
          analysis_date: string
          avg_spend_per_visit: number | null
          bar_id: string | null
          bottle_tier: string
          bottles_per_week: number | null
          created_at: string
          customer_id: string
          id: string
          overall_tier: string
          preferred_days: Json | null
          preferred_times: Json | null
          spend_tier: string
          updated_at: string
          visit_tier: string
          visits_per_week: number | null
        }
        Insert: {
          analysis_date?: string
          avg_spend_per_visit?: number | null
          bar_id?: string | null
          bottle_tier: string
          bottles_per_week?: number | null
          created_at?: string
          customer_id: string
          id?: string
          overall_tier: string
          preferred_days?: Json | null
          preferred_times?: Json | null
          spend_tier: string
          updated_at?: string
          visit_tier: string
          visits_per_week?: number | null
        }
        Update: {
          analysis_date?: string
          avg_spend_per_visit?: number | null
          bar_id?: string | null
          bottle_tier?: string
          bottles_per_week?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          overall_tier?: string
          preferred_days?: Json | null
          preferred_times?: Json | null
          spend_tier?: string
          updated_at?: string
          visit_tier?: string
          visits_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_analytics_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_analytics_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "loyalty_analytics_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_analytics_backup: {
        Row: {
          analysis_date: string | null
          avg_spend_per_visit: number | null
          bar_id: string | null
          bottle_tier: string | null
          bottles_per_week: number | null
          created_at: string | null
          customer_id: string | null
          id: string | null
          overall_tier: string | null
          preferred_days: Json | null
          preferred_times: Json | null
          spend_tier: string | null
          updated_at: string | null
          visit_tier: string | null
          visits_per_week: number | null
        }
        Insert: {
          analysis_date?: string | null
          avg_spend_per_visit?: number | null
          bar_id?: string | null
          bottle_tier?: string | null
          bottles_per_week?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          overall_tier?: string | null
          preferred_days?: Json | null
          preferred_times?: Json | null
          spend_tier?: string | null
          updated_at?: string | null
          visit_tier?: string | null
          visits_per_week?: number | null
        }
        Update: {
          analysis_date?: string | null
          avg_spend_per_visit?: number | null
          bar_id?: string | null
          bottle_tier?: string | null
          bottles_per_week?: number | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          overall_tier?: string | null
          preferred_days?: Json | null
          preferred_times?: Json | null
          spend_tier?: string | null
          updated_at?: string | null
          visit_tier?: string | null
          visits_per_week?: number | null
        }
        Relationships: []
      }
      overdue_backfill_log: {
        Row: {
          backfill_date: string | null
          id: number
          notes: string | null
          tabs_updated: number | null
        }
        Insert: {
          backfill_date?: string | null
          id?: number
          notes?: string | null
          tabs_updated?: number | null
        }
        Update: {
          backfill_date?: string | null
          id?: number
          notes?: string | null
          tabs_updated?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          admob_ads_enabled: boolean
          api_version: string
          crew_marketplace_enabled: boolean
          customer_ordering_enabled: boolean
          digest_frequency: string
          early_access_enabled: boolean
          email_alerts_enabled: boolean
          global_products_enabled: boolean
          id: number
          ip_allowlist: string
          loyalty_enabled: boolean
          loyalty_enabled_plans: string[]
          maintenance_mode: boolean
          media_system_enabled: boolean
          meta_ads_enabled: boolean
          mfa_required: boolean
          mpesa_enabled: boolean
          platform_env: string
          pos_printer_enabled: boolean
          promotions_ai_enabled: boolean
          session_timeout_minutes: number
          slack_alerts_enabled: boolean
          updated_at: string
          updated_by: string | null
          webhooks_enabled: boolean
        }
        Insert: {
          admob_ads_enabled?: boolean
          api_version?: string
          crew_marketplace_enabled?: boolean
          customer_ordering_enabled?: boolean
          digest_frequency?: string
          early_access_enabled?: boolean
          email_alerts_enabled?: boolean
          global_products_enabled?: boolean
          id?: number
          ip_allowlist?: string
          loyalty_enabled?: boolean
          loyalty_enabled_plans?: string[]
          maintenance_mode?: boolean
          media_system_enabled?: boolean
          meta_ads_enabled?: boolean
          mfa_required?: boolean
          mpesa_enabled?: boolean
          platform_env?: string
          pos_printer_enabled?: boolean
          promotions_ai_enabled?: boolean
          session_timeout_minutes?: number
          slack_alerts_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          webhooks_enabled?: boolean
        }
        Update: {
          admob_ads_enabled?: boolean
          api_version?: string
          crew_marketplace_enabled?: boolean
          customer_ordering_enabled?: boolean
          digest_frequency?: string
          early_access_enabled?: boolean
          email_alerts_enabled?: boolean
          global_products_enabled?: boolean
          id?: number
          ip_allowlist?: string
          loyalty_enabled?: boolean
          loyalty_enabled_plans?: string[]
          maintenance_mode?: boolean
          media_system_enabled?: boolean
          meta_ads_enabled?: boolean
          mfa_required?: boolean
          mpesa_enabled?: boolean
          platform_env?: string
          pos_printer_enabled?: boolean
          promotions_ai_enabled?: boolean
          session_timeout_minutes?: number
          slack_alerts_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
          webhooks_enabled?: boolean
        }
        Relationships: []
      }
      pos_parse_failures: {
        Row: {
          ai_attempted: boolean | null
          ai_succeeded: boolean | null
          bar_id: string
          created_at: string | null
          error_details: Json | null
          error_message: string
          id: string
          raw_receipt_id: string
          regex_confidence: number | null
          template_version: number | null
        }
        Insert: {
          ai_attempted?: boolean | null
          ai_succeeded?: boolean | null
          bar_id: string
          created_at?: string | null
          error_details?: Json | null
          error_message: string
          id?: string
          raw_receipt_id: string
          regex_confidence?: number | null
          template_version?: number | null
        }
        Update: {
          ai_attempted?: boolean | null
          ai_succeeded?: boolean | null
          bar_id?: string
          created_at?: string | null
          error_details?: Json | null
          error_message?: string
          id?: string
          raw_receipt_id?: string
          regex_confidence?: number | null
          template_version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_parse_failures_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_parse_failures_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "pos_parse_failures_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_parse_failures_raw_receipt_id_fkey"
            columns: ["raw_receipt_id"]
            isOneToOne: false
            referencedRelation: "raw_pos_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_receipt_items: {
        Row: {
          id: string
          item_name: string
          line_number: number
          quantity: number
          receipt_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          id?: string
          item_name: string
          line_number: number
          quantity: number
          receipt_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          id?: string
          item_name?: string
          line_number?: number
          quantity?: number
          receipt_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "pos_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_receipts: {
        Row: {
          bar_id: string
          claimed_at: string | null
          claimed_by_tab_id: string | null
          confidence_score: number
          created_at: string | null
          currency: string
          id: string
          paid_at: string | null
          parsed_at: string | null
          parsing_method: string
          raw_receipt_id: string
          receipt_number: string | null
          status: string | null
          subtotal: number
          tax: number
          template_version: number | null
          total: number
          voided_at: string | null
          voided_by_staff_id: string | null
        }
        Insert: {
          bar_id: string
          claimed_at?: string | null
          claimed_by_tab_id?: string | null
          confidence_score: number
          created_at?: string | null
          currency?: string
          id?: string
          paid_at?: string | null
          parsed_at?: string | null
          parsing_method: string
          raw_receipt_id: string
          receipt_number?: string | null
          status?: string | null
          subtotal: number
          tax: number
          template_version?: number | null
          total: number
          voided_at?: string | null
          voided_by_staff_id?: string | null
        }
        Update: {
          bar_id?: string
          claimed_at?: string | null
          claimed_by_tab_id?: string | null
          confidence_score?: number
          created_at?: string | null
          currency?: string
          id?: string
          paid_at?: string | null
          parsed_at?: string | null
          parsing_method?: string
          raw_receipt_id?: string
          receipt_number?: string | null
          status?: string | null
          subtotal?: number
          tax?: number
          template_version?: number | null
          total?: number
          voided_at?: string | null
          voided_by_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "pos_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_receipts_claimed_by_tab_id_fkey"
            columns: ["claimed_by_tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "pos_receipts_claimed_by_tab_id_fkey"
            columns: ["claimed_by_tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_receipts_raw_receipt_id_fkey"
            columns: ["raw_receipt_id"]
            isOneToOne: false
            referencedRelation: "raw_pos_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          bar_id: string
          created_at: string | null
          document_name: string | null
          driver_id: string
          error_message: string | null
          id: string
          job_id: string | null
          matched_tab_id: string | null
          metadata: Json | null
          parsed_data: Json | null
          printer_name: string | null
          processed_at: string | null
          raw_data: string | null
          received_at: string
          status: string
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          document_name?: string | null
          driver_id: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          matched_tab_id?: string | null
          metadata?: Json | null
          parsed_data?: Json | null
          printer_name?: string | null
          processed_at?: string | null
          raw_data?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          document_name?: string | null
          driver_id?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          matched_tab_id?: string | null
          metadata?: Json | null
          parsed_data?: Json | null
          printer_name?: string | null
          processed_at?: string | null
          raw_data?: string | null
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "print_jobs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_matched_tab_id_fkey"
            columns: ["matched_tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "print_jobs_matched_tab_id_fkey"
            columns: ["matched_tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_drivers: {
        Row: {
          bar_id: string
          created_at: string | null
          driver_id: string
          first_seen: string
          id: string
          last_heartbeat: string
          metadata: Json | null
          status: string
          updated_at: string | null
          version: string
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          driver_id: string
          first_seen?: string
          id?: string
          last_heartbeat?: string
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          version: string
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          driver_id?: string
          first_seen?: string
          id?: string
          last_heartbeat?: string
          metadata?: Json | null
          status?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_drivers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_drivers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "printer_drivers_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          bar_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          rejection_reason: string | null
          status: string
          submitted_by: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bar_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bar_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "products_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_campaign_venues: {
        Row: {
          bar_id: string
          campaign_id: string
          created_at: string
          id: string
          notes: string | null
          offer_rule: Json
          status: string
        }
        Insert: {
          bar_id: string
          campaign_id: string
          created_at?: string
          id?: string
          notes?: string | null
          offer_rule?: Json
          status?: string
        }
        Update: {
          bar_id?: string
          campaign_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          offer_rule?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_campaign_venues_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_campaign_venues_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "promo_campaign_venues_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_campaign_venues_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_campaigns: {
        Row: {
          budget_units: number
          created_at: string
          ends_at: string | null
          id: string
          name: string
          product_id: string
          segment_rule: Json
          starts_at: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          budget_units?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          name: string
          product_id: string
          segment_rule?: Json
          starts_at?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          budget_units?: number
          created_at?: string
          ends_at?: string | null
          id?: string
          name?: string
          product_id?: string
          segment_rule?: Json
          starts_at?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_campaigns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_measurements: {
        Row: {
          baseline_units: number
          campaign_id: string
          cohort_size: number
          computed_at: string
          id: string
          lift_pct: number | null
          metric: string
          promo_units: number
        }
        Insert: {
          baseline_units?: number
          campaign_id: string
          cohort_size?: number
          computed_at?: string
          id?: string
          lift_pct?: number | null
          metric?: string
          promo_units?: number
        }
        Update: {
          baseline_units?: number
          campaign_id?: string
          cohort_size?: number
          computed_at?: string
          id?: string
          lift_pct?: number | null
          metric?: string
          promo_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_measurements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promo_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applies_to: string
          bar_id: string
          category: string | null
          created_at: string
          id: string
          message_template: Json | null
          milestone_kind: string | null
          milestone_value: number | null
          name: string
          outbound_push_enabled: boolean
          redemption_count: number
          spend_segments: string[]
          status: string
          trigger: string
          type: string
          type_config: Json
          updated_at: string
          valid_until: string | null
          visit_threshold: number | null
          visit_tiers: string[]
        }
        Insert: {
          applies_to?: string
          bar_id: string
          category?: string | null
          created_at?: string
          id?: string
          message_template?: Json | null
          milestone_kind?: string | null
          milestone_value?: number | null
          name: string
          outbound_push_enabled?: boolean
          redemption_count?: number
          spend_segments?: string[]
          status?: string
          trigger?: string
          type: string
          type_config?: Json
          updated_at?: string
          valid_until?: string | null
          visit_threshold?: number | null
          visit_tiers?: string[]
        }
        Update: {
          applies_to?: string
          bar_id?: string
          category?: string | null
          created_at?: string
          id?: string
          message_template?: Json | null
          milestone_kind?: string | null
          milestone_value?: number | null
          name?: string
          outbound_push_enabled?: boolean
          redemption_count?: number
          spend_segments?: string[]
          status?: string
          trigger?: string
          type?: string
          type_config?: Json
          updated_at?: string
          valid_until?: string | null
          visit_threshold?: number | null
          visit_tiers?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "promotions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_secret: string
          bar_id: string | null
          created_at: string
          device_id: string | null
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth_secret: string
          bar_id?: string | null
          created_at?: string
          device_id?: string | null
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth_secret?: string
          bar_id?: string | null
          created_at?: string
          device_id?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "push_subscriptions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_pos_receipts: {
        Row: {
          bar_id: string
          created_at: string | null
          device_id: string
          escpos_bytes: string | null
          id: string
          metadata: Json | null
          text: string
          timestamp: string
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          device_id: string
          escpos_bytes?: string | null
          id?: string
          metadata?: Json | null
          text: string
          timestamp: string
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          device_id?: string
          escpos_bytes?: string | null
          id?: string
          metadata?: Json | null
          text?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_pos_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_pos_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "raw_pos_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_parsing_templates: {
        Row: {
          accuracy: number | null
          activated_at: string | null
          active: boolean | null
          bar_id: string
          confidence_threshold: number
          created_at: string | null
          id: string
          known_edge_cases: Json | null
          patterns: Json
          receipt_samples_used: number | null
          semantic_map: Json
          version: number
        }
        Insert: {
          accuracy?: number | null
          activated_at?: string | null
          active?: boolean | null
          bar_id: string
          confidence_threshold?: number
          created_at?: string | null
          id?: string
          known_edge_cases?: Json | null
          patterns: Json
          receipt_samples_used?: number | null
          semantic_map: Json
          version: number
        }
        Update: {
          accuracy?: number | null
          activated_at?: string | null
          active?: boolean | null
          bar_id?: string
          confidence_threshold?: number
          created_at?: string | null
          id?: string
          known_edge_cases?: Json | null
          patterns?: Json
          receipt_samples_used?: number | null
          semantic_map?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipt_parsing_templates_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_parsing_templates_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "receipt_parsing_templates_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          actor_id: string
          bar_id: string
          created_at: string
          id: string
          new_state: Json | null
          previous_state: Json | null
          target_role_name: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          bar_id: string
          created_at?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          target_role_name?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          bar_id?: string
          created_at?: string
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          target_role_name?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_log_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_audit_log_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "role_audit_log_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_promo_sends: {
        Row: {
          audience: string
          bar_id: string
          created_at: string
          error_message: string | null
          id: string
          promotion_id: string
          send_at: string
          sent_count: number
          status: string
          updated_at: string
        }
        Insert: {
          audience?: string
          bar_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          promotion_id: string
          send_at: string
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          bar_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          promotion_id?: string
          send_at?: string
          sent_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_promo_sends_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_promo_sends_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "scheduled_promo_sends_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_promo_sends_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_applications: {
        Row: {
          applied_at: string
          crew_member_id: string
          id: string
          posting_id: string
          responded_at: string | null
          resulting_shift_id: string | null
          status: string
        }
        Insert: {
          applied_at?: string
          crew_member_id: string
          id?: string
          posting_id: string
          responded_at?: string | null
          resulting_shift_id?: string | null
          status?: string
        }
        Update: {
          applied_at?: string
          crew_member_id?: string
          id?: string
          posting_id?: string
          responded_at?: string | null
          resulting_shift_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_applications_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "shift_applications_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "shift_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_posting_id_fkey"
            columns: ["posting_id"]
            isOneToOne: false
            referencedRelation: "v_expanded_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_resulting_shift_id_fkey"
            columns: ["resulting_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_applications_resulting_shift_id_fkey"
            columns: ["resulting_shift_id"]
            isOneToOne: false
            referencedRelation: "v_crew_shift_summary"
            referencedColumns: ["shift_id"]
          },
        ]
      }
      shift_postings: {
        Row: {
          bar_id: string
          created_at: string
          created_by: string
          description: string | null
          expires_at: string
          id: string
          latitude: number | null
          longitude: number | null
          pay_per_shift: number | null
          preferred_performance_tier: string | null
          repeat_days: string[] | null
          repeat_interval: string | null
          repeat_until: string | null
          role: string
          shift_date: string
          shift_end: string
          shift_start: string
          slots_available: number
          status: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          pay_per_shift?: number | null
          preferred_performance_tier?: string | null
          repeat_days?: string[] | null
          repeat_interval?: string | null
          repeat_until?: string | null
          role: string
          shift_date: string
          shift_end: string
          shift_start: string
          slots_available?: number
          status?: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          pay_per_shift?: number | null
          preferred_performance_tier?: string | null
          repeat_days?: string[] | null
          repeat_interval?: string | null
          repeat_until?: string | null
          role?: string
          shift_date?: string
          shift_end?: string
          shift_start?: string
          slots_available?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_postings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_postings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "shift_postings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_postings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_bars"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          bar_id: string
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          created_by: string | null
          crew_member_id: string
          ending_soon_notified_at: string | null
          id: string
          notes: string | null
          pay_amount: number | null
          role: string
          shift_end: string | null
          shift_start: string
          status: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          created_by?: string | null
          crew_member_id: string
          ending_soon_notified_at?: string | null
          id?: string
          notes?: string | null
          pay_amount?: number | null
          role: string
          shift_end?: string | null
          shift_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          created_by?: string | null
          crew_member_id?: string
          ending_soon_notified_at?: string | null
          id?: string
          notes?: string | null
          pay_amount?: number | null
          role?: string
          shift_end?: string | null
          shift_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "shifts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      slideshow_images: {
        Row: {
          active: boolean | null
          bar_id: string | null
          created_at: string | null
          display_order: number
          id: string
          image_url: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bar_id?: string | null
          created_at?: string | null
          display_order: number
          id?: string
          image_url: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bar_id?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          image_url?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slideshow_images_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slideshow_images_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "slideshow_images_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_role_permissions: {
        Row: {
          bar_id: string
          id: string
          permission: string
          role_name: string
          section: string
        }
        Insert: {
          bar_id: string
          id?: string
          permission: string
          role_name: string
          section: string
        }
        Update: {
          bar_id?: string
          id?: string
          permission?: string
          role_name?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_permissions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_permissions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "staff_role_permissions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tab_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          crew_member_id: string
          handoff_reason: string | null
          id: string
          is_current: boolean
          tab_id: string
          unassigned_at: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          crew_member_id: string
          handoff_reason?: string | null
          id?: string
          is_current?: boolean
          tab_id: string
          unassigned_at?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          crew_member_id?: string
          handoff_reason?: string | null
          id?: string
          is_current?: boolean
          tab_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_assignments_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_assignments_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "tab_assignments_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_assignments_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_assignments_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "tab_assignments_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_orders: {
        Row: {
          approved_by_customer_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by_crew_id: string | null
          id: string
          initiated_by: string | null
          items: Json
          order_number: number | null
          rejection_reason:
            | Database["public"]["Enums"]["rejection_reason"]
            | null
          settled_at: string | null
          status: string | null
          tab_id: string
          total: number
          updated_at: string | null
        }
        Insert: {
          approved_by_customer_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by_crew_id?: string | null
          id?: string
          initiated_by?: string | null
          items: Json
          order_number?: number | null
          rejection_reason?:
            | Database["public"]["Enums"]["rejection_reason"]
            | null
          settled_at?: string | null
          status?: string | null
          tab_id: string
          total: number
          updated_at?: string | null
        }
        Update: {
          approved_by_customer_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by_crew_id?: string | null
          id?: string
          initiated_by?: string | null
          items?: Json
          order_number?: number | null
          rejection_reason?:
            | Database["public"]["Enums"]["rejection_reason"]
            | null
          settled_at?: string | null
          status?: string | null
          tab_id?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_orders_created_by_staff_id_fkey"
            columns: ["created_by_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_orders_created_by_staff_id_fkey"
            columns: ["created_by_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "tab_orders_created_by_staff_id_fkey"
            columns: ["created_by_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_orders_created_by_staff_id_fkey"
            columns: ["created_by_crew_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_orders_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "tab_orders_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_payments: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          method: string
          mpesa_receipt: string | null
          reference: string | null
          status: string | null
          tab_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          method: string
          mpesa_receipt?: string | null
          reference?: string | null
          status?: string | null
          tab_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          method?: string
          mpesa_receipt?: string | null
          reference?: string | null
          status?: string | null
          tab_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_payments_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "tab_payments_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_pos_receipts: {
        Row: {
          linked_at: string | null
          pos_receipt_id: string
          tab_id: string
        }
        Insert: {
          linked_at?: string | null
          pos_receipt_id: string
          tab_id: string
        }
        Update: {
          linked_at?: string | null
          pos_receipt_id?: string
          tab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tab_pos_receipts_pos_receipt_id_fkey"
            columns: ["pos_receipt_id"]
            isOneToOne: false
            referencedRelation: "pos_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tab_pos_receipts_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "tab_pos_receipts_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_telegram_messages: {
        Row: {
          created_at: string | null
          customer_notified: boolean | null
          customer_notified_at: string | null
          id: string
          initiated_by: string | null
          message: string
          message_metadata: Json | null
          order_type: string | null
          staff_acknowledged_at: string | null
          status: string | null
          tab_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_notified?: boolean | null
          customer_notified_at?: string | null
          id?: string
          initiated_by?: string | null
          message: string
          message_metadata?: Json | null
          order_type?: string | null
          staff_acknowledged_at?: string | null
          status?: string | null
          tab_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_notified?: boolean | null
          customer_notified_at?: string | null
          id?: string
          initiated_by?: string | null
          message?: string
          message_metadata?: Json | null
          order_type?: string | null
          staff_acknowledged_at?: string | null
          status?: string | null
          tab_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_telegram_messages_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "tab_telegram_messages_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      tabeza_admins: {
        Row: {
          created_at: string
          created_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tabs: {
        Row: {
          assigned_crew_member_id: string | null
          bar_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          current_crew_id: string | null
          customer_id: string
          customer_name: string | null
          device_identifier: string | null
          display_name: string | null
          handoff_count: number
          id: string
          is_loyalty_member: boolean | null
          moved_to_overdue_at: string | null
          notes: string | null
          opened_at: string | null
          original_crew_id: string | null
          overdue_reason: string | null
          owner_identifier: string | null
          sound_enabled: boolean | null
          status: string | null
          tab_number: number
          updated_at: string | null
          vibration_enabled: boolean | null
        }
        Insert: {
          assigned_crew_member_id?: string | null
          bar_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          current_crew_id?: string | null
          customer_id: string
          customer_name?: string | null
          device_identifier?: string | null
          display_name?: string | null
          handoff_count?: number
          id?: string
          is_loyalty_member?: boolean | null
          moved_to_overdue_at?: string | null
          notes?: string | null
          opened_at?: string | null
          original_crew_id?: string | null
          overdue_reason?: string | null
          owner_identifier?: string | null
          sound_enabled?: boolean | null
          status?: string | null
          tab_number: number
          updated_at?: string | null
          vibration_enabled?: boolean | null
        }
        Update: {
          assigned_crew_member_id?: string | null
          bar_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          current_crew_id?: string | null
          customer_id?: string
          customer_name?: string | null
          device_identifier?: string | null
          display_name?: string | null
          handoff_count?: number
          id?: string
          is_loyalty_member?: boolean | null
          moved_to_overdue_at?: string | null
          notes?: string | null
          opened_at?: string | null
          original_crew_id?: string | null
          overdue_reason?: string | null
          owner_identifier?: string | null
          sound_enabled?: boolean | null
          status?: string | null
          tab_number?: number
          updated_at?: string | null
          vibration_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tabs_assigned_crew_member_id_fkey"
            columns: ["assigned_crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_assigned_crew_member_id_fkey"
            columns: ["assigned_crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "tabs_assigned_crew_member_id_fkey"
            columns: ["assigned_crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_assigned_crew_member_id_fkey"
            columns: ["assigned_crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "tabs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_current_staff_id_fkey"
            columns: ["current_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_current_staff_id_fkey"
            columns: ["current_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "tabs_current_staff_id_fkey"
            columns: ["current_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_current_staff_id_fkey"
            columns: ["current_crew_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_original_staff_id_fkey"
            columns: ["original_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_original_staff_id_fkey"
            columns: ["original_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "tabs_original_staff_id_fkey"
            columns: ["original_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_original_staff_id_fkey"
            columns: ["original_crew_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      template_learning_events: {
        Row: {
          ai_output: Json
          bar_id: string
          created_at: string | null
          id: string
          new_pattern_detected: string | null
          promoted_to_template: boolean | null
          raw_receipt_id: string
        }
        Insert: {
          ai_output: Json
          bar_id: string
          created_at?: string | null
          id?: string
          new_pattern_detected?: string | null
          promoted_to_template?: boolean | null
          raw_receipt_id: string
        }
        Update: {
          ai_output?: Json
          bar_id?: string
          created_at?: string | null
          id?: string
          new_pattern_detected?: string | null
          promoted_to_template?: boolean | null
          raw_receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_learning_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_learning_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "template_learning_events_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_learning_events_raw_receipt_id_fkey"
            columns: ["raw_receipt_id"]
            isOneToOne: false
            referencedRelation: "raw_pos_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      unmatched_receipts: {
        Row: {
          assigned_at: string | null
          assigned_to_tab_id: string | null
          bar_id: string
          created_at: string
          expires_at: string
          id: string
          receipt_data: Json
          status: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to_tab_id?: string | null
          bar_id: string
          created_at?: string
          expires_at?: string
          id?: string
          receipt_data: Json
          status?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to_tab_id?: string | null
          bar_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          receipt_data?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "unmatched_receipts_assigned_to_tab_id_fkey"
            columns: ["assigned_to_tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "unmatched_receipts_assigned_to_tab_id_fkey"
            columns: ["assigned_to_tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmatched_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmatched_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "unmatched_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bar_permissions: {
        Row: {
          bar_id: string
          created_at: string | null
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bar_permissions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bar_permissions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "user_bar_permissions_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bar_preferences: {
        Row: {
          bar_id: string
          created_at: string | null
          id: string
          share_name: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          id?: string
          share_name?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          id?: string
          share_name?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bar_preferences_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bar_preferences_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "user_bar_preferences_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bars: {
        Row: {
          bar_id: string
          created_at: string | null
          display_name: string | null
          early_access: boolean | null
          id: string
          invited_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          bar_id: string
          created_at?: string | null
          display_name?: string | null
          early_access?: boolean | null
          id?: string
          invited_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          bar_id?: string
          created_at?: string | null
          display_name?: string | null
          early_access?: boolean | null
          id?: string
          invited_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "user_bars_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      venue_badge_discounts_archive: {
        Row: {
          badge_level: string
          bar_id: string
          base_discount_percentage: number
          created_at: string
          id: string
          updated_at: string
          visit_bonus_percentage: number
        }
        Insert: {
          badge_level: string
          bar_id: string
          base_discount_percentage: number
          created_at?: string
          id?: string
          updated_at?: string
          visit_bonus_percentage?: number
        }
        Update: {
          badge_level?: string
          bar_id?: string
          base_discount_percentage?: number
          created_at?: string
          id?: string
          updated_at?: string
          visit_bonus_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "venue_badge_discounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_badge_discounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "venue_badge_discounts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_customer_refs: {
        Row: {
          bar_id: string
          created_at: string
          device_identifier: string
          id: string
          notes: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          bar_id: string
          created_at?: string
          device_identifier: string
          id?: string
          notes?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          bar_id?: string
          created_at?: string
          device_identifier?: string
          id?: string
          notes?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_customer_refs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_customer_refs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "venue_customer_refs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_discount_settings_archive: {
        Row: {
          bar_id: string
          spend_tiers: Json
          updated_at: string
          visit_bonuses: Json
        }
        Insert: {
          bar_id: string
          spend_tiers?: Json
          updated_at?: string
          visit_bonuses?: Json
        }
        Update: {
          bar_id?: string
          spend_tiers?: Json
          updated_at?: string
          visit_bonuses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "venue_discount_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_discount_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "venue_discount_settings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: true
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_notifications: {
        Row: {
          action_url: string | null
          bar_id: string
          body: string
          created_at: string
          expires_at: string | null
          id: string
          notification_type: string
          priority: string
          push_sent_at: string | null
          read_at: string | null
          recipient_crew_id: string | null
          recipient_role: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          bar_id: string
          body: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notification_type: string
          priority?: string
          push_sent_at?: string | null
          read_at?: string | null
          recipient_crew_id?: string | null
          recipient_role?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          bar_id?: string
          body?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notification_type?: string
          priority?: string
          push_sent_at?: string | null
          read_at?: string | null
          recipient_crew_id?: string | null
          recipient_role?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "venue_notifications_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_notifications_recipient_crew_id_fkey"
            columns: ["recipient_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_notifications_recipient_crew_id_fkey"
            columns: ["recipient_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "venue_notifications_recipient_crew_id_fkey"
            columns: ["recipient_crew_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_notifications_recipient_crew_id_fkey"
            columns: ["recipient_crew_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_plans: {
        Row: {
          crew_marketplace_enabled: boolean
          cta_label: string
          customer_ordering_enabled: boolean
          display_name: string
          feature_bullets: string[]
          id: string
          is_active: boolean
          loyalty_enabled: boolean
          max_menu_categories: number | null
          max_menu_products: number | null
          max_staff_seats: number
          media_system_enabled: boolean
          menu_enabled: boolean
          monthly_price_kes: number
          pos_integration_enabled: boolean
          pricing_label: string
          promotions_ai_enabled: boolean
          sort_order: number
          tag_line: string
          updated_at: string
          updated_by: string | null
          webhooks_enabled: boolean
        }
        Insert: {
          crew_marketplace_enabled?: boolean
          cta_label?: string
          customer_ordering_enabled?: boolean
          display_name: string
          feature_bullets?: string[]
          id: string
          is_active?: boolean
          loyalty_enabled?: boolean
          max_menu_categories?: number | null
          max_menu_products?: number | null
          max_staff_seats?: number
          media_system_enabled?: boolean
          menu_enabled?: boolean
          monthly_price_kes?: number
          pos_integration_enabled?: boolean
          pricing_label?: string
          promotions_ai_enabled?: boolean
          sort_order?: number
          tag_line?: string
          updated_at?: string
          updated_by?: string | null
          webhooks_enabled?: boolean
        }
        Update: {
          crew_marketplace_enabled?: boolean
          cta_label?: string
          customer_ordering_enabled?: boolean
          display_name?: string
          feature_bullets?: string[]
          id?: string
          is_active?: boolean
          loyalty_enabled?: boolean
          max_menu_categories?: number | null
          max_menu_products?: number | null
          max_staff_seats?: number
          media_system_enabled?: boolean
          menu_enabled?: boolean
          monthly_price_kes?: number
          pos_integration_enabled?: boolean
          pricing_label?: string
          promotions_ai_enabled?: boolean
          sort_order?: number
          tag_line?: string
          updated_at?: string
          updated_by?: string | null
          webhooks_enabled?: boolean
        }
        Relationships: []
      }
      venue_visit_tracking: {
        Row: {
          bar_id: string
          bottles_ordered: number
          created_at: string
          customer_id: string | null
          device_identifier: string
          first_visit_date: string | null
          id: string
          last_visit_date: string | null
          total_spend: number
          updated_at: string
          visit_count: number
          week_start: string
        }
        Insert: {
          bar_id: string
          bottles_ordered?: number
          created_at?: string
          customer_id?: string | null
          device_identifier: string
          first_visit_date?: string | null
          id?: string
          last_visit_date?: string | null
          total_spend?: number
          updated_at?: string
          visit_count?: number
          week_start: string
        }
        Update: {
          bar_id?: string
          bottles_ordered?: number
          created_at?: string
          customer_id?: string | null
          device_identifier?: string
          first_visit_date?: string | null
          id?: string
          last_visit_date?: string | null
          total_spend?: number
          updated_at?: string
          visit_count?: number
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_visit_tracking_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_visit_tracking_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "venue_visit_tracking_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_visit_tracking_legacy: {
        Row: {
          badge_multiplier: number | null
          bar_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string | null
          updated_at: string | null
          visit_count: number | null
          week_start_date: string | null
        }
        Insert: {
          badge_multiplier?: number | null
          bar_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          updated_at?: string | null
          visit_count?: number | null
          week_start_date?: string | null
        }
        Update: {
          badge_multiplier?: number | null
          bar_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          updated_at?: string | null
          visit_count?: number | null
          week_start_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      print_job_stats: {
        Row: {
          avg_processing_seconds: number | null
          bar_id: string | null
          error_jobs: number | null
          last_job_at: string | null
          processed_jobs: number | null
          total_jobs: number | null
          unmatched_jobs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "print_jobs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      tab_balances: {
        Row: {
          balance: number | null
          bar_id: string | null
          status: string | null
          tab_id: string | null
          tab_number: number | null
          total_orders: number | null
          total_payments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tabs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "tabs_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_messages_with_tabs: {
        Row: {
          bar_id: string | null
          bar_name: string | null
          created_at: string | null
          customer_notified: boolean | null
          customer_notified_at: string | null
          id: string | null
          initiated_by: string | null
          message: string | null
          message_metadata: Json | null
          notes: string | null
          order_type: string | null
          staff_acknowledged_at: string | null
          status: string | null
          tab_id: string | null
          tab_number: number | null
          tab_status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tab_telegram_messages_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tab_balances"
            referencedColumns: ["tab_id"]
          },
          {
            foreignKeyName: "tab_telegram_messages_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "tabs"
            referencedColumns: ["id"]
          },
        ]
      }
      unmatched_receipt_stats: {
        Row: {
          assigned_count: number | null
          avg_assignment_seconds: number | null
          bar_id: string | null
          expired_count: number | null
          last_receipt_at: string | null
          pending_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unmatched_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmatched_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "unmatched_receipts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_crew_effective_availability: {
        Row: {
          availability_type: string | null
          available_from: string | null
          available_until: string | null
          crew_member_id: string | null
          day_of_week: number | null
          display_name: string | null
          location: string | null
          notes: string | null
          preferred_roles: string[] | null
          specific_date: string | null
        }
        Relationships: []
      }
      v_crew_public_profile: {
        Row: {
          availability_status: string | null
          badge_tier: string | null
          bio: string | null
          credentials: Json | null
          display_name: string | null
          face_photo_url: string | null
          face_thumbnail_url: string | null
          id: string | null
          location: string | null
          marketplace_visible: boolean | null
          performance_score: number | null
          phone_number: string | null
          preferred_roles: string[] | null
          skills: Json | null
          total_approved_orders: number | null
          total_likes: number | null
          total_shifts_completed: number | null
          total_tips_received: number | null
          user_id: string | null
        }
        Insert: {
          availability_status?: string | null
          badge_tier?: never
          bio?: string | null
          credentials?: Json | null
          display_name?: string | null
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          id?: string | null
          location?: string | null
          marketplace_visible?: boolean | null
          performance_score?: number | null
          phone_number?: string | null
          preferred_roles?: string[] | null
          skills?: Json | null
          total_approved_orders?: number | null
          total_likes?: number | null
          total_shifts_completed?: number | null
          total_tips_received?: number | null
          user_id?: string | null
        }
        Update: {
          availability_status?: string | null
          badge_tier?: never
          bio?: string | null
          credentials?: Json | null
          display_name?: string | null
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          id?: string | null
          location?: string | null
          marketplace_visible?: boolean | null
          performance_score?: number | null
          phone_number?: string | null
          preferred_roles?: string[] | null
          skills?: Json | null
          total_approved_orders?: number | null
          total_likes?: number | null
          total_shifts_completed?: number | null
          total_tips_received?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_crew_shift_summary: {
        Row: {
          bar_id: string | null
          bar_name: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          crew_member_id: string | null
          crew_name: string | null
          notes: string | null
          role: string | null
          shift_end: string | null
          shift_id: string | null
          shift_start: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "shifts_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_effective_availability"
            referencedColumns: ["crew_member_id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_crew_public_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_staff_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "v_staff_public_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      v_expanded_postings: {
        Row: {
          bar_id: string | null
          created_at: string | null
          description: string | null
          effective_date: string | null
          expires_at: string | null
          id: string | null
          pay_per_shift: number | null
          preferred_performance_tier: string | null
          role: string | null
          shift_end: string | null
          shift_start: string | null
          slots_available: number | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_postings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_postings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "telegram_messages_with_tabs"
            referencedColumns: ["bar_id"]
          },
          {
            foreignKeyName: "shift_postings_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "venue_authority_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_staff_public_profile: {
        Row: {
          availability_status: string | null
          badge_tier: string | null
          bio: string | null
          credentials: Json | null
          display_name: string | null
          face_photo_url: string | null
          face_thumbnail_url: string | null
          id: string | null
          location: string | null
          marketplace_visible: boolean | null
          performance_score: number | null
          phone_number: string | null
          preferred_roles: string[] | null
          skills: Json | null
          total_approved_orders: number | null
          total_likes: number | null
          total_shifts_completed: number | null
          total_tips_received: number | null
          user_id: string | null
        }
        Insert: {
          availability_status?: string | null
          badge_tier?: never
          bio?: string | null
          credentials?: Json | null
          display_name?: string | null
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          id?: string | null
          location?: string | null
          marketplace_visible?: boolean | null
          performance_score?: number | null
          phone_number?: string | null
          preferred_roles?: string[] | null
          skills?: Json | null
          total_approved_orders?: number | null
          total_likes?: number | null
          total_shifts_completed?: number | null
          total_tips_received?: number | null
          user_id?: string | null
        }
        Update: {
          availability_status?: string | null
          badge_tier?: never
          bio?: string | null
          credentials?: Json | null
          display_name?: string | null
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          id?: string | null
          location?: string | null
          marketplace_visible?: boolean | null
          performance_score?: number | null
          phone_number?: string | null
          preferred_roles?: string[] | null
          skills?: Json | null
          total_approved_orders?: number | null
          total_likes?: number | null
          total_shifts_completed?: number | null
          total_tips_received?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      venue_authority_summary: {
        Row: {
          authority_configured_at: string | null
          authority_mode:
            | Database["public"]["Enums"]["authority_mode_enum"]
            | null
          configuration_description: string | null
          id: string | null
          mode_last_changed_at: string | null
          name: string | null
          onboarding_completed: boolean | null
          pos_integration_enabled: boolean | null
          printer_required: boolean | null
          slug: string | null
          venue_mode: Database["public"]["Enums"]["venue_mode_enum"] | null
          workflow_description: string | null
        }
        Insert: {
          authority_configured_at?: string | null
          authority_mode?:
            | Database["public"]["Enums"]["authority_mode_enum"]
            | null
          configuration_description?: never
          id?: string | null
          mode_last_changed_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          pos_integration_enabled?: boolean | null
          printer_required?: boolean | null
          slug?: string | null
          venue_mode?: Database["public"]["Enums"]["venue_mode_enum"] | null
          workflow_description?: never
        }
        Update: {
          authority_configured_at?: string | null
          authority_mode?:
            | Database["public"]["Enums"]["authority_mode_enum"]
            | null
          configuration_description?: never
          id?: string | null
          mode_last_changed_at?: string | null
          name?: string | null
          onboarding_completed?: boolean | null
          pos_integration_enabled?: boolean | null
          printer_required?: boolean | null
          slug?: string | null
          venue_mode?: Database["public"]["Enums"]["venue_mode_enum"] | null
          workflow_description?: never
        }
        Relationships: []
      }
    }
    Functions: {
      acknowledge_telegram_message: {
        Args: { p_message_id: string; p_staff_id?: string }
        Returns: boolean
      }
      auto_close_tabs_outside_business_hours: {
        Args: never
        Returns: {
          pending_orders_cancelled: number
          tabs_closed: number
          tabs_moved_to_overdue: number
        }[]
      }
      calculate_business_day_end: {
        Args: { p_bar_id: string; p_date: string }
        Returns: string
      }
      calculate_business_day_end_fixed: {
        Args: { p_bar_id: string; p_date: string }
        Returns: string
      }
      calculate_business_day_end_simple: {
        Args: { p_bar_id: string; p_date: string }
        Returns: string
      }
      calculate_venue_loyalty_tier: {
        Args: {
          p_bar_id: string
          p_customer_id: string
          p_lookback_days?: number
        }
        Returns: {
          analysis_period_days: number
          avg_spend_per_visit: number
          bar_id: string
          bottle_tier: string
          bottles_per_week: number
          customer_id: string
          overall_tier: string
          preferred_days: Json
          preferred_times: Json
          spend_tier: string
          total_bottles: number
          total_spend: number
          total_visits: number
          visit_tier: string
          visits_per_week: number
        }[]
      }
      can_tab_accept_orders: { Args: { p_tab_id: string }; Returns: Json }
      check_and_run_cleanup_if_needed: {
        Args: { p_bar_id: string }
        Returns: {
          closed_zero_balance: number
          closed_zero_with_pending: number
          deleted_pos_alerts: number
          moved_to_overdue: number
          ran_cleanup: boolean
        }[]
      }
      check_existing_open_tab: {
        Args: { p_bar_id: string; p_device_id: string }
        Returns: Json
      }
      check_suspicious_tab_activity: {
        Args: { p_bar_id: string; p_device_id: string; p_fingerprint?: string }
        Returns: Json
      }
      cleanup_inactive_devices: { Args: never; Returns: undefined }
      cleanup_past_scheduled_shifts: { Args: never; Returns: Json }
      cleanup_zero_balance_overdue_tabs: {
        Args: never
        Returns: {
          balance: number
          new_status: string
          old_status: string
          reason: string
          tab_id: string
          tab_number: number
        }[]
      }
      close_tab: {
        Args: {
          p_closed_by?: string
          p_tab_id: string
          p_write_off_amount?: number
        }
        Returns: undefined
      }
      complete_mpesa_payment: {
        Args: {
          p_mpesa_receipt_number: string
          p_transaction_date?: string
          p_transaction_id: string
        }
        Returns: string
      }
      complete_telegram_message: {
        Args: { p_message_id: string; p_staff_id?: string }
        Returns: boolean
      }
      count_recent_parse_failures: {
        Args: { p_bar_id: string; p_days?: number }
        Returns: number
      }
      create_bar_with_owner: {
        Args: {
          bar_email: string
          bar_location: string
          bar_name: string
          bar_phone: string
        }
        Returns: string
      }
      create_loyalty_analytics: {
        Args: { p_customer_id: string }
        Returns: undefined
      }
      create_tab_if_not_exists: {
        Args: {
          p_bar_id: string
          p_customer_id: string
          p_device_id: string
          p_display_name?: string
          p_notes?: Json
        }
        Returns: {
          existing: boolean
          message: string
          success: boolean
          tab: Database["public"]["Tables"]["tabs"]["Row"]
        }[]
      }
      create_telegram_message: {
        Args: {
          p_initiated_by?: string
          p_message: string
          p_metadata?: Json
          p_tab_id: string
        }
        Returns: string
      }
      detect_suspicious_devices: {
        Args: never
        Returns: {
          device_id: string
          reason: string
          score: number
        }[]
      }
      expire_old_receipts: { Args: never; Returns: undefined }
      expire_stale_shift_postings: { Args: never; Returns: number }
      fail_mpesa_payment: {
        Args: {
          p_failure_reason: string
          p_result_code?: number
          p_transaction_id: string
        }
        Returns: undefined
      }
      flag_suspicious_device: {
        Args: { device_id_param: string; reason?: string }
        Returns: undefined
      }
      generate_unique_slug: {
        Args: { p_existing_id?: string; p_name: string }
        Returns: string
      }
      get_active_template: {
        Args: { p_bar_id: string }
        Returns: {
          accuracy: number | null
          activated_at: string | null
          active: boolean | null
          bar_id: string
          confidence_threshold: number
          created_at: string | null
          id: string
          known_edge_cases: Json | null
          patterns: Json
          receipt_samples_used: number | null
          semantic_map: Json
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "receipt_parsing_templates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_bar_close_time_today: { Args: { p_bar_id: string }; Returns: string }
      get_checkout_blocking_tabs: {
        Args: { p_crew_id: string }
        Returns: {
          current_balance: number
          id: string
          tab_number: string
        }[]
      }
      get_crew_badge_tier: { Args: { p_crew_id: string }; Returns: string }
      get_crew_member_id: { Args: never; Returns: string }
      get_customer_venue_tier: {
        Args: { p_bar_id: string; p_customer_id: string }
        Returns: {
          analysis_date: string
          bottle_tier: string
          overall_tier: string
          spend_tier: string
          total_spend: number
          total_visits: number
          visit_tier: string
        }[]
      }
      get_device_activity_summary: {
        Args: { device_id_param: string }
        Returns: {
          avg_tab_amount: number
          bars_visited: number
          days_active: number
          device_id: string
          first_visit: string
          is_active: boolean
          is_suspicious: boolean
          last_visit: string
          total_spent: number
          total_tabs: number
        }[]
      }
      get_device_stats: {
        Args: { device_id_param: string }
        Returns: {
          bars_visited: number
          first_seen: string
          last_seen: string
          total_spent: number
          total_tabs: number
        }[]
      }
      get_next_order_number: { Args: { p_tab_id: string }; Returns: number }
      get_posting_dates: {
        Args: {
          p_repeat_days: string[]
          p_repeat_until: string
          p_shift_date: string
        }
        Returns: string[]
      }
      get_staff_badge_tier: { Args: { p_staff_id: string }; Returns: string }
      get_staff_member_id: { Args: never; Returns: string }
      get_tab_balance: { Args: { p_tab_id: string }; Returns: number }
      get_tab_summary: { Args: { p_tab_id: string }; Returns: Json }
      get_template_history: {
        Args: { p_bar_id: string }
        Returns: {
          accuracy: number
          activated_at: string
          created_at: string
          is_active: boolean
          samples_used: number
          version: number
        }[]
      }
      get_user_bar_ids: { Args: never; Returns: string[] }
      has_active_shift: {
        Args: { p_bar_id: string; p_crew_id: string }
        Returns: boolean
      }
      haversine_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      increment_device_installs: {
        Args: { device_id_param: string }
        Returns: undefined
      }
      is_bar_admin: { Args: { p_bar_id: string }; Returns: boolean }
      is_bar_closed_now: { Args: { p_bar_id: string }; Returns: boolean }
      is_within_business_hours: {
        Args: { business_hours: Json }
        Returns: boolean
      }
      is_within_business_hours_at_time: {
        Args: { p_bar_id: string; p_check_time: string }
        Returns: boolean
      }
      is_within_business_hours_correct: {
        Args: { bar_uuid: string; check_time: string }
        Returns: boolean
      }
      is_within_business_hours_for_overdue: {
        Args: { bar_uuid: string; check_time: string }
        Returns: boolean
      }
      process_end_of_day_cleanup: {
        Args: never
        Returns: {
          action: string
          balance: number
          reason: string
          tab_id: string
          tab_number: number
        }[]
      }
      process_hire_request_expiry: { Args: never; Returns: Json }
      process_shift_application_expiry: { Args: never; Returns: Json }
      process_shift_start_reminders: { Args: never; Returns: Json }
      process_shift_warnings: { Args: never; Returns: Json }
      recompute_crew_performance_score: {
        Args: { p_crew_id: string }
        Returns: number
      }
      recompute_staff_performance_score: {
        Args: { p_staff_id: string }
        Returns: number
      }
      run_end_of_day_cleanup: {
        Args: { p_bar_id: string }
        Returns: {
          closed_zero_balance: number
          closed_zero_with_pending: number
          deleted_pos_alerts: number
          kept_open_with_balance: number
        }[]
      }
      seed_default_role_permissions: {
        Args: { p_bar_id: string }
        Returns: undefined
      }
      set_bar_context: { Args: { p_bar_id: string }; Returns: undefined }
      should_offer_new_tab_after_auto_close: {
        Args: { p_bar_id: string; p_owner_identifier: string }
        Returns: {
          existing_tab_id: string
          existing_tab_number: number
          reason: string
          should_offer: boolean
        }[]
      }
      should_run_cleanup_today: { Args: { p_bar_id: string }; Returns: boolean }
      should_tab_be_overdue: { Args: { p_tab_id: string }; Returns: boolean }
      should_tab_be_overdue_correct: {
        Args: { p_tab_id: string }
        Returns: boolean
      }
      should_tab_be_overdue_unified: {
        Args: { p_tab_id: string }
        Returns: boolean
      }
      signup_new_bar: {
        Args: {
          p_bar_name: string
          p_email: string
          p_location: string
          p_phone: string
          p_user_id: string
        }
        Returns: string
      }
      soft_delete_unclaimed_receipt: {
        Args: { p_receipt_id: string; p_staff_user_id: string }
        Returns: Json
      }
      sync_venue_visit_for_week: {
        Args: {
          p_bar_id: string
          p_customer_id: string
          p_device_identifier: string
          p_week_start: string
        }
        Returns: undefined
      }
      update_customer_loyalty_stats: {
        Args: {
          p_bottles_ordered?: number
          p_customer_id: string
          p_spend_amount?: number
        }
        Returns: undefined
      }
      update_customer_venue_loyalty_tier: {
        Args: { p_bar_id: string; p_customer_id: string }
        Returns: boolean
      }
      update_overdue_tabs: { Args: never; Returns: number }
      update_overdue_tabs_unified: {
        Args: never
        Returns: {
          tabs_kept_open: number
          tabs_marked_overdue: number
        }[]
      }
    }
    Enums: {
      authority_mode_enum: "pos" | "tabeza"
      early_access_status: "pending" | "approved" | "rejected" | "invited"
      rejection_reason: "wrong_items" | "already_ordered" | "change_mind"
      transaction_status:
        | "pending"
        | "sent"
        | "completed"
        | "failed"
        | "cancelled"
      venue_mode_enum: "basic" | "venue"
      venue_type_enum: "bar" | "restaurant" | "club" | "hotel" | "other"
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
      authority_mode_enum: ["pos", "tabeza"],
      early_access_status: ["pending", "approved", "rejected", "invited"],
      rejection_reason: ["wrong_items", "already_ordered", "change_mind"],
      transaction_status: [
        "pending",
        "sent",
        "completed",
        "failed",
        "cancelled",
      ],
      venue_mode_enum: ["basic", "venue"],
      venue_type_enum: ["bar", "restaurant", "club", "hotel", "other"],
    },
  },
} as const
