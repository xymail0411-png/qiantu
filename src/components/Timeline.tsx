import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { allCategories } from '../data/categories'
import { useAppStore } from '../store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

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

function SwipeableRecord({ t, i, onDelete }: { t: any; i: number; onDelete: (id: number) => void }) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    if (diff < 0) {
      setOffset(Math.max(diff, -80))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offset < -40) {
      setOffset(-80)
    } else {
      setOffset(0)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    currentX.current = e.clientX
    const diff = currentX.current - startX.current
    if (diff < 0) {
      setOffset(Math.max(diff, -80))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (offset < -40) {
      setOffset(-80)
    } else {
      setOffset(0)
    }
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        if (offset < -40) {
          setOffset(-80)
        } else {
          setOffset(0)
        }
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging, offset])

  const time = new Date(t.createdAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="relative overflow-hidden rounded-lg mb-1">
      {/* Delete button background */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-expense flex items-center justify-center">
        <button
          onClick={() => onDelete(t.id!)}
          className="text-white text-sm font-medium px-4 py-2"
        >
          删除
        </button>
      </div>

      {/* Record content */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: offset }}
        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
        className="relative flex items-center justify-between py-3.5 px-4 bg-white border-b border-border/50 last:border-0 touch-none"
        title="左滑删除记录"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base">{getCategoryIcon(t.category)}</span>
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
    </div>
  )
}

export default function Timeline() {
  const { currentDate, recordFilter, setRecordFilter, goPrevDay, goNextDay, goToday, openCategoryPage } = useAppStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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

  const handleDeleteRecord = async (id: number) => {
    await db.transactions.delete(id)
  }

  const handleResetToday = async () => {
    await db.transactions.where('date').equals(today).delete()
    setShowResetConfirm(false)
  }

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

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className={`text-sm font-medium transition-colors ${
              isToday ? 'text-primary' : 'text-text'
            }`}
          >
            {formatDateLabel(currentDate)}
            <span className="text-sub font-normal ml-1">{formatShortDate(currentDate)}</span>
          </button>

          {isToday && filteredTransactions.length > 0 && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sub/40 hover:text-expense hover:bg-expense/10 transition-colors"
              title="重置今日记录"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>

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

      {/* Reset confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-medium text-text mb-2">重置今日记录？</h3>
              <p className="text-sm text-sub mb-4">将删除今天的所有记账记录，此操作不可恢复。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-bg text-text text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleResetToday}
                  className="flex-1 py-2.5 rounded-xl bg-expense text-white text-sm font-medium"
                >
                  确认重置
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline records */}
      <div className="flex-1">
        {filteredTransactions.length > 0 ? (
          <div>
            {filteredTransactions.map((t, i) => (
              <SwipeableRecord
                key={t.id}
                t={t}
                i={i}
                onDelete={handleDeleteRecord}
              />
            ))}
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
