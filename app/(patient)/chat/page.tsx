'use client'
import { useEffect, useState, useRef } from 'react'
import { Send, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTED = [
  'How is my baby growing?',
  'What did my last scan mean?',
  'I feel fewer kicks today',
  'Is my blood pressure okay?',
]

export default function PatientChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: msg }])
    setLoading(true)
    const res = await fetch('/api/ai/patient-chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.response) setMessages(m => [...m, { role: 'assistant', content: data.response }])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-linear-to-r from-violet-500 to-purple-600 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Heart size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-white">NeoGuard</h1>
            <p className="text-violet-200 text-xs">Your pregnancy companion 💜</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-violet-200 text-xs">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-violet-50">
        {messages.length === 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-center">
              <div className="max-w-xs text-center">
                <div className="text-5xl mb-3">💜</div>
                <p className="font-bold text-purple-800">Hi there! I'm NeoGuard.</p>
                <p className="text-sm text-purple-500 mt-1">I'm here to answer your pregnancy questions and keep you company. What's on your mind today?</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED.map(p => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left p-3 bg-white border border-violet-100 rounded-2xl text-sm text-purple-600 hover:bg-purple-50 hover:border-purple-200 transition-colors font-medium shadow-sm"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0 mt-1">
                <Heart size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-xs rounded-2xl px-4 py-3 shadow-sm ${
              msg.role === 'user'
                ? 'bg-pink-500 text-white rounded-br-sm'
                : 'bg-white text-purple-800 rounded-bl-sm border border-violet-100'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <div className="text-sm leading-relaxed prose prose-sm max-w-none
                  prose-p:my-1 prose-p:text-purple-800
                  prose-strong:text-purple-900 prose-strong:font-bold
                  prose-em:text-purple-600 prose-em:not-italic prose-em:font-medium
                  prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-purple-800
                  prose-ol:my-1 prose-ol:pl-4">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
              <Heart size={14} className="text-white" />
            </div>
            <div className="bg-white border border-violet-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-white border-t border-violet-100 shrink-0">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask me anything about your pregnancy..."
            rows={2}
            className="flex-1 border-violet-200 focus:ring-violet-300"
            disabled={loading}
          />
          <Button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="self-end bg-violet-500 hover:bg-violet-600"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs text-purple-300 mt-1 text-center">Always talk to your doctor for medical concerns 💜</p>
      </div>
    </div>
  )
}
