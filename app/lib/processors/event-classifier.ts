import type { EventType } from '@/types'

/**
 * Classifies an announcement based on its title and content
 * Returns event type and confidence score
 */
export function classifyEvent(title: string, content?: string | null): {
  eventType: EventType
  confidence: number
} {
  const text = `${title} ${content || ''}`.toLowerCase()

  // Keywords for each event type
  const rightsIssueKeywords = ['hmetd', 'hak memesan efek', 'rights issue', 'penawaran terbatas']
  const mtoKeywords = ['tender offer', 'penawaran tender', 'mto', 'mandatory tender offer']
  const backdoorKeywords = [
    'backdoor',
    'akuisisi aset',
    'perubahan kegiatan usaha',
    'pengambilalihan',
    'reverse takeover',
    'rtb',
  ]

  // Count matches for each type
  let rightsIssueScore = 0
  let mtoScore = 0
  let backdoorScore = 0

  rightsIssueKeywords.forEach((keyword) => {
    if (text.includes(keyword)) rightsIssueScore++
  })

  mtoKeywords.forEach((keyword) => {
    if (text.includes(keyword)) mtoScore++
  })

  backdoorKeywords.forEach((keyword) => {
    if (text.includes(keyword)) backdoorScore++
  })

  // Determine event type based on highest score
  const maxScore = Math.max(rightsIssueScore, mtoScore, backdoorScore)
  
  if (maxScore === 0) {
    // Default to BACKDOOR_LISTING if no match
    return { eventType: 'BACKDOOR_LISTING', confidence: 0.3 }
  }

  let eventType: EventType = 'BACKDOOR_LISTING'
  if (rightsIssueScore === maxScore) {
    eventType = 'RIGHTS_ISSUE'
  } else if (mtoScore === maxScore) {
    eventType = 'MTO'
  } else if (backdoorScore === maxScore) {
    eventType = 'BACKDOOR_LISTING'
  }

  // Calculate confidence (0.3 to 1.0)
  const confidence = Math.min(0.3 + maxScore * 0.2, 1.0)

  return { eventType, confidence }
}

/**
 * Extracts ticker code from title
 * Format: "Title [TICKER]" or "TICKER: Title"
 * Supports tickers with dash/hyphen like "INET-R"
 */
export function extractTicker(title: string): string | null {
  // Pattern: [TICKER] at the end (supports dash/hyphen)
  const bracketMatch = title.match(/\[([A-Z0-9-]+)\]$/)
  if (bracketMatch) {
    return bracketMatch[1]
  }

  // Pattern: TICKER: at the start (supports dash/hyphen)
  const colonMatch = title.match(/^([A-Z0-9-]+):/)
  if (colonMatch) {
    return colonMatch[1]
  }

  return null
}

