import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Transaction, Account, TransactionType, CategoryColors, CategoryType, CategoryIcons } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, IndianRupee, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to Accounts
    const acq = query(collection(db, 'users', auth.currentUser.uid, 'accounts'));
    const unsubAcc = onSnapshot(acq, (snap) => {
      setAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Account)));
    });

    // Listen to Recent Transactions (Fetch more to populate charts properly)
    const trq = query(collection(db, 'users', auth.currentUser.uid, 'transactions'), orderBy('date', 'desc'), limit(100));
    const unsubTr = onSnapshot(trq, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });

    return () => { unsubAcc(); unsubTr(); };
  }, []);

  // Metrics
  const netWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  // Chart Data: Spend by Category
  const expenseByCategory = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      const cat = t.category as CategoryType;
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expenseByCategory).map(key => ({
    name: key,
    value: expenseByCategory[key],
    color: CategoryColors[key as CategoryType] || '#cbd5e1'
  }));

  // Chart Data: Daily Trend (Income vs Expense)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const trendData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayTrans = monthlyTransactions.filter(t => new Date(t.date).getDate() === day);
    return {
        day: day.toString(),
        income: dayTrans.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0),
        expense: dayTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0),
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Financial Overview</h1>
        <p className="text-slate-500">Welcome back, here's what's happening today.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Net Worth - Rich Gradient */}
        <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
          <div className="relative z-10">
            <p className="text-brand-100 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-300"></span>
                Total Net Worth
            </p>
            <h2 className="text-4xl font-bold flex items-center tracking-tight">
              <span className="text-2xl mr-1 opacity-80">Rs.</span>
              {netWorth.toLocaleString()}
            </h2>
            <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-brand-50">
                <span>+2.5%</span>
                <span className="opacity-70">from last month</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
             <IndianRupee size={160} />
          </div>
        </div>

        {/* Income Card - Emerald Theme */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly Income</p>
              <h3 className="text-2xl font-bold text-slate-800">Rs. {monthlyIncome.toLocaleString()}</h3>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Target</span>
                  <span className="text-emerald-600 font-medium">85%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-full rounded-full"></div>
              </div>
          </div>
        </div>

        {/* Expense Card - Rose Theme */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly Spend</p>
              <h3 className="text-2xl font-bold text-slate-800">Rs. {monthlyExpense.toLocaleString()}</h3>
            </div>
            <div className="bg-accent-50 p-2.5 rounded-xl text-accent-500">
              <TrendingDown size={22} />
            </div>
          </div>
          <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Budget Used</span>
                  <span className="text-accent-600 font-medium">
                    {Math.min(Math.round((monthlyExpense / (monthlyIncome || 1)) * 100), 100)}%
                  </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-accent-500 to-orange-400" style={{ width: `${Math.min((monthlyExpense / (monthlyIncome || 1)) * 100, 100)}%` }}></div>
              </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart - New Addition */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={18} className="text-brand-500" />
                        Monthly Activity
                    </h3>
                    <p className="text-xs text-slate-400">Daily income vs expense comparison</p>
                </div>
            </div>
            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(v) => `${v/1000}k`} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`Rs. ${value}`, '']}
                        />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Expense Breakdown Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4">Expense Breakdown</h3>
          <div className="flex-1 min-h-[250px]">
            {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={pieData}
                   innerRadius={65}
                   outerRadius={85}
                   paddingAngle={4}
                   dataKey="value"
                 >
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                   ))}
                 </Pie>
                 <Tooltip 
                    formatter={(value: number) => `Rs. ${value}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 />
               </PieChart>
             </ResponsiveContainer>
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                   <div className="w-24 h-24 rounded-full border-4 border-slate-100 mb-3 border-t-slate-200"></div>
                   <p>No expenses data yet</p>
               </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.slice(0, 4).map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="truncate font-medium">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions List - Moved to bottom */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button className="text-sm text-brand-600 font-semibold hover:text-brand-700">View All</button>
          </div>
          <div className="overflow-y-auto max-h-[300px]">
            {transactions.length === 0 ? (
               <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-3">
                        <IndianRupee size={24} className="text-slate-300" />
                    </div>
                   <p>No transactions found.</p>
                   <button className="mt-2 text-brand-600 font-medium text-sm">Add your first transaction</button>
               </div>
            ) : (
              transactions.map((t) => {
                const Icon = CategoryIcons[t.category as CategoryType] || CategoryIcons[CategoryType.OTHER];
                return (
                  <div key={t.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-default">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                          style={{ backgroundColor: CategoryColors[t.category as CategoryType] || '#94a3b8' }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-700 transition-colors">{t.description || t.category}</p>
                        <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={`font-bold ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
    </div>
  );
};