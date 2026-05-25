'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiCreateFoodSpot } from '@/app/lib/api'

// Dynamic import for Leaflet map (no SSR — requires window)
const LocationPickerMap = dynamic(
  () => import('@/app/components/kulinira/LocationPickerMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-xl">
        <div className="w-8 h-8 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
      </div>
    ),
  }
)

export default function TambahKuliniraPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lat, setLat] = useState(-7.1571)
  const [lng, setLng] = useState(113.4696)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const handleLocationChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
  }, [])

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolokasi tidak didukung oleh browser Anda.')
      return
    }

    setLocating(true)
    setErrorMsg(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setLocating(false)
      },
      (error) => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Izin lokasi ditolak. Aktifkan GPS pada pengaturan browser Anda.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMsg('Informasi lokasi tidak tersedia.')
        } else if (error.code === error.TIMEOUT) {
          setErrorMsg('Permintaan waktu mendapatkan lokasi habis.')
        } else {
          setErrorMsg('Gagal mendapatkan lokasi saat ini.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!name.trim()) return setErrorMsg('Nama tempat makan wajib diisi.')
    if (!priceMin || !priceMax) return setErrorMsg('Harga minimum dan maksimum wajib diisi.')
    if (Number(priceMin) > Number(priceMax)) return setErrorMsg('Harga minimum tidak boleh lebih besar dari harga maksimum.')

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('priceMin', priceMin)
    formData.append('priceMax', priceMax)
    formData.append('latitude', lat.toString())
    formData.append('longitude', lng.toString())
    if (imageFile) formData.append('image', imageFile)

    setSubmitting(true)
    try {
      const res = await apiCreateFoodSpot(formData)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => router.push('/kulinira'), 2500)
      } else {
        setErrorMsg(res.message ?? 'Gagal mengirim data.')
      }
    } catch {
      setErrorMsg('Tidak dapat terhubung ke server. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full animate-scale-up">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Terima kasih!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Tempat makan berhasil dikirim dan menunggu persetujuan admin. Mengalihkan ke peta…
          </p>
          <div className="mt-6 w-8 h-8 rounded-full border-4 border-orange-400 border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Link href="/kulinira" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              🍜
            </div>
            <div className="leading-none">
              <span className="font-bold text-gray-900 text-sm tracking-tight group-hover:text-orange-600 transition-colors">KuliNira</span>
              <span className="block text-[10px] text-gray-400 font-normal">gounira.web.id</span>
            </div>
          </Link>
        </div>
        <Link
          href="/kulinira"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Peta
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tambah Tempat Makan</h1>
          <p className="text-sm text-gray-500">
            Bagikan info warung favoritmu kepada mahasiswa UNIRA. Data akan diverifikasi admin sebelum tampil di peta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error banner */}
          {errorMsg && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 animate-fade-in">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {errorMsg}
            </div>
          )}

          {/* Card: Info Dasar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-base">🏪</span>
              <h2 className="font-semibold text-gray-900 text-sm">Informasi Tempat Makan</h2>
            </div>
            <div className="px-5 py-5 space-y-4">
              {/* Nama */}
              <div>
                <label htmlFor="spot-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Nama Tempat Makan <span className="text-red-500">*</span>
                </label>
                <input
                  id="spot-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cth: Warung Soto Pak Hasan"
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all"
                />
              </div>

              {/* Harga */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="min-price" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Harga Minimum (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="min-price"
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="5000"
                    min={0}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="max-price" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Harga Maksimum (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="max-price"
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="25000"
                    min={0}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Upload Foto */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-base">📸</span>
              <h2 className="font-semibold text-gray-900 text-sm">Foto Bukti</h2>
              <span className="ml-auto text-xs text-gray-400">Opsional · maks. 5 MB</span>
            </div>
            <div className="px-5 py-5">
              <label
                htmlFor="image-upload"
                className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-orange-500 transition-colors">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Klik untuk upload foto</span>
                    <span className="text-xs">JPEG, PNG, WebP</span>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
              {imageFile && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  {imageFile.name} ({(imageFile.size / 1024).toFixed(0)} KB)
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setPreviewUrl(null) }}
                    className="ml-2 text-red-400 hover:text-red-600"
                  >
                    Hapus
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Card: Pilih Lokasi */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="text-base">📍</span>
              <h2 className="font-semibold text-gray-900 text-sm">Lokasi di Peta</h2>
            </div>
            <div className="px-5 py-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-orange-50/30 rounded-xl p-3 border border-orange-100/50">
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                  Klik pada peta, seret marker, atau gunakan GPS perangkat Anda untuk menentukan lokasi akurat warung makan.
                </p>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={locating}
                  className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.97] text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {locating ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Mendapatkan Lokasi...
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🎯</span> Gunakan GPS Saya
                    </>
                  )}
                </button>
              </div>
              <div className="h-80 rounded-xl overflow-hidden border border-gray-200">
                <LocationPickerMap
                  lat={lat}
                  lng={lng}
                  onChange={handleLocationChange}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-lat" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Latitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-lat"
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-mono text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="input-lng" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Longitude <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-lng"
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value) || 0)}
                    required
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-mono text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            id="submit-spot"
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Mengirim…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Kirim Data
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
