'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import Image from 'next/image'
import { apiGetApprovedFoodSpots, FoodSpot } from '@/app/lib/api'

// ── Fix default Leaflet marker icons (webpack breaks the URL resolution) ──
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

// ── Custom user GPS location marker icon ──
const createUserLocationIcon = () => {
  if (typeof window === 'undefined') return null
  return L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500 border-2 border-white shadow-md"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// ── Helper to dynamically map food names to specific food emojis ──
function getFoodEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('mie') || n.includes('bakso') || n.includes('soto') || n.includes('ramen') || n.includes('nodle')) return '🍜'
  if (n.includes('nasi') || n.includes('ayam') || n.includes('bebek') || n.includes('lalap') || n.includes('sate')) return '🍛'
  if (n.includes('kopi') || n.includes('cafe') || n.includes('teh') || n.includes('drink') || n.includes('es') || n.includes('coffe')) return '☕'
  if (n.includes('roti') || n.includes('kue') || n.includes('bakar') || n.includes('pisang') || n.includes('martabak')) return '🍞'
  return '📍'
}

// ── Custom food spot marker icon with dynamic emoji ──
const createFoodSpotIcon = (name: string) => {
  if (typeof window === 'undefined') return null
  const emoji = getFoodEmoji(name)
  return L.divIcon({
    className: 'custom-food-spot-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white text-base shadow-md border-2 border-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer">
        ${emoji}
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rotate-45 border-r border-b border-white"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ── Recenter map when spots load ──
function MapAutoBounds({ spots }: { spots: FoodSpot[] }) {
  const map = useMap()
  useEffect(() => {
    // Only auto-fit if there are multiple spots; single or no spots keep Pamekasan focus
    if (spots.length < 2) return
    const bounds = L.latLngBounds(spots.map((s) => [s.latitude, s.longitude]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 })
  }, [spots, map])
  return null
}

// ── Recenter map when routePath loads ──
function MapRouteBounds({ routePath }: { routePath: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (routePath.length < 2) return
    const bounds = L.latLngBounds(routePath)
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 })
  }, [routePath, map])
  return null
}

/** Paksa Leaflet menghitung ulang ukuran container — multi-delay + ResizeObserver */
function MapInvalidateSize() {
  const map = useMap()
  useEffect(() => {
    // Dua timeout: 100ms untuk kasus normal, 500ms untuk dynamic import yang lambat
    const t1 = setTimeout(() => map.invalidateSize(), 100)
    const t2 = setTimeout(() => map.invalidateSize(), 500)

    // ResizeObserver: paling reliable — invalidate setiap kali container berubah ukuran
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      observer.disconnect()
    }
  }, [map])
  return null
}

