import React from 'react';
import { Menu, Bell, Sun, Moon, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
  pageTitle?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, pageTitle }) => {
  const { user } = useAuth();
  const [dark, setDark] = React.useState(true);

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        {pageTitle && (
          <h1 className="text-sm font-semibold text-white hidden sm:block">{pageTitle}</h1>
        )}
      </div>

      <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 w-64">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Quick search..."
          className="bg-transparent text-sm text-slate-300 placeholder-slate-600 outline-none w-full"
        />
        <span className="text-xs text-slate-600 font-mono bg-slate-800 px-1.5 py-0.5 rounded">⌘K</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sky-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer ml-1">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
