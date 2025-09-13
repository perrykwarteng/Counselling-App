import { createApp } from "./app";
import { env } from "./config";
import { connectDB } from "./db/connect";
import { seedAdmin } from "./db/seedAdmin";

(async () => {
  await connectDB();
  await seedAdmin();
  const app = createApp();
  app.listen(env.PORT, () =>
    console.log(`API on http://localhost:${env.PORT}`)
  );
})();
