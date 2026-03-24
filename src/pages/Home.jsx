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

    const token = getAuthToken();
    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ framework, prompt }),
    });

    try {
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
      alert("Failed to generate code. Check backend or network.");
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

  const getPreviewCode = () => {
    let previewCode = code;
    
    // Add CSS/JS imports based on framework
    if (framework === "html-tailwind" || framework === "html-tailwind-bootstrap") {
      if (!previewCode.includes("tailwindcss")) {
        previewCode = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; padding: 10px; }
            </style>
          </head>
          <body>
            ${previewCode}
          </body>
          </html>
        `;
      }
    }
    
    if (framework === "html-bootstrap" || framework === "html-tailwind-bootstrap") {
      if (!previewCode.includes("bootstrap")) {
        previewCode = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body { margin: 0; padding: 10px; }
            </style>
          </head>
          <body>
            ${previewCode}
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
          </body>
          </html>
        `;
      }
    }

    // For plain HTML + CSS
    if (framework === "html-css" || framework === "html-css-js") {
      if (!previewCode.includes("<!DOCTYPE")) {
        previewCode = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; padding: 10px; }
            </style>
          </head>
          <body>
            ${previewCode}
          </body>
          </html>
        `;
      }
    }

    return previewCode;
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
                      <button className="export  w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover">
                        <PiExportBold />
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="copy w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover">
                        <ImNewTab />
                      </button>
                      <button className="export  w-[40px] h-[40px] rounded-xl border-[1px] app-border flex items-center justify-center transition-all app-hover">
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
