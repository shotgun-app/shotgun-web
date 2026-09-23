import { test, expect, type Page } from '@playwright/test'

const toggle = (page: Page) => page.getByRole('button', { name: /Switch to/ })

test('theme toggle flips between light and dark, starting from the OS theme', async ({
  page,
}) => {
  await page.goto('/')

  const html = page.locator('html')

  // Playwright emulates a light OS preference, so the system default is light.
  await expect(toggle(page)).toHaveAccessibleName('Theme: Light. Switch to Dark.')
  await expect(toggle(page).locator('svg')).toBeVisible()
  await expect(html).not.toHaveClass(/dark/)

  await toggle(page).click()
  await expect(toggle(page)).toHaveAccessibleName('Theme: Dark. Switch to Light.')
  await expect(html).toHaveClass(/dark/)

  await toggle(page).click()
  await expect(toggle(page)).toHaveAccessibleName('Theme: Light. Switch to Dark.')
  await expect(html).not.toHaveClass(/dark/)
})

test('the chosen theme survives a reload', async ({ page }) => {
  await page.goto('/')
  await toggle(page).click()
  await expect(toggle(page)).toHaveAccessibleName('Theme: Dark. Switch to Light.')

  await page.reload()

  await expect(toggle(page)).toHaveAccessibleName('Theme: Dark. Switch to Light.')
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('the app nav carries the same toggle', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Use demo account' }).click()
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL('/app')

  await toggle(page).click()

  await expect(toggle(page)).toHaveAccessibleName('Theme: Dark. Switch to Light.')
  await expect(page.locator('html')).toHaveClass(/dark/)
})
