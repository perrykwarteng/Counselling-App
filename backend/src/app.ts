import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import routes from "./routes";
import { errorHandler } from "./middleware/error";

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(routes);
  app.use(errorHandler);
  return app;
}
