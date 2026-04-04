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

// ✅ Auth Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.token = token;
    req.user = data.user;
    return next();
  } catch {
    return res.status(401).json({ error: "Token verification failed" });
  }
};

// ✅ Auth Route
app.get("/auth/me", authenticateToken, (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
    },
  });
});

app.get("/auth/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
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
      "html-css": "Return semantic HTML with a complete <style> block using CSS variables for colors, spacing, radius, and shadows. Do not rely on external CSS frameworks.",
      "html-tailwind": "Use Tailwind utility classes only and include nuanced spacing, typography, depth, and state styling.",
      "html-bootstrap": "Use Bootstrap 5 classes/structure and elevate visuals with tasteful utility overrides when needed.",
      "html-css-js": "Return semantic HTML, complete CSS in <style>, and minimal JS in <script> only for meaningful interactions.",
      "html-tailwind-bootstrap": "Use Tailwind + Bootstrap-compatible markup while keeping style conflicts minimal and hierarchy crisp.",
    };

    const frameworkGuide = frameworkGuideMap[framework] || "Return production-ready frontend code for the requested framework.";

    const fullPrompt = `
You are a senior frontend engineer and expert UI/UX designer.
Generate a premium, visually striking, production-grade UI component.

Framework: ${framework}
Component Description: ${prompt}

Requirements:
- Create an intentional visual direction, not a generic template.
- Use a cohesive color system with depth: background, surface, accent, muted text, border, and interactive states.
- Ensure excellent visual hierarchy with consistent spacing rhythm and alignment.
- Use strong typography contrast (heading/body/supporting text) and readable line-height.
- Add polished micro-interactions for buttons/cards/inputs (hover, focus-visible, active, disabled).
- Include at least one tasteful premium detail (subtle gradient, glow, layered shadow, glass effect, or texture) without hurting clarity.
- Ensure accessibility: contrast, visible focus state, and semantic structure.
- Make it responsive for mobile and desktop breakpoints.
- Keep code clean and maintainable.

Design quality bar:
- This should look like a dribbble-quality modern SaaS/product UI, not basic boilerplate.
- Avoid flat, dull, default-looking layouts.
- Avoid clashing colors; use balanced modern color grading.
- Prefer rounded-xl style geometry, soft shadows, and generous whitespace where appropriate.

Framework rules:
${frameworkGuide}

Output rules:
- Return only code (no explanation, no markdown fences).
- If HTML/CSS is requested, include complete runnable markup and styles.
- If JS is needed for interactions, keep it minimal and inline.
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
        user_token: req.user.id,
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
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "No authenticated user", history: [] });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from("generated_code_history")
        .select("id,framework,prompt,code,created_at")
        .eq("user_token", userId)
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
