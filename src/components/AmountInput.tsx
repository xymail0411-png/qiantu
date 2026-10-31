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

  const getEquivalentHint = (num: number): string => {
    const hints: string[] = []
    for (const eq of defaultEquivalents) {
      const count = num / eq.price
      if (count >= 0.5 && count <= 100) {
        if (count >= 1) {
          hints.push(`${Math.floor(count)}${eq.name}`)
        } else {
          hints.push(`${count.toFixed(1)}${eq.name}`)
        }
      }
    }
    if (hints.length === 0) return ''
    return `≈ ${hints.slice(0, 2).join(' 或 ')}`
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
      setHintText(hint)
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

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 text-center text-xs text-sub"
                >
                  {hintText}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
