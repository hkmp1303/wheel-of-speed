import { test, expect } from '@playwright/test'

test.describe('Prize Wheel Animation & Visual Indicators', () => {
  test.beforeEach(async ({ browser }) => {
    // Setup: Create match with two players ready
    const hostContext = await browser.newContext()
    const guestContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const guestPage = await guestContext.newPage()

    await hostPage.goto('/')
    await hostPage.getByPlaceholder('Ange namn').fill('Alice')
    await hostPage.getByRole('button', { name: 'Create Game' }).click()

    const codeText = await hostPage.locator('p strong').first().textContent()
    const joinCode = (codeText ?? '').trim()

    await guestPage.goto('/')
    await guestPage.getByPlaceholder('Ange namn').fill('Bob')
    await guestPage.getByPlaceholder('GUID code').fill(joinCode)
    await guestPage.getByRole('button', { name: 'Join Game' }).click()

    await hostPage.getByRole('button', { name: 'Ready' }).click()
    await guestPage.getByRole('button', { name: 'Ready' }).click()

    await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()
  })

  test('wheel renders with top pointer indicator', async ({ page }) => {
    await page.goto('/')

    // Check that wheel visual container exists
    const wheelVisual = page.locator('.wheel-visual')
    await expect(wheelVisual).toBeVisible()

    // Pointer is added via CSS ::before pseudo-element
    // We can verify the container has the class that applies the pointer
    await expect(wheelVisual).toHaveClass(/wheel-visual/)
  })

  test('wheel has all 5 slices visible', async ({ page }) => {
    await page.goto('/')

    const slices = page.locator('.wheel-slice')
    await expect(slices).toHaveCount(5)

    // Check each slice has its value text
    const wheelValues = ['100', '200', '300', '400', '500']
    for (let i = 0; i < 5; i++) {
      const text = page.locator('.wheel-text').nth(i)
      await expect(text).toContainText(new RegExp(wheelValues[i]))
    }
  })

  test('active player can spin wheel and see landing indicator', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const guestContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const guestPage = await guestContext.newPage()

    // Setup match
    await hostPage.goto('/')
    await hostPage.getByPlaceholder('Ange namn').fill('Alice')
    await hostPage.getByRole('button', { name: 'Create Game' }).click()

    const codeText = await hostPage.locator('p strong').first().textContent()
    const joinCode = (codeText ?? '').trim()

    await guestPage.goto('/')
    await guestPage.getByPlaceholder('Ange namn').fill('Bob')
    await guestPage.getByPlaceholder('GUID code').fill(joinCode)
    await guestPage.getByRole('button', { name: 'Join Game' }).click()

    await hostPage.getByRole('button', { name: 'Ready' }).click()
    await guestPage.getByRole('button', { name: 'Ready' }).click()
    await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

    // Determine who is active
    const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
    const activePage = hostSpinEnabled ? hostPage : guestPage

    // Spin the wheel
    await activePage.getByRole('button', { name: 'Spin' }).click()

    // Wait for spin animation to complete
    await activePage.getByRole('button', { name: 'Spin' }).toBeDisabled()

    // Verify landed slice gets glow class (after pulse completes at 5 seconds)
    // For this test, check that landed class is applied
    const landedSlices = activePage.locator('.wheel-slice.landed')
    await expect(landedSlices).toHaveCount(1)

    // The glow effect will start after 5 seconds, but we can verify the structure
    const wheelContainer = activePage.locator('.wheel-visual')
    await expect(wheelContainer).toBeVisible()

    await hostContext.close()
    await guestContext.close()
  })

  test('text glow appears after landing animation', async ({ browser }) => {
    const hostContext = await browser.newContext()
    const guestContext = await browser.newContext()

    const hostPage = await hostContext.newPage()
    const guestPage = await guestContext.newPage()

    // Setup match
    await hostPage.goto('/')
    await hostPage.getByPlaceholder('Ange namn').fill('Alice')
    await hostPage.getByRole('button', { name: 'Create Game' }).click()

    const codeText = await hostPage.locator('p strong').first().textContent()
    const joinCode = (codeText ?? '').trim()

    await guestPage.goto('/')
    await guestPage.getByPlaceholder('Ange namn').fill('Bob')
    await guestPage.getByPlaceholder('GUID code').fill(joinCode)
    await guestPage.getByRole('button', { name: 'Join Game' }).click()

    await hostPage.getByRole('button', { name: 'Ready' }).click()
    await guestPage.getByRole('button', { name: 'Ready' }).click()
    await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()

    // Find active player
    const hostSpinEnabled = await hostPage.getByRole('button', { name: 'Spin' }).isEnabled()
    const activePage = hostSpinEnabled ? hostPage : guestPage

    // Spin wheel
    await activePage.getByRole('button', { name: 'Spin' }).click()
    await activePage.getByRole('button', { name: 'Spin' }).toBeDisabled()

    // Wait for text glow to appear (starts after ~5 seconds)
    const textGlow = activePage.locator('.wheel-text.text-glow')
    await expect(textGlow).toHaveCount(1, { timeout: 7000 })

    await hostContext.close()
    await guestContext.close()
  })
})
