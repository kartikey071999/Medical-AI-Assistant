import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogoIcon, SunIcon, MoonIcon, SparklesIcon } from './Icons';
import { Language } from '../utils/translations';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onNavigate: (view: 'home' | 'symptoms' | 'dashboard' | 'profile' | 'diary' | 'emergency') => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, onNavigate, currentView }) => {
  const { user, login, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
    } catch (e) {
      alert("Login failed. Please try again.");
    }
  };

  const navLinkClass = (view: string) => `
    text-sm font-medium transition-colors cursor-pointer whitespace-nowrap
    ${currentView === view 
      ? 'text-teal-600 dark:text-teal-400 font-bold' 
      : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400'}
  `;

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
    { code: 'ta', label: 'Tamil', flag: '🇮🇳' }
  ];

  return (
    <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer group shrink-0" onClick={() => onNavigate('home')}>
            <div className="bg-teal-500 p-2 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <LogoIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-serif font-bold text-slate-800 dark:text-white tracking-tight hidden sm:block">{t('app_name')}</span>
          </div>
          
          {/* Center Links */}
          <div className="hidden md:flex space-x-6 overflow-x-auto no-scrollbar px-4">
            <button onClick={() => onNavigate('home')} className={navLinkClass('home')}>{t('nav_analyze')}</button>
            <button onClick={() => onNavigate('symptoms')} className={navLinkClass('symptoms')}>{t('nav_symptoms')}</button>
            {user && (
              <>
                 <button onClick={() => onNavigate('diary')} className={navLinkClass('diary')}>{t('nav_diary')}</button>
                 <button onClick={() => onNavigate('dashboard')} className={navLinkClass('dashboard')}>{t('nav_reports')}</button>
              </>
            )}
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <span>{languages.find(l => l.code === language)?.flag}</span>
                <span className="hidden sm:inline">{languages.find(l => l.code === language)?.label}</span>
              </button>

              {langDropdownOpen && (
                <>
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-[100]">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-700
                          ${language === lang.code ? 'text-teal-600 font-bold bg-teal-50 dark:bg-teal-900/20' : 'text-slate-700 dark:text-slate-300'}
                        `}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="fixed inset-0 z-[90]" onClick={() => setLangDropdownOpen(false)}></div>
                </>
              )}
            </div>

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-300"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {!user ? (
              <button 
                onClick={handleLogin}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm"
              >
                <span>{t('nav_signin')}</span>
              </button>
            ) : (
              <div className="relative">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img 
                    src={user.image || `https://ui-avatars.com/api/?name=${user.name}`} 
                    alt={user.name} 
                    className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors"
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { setDropdownOpen(false); onNavigate('profile'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
                    >
                      {t('settings')}
                    </button>
                    <button 
                      onClick={() => { setDropdownOpen(false); onNavigate('emergency'); }}
                      className="w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 flex items-center font-medium"
                    >
                      {t('emergency_info')}
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>
                    <button 
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      {t('nav_signout')}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Backdrop for dropdown */}
            {dropdownOpen && (
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setDropdownOpen(false)}
              ></div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};