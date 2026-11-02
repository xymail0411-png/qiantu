import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useState, useEffect } from 'react'
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
  const [formData, setFormData] = useState({ 
    title: '', 
    targetAmount: '', 
    deadline: ''
  })
  const [hasDeadline, setHasDeadline] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')
  const [prevProgress, setPrevProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!goal || totalSavings === undefined) return
    
    const currentProgress = (Math.max(0, totalSavings) / goal.targetAmount) * 100
    const achieved = goal.achievedMilestones || []
    
    // 只在进度增长时触发，下降时不触发
    if (currentProgress > prevProgress) {
      // 检查50%里程碑
      if (prevProgress < 50 && currentProgress >= 50 && !achieved.includes(50)) {
        setCelebrationText('🎊 已存到一半啦！继续冲！')
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
        db.goals.update(goal.id!, { achievedMilestones: [...achieved, 50] })
      }
      // 检查100%达成（不插旗，只庆祝）
      else if (prevProgress < 100 && currentProgress >= 100 && !achieved.includes(100)) {
        setCelebrationText('🎉 目标达成！你太棒了！')
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3000)
        db.goals.update(goal.id!, { achievedMilestones: [...achieved, 100] })
      }
    }
    
    setPrevProgress(currentProgress)
  }, [totalSavings, goal])

  // 当目标改变时，重置进度状态
  useEffect(() => {
    setPrevProgress(0)
    setShowCelebration(false)
  }, [goal?.id])

  const openForm = () => {
    if (goal) {
      setFormData({ 
        title: goal.title, 
        targetAmount: goal.targetAmount.toString(),
        deadline: goal.deadline || ''
      })
      setHasDeadline(!!goal.deadline)
    } else {
      setFormData({ 
        title: '', 
        targetAmount: '', 
        deadline: ''
      })
      setHasDeadline(false)
    }
    setShowForm(true)
  }

  const handleSubmit = async () => {
    const { title, targetAmount, deadline } = formData
    if (!targetAmount) return
    const amount = parseFloat(targetAmount)
    if (!amount || amount <= 0) return

    const finalDeadline = hasDeadline && deadline ? deadline : ''

    if (goal) {
      await db.goals.update(goal.id, {
        title: title || '存钱目标',
        targetAmount: amount,
        deadline: finalDeadline,
      })
    } else {
      await db.goals.add({
        title: title || '存钱目标',
        targetAmount: amount,
        currentAmount: 0,
        deadline: finalDeadline,
        achievedMilestones: [],
        createdAt: Date.now(),
      })
    }
    setFormData({ title: '', targetAmount: '', deadline: '' })
    setShowForm(false)
  }

  const handleDeleteGoal = async () => {
    if (!goal?.id) return
    await db.goals.delete(goal.id)
    setShowDeleteConfirm(false)
    setShowForm(false)
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
              onClick={openForm}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
            >
              设定目标
            </button>
          </div>
        </div>

        <GoalFormModal
          show={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          hasDeadline={hasDeadline}
          setHasDeadline={setHasDeadline}
          title="设定存钱目标"
          submitText="确认"
        />
      </>
    )
  }

  const currentAmount = totalSavings ?? 0
  const displayAmount = Math.max(0, currentAmount)
  const progress = Math.min((displayAmount / goal.targetAmount) * 100, 100)
  const remaining = goal.targetAmount - displayAmount
  const isNegative = currentAmount < 0
  
  const deadline = goal.deadline ? new Date(goal.deadline) : null
  const now = new Date()
  const daysLeft = deadline 
    ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  const achievedMilestones = goal.achievedMilestones || []

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-sm font-medium text-text">{goal.title}</span>
            {daysLeft !== null && (
              <span className="text-xs text-sub/60">· {daysLeft}天</span>
            )}
          </div>
          <button
            onClick={openForm}
            className="text-xs text-primary font-medium"
          >
            编辑
          </button>
        </div>

        <div className="relative w-full h-3 bg-bg rounded-full overflow-visible mb-2">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${isNegative ? 'bg-expense' : 'bg-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          {/* 50% 旗帜标记 - 只在达成时显示 */}
          {achievedMilestones.includes(50) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-0 -translate-y-full"
              style={{ left: '50%', transform: 'translate(-50%, -100%)' }}
            >
              <span className="text-base">🚩</span>
            </motion.div>
          )}
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

      <GoalFormModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        onDelete={() => setShowDeleteConfirm(true)}
        formData={formData}
        setFormData={setFormData}
        hasDeadline={hasDeadline}
        setHasDeadline={setHasDeadline}
        title="编辑目标"
        submitText="保存"
      />

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="bg-white rounded-3xl px-10 py-8 shadow-2xl border-2 border-primary/30"
            >
              <p className="text-2xl font-bold text-text text-center">{celebrationText}</p>
              <p className="text-sm text-sub text-center mt-2">继续加油！</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteGoal}
        goalTitle={goal.title}
      />
    </>
  )
}

function GoalFormModal({
  show,
  onClose,
  onSubmit,
  onDelete,
  formData,
  setFormData,
  hasDeadline,
  setHasDeadline,
  title,
  submitText,
}: {
  show: boolean
  onClose: () => void
  onSubmit: () => void
  onDelete?: () => void
  formData: { title: string; targetAmount: string; deadline: string }
  setFormData: (data: { title: string; targetAmount: string; deadline: string }) => void
  hasDeadline: boolean
  setHasDeadline: (v: boolean) => void
  title: string
  submitText: string
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30" />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 sm:hidden" />
            
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium text-text">{title}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-sub hover:text-text transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-sub mb-1.5 block">目标名称</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="存钱目标"
                  className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              
              <div>
                <label className="text-xs text-sub mb-1.5 block">目标金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub text-sm">¥</span>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="3000"
                    min="0"
                    step="0.01"
                    autoFocus
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-sub">截止日期</label>
                  <button
                    onClick={() => setHasDeadline(!hasDeadline)}
                    className={`text-xs font-medium transition-colors ${hasDeadline ? 'text-primary' : 'text-sub'}`}
                  >
                    {hasDeadline ? '已设置' : '选填'}
                  </button>
                </div>
                {hasDeadline ? (
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  />
                ) : (
                  <button
                    onClick={() => setHasDeadline(true)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sub text-sm hover:border-primary hover:text-primary transition-colors"
                  >
                    + 添加截止日期
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="py-3 px-4 rounded-xl bg-expense/10 text-expense text-sm font-medium"
                >
                  删除
                </button>
              )}
              <div className="flex-1 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-bg text-text text-sm font-medium"
                >
                  取消
                </button>
                <button
                  onClick={onSubmit}
                  disabled={!formData.targetAmount}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
  goalTitle,
}: {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  goalTitle: string
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xs bg-white rounded-2xl p-6 mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-expense/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-base font-medium text-text mb-1">删除目标</h3>
              <p className="text-sm text-sub">
                确定要删除「{goalTitle}」吗？<br />
                <span className="text-xs text-sub/60">删除后无法恢复</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-bg text-text text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-expense text-white text-sm font-medium"
              >
                删除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
