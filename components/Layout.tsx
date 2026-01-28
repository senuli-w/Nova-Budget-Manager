import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Calendar, PieChart, LogOut, Plus, Menu, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { TransactionModal } from './TransactionModal';
import clsx from 'clsx';

export const Layout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', path: '/accounts', icon: Wallet },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { name: 'Budgets', path: '/budgets', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Dark Theme */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 text-slate-300">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-tight">Nova<span className="text-brand-500">.</span></h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">Budget Manager</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                  isActive
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-900/50"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => setTransactionModalOpen(true)}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-lg shadow-brand-900/20 transition-all mb-4"
            >
              <Plus size={20} />
              <span className="text-sm">Add Transaction</span>
            </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header - Dark Theme */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 flex justify-between items-center text-white">
        <h1 className="text-xl font-bold">Nova<span className="text-brand-500">.</span></h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-300">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-slate-900 pt-20 px-4 animate-in slide-in-from-top-10 fade-in duration-200">
           <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-medium",
                    isActive ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                  )
                }
              >
                <item.icon size={24} />
                {item.name}
              </NavLink>
            ))}
             <button
              onClick={() => {
                  setTransactionModalOpen(true);
                  setIsMobileMenuOpen(false);
              }}
              className="w-full mt-6 bg-brand-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-xl shadow-brand-900/50"
            >
              <Plus size={24} />
              Add Transaction
            </button>
            <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 text-red-400 py-4 font-medium"
            >
                <LogOut size={20} />
                Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative bg-slate-50/50">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-30 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-brand-600" : "text-slate-400"
              )
            }
          >
            <item.icon size={24} strokeWidth={item.path === location.pathname ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
         <button
            onClick={() => setTransactionModalOpen(true)}
            className="absolute -top-6 left-1/2 -translate-x-1/2 bg-brand-600 text-white p-4 rounded-full shadow-xl shadow-brand-500/40 hover:scale-105 transition-transform"
         >
            <Plus size={24} />
         </button>
      </div>

      <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)} />
    </div>
  );
};