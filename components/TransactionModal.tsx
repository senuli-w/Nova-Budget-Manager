import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle, Check } from 'lucide-react';
import { TransactionType, CategoryType, Account, CategoryIcons, CategoryColors } from '../types';
import { auth, db, addTransaction } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import clsx from 'clsx';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CategoryType.FOOD);
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [applyServiceFee, setApplyServiceFee] = useState(false);
  const [serviceFee, setServiceFee] = useState('25');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'accounts'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amount || !accountId) return;

    setLoading(true);
    try {
      await addTransaction(auth.currentUser.uid, {
        amount: parseFloat(amount),
        type,
        category: type === TransactionType.TRANSFER ? CategoryType.TRANSFER : category,
        accountId,
        toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
        description,
        date: new Date(date).getTime(),
        serviceFee: applyServiceFee && type === TransactionType.TRANSFER ? parseFloat(serviceFee) : 0
      });
      onClose();
      // Reset form
      setAmount('');
      setDescription('');
      setCategory(CategoryType.FOOD);
    } catch (error) {
      console.error(error);
      alert("Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">New Transaction</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <form id="txnForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              {[
                { t: TransactionType.EXPENSE, label: 'Expense', icon: ArrowUpCircle },
                { t: TransactionType.INCOME, label: 'Income', icon: ArrowDownCircle },
                { t: TransactionType.TRANSFER, label: 'Transfer', icon: ArrowRightLeft }
              ].map((opt) => (
                <button
                  key={opt.t}
                  type="button"
                  onClick={() => setType(opt.t)}
                  className={clsx(
                    "flex flex-col items-center justify-center py-2 rounded-lg text-sm font-medium transition-all",
                    type === opt.t 
                      ? "bg-white text-brand-600 shadow-sm ring-1 ring-slate-200" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                >
                  <opt.icon size={18} className="mb-1" />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all font-mono font-medium"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>

            {type !== TransactionType.TRANSFER && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {Object.values(CategoryType).filter(c => c !== CategoryType.TRANSFER).map((cat) => {
                    const Icon = CategoryIcons[cat] || CategoryIcons[CategoryType.OTHER];
                    const color = CategoryColors[cat];
                    const isSelected = category === cat;
                    
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={clsx(
                          "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1",
                          isSelected
                            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                            : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        <div 
                          className={clsx("w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-transform", isSelected ? "scale-110" : "")} 
                          style={{ backgroundColor: color }}
                        >
                            <Icon size={16} />
                        </div>
                        <span className={clsx("text-[9px] font-semibold truncate w-full text-center", isSelected ? "text-brand-700" : "text-slate-500")}>
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {type === TransactionType.TRANSFER ? 'From Account' : 'Account'}
                </label>
                <select
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white"
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Rs. {acc.balance})</option>
                  ))}
                </select>
              </div>

              {type === TransactionType.TRANSFER && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Account</label>
                  <select
                    required
                    value={toAccountId}
                    onChange={(e) => setToAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(a => a.id !== accountId).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (Rs. {acc.balance})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Transfer Service Fee Logic */}
            {type === TransactionType.TRANSFER && (
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-purple-900 cursor-pointer select-none">
                      <div className={clsx("w-5 h-5 rounded border flex items-center justify-center transition-colors", applyServiceFee ? "bg-purple-600 border-purple-600" : "bg-white border-slate-300")}>
                        {applyServiceFee && <Check size={14} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={applyServiceFee} onChange={(e) => setApplyServiceFee(e.target.checked)} />
                      Apply Service Charge
                  </label>
                </div>
                
                {applyServiceFee && (
                  <div className="mt-2 animate-in slide-in-from-top-2 fade-in">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold">Rs.</span>
                        <input 
                          type="number" 
                          value={serviceFee}
                          onChange={(e) => setServiceFee(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-purple-200 focus:border-purple-500 outline-none text-purple-900 font-bold"
                        />
                      </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition-all"
                placeholder="What was this for?"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
           <button
            type="submit"
            form="txnForm"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span> : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};