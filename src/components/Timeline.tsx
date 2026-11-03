import { db } from '../db'
import { allCategories } from '../data/categories'
import { useAppStore } from '../store'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, memo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

function getCategoryIcon(label: string): string {
  return allCategories.find((c) => c.label === label)?.icon || '📝'
}

function getCategoryObj(label: string) {
  return allCategories.find((c) => c.label === label) || allCategories[0]
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

const SwipeableRecord = memo(function SwipeableRecord({ t, i, onDelete, onEdit }: { t: any; i: number; onDelete: (id: number) => void; onEdit: (t: any) => void }) {
  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const SWIPE_MAX = -140

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    if (diff < 0) {
      setOffset(Math.max(diff, SWIPE_MAX))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (offset < -50) {
      setOffset(SWIPE_MAX)
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
      setOffset(Math.max(diff, SWIPE_MAX))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (offset < -50) {
      setOffset(SWIPE_MAX)
    } else {
      setOffset(0)
    }
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
        if (offset < -50) {
          setOffset(SWIPE_MAX)
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
      {/* Action buttons background */}
      <div className="absolute right-0 top-0 bottom-0 flex">
        <button
          onClick={() => onEdit(t)}
          className="w-[70px] bg-lavender flex items-center justify-center h-full"
        >
          <span className="text-white text-xs font-bold">编辑</span>
        </button>
        <button
          onClick={() => onDelete(t.id!)}
          className="w-[70px] bg-expense flex items-center justify-center h-full"
        >
          <span className="text-white text-xs font-bold">删除</span>
        </button>
      </div>

      {/* Record content */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: offset }}
        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 30 }}
        className="relative flex items-center justify-between py-3.5 px-4 bg-white border-b border-border/50 last:border-0 touch-none"
        title="左滑编辑/删除记录"
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
            {t.mood && <span className="text-sm">{t.mood}</span>}
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
})

export default function Timeline({ collapsedByParent = false }: { collapsedByParent?: boolean }) {
  const { currentDate, recordFilter, setRecordFilter, goPrevDay, goNextDay, goToday, openCategoryPage, openEditTransaction } = useAppStore()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const MAX_VISIBLE_RECORDS = 5
  const shouldCollapse = collapsedByParent || !isExpanded

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
    const tx = await db.transactions.get(id)
    if (!tx) return

    await db.transactions.delete(id)

    if (tx.date && tx.type === 'expense') {
      const boxRecord = await db.boxHistory.where('date').equals(tx.date).first()
      if (boxRecord) {
        await db.boxHistory.delete(boxRecord.id!)
        await db.achievements.where('prizeId').equals(boxRecord.prizeId).and(a => a.unlockedAt >= boxRecord.openedAt - 1000 && a.unlockedAt <= boxRecord.openedAt + 1000).delete()
      }
    }
  }

  const handleEditRecord = (tx: any) => {
    const cat = getCategoryObj(tx.category)
    openEditTransaction(
      {
        id: tx.id,
        date: tx.date,
        category: tx.category,
        amount: tx.amount,
        type: tx.type,
        note: tx.note,
        mood: tx.mood,
      },
      cat
    )
  }

  const handleResetToday = async () => {
    await db.transactions.where('date').equals(today).delete()
    setShowResetConfirm(false)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goPrevDay}
          className="w-9 h-9 rounded-full bg-white border-2 border-dashed border-border flex items-center justify-center text-sub hover:border-coral hover:text-coral transition-colors shadow-warm"
        >
          ‹
        </motion.button>

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className={`text-sm font-bold transition-colors ${
              isToday ? 'text-coral' : 'text-text'
            }`}
          >
            {formatDateLabel(currentDate)}
            <span className="text-sub font-normal ml-1">{formatShortDate(currentDate)}</span>
          </button>

          {isToday && filteredTransactions.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setShowResetConfirm(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sub/40 hover:text-expense hover:bg-expense/10 transition-colors"
              title="重置今日记录"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </motion.button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goNextDay}
          className="w-9 h-9 rounded-full bg-white border-2 border-dashed border-border flex items-center justify-center text-sub hover:border-coral hover:text-coral transition-colors shadow-warm"
        >
          ›
        </motion.button>
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
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredTransactions.length > 0 ? (
          <div>
            {(shouldCollapse ? filteredTransactions.slice(0, MAX_VISIBLE_RECORDS) : filteredTransactions).map((t, i) => (
              <SwipeableRecord
                key={t.id}
                t={t}
                i={i}
                onDelete={handleDeleteRecord}
                onEdit={handleEditRecord}
              />
            ))}
 {filteredTransactions.length > MAX_VISIBLE_RECORDS && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-3 text-xs text-coral font-bold bg-cream-dark/50 hover:bg-cream-dark transition-colors rounded-2xl"
              >
                {isExpanded ? '收起 🌸' : `展开更多 (${filteredTransactions.length - MAX_VISIBLE_RECORDS}条) ✨`}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 relative">
            <span className="absolute top-4 left-8 text-lg opacity-[0.08]">☁️</span>
            <span className="absolute top-8 right-12 text-sm opacity-[0.06]">✨</span>
            <span className="absolute bottom-6 left-16 text-sm opacity-[0.07]">🌸</span>
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
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        onClick={openCategoryPage}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 md:right-[calc(50%-13rem)] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-coral text-white shadow-cute flex items-center justify-center text-xl sm:text-2xl z-30"
      >
        ✏️
      </motion.button>
    </div>
  )
}
