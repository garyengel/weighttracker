import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { imageData, mediaType } = await req.json()
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageData } },
        { type: 'text', text: 'You are a nutrition expert. Identify the food in this image and estimate the calories. Respond ONLY with valid JSON, no markdown, no preamble: {"name": "food name and estimated portion", "calories": 000, "confidence": "low|medium|high", "notes": "brief note about the estimate"}' }
      ]}]
    })
  })
  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'
  try { return NextResponse.json(JSON.parse(text)) }
  catch { return NextResponse.json({ error: 'Failed to parse response', raw: text }, { status: 500 }) }
}
