import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { resetFakeApi } from '@/test/fakeApi'

import { useAuthStore } from '../auth'
import { useCarsStore } from '../cars'
import { DEMO_CREDENTIALS, MOCK_CARS } from '@/test/seed'

describe('cars store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetFakeApi()
  })

  it('loads the catalogue', async () => {
    await useAuthStore().login(DEMO_CREDENTIALS)
    const cars = useCarsStore()

    await cars.fetchAll()

    expect(cars.cars).toHaveLength(MOCK_CARS.length)
    expect(cars.error).toBeNull()
  })

  it('picks a car and shows it on the user', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
    const car = MOCK_CARS[0]!

    expect(await useCarsStore().select(car.id)).toBe(true)
    expect(auth.user?.car?.id).toBe(car.id)
    expect(auth.user?.car?.co2).toBe(car.co2)
  })

  it('clears the car with null', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
    const cars = useCarsStore()
    await cars.select(MOCK_CARS[0]!.id)

    expect(await cars.select(null)).toBe(true)
    expect(auth.user?.car).toBeNull()
  })

  it('rejects an unknown car, keeps the current one and leaves auth errors alone', async () => {
    const auth = useAuthStore()
    await auth.login(DEMO_CREDENTIALS)
    const cars = useCarsStore()
    await cars.select(MOCK_CARS[0]!.id)

    expect(await cars.select('nope')).toBe(false)
    expect(cars.error).toBe('Car not found.')
    expect(auth.user?.car?.id).toBe(MOCK_CARS[0]!.id)
    expect(auth.error).toBeNull()
  })
})
