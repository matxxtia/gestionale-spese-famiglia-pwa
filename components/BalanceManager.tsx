'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Expense, Family, FamilyMember } from '@/types'

// Using the Expense type from the main types file
// No need to redefine it here

interface BalanceManagerProps {
  family: Family
  expenses: Expense[]
}

interface MemberBalance {
  id: string
  name: string
  totalPaid: number
  shouldPay: number
  balance: number
}

interface DebtRelation {
  from: string
  to: string
  amount: number
}

export default function BalanceManager({ family, expenses }: BalanceManagerProps) {
  const familyMembers = family.members
  const { t } = useTranslation()
  const [memberBalances, setMemberBalances] = useState<MemberBalance[]>([])
  const [debtRelations, setDebtRelations] = useState<DebtRelation[]>([])

  useEffect(() => {
    calculateBalances()
  }, [expenses, familyMembers])

  const calculateBalances = () => {
    const balances: { [memberId: string]: MemberBalance } = {}

    // Initialize balances
    familyMembers.forEach((member: FamilyMember) => {
      balances[member.id] = {
        id: member.id,
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
        // Use custom split for this expense
        Object.entries(expense.customSplit).forEach(([memberId, percentage]) => {
          if (balances[memberId]) {
            balances[memberId].shouldPay += (expense.amount * percentage) / 100
          }
        })
      } else {
        // Use default family split
        familyMembers.forEach((member: FamilyMember) => {
          if (balances[member.id]) {
            balances[member.id].shouldPay += (expense.amount * member.splitPercentage) / 100
          }
        })
      }
    })

    // Calculate final balance (positive = owed money, negative = owes money)
    Object.values(balances).forEach(balance => {
      balance.balance = balance.totalPaid - balance.shouldPay
    })

    setMemberBalances(Object.values(balances))
    calculateDebtRelations(Object.values(balances))
  }

  const calculateDebtRelations = (balances: MemberBalance[]) => {
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)
    const relations: DebtRelation[] = []

    let i = 0, j = 0
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance))

      if (amount > 0.01) { // Avoid tiny amounts
        relations.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        })
      }

      creditor.balance -= amount
      debtor.balance += amount

      if (creditor.balance < 0.01) i++
      if (Math.abs(debtor.balance) < 0.01) j++
    }

    setDebtRelations(relations)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getBalanceIcon = (balance: number) => {
    if (balance > 0.01) return <TrendingUp className="w-5 h-5 text-green-600" />
    if (balance < -0.01) return <TrendingDown className="w-5 h-5 text-red-600" />
    return <Minus className="w-5 h-5 text-gray-400" />
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0.01) return 'text-green-600'
    if (balance < -0.01) return 'text-red-600'
    return 'text-gray-600'
  }

  const getBalanceText = (balance: number) => {
    if (balance > 0.01) return t('balance.isOwed')
    if (balance < -0.01) return t('balance.owes')
    return t('balance.settled')
  }

  return (
    <div className="space-y-6">
      {/* Member Balances */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('balance.summary')}</h3>
        <div className="space-y-4">
          {memberBalances.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getBalanceIcon(member.balance)}
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">
                    {t('balance.totalPaid')}: {formatCurrency(member.totalPaid)} | 
                    {t('balance.shouldPay')}: {formatCurrency(member.shouldPay)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${getBalanceColor(member.balance)}`}>
                  {formatCurrency(Math.abs(member.balance))}
                </p>
                <p className={`text-sm ${getBalanceColor(member.balance)}`}>
                  {getBalanceText(member.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debt Relations */}
      {debtRelations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('balance.whoOwesWho')}</h3>
          <div className="space-y-3">
            {debtRelations.map((relation, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-gray-900">
                    {relation.from} {t('balance.owes')} {relation.to}
                  </span>
                </div>
                <span className="font-semibold text-red-600">
                  {formatCurrency(relation.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {debtRelations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <Minus className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('balance.settled')}</h3>
            <p className="text-gray-600">Tutti i membri della famiglia sono in pari!</p>
          </div>
        </div>
      )}
    </div>
  )
}