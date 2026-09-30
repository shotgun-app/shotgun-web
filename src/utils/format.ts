/** "Tue, Oct 6, 08:30" - the one departure format used on every screen. */
export function formatDeparture(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/** Up to two initials from a display name, for avatars. */
export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]![0]!
  const second = parts[1]?.[0]
  return (second ? first + second : parts[0]!.slice(0, 2)).toUpperCase()
}
