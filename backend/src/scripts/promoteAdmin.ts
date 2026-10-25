import mongoose from "mongoose";
import { config } from "../config/env";
import { User } from "../models/User";

async function promoteAdmin() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    throw new Error("Usage: npm run admin:promote -- user@example.com");
  }

  await mongoose.connect(config.MONGODB_URI);
  const result = await User.updateOne({ email }, { $set: { role: "admin" } });
  if (result.matchedCount === 0) {
    throw new Error(`No account found for ${email}. Register the account before promoting it.`);
  }
  console.log(`Promoted ${email} to admin.`);
}

promoteAdmin()
  .catch((error: unknown) => {
    console.error("Unable to promote account:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
