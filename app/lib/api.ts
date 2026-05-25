import { getToken } from './auth'

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4123'

// ------------------------------------------------------------------
// Response types matching the API spec
// ------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiUser {
  id: number
  email: string
  name: string | null
  createdAt: string
}

export interface ApiLinkStat {
  linkId: string
  totalClicks: number
  lastClickedAt: string | null
}

export interface ApiLink {
  id: string
  code: string
  originalUrl: string
  userId: number | null
  title: string | null
  description: string | null
  createdAt: string
  expiredAt: string | null
  isActive: boolean
  isProtected?: boolean
  stats: ApiLinkStat
}

export interface LoginResponseData {
  accessToken: string
  user: ApiUser
}

// ------------------------------------------------------------------
// Core fetch helper
// ------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const json: ApiResponse<T> = await res.json()
  return json
}

// ------------------------------------------------------------------
// Auth endpoints
// ------------------------------------------------------------------

export async function apiLogin(
  email: string,
  password: string,
  turnstileToken: string
): Promise<ApiResponse<LoginResponseData>> {
  return apiFetch<LoginResponseData>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, cfTurnstileResponse: turnstileToken }),
  })
}

export async function apiRegister(
  email: string,
  password: string,
  name?: string,
  turnstileToken?: string
): Promise<ApiResponse<ApiUser>> {
  return apiFetch<ApiUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(name ? { name } : {}), cfTurnstileResponse: turnstileToken }),
  })
}

// ------------------------------------------------------------------
// Link endpoints
// ------------------------------------------------------------------

export async function apiGetLinks(): Promise<ApiResponse<ApiLink[]>> {
  return apiFetch<ApiLink[]>('/links')
}

export async function apiGetLink(id: string): Promise<ApiResponse<ApiLink>> {
  return apiFetch<ApiLink>(`/links/${id}`)
}

export interface CreateLinkPayload {
  url: string
  code?: string
  title?: string
  description?: string
  expiredAt?: string
  password?: string
}

export async function apiCreateLink(
  payload: CreateLinkPayload
): Promise<ApiResponse<ApiLink>> {
  return apiFetch<ApiLink>('/links', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface UpdateLinkPayload {
  url?: string
  code?: string
  isActive?: boolean
  title?: string
  description?: string
  expiredAt?: string | null
  password?: string
}

export async function apiUpdateLink(
  id: string,
  payload: UpdateLinkPayload
): Promise<ApiResponse<ApiLink>> {
  return apiFetch<ApiLink>(`/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function apiDeleteLink(id: string): Promise<ApiResponse<null>> {
  return apiFetch<null>(`/links/${id}`, {
    method: 'DELETE',
  })
}

// ------------------------------------------------------------------
// Stats endpoints
// ------------------------------------------------------------------

export interface GlobalOverviewStats {
  totalLinks: number
  totalClicks: number
  uptimePercentage: number
  totalUsers: number
}

export interface LinkSpecificStats {
  totalClicks: number
  topCountries: { name: string; count: number }[]
  topBrowsers: { name: string; count: number }[]
}

export async function apiGetGlobalStats(): Promise<ApiResponse<GlobalOverviewStats>> {
  return apiFetch<GlobalOverviewStats>('/stats/overview')
}

export async function apiGetLinkStats(id: string): Promise<ApiResponse<LinkSpecificStats>> {
  return apiFetch<LinkSpecificStats>(`/links/${id}/stats`)
}

// ------------------------------------------------------------------
// Utility: derive display status from API link
// ------------------------------------------------------------------
export type LinkStatus = 'aktif' | 'expired' | 'nonaktif'

export function deriveLinkStatus(link: ApiLink): LinkStatus {
  if (!link.isActive) return 'nonaktif'
  if (link.expiredAt && new Date(link.expiredAt) < new Date()) return 'expired'
  return 'aktif'
}

// ------------------------------------------------------------------
// KuliNira – Food Spots endpoints
// ------------------------------------------------------------------

export type FoodSpotStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface FoodSpot {
  id: string
  name: string
  priceMin: number
  priceMax: number
  latitude: number
  longitude: number
  imageProofPath: string | null
  imageUrl: string | null
  status: FoodSpotStatus
  createdAt: string
}

/** GET /tool/food-spots — Returns only APPROVED spots */
export async function apiGetApprovedFoodSpots(): Promise<ApiResponse<FoodSpot[]>> {
  return apiFetch<FoodSpot[]>('/tool/food-spots')
}

/** GET /tool/admin/food-spots/pending — Requires JWT */
export async function apiGetPendingFoodSpots(): Promise<ApiResponse<FoodSpot[]>> {
  return apiFetch<FoodSpot[]>('/tool/admin/food-spots/pending')
}

/** POST /tool/food-spots — multipart/form-data */
export async function apiCreateFoodSpot(formData: FormData): Promise<ApiResponse<FoodSpot>> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/tool/food-spots`, {
    method: 'POST',
    headers,
    body: formData,
  })
  return res.json() as Promise<ApiResponse<FoodSpot>>
}

/** PATCH /tool/admin/food-spots/:id/status — Requires JWT */
export async function apiUpdateFoodSpotStatus(
  id: string,
  status: 'APPROVED' | 'REJECTED'
): Promise<ApiResponse<FoodSpot>> {
  return apiFetch<FoodSpot>(`/tool/admin/food-spots/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

/** DELETE /tool/admin/food-spots/:id — Requires JWT */
export async function apiDeleteFoodSpot(id: string): Promise<ApiResponse<FoodSpot>> {
  return apiFetch<FoodSpot>(`/tool/admin/food-spots/${id}`, {
    method: 'DELETE',
  })
}

/** GET /tool/admin/food-spots — Requires JWT (Gets all spots) */
export async function apiGetAdminFoodSpots(): Promise<ApiResponse<FoodSpot[]>> {
  return apiFetch<FoodSpot[]>('/tool/admin/food-spots')
}

export interface UpdateFoodSpotPayload {
  name?: string
  priceMin?: number
  priceMax?: number
  latitude?: number
  longitude?: number
}

/** PATCH /tool/admin/food-spots/:id — Requires JWT */
export async function apiUpdateFoodSpot(
  id: string,
  payload: UpdateFoodSpotPayload
): Promise<ApiResponse<FoodSpot>> {
  return apiFetch<FoodSpot>(`/tool/admin/food-spots/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

