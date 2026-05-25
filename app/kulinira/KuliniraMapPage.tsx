'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Must be dynamically imported with ssr: false — Leaflet requires browser's `window`
const KuliniraMap = dynamic(() => import('@/app/components/kulinira/KuliniraMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-amber-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-500">Memuat peta…</p>
      </div>
    </div>
  ),
})

export default function KuliniraMapPage() {
  return (
    /*
     * overflow-hidden + fixed height → cegah body scroll
     * w-screen → lebar penuh viewport, tidak terpengaruh padding body
     * flex-1 min-h-0 pada map wrapper → kunci agar Leaflet tahu ukuran container-nya;
     *   tanpa min-h-0, flex children defaultnya min-height:auto → overflow → tile terpotong
     */
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100dvh', width: '100vw' }}
    >
      {/* ── Navbar ── */}
      <nav className="flex-none z-[1000] flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            🍜
          </div>
          <div className="leading-none">
            <span className="font-bold text-gray-900 text-sm tracking-tight">KuliNira</span>
            <span className="block text-[10px] text-gray-400 font-normal">gounira.web.id</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <Link
            href="/kulinira/tambah"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Lokasi
          </Link>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900 transition-colors"
          >
            Beranda
          </Link>
        </div>
      </nav>

      {/* ── Map area ── */}
      <div className="flex-1 min-h-0 relative">
        <KuliniraMap />

        {/* ── Floating legend ── */}
        <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-orange-100 px-4 py-3 max-w-[200px]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Legenda</p>
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <span className="text-base">📍</span>
            <span>Tempat makan terverifikasi</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-snug">
            Klik marker untuk melihat detail harga &amp; foto.
          </p>
        </div>
      </div>
    </div>
  )
}
