export interface User {
  id: string
  name?: string | null
  email: string
  emailVerified?: Date | null
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Family {
  id: string
  name: string
  members: FamilyMember[]
  categories: Category[]
  createdAt: Date
  updatedAt: Date
}

export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  name: string
  role: string
  splitPercentage: number
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  familyId: string
}

export interface Expense {
  id: string
  amount: number
  description: string
  date: Date
  location?: string
  categoryId: string
  familyId: string
  paidById: string
  userId: string
  customSplit?: { [memberId: string]: number }
  createdAt: Date
  updatedAt: Date
}

export interface ExpenseWithDetails extends Expense {
  category: Category
  paidBy: FamilyMember
}

export interface ExpenseFormData {
  amount: number
  description: string
  date: string
  location?: string
  categoryId: string
  paidById: string
}

export interface FamilyStats {
  totalExpenses: number
  monthlyExpenses: number
  averageExpense: number
  expensesByCategory: Record<string, number>
  expensesByMember: Record<string, number>
}