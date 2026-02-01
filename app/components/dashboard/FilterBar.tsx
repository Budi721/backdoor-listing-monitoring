'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { EventType } from '@/types'

const eventTypes: { value: EventType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Events' },
  { value: 'BACKDOOR_LISTING', label: 'Backdoor Listing' },
  { value: 'RIGHTS_ISSUE', label: 'Rights Issue' },
  { value: 'MTO', label: 'MTO' },
]

export function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get('eventType') || 'ALL'
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  const handleFilterChange = (eventType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (eventType === 'ALL') {
      params.delete('eventType')
    } else {
      params.set('eventType', eventType)
    }
    // Reset to page 1 when filter changes
    params.delete('page')
    router.push(`/?${params.toString()}`)
  }

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(type, value)
    } else {
      params.delete(type)
    }
    // Reset to page 1 when date filter changes
    params.delete('page')
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="space-y-3 border-b border-gray-700 pb-3">
      {/* Event Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="flex items-center gap-2 min-w-max sm:min-w-0">
          {eventTypes.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`px-3 py-2 min-h-[44px] text-xs sm:text-sm rounded transition-colors whitespace-nowrap ${
                currentFilter === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <label htmlFor="startDate" className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
            From:
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 min-h-[44px] text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 sm:flex-none">
          <label htmlFor="endDate" className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
            To:
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 min-h-[44px] text-sm bg-gray-800 border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete('startDate')
              params.delete('endDate')
              params.delete('page')
              router.push(`/?${params.toString()}`)
            }}
            className="px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors whitespace-nowrap"
          >
            Clear Dates
          </button>
        )}
      </div>
    </div>
  )
}

