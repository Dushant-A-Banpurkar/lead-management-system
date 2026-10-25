import app from "./app";
import { connectDatabase } from "./config/database";
import { config } from "./config/env";
import { startFollowUpReminderScheduler } from "./services/followUpReminderService";

async function start() {
  await connectDatabase();
  startFollowUpReminderScheduler();
  app.listen(config.PORT, () => {
    console.log(`API listening on port ${config.PORT}`);
    startKeepAlive();
  });
}

function startKeepAlive() {
  if (!config.RENDER_URL) return;

  const healthUrl = new URL("/api/health", config.RENDER_URL);
  const ping = async () => {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) {
        console.error(`Render keep-alive request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Render keep-alive request failed:", error);
    }
  };

  void ping();
  setInterval(() => void ping(), 14 * 60 * 1000);
}

start().catch((error: unknown) => {
  console.error("Unable to start API:", error);
  process.exit(1);
});
