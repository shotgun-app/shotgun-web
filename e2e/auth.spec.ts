import { test, expect, type Page } from '@playwright/test'

// These tests run against the real API and database (docker compose up in ../shotgun-api)

const PASSWORD = 'password123'

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@shotgun.app`
}

async function register(page: Page, name: string, email: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/app')
}

async function logout(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL('/')
}

test('landing page shows promo and auth panel without a demo account', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('Ride together')
  await expect(page.getByRole('button', { name: 'Create an account' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use demo account' })).toHaveCount(0)
})

test('unauthorized /app visit redirects to landing', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL('/')
})

test('registering a new account lands in the app', async ({ page }) => {
  await register(page, 'Mira Solberg', uniqueEmail())
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mira Solberg')
})

test('registering with a taken email shows an error', async ({ page }) => {
  const email = uniqueEmail()
  await register(page, 'First Person', email)
  await logout(page, 'First')

  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Name').fill('Second Person')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByRole('alert')).toContainText('already exists')
  await expect(page).toHaveURL('/')
})

test('logs in after registering, then logs out and is locked out of /app', async ({ page }) => {
  const email = uniqueEmail()
  await register(page, 'Nina Login', email)
  await logout(page, 'Nina')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL('/app')

  await logout(page, 'Nina')
  await page.goto('/app')
  await expect(page).toHaveURL('/')
})

test('wrong password shows an error', async ({ page }) => {
  const email = uniqueEmail()
  await register(page, 'Wrong Pass', email)
  await logout(page, 'Wrong')

  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill('not-the-password')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()

  await expect(page.getByRole('alert')).toContainText('Wrong email or password')
})

test('session survives a reload and the profile shows the real account', async ({ page }) => {
  const email = uniqueEmail()
  await register(page, 'Pia Profile', email)

  await page.reload()
  await expect(page).toHaveURL('/app')

  await page.getByRole('button', { name: /Pia/ }).click()
  await page.getByRole('menuitem', { name: 'My profile' }).click()

  await expect(page).toHaveURL('/app/profile')
  await expect(page.getByText(email)).toBeVisible()
})

test('password eye toggle, phone number and password change work end to end', async ({ page }) => {
  const email = uniqueEmail()
  await page.goto('/')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Show password' }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByLabel('Name').fill('Vera Phone')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/app')

  await page.getByRole('button', { name: /Vera/ }).click()
  await page.getByRole('menuitem', { name: 'My profile' }).click()

  await page.getByRole('button', { name: 'Edit profile' }).click()
  await page.getByLabel('Country code').selectOption({ label: 'Germany (+49)' })
  await page.getByLabel('Phone number').fill('151 2345678')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.locator('#profile-phone')).toHaveText('+49 1512345678')
  await page.reload()
  await expect(page.locator('#profile-phone')).toHaveText('+49 1512345678')

  await page.getByRole('button', { name: 'Change password' }).click()
  await page.locator('#profile-current-password').fill(PASSWORD)
  await page.locator('#profile-new-password').fill('another-pass-1')
  await page.locator('#profile-confirm-password').fill('another-pass-1')
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.locator('#profile-password-success')).toBeVisible()

  await logout(page, 'Vera')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill('another-pass-1')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  await expect(page).toHaveURL('/app')
})
