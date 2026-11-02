import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function GoalCard({ goal }: { goal: any }) {
  const totalSavings = useLiveQuery(async () => {
    const transactions = await db.transactions.where('goalId').equals(goal.id).toArray()
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0)
    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0)
    return totalIncome - totalExpense
  }, [goal.id])

  const handleDelete = async () => {
    if (!confirm(`确定要删除目标"${goal.title}"吗？`)) return
    await db.goals.delete(goal.id)
    await db.transactions.where('goalId').equals(goal.id).modify({ goalId: undefined })
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
            onClick={handleDelete}
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
  )
}

export default function GoalBar() {
  const goals = useLiveQuery(() => db.goals.orderBy('createdAt').reverse().toArray())
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', targetAmount: '', deadline: '' })

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

  const defaultDeadline = () => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  }

  return (
    <>
      <div className="space-y-3">
        {goals?.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}

        {(!goals || goals.length === 0) && (
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
        )}

        {goals && goals.length > 0 && (
          <button
            onClick={() => {
              setFormData({ title: '', targetAmount: '', deadline: defaultDeadline() })
              setShowForm(true)
            }}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-sub text-sm hover:border-primary hover:text-primary transition-colors"
          >
            + 添加新目标
          </button>
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
              <h3 className="text-base font-medium text-text mb-4">设定存钱目标</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-sub mb-1 block">目标名称</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="如：演唱会门票"
                    className="w-full px-3 py-2 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-sub mb-1 block">目标金额（元）</label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="1000"
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
