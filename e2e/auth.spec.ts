import { test, expect } from '@playwright/test'

test('landing page shows promo and auth panel', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Nobody drives that route')
  await expect(page.getByRole('tab', { name: 'Register' })).toBeVisible()
})

test('unauthorized /app visit redirects to landing', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL('/')
})

test('demo account logs in, reaches /app and logs out', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Use demo account' }).click()
  await page.getByRole('button', { name: 'Log in', exact: true }).click()

  await expect(page).toHaveURL('/app')

  await page.getByRole('button', { name: /Alice/ }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()

  await expect(page).toHaveURL('/')
})
