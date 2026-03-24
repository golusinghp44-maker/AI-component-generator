import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { HiX } from "react-icons/hi";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { toast } from "react-toastify";

const AccountSettings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [preferences, setPreferences] = useState(() => {
    const defaults = {
      autoOpenPreview: true,
      compactHistory: false,
      showTips: true,
    };

    try {
      const parsed = JSON.parse(localStorage.getItem("userPreferences") || "{}");
      return { ...defaults, ...parsed };
    } catch {
      return defaults;
    }
  });

  const handlePreferenceChange = (key) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);
    localStorage.setItem("userPreferences", JSON.stringify(updated));
    toast.success("Preference updated");
  };

  return (
    <div className="min-h-screen app-surface app-text-primary">
      <Navbar />
      <div className="px-[100px] py-8">
        <div className="app-panel rounded-xl border app-border p-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <div className="flex items-center gap-2">
              <Link to="/profile" className="px-4 py-2 rounded-md border app-border app-hover">
                View Profile
              </Link>
              <button
                type="button"
                onClick={() => navigate("/")}
                aria-label="Close account settings"
                className="w-10 h-10 rounded-md border app-border app-hover flex items-center justify-center"
              >
                <HiX className="text-xl" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <section className="border app-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Theme</h2>
              <p className="app-text-secondary mb-3">Current mode: {isDark ? "Dark" : "Light"}</p>
              <button className="sp-gradient-btn px-4 py-2 rounded-md text-white" onClick={toggleTheme}>
                Toggle Theme
              </button>
            </section>

            <section className="border app-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Preferences</h2>
              <div className="space-y-3 app-text-secondary">
                <label className="flex items-center justify-between">
                  <span>Auto open preview after generation</span>
                  <input
                    type="checkbox"
                    checked={preferences.autoOpenPreview}
                    onChange={() => handlePreferenceChange("autoOpenPreview")}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>Compact history list</span>
                  <input
                    type="checkbox"
                    checked={preferences.compactHistory}
                    onChange={() => handlePreferenceChange("compactHistory")}
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span>Show tips and guidance</span>
                  <input
                    type="checkbox"
                    checked={preferences.showTips}
                    onChange={() => handlePreferenceChange("showTips")}
                  />
                </label>
              </div>
            </section>

            <section className="border app-border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Account</h2>
              <p className="app-text-secondary">Signed in as {user?.email}</p>
              <p className="app-text-secondary text-sm mt-1">Password and email changes are not enabled in local demo auth mode.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
