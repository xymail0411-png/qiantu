import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { db } from '../db'
import { useAppStore } from '../store'
import { defaultEquivalents } from '../data/equivalents'

export default function AmountInput() {
  const { showAmountInput, selectedCategory, currentDate, editingTransaction, closeAmountInput, closeCategoryPage } = useAppStore()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [mood, setMood] = useState('')
  const [date, setDate] = useState(currentDate)
  const [showHint, setShowHint] = useState(false)
  const [hintText, setHintText] = useState('')
  const hintTimeoutRef = useRef<number | null>(null)

  const isEditing = editingTransaction !== null
  const moods = ['😊', '😐', '😔', '😤', '🤩', '😴', '🥳', '😰']

  useEffect(() => {
    if (editingTransaction) {
      setAmount(String(editingTransaction.amount))
      setNote(editingTransaction.note || '')
      setMood(editingTransaction.mood || '')
      setDate(editingTransaction.date)
    } else {
      setAmount('')
      setNote('')
      setMood('')
      setDate(currentDate)
    }
  }, [editingTransaction, currentDate])

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current)
      }
    }
  }, [])

  if (!selectedCategory) return null

  const getEquivalentHint = (num: number): { icon: string; text: string } | null => {
    let bestMatch: { icon: string; text: string; score: number } | null = null

    for (const eq of defaultEquivalents) {
      const count = num / eq.price
      if (count >= 1) {
        // For large amounts, use higher-priced items; for small amounts, use lower-priced
        const wholeNumberScore = 1 - Math.abs(count - Math.round(count))
        // Prefer counts that are readable: 1-1000 range
        const rangeScore = count <= 1000 ? 1 : 0.3
        const score = wholeNumberScore * rangeScore

        if (!bestMatch || score > bestMatch.score) {
          let displayCount: string
          if (count >= 1000) {
            displayCount = (count / 1000).toFixed(1) + 'k'
          } else if (count >= 100) {
            displayCount = Math.floor(count).toString()
          } else if (count >= 10) {
            displayCount = Math.floor(count).toString()
          } else {
            displayCount = count.toFixed(1)
          }
          bestMatch = {
            icon: eq.icon,
            text: `${displayCount}${eq.name}`,
            score,
          }
        }
      }
    }

    return bestMatch ? { icon: bestMatch.icon, text: bestMatch.text } : null
  }

  const handleConfirm = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    if (isEditing && editingTransaction) {
      await db.transactions.update(editingTransaction.id, {
        date,
        category: selectedCategory.label,
        amount: num,
        type: selectedCategory.type,
        note: note || undefined,
        mood: mood || undefined,
      })
      closeAmountInput()
      closeCategoryPage()
      return
    }

    await db.transactions.add({
      date,
      category: selectedCategory.label,
      amount: num,
      type: selectedCategory.type,
      note: note || undefined,
      mood: mood || undefined,
      createdAt: Date.now(),
    })

    if (hintTimeoutRef.current) {
      clearTimeout(hintTimeoutRef.current)
    }

    const hint = getEquivalentHint(num)
    if (hint) {
      setHintText(`≈ ${hint.icon} ${hint.text}`)
      setShowHint(true)
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(false)
        setAmount('')
        setNote('')
        setMood('')
        closeAmountInput()
        closeCategoryPage()
        hintTimeoutRef.current = null
      }, 1500)
    } else {
      setAmount('')
      setNote('')
      setMood('')
      closeAmountInput()
      closeCategoryPage()
    }
  }

  const handleRecordAnother = async () => {
    const num = parseFloat(amount)
    if (!num || num <= 0) return

    await db.transactions.add({
      date,
      category: selectedCategory.label,
      amount: num,
      type: selectedCategory.type,
      note: note || undefined,
      mood: mood || undefined,
      createdAt: Date.now(),
    })

    // 清空输入，保持界面打开
    setAmount('')
    setNote('')
    setMood('')
    
    // 显示提示
    const hint = getEquivalentHint(num)
    if (hint) {
      setHintText(`≈ ${hint.icon} ${hint.text}`)
      setShowHint(true)
      setTimeout(() => setShowHint(false), 1000)
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === '←') {
      setAmount((prev) => prev.slice(0, -1))
    } else if (key === '00') {
      setAmount((prev) => prev + '00')
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => (prev || '0') + '.')
      }
    } else {
      setAmount((prev) => prev + key)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←']

  return (
    <AnimatePresence>
      {showAmountInput && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/30"
            onClick={() => { closeAmountInput(); setAmount(''); setNote(''); setMood('') }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-2xl lg:max-w-3xl mx-auto bg-white rounded-t-3xl p-6 pb-8 md:rounded-b-3xl md:my-8 md:shadow-cute md:border-2 md:border-dashed md:border-border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-2xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  {selectedCategory.icon}
                </motion.span>
                <span className="text-base font-bold text-text">{selectedCategory.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  selectedCategory.type === 'expense'
                    ? 'bg-coral-light/20 text-expense'
                    : 'bg-mint-light/30 text-income'
                }`}>
                  {selectedCategory.type === 'expense' ? '支出' : '收入'}
                </span>
              </div>
              <button
                onClick={() => { closeAmountInput(); setAmount(''); setNote(''); setMood('') }}
                className="text-sub text-xl leading-none p-1 hover:text-coral transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Date picker for editing */}
            {isEditing && (
              <div className="mb-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-2 bg-cream rounded-2xl border-2 border-dashed border-border text-sm text-text outline-none focus:border-coral transition-colors"
                />
                <p className="text-[10px] text-sub mt-1">📅 修改日期不影响打卡判定</p>
              </div>
            )}

            <div className="text-right mb-4">
              <span className="text-sub text-lg mr-1">¥</span>
              <span className="text-4xl font-light text-text tracking-wide">
                {amount || '0'}
              </span>
            </div>

            {/* Quick amount buttons */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {[5, 10, 15, 20, 30, 50].map((val, idx) => {
                const colors = [
                  'bg-coral-light/20 border-coral/30 text-coral',
                  'bg-lavender-light/25 border-lavender/30 text-lavender',
                  'bg-mint-light/25 border-mint/30 text-mint',
                  'bg-warm-yellow/15 border-warm-yellow/30 text-warm-yellow',
                  'bg-warm-blue/20 border-warm-blue/30 text-warm-blue',
                  'bg-coral-light/15 border-coral/20 text-coral',
                ]
                return (
                  <motion.button
                    key={val}
                    whileTap={{ scale: 0.85 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    onClick={() => setAmount(String(val))}
                    className={`shrink-0 px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all ${colors[idx % colors.length]}`}
                  >
                    ¥{val}
                  </motion.button>
                )
              })}
            </div>

            <input
              type="text"
              placeholder="添加备注（选填）☁️"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-cream rounded-2xl border-2 border-dashed border-border text-sm text-text placeholder-sub/60 mb-3 outline-none focus:border-coral transition-colors"
            />

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-sub shrink-0 font-medium">心情</span>
              <div className="flex gap-1.5">
                {moods.map((m) => (
                  <motion.button
                    key={m}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setMood(mood === m ? '' : m)}
                    className={`text-lg transition-all rounded-full px-1 ${
                      mood === m ? 'scale-125 bg-coral-light/20' : 'scale-100 grayscale opacity-40'
                    } hover:opacity-70`}
                  >
                    {m}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {keys.map((key, idx) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleKeyPress(key)}
                  className={`h-14 rounded-2xl text-lg font-bold transition-colors border border-border/50 ${
                    idx % 2 === 0
                      ? 'bg-cream-dark text-text'
                      : 'bg-coral-light/10 text-text'
                  } active:bg-coral-light/30`}
                >
                  {key}
                </motion.button>
              ))}
            </div>

            <div className="flex gap-3">
              {!isEditing && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={handleRecordAnother}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 h-14 rounded-2xl bg-lavender-light/30 text-lavender text-base font-bold border-2 border-dashed border-lavender/30 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  再记一笔 ✨
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleConfirm}
                disabled={!amount || parseFloat(amount) <= 0}
                className={`flex-1 h-14 rounded-2xl text-white text-base font-bold shadow-warm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${
                  isEditing ? 'bg-lavender' : 'bg-coral'
                }`}
              >
                {isEditing ? '保存修改 🌸' : '确认记账 🌸'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Centered popup hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: -20 }}
              className="bg-white rounded-3xl px-8 py-6 shadow-cute border-2 border-dashed border-coral/30"
            >
              <p className="text-lg font-bold text-text text-center">{hintText}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
