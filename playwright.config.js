import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 320, height: 740 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "vp dev --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
