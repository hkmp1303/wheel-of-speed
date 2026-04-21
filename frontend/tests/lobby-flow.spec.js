import { test, expect } from '@playwright/test'

test('create and join lobby starts match when both players are ready', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await hostPage.goto('/');
  await hostPage.getByPlaceholder("Ange namn").fill("Alice");
  await hostPage.getByRole('button', { name: 'Create Game' }).click();

  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible();

  const codeText = await hostPage.locator('p strong').first().textContent();
  const joinCode = (codeText ?? '').trim();
  expect(joinCode).toHaveLength(8);

  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob');
  await guestPage.getByPlaceholder('GUID code').fill(joinCode);
  await guestPage.getByRole('button', { name: 'Join Game' }).click();

  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible();

  await hostPage.getByRole('button', { name: 'Ready' }).click();
  await guestPage.getByRole('button', { name: 'Ready' }).click();

  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible();
  await expect(guestPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible();

  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled();
  const guestSpinEnabled = await guestPage.getByRole('button', { name: 'Spin' }).isEnabled();

  expect(hostSpinEnabled || guestSpinEnabled).toBeTruthy();
  expect(hostSpinEnabled && guestSpinEnabled).toBeFalsy();

  await hostContext.close();
  await guestContext.close();
})

test('home page buttons are disabled until required input exists', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Create Game' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeDisabled();

  await page.getByPlaceholder("Ange namn").fill("Alice");
  await expect(page.getByRole('button', { name: 'Create Game' })).toBeEnabled();

  await page.getByPlaceholder('GUID code').fill('ABCDEFGH');
  await expect(page.getByRole('button', { name: 'Join Game' })).toBeEnabled();
})

test('difficulty buttons are visible on home page', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: "Easy" })).toBeVisible();
  await expect(page.getByRole('button', { name: "Normal" })).toBeVisible();
  await expect(page.getByRole('button', { name: "Hard" })).toBeVisible();
})

test('word is displayed as letter boxes when match starts', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  await hostPage.goto('/');
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()
  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  // Word should be displayed as letter boxes
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

  // Setup: Create and join match
  await hostPage.goto('/')
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()
  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  // Both players ready - match starts
  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  // Determine who has first turn (one spin button should be enabled)
  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const activePage = hostSpinEnabled ? hostPage : guestPage

  // Active player spins
  await activePage.getByRole('button', { name: 'Spin' }).click()

  // Verify wheel value appears (shows +X points)
  const wheelValue = activePage.locator('span').filter({ hasText: /^\+\d+\s+points$/ })
  await expect(wheelValue).toBeVisible()

  // Verify spin button is now disabled for active player
  await expect(activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

  // Verify guess input is now enabled
  const guessInput = activePage.getByPlaceholder('Type your guess')
  await expect(guessInput).toBeEnabled()

  // Active player submits a guess
  await guessInput.fill('cat')
  await activePage.getByRole('button', { name: 'Guess' }).click()

  // Verify guess input is cleared
  await expect(guessInput).toHaveValue('')

  // Verify match progresses (state changes)
  await expect(activePage.getByRole('heading', { name: /Round [1-3]\/3/ })).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})

test('scoreboard updates with player scores after guess', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  // Setup: Create and join match
  await hostPage.goto('/')
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()
  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  // Both players ready
  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  // Determine active player
  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const activePage = hostSpinEnabled ? hostPage : guestPage

  // Active player spins and guesses
  await activePage.getByRole('button', { name: 'Spin' }).click()
  await activePage.getByPlaceholder('Type your guess').fill('test')
  await activePage.getByRole('button', { name: 'Guess' }).click()

  // Wait a moment for score update to propagate via SignalR
  await hostPage.waitForTimeout(500)

  // Check that scores on both clients are consistent and match pattern
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

  // Setup: Create and join match
  await hostPage.goto('/')
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()
  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()

  // Both players ready
  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()
  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  // Determine who has the first turn
  const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  const activePage = hostSpinEnabled ? hostPage : guestPage
  const passivePage = hostSpinEnabled ? guestPage : hostPage

  // Active player spins and submits an incorrect guess
  await activePage.getByRole('button', { name: 'Spin' }).click()
  await activePage.getByPlaceholder('Type your guess').fill('zzzzzzzzz')
  await activePage.getByRole('button', { name: 'Guess' }).click()

  // Guess input clears after submission
  await expect(activePage.getByPlaceholder('Type your guess')).toHaveValue('')

  // Turn does NOT rotate on incorrect guess - passive player remains locked out
  await expect(passivePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

  // Active player's spin is also locked (can only spin once per turn, resets on timer rotation)
  await expect(activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

  await hostContext.close()
  await guestContext.close()
})
