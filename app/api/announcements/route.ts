import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventType = searchParams.get('eventType')
    const entityId = searchParams.get('entityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db.from('Announcement').select(`
      *,
      Entity!Announcement_entityId_fkey (
        id,
        ticker,
        name,
        sector
      ),
      Event!Event_announcementId_fkey (
        id,
        eventType,
        tags,
        analystNotes
      )
    `, { count: 'exact' }).order('publishedAt', { ascending: false }).range(offset, offset + limit - 1)
    
    if (eventType) {
      query = query.eq('eventType', eventType)
    }
    
    if (entityId) {
      query = query.eq('entityId', entityId)
    }

    // Date filters
    if (startDate) {
      // Convert to ISO string if needed, ensure it's in format that Supabase can parse
      const startDateISO = new Date(startDate).toISOString()
      query = query.gte('publishedAt', startDateISO)
    }
    
    if (endDate) {
      // Set to end of day for endDate
      const endDateISO = new Date(endDate + 'T23:59:59.999Z').toISOString()
      query = query.lte('publishedAt', endDateISO)
    }

    const { data: announcements, count, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      announcements: announcements || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

