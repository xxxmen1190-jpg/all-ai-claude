/**
 * Sends an image (base64 dataURL) to the Claude vision API and returns
 * extracted text. Claude handles handwriting, screenshots, diagrams, etc.
 */
export async function extractTextFromImage(dataUrl: string): Promise<string> {
  // Strip the "data:<mime>;base64," prefix
  const [header, base64Data] = dataUrl.split(',')
  if (!base64Data) throw new Error('OCR: invalid dataURL')
  const mimeMatch = header.match(/data:([^;]+);/)
  const mediaType = (mimeMatch?.[1] ?? 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text', text: 'Extract ALL text visible in this image. If there is no text, describe the image content instead. Return only the extracted text or description, nothing else.' },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`OCR failed: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? ''
}
