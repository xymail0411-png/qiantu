export interface Badge {
  id?: number
  name: string
  icon: string
  description: string
  requiredCount: number
  unlockedAt?: number
}

export const defaultBadges: Omit<Badge, 'id'>[] = [
  {
    name: '初出茅庐',
    icon: '🌱',
    description: '累计记账 5 次',
    requiredCount: 5,
  },
  {
    name: '小有积蓄',
    icon: '💰',
    description: '累计记账 20 次',
    requiredCount: 20,
  },
  {
    name: '记账达人',
    icon: '📊',
    description: '累计记账 50 次',
    requiredCount: 50,
  },
  {
    name: '盲盒新手',
    icon: '🎁',
    description: '累计开启 3 次盲盒',
    requiredCount: 3,
  },
  {
    name: '盲盒爱好者',
    icon: '🎊',
    description: '累计开启 10 次盲盒',
    requiredCount: 10,
  },
  {
    name: '盲盒大师',
    icon: '👑',
    description: '累计开启 30 次盲盒',
    requiredCount: 30,
  },
  {
    name: '收藏家',
    icon: '🏆',
    description: '收集 10 种不同奖品',
    requiredCount: 10,
  },
  {
    name: '传说猎人',
    icon: '⭐',
    description: '获得 1 次传说奖品',
    requiredCount: 1,
  },
]
