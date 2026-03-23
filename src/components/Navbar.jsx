import React, { useState, useContext } from 'react'
import { HiSun } from 'react-icons/hi'
import { FaUser } from 'react-icons/fa'
import { RiSettings3Fill } from 'react-icons/ri'
import { MdDarkMode } from 'react-icons/md'
import LogoutButton from './LogoutButton'
import HelpModal from './HelpModal'
import { AuthContext } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const Navbar = () => {
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { user } = useContext(AuthContext)
  const { isDark, toggleTheme } = useContext(ThemeContext)

  return (
    <>
      <div className="nav flex items-center justify-between px-[100px] h-[90px] border-b-[1px] border-gray-800">
        <div className="logo">
          <h3 className='text-[25px] front[700] sp-text'>GenUI</h3>
        </div>
        <div className="icons flex items-center gap-[15px]">
          <div className="icon cursor-pointer hover:bg-[#333] transition"><HiSun /></div>
          <div className="relative">
            <div 
              onClick={() => setShowProfile(!showProfile)}
              className="icon cursor-pointer hover:bg-[#333] transition"
            >
              <FaUser />
            </div>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-[#141319] border border-[#47596b] rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-[#47596b]">
                  <p className="text-white font-semibold text-sm">{user?.name || 'User'}</p>
                  <p className="text-gray-400 text-xs">{user?.email}</p>
                </div>
                <button onClick={() => setShowProfile(false)} className="w-full text-left px-4 py-2 text-white hover:bg-[#17171C] transition">
                  View Profile
                </button>
                <button onClick={() => setShowProfile(false)} className="w-full text-left px-4 py-2 text-white hover:bg-[#17171C] transition">
                  Account Settings
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <div 
              onClick={() => setShowSettings(!showSettings)}
              className="icon cursor-pointer hover:bg-[#333] transition"
            >
              <RiSettings3Fill />
            </div>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-48 bg-[#141319] border border-[#47596b] rounded-lg shadow-lg z-50">
                <button 
                  onClick={() => {
                    toggleTheme()
                    setShowSettings(false)
                  }} 
                  className="w-full text-left px-4 py-3 text-white hover:bg-[#17171C] transition border-b border-[#47596b] flex items-center gap-2"
                >
                  {isDark ? '☀️' : '🌙'} {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={() => setShowSettings(false)} className="w-full text-left px-4 py-3 text-white hover:bg-[#17171C] transition border-b border-[#47596b]">
                  ⚙️ Preferences
                </button>
                <button 
                  onClick={() => {
                    setShowHelp(true)
                    setShowSettings(false)
                  }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-[#17171C] transition"
                >
                  📖 Help & Support
                </button>
              </div>
            )}
          </div>
          <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
          <LogoutButton />
        </div>
        
      </div>

    </>
  )
}

export default Navbar