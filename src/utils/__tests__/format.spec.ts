import { describe, expect, it } from 'vitest'
import { formatCo2, formatDeparture, initialsOf } from '../format'

describe('format.ts', () => {
  describe('formatCo2', () => {
    it('formats zero CO2 as "0 kg CO₂"', () => {
      expect(formatCo2(0)).toBe('0 kg CO₂')
      expect(formatCo2(-5)).toBe('0 kg CO₂')
    })

    it('formats sub-kilogram values in grams', () => {
      expect(formatCo2(0.5)).toBe('500 g CO₂')
      expect(formatCo2(0.35)).toBe('350 g CO₂')
      expect(formatCo2(0.025)).toBe('25 g CO₂')
    })

    it('formats 1 kg or more with kilograms', () => {
      expect(formatCo2(1.4)).toBe('1.4 kg CO₂')
      expect(formatCo2(28.2)).toBe('28.2 kg CO₂')
      expect(formatCo2(56)).toBe('56 kg CO₂')
      expect(formatCo2(170.4)).toBe('170.4 kg CO₂')
    })
  })

  describe('initialsOf', () => {
    it('returns initials correctly', () => {
      expect(initialsOf('Alice Lindqvist')).toBe('AL')
      expect(initialsOf('Ben')).toBe('BE')
      expect(initialsOf('')).toBe('?')
    })
  })

  describe('formatDeparture', () => {
    it('formats valid ISO date', () => {
      const formatted = formatDeparture('2099-01-01T09:00:00Z')
      expect(formatted).toBeDefined()
    })
  })
})
