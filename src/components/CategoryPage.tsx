import { expenseCategories, incomeCategories } from '../data/categories'
import { useAppStore } from '../store'
import type { Category } from '../data/categories'
import { motion } from 'framer-motion'

const macaronColors = [
  'bg-coral-light/50', 'bg-lavender-light/50', 'bg-mint-light/50', 'bg-cream-dark',
  'bg-warm-yellow/40', 'bg-warm-blue/45', 'bg-coral-light/40', 'bg-lavender-light/45',
]

function CategoryButton({ cat, index, onClick }: { cat: Category; index: number; onClick: (cat: Category) => void }) {
  const rotate = index % 2 === 0 ? 'rotate-[0.5deg]' : '-rotate-[0.5deg]'
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05, rotate: 0 }}
      onClick={() => onClick(cat)}
      className="flex flex-col items-center gap-1.5"
    >
      <div className={`w-14 h-14 rounded-2xl ${macaronColors[index % macaronColors.length]} shadow-warm border border-border/50 flex items-center justify-center text-2xl transition-shadow hover:shadow-soft ${rotate}`}>
        {cat.icon}
      </div>
      <span className="text-xs text-sub font-medium">{cat.label}</span>
    </motion.button>
  )
}

export default function CategoryPage() {
  const { showCategoryPage, closeCategoryPage, openAmountInput } = useAppStore()

  if (!showCategoryPage) return null

  const handleCategoryClick = (cat: Category) => {
    openAmountInput(cat)
  }

  return (
    <div className="fixed inset-0 z-50 bg-cream md:bg-black/30 md:flex md:items-center md:justify-center" onClick={closeCategoryPage}>
      <div className="max-w-2xl lg:max-w-3xl mx-auto h-full flex flex-col md:h-[90vh] md:rounded-3xl md:shadow-cute md:border-2 md:border-dashed md:border-border bg-cream" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button
            onClick={closeCategoryPage}
            className="text-sub text-sm flex items-center gap-1 hover:text-coral transition-colors"
          >
            <span>←</span> 返回
          </button>
          <h2 className="text-base font-bold text-text">✏️ 记账</h2>
          <div className="w-16" />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-coral rounded-full" />
              <h3 className="text-sm font-bold text-text">支出</h3>
              <span className="text-xs opacity-30">🌸</span>
            </div>
            <div className="grid grid-cols-5 gap-4 md:grid-cols-7 lg:grid-cols-8">
              {expenseCategories.map((cat, i) => (
                <CategoryButton key={cat.label} cat={cat} index={i} onClick={handleCategoryClick} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-income rounded-full" />
              <h3 className="text-sm font-bold text-text">收入</h3>
              <span className="text-xs opacity-30">✨</span>
            </div>
            <div className="grid grid-cols-5 gap-4 md:grid-cols-7 lg:grid-cols-8">
              {incomeCategories.map((cat, i) => (
                <CategoryButton key={cat.label} cat={cat} index={i + expenseCategories.length} onClick={handleCategoryClick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
