'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { Family, Category } from '@/types'

interface CategoryManagerProps {
  family: Family
  onUpdate: (family: Family) => void
}

export default function CategoryManager({ family, onUpdate }: CategoryManagerProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' })
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', color: '' })
  
  const categories = family.categories

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const category: Category = {
        id: Date.now().toString(),
        name: newCategory.name.trim(),
        color: newCategory.color,
        icon: 'tag',
        familyId: family.id,
      }
      onUpdate({ ...family, categories: [...categories, category] })
      setNewCategory({ name: '', color: '#3B82F6' })
      setIsAdding(false)
    }
  }

  const handleEditCategory = (id: string) => {
    const category = categories.find(c => c.id === id)
    if (category) {
      setEditForm({ name: category.name, color: category.color })
      setEditingId(id)
    }
  }

  const handleSaveEdit = () => {
    if (editForm.name.trim() && editingId) {
      const updatedCategories = categories.map(cat =>
        cat.id === editingId
          ? { ...cat, name: editForm.name.trim(), color: editForm.color }
          : cat
      )
      onUpdate({ ...family, categories: updatedCategories })
      setEditingId(null)
      setEditForm({ name: '', color: '' })
    }
  }

  const handleDeleteCategory = (id: string) => {
    const updatedCategories = categories.filter(cat => cat.id !== id)
    onUpdate({ ...family, categories: updatedCategories })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('categories.title')}</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('categories.addCategory')}
        </button>
      </div>

      {/* Add new category form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={t('categories.name')}
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="input-field flex-1"
            />
            <div className="flex items-center gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewCategory({ ...newCategory, color })}
                  className={`w-6 h-6 rounded-full border-2 ${
                    newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              onClick={handleAddCategory}
              className="btn-primary p-2"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="btn-secondary p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      <div className="space-y-3">
        {categories.map(category => (
          <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            {editingId === category.id ? (
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field flex-1"
                />
                <div className="flex items-center gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditForm({ ...editForm, color })}
                      className={`w-6 h-6 rounded-full border-2 ${
                        editForm.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary p-2"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="btn-secondary p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditCategory(category.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}