import { expenseCategories, incomeCategories } from '../data/categories'
import { useAppStore } from '../store'
import type { Category } from '../data/categories'
import { motion } from 'framer-motion'
import { useState } from 'react'

function CategoryButton({ cat, index, onClick }: { cat: Category; index: number; onClick: (cat: Category) => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onClick(cat)}
      className="flex flex-col items-center gap-1.5"
    >
    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center text-2xl transition-shadow hover:shadow-md">
        {cat.icon}
      </div>
      <span className="text-xs text-sub">{cat.label}</span>
    </motion.button>
  )
}

export default function CategoryPage() {
  const { showCategoryPage, closeCategoryPage, openAmountInput } = useAppStore()
  const [lastCategory, setLastCategory] = useState<Category | null>(null)

  if (!showCategoryPage) return null

  const handleCategoryClick = (cat: Category) => {
    setLastCategory(cat)
    openAmountInput(cat)
  }

  const handleRecordAgain = () => {
    if (lastCategory) {
      openAmountInput(lastCategory)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg">
      <div className="max-w-md mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <button
            onClick={closeCategoryPage}
            className="text-sub text-sm flex items-center gap-1"
          >
            <span>←</span> 返回
          </button>
          <h2 className="text-base font-medium text-text">记账</h2>
          {lastCategory && (
            <button
              onClick={handleRecordAgain}
              className="text-primary text-sm font-medium"
            >
              再记一笔
            </button>
          )}
          {!lastCategory && <div className="w-16" />}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-expense rounded-full" />
              <h3 className="text-sm font-medium text-text">支出</h3>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {expenseCategories.map((cat, i) => (
                <CategoryButton key={cat.label} cat={cat} index={i} onClick={handleCategoryClick} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-income rounded-full" />
              <h3 className="text-sm font-medium text-text">收入</h3>
            </div>
            <div className="grid grid-cols-5 gap-4">
              {incomeCategories.map((cat, i) => (
                <CategoryButton key={cat.label} cat={cat} index={i} onClick={handleCategoryClick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
