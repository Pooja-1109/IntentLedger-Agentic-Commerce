import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { apiRouter } from "./routes";
import { errorHandler } from "./middleware/error.middleware";
import { connectDatabase, isMongoConnected } from "./config/database";
import { getAiCompilerHealth } from "./config/ai.config";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  const start = Date.now();
  const { method, url } = req;
  _res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${method} ${url} ${_res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Routes
app.use("/api", apiRouter);

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route '${req.method} ${req.originalUrl}' does not exist on IntentLedger API server.`,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Server startup
async function startServer() {
  await connectDatabase();
  const aiHealth = getAiCompilerHealth();

  app.listen(PORT, () => {
    console.log("==================================================");
    console.log(`🚀 IntentLedger Engine running on port: ${PORT}`);
    console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`🛡️  Persistence: ${isMongoConnected() ? "MongoDB Database" : "In-Memory Store (High-Speed Local)"}`);
    console.log(`🧠 AI Compiler: ${aiHealth.description}`);
    console.log("==================================================");
  });
}

startServer();

export default app;
