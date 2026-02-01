'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import { RefreshCw } from 'lucide-react'

export function ScrapeButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleScrape = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(`Scraped ${data.stats.saved} new announcements`)
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setResult('Scraping failed')
      }
    } catch (error) {
      console.error('Error scraping:', error)
      setResult('Error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      <Button
        onClick={handleScrape}
        disabled={loading}
        className="flex items-center justify-center gap-2 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="sm:hidden">{loading ? 'Scraping...' : 'Scrape'}</span>
        <span className="hidden sm:inline">{loading ? 'Scraping...' : 'Scrape IDX'}</span>
      </Button>
      {result && (
        <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">{result}</span>
      )}
    </div>
  )
}

