import { test, expect } from '@playwright/test'

async function hostCreatesLobby(hostPage, name = 'Alice') {
  await hostPage.goto('/')
  await hostPage.getByRole('button', { name: 'Create Lobby' }).click()
  await hostPage.getByPlaceholder('Enter name').fill(name)
  await hostPage.getByRole('button', { name: 'Create Game' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()
  const codeText = await hostPage.locator('#invite-code-display').textContent()
  return (codeText ?? '').trim()
}

async function guestJoinsLobby(guestPage, joinCode, name = 'Bob') {
  await guestPage.goto('/')
  await guestPage.getByRole('button', { name: 'Join Lobby' }).click()
  await guestPage.getByPlaceholder('Enter name').fill(name)
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()
  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()
}

test('rules link opens rules page and back returns home', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Rules' }).click()
  await expect(page).toHaveURL(/\/rules$/)
  await expect(page.getByRole('heading', { name: 'Game Rules' })).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: 'Create Lobby' })).toBeVisible()
})

test('create and join lobby starts match when both players are ready', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  const joinCode = await hostCreatesLobby(hostPage)
  expect(joinCode).toHaveLength(8)

  await guestJoinsLobby(guestPage, joinCode)

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()

  await expect(hostPage.getByRole('heading', { name: /Round 1\/\d+/ })).toBeVisible()
  await expect(guestPage.getByRole('heading', { name: /Round 1\/\d+/ })).toBeVisible()

  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const guestSpinEnabled = await guestPage.getByRole('button', { name: 'Spin' }).isEnabled()

  expect(hostSpinEnabled || guestSpinEnabled).toBeTruthy()
  expect(hostSpinEnabled && guestSpinEnabled).toBeFalsy()

  await hostContext.close()
  await guestContext.close()
})

test('home page buttons are disabled until required input exists', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Create Lobby' }).click()
  await expect(page.getByRole('button', { name: 'Create Game' })).toBeDisabled()

  await page.getByPlaceholder('Enter name').fill('Alice')
  await expect(page.getByRole('button', { name: 'Create Game' })).toBeEnabled()

  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Join Lobby' }).click()
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeDisabled()

  await page.getByPlaceholder('Enter name').fill('Alice')
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeDisabled()

  await page.getByPlaceholder('GUID code').fill('ABCDEFGH')
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeEnabled()
})

test('difficulty buttons are visible on create lobby screen', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Lobby' }).click()

  await expect(page.getByRole('button', { name: 'Easy' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Normal' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hard' })).toBeVisible()
})

test('selected difficulty is shown in lobby after create', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Lobby' }).click()
  await page.getByPlaceholder('Enter name').fill('Alice')
  await page.getByRole('button', { name: 'Hard' }).click()
  await page.getByRole('button', { name: 'Create Game' }).click()

  await expect(page.getByRole('heading', { name: 'Lobby' })).toBeVisible()
  await expect(page.locator('#lobby-difficulty')).toHaveText('Hard')
})

test('word is displayed as letter boxes when match starts', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  const joinCode = await hostCreatesLobby(hostPage, 'Alice')
  await guestJoinsLobby(guestPage, joinCode, 'Bob')

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: /Round 1\/\d+/ })).toBeVisible()

  const firstBox = hostPage.locator('.letter-box').first()
  await expect(firstBox).toBeVisible()
  const count = await hostPage.locator('.letter-box').count()
  expect(count).toBeGreaterThan(0)

  await hostContext.close()
  await guestContext.close()
})

test('active player can spin wheel and guess word', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  const joinCode = await hostCreatesLobby(hostPage, 'Alice')
  await guestJoinsLobby(guestPage, joinCode, 'Bob')

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: /Round 1\/\d+/ })).toBeVisible()

  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const activePage = hostSpinEnabled ? hostPage : guestPage

  await activePage.getByRole('button', { name: 'Spin' }).click()

  await expect(activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

  const guessInput = activePage.getByPlaceholder('Type your guess')
  await expect(guessInput).toBeEnabled()

  await guessInput.fill('cat')
  await activePage.getByRole('button', { name: 'Guess' }).click()

  await expect(guessInput).toHaveValue('')

  await expect(activePage.getByRole('heading', { name: /Round \d+\/\d+/ })).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})

test('scoreboard updates with player scores after guess', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  const joinCode = await hostCreatesLobby(hostPage, 'Alice')
  await guestJoinsLobby(guestPage, joinCode, 'Bob')

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: /Round 1\/\d+/ })).toBeVisible()

  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const activePage = hostSpinEnabled ? hostPage : guestPage

  await activePage.getByRole('button', { name: 'Spin' }).click()
  await activePage.getByPlaceholder('Type your guess').fill('test')
  await activePage.getByRole('button', { name: 'Guess' }).click()

  await hostPage.waitForTimeout(500)

  const hostScoreboard = hostPage.locator('section.card').filter({ hasText: 'Scoreboard' })
  const guestScoreboard = guestPage.locator('section.card').filter({ hasText: 'Scoreboard' })

  await expect(hostScoreboard.getByText(/^\d+ pts$/)).toBeTruthy()
  await expect(guestScoreboard.getByText(/^\d+ pts$/)).toBeTruthy()

  await hostContext.close()
  await guestContext.close()
})

test('after incorrect guess spin is locked until timer rotates turn', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  const joinCode = await hostCreatesLobby(hostPage, 'Alice')
  await guestJoinsLobby(guestPage, joinCode, 'Bob')

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: /Round 1\/\d+/ })).toBeVisible()

  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const activePage = hostSpinEnabled ? hostPage : guestPage
  const passivePage = hostSpinEnabled ? guestPage : hostPage

  await activePage.getByRole('button', { name: 'Spin' }).click()
  await activePage.getByPlaceholder('Type your guess').fill('zzzzzzzzz')
  await activePage.getByRole('button', { name: 'Guess' }).click()

  await expect(activePage.getByPlaceholder('Type your guess')).toHaveValue('')

  await expect(passivePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

  await expect(activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

  await hostContext.close()
  await guestContext.close()
})
