import { sendServerError } from '../utils/errorResponse.js'

// ─── AI PROXY (Google Gemini) ───────────────────────────────────────
// Every "AI Tools" feature (Study Assistant, Resume Scorer, Translator, etc.)
// routes through this single endpoint. It accepts the same request shape
// the frontend already sends ({ model, max_tokens, system, messages }) and
// returns the same response shape the frontend already parses
// ({ content: [{ text }] }) — so no frontend files needed to change when
// swapping providers. Internally, it calls Google Gemini's free-tier API
// instead of Anthropic's paid one.
//
// Get a free key (no credit card required) at: https://aistudio.google.com/apikey

const GEMINI_MODEL = 'gemini-2.5-flash'

export const chat = async (req, res) => {
  try {
    const { system, messages, max_tokens } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages array is required.' })
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI features are not configured on this server yet.' })
    }

    // Gemini uses "user" / "model" roles (not "user" / "assistant"), and
    // wraps text in a `parts` array instead of a plain `content` string.
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const body = {
      contents,
      generationConfig: {
        maxOutputTokens: Math.min(max_tokens || 1000, 2000), // hard ceiling
      },
    }
    if (system) {
      body.system_instruction = { parts: [{ text: system }] }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ message: data?.error?.message || 'AI request failed.' })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Reshape into the same format the frontend already expects from
    // the old Anthropic-based proxy, so nothing else needs to change.
    res.json({ content: [{ text }] })
  } catch (err) {
    sendServerError(res, err)
  }
}