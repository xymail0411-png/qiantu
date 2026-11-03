import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'
import { allCategories } from '../data/categories'
import { exportToCSV } from '../utils/export'

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export default function DataDropdown({ onOpenChange }: { onOpenChange?: (isOpen: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    onOpenChange?.(newState)
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()

  const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`

  const transactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .between(monthStart, monthEnd + 'Z', true, true)
      .toArray(),
    [monthStart, monthEnd]
  )

  const [checkInDays, setCheckInDays] = useState<Set<number>>(new Set())
  const [dayMoodMap, setDayMoodMap] = useState<Map<number, string>>(new Map())

  const todayStr = now.toISOString().slice(0, 10)
  const todayTransactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .equals(todayStr)
      .filter(t => t.type === 'expense')
      .toArray(),
    [todayStr]
  )

  const topItems = useMemo(() => {
    if (!todayTransactions) return []
    return todayTransactions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({
        name: t.note || t.category,
        amount: t.amount,
        icon: allCategories.find(c => c.label === t.category)?.icon || '📝',
        time: new Date(t.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      }))
  }, [todayTransactions])

  useEffect(() => {
    if (!transactions) return

    const days = new Set<number>()
    const moodByDay: Record<number, string[]> = {}

    for (const t of transactions) {
      const day = parseInt(t.date.split('-')[2])
      days.add(day)

      if (t.mood) {
        if (!moodByDay[day]) moodByDay[day] = []
        moodByDay[day].push(t.mood)
      }
    }

    const modeMap = new Map<number, string>()
    for (const [dayStr, moods] of Object.entries(moodByDay)) {
      const freq: Record<string, number> = {}
      for (const m of moods) freq[m] = (freq[m] || 0) + 1
      const mode = Object.entries(freq).sort(([, a], [, b]) => b - a)[0][0]
      modeMap.set(parseInt(dayStr), mode)
    }

    setCheckInDays(days)
    setDayMoodMap(modeMap)
  }, [transactions])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const totalExpense = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
  const checkInCount = checkInDays.size
  const avgExpense = checkInCount > 0 ? totalExpense / checkInCount : 0

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-dashed border-border hover:border-coral transition-colors group shadow-warm"
      >
        <span className="text-base">📊</span>
        <span className="text-sm text-sub group-hover:text-coral transition-colors font-medium">消费趋势</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-sub/60"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
            onClick={handleToggle}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-md max-h-[80vh] bg-white rounded-3xl overflow-hidden flex flex-col border-2 border-dashed border-border shadow-cute"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-5 pb-4 bg-gradient-to-br from-coral-light/20 via-lavender-light/20 to-cream-dark">
                <button onClick={handleToggle} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 text-sub flex items-center justify-center text-sm hover:text-coral transition-colors">✕</button>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-lg font-bold text-text">消费趋势</h2>
                </div>
                <p className="text-xs text-sub">看看你的消费情况</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Stats summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-coral-light/30 rounded-2xl border border-coral/20">
                    <p className="text-lg font-bold text-coral">{checkInCount}</p>
                    <p className="text-[10px] text-sub">打卡天数</p>
                  </div>
                  <div className="text-center p-2 bg-lavender-light/35 rounded-2xl border border-lavender/20">
                    <p className="text-lg font-bold text-expense">¥{totalExpense.toFixed(0)}</p>
                    <p className="text-[10px] text-sub">本月支出</p>
                  </div>
                  <div className="text-center p-2 bg-mint-light/35 rounded-2xl border border-mint/20">
                    <p className="text-lg font-bold text-text">¥{avgExpense.toFixed(0)}</p>
                    <p className="text-[10px] text-sub">日均消费</p>
                  </div>
                </div>

              {/* Check-in scatter plot (calendar view) */}
              <div>
                <p className="text-xs text-sub mb-2">📅 打卡日历</p>
                <div className="grid grid-cols-7 gap-1">
                  {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                    <div key={d} className="text-center text-[10px] text-sub/60 py-1">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const isCheckedIn = checkInDays.has(day)
                    const isToday = day === today
                    const dayMood = dayMoodMap.get(day)

                    return (
                      <div
                        key={day}
                        className={`relative aspect-square flex items-center justify-center rounded-xl text-[10px] ${
                          isToday
                            ? 'bg-coral-light/35 text-coral font-bold ring-2 ring-coral/30'
                            : isCheckedIn
                            ? 'bg-mint-light/35 text-mint'
                            : 'bg-cream-dark/50 text-sub/40'
                        }`}
                      >
                        {isCheckedIn ? (
                          dayMood ? (
                            <span className="text-xs">{dayMood}</span>
                          ) : (
                            <span>✓</span>
                          )
                        ) : (
                          <span>{day}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Today's top spending items */}
              {topItems.length > 0 && (
                <div>
                  <p className="text-xs text-sub mb-2">🛍️ 今日消费明细</p>
                  <div className="space-y-2">
                    {topItems.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2.5 bg-cream-dark rounded-2xl border border-border/50"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-text">{item.name}</p>
                          <p className="text-[10px] text-sub">{item.time}</p>
                        </div>
                        <span className="text-sm font-medium text-expense">-¥{item.amount.toFixed(2)}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export CSV button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToCSV()}
                className="w-full py-3 text-xs text-coral font-bold bg-coral-light/25 rounded-2xl border-2 border-dashed border-coral/30 hover:bg-coral-light/35 transition-colors"
              >
                📥 导出CSV数据
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
}
