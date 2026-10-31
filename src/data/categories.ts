export interface Category {
  icon: string
  label: string
  type: 'expense' | 'income'
}

export const expenseCategories: Category[] = [
  { icon: '🍜', label: '餐饮', type: 'expense' },
  { icon: '🍔', label: '零食', type: 'expense' },
  { icon: '🚌', label: '交通', type: 'expense' },
  { icon: '🛒', label: '购物', type: 'expense' },
  { icon: '🎮', label: '娱乐', type: 'expense' },
  { icon: '☕', label: '饮品', type: 'expense' },
  { icon: '👔', label: '服饰', type: 'expense' },
  { icon: '💊', label: '医疗', type: 'expense' },
  { icon: '📚', label: '学习', type: 'expense' },
  { icon: '🏠', label: '住房', type: 'expense' },
  { icon: '📱', label: '通讯', type: 'expense' },
  { icon: '🎁', label: '礼物', type: 'expense' },
  { icon: '✂️', label: '日用', type: 'expense' },
  { icon: '🐱', label: '宠物', type: 'expense' },
  { icon: '🏋️', label: '运动', type: 'expense' },
  { icon: '💄', label: '美妆', type: 'expense' },
  { icon: '🎵', label: '音乐', type: 'expense' },
  { icon: '✈️', label: '旅行', type: 'expense' },
  { icon: '📦', label: '其他', type: 'expense' },
]

export const incomeCategories: Category[] = [
  { icon: '💰', label: '工资', type: 'income' },
  { icon: '💼', label: '兼职', type: 'income' },
  { icon: '🎉', label: '红包', type: 'income' },
  { icon: '📈', label: '理财', type: 'income' },
  { icon: '🎁', label: '其他', type: 'income' },
]

export const allCategories = [...expenseCategories, ...incomeCategories]
