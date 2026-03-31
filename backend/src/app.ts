import cors from "cors";
import express from "express";
import { appSettingsRouter } from "./routes/appSettings.js";
import { categoriesRouter } from "./routes/categories.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { expensesRouter } from "./routes/expenses.js";
import { recurringRouter } from "./routes/recurring.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { errorHandler, HttpError } from "./middleware/httpError.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  const api = express.Router();
  api.use("/app-settings", appSettingsRouter);
  api.use("/categories", categoriesRouter);
  api.use("/expenses", expensesRouter);
  api.use("/recurring-expenses", recurringRouter);
  api.use("/wishlist", wishlistRouter);
  api.use("/dashboard", dashboardRouter);
  app.use("/api", api);

  app.use((_req, _res, next) => {
    next(new HttpError(404, "Not found"));
  });
  app.use(errorHandler);

  return app;
}
