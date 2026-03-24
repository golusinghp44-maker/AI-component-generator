import React, { useCallback, useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Select from "react-select";
import { BsStars } from "react-icons/bs";
import { HiCodeBracket } from "react-icons/hi2";
import Editor from "@monaco-editor/react";
import { IoCopy } from "react-icons/io5";
import { PiExportBold } from "react-icons/pi";
import { ImNewTab } from "react-icons/im";
import { FiRefreshCcw } from "react-icons/fi";
import { ClipLoader } from "react-spinners";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

const Home = () => {
  const options = [
    { value: "html-css", label: "HTML + CSS" },
    { value: "html-tailwind", label: "HTML + Tailwind CSS" },
    { value: "html-bootstrap", label: "HTML + Bootstrap" },
    { value: "html-css-js", label: "HTML + CSS+JS" },
    { value: "html-tailwind-bootstrap", label: "HTML + Tailwind + Bootstrap" },
  ];

  const [outputScreen, setOutputScreen] = useState(false);
  const [tab, setTab] = useState(1);
  const [framework, setFramework] = useState("");
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const { getAuthToken } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);
  const [history, setHistory] = useState([]);
  const [preferences, setPreferences] = useState({
    autoOpenPreview: true,
    compactHistory: false,
    showTips: true,
  });

  // Utility functions for history management
  const getLocalStorageKey = useCallback(() => {
    const token = getAuthToken();
    return `codeHistory_${token}`;
  }, [getAuthToken]);

  const saveHistoryToLocalStorage = (newEntry) => {
    try {
      const key = getLocalStorageKey();
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = [newEntry, ...existing].slice(0, 50); // Keep last 50
      localStorage.setItem(key, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.warn("Failed to save to localStorage:", err);
      return false;
    }
  };

  const getHistoryFromLocalStorage = useCallback(() => {
    try {
      const key = getLocalStorageKey();
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (err) {
      console.warn("Failed to read from localStorage:", err);
      return [];
    }
  }, [getLocalStorageKey]);

  // Load history from backend (Supabase) or localStorage (fallback)
  const loadHistory = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setHistory(getHistoryFromLocalStorage());
        return;
      }

      // Try backend first
      const res = await fetch("http://localhost:5000/history", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const backendHistory = Array.isArray(data?.history) ? data.history : [];
        setHistory(backendHistory);
        console.log("✅ History loaded from backend:", backendHistory.length);
      } else {
        // Fallback to localStorage
        console.warn("⚠️ Backend returned status", res.status, "- Using localStorage");
        setHistory(getHistoryFromLocalStorage());
      }
    } catch (err) {
      // Fallback to localStorage on network error
      console.warn("⚠️ Failed to load from backend, using localStorage:", err.message);
      setHistory(getHistoryFromLocalStorage());
    }
  }, [getAuthToken, getHistoryFromLocalStorage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("userPreferences") || "{}");
      setPreferences((prev) => ({ ...prev, ...stored }));
    } catch {
      // Keep defaults
    }
  }, []);

 

  const getResponse = async () => {
    if (!framework) return alert("Please select a framework");
    if (!prompt) return alert("Please describe your component");
    setLoading(true);
    setOutputScreen(false);

    try {
      const token = getAuthToken();
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ framework, prompt }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error || `Generation failed with status ${res.status}`);
      }

      // Backend call
      const data = await res.json();
      console.log("API RESPONSE 👉", data);
      const generatedCode = data.code || "No code generated";
      
      // Save code to state
      setCode(generatedCode);
      setOutputScreen(preferences.autoOpenPreview); // Editor show

      // Create history entry
      const historyEntry = {
        id: Date.now(),
        framework,
        prompt,
        code: generatedCode,
        created_at: new Date().toISOString(),
      };

      // Save to localStorage immediately
      saveHistoryToLocalStorage(historyEntry);

      // Try to update backend history
      try {
        const histRes = await fetch("http://localhost:5000/history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (histRes.ok) {
          const histData = await histRes.json();
          setHistory(Array.isArray(histData?.history) ? histData.history : []);
          console.log("✅ History synced from backend");
        } else {
          // Use localStorage as fallback
          setHistory(getHistoryFromLocalStorage());
          console.warn("⚠️ Backend history sync failed, using localStorage");
        }
      } catch (err) {
        // Use localStorage as fallback
        console.warn("⚠️ Failed to sync backend history:", err.message);
        setHistory(getHistoryFromLocalStorage());
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to generate code. Check backend or network.");
    } finally {
      setLoading(false); // Loader hide
    }
  };
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied to clipboard");
    } catch (err) {
      console.error("Failed to copy: ", err);
      alert("Failed to copy");
      /* Rejected - text failed to copy to the clipboard */
    }
  };

  const stripCodeFences = (rawCode = "") => {
    const fencedMatch = rawCode.match(/```(?:html|css|javascript|js)?\s*([\s\S]*?)```/i);
    return (fencedMatch ? fencedMatch[1] : rawCode).trim();
  };

  const addToHead = (doc, headContent) => {
    if (/<\/head>/i.test(doc)) {
      return doc.replace(/<\/head>/i, `${headContent}\n</head>`);
    }
    return doc.replace(/<html[^>]*>/i, (match) => `${match}\n<head>${headContent}</head>`);
  };

  const ensureHtmlDocument = (markup) => {
    const cleaned = stripCodeFences(markup);
    if (/<!doctype\s+html/i.test(cleaned) || /<html[\s>]/i.test(cleaned)) {
      return cleaned;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
${cleaned}
</body>
</html>
`.trim();
  };

  const getExportFileName = () => {
    const nameMap = {
      "html-css": "component-html-css.html",
      "html-tailwind": "component-tailwind.html",
      "html-bootstrap": "component-bootstrap.html",
      "html-css-js": "component-html-css-js.html",
      "html-tailwind-bootstrap": "component-tailwind-bootstrap.html",
    };
    return nameMap[framework] || "component.html";
  };

  const exportCodeToFile = () => {
    const cleanedCode = stripCodeFences(code);
    if (!cleanedCode) {
      alert("No code to export");
      return;
    }

    const blob = new Blob([cleanedCode], { type: "text/plain;charset=utf-8" });
    const fileUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = getExportFileName();
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(fileUrl);
  };

  const openPreviewInNewTab = () => {
    const previewDoc = getPreviewCode();
    if (!previewDoc.trim()) {
      alert("Generate code first to preview in a new tab");
      return;
    }

    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      alert("Popup blocked. Please allow popups for this site.");
      return;
    }

    popup.document.open();
    popup.document.write(previewDoc);
    popup.document.close();
  };

  const refreshPreview = () => {
    setPreviewNonce((current) => current + 1);
  };

  const getPreviewCode = () => {
    let previewDoc = ensureHtmlDocument(code || "");

    const needsTailwind = framework === "html-tailwind" || framework === "html-tailwind-bootstrap";
    const needsBootstrap = framework === "html-bootstrap" || framework === "html-tailwind-bootstrap";

    if (needsTailwind && !/cdn\.tailwindcss\.com/i.test(previewDoc)) {
      previewDoc = addToHead(
        previewDoc,
        '<script src="https://cdn.tailwindcss.com"></script>'
      );
    }

    if (needsBootstrap && !/bootstrap(\.min)?\.css/i.test(previewDoc)) {
      previewDoc = addToHead(
        previewDoc,
        '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />'
      );
    }

    if (needsBootstrap && !/bootstrap(\.bundle)?(\.min)?\.js/i.test(previewDoc) && !/<\/body>/i.test(previewDoc)) {
      previewDoc = `${previewDoc}\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>`;
    } else if (needsBootstrap && !/bootstrap(\.bundle)?(\.min)?\.js/i.test(previewDoc)) {
      previewDoc = previewDoc.replace(
        /<\/body>/i,
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>\n</body>'
      );
    }

    if (framework === "html-css" || framework === "html-css-js") {
      const hasCustomStyles = /<style[\s>]|style\s*=|class\s*=/i.test(previewDoc);
      if (!hasCustomStyles) {
        previewDoc = addToHead(
          previewDoc,
          `<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 16px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}
</style>`
        );
      }
    }

    return previewDoc;
  };

  return (
    <div className="app-surface app-text-primary min-h-screen">
      <Navbar />

      <div className="flex items-center px-[100px] justify-between gap-[30px]">
        <div className="left w-[55%] h-[auto] py-[30px] rounded-xl app-panel border app-border mt-5 p-[20px]">
          <h3 className="text-[25px] font-semibold sp-text">
            Ai component generate
          </h3>
          <p className="app-text-secondary mt-2 text-[16px]">
            Describe your component and let AI will code for you.
          </p>

          <p className="text-[15px] font-[700] mt-4">Framework</p>
          <Select
            className="mt-2"
            options={options}
            classNamePrefix="black-select"
            onChange={(e) => setFramework(e.value)} // <-- add this line
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "var(--tertiary-bg)",
                borderColor: "var(--border-color)",
                boxShadow: "none",
                minHeight: "40px",
                color: "var(--text-primary)",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "var(--secondary-bg)",
                color: "var(--text-primary)",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused
                  ? "var(--hover-bg)"
                  : state.isSelected
                  ? isDark
                    ? "#2c2c34"
                    : "#d8d8df"
                  : "var(--secondary-bg)",
                color: "var(--text-primary)",
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--text-primary)",
              }),
              placeholder: (base) => ({
                ...base,
                color: "var(--text-secondary)",
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: "var(--text-primary)",
              }),
              indicatorSeparator: () => ({
                display: "none",
              }),
            }}
          />

          <p className="text-[15px] font-[700] mt-5">Describe your component</p>
          <textarea
            onChange={(e) => setPrompt(e.target.value)}
            value={prompt}
            className="w-full min-h-[200px] rounded-xl app-tertiary mt-2 p-[10px] app-text-primary border app-border"
            placeholder="Describe your component in let ai will code for your component."
          ></textarea>
          <div className="flex items-center justify-between">
            <p className="app-text-secondary">
              Click on generate button to generate your code
            </p>

            <button
              onClick={getResponse}
              className="generate flex items-center p-[14px] rounded-lg bg-gradient-to-r from-purple-500  to-purple-600 mt-3 px-[20px] gap-[8px] transition-all hover:opacity-80"
            >
              <i>
                <BsStars />
              </i>
              Generate
            </button>
          </div>

          {preferences.showTips && (
            <p className="app-text-secondary text-xs mt-3">
              Tip: Use specific UI details like spacing, color palette, and states to get better generated code.
            </p>
          )}

          <div className="mt-6">
            <p className="text-[15px] font-[700]">Recent history</p>
            <div className="mt-2 max-h-[140px] overflow-auto rounded-xl app-tertiary border app-border">
              {history.length === 0 ? (
                <p className="app-text-secondary text-sm p-3">No history yet.</p>
              ) : (
                history.slice(0, preferences.compactHistory ? 8 : 5).map((h) => (
                  <button
                    type="button"
                    key={h.id}
                    onClick={() => {
                      setFramework(h.framework);
                      setPrompt(h.prompt);
                      setCode(h.code);
                      setOutputScreen(true);
                      setTab(1);
                    }}
                    className={`w-full text-left border-b app-border app-hover transition ${
                      preferences.compactHistory ? "p-2" : "p-3"
                    }`}
                  >
                    <p className="app-text-primary text-sm font-semibold">{h.framework}</p>
                    <p className="app-text-secondary text-xs line-clamp-1">{h.prompt}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="right relative mt-2 left w-[50%] h-[80vh] app-panel border app-border rounded-xl">
          {outputScreen === false ? (
            <>
              {loading === true ? (
                <>
                  <div className="loader absolute left-0 top-0 w-full h-full flex items-center justify-center">
                    <ClipLoader />
                  </div>
                </>
              ) : (
                ""
              )}

              <div className="skeleton w-full h-full flex items-center flex-col justify-center">
                <div className="circle p-[20px] w-[70px] flex items-center justify-center text-[30px] h-[70px] rounded-[50%] bg-gradient-to-r from-purple-500  to-purple-600">
                  <HiCodeBracket />
                </div>
                <p className="text-[16px] app-text-secondary mt-2">
                  Your component & code will appear here.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="top app-tertiary border-b app-border w-full h-[60px] flex items-center gap-[15px] px-[20px]">
                <button
                  onClick={() => {
                    setTab(1);
                  }}
                  className={`btn w-[50%]  p-[10px] rounded-xl transition-all ${
                    tab === 1 ? "app-active-tab" : ""
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => {
                    setTab(2);
                  }}
                  className={`btn w-[50%]  p-[10px] rounded-xl transition-all ${
                    tab === 2 ? "app-active-tab" : ""
                  }`}
                >
                  Preview
                </button>
              </div>
              <div className="top-2 app-tertiary border-b app-border w-full h-[60px] flex items-center justify-between gap-[15px] px-[20px]">
                <div className="left">
                  <p className="font-bold">Code Editor</p>
                </div>
                <div className="right flex items-center gap[10px]">
                  {tab === 1 ? (
                    <>
                      <button
                        className="copy w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover"
                        onClick={copyCode}
                      >
                        <IoCopy />
                      </button>
                      <button
                        className="export  w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover"
                        onClick={exportCodeToFile}
                        title="Export code"
                        aria-label="Export code"
                      >
                        <PiExportBold />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="newtab w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover"
                        onClick={openPreviewInNewTab}
                        title="Open preview in new tab"
                        aria-label="Open preview in new tab"
                      >
                        <ImNewTab />
                      </button>
                      <button
                        className="refresh  w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover"
                        onClick={refreshPreview}
                        title="Refresh preview"
                        aria-label="Refresh preview"
                      >
                        <FiRefreshCcw />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="editor h-[500px] w-full overflow-auto app-primary border-t app-border">
                {tab === 1 ? (
                  <>
                    <Editor
                      height="100%"
                      theme={isDark ? "vs-dark" : "vs-light"}
                      language="html"
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      options={{
                        readOnly: false,
                        fontSize: 14,
                        wordWrap: "on",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full app-panel overflow-auto">
                    <iframe
                      key={`preview-${framework}-${previewNonce}`}
                      title="preview"
                      className="w-full h-full border-0"
                      srcDoc={getPreviewCode()}
                      sandbox="allow-scripts allow-same-origin"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%'
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
