// Load environment variables FIRST (before any other imports)
import "dotenv/config";

import express from "express";
import cors from "cors";
import analyzeRoute from "./routes/analyze.js";
import assistantRoute from "./routes/assistant.js";
import { getAIMode, isAIAvailable } from "./services/aiAdapter.js";

const app = express();
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
}));
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
  const aiMode = getAIMode();
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`\n📊 AI Configuration:`);
  console.log(`   Mode: ${aiMode}`);
  if (aiMode === "claude-code-cli") {
    console.log(`   ✓ Claude Code agents enabled for local development`);
    console.log(`   Agents: Resume Extraction, Skill Analysis, CV Generation`);
  } else if (aiMode === "no-ai-configured") {
    console.log(`   ⚠ No AI configured - set USE_CLAUDE_CODE=true for local agents`);
  } else {
    console.log(`   ✓ Real AI enabled via ${aiMode}`);
  }
  console.log("");
});
