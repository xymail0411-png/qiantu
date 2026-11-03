import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'
import { allCategories } from '../data/categories'

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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border text-xs text-sub hover:border-primary transition-colors"
      >
        <span>📊</span>
        <span>消费趋势</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[10px]"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={handleToggle}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl p-4 shadow-lg border border-border z-40 space-y-4"
            >
              {/* Stats summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-bg rounded-xl">
                  <p className="text-lg font-medium text-primary">{checkInCount}</p>
                  <p className="text-[10px] text-sub">打卡天数</p>
                </div>
                <div className="text-center p-2 bg-bg rounded-xl">
                  <p className="text-lg font-medium text-expense">¥{totalExpense.toFixed(0)}</p>
                  <p className="text-[10px] text-sub">本月支出</p>
                </div>
                <div className="text-center p-2 bg-bg rounded-xl">
                  <p className="text-lg font-medium text-text">¥{avgExpense.toFixed(0)}</p>
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
                        className={`relative aspect-square flex items-center justify-center rounded-lg text-[10px] ${
                          isToday
                            ? 'bg-primary/10 text-primary font-medium ring-1 ring-primary/30'
                            : isCheckedIn
                            ? 'bg-primary/5 text-primary'
                            : 'bg-bg/50 text-sub/40'
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
                        className="flex items-center gap-3 p-2.5 bg-bg rounded-xl"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
