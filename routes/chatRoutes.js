/**
 * routes/chatRoutes.js
 * ─────────────────────────────────────────────────────────────
 * ADVMEN Technologies — AI Chat Backend Endpoint with Groq API & Smart NLP Engine
 * ─────────────────────────────────────────────────────────────
 */

const express = require('express')
const router = express.Router()

const GROQ_SYSTEM_PROMPT = `You are ADVMEN AI, the official AI assistant for ADVMEN Technologies.
ADVMEN Technologies is a top IT solutions & digital agency based in Gurugram, Haryana, India.
Services offered:
- Full-Stack Web Development (MERN, React, Next.js)
- Mobile App Development (iOS & Android)
- Digital Marketing, Performance Marketing & SEO
- Branding, UI/UX & Graphic Design
- Media Production & Political Campaign Management

Contact Info:
- Email: info@advmen.com
- Phone/WhatsApp: +91 95196 02401
- Location: Jharsa Village, Sector 38, Gurugram, Haryana

Instructions:
Respond politely, concisely, and helpfully in the same language as the user (Hinglish or English).
Always encourage contacting info@advmen.com or +91 95196 02401 for project inquiries or job applications.`

/**
 * Smart Conversational NLP Engine (Handles Hinglish + English Queries)
 */
function getSmartFallbackResponse(userMessage) {
  const msg = (userMessage || '').toLowerCase().trim()

  // Greeting
  if (/^(hi|hello|hey|namaste|hlo|helo|greetings|ssup|kaise ho)/i.test(msg)) {
    return 'Namaste! Welcome to ADVMEN Technologies. Main ADVMEN ka AI Assistant hu. Main aapki kya sahayata kar sakta hu?'
  }

  // Identity / Who are you
  if (msg.includes('tum kon') || msg.includes('aap kon') || msg.includes('kon ho') || msg.includes('who are you') || msg.includes('who r u') || msg.includes('your name')) {
    return 'Main ADVMEN Technologies ka Smart AI Assistant hu! Main aapko humari IT services, Web/App Development, Digital Marketing, Internships aur hiring processes ke baare me jankari deta hu. Aap kya janna chahte hain?'
  }

  // Services / Kya karte ho
  if (msg.includes('service') || msg.includes('kya karte') || msg.includes('kya kam') || msg.includes('what do you do') || msg.includes('offer') || msg.includes('work')) {
    return `ADVMEN Technologies in key areas me specialize karti hai:

• Web & Web App Development (MERN Stack, Next.js, Custom Portals)
• Mobile App Development (iOS & Android)
• Digital Marketing, Performance Ads & SEO
• Brand Identity, Graphic Design & Creative Media
• Political & Corporate Campaign Management

Kisi bhi project ke baare me discuss karne ke liye contact karein:
Email: info@advmen.com | Call/WhatsApp: +91 95196 02401`
  }

  // Contact Info
  if (msg.includes('contact') || msg.includes('number') || msg.includes('phone') || msg.includes('email') || msg.includes('address') || msg.includes('location') || msg.includes('office') || msg.includes('sampark')) {
    return `Humare Official Contact Details:

• Official Email: info@advmen.com
• Phone / WhatsApp: +91 95196 02401
• Office Location: Sector 38, Jharsa Village, Gurugram (Gurgaon), Haryana, India
• Working Hours: Mon - Sat (9:00 AM - 7:00 PM)`
  }

  // Careers / Internship / Job Apply
  if (msg.includes('job') || msg.includes('intern') || msg.includes('career') || msg.includes('apply') || msg.includes('hiring') || msg.includes('vacancy') || msg.includes('stipend')) {
    return `Aap ADVMEN Technologies me Careers page ke dwara Internship & Experienced roles ke liye apply kar sakte hain.

• Application submit karte hi aapko email confirmation milega.
• Intern candidates ko instant Official WhatsApp Group link milta hai.
• Direct HR Email: info@advmen.com | HR Phone: +91 95196 02401`
  }

  // Price / Cost / Rate
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('charge') || msg.includes('kitna') || msg.includes('budget') || msg.includes('quote')) {
    return `Project pricing requirement aur features par depend karti hai.

Free custom estimate aur project consultation ke liye humare team se contact karein:
• Email: info@advmen.com
• Phone / WhatsApp: +91 95196 02401`
  }

  // Web / Website
  if (msg.includes('web') || msg.includes('website') || msg.includes('portal') || msg.includes('react') || msg.includes('node')) {
    return `Hum high-performance, responsive websites aur enterprise web portals design & develop karte hain. Kya aapko custom website ya web app banwana hai? Call/WhatsApp: +91 95196 02401`
  }

  // App / Mobile
  if (msg.includes('app') || msg.includes('android') || msg.includes('ios') || msg.includes('mobile')) {
    return `Hum modern, scalable iOS & Android mobile applications develop karte hain. Custom mobile app requirements ke liye connect karein: info@advmen.com | +91 95196 02401`
  }

  // Default fallback response
  return `Aapke message ke liye dhanyawad! Main ADVMEN Technologies ka AI Assistant hu.

Aap Web Development, Mobile Apps, Digital Marketing, ya Internship opportunities ke baare me puch sakte hain.

Direct Inquiry ke liye:
• Email: info@advmen.com
• Call/WhatsApp: +91 95196 02401`
}

// @route   POST /api/chat
// @desc    AI Chat query handler with Groq API & Smart NLP Fallback
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body
    if (!message) {
      return res.status(400).json({ success: false, reply: 'Message is required' })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (apiKey && !apiKey.includes('expired')) {
      const historyMsgs = Array.isArray(history)
        ? history.slice(-6).map((h) => ({
            role: h.type === 'user' ? 'user' : 'assistant',
            content: h.text,
          }))
        : []

      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: GROQ_SYSTEM_PROMPT },
              ...historyMsgs,
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 350,
          }),
        })

        if (groqRes.ok) {
          const data = await groqRes.json()
          const aiReply = data.choices?.[0]?.message?.content
          if (aiReply) {
            return res.status(200).json({ success: true, reply: aiReply, source: 'groq' })
          }
        }
      } catch (err) {
        console.warn('[Chat Backend] Groq API call failed:', err.message)
      }
    }

    // Smart Local NLP Engine Fallback
    const fallbackReply = getSmartFallbackResponse(message)
    return res.status(200).json({ success: true, reply: fallbackReply, source: 'nlp_engine' })
  } catch (err) {
    console.error('[Chat Backend] Error:', err)
    return res.status(200).json({
      success: true,
      reply: 'ADVMEN Technologies me aapka swagat hai! Kisi bhi inquiry ke liye info@advmen.com par email karein ya +91 95196 02401 par call/WhatsApp karein.',
    })
  }
})

module.exports = router
