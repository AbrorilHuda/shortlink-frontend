'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import DraggableMarker from './DraggableMarker'

interface LocationPickerMapProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
}

/**
 * Terbang ke posisi baru saat lat/lng berubah dari luar (mis. tombol geolokasi).
 * Menggunakan ref untuk mendeteksi perubahan nyata, bukan re-render pertama.
 */
function MapFlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef({ lat, lng })
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    if (prevRef.current.lat !== lat || prevRef.current.lng !== lng) {
      map.flyTo([lat, lng], 16, { duration: 1.2, easeLinearity: 0.25 })
      prevRef.current = { lat, lng }
    }
  }, [lat, lng, map])

  return null
}

export default function LocationPickerMap({ lat, lng, onChange }: LocationPickerMapProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      maxZoom={20}
      className="w-full h-full"
      scrollWheelZoom
    >
      {/* CartoDB Voyager — smoother, retina-ready */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxNativeZoom={19}
        maxZoom={20}
        detectRetina
      />
      <DraggableMarker position={[lat, lng]} onChange={onChange} />
      <MapFlyTo lat={lat} lng={lng} />
    </MapContainer>
  )
}
