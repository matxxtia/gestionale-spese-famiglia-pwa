'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import MotionWrapper, { AnimatePresenceWrapper } from './MotionWrapper'
import ClientOnly from './ClientOnly'
import { 
  ShoppingCart, 
  Zap, 
  Film, 
  Car, 
  Heart, 
  MapPin, 
  Calendar,
  User,
  Filter,
  Search,
  Trash2,
  Edit2,
  Users
} from 'lucide-react'
import { Expense, Family } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

interface ExpenseListProps {
  expenses: Expense[]
  family: Family | null
  onDeleteExpense?: (expenseId: string) => void
  onEditExpense?: (expense: Expense) => void
}

const iconMap = {
  'shopping-cart': ShoppingCart,
  'zap': Zap,
  'film': Film,
  'car': Car,
  'heart': Heart,
}

export default function ExpenseList({ expenses, family, onDeleteExpense, onEditExpense }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMember, setSelectedMember] = useState('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const { t } = useTranslation()

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || expense.categoryId === selectedCategory
    const matchesMember = selectedMember === 'all' || expense.paidById === selectedMember
    
    return matchesSearch && matchesCategory && matchesMember
  })

  const getCategory = (categoryId: string) => {
    return family?.categories.find(cat => cat.id === categoryId)
  }

  const getMember = (memberId: string) => {
    return family?.members.find(member => member.id === memberId)
  }

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || ShoppingCart
    return IconComponent
  }

  const handleDeleteExpense = (expenseId: string) => {
    if (typeof window !== 'undefined' && window.confirm(t('expenses.deleteExpense') + '?')) {
      onDeleteExpense?.(expenseId)
    }
  }

  const formatCurrency = (amount: number) => {
    if (typeof window === 'undefined') {
      return `€${amount.toFixed(2)}`
    }
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (typeof window === 'undefined') {
      return dateObj.toISOString().split('T')[0]
    }
    return dateObj.toLocaleDateString('it-IT')
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('expenses.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">{t('expenses.allCategories')}</option>
            {family?.categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Member Filter */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="input-field"
          >
            <option value="all">{t('expenses.allMembers')}</option>
            {family?.members.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        <ClientOnly>
          <AnimatePresenceWrapper>
            {filteredExpenses.length === 0 ? (
              <MotionWrapper
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card text-center py-12"
              >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('expenses.noExpensesFound')}
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all' || selectedMember !== 'all'
                  ? t('expenses.tryAdjustingFilters')
                  : t('expenses.startByAdding')}
              </p>
              </MotionWrapper>
            ) : (
              filteredExpenses.map((expense, index) => {
                const category = getCategory(expense.categoryId)
                const member = getMember(expense.paidById)
                const IconComponent = category ? getCategoryIcon(category.icon) : ShoppingCart

                return (
                  <MotionWrapper
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="expense-item"
                  >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Category Icon */}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <IconComponent 
                          className="w-6 h-6" 
                          style={{ color: category?.color }}
                        />
                      </div>

                      {/* Expense Details */}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {expense.description}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(expense.date)}
                          </div>
                          {expense.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {expense.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {member?.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {category?.name}
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {onEditExpense && (
                          <button
                            onClick={() => onEditExpense(expense)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('expenses.editExpense')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteExpense && (
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('expenses.deleteExpense')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  </MotionWrapper>
                )
              })
            )}
          </AnimatePresenceWrapper>
        </ClientOnly>
      </div>

      {/* Summary */}
      {filteredExpenses.length > 0 && (
        <ClientOnly>
          <MotionWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-primary-50 border-primary-200"
          >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-primary-700">
                {t('expenses.total')} ({filteredExpenses.length} {t('expenses.expenses')})
              </p>
              <p className="text-2xl font-bold text-primary-900">
                {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
              </p>
            </div>
            <div className="text-right text-sm text-primary-600">
              <p>{t('expenses.average')}: {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length)}</p>
            </div>
          </div>
          </MotionWrapper>
        </ClientOnly>
      )}
    </div>
  )
}