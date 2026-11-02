import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GoalBar() {
  const goal = useLiveQuery(() => db.goals.orderBy('createdAt').last())
  
  const totalSavings = useLiveQuery(async () => {
    if (!goal) return 0
    const allTransactions = await db.transactions.toArray()
    const goalCreatedDay = new Date(goal.createdAt).toISOString().slice(0, 10)
    const relevantTransactions = allTransactions.filter(t => t.date >= goalCreatedDay)
    const totalIncome = relevantTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = relevantTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return totalIncome - totalExpense
  }, [goal])

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', targetAmount: '' })

  const handleSubmit = async () => {
    const { title, targetAmount } = formData
    if (!targetAmount) return
    const amount = parseFloat(targetAmount)
    if (!amount || amount <= 0) return

    if (goal) {
      await db.goals.update(goal.id, {
        title: title || goal.title,
        targetAmount: amount,
      })
    } else {
      const d = new Date()
      d.setMonth(d.getMonth() + 1)
      await db.goals.add({
        title: title || '存钱目标',
        targetAmount: amount,
        currentAmount: 0,
        deadline: d.toISOString().slice(0, 10),
        createdAt: Date.now(),
      })
    }
    setFormData({ title: '', targetAmount: '' })
    setShowForm(false)
  }

  const handleDeleteGoal = async () => {
    if (!goal?.id) return
    if (!confirm('确定要删除这个目标吗？')) return
    await db.goals.delete(goal.id)
  }

  if (!goal) {
    return (
      <>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-sub">还没有设定目标</p>
              <p className="text-xs text-sub/60 mt-0.5">点击设定一个存钱目标吧</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
            >
              设定目标
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-medium text-text mb-4">设定存钱目标</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-sub mb-1 block">目标名称（选填）</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="存钱目标"
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-sub mb-1 block">目标金额（元）</label>
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      placeholder="3000"
                      min="0"
                      step="0.01"
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-bg text-text text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.targetAmount}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  const currentAmount = totalSavings ?? 0
  const displayAmount = Math.max(0, currentAmount)
  const progress = Math.min((displayAmount / goal.targetAmount) * 100, 100)
  const remaining = goal.targetAmount - displayAmount
  const isNegative = currentAmount < 0

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-sm font-medium text-text">{goal.title}</span>
          </div>
          <button
            onClick={() => {
              setFormData({ title: goal.title, targetAmount: goal.targetAmount.toString() })
              setShowForm(true)
            }}
            className="text-xs text-primary"
          >
            编辑
          </button>
        </div>

        <div className="w-full h-3 bg-bg rounded-full overflow-hidden mb-2">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${isNegative ? 'bg-expense' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-sub">
            已存 <span className={`font-medium ${isNegative ? 'text-expense' : 'text-primary'}`}>
              ¥{displayAmount.toFixed(0)}
            </span>
            <span className="text-sub/60"> / ¥{goal.targetAmount.toFixed(0)}</span>
          </span>
          <span className="text-sub">
            {remaining > 0
              ? `还差 ¥${remaining.toFixed(0)}`
              : '🎉 已达成！'}
          </span>
        </div>

        {isNegative && (
          <p className="text-[10px] text-expense/80 mt-2">
            ⚠️ 支出大于收入，净储蓄为 {currentAmount.toFixed(0)} 元
          </p>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-medium text-text mb-4">编辑目标</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-sub mb-1 block">目标名称（选填）</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="存钱目标"
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-sub mb-1 block">目标金额（元）</label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="3000"
                    min="0"
                    step="0.01"
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDeleteGoal}
                  className="py-2.5 px-4 rounded-xl bg-expense/10 text-expense text-sm font-medium"
                >
                  删除
                </button>
                <div className="flex-1 flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-bg text-text text-sm font-medium"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.targetAmount}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    保存
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
