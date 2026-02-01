import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import type { EventType } from '@/types'

interface PageProps {
  params: Promise<{ ticker: string }>
}

const eventTypeColors: Record<EventType, string> = {
  RIGHTS_ISSUE: 'bg-yellow-600',
  MTO: 'bg-blue-600',
  BACKDOOR_LISTING: 'bg-red-600',
}

const eventTypeLabels: Record<EventType, string> = {
  RIGHTS_ISSUE: 'Rights Issue',
  MTO: 'MTO',
  BACKDOOR_LISTING: 'Backdoor Listing',
}

export default async function EntityPage({ params }: PageProps) {
  const { ticker } = await params
  const tickerUpper = ticker.toUpperCase()

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
    .eq('ticker', tickerUpper)
    .single()

  if (entityError || !entity) {
    notFound()
  }

  // Sort announcements and ratios
  entity.announcements = (entity.announcements || []).sort((a: any, b: any) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  entity.ratios = (entity.ratios || []).sort((a: any, b: any) => 
    b.period.localeCompare(a.period)
  )


  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4 mb-3">
            <Link
              href="/"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{entity.ticker}</h1>
              {entity.name && (
                <p className="text-sm text-gray-400">{entity.name}</p>
              )}
              {entity.sector && (
                <p className="text-xs text-gray-500">{entity.sector}</p>
              )}
            </div>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400 mb-1">Announcements</div>
            <div className="text-2xl font-bold text-white">
              {entity.announcements.length}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400 mb-1">Backdoor Signals</div>
            <div className="text-2xl font-bold text-red-400">
              {(entity.announcements || []).filter((a: any) => a.eventType === 'BACKDOOR_LISTING').length}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400 mb-1">Rights Issues</div>
            <div className="text-2xl font-bold text-yellow-400">
              {(entity.announcements || []).filter((a: any) => a.eventType === 'RIGHTS_ISSUE').length}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-4 rounded">
            <div className="text-sm text-gray-400 mb-1">Financial Ratios</div>
            <div className="text-2xl font-bold text-blue-400">
              {entity.ratios.length}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Timeline</h2>
          <div className="space-y-3">
            {(entity.announcements || []).map((announcement: any) => {
              const date = new Date(announcement.publishedAt).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })

              return (
                <div
                  key={announcement.id}
                  className="border-l-2 border-gray-700 pl-4 py-2 bg-gray-900 rounded-r"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            eventTypeColors[announcement.eventType as EventType]
                          }`}
                        >
                          {eventTypeLabels[(announcement.eventType || 'BACKDOOR_LISTING') as EventType]}
                        </span>
                        <span className="text-xs text-gray-500">{date}</span>
                        {announcement.confidenceScore !== null && (
                          <span className="text-xs text-gray-400">
                            {(announcement.confidenceScore * 100).toFixed(0)}% confidence
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-gray-100 mb-1">
                        {announcement.title}
                      </h3>
                        {announcement.event && (announcement.event as any).analystNotes && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          {(announcement.event as any).analystNotes}
                        </p>
                      )}
                    </div>
                    <a
                      href={announcement.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      PDF
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Financial Ratios */}
        {entity.ratios.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Financial Ratios</h2>
            <div className="bg-gray-900 border border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-300">Period</th>
                    <th className="px-4 py-2 text-left text-gray-300">Type</th>
                    <th className="px-4 py-2 text-right text-gray-300">Value</th>
                    <th className="px-4 py-2 text-left text-gray-300">Before/After</th>
                  </tr>
                </thead>
                <tbody>
                  {(entity.ratios || []).map((ratio: any) => (
                    <tr key={ratio.id} className="border-t border-gray-700">
                      <td className="px-4 py-2 text-gray-300">{ratio.period}</td>
                      <td className="px-4 py-2 text-gray-300 capitalize">
                        {ratio.ratioType}
                      </td>
                      <td className="px-4 py-2 text-right text-white font-mono">
                        {ratio.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-gray-400 capitalize">
                        {ratio.beforeAfterFlag || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!entity.announcements || entity.announcements.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <p>No announcements found for this entity.</p>
          </div>
        )}
      </main>
    </div>
  )
}

