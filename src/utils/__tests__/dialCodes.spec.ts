import { describe, expect, it } from 'vitest'
import { formatPhone, joinPhone, splitPhone } from '../dialCodes'

describe('dial codes', () => {
  it('joins country and national number into E.164', () => {
    expect(joinPhone('Slovenia', '40 123 456')).toBe('+38640123456')
  })

  it('drops a leading trunk zero', () => {
    expect(joinPhone('Germany', '0151 2345678')).toBe('+491512345678')
  })

  it('returns empty when no digits were typed', () => {
    expect(joinPhone('Slovenia', '  ')).toBe('')
  })

  it('splits by the longest matching dial code', () => {
    expect(splitPhone('+38640123456')).toEqual({ country: 'Slovenia', national: '40123456' })
    expect(splitPhone('+491512345678')).toEqual({ country: 'Germany', national: '1512345678' })
  })

  it('falls back to the default country for empty input', () => {
    expect(splitPhone(null)).toEqual({ country: 'Slovenia', national: '' })
  })

  it('formats for display', () => {
    expect(formatPhone('+38640123456')).toBe('+386 40123456')
    expect(formatPhone(null)).toBe('')
  })
})
