import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "./supabaseAdmin.js";

// ✅ ES Modules में __dirname define करना
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ dotenv config with absolute path
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ✅ API Key Check (supports Gemini or Groq)
if (!GOOGLE_API_KEY && !GROQ_API_KEY) {
  console.error("❌ Missing AI key. Add GOOGLE_API_KEY or GROQ_API_KEY in backend/.env");
  process.exit(1);
}

if (GOOGLE_API_KEY) {
  console.log("✅ GOOGLE_API_KEY loaded successfully");
}

if (GROQ_API_KEY) {
  console.log("✅ GROQ_API_KEY loaded successfully");
}

// ✅ Gemini / Generative AI Client
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

// Model variables (may be initialized lazily)
const desiredModel = process.env.GOOGLE_MODEL || "models/gemini-1.5-flash";
const envFallbackModel = process.env.GOOGLE_FALLBACK_MODEL || "models/text-bison-001";
let model = null;

async function discoverAndInitModel() {
  if (!genAI) {
    model = null;
    return;
  }

  // Try env desired model first
  try {
    model = genAI.getGenerativeModel({ model: desiredModel });
    console.log(`✅ Using configured model: ${desiredModel}`);
    return;
  } catch (err) {
    console.warn(`⚠️ Configured model ${desiredModel} not available:`, err?.message || err);
  }

  // If listModels is available, try to pick a compatible model
  try {
    if (typeof genAI.listModels === "function") {
      const list = await genAI.listModels();
      const models = Array.isArray(list) ? list : list?.models || [];
      console.log("ℹ️ Available models:", models.map((m) => m.name || m.id || m.model || m));

      // Prefer Gemini or Bison variants, or any model that looks like it supports generation
      const candidate = models.find((m) => {
        const nm = (m.name || m.id || m.model || "").toLowerCase();
        return nm.includes("gemini") || nm.includes("bison") || nm.includes("text");
      });

      if (candidate) {
        const candidateName = candidate.name || candidate.id || candidate.model;
        try {
          model = genAI.getGenerativeModel({ model: candidateName });
          console.log(`✅ Using discovered model: ${candidateName}`);
          return;
        } catch (err) {
          console.warn(`⚠️ Failed to init discovered model ${candidateName}:`, err?.message || err);
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ listModels failed:", err?.message || err);
  }

  // Last-resort fallback from env or default
  try {
    model = genAI.getGenerativeModel({ model: envFallbackModel });
    console.log(`✅ Using fallback model: ${envFallbackModel}`);
  } catch (err) {
    console.error(`❌ Failed to initialize any model (tried ${desiredModel} and ${envFallbackModel}):`, err?.message || err);
    model = null;
  }
}

async function generateWithGroq(fullPrompt) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.6,
    }),
  });

  if (!groqRes.ok) {
    const errorText = await groqRes.text();
    throw new Error(`Groq API failed (${groqRes.status}): ${errorText}`);
  }

  const groqData = await groqRes.json();
  return groqData?.choices?.[0]?.message?.content || "";
}

// ✅ Simple in-memory user store (for demo - replace with database in production)
const users = new Map();

// ✅ Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // For demo purposes, we'll just verify token exists
  // In production, verify JWT signature
  req.token = token;
  next();
};

// ✅ Auth Routes
app.post("/auth/register", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (users.has(email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const userId = Date.now().toString();
  users.set(email, {
    id: userId,
    email,
    password, // In production, hash this
    name: name || email.split("@")[0],
    createdAt: new Date().toISOString(),
  });

  const token = `token_${userId}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user: {
      id: userId,
      email,
      name: name || email.split("@")[0],
    },
  });
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = users.get(email);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = `token_${user.id}_${Date.now()}`;

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

app.get("/auth/verify", authenticateToken, (req, res) => {
  res.json({ success: true, token: req.token });
});

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/db/health", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("id").limit(1);
    if (error) {
      return res.status(500).json({ ok: false, error: error.message });
    }
    return res.json({ ok: true, sample: data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

app.get("/db/users", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id,email,name,created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ users: data || [] });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

// ✅ Frontend Call Route (Protected)
app.post("/generate", authenticateToken, async (req, res) => {
  const { framework, prompt } = req.body;

  if (!framework || !prompt) {
    return res.status(400).json({
      error: "Framework या Prompt missing है",
    });
  }

  try {
    const frameworkGuideMap = {
      "html-css": "Return semantic HTML with a complete <style> block. Do not rely on external CSS frameworks.",
      "html-tailwind": "Use Tailwind utility classes only. Do not include external CSS files.",
      "html-bootstrap": "Use Bootstrap 5 classes and structure. Avoid custom heavy CSS unless needed for polish.",
      "html-css-js": "Return semantic HTML, complete CSS in <style>, and minimal JS in <script> only if interaction is required.",
      "html-tailwind-bootstrap": "Use Tailwind + Bootstrap-compatible markup while keeping styles conflict-safe and clean.",
    };

    const frameworkGuide = frameworkGuideMap[framework] || "Return production-ready frontend code for the requested framework.";

    const fullPrompt = `
You are an expert frontend developer.
Generate a modern, premium-looking, responsive UI component.

Framework: ${framework}
Component Description: ${prompt}

Requirements:
- Strong visual hierarchy with clean spacing and alignment.
- Modern color grading with accessible contrast.
- Polished states (hover, focus, active) for interactive elements.
- Balanced radius, shadows, and typography for a production feel.
- Mobile-first responsiveness that also looks refined on desktop.
- Keep code concise, readable, and reusable.

Framework rules:
${frameworkGuide}

Return only the code, no explanation, no markdown fences.
    `;

    let text = "";

    // Ensure we have an initialized Gemini model (if Google key exists)
    if (genAI && !model) {
      await discoverAndInitModel();
    }

    if (model) {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      text = response.text();
    } else if (GROQ_API_KEY) {
      text = await generateWithGroq(fullPrompt);
    } else {
      console.error("❌ No available model to handle generation");
      return res.status(500).json({ error: "No available model on server" });
    }

    try {
      await supabaseAdmin.from("generated_code_history").insert({
        user_token: req.token,
        framework,
        prompt,
        code: text,
      });
    } catch (e) {
      console.warn("⚠️ Failed to persist generation history:", e?.message || e);
    }

    res.json({ code: text });
  } catch (err) {
    console.error("🔥 FULL Gemini Error:", JSON.stringify(err, null, 2));
    res.status(500).json({
      error: "Gemini API call failed",
      message: err.message,
    });
  }
});

app.get("/history", authenticateToken, async (req, res) => {
  try {
    const token = req.token;
    
    if (!token) {
      return res.status(401).json({ error: "No token provided", history: [] });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("generated_code_history")
        .select("id,framework,prompt,code,created_at")
        .eq("user_token", token)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("⚠️ Supabase error fetching history:", error.message);
        return res.status(200).json({ 
          history: [],
          note: "Supabase fetch failed, use client-side localStorage",
          error: error.message 
        });
      }

      return res.status(200).json({ history: data || [] });
    } catch (dbErr) {
      console.warn("⚠️ Database error:", dbErr.message);
      return res.status(200).json({ 
        history: [],
        note: "Database error, use client-side localStorage",
        error: dbErr.message 
      });
    }
  } catch (e) {
    console.error("❌ History endpoint error:", e.message);
    return res.status(200).json({ 
      history: [],
      note: "Server error, use client-side localStorage",
      error: e.message 
    });
  }
});

// ✅ Server Start
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
