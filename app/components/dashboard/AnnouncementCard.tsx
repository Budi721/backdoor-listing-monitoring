import Link from 'next/link'
import type { EventType } from '@/types'

interface AnnouncementCardProps {
  id: string
  title: string
  url: string
  publishedAt: Date
  eventType: EventType
  confidenceScore: number | null
  ticker?: string | null
  entityName?: string | null
}

const eventTypeColors: Record<EventType, string> = {
  RIGHTS_ISSUE: 'bg-yellow-600',
  MTO: 'bg-blue-600',
  BACKDOOR_LISTING: 'bg-red-600',
}

const eventTypeLabels: Record<EventType, string> = {
  RIGHTS_ISSUE: 'Rights Issue',
  MTO: 'MTO',
  BACKDOOR_LISTING: 'Backdoor',
}

export function AnnouncementCard({
  title,
  url,
  publishedAt,
  eventType,
  confidenceScore,
  ticker,
  entityName,
}: AnnouncementCardProps) {
  const date = new Date(publishedAt).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="border border-gray-700 bg-gray-900 p-2 sm:p-3 hover:bg-gray-800 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2">
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
            <span className={`px-1.5 sm:px-2 py-0.5 text-xs font-semibold rounded ${eventTypeColors[eventType]}`}>
              {eventTypeLabels[eventType]}
            </span>
            {ticker && (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-bold rounded bg-blue-700 text-white font-mono">
                {ticker}
              </span>
            )}
            {confidenceScore !== null && (
              <span className="text-xs text-gray-400">
                {(confidenceScore * 100).toFixed(0)}%
              </span>
            )}
          </div>
          <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-100 mb-1 line-clamp-2">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-gray-500">
            <span>{date}</span>
            {entityName && <span>• {entityName}</span>}
            {ticker && (
              <Link
                href={`/entity/${ticker}`}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View Details
              </Link>
            )}
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm whitespace-nowrap self-start sm:self-auto mt-1 sm:mt-0"
        >
          View PDF →
        </a>
      </div>
    </div>
  )
}

