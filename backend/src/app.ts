import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/error";
import { setupSockets } from "./sockets";
import http from "http";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: ["http://localhost:3000", "https://your-frontend.com"],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  const server = http.createServer(app);
  setupSockets(server);
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(routes);
  app.use(errorHandler);
  return app;
}
