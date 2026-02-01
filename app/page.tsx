import { Suspense } from 'react'
import { AnnouncementCard } from './components/dashboard/AnnouncementCard'
import { ScrapeButton } from './components/dashboard/ScrapeButton'
import { FilterBar } from './components/dashboard/FilterBar'
import { Pagination } from './components/dashboard/Pagination'
import { Navigation } from './components/Navigation'
import { extractTicker } from '@/lib/processors/event-classifier'

function FilterBarWrapper() {
  return (
    <Suspense fallback={<div className="h-10" />}>
      <FilterBar />
    </Suspense>
  )
}

interface PageProps {
  searchParams: Promise<{ 
    eventType?: string
    page?: string
    startDate?: string
    endDate?: string
  }>
}

async function getAnnouncements(
  eventType?: string,
  page: number = 1,
  startDate?: string,
  endDate?: string
) {
  const limit = 20
  const offset = (page - 1) * limit

  // For server components, we can directly import and use the API logic
  // or use internal fetch. Using internal fetch with absolute URL
  const params = new URLSearchParams()
  if (eventType && eventType !== 'ALL') {
    params.set('eventType', eventType)
  }
  params.set('limit', limit.toString())
  params.set('offset', offset.toString())
  if (startDate) {
    params.set('startDate', startDate)
  }
  if (endDate) {
    params.set('endDate', endDate)
  }

  try {
    // For server components, construct the URL properly
    // In production, use the actual domain, in development use localhost
    let baseUrl = 'http://localhost:3000'
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    }
    
    const response = await fetch(`${baseUrl}/api/announcements?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Error fetching announcements:', response.statusText)
      return { announcements: [], total: 0, page, limit }
    }

    const data = await response.json()
    return {
      announcements: data.announcements || [],
      total: data.total || 0,
      page,
      limit,
    }
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return { announcements: [], total: 0, page, limit }
  }
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const eventType = params.eventType
  const page = parseInt(params.page || '1')
  const startDate = params.startDate
  const endDate = params.endDate

  const { announcements, total, limit } = await getAnnouncements(
    eventType,
    page,
    startDate,
    endDate
  )

  const totalPages = Math.ceil(total / limit)
  const backdoorCount = announcements.filter((a: any) => a.eventType === 'BACKDOOR_LISTING').length
  const rightsIssueCount = announcements.filter((a: any) => a.eventType === 'RIGHTS_ISSUE').length

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Backdoor Listing Monitor</h1>
              <p className="text-xs sm:text-sm text-gray-400">IDX Capital Market Intelligence</p>
            </div>
            <ScrapeButton />
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-3 sm:mb-4">
          <FilterBarWrapper />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gray-900 border border-gray-700 p-3 sm:p-4 rounded">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Announcements</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-gray-500 mt-1">Showing {announcements.length} on this page</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-3 sm:p-4 rounded">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Backdoor Listings</div>
            <div className="text-xl sm:text-2xl font-bold text-red-400">{backdoorCount}</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-3 sm:p-4 rounded">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Rights Issues</div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">{rightsIssueCount}</div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-2 mb-6">
          {announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No announcements found. Click "Scrape IDX" to fetch data.</p>
            </div>
          ) : (
            announcements.map((announcement: any) => {
              // Extract ticker from entity or fallback to title
              const entity = announcement.entity
              const entityTicker = entity?.ticker
              const title = announcement.title || ''
              
              // Use entity ticker if available, otherwise extract from title
              const ticker = entityTicker || extractTicker(title)
              
              return (
                <AnnouncementCard
                  key={announcement.id}
                  id={announcement.id}
                  title={announcement.title}
                  url={announcement.url}
                  publishedAt={new Date(announcement.publishedAt)}
                  eventType={announcement.eventType as any}
                  confidenceScore={announcement.confidenceScore}
                  ticker={ticker}
                  entityName={entity?.name}
                />
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limit}
          />
        )}
      </main>
    </div>
  )
}
