export interface DialCode {
  country: string
  /** Digits only, no "+" */
  dial: string
}

/** Europe first (the app's market), then a few common others. */
export const DIAL_CODES: DialCode[] = [
  { country: 'Austria', dial: '43' },
  { country: 'Belgium', dial: '32' },
  { country: 'Bulgaria', dial: '359' },
  { country: 'Croatia', dial: '385' },
  { country: 'Czechia', dial: '420' },
  { country: 'Denmark', dial: '45' },
  { country: 'Estonia', dial: '372' },
  { country: 'Finland', dial: '358' },
  { country: 'France', dial: '33' },
  { country: 'Germany', dial: '49' },
  { country: 'Greece', dial: '30' },
  { country: 'Hungary', dial: '36' },
  { country: 'Ireland', dial: '353' },
  { country: 'Italy', dial: '39' },
  { country: 'Latvia', dial: '371' },
  { country: 'Lithuania', dial: '370' },
  { country: 'Luxembourg', dial: '352' },
  { country: 'Netherlands', dial: '31' },
  { country: 'Norway', dial: '47' },
  { country: 'Poland', dial: '48' },
  { country: 'Portugal', dial: '351' },
  { country: 'Romania', dial: '40' },
  { country: 'Serbia', dial: '381' },
  { country: 'Slovakia', dial: '421' },
  { country: 'Slovenia', dial: '386' },
  { country: 'Spain', dial: '34' },
  { country: 'Sweden', dial: '46' },
  { country: 'Switzerland', dial: '41' },
  { country: 'Ukraine', dial: '380' },
  { country: 'United Kingdom', dial: '44' },
  { country: 'Canada', dial: '1' },
  { country: 'United States', dial: '1' },
]

export const DEFAULT_COUNTRY = 'Slovenia'

/** Splits "+38640123456" into its country and national digits. Longest dial code wins. */
export function splitPhone(phone: string | null | undefined): {
  country: string
  national: string
} {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return { country: DEFAULT_COUNTRY, national: '' }
  const match = [...DIAL_CODES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => digits.startsWith(c.dial))
  if (!match) return { country: DEFAULT_COUNTRY, national: digits }
  return { country: match.country, national: digits.slice(match.dial.length) }
}

/** Joins a country and national number into E.164, or '' when no number was typed. */
export function joinPhone(country: string, national: string): string {
  const digits = national.replace(/\D/g, '').replace(/^0+/, '')
  if (!digits) return ''
  const dial = DIAL_CODES.find((c) => c.country === country)?.dial ?? ''
  return `+${dial}${digits}`
}

/** "+386 40123456" for display; falls back to the raw value. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const { country, national } = splitPhone(phone)
  const dial = DIAL_CODES.find((c) => c.country === country)?.dial
  return dial ? `+${dial} ${national}` : phone
}
