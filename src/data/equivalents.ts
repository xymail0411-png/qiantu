import type { EquivalentItem } from '../db'

export const defaultEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '米饭', price: 2, icon: '🍚', isCustom: false },
  { name: '泡面', price: 5, icon: '🍜', isCustom: false },
  { name: '茶叶蛋', price: 2, icon: '🥚', isCustom: false },
  { name: '矿泉水', price: 2, icon: '💧', isCustom: false },
  { name: '馒头', price: 1.5, icon: '🫓', isCustom: false },
  { name: '包子', price: 2, icon: '🥟', isCustom: false },
  { name: '豆浆', price: 3, icon: '🥛', isCustom: false },
  { name: '煎饼', price: 6, icon: '🫓', isCustom: false },
]

export const experienceEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '奶茶', price: 15, icon: '🧋', isCustom: false },
  { name: '咖啡', price: 25, icon: '☕', isCustom: false },
  { name: '蛋糕', price: 30, icon: '🍰', isCustom: false },
  { name: '火锅', price: 80, icon: '🍲', isCustom: false },
  { name: '烧烤', price: 50, icon: '🍖', isCustom: false },
  { name: '披萨', price: 60, icon: '🍕', isCustom: false },
]
