import { test, expect } from '@playwright/test';

test('Players can create, join, and ready up to start the game', async ({ browser }) => {
  // 1. Create two separate incognito browser sessions
  const aliceContext = await browser.newContext();
  const bobContext = await browser.newContext();
  
  const alicePage = await aliceContext.newPage();
  const bobPage = await bobContext.newPage();

  // 2. Alice creates the game
  await alicePage.goto('/'); 
  await alicePage.fill('#host-name-input', 'Alice');
  await alicePage.click('#create-game-btn');

  // Wait for lobby to load and grab the GUID link
  await expect(alicePage.locator('#lobby-status')).toContainText('Waiting for players');
  const inviteCode = await alicePage.locator('#invite-code-display').innerText();

  // 3. Bob joins using the invite code (FIXED to relative path)
  await bobPage.goto(`/join/${inviteCode}`);
  await bobPage.fill('#player-name-input', 'Bob');
  await bobPage.click('#join-game-btn');

  // Assert Bob sees he is in the lobby
  await expect(bobPage.locator('.player-list')).toContainText('Alice');
  await expect(bobPage.locator('.player-list')).toContainText('Bob');

  // 4. Both click Ready
  await alicePage.click('#ready-btn');
  await bobPage.click('#ready-btn');

  // 5. Assert the game auto-started (US-3 Acceptance Criteria)
  await expect(alicePage.locator('#game-board')).toBeVisible();
  await expect(bobPage.locator('#game-board')).toBeVisible();
});

// NOTE: If you had other tests here (like the spin wheel test), 
// make sure to paste them back in below this one!