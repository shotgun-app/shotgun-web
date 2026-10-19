export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** Full URL of a path the backend serves, such as a user's `avatarUrl`. */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`
}
