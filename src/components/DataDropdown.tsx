import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

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
  const [dailyExpenses, setDailyExpenses] = useState<{ day: number; amount: number }[]>([])

  useEffect(() => {
    if (!transactions) return

    const days = new Set<number>()
    const moodByDay: Record<number, string[]> = {}
    const daily: Record<number, number> = {}

    for (const t of transactions) {
      const day = parseInt(t.date.split('-')[2])
      days.add(day)

      if (t.mood) {
        if (!moodByDay[day]) moodByDay[day] = []
        moodByDay[day].push(t.mood)
      }

      if (t.type === 'expense') {
        daily[day] = (daily[day] || 0) + t.amount
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
    setDailyExpenses(
      Object.entries(daily).map(([d, amount]) => ({ day: parseInt(d), amount }))
    )
  }, [transactions])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const maxExpense = Math.max(...dailyExpenses.map((d) => d.amount), 1)

  const totalExpense = dailyExpenses.reduce((sum, d) => sum + d.amount, 0)
  const checkInCount = checkInDays.size
  const avgExpense = checkInCount > 0 ? totalExpense / checkInCount : 0

  return (
    <div className="mb-4">
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-border space-y-4">
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

              {/* Daily expense bar chart */}
              {dailyExpenses.length > 0 && (
                <div>
                  <p className="text-xs text-sub mb-2">📈 每日支出</p>
                  <div className="flex items-end gap-0.5 h-16">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1
                      const expense = dailyExpenses.find((d) => d.day === day)
                      const height = expense ? (expense.amount / maxExpense) * 100 : 0
                      const isToday = day === today

                      return (
                        <div
                          key={day}
                          className="flex-1 flex flex-col items-center justify-end"
                          title={`${day}日: ¥${expense?.amount.toFixed(2) || '0'}`}
                        >
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ delay: i * 0.02, duration: 0.3 }}
                            className={`w-full rounded-t-sm min-h-[2px] ${
                              isToday
                                ? 'bg-primary'
                                : expense
                                ? 'bg-expense/60'
                                : 'bg-border/30'
                            }`}
                          />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-sub/60">1日</span>
                    <span className="text-[9px] text-sub/60">{daysInMonth}日</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
