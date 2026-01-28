import React, { useEffect, useState } from 'react';
import { auth, db, saveBudget, deleteBudget } from '../services/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Transaction, TransactionType, CategoryType, CategoryColors, CategoryIcons } from '../types';
import { Plus, Trash2, X, Target } from 'lucide-react';
import { clsx } from 'clsx';

// Interface matching Firestore document
interface BudgetDoc {
  id: string;
  category: string;
  limit: number;
}

export const Budgets: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>(CategoryType.FOOD);
  const [amountLimit, setAmountLimit] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Fetch Transactions
    const txnQuery = query(collection(db, 'users', auth.currentUser.uid, 'transactions'));
    const unsubTxn = onSnapshot(txnQuery, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });

    // Fetch Budgets
    const budgetQuery = query(collection(db, 'users', auth.currentUser.uid, 'budgets'), orderBy('createdAt', 'desc'));
    const unsubBudget = onSnapshot(budgetQuery, (snap) => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as BudgetDoc)));
    });

    return () => { unsubTxn(); unsubBudget(); };
  }, []);

  const currentMonth = new Date().getMonth();
  const currentMonthTransactions = transactions.filter(t => 
    new Date(t.date).getMonth() === currentMonth && t.type === TransactionType.EXPENSE
  );

  const calculateSpent = (category: string) => {
    return currentMonthTransactions
      .filter(t => t.category === category)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !amountLimit) return;
    
    try {
      await saveBudget(auth.currentUser.uid, {
        category: selectedCategory,
        limit: parseFloat(amountLimit)
      });
      setIsModalOpen(false);
      setAmountLimit('');
      setSelectedCategory(CategoryType.FOOD);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if(!auth.currentUser || !window.confirm("Remove this budget?")) return;
    await deleteBudget(auth.currentUser.uid, id);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Monthly Budgets</h1>
            <p className="text-slate-500">Track your spending against your limits.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={18} /> Set Budget
        </button>
      </div>

      <div className="grid gap-6">
        {budgets.length === 0 ? (
             <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                     <Target size={32} />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800">No Budgets Set</h3>
                 <p className="text-slate-500 mb-6 max-w-xs">Create a budget to keep your spending on track for specific categories.</p>
                 <button onClick={() => setIsModalOpen(true)} className="text-brand-600 font-bold hover:text-brand-700">Create your first budget</button>
             </div>
        ) : (
            budgets.map((budget) => {
            const spent = calculateSpent(budget.category);
            const percentage = Math.min((spent / budget.limit) * 100, 100);
            const isOverBudget = spent > budget.limit;
            const color = CategoryColors[budget.category as CategoryType] || '#cbd5e1';
            const Icon = CategoryIcons[budget.category as CategoryType] || CategoryIcons[CategoryType.OTHER];

            return (
                <div key={budget.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm group relative">
                    <button 
                        onClick={() => handleDeleteBudget(budget.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 size={18} />
                    </button>
                <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg" style={{ backgroundColor: color }}>
                        <Icon size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{budget.category}</h3>
                        <p className="text-xs text-slate-400">Monthly Limit: Rs. {budget.limit.toLocaleString()}</p>
                    </div>
                    </div>
                    <div className="text-right">
                    <span className={`text-xl font-bold ${isOverBudget ? 'text-red-500' : 'text-slate-800'}`}>
                        Rs. {spent.toLocaleString()}
                    </span>
                    <p className="text-xs text-slate-400">spent</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mt-4">
                    <div 
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : ''}`}
                    style={{ 
                        width: `${percentage}%`,
                        backgroundColor: isOverBudget ? undefined : color
                    }}
                    ></div>
                </div>
                
                <div className="flex justify-between mt-2 text-xs font-medium text-slate-500">
                    <span>0%</span>
                    <span className={isOverBudget ? 'text-red-500 font-bold' : ''}>{percentage.toFixed(0)}%</span>
                </div>
                </div>
            );
            })
        )}
      </div>

       {/* Create Budget Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-800">Set New Budget</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                    {Object.values(CategoryType).filter(c => c !== CategoryType.TRANSFER).map(cat => {
                         const Icon = CategoryIcons[cat] || CategoryIcons[CategoryType.OTHER];
                         const isSelected = selectedCategory === cat;
                         return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={clsx(
                                    "flex flex-col items-center p-2 rounded-xl border transition-all gap-1",
                                    isSelected ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" : "border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <Icon size={20} className={isSelected ? "text-brand-600" : "text-slate-400"} />
                                <span className={clsx("text-[10px] font-medium truncate w-full text-center", isSelected ? "text-brand-700" : "text-slate-500")}>{cat}</span>
                            </button>
                         )
                    })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                    <input 
                    type="number" 
                    required 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-800" 
                    placeholder="5000"
                    value={amountLimit}
                    onChange={e => setAmountLimit(e.target.value)}
                    />
                </div>
              </div>
              
              <button type="submit" className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold shadow-lg shadow-brand-500/20 mt-2">
                  Save Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};