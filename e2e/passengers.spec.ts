import { test, expect } from '@playwright/test'
import { API_URL, register, uniqueEmail } from './helpers.js'

test('drivers and passengers see who they ride with', async ({ browser }) => {
  // Separate contexts keep both sessions signed in at once
  const driver = await (await browser.newContext()).newPage()
  const passenger = await (await browser.newContext()).newPage()
  await register(driver, 'Dana Driver', uniqueEmail())
  await register(passenger, 'Pavel Passenger', uniqueEmail())
  const { user } = await (await passenger.request.get(`${API_URL}/auth/me`)).json()

  const { ride } = await (
    await driver.request.post(`${API_URL}/api/rides`, {
      data: {
        originCity: 'Ljubljana',
        originCountry: 'Slovenia',
        destinationCity: 'Zagreb',
        destinationCountry: 'Croatia',
        departureAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        seatsTotal: 3,
        pricePerSeat: 0,
      },
    })
  ).json()
  await passenger.request.post(`${API_URL}/api/bookings`, { data: { tripId: ride.id, seats: 1 } })

  await passenger.goto('/app/bookings')
  await expect(passenger.getByRole('link', { name: 'Dana Driver' })).toBeVisible()
  await expect(passenger.getByText('No other passengers')).toBeVisible()

  await driver.goto('/app/rides')
  const [profile] = await Promise.all([
    driver.context().waitForEvent('page'),
    driver.getByRole('link', { name: 'Pavel Passenger' }).click(),
  ])
  await expect(profile).toHaveURL(`/app/users/${user.id}`)
  await expect(profile.getByRole('heading', { level: 1 })).toHaveText('Pavel Passenger')

  await driver.context().close()
  await passenger.context().close()
})
