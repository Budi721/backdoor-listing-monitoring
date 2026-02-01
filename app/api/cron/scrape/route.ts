import { NextRequest, NextResponse } from 'next/server'
import { scrapeIDX } from '@/lib/scrapers/idx-scraper'
import { db } from '@/lib/db'
import { generateCuid } from '@/lib/utils'

/**
 * Cron job endpoint for scheduled scraping
 * Can be triggered by:
 * - Vercel Cron Jobs
 * - Manual API call
 * - External scheduler
 * 
 * To use with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/scrape",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Optional: Add authentication/authorization check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // If CRON_SECRET is set, require it in Authorization header
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('Starting scheduled IDX scraping...')
    
    // Scrape announcements
    const { articles, stats } = await scrapeIDX()

    // Process and save to database
    let saved = 0
    let duplicates = 0
    let entitiesCreated = 0

    for (const article of articles) {
      try {
        // Check if announcement already exists
        const { data: existing } = await db
          .from('Announcement')
          .select('id')
          .eq('url', article.url)
          .single()

        if (existing) {
          duplicates++
          continue
        }

        // Find or create entity
        let entityId = null
        if (article.ticker) {
          const { data: existingEntity } = await db
            .from('Entity')
            .select('id')
            .eq('ticker', article.ticker)
            .single()

          if (existingEntity) {
            entityId = existingEntity.id
          } else {
            const { data: newEntity, error: entityError } = await db
              .from('Entity')
              .insert({
                id: generateCuid(),
                ticker: article.ticker,
                name: article.ticker, // Will be updated later if needed
              })
              .select('id')
              .single()

            if (entityError) {
              console.error(`Error creating entity ${article.ticker}:`, entityError)
              continue
            }

            entityId = newEntity?.id || null
            if (entityId) entitiesCreated++
          }
        }

        // Create announcement
        const { error: insertError } = await db
          .from('Announcement')
          .insert({
            id: generateCuid(),
            title: article.title,
            url: article.url,
            source: article.source,
            publishedAt: new Date(article.published_at).toISOString(),
            eventType: article.event_type,
            confidenceScore: 0.5, // Default confidence
            entityId: entityId,
          })

        if (insertError) {
          console.error(`Error inserting announcement ${article.url}:`, insertError)
          continue
        }

        saved++
      } catch (error) {
        console.error(`Error saving article ${article.url}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Scraping completed',
      stats: {
        ...stats,
        saved,
        duplicates: duplicates + stats.duplicates,
        entitiesCreated,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in cron scraping route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to scrape announcements',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

