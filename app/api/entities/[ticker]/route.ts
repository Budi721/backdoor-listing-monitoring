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
      .select(`
        *,
        announcements:Announcement!Announcement_entityId_fkey (
          *,
          event:Event!Event_announcementId_fkey (
            *
          )
        ),
        ratios:FinancialRatio!FinancialRatio_entityId_fkey (
          *
        )
      `)
      .eq('ticker', ticker.toUpperCase())
      .single()

    if (entityError || !entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    // Sort announcements and ratios
    entity.announcements = (entity.announcements || []).sort((a: any, b: any) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    entity.ratios = (entity.ratios || []).sort((a: any, b: any) => 
      b.period.localeCompare(a.period)
    )

    if (!entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(entity)
  } catch (error) {
    console.error('Error fetching entity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entity' },
      { status: 500 }
    )
  }
}

