import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { captureAsImage } from '../../utils/captureImage'

interface SaveModalProps {
  open: boolean
  onClose: () => void
  title: string
  filename: string
  children: ReactNode
}

export default function SaveModal({ open, onClose, title, filename, children }: SaveModalProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await captureAsImage('save-template', filename)
    } catch (e) {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-cute border-2 border-dashed border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text">📸 {title}</h3>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-cream-dark text-sub flex items-center justify-center text-sm hover:text-coral transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Preview area - centered */}
            <div className="flex justify-center mb-4 overflow-auto max-h-[50vh] rounded-2xl bg-cream-dark/30 p-3">
              {children}
            </div>

            {error && (
              <p className="text-xs text-expense text-center mb-2">{error}</p>
            )}

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-coral text-white text-sm font-bold shadow-warm disabled:opacity-50 transition-opacity"
            >
              {saving ? '保存中...' : '保存为图片 🌸'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
