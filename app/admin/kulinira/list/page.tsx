'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  apiGetAdminFoodSpots,
  apiDeleteFoodSpot,
  apiUpdateFoodSpot,
  FoodSpot,
} from '@/app/lib/api'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function AdminKuliniraListPage() {
  const [spots, setSpots] = useState<FoodSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  // Edit Modal State
  const [editingSpot, setEditingSpot] = useState<FoodSpot | null>(null)
  const [editName, setEditName] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  const [saving, setSaving] = useState(false)

  // Fetch all spots for admin
  const fetchSpots = useCallback(() => {
    setLoading(true)
    apiGetAdminFoodSpots()
      .then((res) => {
        if (res.success && res.data) {
          setSpots(res.data)
        } else {
          setError(res.message ?? 'Gagal memuat data tempat makan.')
        }
      })
      .catch(() => setError('Tidak dapat terhubung ke server. Pastikan Anda sudah login.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchSpots()
  }, [fetchSpots])

  // Open Edit Dialog
  const handleOpenEdit = (spot: FoodSpot) => {
    setEditingSpot(spot)
    setEditName(spot.name)
    setEditPriceMin(spot.priceMin.toString())
    setEditPriceMax(spot.priceMax.toString())
    setEditLat(spot.latitude.toString())
    setEditLng(spot.longitude.toString())
  }

  // Handle Update Detail
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSpot) return

    if (!editName.trim()) return showToast('Nama tempat makan wajib diisi', 'error')
    if (!editPriceMin || !editPriceMax) return showToast('Harga wajib diisi', 'error')
    if (Number(editPriceMin) > Number(editPriceMax)) {
      return showToast('Harga minimum tidak boleh lebih besar dari harga maksimum', 'error')
    }

    setSaving(true)
    try {
      const res = await apiUpdateFoodSpot(editingSpot.id, {
        name: editName.trim(),
        priceMin: Number(editPriceMin),
        priceMax: Number(editPriceMax),
        latitude: Number(editLat),
        longitude: Number(editLng),
      })

      if (res.success) {
        // Update local state list
        setSpots((prev) =>
          prev.map((s) => (s.id === editingSpot.id ? { ...s, ...res.data } : s))
        )
        showToast('✅ Berhasil memperbarui informasi tempat makan.', 'success')
        setEditingSpot(null)
      } else {
        showToast(res.message ?? 'Gagal memperbarui tempat makan.', 'error')
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Handle Delete Spot
  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus "${name}" secara permanen? Tindakan ini juga akan menghapus file gambar bukti di disk server.`
      )
    ) {
      return
    }

    try {
      const res = await apiDeleteFoodSpot(id)
      if (res.success) {
        setSpots((prev) => prev.filter((s) => s.id !== id))
        showToast('✅ Tempat makan berhasil dihapus.', 'success')
      } else {
        showToast(res.message ?? 'Gagal menghapus tempat makan.', 'error')
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error')
    }
  }

  const filteredSpots = spots.filter((spot) =>
    spot.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ── Toast Feedback ── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all animate-fade-in-up ${
            toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-[100] flex items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/kulinira" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold shadow-xs">
              🍜
            </div>
            <div className="leading-none">
              <span className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                KuliNira Admin
              </span>
              <span className="block text-[10px] text-gray-400">Database Manajemen</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin/kulinira"
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
          >
            Validasi Pending
          </Link>
          <Link
            href="/kulinira"
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
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

      {/* ── Main Area ── */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar Tempat Makan</h1>
            <p className="text-sm text-gray-500">
              Kelola seluruh tempat makan terdaftar. Anda dapat mengubah data koordinat, harga, atau menghapus item.
            </p>
          </div>
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Cari tempat makan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-orange-50 focus:border-orange-400 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Loading status */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
            <p className="text-gray-500 text-sm">Memuat database kuliner…</p>
          </div>
        )}

        {/* Access error status */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-2xl">🔒</div>
            <p className="font-semibold text-gray-900">Akses Ditolak</p>
            <p className="text-sm text-gray-500 text-center max-w-sm leading-relaxed">{error}</p>
            <Link
              href="/login"
              className="mt-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors shadow-xs"
            >
              Login Admin
            </Link>
          </div>
        )}

        {/* Empty status */}
        {!loading && !error && filteredSpots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-200 p-8 shadow-xs">
            <div className="text-4xl">🫙</div>
            <p className="font-semibold text-gray-900">Tidak ada tempat makan ditemukan</p>
            <p className="text-sm text-gray-400">
              {search ? 'Ganti kata kunci pencarian Anda.' : 'Belum ada data tempat makan dalam sistem.'}
            </p>
          </div>
        )}

        {/* Desktop Table / Mobile Cards */}
        {!loading && !error && filteredSpots.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Table layout (visible on sm screen and up) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-4 w-20">Foto</th>
                    <th scope="col" className="px-5 py-4">Nama Warung</th>
                    <th scope="col" className="px-5 py-4 w-44">Rentang Harga</th>
                    <th scope="col" className="px-5 py-4 w-44">Koordinat</th>
                    <th scope="col" className="px-5 py-4 w-32">Status</th>
                    <th scope="col" className="px-5 py-4 w-40 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredSpots.map((spot) => (
                    <tr key={spot.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200/60">
                          {spot.imageUrl ? (
                            <Image
                              src={spot.imageUrl}
                              alt={spot.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg bg-orange-50">
                              🍜
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{spot.name}</td>
                      <td className="px-5 py-4 text-xs font-semibold text-orange-600 whitespace-nowrap">
                        {formatRupiah(spot.priceMin)} – {formatRupiah(spot.priceMax)}
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                        {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            spot.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {spot.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs font-semibold space-x-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(spot)}
                          className="text-orange-500 hover:text-orange-700 cursor-pointer transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(spot.id, spot.name)}
                          className="text-red-500 hover:text-red-700 cursor-pointer transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (visible on mobile only) */}
            <div className="block sm:hidden divide-y divide-gray-100">
              {filteredSpots.map((spot) => (
                <div key={spot.id} className="p-4 flex gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200/60">
                    {spot.imageUrl ? (
                      <Image
                        src={spot.imageUrl}
                        alt={spot.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl bg-orange-50">
                        🍜
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{spot.name}</h4>
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wider ${
                          spot.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {spot.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-orange-600">
                      {formatRupiah(spot.priceMin)} – {formatRupiah(spot.priceMax)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs font-bold pt-1.5 border-t border-gray-50">
                      <button
                        onClick={() => handleOpenEdit(spot)}
                        className="text-orange-500 hover:text-orange-700 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(spot.id, spot.name)}
                        className="text-red-500 hover:text-red-700 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Edit Modal Overlay ── */}
      {editingSpot && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-950 text-sm">Edit Informasi Tempat Makan</h3>
              <button
                onClick={() => setEditingSpot(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Nama Warung</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 text-gray-900 placeholder:text-gray-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Min Price (Rp)</label>
                  <input
                    type="number"
                    value={editPriceMin}
                    onChange={(e) => setEditPriceMin(e.target.value)}
                    required
                    min={0}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Price (Rp)</label>
                  <input
                    type="number"
                    value={editPriceMax}
                    onChange={(e) => setEditPriceMax(e.target.value)}
                    required
                    min={0}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editLat}
                    onChange={(e) => setEditLat(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 font-mono text-gray-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editLng}
                    onChange={(e) => setEditLng(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-50 font-mono text-gray-900 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSpot(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
