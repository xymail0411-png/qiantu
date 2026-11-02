import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultEquivalents } from '../data/equivalents'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GoalBar() {
  const goal = useLiveQuery(() => db.goals.orderBy('createdAt').last())
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', targetAmount: '', deadline: '' })

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

  const handleSubmit = async () => {
    const { title, targetAmount, deadline } = formData
    if (!title || !targetAmount || !deadline) return
    const amount = parseFloat(targetAmount)
    if (!amount || amount <= 0) return

    await db.goals.add({
      title,
      targetAmount: amount,
      currentAmount: 0,
      deadline,
      createdAt: Date.now(),
    })
    setFormData({ title: '', targetAmount: '', deadline: '' })
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
                    <label className="text-xs text-sub mb-1 block">目标名称</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="如：本月存3000"
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
                      className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-sub mb-1 block">截止日期</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      min={new Date().toISOString().slice(0, 10)}
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
                    disabled={!formData.title || !formData.targetAmount || !formData.deadline}
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
  const deadline = new Date(goal.deadline)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const isNegative = currentAmount < 0

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <span className="text-sm font-medium text-text">{goal.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-sub">还剩 {daysLeft} 天</span>
          <button
            onClick={handleDeleteGoal}
            className="text-sub/40 hover:text-expense transition-colors"
            title="删除目标"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
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
            {isNegative ? '' : '¥'}{currentAmount.toFixed(0)}
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

      <div className="mt-3 pt-3 border-t border-border/50">
        <p className="text-[10px] text-sub/60 mb-1.5">目标金额相当于</p>
        <div className="flex flex-wrap gap-2">
          {defaultEquivalents.slice(0, 4).map((eq) => {
            const count = Math.floor(goal.targetAmount / eq.price)
            if (count < 1) return null
            return (
              <span key={eq.name} className="text-[10px] text-sub bg-bg px-2 py-1 rounded-full">
                {eq.icon} {count}{eq.name}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
