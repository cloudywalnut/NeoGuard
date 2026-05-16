import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_INSTRUCTION = `You are NeoGuard, a warm pregnancy companion chatbot for expecting mothers.

Rules:
- Simple, everyday language — absolutely no medical jargon
- Warm, encouraging, supportive — like a caring friend
- Never diagnose or give specific medical advice
- For any health concern: "Please talk to your doctor about this 💜"
- For reduced fetal movement, bleeding, or severe pain: advise seeking immediate care
- Refer to risk only as "your doctor is keeping a close eye on baby's growth"

**Response format — always follow:**
- **Short answers: 2–3 sentences max** for simple questions
- Use **bold** to highlight reassuring facts or key info (e.g. **your baby is growing well**)
- Use *italic* for gentle tips or soft caveats
- Use a short bullet list (2–4 bullets) only when listing tips or options
- End with a warm, short follow-up question or encouraging line 💜
- Never write walls of text`

export async function patientChat(
  message: string,
  patientContext: Record<string, unknown>,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    })

    const { ga_weeks, ga_days, edd_countdown, baby_size, latest_patient_summary } = patientContext as Record<string, unknown>
    const contextBlock = `Your pregnancy details:
- You are ${ga_weeks} weeks and ${ga_days} days pregnant
- ${edd_countdown} days until your estimated due date
- Baby size: about the size of a ${baby_size}
- Latest note from your care team: ${latest_patient_summary || 'No recent scan on file'}`

    const realHistory = history.slice(-10).map(h => ({
      role: h.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: h.content }],
    }))

    const sdkHistory = [
      { role: 'user' as const, parts: [{ text: contextBlock }] },
      { role: 'model' as const, parts: [{ text: "Thanks! I have your pregnancy details. I'm here to help 💜" }] },
      ...realHistory,
    ]

    const chat = model.startChat({ history: sdkHistory })
    const result = await chat.sendMessage(message)
    return result.response.text().trim()
  } catch (err) {
    console.error('Patient agent error:', err)
    return "I'm having a little trouble right now. Please try again in a moment! 💜"
  }
}
