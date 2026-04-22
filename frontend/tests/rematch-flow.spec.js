import { test, expect } from '@playwright/test'

// Normal word bank from backend. Used to deterministically brute-force
// the current round word through API so the test can finish matches quickly.
const NORMAL_WORDS = [
  'absent', 'accent', 'accept', 'access', 'active', 'actual',
  'animal', 'annual', 'answer', 'anyone', 'appear', 'around',
  'author', 'bamboo', 'banana', 'battle', 'beauty', 'bridge',
  'broken', 'budget', 'butter', 'button', 'camera', 'castle',
  'cattle', 'change', 'charge', 'choose', 'circle', 'client',
  'closed', 'closet', 'coffee', 'combat', 'coming', 'common',
  'corner', 'cotton', 'course', 'create', 'crisis', 'cruise',
  'custom', 'damage', 'danger', 'decade', 'decide', 'defeat',
  'defend', 'define', 'demand', 'desert', 'design', 'detail',
  'dining', 'dinner', 'dollar', 'domain', 'donkey', 'double',
  'dragon', 'drawer', 'during', 'either', 'employ', 'enable',
  'engine', 'enough', 'entire', 'escape', 'events', 'fabric',
  'factor', 'family', 'famous', 'finger', 'folder', 'follow',
  'forest', 'formal', 'foster', 'frozen', 'future', 'garden',
  'gentle', 'global', 'golden', 'growth', 'guitar', 'harbor',
  'honest', 'hunter', 'impact', 'import', 'inside', 'island',
  'junior', 'kitten', 'launch', 'lawyer', 'leader', 'listen',
  'little', 'manage', 'market', 'mirror', 'mobile', 'modern',
  'moment', 'monkey', 'mother', 'mutual', 'narrow', 'needle',
  'office', 'option', 'orange', 'origin', 'output', 'palace',
  'parrot', 'pencil', 'pepper', 'person', 'pillow', 'planet',
  'pocket', 'police', 'poster', 'powder', 'prefer', 'pretty',
  'prince', 'prison', 'profit', 'public', 'purple', 'rabbit',
  'racing', 'random', 'rating', 'reader', 'reduce', 'reform',
  'region', 'relate', 'remain', 'repair', 'rescue', 'ribbon',
  'riddle', 'rocket', 'rubber', 'salmon', 'sample', 'school',
  'secret', 'shadow', 'signal', 'silver', 'simple', 'single',
  'sister', 'sketch', 'spider', 'spring', 'stable', 'statue',
  'sticky', 'stream', 'street', 'strict', 'string', 'studio',
  'summer', 'sunset', 'switch', 'symbol', 'system', 'tablet',
  'talent', 'target', 'temple', 'tender', 'ticket', 'timber',
  'tissue', 'tongue', 'travel', 'tunnel', 'turtle', 'unison',
  'valley', 'velvet', 'vessel', 'victim', 'violet', 'virtue',
  'vision', 'volume', 'walnut', 'walrus', 'window', 'winter',
  'wisdom', 'wonder', 'wooden', 'worker', 'yellow'
]

async function getMatchState(page, code) {
  const response = await page.request.get(`/api/matches/${code}`)
  expect(response.ok()).toBeTruthy()
  return await response.json()
}

async function postJson(page, url, body) {
  const response = await page.request.post(url, { data: body })
  expect(response.ok()).toBeTruthy()
  return await response.json()
}

async function waitForBothPlayersInLobby(hostPage, guestPage) {
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()
  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible()
  await expect(hostPage.locator('.player-list li')).toHaveCount(2)
  await expect(guestPage.locator('.player-list li')).toHaveCount(2)
}

async function setupTwoPlayerMatch(hostPage, guestPage) {
  await hostPage.goto('/')
  await hostPage.getByRole('button', { name: 'Create Lobby' }).click()
  await hostPage.getByPlaceholder('Ange namn').fill('Alice')
  await hostPage.getByRole('button', { name: 'Create Game' }).click()

  const codeText = await hostPage.locator('#invite-code-display').textContent()
  const joinCode = (codeText ?? '').trim()

  await guestPage.goto('/')
  await guestPage.getByRole('button', { name: 'Join Lobby' }).click()
  await guestPage.getByPlaceholder('Ange namn').fill('Bob')
  await guestPage.getByPlaceholder('GUID code').fill(joinCode)
  await guestPage.getByRole('button', { name: 'Join Game' }).click()

  await waitForBothPlayersInLobby(hostPage, guestPage)

  return joinCode
}

