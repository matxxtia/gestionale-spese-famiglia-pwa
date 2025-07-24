'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, Tag, User, Repeat, Zap, Home, Car } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSession } from 'next-auth/react'
import { Family, Expense } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

interface RecurringExpenseModalProps {
  family: Family
  onAdd: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

const formSchema = z.object({
  templateName: z.string().min(1, 'Il nome del template è obbligatorio'),
  amount: z.string().min(1, 'L\'importo è obbligatorio'),
  month: z.string().min(1, 'Il mese è obbligatorio'),
  year: z.string().min(1, 'L\'anno è obbligatorio'),
  categoryId: z.string().min(1, 'La categoria è obbligatoria'),
  paidById: z.string().min(1, 'Seleziona chi ha pagato'),
})

type RecurringExpenseFormData = z.infer<typeof formSchema>

// Predefined recurring expense templates
const recurringTemplates = [
  {
    id: 'electricity',
    name: 'Bolletta Elettricità',
    icon: Zap,
    description: 'Bolletta mensile dell\'elettricità',
    defaultCategory: 'utilities'
  },
  {
    id: 'gas',
    name: 'Bolletta Gas',
    icon: Home,
    description: 'Bolletta mensile del gas',
    defaultCategory: 'utilities'
  },
  {
    id: 'internet',
    name: 'Internet/Telefono',
    icon: Zap,
    description: 'Abbonamento internet e telefono',
    defaultCategory: 'utilities'
  },
  {
    id: 'insurance',
    name: 'Assicurazione Auto',
    icon: Car,
    description: 'Assicurazione mensile dell\'auto',
    defaultCategory: 'transport'
  },
  {
    id: 'rent',
    name: 'Affitto/Mutuo',
    icon: Home,
    description: 'Pagamento mensile affitto o mutuo',
    defaultCategory: 'housing'
  }
]

export default function RecurringExpenseModal({ family, onAdd, onClose }: RecurringExpenseModalProps) {
  const { data: session } = useSession()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslation()
  
  // Find current user's family member ID
  const getCurrentUserMemberId = () => {
    if (!session?.user?.id || !family?.members) return family?.members[0]?.id || ''
    const currentMember = family.members.find(member => member.userId === session.user.id)
    return currentMember?.id || family.members[0]?.id || ''
  }
  
  // Get current month and year
  const currentDate = new Date()
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const currentYear = currentDate.getFullYear().toString()
  
  const form = useForm<RecurringExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      templateName: '',
      amount: '',
      month: currentMonth,
      year: currentYear,
      categoryId: '',
      paidById: getCurrentUserMemberId(),
    },
  })
  
  const selectTemplate = (template: typeof recurringTemplates[0]) => {
    setSelectedTemplate(template.id)
    form.setValue('templateName', template.name)
    
    // Try to find matching category
    const matchingCategory = family.categories.find(cat => 
      cat.name.toLowerCase().includes(template.defaultCategory) ||
      cat.name.toLowerCase().includes('utilit') ||
      cat.name.toLowerCase().includes('casa') ||
      cat.name.toLowerCase().includes('trasport')
    )
    
    if (matchingCategory) {
      form.setValue('categoryId', matchingCategory.id)
    }
  }
  
  const onSubmit = async (data: RecurringExpenseFormData) => {
    setIsSubmitting(true)
    
    try {
      // Create expense for the selected month
      const expenseDate = new Date(parseInt(data.year), parseInt(data.month) - 1, 1)
      
      const expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        amount: parseFloat(data.amount),
        description: `${data.templateName} - ${getMonthName(parseInt(data.month))} ${data.year}`,
        date: expenseDate,
        location: undefined,
        categoryId: data.categoryId,
        familyId: family.id,
        paidById: data.paidById,
        userId: data.paidById,
        customSplit: undefined,
      }
      
      onAdd(expense)
      form.reset()
      setSelectedTemplate(null)
      onClose()
    } catch (error) {
      console.error('Error adding recurring expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getMonthName = (monthNumber: number) => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]
    return months[monthNumber - 1]
  }
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Repeat className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Aggiungi Spesa Ricorrente
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {/* Template Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Seleziona Tipo di Spesa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recurringTemplates.map((template) => {
                  const IconComponent = template.icon
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => selectTemplate(template)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`w-6 h-6 ${
                          selectedTemplate === template.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                        <div>
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Template Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Spesa *
                </label>
                <input
                  type="text"
                  placeholder="Es. Bolletta Elettricità"
                  {...form.register('templateName')}
                  className={`input-field ${form.formState.errors.templateName ? 'border-red-500' : ''}`}
                />
                {form.formState.errors.templateName && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.templateName.message}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Importo *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...form.register('amount')}
                  className={`input-field ${form.formState.errors.amount ? 'border-red-500' : ''}`}
                />
                {form.formState.errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.amount.message}</p>
                )}
              </div>

              {/* Month and Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Mese *
                  </label>
                  <select
                    {...form.register('month')}
                    className={`input-field ${form.formState.errors.month ? 'border-red-500' : ''}`}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {getMonthName(month)}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.month && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.month.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anno *
                  </label>
                  <select
                    {...form.register('year')}
                    className={`input-field ${form.formState.errors.year ? 'border-red-500' : ''}`}
                  >
                    {Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() + i).map(year => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.year && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.year.message}</p>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Categoria *
                </label>
                <select
                  {...form.register('categoryId')}
                  className={`input-field ${form.formState.errors.categoryId ? 'border-red-500' : ''}`}
                >
                  <option value="">Seleziona una categoria</option>
                  {family.categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              {/* Paid By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Pagato da *
                </label>
                <select
                  {...form.register('paidById')}
                  className={`input-field ${form.formState.errors.paidById ? 'border-red-500' : ''}`}
                >
                  <option value="">Seleziona chi ha pagato</option>
                  {family.members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.paidById && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.paidById.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                  disabled={isSubmitting}
                >
                  Annulla
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Aggiunta...
                    </div>
                  ) : (
                    'Aggiungi Spesa Ricorrente'
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}