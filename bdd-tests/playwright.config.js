import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const uiTestDir = defineBddConfig({
  features: 'e2e/ui/features/**/*.feature',
  steps: ['e2e/ui/steps/**/*.js', 'e2e/ui/pages/**/*.js'],
  outputDir: '.features-gen/ui'
});

export default defineConfig({
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  reporter: [['list', { open: 'always' }], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: 'http://localhost:5010',  // Ändra till din applikations URL, t ex http://localhost:5010
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'ui',
      testDir: uiTestDir,
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});