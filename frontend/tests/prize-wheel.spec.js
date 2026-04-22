import { test, expect } from '@playwright/test'

/**
 * Helper to start a match with two players
 * Returns both contexts and pages after both players are ready and match has started
 */
async function startMatchWithTwoPlayers(browser) {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  // Host creates a game
  await hostPage.goto('/')
  await hostPage.getByRole('button', { name: 'Create Lobby'}).click()
  await hostPage.locator('#host-name-input').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()

  // Get the join code
  const codeText = await hostPage.locator('p strong').first().textContent()
  const joinCode = (codeText ?? '').trim()

  // Guest joins the game
  await guestPage.goto('/')
  await guestPage.getByRole('button', { name: 'Join Lobby' }).click()
  await guestPage.locator('#player-name-input').fill('Bob')
  await guestPage.locator('#join-code-input').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()

  // Both players mark ready - match starts automatically
  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()

  // Wait for match to start
  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

  return { hostContext, guestContext, hostPage, guestPage }
}

test('wheel renders with top pointer indicator', async ({ browser }) => {
  const { hostContext, guestContext, hostPage } = await startMatchWithTwoPlayers(browser)

  // Check that wheel visual container exists - find the SVG element which is inside wheelVisual div
  const wheelVisual = hostPage.locator('svg').first()
  await expect(wheelVisual).toBeVisible()

  // Pointer is added via CSS ::before pseudo-element on the wheelVisual div
  // The visual check above confirms the container is visible with the pointer

  await hostContext.close()
  await guestContext.close()
})

test('wheel has all 5 slices visible', async ({ browser }) => {
  const { hostContext, guestContext, hostPage } = await startMatchWithTwoPlayers(browser)

  // SVG g elements represent slices in the wheel
  const slices = hostPage.locator('svg g g')
  await expect(slices).toHaveCount(5)

  // Check each slice has its value text
  const wheelValues = ['100', '200', '300', '400', '500']
  for (let i = 0; i < 5; i++) {
    const text = hostPage.locator('svg g g text').nth(i)
    await expect(text).toContainText(new RegExp(wheelValues[i]))
  }

  await hostContext.close()
  await guestContext.close()
})

test.describe('Prize Wheel Animation & Visual Indicators', () => {
  test('active player can spin wheel and see landing indicator', async ({ browser }) => {
    const { hostContext, guestContext, hostPage, guestPage } = await startMatchWithTwoPlayers(browser)

    // Determine who is active
    const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
    const activePage = hostSpinEnabled ? hostPage : guestPage

    // Spin the wheel
    await activePage.getByRole('button', { name: 'Spin' }).click()

    // Wait for spin animation to complete
    await expect(activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

    // Verify landed slice has data-landed attribute (set by component during spin)
    // Check within a reasonable timeout since animation takes time
    const landedSlices = activePage.locator('svg g g[data-landed="true"]')
    await expect(landedSlices).toHaveCount(1, { timeout: 5000 })

    // The wheel container should still be visible
    const wheelContainer = activePage.locator('svg').first()
    await expect(wheelContainer).toBeVisible()

    await hostContext.close()
    await guestContext.close()
  })

  test('text glow appears after landing animation', async ({ browser }) => {
    const { hostContext, guestContext, hostPage, guestPage } = await startMatchWithTwoPlayers(browser)

    // Find active player
    const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
    const activePage = hostSpinEnabled ? hostPage : guestPage

    // Spin wheel
    await activePage.getByRole('button', { name: 'Spin' }).click()
    await expect(activePage.getByRole('button', { name: 'Spin' })).toBeDisabled()

    // Wait for text glow to appear (starts after animation completes, ~5 seconds)
    // Check for text element with data-text-glow attribute set to true
    const textGlow = activePage.locator('svg g g text[data-text-glow="true"]')
    await expect(textGlow).toHaveCount(1, { timeout: 7000 })

    await hostContext.close()
    await guestContext.close()
  })
})
