import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

console.log("🚀 Main.jsx loading...");
const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (!rootElement) {
  throw new Error("❌ Root element not found!");
}

const root = createRoot(rootElement);
console.log("✅ React root created");

root.render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>
);

console.log("✅ App rendered successfully");
