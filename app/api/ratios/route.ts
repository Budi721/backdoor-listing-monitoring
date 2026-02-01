import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateCuid } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityId = searchParams.get('entityId')
    const ratioType = searchParams.get('ratioType')

    let query = db.from('FinancialRatio').select(`
      *,
      Entity!FinancialRatio_entityId_fkey (
        id,
        ticker,
        name,
        sector
      )
    `).order('period', { ascending: false })
    
    if (entityId) {
      query = query.eq('entityId', entityId)
    }
    
    if (ratioType) {
      query = query.eq('ratioType', ratioType)
    }

    const { data: ratios, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ ratios: ratios || [] })
  } catch (error) {
    console.error('Error fetching ratios:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ratios' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { entityId, ratioType, value, period, beforeAfterFlag } = body

    if (!entityId || !ratioType || value === undefined || !period) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify entity exists
    const { data: entity, error: entityError } = await db
      .from('Entity')
      .select('id')
      .eq('id', entityId)
      .single()

    if (entityError || !entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    const { data: ratio, error: insertError } = await db
      .from('FinancialRatio')
      .insert({
        id: generateCuid(),
        entityId,
        ratioType,
        value: parseFloat(value),
        period,
        beforeAfterFlag: beforeAfterFlag || null,
      })
      .select(`
        *,
        Entity!FinancialRatio_entityId_fkey (
          id,
          ticker,
          name,
          sector
        )
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ ratio: ratio || null }, { status: 201 })
  } catch (error) {
    console.error('Error creating ratio:', error)
    return NextResponse.json(
      { error: 'Failed to create ratio' },
      { status: 500 }
    )
  }
}

