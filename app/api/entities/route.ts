import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db.from('Entity').select('*', { count: 'exact' }).order('ticker', { ascending: true }).range(offset, offset + limit - 1)
    
    if (ticker) {
      query = query.ilike('ticker', `%${ticker}%`)
    }

    const { data: entities, count, error } = await query

    if (error) {
      throw error
    }

    // Get counts for each entity
    const entitiesWithCounts = await Promise.all(
      (entities || []).map(async (entity: any) => {
        const [announcementsCount, ratiosCount] = await Promise.all([
          db.from('Announcement').select('id', { count: 'exact', head: true }).eq('entityId', entity.id),
          db.from('FinancialRatio').select('id', { count: 'exact', head: true }).eq('entityId', entity.id),
        ])
        
        return {
          ...entity,
          _count: {
            announcements: announcementsCount.count || 0,
            ratios: ratiosCount.count || 0,
          },
        }
      })
    )

    return NextResponse.json({
      entities: entitiesWithCounts,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching entities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entities' },
      { status: 500 }
    )
  }
}

