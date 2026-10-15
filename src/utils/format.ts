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

/**
 * Human-readable CO2 amount.
 * - 0 kg (e.g. electric vehicles): "0 kg CO₂"
 * - Sub-kilogram amounts (> 0 and < 1 kg): formatted in grams, e.g. "350 g CO₂"
 * - 1 kg or more: formatted in kg with up to one decimal place, e.g. "1.4 kg CO₂"
 */
export function formatCo2(kg: number): string {
  if (!Number.isFinite(kg) || kg <= 0) {
    return '0 kg CO₂'
  }
  if (kg < 1) {
    const grams = Math.round(kg * 1000)
    if (grams >= 1000) {
      return '1 kg CO₂'
    }
    return `${grams} g CO₂`
  }
  const rounded = Math.round(kg * 10) / 10
  return `${rounded} kg CO₂`
}
