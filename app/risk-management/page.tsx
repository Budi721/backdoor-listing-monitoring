'use client'

import { useState, useMemo } from 'react'
import { Navigation } from '@/components/Navigation'
import { Trash2, Plus, Calculator, RotateCcw } from 'lucide-react'

// Format number to Indonesian Rupiah
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format number with thousand separators
function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// Format rupiah untuk display di input (dengan thousand separators)
function formatRupiahInput(value: string): string {
  const num = parseFloat(value.replace(/[^\d]/g, '')) || 0
  if (num === 0) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}

// Parse rupiah dari input
function parseRupiahInput(value: string): number {
  return parseFloat(value.replace(/[^\d]/g, '')) || 0
}

// Format persen untuk display di input
function formatPercentInput(value: string): string {
  const num = parseFloat(value.replace(/[^\d.]/g, '')) || 0
  if (num === 0) return ''
  return `${num}%`
}

// Parse persen dari input
function parsePercentInput(value: string): number {
  return parseFloat(value.replace(/[^\d.]/g, '')) || 0
}

interface DCAEntry {
  id: string
  entryPrice: string
}

interface SingleEntry {
  id: string
  ticker: string
  entryPrice: string
  stopLossPrice: string
  riskPercentage: string
  leverage: string
}

export default function RiskManagementPage() {
  const [mode, setMode] = useState<'single' | 'dca'>('dca')
  
  // Shared settings for DCA mode
  const [accountBalance, setAccountBalance] = useState<string>('10000000') // Default 10 juta
  const [stopLossPrice, setStopLossPrice] = useState<string>('')
  const [riskPercentage, setRiskPercentage] = useState<string>('1.0')
  const [feePercentage, setFeePercentage] = useState<string>('0.4')
  const [leverage, setLeverage] = useState<string>('1')
  const [entries, setEntries] = useState<DCAEntry[]>([
    { id: '1', entryPrice: '' },
  ])
  const [takeProfitPrice, setTakeProfitPrice] = useState<string>('')

  // Single entry mode state
  const [singleEntries, setSingleEntries] = useState<SingleEntry[]>([
    {
      id: '1',
      ticker: '',
      entryPrice: '',
      stopLossPrice: '',
      riskPercentage: '2',
      leverage: '1',
    },
  ])
  const [singleAccountBalance, setSingleAccountBalance] = useState<string>('100000000')

  // Parse value helper
  const parseValue = (value: string): number => {
    const num = parseFloat(value.replace(/[^\d.]/g, '')) || 0
    return num
  }

  // Handle rupiah input change
  const handleRupiahChange = (value: string, setter: (value: string) => void) => {
    const raw = parseRupiahInput(value)
    setter(raw.toString())
  }

  // Handle percent input change
  const handlePercentChange = (value: string, setter: (value: string) => void) => {
    const raw = parsePercentInput(value)
    setter(raw.toString())
  }

  // Add new entry
  const addEntry = () => {
    const newEntry: DCAEntry = {
      id: Date.now().toString(),
      entryPrice: '',
    }
    setEntries([...entries, newEntry])
  }

  // Remove entry
  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== id))
    }
  }

  // Update entry
  const updateEntry = (id: string, value: string) => {
    const raw = parseRupiahInput(value)
    setEntries(
      entries.map((entry) =>
        entry.id === id ? { ...entry, entryPrice: raw.toString() } : entry
      )
    )
  }

  // Single entry mode functions
  const addSingleEntry = () => {
    const newEntry: SingleEntry = {
      id: Date.now().toString(),
      ticker: '',
      entryPrice: '',
      stopLossPrice: '',
      riskPercentage: '2',
      leverage: '1',
    }
    setSingleEntries([...singleEntries, newEntry])
  }

  const removeSingleEntry = (id: string) => {
    if (singleEntries.length > 1) {
      setSingleEntries(singleEntries.filter((entry) => entry.id !== id))
    }
  }

  const updateSingleEntry = (id: string, field: keyof SingleEntry, value: string) => {
    let processedValue = value
    if (field === 'entryPrice' || field === 'stopLossPrice') {
      processedValue = parseRupiahInput(value).toString()
    } else if (field === 'riskPercentage') {
      processedValue = parsePercentInput(value).toString()
    }
    setSingleEntries(
      singleEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: processedValue } : entry
      )
    )
  }

  // Reset all
  const resetAll = () => {
    if (mode === 'dca') {
      setAccountBalance('10000000')
      setStopLossPrice('')
      setRiskPercentage('1.0')
      setFeePercentage('0.4')
      setLeverage('1')
      setEntries([{ id: '1', entryPrice: '' }])
      setTakeProfitPrice('')
    } else {
      setSingleAccountBalance('100000000')
      setSingleEntries([{
        id: '1',
        ticker: '',
        entryPrice: '',
        stopLossPrice: '',
        riskPercentage: '2',
        leverage: '1',
      }])
    }
  }

  // Calculate lot sizing and risk for each entry
  const calculations = useMemo(() => {
    const balance = parseValue(accountBalance)
    const slPrice = parseValue(stopLossPrice)
    const riskPct = parseValue(riskPercentage)
    const feePct = parseValue(feePercentage) / 100
    const lev = parseValue(leverage) || 1

    // Total risk amount for all entries
    const totalRiskAmount = balance * (riskPct / 100)
    // Risk amount per entry (divided equally)
    const riskAmountPerEntry = entries.length > 0 ? totalRiskAmount / entries.length : 0

    return entries.map((entry) => {
      const entryPrice = parseValue(entry.entryPrice)

      // Calculate stop loss distance
      const stopLossDistance = entryPrice > 0 && slPrice > 0
        ? Math.abs(entryPrice - slPrice)
        : 0

      // Calculate lot size
      // Lot = Risk Amount / ((Entry Price - SL Price) × Leverage × (1 + Fee %))
      // Then convert to lot (1 lot = 100 shares)
      let lot = 0
      if (stopLossDistance > 0 && lev > 0 && entryPrice > 0) {
        const shares = riskAmountPerEntry / (stopLossDistance * lev * (1 + feePct))
        lot = shares / 100 // Convert shares to lot
      }

      // Risk percentage for this entry (%m)
      const riskPctForEntry = balance > 0 ? (riskAmountPerEntry / balance) * 100 : 0

      // Position value in Rupiah
      const positionValueRp = lot * entryPrice * 100 // lot × price × 100 shares

      return {
        lot,
        riskPctForEntry,
        riskAmountPerEntry,
        positionValueRp,
        stopLossDistance,
      }
    })
  }, [accountBalance, stopLossPrice, riskPercentage, feePercentage, leverage, entries])

  // Single entry mode calculations
  const singleCalculations = useMemo(() => {
    const balance = parseValue(singleAccountBalance)

    return singleEntries.map((entry) => {
      const entryPrice = parseValue(entry.entryPrice)
      const stopLossPrice = parseValue(entry.stopLossPrice)
      const riskPercentage = parseValue(entry.riskPercentage)
      const leverage = parseValue(entry.leverage) || 1

      // Calculate stop loss distance
      const stopLossDistance = entryPrice > 0 && stopLossPrice > 0
        ? Math.abs(entryPrice - stopLossPrice)
        : 0

      // Risk amount in Rupiah
      const riskAmount = balance * (riskPercentage / 100)

      // Calculate position size
      let recommendedSize = 0
      if (stopLossDistance > 0 && leverage > 0 && entryPrice > 0) {
        recommendedSize = riskAmount / (stopLossDistance * leverage)
      }

      // Position value
      const positionValue = recommendedSize * entryPrice

      return {
        riskAmount,
        stopLossDistance,
        recommendedSize,
        positionValue,
      }
    })
  }, [singleAccountBalance, singleEntries])

  // Single entry total risk
  const singleTotalRisk = useMemo(() => {
    return singleCalculations.reduce((sum, calc) => sum + calc.riskAmount, 0)
  }, [singleCalculations])

  const singleTotalRiskPercentage = useMemo(() => {
    const balance = parseValue(singleAccountBalance)
    return balance > 0 ? (singleTotalRisk / balance) * 100 : 0
  }, [singleTotalRisk, singleAccountBalance])

  const singleTotalPositionValue = useMemo(() => {
    return singleCalculations.reduce((sum, calc) => sum + calc.positionValue, 0)
  }, [singleCalculations])

  // Summary calculations
  const summary = useMemo(() => {
    const balance = parseValue(accountBalance)
    const slPrice = parseValue(stopLossPrice)
    const tpPrice = parseValue(takeProfitPrice)

    // Total lot
    const totalLot = calculations.reduce((sum, calc) => sum + calc.lot, 0)

    // Total risk percentage
    const totalRiskPct = calculations.reduce((sum, calc) => sum + calc.riskPctForEntry, 0)

    // Total risk amount (Rp)
    const totalRiskAmount = calculations.reduce((sum, calc) => sum + calc.riskAmountPerEntry, 0)

    // Estimated Average (weighted average entry price)
    const totalLotTimesPrice = calculations.reduce((sum, calc) => {
      const entryPrice = parseValue(entries[calculations.indexOf(calc)]?.entryPrice || '0')
      return sum + (calc.lot * entryPrice)
    }, 0)
    const estimatedAverage = totalLot > 0 ? totalLotTimesPrice / totalLot : 0

    // Estimated Loss (if hit SL)
    const estimatedLoss = calculations.reduce((sum, calc) => {
      const entryPrice = parseValue(entries[calculations.indexOf(calc)]?.entryPrice || '0')
      if (entryPrice > 0 && slPrice > 0 && entryPrice > slPrice) {
        return sum + (calc.lot * (entryPrice - slPrice) * 100)
      }
      return sum
    }, 0)

    // Estimated Profit (if hit TP)
    const estimatedProfit = tpPrice > 0 ? calculations.reduce((sum, calc) => {
      const entryPrice = parseValue(entries[calculations.indexOf(calc)]?.entryPrice || '0')
      if (entryPrice > 0 && tpPrice > entryPrice) {
        return sum + (calc.lot * (tpPrice - entryPrice) * 100)
      }
      return sum
    }, 0) : 0

    return {
      totalLot,
      totalRiskPct,
      totalRiskAmount,
      estimatedAverage,
      estimatedLoss,
      estimatedProfit,
    }
  }, [calculations, entries, stopLossPrice, takeProfitPrice, accountBalance])

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Risk Management</h1>
              <p className="text-sm text-gray-400">Kelola risiko dan hitung ukuran posisi dengan DCA</p>
            </div>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Mode Tabs */}
        <div className="bg-gray-900 border border-gray-700 rounded p-2 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setMode('single')}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              mode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Single Entry
          </button>
          <button
            onClick={() => setMode('dca')}
            className={`flex-1 px-4 py-2 rounded transition-colors ${
              mode === 'dca'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            DCA Multiple Entry
          </button>
        </div>

        {mode === 'dca' ? (
          <>
            {/* DCA Mode Input Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Input Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Balance (bukan equity, bukan cash)
              </label>
              <input
                type="text"
                value={formatRupiahInput(accountBalance)}
                onChange={(e) => handleRupiahChange(e.target.value, setAccountBalance)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Rp 10.000.000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SL Price (Stop Loss)
              </label>
              <input
                type="text"
                value={formatRupiahInput(stopLossPrice)}
                onChange={(e) => handleRupiahChange(e.target.value, setStopLossPrice)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Input SL price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Risk
              </label>
              <input
                type="text"
                value={formatPercentInput(riskPercentage)}
                onChange={(e) => handlePercentChange(e.target.value, setRiskPercentage)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="1.0%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fee
              </label>
              <input
                type="text"
                value={formatPercentInput(feePercentage)}
                onChange={(e) => handlePercentChange(e.target.value, setFeePercentage)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0.4%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Leverage
              </label>
              <input
                type="text"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="1"
              />
              <span className="text-xs text-gray-400">x</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={addEntry}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
            <button
              onClick={resetAll}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm sm:text-base"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Entry Prices Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Entry Prices (DCA)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {entries.map((entry, index) => (
              <div key={entry.id} className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Entry Price {index + 1}
                </label>
                <input
                  type="text"
                  value={formatRupiahInput(entry.entryPrice)}
                  onChange={(e) => updateEntry(entry.id, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Input Entry price"
                />
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="absolute top-8 right-2 text-red-400 hover:text-red-300"
                    title="Remove entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Results</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Entry</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">SL</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">lot</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">%m</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Rp</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => {
                  const calc = calculations[index]
                  const entryPrice = parseValue(entry.entryPrice)
                  return (
                    <tr key={entry.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-sm text-white">
                        {entryPrice > 0 ? formatRupiah(entryPrice) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-white">
                        {parseValue(stopLossPrice) > 0 ? formatRupiah(parseValue(stopLossPrice)) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-green-400 font-medium">
                        {calc.lot > 0 ? formatNumber(calc.lot) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-blue-400 font-medium">
                        {calc.riskPctForEntry > 0 ? formatNumber(calc.riskPctForEntry) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-medium">
                        {calc.positionValueRp > 0 ? formatRupiah(calc.positionValueRp) : '-'}
                      </td>
                    </tr>
                  )
                })}
                {/* Total Row */}
                <tr className="border-t-2 border-gray-600 bg-gray-800/50 font-semibold">
                  <td className="py-3 px-4 text-sm text-white">Total</td>
                  <td className="py-3 px-4 text-sm text-white">-</td>
                  <td className="py-3 px-4 text-sm text-green-400">
                    {summary.totalLot > 0 ? formatNumber(summary.totalLot) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-blue-400">
                    {summary.totalRiskPct > 0 ? formatNumber(summary.totalRiskPct) : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-white">
                    {summary.totalRiskAmount > 0 ? formatRupiah(summary.totalRiskAmount) : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Average
              </label>
              <input
                type="text"
                value={summary.estimatedAverage > 0 ? formatRupiah(summary.estimatedAverage) : ''}
                readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Loss
              </label>
              <input
                type="text"
                value={summary.estimatedLoss > 0 ? formatRupiah(summary.estimatedLoss) : ''}
                readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-red-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                TP (Take Profit)
              </label>
              <input
                type="text"
                value={formatRupiahInput(takeProfitPrice)}
                onChange={(e) => handleRupiahChange(e.target.value, setTakeProfitPrice)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Input TP price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Profit
              </label>
              <input
                type="text"
                value={summary.estimatedProfit > 0 ? formatRupiah(summary.estimatedProfit) : 'Rp -'}
                readOnly
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2.5 text-base text-green-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
          </>
        ) : (
          <>
            {/* Single Entry Mode */}
            <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6 mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Balance / Equity
              </label>
              <input
                type="text"
                value={formatRupiahInput(singleAccountBalance)}
                onChange={(e) => handleRupiahChange(e.target.value, setSingleAccountBalance)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-base sm:text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Rp 100.000.000"
              />
            </div>

            {/* Risk Summary */}
            <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Ringkasan Risiko</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Risk Amount</div>
                  <div className={`text-2xl font-bold ${singleTotalRiskPercentage > 10 ? 'text-red-400' : singleTotalRiskPercentage > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {formatRupiah(singleTotalRisk)}
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Risk Percentage</div>
                  <div className={`text-2xl font-bold ${singleTotalRiskPercentage > 10 ? 'text-red-400' : singleTotalRiskPercentage > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {formatNumber(singleTotalRiskPercentage)}%
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="text-sm text-gray-400 mb-1">Total Position Value</div>
                  <div className="text-2xl font-bold text-white">
                    {formatRupiah(singleTotalPositionValue)}
                  </div>
                </div>
              </div>
            </div>

            {/* Entries Table */}
            <div className="bg-gray-900 border border-gray-700 rounded p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold">Posisi Trading</h2>
                <button
                  onClick={addSingleEntry}
                  className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Entry
                </button>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Ticker</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Entry Price</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Stop Loss</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Risk %</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Leverage</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Risk Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Recommended Size</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Position Value</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {singleEntries.map((entry, index) => {
                      const calc = singleCalculations[index]
                      return (
                        <tr key={entry.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={entry.ticker}
                              onChange={(e) => updateSingleEntry(entry.id, 'ticker', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                              placeholder="BBRI"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={formatRupiahInput(entry.entryPrice)}
                              onChange={(e) => updateSingleEntry(entry.id, 'entryPrice', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                              placeholder="5000"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={formatRupiahInput(entry.stopLossPrice)}
                              onChange={(e) => updateSingleEntry(entry.id, 'stopLossPrice', e.target.value)}
                              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                              placeholder="4800"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={formatPercentInput(entry.riskPercentage)}
                              onChange={(e) => updateSingleEntry(entry.id, 'riskPercentage', e.target.value)}
                              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                              placeholder="2%"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={entry.leverage}
                              onChange={(e) => updateSingleEntry(entry.id, 'leverage', e.target.value)}
                              className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-base text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                              placeholder="1"
                            />
                            <span className="text-gray-400 ml-1">x</span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="font-medium text-blue-400">
                              {formatRupiah(calc.riskAmount)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="font-medium text-green-400">
                              {calc.recommendedSize > 0 ? formatNumber(calc.recommendedSize) : '-'}
                            </div>
                            <div className="text-xs text-gray-500">shares</div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="font-medium text-white">
                              {calc.positionValue > 0 ? formatRupiah(calc.positionValue) : '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => removeSingleEntry(entry.id)}
                              disabled={singleEntries.length === 1}
                              className={`p-2 rounded transition-colors ${
                                singleEntries.length === 1
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                              }`}
                              title="Hapus entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
