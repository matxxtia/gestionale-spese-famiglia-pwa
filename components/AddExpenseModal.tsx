'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, MapPin, Tag, User, Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Family, Expense } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

interface AddExpenseModalProps {
  family: Family
  onAdd: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
  editingExpense?: Expense | null
}

const formSchema = z.object({
  amount: z.string().min(1, 'L\'importo è obbligatorio'),
  description: z.string().min(1, 'La descrizione è obbligatoria'),
  date: z.string().min(1, 'La data è obbligatoria'),
  categoryId: z.string().min(1, 'La categoria è obbligatoria'),
  paidById: z.string().min(1, 'Seleziona chi ha pagato'),
  location: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof formSchema>

export default function AddExpenseModal({ family, onAdd, onClose, editingExpense }: AddExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useCustomSplit, setUseCustomSplit] = useState(!!editingExpense?.customSplit)
  const [customSplit, setCustomSplit] = useState<{ [memberId: string]: number }>(
    editingExpense?.customSplit || {}
  )
  const { t } = useTranslation()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editingExpense ? {
      description: editingExpense.description,
      amount: editingExpense.amount.toString(),
      date: editingExpense.date.toISOString().split('T')[0],
      categoryId: editingExpense.categoryId,
      paidById: editingExpense.paidById,
      location: editingExpense.location || '',
    } : {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      paidById: family.members[0]?.id || '',
      location: '',
    },
  })

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    
    try {
      // Validate custom split if used
      if (useCustomSplit) {
        const totalPercentage = Object.values(customSplit).reduce((sum, val) => sum + val, 0)
        if (Math.abs(totalPercentage - 100) > 0.01) {
          alert('La somma delle percentuali deve essere 100%')
          setIsSubmitting(false)
          return
        }
      }

      const expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        amount: parseFloat(data.amount),
        description: data.description,
        date: new Date(data.date),
        location: data.location || undefined,
        categoryId: data.categoryId,
        familyId: family.id,
        paidById: data.paidById,
        userId: data.paidById, // Using paidById as userId for simplicity
        customSplit: useCustomSplit ? customSplit : undefined,
      }
      
      onAdd(expense)
      form.reset()
      setCustomSplit({})
      setUseCustomSplit(false)
      onClose()
    } catch (error) {
      console.error('Error adding/updating expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingExpense ? 'Modifica Spesa' : 'Aggiungi Nuova Spesa'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione *
              </label>
              <input
                type="text"
                placeholder="Per cosa è stata questa spesa?"
                {...form.register('description')}
                className={`input-field ${form.formState.errors.description ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                {...form.register('date')}
                className={`input-field ${form.formState.errors.date ? 'border-red-500' : ''}`}
              />
              {form.formState.errors.date && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.date.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Luogo (opzionale)
              </label>
              <input
                type="text"
                placeholder="Dove è stata sostenuta questa spesa?"
                {...form.register('location')}
                className="input-field"
              />
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

            {/* Custom Split */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 inline mr-1" />
                  Ripartizione Personalizzata
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomSplit(!useCustomSplit)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {useCustomSplit ? 'Usa ripartizione standard' : 'Personalizza ripartizione'}
                </button>
              </div>
              
              {useCustomSplit && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  {family.members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{member.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="%"
                          value={customSplit[member.id] || ''}
                          onChange={(e) => setCustomSplit(prev => ({
                            ...prev,
                            [member.id]: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </div>
                  ))}
                </div>
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
                    {editingExpense ? 'Aggiornamento...' : 'Aggiunta...'}
                  </div>
                ) : (
                  editingExpense ? 'Aggiorna Spesa' : 'Aggiungi Spesa'
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}