import React from 'react'
import { Link } from 'react-router-dom'

const NoPages = () => {
  return (
    <div className="min-h-screen app-surface app-text-primary flex items-center justify-center p-6">
      <div className="app-panel border app-border rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="app-text-secondary mb-5">The page you requested does not exist.</p>
        <Link to="/" className="sp-gradient-btn text-white px-4 py-2 rounded-md">
          Go Home
        </Link>
      </div>
    </div>
  )
}

export default NoPages