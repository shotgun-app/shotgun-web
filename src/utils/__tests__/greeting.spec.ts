import { describe, expect, it } from 'vitest'
import { greetingFor } from '../greeting'

const at = (hour: number, minute = 0) => new Date(2026, 8, 29, hour, minute)

describe('greetingFor', () => {
  it.each([
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [17, 'Good afternoon'],
    [18, 'Good evening'],
    [23, 'Good evening'],
    [0, 'Good evening'],
    [4, 'Good evening'],
  ])('at %i:00 says %s', (hour, expected) => {
    expect(greetingFor(at(hour))).toBe(expected)
  })
})
