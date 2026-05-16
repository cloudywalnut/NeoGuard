'use client'
import { useEffect, useState, useRef } from 'react'
import { Send, Bot, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { formatDateTime } from '@/lib/utils/format'
import ReactMarkdown from 'react-markdown'

interface Message { role: 'user' | 'assistant'; content: string; ts: string }

const SUGGESTED_PROMPTS = [
  'Why is the SGA risk increasing for this patient?',
  'Summarise the latest scan findings',
  'Compare the AC trend across all scans',
  'What are the key risk factors for this patient?',
]

export default function DoctorAIPage() {
  const [patients, setPatients] = useState<Array<{ id: string; profile: { full_name: string } }>>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/patients').then(r => r.json()).then(d => setPatients(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || !selectedPatient || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg, ts: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setLoading(true)

    const res = await fetch('/api/ai/doctor-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, patient_id: selectedPatient }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.response) {
      setMessages(m => [...m, { role: 'assistant', content: data.response, ts: new Date().toISOString() }])
    }
  }

  const selectedName = patients.find(p => p.id === selectedPatient)?.profile?.full_name

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-100 bg-white shrink-0">
        <h1 className="font-extrabold text-2xl text-purple-950 tracking-tight">AI Clinical Agent</h1>
        <p className="text-purple-400 text-sm font-medium mt-1">Powered by Gemini · NeoGuard research context</p>
      </div>

      {/* Patient selector */}
      <div className="px-6 py-3 bg-pink-50 border-b border-pink-100 shrink-0">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-widest text-purple-400">Patient context:</label>
          <select
            value={selectedPatient}
            onChange={e => { setSelectedPatient(e.target.value); setMessages([]) }}
            className="flex-1 max-w-xs px-3 py-1.5 rounded-xl border border-purple-200 text-sm text-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
          >
            <option value="">Select a patient...</option>
            {patients.map(p => (
              <option key={p.id} value={p.id}>{p.profile?.full_name ?? 'Unknown patient'}</option>
            ))}
          </select>
          {selectedName && (
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">
              {selectedName}
            </span>
          )}
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-600">
              <RefreshCw size={12} /> New chat
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {!selectedPatient && (
          <div className="text-center py-16 text-purple-300">
            <Bot size={56} className="mx-auto mb-4 opacity-40" />
            <p className="font-bold text-lg">Select a patient to begin</p>
            <p className="text-sm mt-1">The AI agent will have full context for that patient</p>
          </div>
        )}

        {selectedPatient && messages.length === 0 && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Bot size={48} className="mx-auto mb-3 text-pink-400 opacity-70" />
              <p className="font-bold text-purple-800">NeoGuard AI Agent</p>
              <p className="text-sm text-purple-400 mt-1">Ask anything about {selectedName}'s clinical picture</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left p-3 bg-white border border-purple-100 rounded-xl text-sm text-purple-600 hover:bg-pink-50 hover:border-pink-200 transition-colors font-medium"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-pink-500 text-white'
                : 'bg-white border border-purple-100 text-purple-800'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <div className="text-sm leading-relaxed prose prose-sm max-w-none
                  prose-p:my-1 prose-p:text-purple-800
                  prose-strong:text-purple-900 prose-strong:font-bold
                  prose-em:text-purple-600 prose-em:not-italic prose-em:font-medium
                  prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-purple-800
                  prose-ol:my-1 prose-ol:pl-4
                  prose-headings:text-purple-900 prose-headings:font-bold prose-headings:my-1">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
              <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-pink-200' : 'text-purple-300'}`}>
                {formatDateTime(msg.ts)}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-purple-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {selectedPatient && (
        <div className="px-6 py-4 border-t border-purple-100 bg-white shrink-0">
          <div className="flex gap-3">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Ask about scan findings, risk trajectory, clinical management..."
              rows={2}
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="self-end">
              <Send size={16} />
            </Button>
          </div>
          <p className="text-xs text-purple-300 mt-1">Press Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </div>
  )
}
