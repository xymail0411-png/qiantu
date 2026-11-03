interface MonthlyReportProps {
  year: number
  month: number
  totalExpense: number
  totalIncome: number
  categoryData: { category: string; icon: string; amount: number; percentage: number }[]
  checkInDays: number
}

export default function MonthlyReport({ year, month, totalExpense, totalIncome, categoryData, checkInDays }: MonthlyReportProps) {
  const balance = totalIncome - totalExpense

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
          <span className="text-sm font-bold text-text">钱途 · 月度报告</span>
        </div>
        <span className="text-xs text-sub">{year}年{month + 1}月</span>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 border border-border/50 mb-4">
        <div className="grid grid-cols-2 gap-3 text-center mb-3">
          <div className="bg-coral-light/10 rounded-xl p-2">
            <p className="text-[10px] text-sub">总支出</p>
            <p className="text-lg font-extrabold text-expense">¥{totalExpense.toFixed(0)}</p>
          </div>
          <div className="bg-mint-light/15 rounded-xl p-2">
            <p className="text-[10px] text-sub">总收入</p>
            <p className="text-lg font-extrabold text-income">¥{totalIncome.toFixed(0)}</p>
          </div>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-sub">结余</span>
          <span className={`font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
            {balance >= 0 ? '+' : ''}¥{balance.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-sub">打卡天数</span>
          <span className="font-bold text-coral">{checkInDays} 天 🔥</span>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-bold text-text mb-2">📊 分类占比</p>
          {categoryData.slice(0, 5).map((cat, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-base">{cat.icon}</span>
              <span className="text-xs text-text flex-1">{cat.category}</span>
              <div className="w-16 h-1.5 bg-border/30 rounded-full overflow-hidden">
                <div className="h-full bg-coral rounded-full" style={{ width: `${cat.percentage}%` }} />
              </div>
              <span className="text-[10px] text-sub w-8 text-right">{cat.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] text-sub/60">✨ 钱途 · 让每一笔消费都有意义 ☁️</p>
      </div>
    </div>
  )
}
