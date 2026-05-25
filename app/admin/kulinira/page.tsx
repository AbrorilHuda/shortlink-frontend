'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { apiGetPendingFoodSpots, apiUpdateFoodSpotStatus, FoodSpot } from '@/app/lib/api'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type ActionState = { id: string; action: 'APPROVED' | 'REJECTED' } | null

export default function AdminKuliniraPage() {
  const [spots, setSpots] = useState<FoodSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ActionState>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    apiGetPendingFoodSpots()
      .then((res) => {
        if (res.success && res.data) {
          setSpots(res.data)
        } else {
          setError(res.message ?? 'Gagal memuat data.')
        }
      })
      .catch(() => setError('Tidak dapat terhubung ke server. Pastikan Anda sudah login.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleAction(id: string, action: 'APPROVED' | 'REJECTED') {
    setActiveAction({ id, action })
    try {
      const res = await apiUpdateFoodSpotStatus(id, action)
      if (res.success) {
        // Optimistic: remove from pending list
        setSpots((prev) => prev.filter((s) => s.id !== id))
        showToast(
          action === 'APPROVED' ? '✅ Tempat makan berhasil disetujui.' : '❌ Tempat makan ditolak.',
          'success'
        )
      } else {
        showToast(res.message ?? 'Gagal memperbarui status.', 'error')
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error')
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all animate-fade-in-up ${
            toast.type === 'success'
              ? 'bg-gray-900 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold">
            🍜
          </div>
          <div className="leading-none">
            <span className="font-bold text-gray-900 text-sm">KuliNira Admin</span>
            <span className="block text-[10px] text-gray-400">Panel Validasi Kuliner</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin/kulinira/list"
            className="px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-xs"
          >
            Kelola Semua
          </Link>
          <Link
            href="/kulinira"
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            Lihat Peta
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Validasi Tempat Makan</h1>
            <p className="text-sm text-gray-500">
              Tinjau dan moderasi kiriman pengguna sebelum ditampilkan di peta.
            </p>
          </div>
          {!loading && !error && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-sm font-semibold text-orange-700">
                {spots.length} menunggu persetujuan
              </span>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
            <p className="text-gray-500 text-sm">Memuat data pending…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">🔒</div>
            <p className="font-medium text-gray-900">Akses Ditolak</p>
            <p className="text-sm text-gray-500 text-center max-w-sm">{error}</p>
            <Link
              href="/login"
              className="mt-2 px-5 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Login Admin
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && spots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-5xl">🎉</div>
            <p className="font-semibold text-gray-900 text-lg">Semua sudah ditinjau!</p>
            <p className="text-sm text-gray-500">Tidak ada kiriman yang menunggu persetujuan saat ini.</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && spots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spots.map((spot) => {
              const isActing = activeAction?.id === spot.id
              return (
                <article
                  key={spot.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
                >
                  {/* Photo */}
                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden flex-shrink-0">
                    {spot.imageUrl ? (
                      <Image
                        src={spot.imageUrl}
                        alt={`Foto bukti ${spot.name}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <span className="text-4xl">🍽️</span>
                        <span className="text-xs">Tidak ada foto</span>
                      </div>
                    )}
                    {/* Pending badge */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                      Pending
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                      <h2 className="font-bold text-gray-900 text-base leading-snug mb-1">
                        {spot.name}
                      </h2>
                      <div className="flex items-center gap-1.5 text-sm text-orange-600 font-semibold">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatRupiah(spot.priceMin)} – {formatRupiah(spot.priceMax)}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-mono">{spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(spot.createdAt)}</span>
                      </div>
                    </div>

                    {/* View on map link */}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${spot.latitude}&mlon=${spot.longitude}#map=17/${spot.latitude}/${spot.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:text-blue-700 hover:underline inline-flex items-center gap-1 w-fit"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Lihat di OpenStreetMap
                    </a>

                    {/* Action buttons */}
                    <div className="mt-auto flex gap-2 pt-2">
                      <button
                        id={`approve-${spot.id}`}
                        type="button"
                        onClick={() => handleAction(spot.id, 'APPROVED')}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {isActing && activeAction?.action === 'APPROVED' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Setujui
                          </>
                        )}
                      </button>
                      <button
                        id={`reject-${spot.id}`}
                        type="button"
                        onClick={() => handleAction(spot.id, 'REJECTED')}
                        disabled={isActing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {isActing && activeAction?.action === 'REJECTED' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Tolak
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
