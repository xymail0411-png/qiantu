interface StreakCardProps {
  streak: number
  streakBonus: number
  todayCheckedIn: boolean
}

export default function StreakCard({ streak, streakBonus, todayCheckedIn }: StreakCardProps) {
  return (
    <div
      id="save-template"
      className="w-[320px] bg-cream rounded-3xl p-6 border-2 border-dashed border-border"
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <img src="/logo/qiantu-logo.png" className="w-8 h-8 rounded-lg" alt="钱途" />
          <span className="text-sm font-bold text-text">钱途 · 打卡成就</span>
        </div>
        <span className="text-xs text-sub">🔥</span>
      </div>

      {/* Streak display */}
      <div className="bg-white rounded-2xl p-6 border border-border/50 mb-4 text-center">
        <span className="text-5xl block mb-2">🔥</span>
        <p className="text-4xl font-extrabold text-coral mb-1">{streak}</p>
        <p className="text-sm text-sub font-medium">天连续打卡</p>

        {streakBonus > 0 && (
          <div className="bg-mint-light/20 rounded-xl px-3 py-2 mt-3">
            <p className="text-xs text-mint font-bold">✨ 稀有概率加成 +{streakBonus}%</p>
          </div>
        )}

        <div className="flex justify-center gap-1 mt-3">
          {[3, 7, 14, 30].map((threshold) => (
            <div
              key={threshold}
              className={`w-3 h-8 rounded-full ${streak >= threshold ? 'bg-coral' : 'bg-border/40'}`}
            />
          ))}
        </div>
        <p className="text-[10px] text-sub mt-1">3天 · 7天 · 14天 · 30天</p>
      </div>

      {/* Today status */}
      <div className={`rounded-xl px-4 py-3 mb-4 text-center ${
        todayCheckedIn ? 'bg-mint-light/20 border border-mint/20' : 'bg-cream-dark border border-border'
      }`}>
        <p className="text-xs font-bold text-text">
          {todayCheckedIn ? '✅ 今日已打卡' : '⏳ 今日未打卡'}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] text-sub/60">✨ 钱途 · 让每一笔消费都有意义 ☁️</p>
      </div>
    </div>
  )
}
