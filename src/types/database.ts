export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      battery_prices_purchase: {
        Row: {
          id: string
          model: string
          capacity: number
          price: number
          autoconsumption_increase: number
          created_at: string
        }
        Insert: {
          id?: string
          model: string
          capacity: number
          price: number
          autoconsumption_increase?: number
          created_at?: string
        }
        Update: {
          id?: string
          model?: string
          capacity?: number
          price?: number
          autoconsumption_increase?: number
          created_at?: string
        }
      }
      agency_commissions: {
        Row: {
          id: string
          power_kwc: number
          commission_c: number
          commission_s: number
          created_at: string
        }
        Insert: {
          id?: string
          power_kwc: number
          commission_c: number
          commission_s: number
          created_at?: string
        }
        Update: {
          id?: string
          power_kwc?: number
          commission_c?: number
          commission_s?: number
          created_at?: string
        }
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
  }
}