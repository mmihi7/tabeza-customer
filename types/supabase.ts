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
      }
      bars: {
        Row: {
          id: string
          name: string
          location: string | null
          area: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          area?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          area?: string | null
          latitude?: number | null
          longitude?: number | null
        }
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
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
