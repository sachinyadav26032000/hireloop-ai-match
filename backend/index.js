import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRoute from "./routes/analyze.js";
import assistantRoute from "./routes/assistant.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Legacy analyze endpoint
app.use("/analyze", analyzeRoute);

// New unified assistant endpoints
app.use("/assistant", assistantRoute);

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
  console.log(`API Key configured: ${process.env.ANTHROPIC_API_KEY ? "Yes" : "No (mock mode)"}`);
});
