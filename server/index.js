import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import axios from "axios";

// ------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from the server first, then common workspace locations.
const envCandidates = [
  path.join(__dirname, ".env"),
  path.join(__dirname, ".env.local"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", ".env.local"),
  path.resolve(__dirname, "..", "backend", ".env")
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// ------------------------
const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.log("❌ GROQ_API_KEY missing");
  process.exit(1);
}
console.log("✅ GROQ API KEY Loaded");

// ------------------------
// GROQ CLIENT
// ------------------------
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ------------------------
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ------------------------
app.post("/generate", async (req, res) => {
  try {
    const { framework, prompt } = req.body;

    if (!framework || !prompt) {
      return res.status(400).json({ error: "Missing framework or prompt" });
    }

    const fullPrompt = `
You are an expert frontend developer.
Generate clean and responsive code.

Framework: ${framework}
Component Description: ${prompt}

Return only the code, no explanation.
`;

    const response = await axios.post(GROQ_API_URL, {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: fullPrompt
        }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const text = response.data.choices[0].message.content || "No response from model";
    res.json({ code: text });
  } catch (err) {
    console.error("🔥 Groq Error:", err);
    res.status(500).json({
      error: "Model call failed",
      message: err?.message || String(err)
    });
  }
});

// ------------------------
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
