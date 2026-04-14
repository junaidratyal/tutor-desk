export interface Student {
  id: string
  tutor_id: string
  name: string
  parent_name: string
  phone: string
  subject: string
  monthly_fee: number
  created_at: string
}

export interface Session {
  id: string
  student_id: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'done' | 'cancelled'
  students?: Student
}

export interface Payment {
  id: string
  student_id: string
  month: number
  year: number
  amount: number
  paid_at: string | null
  status: 'paid' | 'unpaid'
  students?: Student
}

export interface User {
  id: string
  email: string
  name?: string
}
