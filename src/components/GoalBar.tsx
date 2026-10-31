import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { defaultEquivalents } from '../data/equivalents'

export default function GoalBar() {
  const goal = useLiveQuery(() => db.goals.orderBy('createdAt').last())

  if (!goal) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-sub">还没有设定目标</p>
            <p className="text-xs text-sub/60 mt-0.5">点击设定一个存钱目标吧</p>
          </div>
          <button
            onClick={handleSetGoal}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
          >
            设定目标
          </button>
        </div>
      </div>
    )
  }

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const deadline = new Date(goal.deadline)
  const now = new Date()
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <span className="text-sm font-medium text-text">{goal.title}</span>
        </div>
        <span className="text-xs text-sub">还剩 {daysLeft} 天</span>
      </div>

      <div className="w-full h-3 bg-bg rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-sub">
          已存 <span className="text-primary font-medium">¥{goal.currentAmount.toFixed(0)}</span>
          <span className="text-sub/60"> / ¥{goal.targetAmount.toFixed(0)}</span>
        </span>
        <span className="text-sub">
          {remaining > 0
            ? `还差 ¥${remaining.toFixed(0)}`
            : '🎉 已达成！'}
        </span>
      </div>

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

async function handleSetGoal() {
  const title = prompt('目标名称（如：本月存3000）')
  if (!title) return

  const targetStr = prompt('目标金额')
  if (!targetStr) return
  const targetAmount = parseFloat(targetStr)
  if (!targetAmount || targetAmount <= 0) return

  const deadlineStr = prompt('截止日期（如：2026-11-30）')
  if (!deadlineStr) return

  await db.goals.add({
    title,
    targetAmount,
    currentAmount: 0,
    deadline: deadlineStr,
    createdAt: Date.now(),
  })
}
