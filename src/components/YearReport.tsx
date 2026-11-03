import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'
import { allCategories } from '../data/categories'

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA'
]

export default function YearReport({ onClose }: { onClose: () => void }) {
  const year = new Date().getFullYear()
  const [view, setView] = useState<'monthly' | 'proportion'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const transactions = useLiveQuery(() => db.transactions.toArray())

  const yearTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => t.date.startsWith(`${year}-`))
  }, [transactions, year])

  const { monthlyData, categoryData, totalExpense, totalIncome } = useMemo(() => {
    const monthly: { month: number; expense: number; income: number }[] = []
    const byCategory: Record<string, number> = {}
    let expense = 0
    let income = 0

    for (let i = 0; i < 12; i++) {
      monthly.push({ month: i, expense: 0, income: 0 })
    }

    for (const t of yearTransactions) {
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

    const sortedCategories = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount], i) => ({
        category: cat,
        icon: allCategories.find((c) => c.label === cat)?.icon || '📝',
        amount,
        percentage: expense > 0 ? (amount / expense) * 100 : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))

    return { monthlyData: monthly, categoryData: sortedCategories, totalExpense: expense, totalIncome: income }
  }, [yearTransactions])

  const maxMonthly = Math.max(...monthlyData.map((m) => m.expense), 1)
  const selectedMonthData = selectedMonth !== null ? monthlyData.find((m) => m.month === selectedMonth) : null

  const selectedMonthCategories = useMemo(() => {
    if (selectedMonth === null) return null
    const cats: Record<string, number> = {}
    for (const t of yearTransactions) {
      const m = parseInt(t.date.split('-')[1]) - 1
      if (m === selectedMonth && t.type === 'expense') {
        cats[t.category] = (cats[t.category] || 0) + t.amount
      }
    }
    return cats
  }, [selectedMonth, yearTransactions])

  const R = 40
  const C = 2 * Math.PI * R

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-md max-h-[80vh] bg-white rounded-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 pb-4 bg-gradient-to-br from-primary/10 via-purple-50/50 to-pink-50/50">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 text-sub flex items-center justify-center text-sm">✕</button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h2 className="text-lg font-bold text-text">{year}年度消费报告</h2>
          </div>
          <p className="text-xs text-sub">看看你的钱都花哪了</p>
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

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-2">
          <button
            onClick={() => { setView('monthly'); setSelectedMonth(null) }}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${view === 'monthly' ? 'bg-primary text-white shadow-sm' : 'bg-bg text-sub'}`}
          >
            📈 每月支出
          </button>
          <button
            onClick={() => { setView('proportion'); setSelectedMonth(null) }}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${view === 'proportion' ? 'bg-primary text-white shadow-sm' : 'bg-bg text-sub'}`}
          >
            🍩 消费占比
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'monthly' ? (
            selectedMonth === null ? (
              <>
                <p className="text-xs text-sub mb-3">点击月份查看分类详情</p>
                <div className="flex items-end gap-1.5 h-40 mb-3">
                  {monthlyData.map((m) => {
                    const height = (m.expense / maxMonthly) * 100
                    const isCurrent = m.month === new Date().getMonth()
                    return (
                      <button
                        key={m.month}
                        onClick={() => m.expense > 0 && setSelectedMonth(m.month)}
                        className="flex-1 flex flex-col items-center justify-end gap-1 group"
                      >
                        <span className="text-[8px] text-sub/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          {m.expense > 0 ? `¥${m.expense.toFixed(0)}` : ''}
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, m.expense > 0 ? 3 : 0)}%` }}
                          transition={{ delay: m.month * 0.04, duration: 0.4 }}
                          className={`w-full rounded-t-lg transition-all ${
                            isCurrent ? 'bg-primary/60'
                            : m.expense > 0 ? 'bg-primary/30 group-hover:bg-primary/50 cursor-pointer'
                            : 'bg-border/20'
                          }`}
                        />
                        <span className={`text-[9px] ${isCurrent ? 'text-primary font-medium' : 'text-sub/60'}`}>
                          {m.month + 1}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={() => setSelectedMonth(null)} className="text-xs text-primary font-medium">← 返回全年</button>
                  <span className="text-sm font-bold text-expense">¥{selectedMonthData?.expense.toFixed(0) || '0'}</span>
                </div>
                <h3 className="text-sm font-medium text-text text-center">{MONTHS[selectedMonth]}消费详情</h3>
                {selectedMonthCategories && Object.keys(selectedMonthCategories).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedMonthCategories)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, amount]) => {
                        const icon = allCategories.find((c) => c.label === cat)?.icon || '📝'
                        const pct = selectedMonthData && selectedMonthData.expense > 0 ? (amount / selectedMonthData.expense) * 100 : 0
                        const color = categoryData.find(c => c.category === cat)?.color || CHART_COLORS[0]
                        return (
                          <div key={cat} className="flex items-center gap-3 p-3 bg-bg rounded-xl">
                            <span className="text-lg">{icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-text font-medium">{cat}</span>
                                <span className="text-xs text-sub">¥{amount.toFixed(0)} ({pct.toFixed(1)}%)</span>
                              </div>
                              <div className="h-1.5 bg-border/30 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5 }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-3xl block mb-2">📭</span>
                    <p className="text-sm text-sub">这个月没有支出记录</p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {categoryData.length > 0 ? (
                <>
                  <div className="relative w-48 h-48 mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {categoryData.reduce<{ els: JSX.Element[]; off: number }>((acc, cat) => {
                        const len = (cat.percentage / 100) * C
                        const gap = 2
                        const actual = Math.max(len - gap, 1)
                        acc.els.push(
                          <circle key={cat.category} cx="50" cy="50" r={R} fill="none" stroke={cat.color} strokeWidth="10"
                            strokeDasharray={`${actual} ${C - actual}`} strokeDashoffset={-acc.off} strokeLinecap="round" />
                        )
                        acc.off += len
                        return acc
                      }, { els: [], off: 0 }).els}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[10px] text-sub">总支出</p>
                      <p className="text-sm font-bold text-text">¥{totalExpense.toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((cat, i) => (
                      <motion.div key={cat.category} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-bg rounded-xl">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                          <span className="text-lg">{cat.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text">{cat.category}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 h-1.5 bg-border/30 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${cat.percentage}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                                className="h-full rounded-full" style={{ backgroundColor: cat.color }} />
                            </div>
                            <span className="text-[10px] text-sub w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-text">¥{cat.amount.toFixed(0)}</span>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-2">📊</span>
                  <p className="text-sm text-sub">今年还没有消费记录</p>
                  <p className="text-xs text-sub/60 mt-1">开始记账后来看报告</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
