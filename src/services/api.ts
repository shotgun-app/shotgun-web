/**
 * The seam between the UI and the backend.
 *
 * The UI only ever imports `api` from here. Today it resolves to the in-memory
 * mock; once ../shotgun-api serves the endpoints, set `VITE_USE_MOCK_API=false`
 * (or delete the branch) and the exact same calls go over HTTP.
 */
import type {
  Credentials,
  RegisterPayload,
  Session,
  TripSearchParams,
  TripWithDriver,
  User,
} from '@/types'
import { mockApi } from './mock'
import { httpApi } from './http'

export interface AuthApi {
  login(credentials: Credentials): Promise<Session>
  register(payload: RegisterPayload): Promise<Session>
  logout(token: string): Promise<void>
  /** Resolves the user behind a stored token, or throws ApiError(401). */
  me(token: string): Promise<User>
}

export interface TripsApi {
  search(params: TripSearchParams): Promise<TripWithDriver[]>
}

export interface Api {
  auth: AuthApi
  trips: TripsApi
}

/** Defaults to the mock: only an explicit "false" opts into the real backend. */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const api: Api = USE_MOCK_API ? mockApi : httpApi
