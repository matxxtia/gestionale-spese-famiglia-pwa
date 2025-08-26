'use client'

import { useState } from 'react'
import { Family, FamilyMember } from '@/types'
import MotionWrapper, { AnimatePresenceWrapper } from './MotionWrapper'
import { Users, Plus, Edit2, Trash2, Percent, Save } from 'lucide-react'

interface FamilySettingsProps {
  family: Family
  onUpdate: (family: Family) => void
}

export default function FamilySettings({ family, onUpdate }: FamilySettingsProps) {
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [newMemberName, setNewMemberName] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberShares, setMemberShares] = useState<Record<string, number>>(
    family.members.reduce((acc, member) => {
      acc[member.id] = member.sharePercentage
      return acc
    }, {} as Record<string, number>)
  )

  const handleUpdateMemberName = (memberId: string, newName: string) => {
    const updatedMembers = family.members.map(member =>
      member.id === memberId ? { ...member, name: newName } : member
    )
    onUpdate({ ...family, members: updatedMembers })
    setEditingMember(null)
  }

  const handleAddMember = () => {
    if (!newMemberName.trim()) return

    const newMember: FamilyMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      role: 'member',
      sharePercentage: 0,
      userId: Date.now().toString(),
      familyId: family.id
    }

    // Redistribute shares equally
    const totalMembers = family.members.length + 1
    const equalShare = 100 / totalMembers
    
    const updatedMembers = [
      ...family.members.map(member => ({ ...member, sharePercentage: equalShare })),
      { ...newMember, sharePercentage: equalShare }
    ]

    // Update local state
    const newShares = updatedMembers.reduce((acc, member) => {
      acc[member.id] = member.sharePercentage
      return acc
    }, {} as Record<string, number>)
    
    setMemberShares(newShares)
    onUpdate({ ...family, members: updatedMembers })
    setNewMemberName('')
    setShowAddMember(false)
  }

  const handleRemoveMember = (memberId: string) => {
    if (family.members.length <= 1) return // Don't allow removing the last member

    const updatedMembers = family.members.filter(member => member.id !== memberId)
    
    // Redistribute shares equally among remaining members
    const equalShare = 100 / updatedMembers.length
    const redistributedMembers = updatedMembers.map(member => ({
      ...member,
      sharePercentage: equalShare
    }))

    // Update local state
    const newShares = redistributedMembers.reduce((acc, member) => {
      acc[member.id] = member.sharePercentage
      return acc
    }, {} as Record<string, number>)
    
    setMemberShares(newShares)
    onUpdate({ ...family, members: redistributedMembers })
  }

  const handleShareChange = (memberId: string, newShare: number) => {
    setMemberShares(prev => ({ ...prev, [memberId]: newShare }))
  }

  const handleSaveShares = () => {
    const total = Object.values(memberShares).reduce((sum, share) => sum + share, 0)
    
    if (Math.abs(total - 100) > 0.01) {
      alert('Shares must add up to 100%')
      return
    }

    const updatedMembers = family.members.map(member => ({
      ...member,
      sharePercentage: memberShares[member.id] || 0
    }))

    onUpdate({ ...family, members: updatedMembers })
  }

  const handleEqualSplit = () => {
    const equalShare = 100 / family.members.length
    const newShares = family.members.reduce((acc, member) => {
      acc[member.id] = equalShare
      return acc
    }, {} as Record<string, number>)
    
    setMemberShares(newShares)
  }

  const totalShares = Object.values(memberShares).reduce((sum, share) => sum + share, 0)
  const sharesValid = Math.abs(totalShares - 100) < 0.01

  return (
    <div className="space-y-6">
      {/* Family Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Family Members
          </h3>
          <MotionWrapper
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddMember(true)}
            className="btn-primary flex items-center gap-2 text-sm"
         >
            <Plus className="w-4 h-4" />
            Add Member
          </MotionWrapper>
        </div>

        <div className="space-y-4">
          {family.members.map((member, index) => (
            <MotionWrapper
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  {editingMember === member.id ? (
                    <input
                      type="text"
                      defaultValue={member.name}
                      className="input-field text-sm"
                      onBlur={(e) => handleUpdateMemberName(member.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateMemberName(member.id, e.currentTarget.value)
                        }
                        if (e.key === 'Escape') {
                          setEditingMember(null)
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingMember(member.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {family.members.length > 1 && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </MotionWrapper>
          ))}
        </div>

        {/* Add Member Form */}
        <AnimatePresenceWrapper>
          {showAddMember && (
            <MotionWrapper
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Member name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 input-field"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMember()
                    if (e.key === 'Escape') setShowAddMember(false)
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false)
                    setNewMemberName('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </MotionWrapper>
          )}
        </AnimatePresenceWrapper>
      </div>

      {/* Cost Sharing */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Cost Sharing
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleEqualSplit}
              className="btn-secondary text-sm"
            >
              Equal Split
            </button>
            <MotionWrapper
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveShares}
              disabled={!sharesValid}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </MotionWrapper>
          </div>
        </div>

        <div className="space-y-4">
          {family.members.map((member, index) => (
            <MotionWrapper
              key={member.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary-600" />
                </div>
                <span className="font-medium text-gray-900">{member.name}</span>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={memberShares[member.id] || 0}
                  onChange={(e) => handleShareChange(member.id, parseFloat(e.target.value) || 0)}
                  className="w-20 input-field text-center"
                />
                <span className="text-gray-500">%</span>
              </div>
            </MotionWrapper>
          ))}
        </div>

        {/* Total Validation */}
        <div className={`mt-4 p-3 rounded-lg ${
          sharesValid 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              Total: {totalShares.toFixed(1)}%
            </span>
            {sharesValid ? (
              <span className="text-sm">✓ Valid distribution</span>
            ) : (
              <span className="text-sm">⚠ Must equal 100%</span>
            )}
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Expense Categories
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {family.categories.map((category, index) => (
            <MotionWrapper
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              </div>
              <span className="font-medium text-gray-900">{category.name}</span>
            </MotionWrapper>
          ))}
        </div>
      </div>
    </div>
  )
}