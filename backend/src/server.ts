import app from "./app";
import { connectDatabase } from "./config/database";
import { config } from "./config/env";
import { startFollowUpReminderScheduler } from "./services/followUpReminderService";

async function start() {
  await connectDatabase();
  startFollowUpReminderScheduler();
  app.listen(config.PORT, () => {
    console.log(`API listening on port ${config.PORT}`);
  });
}

start().catch((error: unknown) => {
  console.error("Unable to start API:", error);
  process.exit(1);
});
