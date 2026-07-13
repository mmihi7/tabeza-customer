export interface Database {
  public: {
    Tables: {
      shift_postings: {
        Row: {
          id: string
          bar_id: string
          role: string
          shift_date: string
          shift_start: string
          shift_end: string
          pay_per_shift: number | null
          slots_available: number
          preferred_performance_tier: string | null
          description: string | null
          status: string
          created_at: string
          expires_at: string | null
          created_by: string | null
          latitude: number | null
          longitude: number | null
          repeat_until: string | null
          repeat_days: string[] | null
          repeat_interval: string | null
        }
        Insert: {
          id?: string
          bar_id: string
          role: string
          shift_date: string
          shift_start: string
          shift_end: string
          pay_per_shift?: number | null
          slots_available?: number
          preferred_performance_tier?: string | null
          description?: string | null
          status?: string
          created_at?: string
          expires_at?: string | null
          created_by?: string | null
          latitude?: number | null
          longitude?: number | null
          repeat_until?: string | null
          repeat_days?: string[] | null
          repeat_interval?: string | null
        }
        Update: {
          id?: string
          bar_id?: string
          role?: string
          shift_date?: string
          shift_start?: string
          shift_end?: string
          pay_per_shift?: number | null
          slots_available?: number
          preferred_performance_tier?: string | null
          description?: string | null
          status?: string
          created_at?: string
          expires_at?: string | null
          created_by?: string | null
          latitude?: number | null
          longitude?: number | null
          repeat_until?: string | null
          repeat_days?: string[] | null
          repeat_interval?: string | null
        }
          Relationships: []
      }
      hire_requests: {
        Row: {
          id: string
          bar_id: string
          staff_member_id: string
          role: string
          shift_date: string
          shift_start: string
          shift_end: string
          pay_amount: number | null
          message: string | null
          status: string
          sent_at: string
          expires_at: string | null
          response_message: string | null
        }
        Insert: {
          id?: string
          bar_id: string
          staff_member_id: string
          role: string
          shift_date: string
          shift_start: string
          shift_end: string
          pay_amount?: number | null
          message?: string | null
          status?: string
          sent_at?: string
          expires_at?: string | null
          response_message?: string | null
        }
        Update: {
          id?: string
          bar_id?: string
          staff_member_id?: string
          role?: string
          shift_date?: string
          shift_start?: string
          shift_end?: string
          pay_amount?: number | null
          message?: string | null
          status?: string
          sent_at?: string
          expires_at?: string | null
          response_message?: string | null
        }
          Relationships: []
      }
      staff_members: {
        Row: {
          id: string
          display_name: string
          bio: string | null
          performance_score: number
          total_shifts_completed: number
          total_approved_orders: number
          preferred_roles: string[]
          preferred_locations: string[]
          badge_tier: string
          face_photo_url: string | null
          face_thumbnail_url: string | null
          half_body_photo_url: string | null
        }
        Insert: {
          id?: string
          display_name: string
          bio?: string | null
          performance_score?: number
          total_shifts_completed?: number
          total_approved_orders?: number
          preferred_roles?: string[]
          preferred_locations?: string[]
          badge_tier?: string
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          half_body_photo_url?: string | null
        }
        Update: {
          id?: string
          display_name?: string
          bio?: string | null
          performance_score?: number
          total_shifts_completed?: number
          total_approved_orders?: number
          preferred_roles?: string[]
          preferred_locations?: string[]
          badge_tier?: string
          face_photo_url?: string | null
          face_thumbnail_url?: string | null
          half_body_photo_url?: string | null
        }
          Relationships: []
      }
      bars: {
        Row: {
          id: string
          name: string
          location: string | null
          area: string | null
          latitude: number | null
          longitude: number | null
          bronze_threshold: number | null
          silver_threshold: number | null
          gold_threshold: number | null
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          area?: string | null
          latitude?: number | null
          longitude?: number | null
          bronze_threshold?: number | null
          silver_threshold?: number | null
          gold_threshold?: number | null
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          area?: string | null
          latitude?: number | null
          longitude?: number | null
          bronze_threshold?: number | null
          silver_threshold?: number | null
          gold_threshold?: number | null
        }
          Relationships: []
      }
      staff_notifications: {
        Row: {
          id: string
          staff_member_id: string
          type: string
          title: string
          body: string | null
          data: Record<string, any> | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          staff_member_id: string
          type: string
          title: string
          body?: string | null
          data?: Record<string, any> | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          staff_member_id?: string
          type?: string
          title?: string
          body?: string | null
          data?: Record<string, any> | null
          read?: boolean
          created_at?: string
        }
          Relationships: []
      }
      shifts: {
        Row: {
          id: string
          staff_member_id: string
          bar_id: string
          role: string
          shift_date: string
          shift_start: string
          shift_end: string
          pay_per_shift: number | null
          status: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_member_id: string
          bar_id: string
          role: string
          shift_date: string
          shift_start: string
          shift_end: string
          pay_per_shift?: number | null
          status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_member_id?: string
          bar_id?: string
          role?: string
          shift_date?: string
          shift_start?: string
          shift_end?: string
          pay_per_shift?: number | null
          status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
        }
          Relationships: []
      }
      customer_badges: {
        Row: {
          id: string
          customer_id: string
          badge_level: string
          awarded_at: string
          earned_at_bar_id: string | null
          spend_amount_at_venue: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          customer_id: string
          badge_level: string
          awarded_at?: string
          earned_at_bar_id?: string | null
          spend_amount_at_venue?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          customer_id?: string
          badge_level?: string
          awarded_at?: string
          earned_at_bar_id?: string | null
          spend_amount_at_venue?: number | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "customer_badges_earned_at_bar_id_fkey"
            columns: ["earned_at_bar_id"]
            referencedRelation: "bars"
            referencedColumns: ["id"]
          }
        ]
      }
      tabs: {
        Row: {
          id: string
          bar_id: string
          tab_number: number | null
          customer_name: string | null
          status: string
          device_identifier: string | null
          owner_identifier: string | null
          closed_at: string | null
          opened_at: string | null
          created_at: string
          updated_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          bar_id: string
          tab_number?: number | null
          customer_name?: string | null
          status?: string
          device_identifier?: string | null
          owner_identifier?: string | null
          closed_at?: string | null
          opened_at?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          bar_id?: string
          tab_number?: number | null
          customer_name?: string | null
          status?: string
          device_identifier?: string | null
          owner_identifier?: string | null
          closed_at?: string | null
          opened_at?: string | null
          created_at?: string
          updated_at?: string
          notes?: string | null
        }
          Relationships: []
      }
      tab_orders: {
        Row: {
          id: string
          tab_id: string
          product_id: string | null
          quantity: number
          price: number
          status: string
          total: number | null
          initiated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tab_id: string
          product_id?: string | null
          quantity?: number
          price: number
          status?: string
          total?: number | null
          initiated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tab_id?: string
          product_id?: string | null
          quantity?: number
          price?: number
          status?: string
          total?: number | null
          initiated_by?: string | null
          created_at?: string
        }
          Relationships: []
      }
      bar_products: {
        Row: {
          id: string
          bar_id: string
          name: string
          price: number
          category: string | null
          is_available: boolean
        }
        Insert: {
          id?: string
          bar_id: string
          name: string
          price: number
          category?: string | null
          is_available?: boolean
        }
        Update: {
          id?: string
          bar_id?: string
          name?: string
          price?: number
          category?: string | null
          is_available?: boolean
        }
          Relationships: []
      }
      tab_payments: {
        Row: {
          id: string
          tab_id: string
          amount: number
          method: string
          status: string
          created_at: string
          updated_at: string | null
          checkout_request_id: string | null
          merchant_request_id: string | null
          mpesa_receipt: string | null
          reference: string | null
          metadata: Record<string, any> | null
        }
        Insert: {
          id?: string
          tab_id: string
          amount: number
          method: string
          status?: string
          created_at?: string
          updated_at?: string | null
          checkout_request_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          reference?: string | null
          metadata?: Record<string, any> | null
        }
        Update: {
          id?: string
          tab_id?: string
          amount?: number
          method?: string
          status?: string
          created_at?: string
          updated_at?: string | null
          checkout_request_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          reference?: string | null
          metadata?: Record<string, any> | null
        }
          Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          phone?: string | null
          created_at?: string
        }
          Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          bar_id: string
        }
        Insert: {
          id?: string
          name: string
          bar_id: string
        }
        Update: {
          id?: string
          name?: string
          bar_id?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          id: string
          device_id: string
          install_count: number
          last_seen: string
        }
        Insert: {
          id?: string
          device_id: string
          install_count?: number
          last_seen?: string
        }
        Update: {
          id?: string
          device_id?: string
          install_count?: number
          last_seen?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          tab_id: string
          total: number
          status: string
        }
        Insert: {
          id?: string
          tab_id: string
          total?: number
          status?: string
        }
        Update: {
          id?: string
          tab_id?: string
          total?: number
          status?: string
        }
        Relationships: []
      }
      slideshow_images: {
        Row: {
          id: string
          bar_id: string
          image_url: string
          display_order: number
          active: boolean
        }
        Insert: {
          id?: string
          bar_id: string
          image_url: string
          display_order?: number
          active?: boolean
        }
        Update: {
          id?: string
          bar_id?: string
          image_url?: string
          display_order?: number
          active?: boolean
        }
        Relationships: []
      }
      tab_balances: {
        Row: {
          id: string
          tab_id: string
          balance: number
        }
        Insert: {
          id?: string
          tab_id: string
          balance?: number
        }
        Update: {
          id?: string
          tab_id?: string
          balance?: number
        }
        Relationships: []
      }
      tab_telegram_messages: {
        Row: {
          id: string
          tab_id: string
          message: string
          order_type: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          tab_id: string
          message: string
          order_type: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          tab_id?: string
          message?: string
          order_type?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          id: string
          user_id: string
          device_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          created_at?: string
        }
        Relationships: []
      }
      venue_discount_settings: {
        Row: {
          id: string
          bar_id: string
          spend_tiers: Record<string, any> | null
          visit_bonuses: Record<string, any> | null
        }
        Insert: {
          id?: string
          bar_id: string
          spend_tiers?: Record<string, any> | null
          visit_bonuses?: Record<string, any> | null
        }
        Update: {
          id?: string
          bar_id?: string
          spend_tiers?: Record<string, any> | null
          visit_bonuses?: Record<string, any> | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
