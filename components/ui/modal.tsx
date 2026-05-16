'use client'
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/format'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-xl w-full p-6 z-10', sizes[size])}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="font-bold text-xl text-purple-900">{title}</h2>}
          <button onClick={onClose} className="ml-auto p-1 hover:bg-pink-50 rounded-lg text-purple-400 hover:text-purple-600">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
