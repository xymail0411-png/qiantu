import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { db } from '../db'
import { useAppStore } from '../store'
import { defaultEquivalents } from '../data/equivalents'

export default function AmountInput() {
  const { showAmountInput, selectedCategory, closeAmountInput, triggerRefresh } = useAppStore()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [hintText, setHintText] = useState('')

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

    await db.transactions.add({
      date: new Date().toISOString().slice(0, 10),
      category: selectedCategory.label,
      amount: num,
      type: selectedCategory.type,
      note: note || undefined,
      createdAt: Date.now(),
    })

    const hint = getEquivalentHint(num)
    if (hint) {
      setHintText(`≈ ${hint.icon} ${hint.text}`)
      setShowHint(true)
      setTimeout(() => {
        setShowHint(false)
        setAmount('')
        setNote('')
        closeAmountInput()
        triggerRefresh()
      }, 1500)
    } else {
      setAmount('')
      setNote('')
      closeAmountInput()
      triggerRefresh()
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
            onClick={() => { closeAmountInput(); setAmount(''); setNote('') }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md bg-white rounded-t-3xl p-6 pb-8"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCategory.icon}</span>
                <span className="text-base font-medium text-text">{selectedCategory.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory.type === 'expense'
                    ? 'bg-red-50 text-expense'
                    : 'bg-green-50 text-income'
                }`}>
                  {selectedCategory.type === 'expense' ? '支出' : '收入'}
                </span>
              </div>
              <button
                onClick={() => { closeAmountInput(); setAmount(''); setNote('') }}
                className="text-sub text-xl leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="text-right mb-4">
              <span className="text-sub text-lg mr-1">¥</span>
              <span className="text-4xl font-light text-text tracking-wide">
                {amount || '0'}
              </span>
            </div>

            <input
              type="text"
              placeholder="添加备注（选填）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-bg rounded-xl border border-border text-sm text-text placeholder-sub mb-4 outline-none focus:border-primary transition-colors"
            />

            <div className="grid grid-cols-4 gap-2 mb-4">
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="h-14 rounded-xl bg-bg text-lg font-medium text-text active:bg-border transition-colors"
                >
                  {key}
                </button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirm}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full h-14 rounded-xl bg-primary text-white text-base font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              确认记账
            </motion.button>
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
              className="bg-white rounded-2xl px-8 py-6 shadow-2xl border border-border"
            >
              <p className="text-lg font-medium text-text text-center">{hintText}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
