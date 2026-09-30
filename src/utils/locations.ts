/** Countries and cities offered in the ride and search forms. */
export const EUROPEAN_LOCATIONS: Record<string, string[]> = {
  Sweden: ['Gothenburg', 'Stockholm', 'Malmö', 'Uppsala'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  Netherlands: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht'],
  Spain: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh'],
  Italy: ['Rome', 'Milan', 'Florence', 'Naples'],
}

/** Local calendar date as YYYY-MM-DD, optionally shifted by whole days. */
export function getTodayDateString(daysOffset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
