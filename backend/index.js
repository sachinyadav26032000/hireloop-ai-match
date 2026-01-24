// Load environment variables FIRST (before any other imports)
import "dotenv/config";

import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";
import assistantRoute from "./routes/assistant.js";
import { getAIMode, isAIAvailable } from "./services/aiAdapter.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Legacy analyze endpoint
app.use("/analyze", analyzeRoute);

// New unified assistant endpoints
app.use("/assistant", assistantRoute);

// Debug: List all registered routes
console.log("Registered routes:");
assistantRoute.stack.forEach((r, i) => {
  if (r.route) {
    console.log(`  ${i}: ${Object.keys(r.route.methods).join(',').toUpperCase()} /assistant${r.route.path}`);
  }
});

// Root health check
app.get("/", (req, res) => {
  res.json({
    name: "HireLoop AI Assistant API",
    version: "1.0.0",
    endpoints: ["/assistant/health", "/assistant/analyze", "/assistant/generate-cv", "/assistant/optimize-linkedin", "/assistant/match-jobs"],
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`AI Mode: ${getAIMode()}`);
  console.log(`AI Available: ${isAIAvailable() ? "Yes - Real AI enabled" : "No - Configure API key"}`);
});
