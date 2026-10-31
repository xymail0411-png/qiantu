import { create } from 'zustand'
import type { Category } from '../data/categories'

interface AppState {
  activeTab: 'home' | 'convert' | 'game'
  setActiveTab: (tab: 'home' | 'convert' | 'game') => void

  currentDate: string
  setCurrentDate: (date: string) => void
  goToday: () => void
  goPrevDay: () => void
  goNextDay: () => void

  showAmountInput: boolean
  selectedCategory: Category | null
  openAmountInput: (category: Category) => void
  closeAmountInput: () => void

  showCategoryPage: boolean
  openCategoryPage: () => void
  closeCategoryPage: () => void

  recordFilter: 'all' | 'expense' | 'income'
  setRecordFilter: (filter: 'all' | 'expense' | 'income') => void

  refreshKey: number
  triggerRefresh: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab, showCategoryPage: false }),

  currentDate: new Date().toISOString().slice(0, 10),
  setCurrentDate: (date) => set({ currentDate: date }),
  goToday: () => set({ currentDate: new Date().toISOString().slice(0, 10) }),
  goPrevDay: () => {
    const d = new Date(get().currentDate)
    d.setDate(d.getDate() - 1)
    set({ currentDate: d.toISOString().slice(0, 10) })
  },
  goNextDay: () => {
    const d = new Date(get().currentDate)
    d.setDate(d.getDate() + 1)
    set({ currentDate: d.toISOString().slice(0, 10) })
  },

  showAmountInput: false,
  selectedCategory: null,
  openAmountInput: (category) => set({ showAmountInput: true, selectedCategory: category }),
  closeAmountInput: () => set({ showAmountInput: false, selectedCategory: null }),

  showCategoryPage: false,
  openCategoryPage: () => set({ showCategoryPage: true }),
  closeCategoryPage: () => set({ showCategoryPage: false }),

  recordFilter: 'all',
  setRecordFilter: (filter) => set({ recordFilter: filter }),

  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}))
