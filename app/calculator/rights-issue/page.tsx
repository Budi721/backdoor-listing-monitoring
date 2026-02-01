'use client'

import { useState, useMemo } from 'react'
import { Navigation } from '@/components/Navigation'

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
  return new Intl.NumberFormat('id-ID').format(value)
}

export default function RightsIssueCalculatorPage() {
  // Input states
  const [hargaRataRata, setHargaRataRata] = useState<string>('')
  const [hargaCum, setHargaCum] = useState<string>('')
  const [rasioLama, setRasioLama] = useState<string>('')
  const [rasioBaru, setRasioBaru] = useState<string>('')
  const [lot, setLot] = useState<string>('')
  const [hargaTebus, setHargaTebus] = useState<string>('')
  
  // Bonus Waran states
  const [mendapatWaran, setMendapatWaran] = useState<boolean>(false)
  const [rasioWaran, setRasioWaran] = useState<string>('')
  const [hargaWaran, setHargaWaran] = useState<string>('')
  
  // Simulasi harga
  const [hargaSimulasi, setHargaSimulasi] = useState<string>('')

  // Parse input values
  const parseValue = (value: string): number => {
    const num = parseFloat(value.replace(/[^\d.]/g, '')) || 0
    return num
  }

  // Calculations
  const calculations = useMemo(() => {
    const hargaRataRataNum = parseValue(hargaRataRata)
    const hargaCumNum = parseValue(hargaCum)
    const rasioLamaNum = parseValue(rasioLama) || 1
    const rasioBaruNum = parseValue(rasioBaru) || 1
    const lotNum = parseValue(lot)
    const hargaTebusNum = parseValue(hargaTebus)
    const rasioWaranNum = parseValue(rasioWaran) || 0
    const hargaWaranNum = parseValue(hargaWaran) || 0
    const hargaSimulasiNum = parseValue(hargaSimulasi) || 0

    // Basic calculations
    // Convert lot to shares: 1 lot = 100 shares
    const jumlahSahamAwal = lotNum * 100
    const hmetdDiterima = ((lotNum * 100) / rasioLamaNum) * rasioBaruNum
    const totalBiayaTebus = hmetdDiterima * hargaTebusNum
    const totalSahamSetelahTebus = (lotNum * 100) + hmetdDiterima
    const totalModalSetelahTebus = ((lotNum * 100) * hargaRataRataNum) + totalBiayaTebus
    const hargaTeoritis = totalSahamSetelahTebus > 0 
      ? totalModalSetelahTebus / totalSahamSetelahTebus 
      : 0
    const potensiProfitTeoritis = (totalSahamSetelahTebus * hargaTeoritis) - ((lotNum * 100) * hargaRataRataNum) - totalBiayaTebus
    const perubahanPortofolioPraTebus = ((lotNum * 100) * hargaCumNum) - ((lotNum * 100) * hargaRataRataNum)
    // Nilai portofolio = Total modal setelah tebus + Profit/Loss teoritis
    const nilaiPortofolioTeoritis = totalModalSetelahTebus + perubahanPortofolioPraTebus

    // Warrant calculations
    const totalWaran = mendapatWaran ? hmetdDiterima * rasioWaranNum : 0
    const potensiProfitWaran = totalWaran * hargaWaranNum
    const totalProfitTermasukWaran = potensiProfitTeoritis + potensiProfitWaran + perubahanPortofolioPraTebus


    // Simulation calculations
    const nilaiPortofolioSimulasi = totalSahamSetelahTebus * hargaSimulasiNum
    const profitTanpaWaran = nilaiPortofolioSimulasi - ((lotNum * 100) * hargaRataRataNum) - totalBiayaTebus
    const profitTermasukWaranSimulasi = profitTanpaWaran + potensiProfitWaran

    return {
      jumlahSahamAwal,
      hmetdDiterima,
      totalBiayaTebus,
      totalSahamSetelahTebus,
      totalModalSetelahTebus,
      hargaTeoritis,
      potensiProfitTeoritis,
      perubahanPortofolioPraTebus,
      nilaiPortofolioTeoritis,
      totalWaran,
      potensiProfitWaran,
      totalProfitTermasukWaran,
      nilaiPortofolioSimulasi,
      profitTanpaWaran,
      profitTermasukWaranSimulasi,
    }
  }, [hargaRataRata, hargaCum, rasioLama, rasioBaru, lot, hargaTebus, mendapatWaran, rasioWaran, hargaWaran, hargaSimulasi])

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">Kalkulator Rights Issue</h1>
              <p className="text-sm text-gray-400">Hitung potensi profit dari rights issue</p>
            </div>
          </div>
          <Navigation />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Input Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Input Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Harga Rata-rata
                </label>
                <input
                  type="text"
                  value={hargaRataRata}
                  onChange={(e) => setHargaRataRata(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Masukkan harga rata-rata"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Harga Cum (Menjelang RI)
                </label>
                <input
                  type="text"
                  value={hargaCum}
                  onChange={(e) => setHargaCum(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Masukkan harga cum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Rasio Rights Issue (Lama : Baru)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rasioLama}
                    onChange={(e) => setRasioLama(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Masukkan rasio lama"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="text"
                    value={rasioBaru}
                    onChange={(e) => setRasioBaru(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Masukkan rasio baru"
                  />
                </div>
              </div>
            </div>

              {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Lot
                </label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Masukkan jumlah lot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Harga Tebus (RI Price)
                </label>
                <input
                  type="text"
                  value={hargaTebus}
                  onChange={(e) => setHargaTebus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Masukkan harga tebus"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6 mb-6">
          <p className="text-sm text-gray-400 mb-2">
            Lihat ringkasan modal, HMETD, dan harga teoritis setelah menebus.
          </p>
          <h2 className="text-lg font-semibold mb-4">Ringkasan Rights Issue</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">Jumlah Saham Awal</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(calculations.jumlahSahamAwal)}
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">Total Biaya Tebus</div>
                <div className="text-xl font-bold text-white">
                  {formatRupiah(calculations.totalBiayaTebus)}
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">Harga Teoritis</div>
                <div className="text-xl font-bold text-green-400">
                  {formatRupiah(calculations.hargaTeoritis)}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">HMETD Diterima</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(calculations.hmetdDiterima)}
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">Total Saham Setelah Tebus</div>
                <div className="text-xl font-bold text-white">
                  {formatNumber(calculations.totalSahamSetelahTebus)}
                </div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">Total Modal Setelah Tebus</div>
                <div className="text-xl font-bold text-white">
                  {formatRupiah(calculations.totalModalSetelahTebus)}
                </div>
              </div>
            </div>
          </div>

          {/* Profit Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className={`rounded p-4 ${calculations.potensiProfitTeoritis >= 0 ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
              <div className="text-sm text-gray-400 mb-1">Potensi Profit (Harga Teoritis)</div>
              <div className={`text-xl font-bold ${calculations.potensiProfitTeoritis >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatRupiah(calculations.potensiProfitTeoritis)}
              </div>
            </div>
            <div className={`rounded p-4 ${calculations.perubahanPortofolioPraTebus >= 0 ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
              <div className="text-sm text-gray-400 mb-1">Perubahan Portofolio (Pra Tebus)</div>
              <div className={`text-xl font-bold ${calculations.perubahanPortofolioPraTebus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatRupiah(calculations.perubahanPortofolioPraTebus)}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded p-4">
            <div className="text-sm text-gray-400 mb-1">Nilai Portofolio (Harga Teoritis)</div>
            <div className="text-2xl font-bold text-white">
              {formatRupiah(calculations.nilaiPortofolioTeoritis)}
            </div>
          </div>
        </div>

        {/* Bonus Waran Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Bonus Waran</h2>
              <p className="text-sm text-gray-400">
                Aktifkan jika rights issue memberikan waran per saham RI.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mendapatWaran}
                onChange={(e) => setMendapatWaran(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {mendapatWaran && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Rasio Waran (per 1 saham RI)
                  </label>
                  <input
                    type="text"
                    value={rasioWaran}
                    onChange={(e) => setRasioWaran(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Masukkan rasio waran"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Harga Waran (potensi jual)
                  </label>
                  <input
                    type="text"
                    value={hargaWaran}
                    onChange={(e) => setHargaWaran(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Masukkan harga waran"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 border border-gray-700 rounded p-3">
                  <div className="text-sm text-gray-400 mb-1">Total Waran</div>
                  <div className="text-xl font-bold text-white">
                    {formatNumber(calculations.totalWaran)}
                  </div>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded p-3">
                  <div className="text-sm text-gray-400 mb-1">Potensi Profit Waran</div>
                  <div className="text-xl font-bold text-green-400">
                    {formatRupiah(calculations.potensiProfitWaran)}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-gray-800 border border-gray-700 rounded p-4">
                <div className="text-sm text-gray-400 mb-1">Total Profit (termasuk Waran)</div>
                <div className={`text-2xl font-bold ${calculations.totalProfitTermasukWaran >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatRupiah(calculations.totalProfitTermasukWaran)}
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Total (Modal + Profit): {formatRupiah(calculations.totalModalSetelahTebus + calculations.totalProfitTermasukWaran)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Price Simulation Section */}
        <div className="bg-gray-900 border border-gray-700 rounded p-6">
          <p className="text-sm text-gray-400 mb-2">
            Uji berbagai harga pasar setelah cum date untuk melihat nilai portofolio.
          </p>
          <h2 className="text-lg font-semibold mb-4">Simulasi Harga Setelah Rights Issue</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Harga Simulasi
            </label>
            <input
              type="text"
              value={hargaSimulasi}
              onChange={(e) => setHargaSimulasi(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Masukkan harga simulasi"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <div className="text-sm text-gray-400 mb-1">Nilai Portofolio</div>
              <div className="text-xl font-bold text-white">
                {formatRupiah(calculations.nilaiPortofolioSimulasi)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <div className="text-sm text-gray-400 mb-1">Profit tanpa Waran</div>
              <div className={`text-xl font-bold ${calculations.profitTanpaWaran >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatRupiah(calculations.profitTanpaWaran)}
              </div>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <div className="text-sm text-gray-400 mb-1">Profit termasuk Waran</div>
              <div className={`text-xl font-bold ${calculations.profitTermasukWaranSimulasi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatRupiah(calculations.profitTermasukWaranSimulasi)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

