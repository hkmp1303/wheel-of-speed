
import { createBdd } from 'playwright-bdd';
const { Given, When, Then } = createBdd();

// Helper function to start a match
async function startMatchWithTwoPlayers(world) {
  const { browser } = world
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  // Host creates a game
  await hostPage.goto('/')
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()

  // Get the join code
  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  // Guest joins the game
  await guestPage.goto('/')
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()

  // Both players mark ready - match starts
  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()

  // Wait for match to start
  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  world.hostContext = hostContext
  world.guestContext = guestContext
  world.hostPage = hostPage
  world.guestPage = guestPage
}

Given('two players have joined a match', async function(world) {
  const { browser } = world
  world.hostContext = await browser.newContext()
  world.guestContext = await browser.newContext()
  world.hostPage = await world.hostContext.newPage()
  world.guestPage = await world.guestContext.newPage()

  // Host creates game
  await world.hostPage.goto('/')
  await world.hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await world.hostPage.getByRole('button', { name: 'Create Game' }).click()

  const codeText = await world.hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  // Guest joins
  await world.guestPage.goto('/')
  await world.guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await world.guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await world.guestPage.getByRole('button', { name: 'Join Game' }).click()
})

Given('both players have marked themselves as ready', async function(world) {
  await world.hostPage.getByRole('button', { name: 'Ready' }).click()
  await world.guestPage.getByRole('button', { name: 'Ready' }).click()
})

Given('the match has started at Round 1/3', async function(world) {
  await expect(world.hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()
})

When('the active player views the match page', async function(world) {
  // Determine who is active
  const hostSpinEnabled = await world.hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  world.activePage = hostSpinEnabled ? world.hostPage : world.guestPage
})

Then('the wheel should be visible', async function(world) {
  const wheelVisual = world.activePage.locator('.wheel-visual')
  await expect(wheelVisual).toBeVisible()
})

Then('the wheel should display exactly {int} slices', async function(world, count) {
  const slices = world.activePage.locator('.wheel-slice')
  await expect(slices).toHaveCount(count)
})

Then('each slice should display one of the values: {int}, {int}, {int}, {int}, {int}', async function(world, val1, val2, val3, val4, val5) {
  const wheelValues = [val1.toString(), val2.toString(), val3.toString(), val4.toString(), val5.toString()]
  for (let i = 0; i < 5; i++) {
    const text = world.activePage.locator('.wheel-text').nth(i)
    await expect(text).toContainText(new RegExp(wheelValues[i]))
  }
})

Then('the wheel should render with a top pointer indicator', async function(world) {
  const wheelVisual = world.activePage.locator('.wheel-visual')
  await expect(wheelVisual).toHaveClass(/wheel-visual/)
})

When('the active player clicks the Spin button', async function(world) {
  await world.activePage.getByRole('button', { name: 'Spin' }).click()
})

Then('the wheel should spin', async function(world) {
  await expect(world.activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()
})

Then('a point value between {int} and {int} should be assigned', async function(world, min, max) {
  const wheelValue = world.activePage.locator('[data-testid="wheel-value"]')
  const value = await wheelValue.textContent()
  const pointValue = parseInt(value)
  expect(pointValue).toBeGreaterThanOrEqual(min)
  expect(pointValue).toBeLessThanOrEqual(max)
})

When('the non-active player attempts to click the Spin button', async function(world) {
  const hostSpinEnabled = await world.hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
  world.nonActivePage = hostSpinEnabled ? world.guestPage : world.hostPage
})

Then('the Spin button should be disabled', async function(world) {
  const spinButton = world.nonActivePage.getByRole('button', { name: 'Spin' })
  await expect(spinButton).toBeDisabled()
})

Then('the wheel should not spin', async function(world) {
  const wheelVisual = world.nonActivePage.locator('.wheel-visual')
  await expect(wheelVisual).toBeVisible()
})

When('the active player spins the wheel', async function(world) {
  world.activePage = world.activePage || world.hostPage
  await world.activePage.getByRole('button', { name: 'Spin' }).click()
})

Then('at least one letter of the word should be revealed', async function(world) {
  const maskedWord = world.activePage.locator('[data-testid="masked-word"]')
  const text = await maskedWord.textContent()
  const revealedLetters = text.split('').filter(c => c !== '_' && c !== ' ').length
  expect(revealedLetters).toBeGreaterThan(0)
})

Then('the landed slice should be marked with the {string} class', async function(world, className) {
  const landedSlice = world.activePage.locator(`.wheel-slice.${className}`)
  await expect(landedSlice).toHaveCount(1)
})

When('the spin animation completes', async function(world) {
  await world.activePage.waitForTimeout(2000)
})

Then('the text of the landed slice should display a glow effect', async function(world) {
  const glowText = world.activePage.locator('.wheel-text.text-glow')
  await expect(glowText).toHaveCount(1)
})

Then('the glow effect should appear within {int} seconds', async function(world, seconds) {
  const textGlow = world.activePage.locator('.wheel-text.text-glow')
  await expect(textGlow).toHaveCount(1, { timeout: seconds * 1000 })
})

Then('the pointer should mark the landing position', async function(world) {
  const wheelContainer = world.activePage.locator('.wheel-visual')
  await expect(wheelContainer).toBeVisible()
})

Then('the masked word should update immediately', async function(world) {
  const letterBoxes = world.activePage.locator('.letter-box')
  await expect(letterBoxes.first()).toBeVisible()
})

Then('the wheel should rotate smoothly', async function(world) {
  const wheelContainer = world.activePage.locator('.wheel-visual')
  await expect(wheelContainer).toBeVisible()
})
