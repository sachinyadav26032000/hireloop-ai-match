import express from "express";
import { claude } from "../services/claude.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userText } = req.body;

    const response = await claude.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `
You are a career analysis AI.

TASK:
- Identify suitable job roles
- Determine experience level
- Extract key skills
- Identify gaps or weaknesses

RULES:
- Be practical
- Be honest
- Return ONLY valid JSON

User input:
${userText}
          `,
        },
      ],
    });

    res.json({ result: response.content[0].text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

export default router;
