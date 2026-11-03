interface DailyReportProps {
  date: string
  totalExpense: number
  totalIncome: number
  records: { category: string; icon: string; amount: number; type: 'expense' | 'income' }[]
  checkedIn: boolean
}

export default function DailyReport({ date, totalExpense, totalIncome, records, checkedIn }: DailyReportProps) {
  const dateStr = new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
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
          <span className="text-sm font-bold text-text">钱途 · 每日账单</span>
        </div>
        <span className="text-xs text-sub">{dateStr}</span>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl p-4 border border-border/50 mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-sub">支出</p>
            <p className="text-sm font-bold text-expense">¥{totalExpense.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-sub">收入</p>
            <p className="text-sm font-bold text-income">¥{totalIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-sub">结余</p>
            <p className={`text-sm font-bold ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {balance >= 0 ? '+' : ''}¥{balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Records */}
      {records.length > 0 && (
        <div className="mb-4 space-y-2">
          {records.slice(0, 5).map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-cream-dark rounded-xl px-3 py-2">
              <span className="text-base">{r.icon}</span>
              <span className="text-xs text-text flex-1">{r.category}</span>
              <span className={`text-xs font-bold ${r.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                {r.type === 'expense' ? '-' : '+'}¥{r.amount.toFixed(2)}
              </span>
            </div>
          ))}
          {records.length > 5 && (
            <p className="text-[10px] text-sub text-center">还有 {records.length - 5} 条记录...</p>
          )}
        </div>
      )}

      {/* Check-in status */}
      <div className={`rounded-xl px-3 py-2 mb-4 text-center ${
        checkedIn ? 'bg-mint-light/20 border border-mint/20' : 'bg-cream-dark border border-border'
      }`}>
        <p className="text-[10px] font-bold text-text">
          {checkedIn ? '✅ 今日已打卡' : '⏳ 今日未打卡'}
        </p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[10px] text-sub/60">✨ 钱途 · 让每一笔消费都有意义 ☁️</p>
      </div>
    </div>
  )
}
