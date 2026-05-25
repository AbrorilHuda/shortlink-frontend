import type { Metadata } from 'next'
import KuliniraMapPage from './KuliniraMapPage'

export const metadata: Metadata = {
  title: 'KuliNira - Peta Kuliner Madura',
  description:
    'Temukan tempat makan terbaik di sekitar kampus Universitas Madura. Peta kuliner interaktif dengan harga transparan dari komunitas.',
  keywords: ['kuliner', 'Madura', 'UNIRA', 'peta kuliner', 'warung makan', 'harga murah'],
  openGraph: {
    title: 'KuliNira - Peta Kuliner Madura',
    description: 'Peta kuliner crowdsource untuk mahasiswa Universitas Madura.',
    url: '/kulinira',
    siteName: 'gounira.web.id',
  },
}

export default function KuliniraPage() {
  return <KuliniraMapPage />
}
