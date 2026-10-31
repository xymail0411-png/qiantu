import { motion } from 'framer-motion'
import { expenseCategories, incomeCategories } from '../data/categories'
import { useAppStore } from '../store'
import type { Category } from '../data/categories'

function CategoryButton({ cat, index }: { cat: Category; index: number }) {
  const { openAmountInput } = useAppStore()

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => openAmountInput(cat)}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-border flex items-center justify-center text-2xl transition-shadow hover:shadow-md">
        {cat.icon}
      </div>
      <span className="text-xs text-sub">{cat.label}</span>
    </motion.button>
  )
}

export default function CategoryGrid() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-medium text-sub mb-3 px-1">支出</h3>
        <div className="grid grid-cols-6 gap-3">
          {expenseCategories.map((cat, i) => (
            <CategoryButton key={cat.label} cat={cat} index={i} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-sub mb-3 px-1">收入</h3>
        <div className="grid grid-cols-6 gap-3">
          {incomeCategories.map((cat, i) => (
            <CategoryButton key={cat.label} cat={cat} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
