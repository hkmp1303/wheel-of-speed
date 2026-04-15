import { test, expect } from '@playwright/test'

test('create and join lobby starts match when both players are ready', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  await hostPage.goto('/')
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()

  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()
  expect(joinCode).toHaveLength(8)

  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()

  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()

  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()
  await expect(guestPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const guestSpinEnabled = await guestPage.getByRole('button', { name: 'Spin' }).isEnabled()

  expect(hostSpinEnabled || guestSpinEnabled).toBeTruthy()
  expect(hostSpinEnabled && guestSpinEnabled).toBeFalsy()

  await hostContext.close()
  await guestContext.close()
})

test('home page buttons are disabled until required input exists', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Create Game' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeDisabled()

  await page.getByPlaceholder('Ange namn').fill('Alice')
  await expect(page.getByRole('button', { name: 'Create Game' })).toBeEnabled()

  await page.getByPlaceholder('GUID code').fill('ABCDEFGH')
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeEnabled()
})