export default function KuliniraMap() {
  const [spots, setSpots] = useState<FoodSpot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── States for Routing & Navigation ──
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null)
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null)
  const [selectedSpotForRoute, setSelectedSpotForRoute] = useState<FoodSpot | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeDistance, setRouteDistance] = useState<string | null>(null)
  const [routeDuration, setRouteDuration] = useState<string | null>(null)
  const [routingError, setRoutingError] = useState<string | null>(null)

  const userIcon = createUserLocationIcon()

  useEffect(() => {
    fixLeafletIcons()
    apiGetApprovedFoodSpots()
      .then((res) => {
        if (res.success && res.data) {
          setSpots(res.data)
        } else {
          setError(res.message ?? 'Gagal memuat data.')
        }
      })
      .catch(() => setError('Tidak dapat terhubung ke server.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStartRouting = async (spot: FoodSpot) => {
    if (!navigator.geolocation) {
      alert('Geolokasi tidak didukung oleh browser Anda.')
      return
    }

    setRouteLoading(true)
    setRoutingError(null)

    // Set destination first for the loader feedback
    setSelectedSpotForRoute(spot)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude
        const start: [number, number] = [userLat, userLng]

        setUserCoords(start)

        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${spot.longitude},${spot.latitude}?overview=full&geometries=geojson`
          )
          const data = await response.json()

          if (data.code === 'Ok' && data.routes?.[0]) {
            const coords = data.routes[0].geometry.coordinates.map(
              (c: [number, number]) => [c[1], c[0]] as [number, number]
            )
            setRoutePath(coords)

            const dist = data.routes[0].distance // meters
            const dur = data.routes[0].duration // seconds
            setRouteDistance(
              dist > 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`
            )
            setRouteDuration(`${Math.round(dur / 60)} mnt`)
          } else {
            // Fallback to straight line
            setRoutePath([start, [spot.latitude, spot.longitude]])
            setRouteDistance('Jarak Udara')
            setRouteDuration('')
            setRoutingError('Gagal menghitung rute jalan raya. Menampilkan rute garis lurus.')
          }
        } catch {
          // Fallback to straight line
          setRoutePath([start, [spot.latitude, spot.longitude]])
          setRouteDistance('Jarak Udara')
          setRouteDuration('')
          setRoutingError('Koneksi rute terganggu. Menampilkan rute garis lurus.')
        } finally {
          setRouteLoading(false)
        }
      },
      (err) => {
        setRouteLoading(false)
        let msg = 'Gagal mengakses GPS Anda.'
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin lokasi ditolak. Silakan aktifkan GPS pada browser Anda.'
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan lokasi habis.'
        }
        alert(msg)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleClearRoute = () => {
    setUserCoords(null)
    setRoutePath(null)
    setSelectedSpotForRoute(null)
    setRouteDistance(null)
    setRouteDuration(null)
    setRoutingError(null)
  }

  // Center on Pamekasan / Madura by default
  const defaultCenter: [number, number] = [-7.1571, 113.4696]

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-600 font-medium">Memuat peta kuliner…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/90">
          <div className="text-center px-6">
            <p className="text-2xl mb-2">😕</p>
            <p className="text-gray-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* ── Floating Route Dashboard ── */}
      {selectedSpotForRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] w-[90%] max-w-sm bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-orange-100 p-4 animate-scale-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-0.5 animate-pulse">
                Navigasi Aktif
              </span>
              <h4 className="font-bold text-gray-900 text-sm truncate">
                Rute ke {selectedSpotForRoute.name}
              </h4>
              {routeLoading ? (
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 font-medium">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                  Mencari rute GPS tercepat...
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="flex items-center gap-1">
                    🚗 {routeDuration ? routeDuration : 'Tiba'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 font-normal">
                    Jarak: {routeDistance}
                  </span>
                </div>
              )}
              {routingError && (
                <p className="mt-1 text-[10px] text-amber-600 font-medium leading-tight">
                  ⚠️ {routingError}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClearRoute}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-90 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
              title="Hapus Rute"
            >
              ✕
            </button>
          </div>

          {!routeLoading && userCoords && (
            <div className="mt-3 flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords[0]},${userCoords[1]}&destination=${selectedSpotForRoute.latitude},${selectedSpotForRoute.longitude}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                🗺️ Buka Google Maps
              </a>
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        maxZoom={20}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        {/* CartoDB Voyager — smoother, retina-ready, mirip Google Maps */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxNativeZoom={19}
          maxZoom={20}
          detectRetina
        />

        {/* Bounds tracking logic */}
        {spots.length > 0 && !routePath && <MapAutoBounds spots={spots} />}
        {routePath && <MapRouteBounds routePath={routePath} />}
        <MapInvalidateSize />

        {/* Route visualization */}
        {routePath && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: '#f97316',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8',
              lineJoin: 'round',
              lineCap: 'round',
            }}
          />
        )}

        {/* Pulsing User current marker */}
        {userCoords && userIcon && (
          <Marker position={userCoords} icon={userIcon}>
            <Popup>
              <div className="p-1 font-semibold text-xs text-gray-700 text-center">
                📍 Posisi Anda Sekarang
              </div>
            </Popup>
          </Marker>
        )}

        {spots.map((spot) => {
          const spotIcon = createFoodSpotIcon(spot.name)
          return (
            <Marker
              key={spot.id}
              position={[spot.latitude, spot.longitude]}
              icon={spotIcon ?? undefined}
            >
              {/* Permanent name tooltip displayed below the marker */}
              <Tooltip
                permanent
                direction="bottom"
                offset={[0, 4]}
                className="kulinira-tooltip"
              >
                {spot.name}
              </Tooltip>

              <Popup maxWidth={240} className="kulinira-popup">
                <div className="font-sans">
                  {/* Photo */}
                  {spot.imageUrl ? (
                    <div className="relative w-full h-36 overflow-hidden bg-gray-100">
                      <Image
                        src={spot.imageUrl}
                        alt={`Foto ${spot.name}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-full h-28 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center text-4xl">
                      🍜
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {spot.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium mb-2.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatRupiah(spot.priceMin)} – {formatRupiah(spot.priceMax)}
                    </div>

                    {/* Driving Route Button */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleStartRouting(spot)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <span>🚗</span> Dapatkan Rute
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
