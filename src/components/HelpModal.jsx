import React from 'react'
import '../styles/HelpModal.css'

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2 className="help-modal-title">📖 Help & Support</h2>
          <button
            className="help-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="help-modal-body">
          <div className="help-section">
            <h3>Getting Started</h3>
            <p>
              Welcome to <strong>GenUI</strong>! This is an AI-powered component generator that helps you create beautiful, responsive UI components in seconds.
            </p>
          </div>

          <div className="help-section">
            <h3>How to Use</h3>
            <ol>
              <li>Select your preferred framework (HTML + CSS, Tailwind, Bootstrap, etc.)</li>
              <li>Describe the component you want to create</li>
              <li>Click "Generate" to let AI create the code for you</li>
              <li>Preview, copy, or export your generated code</li>
            </ol>
          </div>

          <div className="help-section">
            <h3>Features</h3>
            <ul>
              <li>✨ AI-powered code generation using Google Gemini</li>
              <li>📱 Support for multiple frameworks (HTML, CSS, Tailwind, Bootstrap)</li>
              <li>🎨 Dark mode support</li>
              <li>💾 History tracking of generated components</li>
              <li>📋 Click to copy generated code</li>
              <li>👁️ Live code preview</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li><code>Ctrl/Cmd + Enter</code> - Generate component</li>
              <li><code>Escape</code> - Close modals</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>Tips & Tricks</h3>
            <ul>
              <li>Be specific in your component description for better results</li>
              <li>Use the recent history to quickly regenerate similar components</li>
              <li>Combine frameworks for more flexibility (e.g., Tailwind + Bootstrap)</li>
              <li>Always review generated code before using in production</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>Troubleshooting</h3>
            <p>
              If you encounter any issues:
            </p>
            <ul>
              <li>Check your internet connection</li>
              <li>Clear your browser cache</li>
              <li>Try a different framework option</li>
              <li>Report issues to the support team</li>
            </ul>
          </div>

          <div className="help-section">
            <h3>Support</h3>
            <p>
              For more help, visit our documentation or contact support at{' '}
              <strong>support@genui.dev</strong>
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href="mailto:support@genui.dev?subject=GenUI%20Support"
                className="help-modal-btn"
              >
                Email Support
              </a>
              <a
                href="https://supabase.com/docs"
                target="_blank"
                rel="noreferrer"
                className="help-modal-btn"
              >
                Open Docs
              </a>
            </div>
          </div>
        </div>

        <div className="help-modal-footer">
          <button
            className="help-modal-action-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
