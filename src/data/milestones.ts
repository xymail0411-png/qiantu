export interface Milestone {
  key: string
  name: string
  icon: string
  description: string
  condition: {
    type: 'transaction_count' | 'streak_days' | 'total_expense' | 'total_income' | 'box_count' | 'badge_count'
    target: number
  }
}

export const defaultMilestones: Milestone[] = [
  {
    key: 'first_record',
    name: '第一步',
    icon: '👣',
    description: '记录第一笔账',
    condition: { type: 'transaction_count', target: 1 },
  },
  {
    key: 'ten_records',
    name: '小有所成',
    icon: '📝',
    description: '累计记账10次',
    condition: { type: 'transaction_count', target: 10 },
  },
  {
    key: 'fifty_records',
    name: '记账能手',
    icon: '✍️',
    description: '累计记账50次',
    condition: { type: 'transaction_count', target: 50 },
  },
  {
    key: 'hundred_records',
    name: '记账达人',
    icon: '🏆',
    description: '累计记账100次',
    condition: { type: 'transaction_count', target: 100 },
  },
  {
    key: 'streak_3',
    name: '三日坚持',
    icon: '🔥',
    description: '连续打卡3天',
    condition: { type: 'streak_days', target: 3 },
  },
  {
    key: 'streak_7',
    name: '一周之约',
    icon: '⚡',
    description: '连续打卡7天',
    condition: { type: 'streak_days', target: 7 },
  },
  {
    key: 'streak_30',
    name: '月度达人',
    icon: '🌟',
    description: '连续打卡30天',
    condition: { type: 'streak_days', target: 30 },
  },
  {
    key: 'save_1000',
    name: '千元大关',
    icon: '💰',
    description: '累计存款达¥1000',
    condition: { type: 'total_income', target: 1000 },
  },
  {
    key: 'save_10000',
    name: '万元户',
    icon: '💎',
    description: '累计存款达¥10000',
    condition: { type: 'total_income', target: 10000 },
  },
  {
    key: 'first_box',
    name: '盲盒初体验',
    icon: '🎁',
    description: '开启第一个盲盒',
    condition: { type: 'box_count', target: 1 },
  },
  {
    key: 'twenty_boxes',
    name: '盲盒收藏家',
    icon: '🎰',
    description: '累计开启20个盲盒',
    condition: { type: 'box_count', target: 20 },
  },
  {
    key: 'all_badges',
    name: '大满贯',
    icon: '👑',
    description: '解锁全部8个徽章',
    condition: { type: 'badge_count', target: 8 },
  },
]
