import type {
  EventType,
  IDXApiResponse,
  IDXAnnouncementItem,
  ScrapedAnnouncement,
  ScrapingStats,
} from '@/types'

// API endpoint
const API_BASE = 'https://www.idx.co.id/primary/NewsAnnouncement/GetAllAnnouncement'
const API_URL_TEMPLATE = `${API_BASE}?keywords={keyword}&pageNumber={page}&pageSize={size}&lang=id`

// Search keywords for each event type
const SEARCH_KEYWORDS: Record<EventType, string[]> = {
  RIGHTS_ISSUE: ['hmetd', 'hak memesan efek'],
  MTO: ['tender offer', 'penawaran tender'],
  BACKDOOR_LISTING: ['backdoor', 'akuisisi aset', 'perubahan kegiatan usaha', 'pengambilalihan'],
}

/**
 * Fetches data from IDX API
 */
async function fetchFromAPI(keyword: string, page: number = 1, pageSize: number = 10): Promise<IDXApiResponse | null> {
  try {
    const url = API_URL_TEMPLATE
      .replace('{keyword}', encodeURIComponent(keyword))
      .replace('{page}', page.toString())
      .replace('{size}', pageSize.toString())

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch for keyword '${keyword}': ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data as IDXApiResponse
  } catch (error) {
    console.error(`Error fetching keyword '${keyword}':`, error)
    return null
  }
}

/**
 * Parses API response and extracts announcements
 */
function parseApiResponse(
  data: IDXApiResponse,
  eventType: EventType,
  seenUrls: Set<string>,
  stats: ScrapingStats
): ScrapedAnnouncement[] {
  const articles: ScrapedAnnouncement[] = []

  const results = data.Items || []
  if (!Array.isArray(results)) {
    console.warn('Unexpected API response structure')
    return articles
  }

  stats.total_fetched += results.length

  for (const item of results) {
    try {
      const title = (item.Title || '').trim()
      const code = (item.Code || '').trim()

      // Extract URL from Attachments - use main document (IsAttachment == 0)
      const attachments = item.Attachments || []
      let url = ''
      
      if (Array.isArray(attachments) && attachments.length > 0) {
        // Find main document (IsAttachment == 0)
        const mainDoc = attachments.find((att) => att.IsAttachment === 0)
        if (mainDoc) {
          url = mainDoc.FullSavePath || ''
        } else if (attachments.length > 0) {
          // Fallback to first attachment
          url = attachments[0].FullSavePath || ''
        }
      }

      // Skip if missing required fields
      if (!title || !url) {
        continue
      }

      // Check for duplicates
      if (seenUrls.has(url)) {
        stats.duplicates++
        continue
      }

      seenUrls.add(url)

      // Extract published date
      const publishedAt = item.PublishDate || ''

      // Append ticker to title if available
      const titleDisplay = code ? `${title} [${code}]` : title

      // Build article dict
      const article: ScrapedAnnouncement = {
        title: titleDisplay,
        url,
        source: 'idx',
        content: null, // API doesn't provide content, just PDF
        published_at: publishedAt,
        event_type: eventType,
        ticker: code || undefined,
      }

      // Track event type stats
      if (eventType === 'RIGHTS_ISSUE') {
        stats.rights_issue++
      } else if (eventType === 'MTO') {
        stats.mto++
      } else if (eventType === 'BACKDOOR_LISTING') {
        stats.backdoor++
      }

      articles.push(article)
    } catch (error) {
      console.error('Error parsing article item:', error)
      continue
    }
  }

  return articles
}

/**
 * Main scraping function
 */
export async function scrapeIDX(): Promise<{
  articles: ScrapedAnnouncement[]
  stats: ScrapingStats
}> {
  console.log('Starting IDX API scraping with keyword search...')

  // Statistics for summary
  const stats: ScrapingStats = {
    api_calls: 0,
    total_fetched: 0,
    saved: 0,
    duplicates: 0,
    rights_issue: 0,
    mto: 0,
    backdoor: 0,
  }

  // Track seen URLs to avoid duplicates
  const seenUrls = new Set<string>()
  const articles: ScrapedAnnouncement[] = []

  // Max articles per keyword to fetch
  const pageSize = 10

  // Fetch for each event type's keywords
  for (const [eventType, keywords] of Object.entries(SEARCH_KEYWORDS) as [EventType, string[]][]) {
    console.log(`Fetching ${eventType} announcements...`)

    for (const keyword of keywords) {
      try {
        stats.api_calls++

        // Fetch JSON data
        const data = await fetchFromAPI(keyword, 1, pageSize)
        if (!data) {
          console.warn(`Failed to fetch for keyword: ${keyword}`)
          continue
        }

        // Extract articles from response
        const fetched = parseApiResponse(data, eventType, seenUrls, stats)
        articles.push(...fetched)
      } catch (error) {
        console.error(`Error fetching keyword '${keyword}':`, error)
        continue
      }
    }
  }

  // Update final stats
  stats.saved = articles.length

  // Log summary
  console.log(
    `Scraping complete: ${stats.saved} saved, ${stats.duplicates} duplicates, ${stats.total_fetched} total fetched`
  )
  console.log(
    `Breakdown: ${stats.rights_issue} RIGHTS_ISSUE, ${stats.mto} MTO, ${stats.backdoor} BACKDOOR_LISTING`
  )

  return { articles, stats }
}

