import type { Trip } from '@/types'

export const SMALL_BAG_HINT = 'Cabin bag or backpack, about 50 x 50 cm'
export const LARGE_BAG_HINT = 'Suitcase, bigger than a cabin bag'

type BagCounts = Pick<
  Trip,
  'smallBagsTotal' | 'smallBagsBooked' | 'largeBagsTotal' | 'largeBagsBooked'
>

export function smallBagsLeft(trip: BagCounts): number {
  return trip.smallBagsTotal - trip.smallBagsBooked
}

export function largeBagsLeft(trip: BagCounts): number {
  return trip.largeBagsTotal - trip.largeBagsBooked
}

/** "1 small, 2 large bags", or null when none. */
export function bagsSummary(small: number, large: number): string | null {
  const parts = []
  if (small > 0) parts.push(`${small} small`)
  if (large > 0) parts.push(`${large} large`)
  return parts.length > 0 ? `${parts.join(', ')} bag${small + large === 1 ? '' : 's'}` : null
}

/** What a search result says about bag space: offered, used up, or not offered at all. */
export function bagSpaceLabel(trip: BagCounts): { text: string; full: boolean } {
  if (trip.smallBagsTotal + trip.largeBagsTotal === 0) return { text: 'No bag space', full: true }
  if (smallBagsLeft(trip) + largeBagsLeft(trip) <= 0) return { text: 'Bag space full', full: true }
  return {
    text: `Bags left: ${smallBagsLeft(trip)} small, ${largeBagsLeft(trip)} large`,
    full: false,
  }
}
