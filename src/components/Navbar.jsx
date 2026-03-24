import React, { useState, useContext, useEffect, useRef } from 'react'
import { HiSun, HiMoon } from 'react-icons/hi'
import { HiX } from 'react-icons/hi'
import { FaUser } from 'react-icons/fa'
import { RiSettings3Fill } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import LogoutButton from './LogoutButton'
import HelpModal from './HelpModal'
import PreferencesModal from './PreferencesModal'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const Navbar = () => {
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const { user } = useContext(AuthContext)
  const { isDark, toggleTheme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const profileRef = useRef(null)
  const settingsRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }

      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowProfile(false)
        setShowSettings(false)
        setShowHelp(false)
        setShowPreferences(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <>
      <div className="nav app-panel app-border flex items-center justify-between px-[100px] h-[90px] border-b-[1px]">
        <div className="logo">
          <h3 className='text-[25px] front[700] sp-text'>GenUI</h3>
        </div>
        <div className="icons flex items-center gap-[15px]">
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="icon"
          >
            {isDark ? <HiSun /> : <HiMoon />}
          </button>
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              aria-label={showProfile ? 'Close profile menu' : 'Open profile menu'}
              aria-expanded={showProfile}
              onClick={() => {
                setShowProfile(!showProfile)
                setShowSettings(false)
              }}
              className="icon"
            >
              {showProfile ? <HiX /> : <FaUser />}
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 app-panel border app-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b app-border">
                  <p className="app-text-primary font-semibold text-sm">{user?.name || 'User'}</p>
                  <p className="app-text-secondary text-xs">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile')
                    setShowProfile(false)
                  }}
                  className="w-full text-left px-4 py-2 app-text-primary app-hover transition"
                >
                  View Profile
                </button>
                <button
                  onClick={() => {
                    navigate('/account-settings')
                    setShowProfile(false)
                  }}
                  className="w-full text-left px-4 py-2 app-text-primary app-hover transition"
                >
                  Account Settings
                </button>
              </div>
            )}
          </div>
          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              aria-label={showSettings ? 'Close settings menu' : 'Open settings menu'}
              aria-expanded={showSettings}
              onClick={() => {
                setShowSettings(!showSettings)
                setShowProfile(false)
              }}
              className="icon"
            >
              {showSettings ? <HiX /> : <RiSettings3Fill />}
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-56 app-panel border app-border rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowPreferences(true)
                    setShowSettings(false)
                  }}
                  className="w-full text-left px-4 py-3 app-text-primary app-hover transition border-b app-border"
                >
                  ⚙️ Preferences
                </button>
                <button 
                  onClick={() => {
                    setShowHelp(true)
                    setShowSettings(false)
                  }}
                  className="w-full text-left px-4 py-3 app-text-primary app-hover transition"
                >
                  📖 Help & Support
                </button>
              </div>
            )}
          </div>
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
          {showPreferences && (
            <PreferencesModal isOpen={showPreferences} onClose={() => setShowPreferences(false)} />
          )}
          <LogoutButton />
        </div>
        
      </div>

    </>
  )
}

export default Navbar