import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const base = process.env.VITE_BASE ?? '/tuhfa/';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // whole lessons are played end to end; under a full parallel run they need more than 30 s
  timeout: 90_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${port}${base}`,
    locale: 'ar-EG',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'phone-390', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
    { name: 'phone-360', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
