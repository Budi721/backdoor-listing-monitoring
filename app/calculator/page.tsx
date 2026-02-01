'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Navigation } from '@/components/Navigation'

type RatioType = 'liquidity' | 'leverage' | 'valuation'
type BeforeAfter = 'before' | 'after' | null

interface Entity {
  id: string
  ticker: string
  name: string | null
}

interface FinancialRatio {
  id: string
  ratioType: string
  value: number
  period: string
  beforeAfterFlag: string | null
  entity: Entity
}

export default function CalculatorPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string>('')
  const [ratioType, setRatioType] = useState<RatioType>('liquidity')
  const [value, setValue] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfter>(null)
  const [loading, setLoading] = useState(false)
  const [savedRatios, setSavedRatios] = useState<FinancialRatio[]>([])
  const [message, setMessage] = useState<string | null>(null)

  // Fetch entities
  useEffect(() => {
    async function fetchEntities() {
      try {
        const response = await fetch('/api/entities')
        const data = await response.json()
        setEntities(data.entities || [])
      } catch (error) {
        console.error('Error fetching entities:', error)
      }
    }
    fetchEntities()
  }, [])

  // Fetch saved ratios for selected entity
  useEffect(() => {
    if (!selectedEntityId) {
      setSavedRatios([])
      return
    }

    async function fetchRatios() {
      try {
        const response = await fetch(`/api/ratios?entityId=${selectedEntityId}`)
        const data = await response.json()
        setSavedRatios(data.ratios || [])
      } catch (error) {
        console.error('Error fetching ratios:', error)
      }
    }
    fetchRatios()
  }, [selectedEntityId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!selectedEntityId || !value || !period) {
      setMessage('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ratios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId: selectedEntityId,
          ratioType,
          value: parseFloat(value),
          period,
          beforeAfterFlag: beforeAfter,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Ratio saved successfully!')
        setValue('')
        setPeriod('')
        setBeforeAfter(null)
        // Refresh ratios
        const ratiosResponse = await fetch(`/api/ratios?entityId=${selectedEntityId}`)
        const ratiosData = await ratiosResponse.json()
        setSavedRatios(ratiosData.ratios || [])
      } else {
        setMessage(data.error || 'Failed to save ratio')
      }
    } catch (error) {
      console.error('Error saving ratio:', error)
      setMessage('Error occurred while saving')
    } finally {
      setLoading(false)
    }
  }

  const ratioTypeOptions: { value: RatioType; label: string }[] = [
    { value: 'liquidity', label: 'Liquidity' },
    { value: 'leverage', label: 'Leverage' },
    { value: 'valuation', label: 'Valuation' },
  ]

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Financial Ratio Calculator</h1>
              <p className="text-sm text-gray-400">Calculate and compare financial ratios</p>
            </div>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-gray-900 border border-gray-700 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Add New Ratio</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Entity *
                </label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">Select entity...</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.ticker} {entity.name ? `- ${entity.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Ratio Type *
                </label>
                <select
                  value={ratioType}
                  onChange={(e) => setRatioType(e.target.value as RatioType)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  {ratioTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Value *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Period *
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 2024-Q1, 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Before/After Corporate Action
                </label>
                <select
                  value={beforeAfter || ''}
                  onChange={(e) =>
                    setBeforeAfter(
                      e.target.value === '' ? null : (e.target.value as BeforeAfter)
                    )
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">None</option>
                  <option value="before">Before</option>
                  <option value="after">After</option>
                </select>
              </div>

              {message && (
                <div
                  className={`p-3 rounded text-sm ${
                    message.includes('success')
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}
                >
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Ratio'}
              </Button>
            </form>
          </div>

          {/* Saved Ratios */}
          <div className="bg-gray-900 border border-gray-700 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Saved Ratios</h2>
            {selectedEntityId ? (
              savedRatios.length > 0 ? (
                <div className="space-y-2">
                  {savedRatios.map((ratio) => (
                    <div
                      key={ratio.id}
                      className="bg-gray-800 border border-gray-700 rounded p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white capitalize">
                          {ratio.ratioType}
                        </span>
                        <span className="text-xs text-gray-400">{ratio.period}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-mono text-blue-400">
                          {ratio.value.toFixed(2)}
                        </span>
                        {ratio.beforeAfterFlag && (
                          <span className="text-xs text-gray-500 capitalize">
                            {ratio.beforeAfterFlag}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No ratios saved for this entity yet.</p>
              )
            ) : (
              <p className="text-gray-400 text-sm">Select an entity to view saved ratios.</p>
            )}
          </div>
        </div>

        {/* Comparison View */}
        {savedRatios.length > 0 && (
          <div className="mt-6 bg-gray-900 border border-gray-700 rounded p-6">
            <h2 className="text-lg font-semibold mb-4">Before/After Comparison</h2>
            <div className="grid grid-cols-2 gap-4">
              {['before', 'after'].map((flag) => {
                const ratios = savedRatios.filter((r) => r.beforeAfterFlag === flag)
                if (ratios.length === 0) return null

                return (
                  <div key={flag} className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-3 capitalize">
                      {flag} Corporate Action
                    </h3>
                    <div className="space-y-2">
                      {ratios.map((ratio) => (
                        <div key={ratio.id} className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 capitalize">
                            {ratio.ratioType}
                          </span>
                          <span className="text-sm font-mono text-white">
                            {ratio.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

