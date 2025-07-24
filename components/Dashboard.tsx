'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Users, Settings, LogOut, TrendingUp, Calendar, Tag, Scale, Repeat } from 'lucide-react'
import Header from './Header'
import ExpenseList from './ExpenseList'
import AddExpenseModal from './AddExpenseModal'
import RecurringExpenseModal from './RecurringExpenseModal'
import FamilySettings from './FamilySettings'
import CategoryManager from './CategoryManager'
import BalanceManager from './BalanceManager'
import FamilyMemberManager from './FamilyMemberManager'
import { Expense, Family, FamilyMember } from '@/types'
import { useTranslation } from '@/hooks/useTranslation'

export default function Dashboard() {
  const { data: session } = useSession()
  const [family, setFamily] = useState<Family | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [activeTab, setActiveTab] = useState<'expenses' | 'categories' | 'balances' | 'family' | 'members'>('expenses')
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.familyId) {
        try {
          setIsLoading(true)
          // Fetch family data
          const familyRes = await fetch(`/api/family`);
          if (familyRes.ok) {
            const familyData = await familyRes.json();
            setFamily(familyData);
            console.log('Family data:', familyData);
          } else {
            console.error('Failed to fetch family data');
          }

          // Fetch expenses
          const expensesRes = await fetch(`/api/expenses`);
          if (expensesRes.ok) {
            const expensesData = await expensesRes.json();
            setExpenses(expensesData);
            console.log('Expenses data:', expensesData);
          } else {
            console.error('Failed to fetch expenses');
          }
        } catch (error) {
          console.error('Error fetching data:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [session])

  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  
  useEffect(() => {
    setCurrentDate(new Date())
  }, [])
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const thisMonthExpenses = currentDate ? expenses.filter(expense => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentDate.getMonth() && expenseDate.getFullYear() === currentDate.getFullYear()
  }).reduce((sum, expense) => sum + expense.amount, 0) : 0

  // Calculate member balances for quick overview
  const calculateQuickBalances = () => {
    if (!family?.members) return []
    
    const balances: { [memberId: string]: { name: string, totalPaid: number, shouldPay: number, balance: number } } = {}
    
    // Initialize balances
    family.members.forEach(member => {
      balances[member.id] = {
        name: member.name,
        totalPaid: 0,
        shouldPay: 0,
        balance: 0
      }
    })
    
    // Calculate total paid by each member
    expenses.forEach(expense => {
      if (balances[expense.paidById]) {
        balances[expense.paidById].totalPaid += expense.amount
      }
    })
    
    // Calculate what each member should pay
    expenses.forEach(expense => {
      if (expense.customSplit) {
        Object.entries(expense.customSplit).forEach(([memberId, percentage]) => {
          if (balances[memberId]) {
            balances[memberId].shouldPay += (expense.amount * percentage) / 100
          }
        })
      } else {
        family.members.forEach(member => {
          if (balances[member.id]) {
            balances[member.id].shouldPay += (expense.amount * member.sharePercentage) / 100
          }
        })
      }
    })
    
    // Calculate final balance
    Object.values(balances).forEach(balance => {
      balance.balance = balance.totalPaid - balance.shouldPay
    })
    
    return Object.values(balances).sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
  }
  
  const quickBalances = calculateQuickBalances()

  const handleAddExpense = async (expenseData: any) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...expenseData,
          familyId: family?.id,
        }),
      })

      if (response.ok) {
        const newExpense = await response.json()
        setExpenses(prev => [newExpense, ...prev])
        setIsAddExpenseModalOpen(false)
      }
    } catch (error) {
      console.error('Error adding expense:', error)
    }
  }

  const handleEditExpense = async (expenseData: any) => {
    if (!editingExpense) return
    
    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      })

      if (response.ok) {
        const updatedExpense = await response.json()
        setExpenses(prev => prev.map(exp => 
          exp.id === editingExpense.id ? updatedExpense : exp
        ))
        setEditingExpense(null)
        setIsAddExpenseModalOpen(false)
        console.log('Expense updated successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to update expense:', errorData.error)
        alert('Errore durante la modifica della spesa: ' + (errorData.error || 'Errore sconosciuto'))
      }
    } catch (error) {
      console.error('Error updating expense:', error)
      alert('Errore di connessione durante la modifica della spesa')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setExpenses(prev => prev.filter(exp => exp.id !== expenseId))
        console.log('Expense deleted successfully')
      } else {
        const errorData = await response.json()
        console.error('Failed to delete expense:', errorData.error)
        alert('Errore durante l\'eliminazione della spesa: ' + (errorData.error || 'Errore sconosciuto'))
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Errore di connessione durante l\'eliminazione della spesa')
    }
  }

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setIsAddExpenseModalOpen(true)
  }

  const handleFamilyUpdate = async (updatedFamily: Family) => {
    try {
      // Update local state immediately for better UX
      setFamily(updatedFamily)
      
      // Save each member's changes to the database
      for (const member of updatedFamily.members) {
        const response = await fetch(`/api/family/${updatedFamily.id}/members/${member.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: member.name,
            sharePercentage: member.sharePercentage,
            isActive: true
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Failed to update member:', errorData.error)
          alert('Errore durante il salvataggio: ' + (errorData.error || 'Errore sconosciuto'))
          return
        }
      }
      
      console.log('Family members updated successfully')
    } catch (error) {
      console.error('Error updating family:', error)
      alert('Errore di connessione durante il salvataggio')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questo Mese</p>
                <p className="text-2xl font-bold text-gray-900">€{thisMonthExpenses.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Spese Totali</p>
                <p className="text-2xl font-bold text-gray-900">€{totalExpenses.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Membri Famiglia</p>
                <p className="text-2xl font-bold text-gray-900">{family?.members.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          {/* Balance Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setActiveTab('balances')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bilancio</p>
                <p className="text-lg font-bold text-blue-600">Visualizza</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Scale className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Balance Overview */}
        {quickBalances.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bilancio Rapido</h3>
              <button
                onClick={() => setActiveTab('balances')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Visualizza Dettagli →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickBalances.slice(0, 3).map((member, index) => {
                const getBalanceColor = (balance: number) => {
                  if (balance > 0.01) return 'text-green-600 bg-green-50 border-green-200'
                  if (balance < -0.01) return 'text-red-600 bg-red-50 border-red-200'
                  return 'text-gray-600 bg-gray-50 border-gray-200'
                }
                
                const getBalanceText = (balance: number) => {
                  if (balance > 0.01) return 'Gli è dovuto'
                  if (balance < -0.01) return 'Deve'
                  return 'In pari'
                }
                
                return (
                  <div key={index} className={`p-4 rounded-lg border ${getBalanceColor(member.balance)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{getBalanceText(member.balance)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getBalanceColor(member.balance).split(' ')[0]}`}>
                          €{Math.abs(member.balance).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
          <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'expenses'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.expenses')}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'categories'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.categories')}
            </button>
            <button
              onClick={() => setActiveTab('balances')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'balances'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.balances')}
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'family'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('navigation.family')}
            </button>
            {session?.user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'members'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('navigation.members')}
              </button>
            )}
        </div>

        {/* Content */}
        {activeTab === 'expenses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Expenses</h2>
              <div className="flex gap-3">
                <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setIsAddExpenseModalOpen(true)}
                     className="btn-primary flex items-center gap-2"
                   >
                     <Plus className="w-4 h-4" />
                     {t('expenses.addExpense')}
                   </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowRecurringModal(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Repeat className="w-4 h-4" />
                  Spesa Ricorrente
                </motion.button>
              </div>
            </div>
            <ExpenseList 
               expenses={expenses} 
               family={family} 
               onEditExpense={openEditExpense}
               onDeleteExpense={handleDeleteExpense}
             />
          </div>
        )}

        {activeTab === 'categories' && family && (
          <CategoryManager family={family} onUpdate={setFamily} />
        )}

        {activeTab === 'balances' && family && (
          <BalanceManager family={family} expenses={expenses} />
        )}

        {activeTab === 'family' && family && (
          <FamilySettings family={family} onUpdate={handleFamilyUpdate} />
        )}

        {activeTab === 'members' && family && session?.user?.role === 'admin' && (
          <FamilyMemberManager familyId={family.id} />
        )}
      </main>

      {/* Add/Edit Expense Modal */}
       {isAddExpenseModalOpen && family && (
         <AddExpenseModal
           family={family}
           editingExpense={editingExpense}
           onAdd={editingExpense ? handleEditExpense : handleAddExpense}
           onClose={() => {
             setIsAddExpenseModalOpen(false)
             setEditingExpense(null)
           }}
         />
       )}
       
       {/* Recurring Expense Modal */}
       {showRecurringModal && family && (
         <RecurringExpenseModal
           family={family}
           onAdd={handleAddExpense}
           onClose={() => setShowRecurringModal(false)}
         />
       )}
    </div>
  )
}