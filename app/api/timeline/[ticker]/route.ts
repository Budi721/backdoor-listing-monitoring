import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params

    const { data: entity, error: entityError } = await db
      .from('Entity')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single()

    if (entityError || !entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    // Get all announcements and ratios, sorted by date
    const [announcementsResult, ratiosResult] = await Promise.all([
      db
        .from('Announcement')
        .select(`
          *,
          event:Event!Event_announcementId_fkey (
            *
          )
        `)
        .eq('entityId', entity.id)
        .order('publishedAt', { ascending: false }),
      db
        .from('FinancialRatio')
        .select('*')
        .eq('entityId', entity.id)
        .order('period', { ascending: false }),
    ])

    const announcements = announcementsResult.data || []
    const ratios = ratiosResult.data || []

    // Combine and sort by date
    const timeline = [
      ...announcements.map((a: any) => ({
        type: 'announcement' as const,
        id: a.id,
        date: new Date(a.publishedAt),
        data: a,
      })),
      ...ratios.map((r: any) => ({
        type: 'ratio' as const,
        id: r.id,
        date: new Date(r.createdAt),
        data: r,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    return NextResponse.json({
      entity,
      timeline,
    })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}

