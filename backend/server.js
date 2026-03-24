const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const apiKey = process.env.GEMINI_API_KEY;

let ai = null;

if (apiKey && apiKey !== "your_api_key_here") {
  ai = new GoogleGenAI({ apiKey });
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/vendor/marked", express.static(path.join(__dirname, "..", "node_modules", "marked", "lib")));
app.use(
  "/vendor/highlight",
  express.static(path.join(__dirname, "..", "node_modules", "@highlightjs", "cdn-assets"))
);
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/chat", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  const mode = typeof req.body?.mode === "string" ? req.body.mode.trim() : "";
  const requestHistory = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API key is not configured. Update GEMINI_API_KEY in the .env file."
    });
  }

  try {
    const sanitizedHistory = requestHistory
      .filter((entry) => {
        if (!entry || typeof entry !== "object") {
          return false;
        }

        const isValidRole = entry.role === "user" || entry.role === "assistant";
        const content = typeof entry.content === "string" ? entry.content.trim() : "";
        return isValidRole && Boolean(content);
      })
      .map((entry) => ({
        role: entry.role,
        content: entry.content.trim()
      }))
      .slice(-12);

    const contents = mode === "Mini AI Assistant" && sanitizedHistory.length
      ? [
        ...sanitizedHistory.map((entry) => ({
          role: entry.role === "assistant" ? "model" : "user",
          parts: [{ text: entry.content }]
        })),
        { role: "user", parts: [{ text: prompt }] }
      ]
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents
    });

    const text = typeof response.text === "string" ? response.text.trim() : "";

    if (!text) {
      return res.status(502).json({ error: "Gemini returned an empty response." });
    }

    return res.json({ response: text });
  } catch (error) {
    const message = error?.message || "Something went wrong while contacting Gemini.";
    return res.status(500).json({ error: message });
  }
});

app.use((req, res, next) => {
  if (req.method !== "GET") {
    return next();
  }

  if (path.extname(req.path) || req.path.startsWith("/api/") || req.path.startsWith("/vendor/")) {
    return next();
  }

  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(port, () => {
  console.log(`AI chat app listening on http://localhost:${port}`);
});
