import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'
import { allCategories } from '../data/categories'

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const GAME_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA'
]

interface MonthData {
  month: number
  expense: number
  income: number
}

interface CategoryData {
  category: string
  icon: string
  amount: number
  percentage: number
  color: string
}

export default function YearReport({ onClose }: { onClose: () => void }) {
  const year = new Date().getFullYear()
  const [view, setView] = useState<'trend' | 'proportion'>('trend')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const transactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .between(yearStart, yearEnd + 'Z', true, true)
      .toArray(),
    [yearStart, yearEnd]
  )

  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)

  useEffect(() => {
    if (!transactions) return

    const monthly: Record<number, { expense: number; income: number }> = {}
    const byCategory: Record<string, number> = {}
    let expense = 0
    let income = 0

    for (let i = 0; i < 12; i++) {
      monthly[i] = { expense: 0, income: 0 }
    }

    for (const t of transactions) {
      const month = parseInt(t.date.split('-')[1]) - 1
      if (t.type === 'expense') {
        monthly[month].expense += t.amount
        expense += t.amount
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
      } else {
        monthly[month].income += t.amount
        income += t.amount
      }
    }

    setMonthlyData(
      Object.entries(monthly).map(([m, data]) => ({
        month: parseInt(m),
        ...data,
      }))
    )

    setTotalExpense(expense)
    setTotalIncome(income)

    const sortedCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount], i) => ({
        category: cat,
        icon: allCategories.find((c) => c.label === cat)?.icon || '📝',
        amount,
        percentage: expense > 0 ? (amount / expense) * 100 : 0,
        color: GAME_COLORS[i % GAME_COLORS.length],
      }))

    setCategoryData(sortedCategories)
  }, [transactions])

  const maxMonthly = Math.max(...monthlyData.map((m) => m.expense), 1)

  const selectedMonthData = selectedMonth !== null ? monthlyData.find((m) => m.month === selectedMonth) : null
  const selectedMonthCategories = selectedMonth !== null
    ? transactions
        ?.filter((t) => {
          const m = parseInt(t.date.split('-')[1]) - 1
          return m === selectedMonth && t.type === 'expense'
        })
        .reduce<Record<string, number>>((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount
          return acc
        }, {}) || {}
    : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-md max-h-[85vh] bg-white rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 pb-4 bg-gradient-to-br from-primary/10 via-purple-50/50 to-pink-50/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 text-sub flex items-center justify-center text-sm"
          >
            ✕
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎮</span>
            <h2 className="text-lg font-bold text-text">{year}年度报告</h2>
          </div>
          <p className="text-xs text-sub">你的消费冒险之旅</p>

          {/* Summary badges */}
          <div className="flex gap-2 mt-4">
            <div className="flex-1 px-3 py-2 bg-white/80 rounded-xl backdrop-blur">
              <p className="text-[10px] text-sub">总支出</p>
              <p className="text-sm font-bold text-expense">¥{totalExpense.toFixed(0)}</p>
            </div>
            <div className="flex-1 px-3 py-2 bg-white/80 rounded-xl backdrop-blur">
              <p className="text-[10px] text-sub">总收入</p>
              <p className="text-sm font-bold text-income">¥{totalIncome.toFixed(0)}</p>
            </div>
            <div className="flex-1 px-3 py-2 bg-white/80 rounded-xl backdrop-blur">
              <p className="text-[10px] text-sub">结余</p>
              <p className="text-sm font-bold text-primary">¥{(totalIncome - totalExpense).toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex px-5 pt-3 gap-2">
          <button
            onClick={() => { setView('trend'); setSelectedMonth(null) }}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              view === 'trend'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-bg text-sub'
            }`}
          >
            📈 月度趋势
          </button>
          <button
            onClick={() => setView('proportion')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
              view === 'proportion'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-bg text-sub'
            }`}
          >
            🍩 消费占比
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'trend' ? (
            <div>
              {/* Monthly bar chart */}
              <div className="flex items-end gap-1.5 h-40 mb-3">
                {monthlyData.map((m) => {
                  const height = (m.expense / maxMonthly) * 100
                  const isSelected = selectedMonth === m.month
                  const isCurrentMonth = m.month === new Date().getMonth()

                  return (
                    <button
                      key={m.month}
                      onClick={() => setSelectedMonth(isSelected ? null : m.month)}
                      className="flex-1 flex flex-col items-center justify-end gap-1 group"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 2)}%` }}
                        transition={{ delay: m.month * 0.05, duration: 0.4 }}
                        className={`w-full rounded-t-lg transition-all ${
                          isSelected
                            ? 'bg-primary shadow-md shadow-primary/30'
                            : isCurrentMonth
                            ? 'bg-primary/40'
                            : m.expense > 0
                            ? 'bg-expense/40 group-hover:bg-expense/60'
                            : 'bg-border/30'
                        }`}
                      />
                      <span className={`text-[9px] ${
                        isSelected ? 'text-primary font-medium' : 'text-sub/60'
                      }`}>
                        {MONTHS[m.month].replace('月', '')}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Selected month detail */}
              <AnimatePresence>
                {selectedMonth !== null && selectedMonthData && selectedMonthCategories && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-bg rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-text">
                          {MONTHS[selectedMonth]}消费详情
                        </h3>
                        <span className="text-sm font-bold text-expense">
                          ¥{selectedMonthData.expense.toFixed(2)}
                        </span>
                      </div>

                      {Object.entries(selectedMonthCategories)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, amount]) => {
                          const icon = allCategories.find((c) => c.label === cat)?.icon || '📝'
                          const pct = selectedMonthData.expense > 0 ? (amount / selectedMonthData.expense) * 100 : 0
                          return (
                            <div key={cat} className="flex items-center gap-2">
                              <span className="text-base">{icon}</span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-text">{cat}</span>
                                  <span className="text-xs text-sub">¥{amount.toFixed(0)} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.5 }}
                                    className="h-full bg-primary rounded-full"
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}

                      {Object.keys(selectedMonthCategories).length === 0 && (
                        <p className="text-xs text-sub text-center py-2">这个月没有支出记录</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Donut chart */}
              <div className="relative w-48 h-48 mx-auto">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {categoryData.reduce<{ elements: JSX.Element[]; offset: number }>(
                    (acc, cat, i) => {
                      const circumference = 2 * Math.PI * 40
                      const strokeLength = (cat.percentage / 100) * circumference
                      const strokeOffset = acc.offset

                      acc.elements.push(
                        <motion.circle
                          key={cat.category}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={cat.color}
                          strokeWidth="12"
                          strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                          strokeDashoffset={-strokeOffset}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: strokeLength }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          strokeLinecap="round"
                        />
                      )

                      acc.offset += strokeLength
                      return acc
                    },
                    { elements: [], offset: 0 }
                  ).elements}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl">🏆</span>
                  <p className="text-xs text-sub mt-1">年度消费</p>
                  <p className="text-sm font-bold text-text">¥{totalExpense.toFixed(0)}</p>
                </div>
              </div>

              {/* Category list */}
              <div className="space-y-2">
                {categoryData.map((cat, i) => (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-bg rounded-xl"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <span className="text-lg">{cat.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">{cat.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="text-[10px] text-sub w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-text">¥{cat.amount.toFixed(0)}</span>
                  </motion.div>
                ))}

                {categoryData.length === 0 && (
                  <div className="text-center py-8">
                    <span className="text-4xl block mb-2">📊</span>
                    <p className="text-sm text-sub">还没有消费记录</p>
                    <p className="text-xs text-sub/60 mt-1">开始记账后来看年度报告</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
