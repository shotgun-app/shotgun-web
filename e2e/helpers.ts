import { expect, type Page } from '@playwright/test'

// These helpers drive the real API and database (docker compose up in ../shotgun-api)

export const API_URL = 'http://localhost:8080'
export const PASSWORD = 'password123'

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@shotgun.app`
}

export async function register(page: Page, name: string, email: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create an account' }).click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Phone number').fill('40 123 456')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/app')
}

export async function logout(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL('/')
}
