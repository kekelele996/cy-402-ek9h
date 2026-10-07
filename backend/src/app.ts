import cors from "cors";
import express from "express";
import path from "path";
import { env } from "./config/env";
import auditLogRoutes from "./routes/audit-log";
import authRoutes from "./routes/auth";
import billingRoutes from "./routes/billing";
import caseRoutes from "./routes/case";
import clientRoutes from "./routes/client";
import documentRoutes from "./routes/document";
import userRoutes from "./routes/user";
import { errorHandler } from "./middlewares/error-handler.middleware";

export const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : true,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

app.get("/api/health", (_req, res) => {
  res.json({ data: { status: "ok", service: "cylawcase-backend" } });
});
app.get("/health", (_req, res) => {
  res.json({ data: { status: "ok", service: "cylawcase-backend" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/audit-logs", auditLogRoutes);

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/clients", clientRoutes);
app.use("/cases", caseRoutes);
app.use("/documents", documentRoutes);
app.use("/billing", billingRoutes);
app.use("/audit-logs", auditLogRoutes);

app.use(errorHandler);
