import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { allCategories } from '../data/categories'
import { useAppStore } from '../store'
import { motion } from 'framer-motion'

function getCategoryIcon(label: string): string {
  return allCategories.find((c) => c.label === label)?.icon || '📝'
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (dateStr === today.toISOString().slice(0, 10)) return '今天'
  if (dateStr === yesterday.toISOString().slice(0, 10)) return '昨天'
  if (dateStr === tomorrow.toISOString().slice(0, 10)) return '明天'

  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${month}月${day}日 周${weekdays[d.getDay()]}`
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  const month = d.getMonth() + 1
  const day = d.getDate()
  return `${month}/${day}`
}

export default function Timeline() {
  const { currentDate, recordFilter, setRecordFilter, goPrevDay, goNextDay, goToday, openCategoryPage } = useAppStore()

  const transactions = useLiveQuery(
    () => db.transactions
      .where('date')
      .equals(currentDate)
      .sortBy('createdAt'),
    [currentDate]
  )

  const today = new Date().toISOString().slice(0, 10)
  const isToday = currentDate === today

  const dayExpense = transactions?.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0) || 0
  const dayIncome = transactions?.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) || 0
  const balance = dayIncome - dayExpense

  const filteredTransactions = transactions?.filter((t) => {
    if (recordFilter === 'all') return true
    return t.type === recordFilter
  }) || []

  return (
    <div className="flex-1 flex flex-col">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={goPrevDay}
          className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-sub hover:border-primary transition-colors"
        >
          ‹
        </button>

        <button
          onClick={goToday}
          className={`text-sm font-medium transition-colors ${
            isToday ? 'text-primary' : 'text-text'
          }`}
        >
          {formatDateLabel(currentDate)}
          <span className="text-sub font-normal ml-1">{formatShortDate(currentDate)}</span>
        </button>

        <button
          onClick={goNextDay}
          className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-sub hover:border-primary transition-colors"
        >
          ›
        </button>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <button
          onClick={() => setRecordFilter(recordFilter === 'expense' ? 'all' : 'expense')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
            recordFilter === 'expense'
              ? 'bg-expense text-white shadow-sm'
              : 'bg-expense/10 text-expense'
          }`}
        >
          −
        </button>

        <div className="flex-1 flex items-center justify-center gap-3 text-xs">
          <span className="text-expense">
            支出 <span className="font-medium">¥{dayExpense.toFixed(2)}</span>
          </span>
          <span className="text-border">|</span>
          <span className="text-income">
            收入 <span className="font-medium">¥{dayIncome.toFixed(2)}</span>
          </span>
          <span className="text-border">|</span>
          <span className={balance >= 0 ? 'text-income' : 'text-expense'}>
            结余 <span className="font-medium">{balance >= 0 ? '+' : ''}¥{balance.toFixed(2)}</span>
          </span>
        </div>

        <button
          onClick={() => setRecordFilter(recordFilter === 'income' ? 'all' : 'income')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
            recordFilter === 'income'
              ? 'bg-income text-white shadow-sm'
              : 'bg-income/10 text-income'
          }`}
        >
          +
        </button>
      </div>

      {/* Timeline records */}
      <div className="flex-1">
        {filteredTransactions.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

            {filteredTransactions.map((t, i) => {
              const time = new Date(t.createdAt).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex items-center justify-between py-3.5 border-b border-border/50 last:border-0"
                >
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-white border-2 border-border flex items-center justify-center text-[10px]">
                    {getCategoryIcon(t.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{t.category}</span>
                      <span className="text-xs text-sub">{time}</span>
                    </div>
                    {t.note && (
                      <p className="text-xs text-sub mt-0.5 truncate">{t.note}</p>
                    )}
                  </div>

                  <span className={`text-sm font-medium ${
                    t.type === 'expense' ? 'text-expense' : 'text-income'
                  }`}>
                    {t.type === 'expense' ? '-' : '+'}¥{t.amount.toFixed(2)}
                  </span>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-4xl mb-3 opacity-30">📝</span>
            <p className="text-sm text-sub">
              {recordFilter !== 'all'
                ? `这天没有${recordFilter === 'expense' ? '支出' : '收入'}记录`
                : '这天还没有记录'}
            </p>
            <p className="text-xs text-sub/60 mt-1">点击右下角铅笔开始记账</p>
          </div>
        )}
      </div>

      {/* Floating action button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openCategoryPage}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center text-2xl z-30"
      >
        ✏️
      </motion.button>
    </div>
  )
}
