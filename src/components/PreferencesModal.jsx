import React, { useState } from "react";

const DEFAULT_PREFERENCES = {
  autoOpenPreview: true,
  compactHistory: false,
  showTips: true,
};

const getStoredPreferences = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("userPreferences") || "{}");
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const PreferencesModal = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState(getStoredPreferences);

  if (!isOpen) return null;

  const togglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    onClose();
  };

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2 className="help-modal-title">Preferences</h2>
          <button className="help-modal-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="help-modal-body">
          <div className="help-section">
            <h3>Editor</h3>
            <label className="flex items-center justify-between py-2 app-text-secondary">
              <span>Auto open preview after generation</span>
              <input
                type="checkbox"
                checked={preferences.autoOpenPreview}
                onChange={() => togglePreference("autoOpenPreview")}
              />
            </label>
          </div>

          <div className="help-section">
            <h3>History</h3>
            <label className="flex items-center justify-between py-2 app-text-secondary">
              <span>Compact history items</span>
              <input
                type="checkbox"
                checked={preferences.compactHistory}
                onChange={() => togglePreference("compactHistory")}
              />
            </label>
          </div>

          <div className="help-section">
            <h3>Guidance</h3>
            <label className="flex items-center justify-between py-2 app-text-secondary">
              <span>Show tips in workspace</span>
              <input
                type="checkbox"
                checked={preferences.showTips}
                onChange={() => togglePreference("showTips")}
              />
            </label>
          </div>
        </div>

        <div className="help-modal-footer gap-2">
          <button className="help-modal-action-btn" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