async function startMatch(hostPage, guestPage) {
  await hostPage.getByRole('button', { name: 'Ready' }).click()
  await guestPage.getByRole('button', { name: 'Ready' }).click()

  await expect(hostPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()
  await expect(guestPage.getByRole('heading', { name: 'Round 1/3' })).toBeVisible()
}

// Finishes match deterministically by driving game actions through API.
// This avoids flaky timeouts from random UI guessing.
async function finishMatchQuickly(hostPage, matchCode) {
  for (let outer = 0; outer < 6; outer++) {
    let state = await getMatchState(hostPage, matchCode)

    if (state.status === 'Finished') {
      return
    }

    if (state.status === 'RoundEnded') {
      state = await postJson(hostPage, `/api/matches/${matchCode}/spin`, {
        playerId: state.activePlayerId
      })
    }

    if (state.status !== 'InProgress') {
      continue
    }

    if (!state.currentWheelValue) {
      state = await postJson(hostPage, `/api/matches/${matchCode}/spin`, {
        playerId: state.activePlayerId
      })
    }

    if (state.status === 'Finished') {
      return
    }

    if (!state.currentWheelValue || state.status !== 'InProgress') {
      continue
    }

    for (const word of NORMAL_WORDS) {
      state = await postJson(hostPage, `/api/matches/${matchCode}/guess`, {
        playerId: state.activePlayerId,
        guess: word
      })

      if (state.status === 'RoundEnded' || state.status === 'Finished') {
        break
      }
    }
  }

  throw new Error('Failed to finish match deterministically within guard limit')
}

async function expectMatchFinishedOnBoth(hostPage, guestPage) {
  await expect(hostPage.locator('text=Match complete')).toBeVisible({ timeout: 10000 })
  await expect(guestPage.locator('text=Match complete')).toBeVisible({ timeout: 10000 })
}

async function prepareFinishedMatch(hostPage, guestPage) {
  const joinCode = await setupTwoPlayerMatch(hostPage, guestPage)
  await startMatch(hostPage, guestPage)
  await finishMatchQuickly(hostPage, joinCode)
  await expectMatchFinishedOnBoth(hostPage, guestPage)
  return joinCode
}

test('rematch button appears after game over', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  await prepareFinishedMatch(hostPage, guestPage)

  const rematchButton = hostPage.getByRole('button', { name: /Request Rematch|Requesting Rematch/ })
  await expect(rematchButton).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})

test('challenger can request rematch and opponent receives notification', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  await prepareFinishedMatch(hostPage, guestPage)

  const requestRematchButton = hostPage.getByRole('button', { name: /Request Rematch/ })
  await requestRematchButton.click()
  await expect(requestRematchButton).toBeHidden({ timeout: 5000 })

  await expect(guestPage.locator('text=Rematch Challenge Received')).toBeVisible({ timeout: 10000 })
  await expect(guestPage.getByRole('button', { name: 'Accept' })).toBeVisible()
  await expect(guestPage.getByRole('button', { name: 'Decline' })).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})

test('opponent can accept rematch and navigate to new lobby', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  await prepareFinishedMatch(hostPage, guestPage)

  const requestRematchButton = hostPage.getByRole('button', { name: /Request Rematch/ })
  await requestRematchButton.click()
  await expect(requestRematchButton).toBeHidden({ timeout: 5000 })

  await expect(guestPage.locator('text=Rematch Challenge Received')).toBeVisible({ timeout: 10000 })
  await guestPage.getByRole('button', { name: 'Accept' }).click()

  await expect(guestPage.getByRole('heading', { name: 'Lobby' })).toBeVisible({ timeout: 5000 })
  await expect(hostPage.getByRole('heading', { name: 'Lobby' })).toBeVisible({ timeout: 5000 })
  await expect(guestPage.getByRole('button', { name: 'Ready' })).toBeVisible()
  await expect(hostPage.getByRole('button', { name: 'Ready' })).toBeVisible()

  await hostContext.close()
  await guestContext.close()
})

test('opponent can decline rematch', async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()

  const hostPage = await hostContext.newPage()
  const guestPage = await guestContext.newPage()

  await prepareFinishedMatch(hostPage, guestPage)

  const requestRematchButton = hostPage.getByRole('button', { name: /Request Rematch/ })
  await requestRematchButton.click()
  await expect(requestRematchButton).toBeHidden({ timeout: 5000 })

  await expect(guestPage.locator('text=Rematch Challenge Received')).toBeVisible({ timeout: 10000 })
  await guestPage.getByRole('button', { name: 'Decline' }).click()

  await expect(hostPage.locator('text=Rematch was declined')).toBeVisible({ timeout: 5000 })

  await hostContext.close()
  await guestContext.close()
})
