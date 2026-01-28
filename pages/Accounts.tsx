import React, { useEffect, useState } from 'react';
import { auth, db, createAccount, deleteAccount } from '../services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Account } from '../types';
import { Plus, Trash2, CreditCard, Building, Banknote, Landmark } from 'lucide-react';
import { clsx } from 'clsx';

export const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('Bank');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'accounts'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    return () => unsub();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await createAccount(auth.currentUser.uid, {
        name,
        balance: parseFloat(balance),
        type,
      });
      setIsModalOpen(false);
      setName('');
      setBalance('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!auth.currentUser || !window.confirm("Delete this account?")) return;
    await deleteAccount(auth.currentUser.uid, id);
  };

  const getAccountStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return { icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' };
      case 'savings': return { icon: Building, color: 'text-brand-600', bg: 'bg-brand-50', border: 'hover:border-brand-200' };
      case 'credit': return { icon: CreditCard, color: 'text-accent-600', bg: 'bg-accent-50', border: 'hover:border-accent-200' };
      default: return { icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'hover:border-indigo-200' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Accounts</h1>
          <p className="text-slate-500">Manage your assets and liabilities.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} /> Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const style = getAccountStyles(acc.type);
          const Icon = style.icon;
          return (
            <div key={acc.id} className={clsx(
                "bg-white rounded-2xl border border-slate-100 p-6 shadow-sm transition-all relative group hover:-translate-y-1 hover:shadow-md",
                style.border
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-xl", style.bg, style.color)}>
                  <Icon size={24} />
                </div>
                <button 
                  onClick={() => handleDelete(acc.id)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{acc.type}</h3>
              <p className="font-bold text-slate-800 text-lg mb-4 truncate">{acc.name}</p>
              <div className="flex items-baseline">
                <span className="text-lg text-slate-400 mr-1 font-medium">Rs.</span>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{acc.balance.toLocaleString()}</span>
              </div>
              
              {/* Decorative gradient line at bottom */}
              <div className={clsx("absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity", 
                  style.bg.replace('bg-', 'bg-gradient-to-r from-transparent via-').replace('50', '500').concat(' to-transparent')
              )}></div>
            </div>
          );
        })}
        
        {/* Add Account Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/30 transition-all h-[200px] group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-brand-100 text-slate-400 group-hover:text-brand-600">
             <Plus size={24} />
          </div>
          <span className="font-medium">Create New Account</span>
        </button>
      </div>

      {/* Simple Modal for Add Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4 text-slate-800">Add Account</h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                <input 
                  required 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" 
                  placeholder="e.g. HDFC Main"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none bg-white"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="Bank">Bank Account</option>
                  <option value="Cash">Cash</option>
                  <option value="Savings">Savings</option>
                  <option value="Credit">Credit Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Balance</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                    <input 
                    type="number" 
                    required 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none" 
                    placeholder="0.00"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium shadow-lg shadow-brand-500/20">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};