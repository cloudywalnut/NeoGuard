import { cn } from '@/lib/utils/format'
import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react'

const inputBase = 'w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-sm text-purple-900 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, className)} {...props} />
  )
)
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputBase, 'cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputBase, 'resize-none', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export function FormField({ label, error, children, required }: {
  label: string; error?: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold uppercase tracking-widest text-purple-500">
        {label}{required && <span className="text-pink-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
