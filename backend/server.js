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

app.post("/api/chat", async (req, res) => {
  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (!ai) {
    return res.status(500).json({
      error: "Gemini API key is not configured. Update GEMINI_API_KEY in the .env file."
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
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
