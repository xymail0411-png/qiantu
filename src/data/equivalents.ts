import type { EquivalentItem } from '../db'

// 三档价格带：<10 零头 / 10-99 小确幸 / >=100 大件
// 换算页每天从每档各取一条，避免参照物永远是鸡蛋矿泉水
export const defaultEquivalents: Omit<EquivalentItem, 'id'>[] = [
  { name: '鸡蛋', price: 1.5, icon: '🥚', isCustom: false },
  { name: '矿泉水', price: 2, icon: '💧', isCustom: false },
  { name: '豆浆', price: 3, icon: '🥛', isCustom: false },
  { name: '泡面', price: 6, icon: '🍜', isCustom: false },
  { name: '地铁单程', price: 7, icon: '🚇', isCustom: false },
  { name: '煎饼果子', price: 8, icon: '🥞', isCustom: false },

  { name: '奶茶', price: 15, icon: '🧋', isCustom: false },
  { name: '咖啡', price: 25, icon: '☕', isCustom: false },
  { name: '蛋糕', price: 30, icon: '🍰', isCustom: false },
  { name: '电影票', price: 40, icon: '🎬', isCustom: false },
  { name: '烧烤', price: 50, icon: '🍖', isCustom: false },
  { name: '披萨', price: 60, icon: '🍕', isCustom: false },
  { name: '火锅', price: 80, icon: '🍲', isCustom: false },
  { name: '剧本杀', price: 98, icon: '🎭', isCustom: false },

  { name: '高铁往返', price: 150, icon: '🚄', isCustom: false },
  { name: '全套专业书', price: 180, icon: '📚', isCustom: false },
  { name: '演唱会门票', price: 280, icon: '🎤', isCustom: false },
  { name: '机械键盘', price: 399, icon: '⌨️', isCustom: false },
  { name: '蓝牙耳机', price: 599, icon: '🎧', isCustom: false },
  { name: '掌机', price: 1499, icon: '🎮', isCustom: false },
  { name: '毕业旅行', price: 4000, icon: '✈️', isCustom: false },
]
