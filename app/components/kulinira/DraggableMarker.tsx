'use client'

import { useCallback, useRef } from 'react'
import { Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

interface DraggableMarkerProps {
  position: [number, number]
  onChange: (lat: number, lng: number) => void
}

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function DraggableMarker({ position, onChange }: DraggableMarkerProps) {
  const markerRef = useRef<L.Marker>(null)

  // Click on map → move marker
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  const eventHandlers = useCallback(
    () => ({
      dragend() {
        const m = markerRef.current
        if (m) {
          const ll = m.getLatLng()
          onChange(ll.lat, ll.lng)
        }
      },
    }),
    [onChange]
  )

  return (
    <Marker
      draggable
      position={position}
      icon={markerIcon}
      ref={markerRef}
      eventHandlers={eventHandlers()}
    />
  )
}
