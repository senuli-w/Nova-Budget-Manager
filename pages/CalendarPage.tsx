import React, { useState, useEffect } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, getDay } from 'date-fns';
import { auth, db } from '../services/firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { Transaction, TransactionType, CategoryType, CategoryIcons, CategoryColors } from '../types';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'transactions'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(all);
    });
    return () => unsub();
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getTransactionsForDay = (day: Date) => {
    return transactions.filter(t => isSameDay(new Date(t.date), day));
  };

  const selectedDayTransactions = selectedDay ? getTransactionsForDay(selectedDay) : [];

  // Padding for grid
  const startDayOfWeek = getDay(startOfMonth(currentDate)); 
  const emptyDays = Array(startDayOfWeek).fill(null);

  return (
    <div className="max-w-6xl mx-auto h-full">
      {/* Calendar Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{format(currentDate, 'MMMM yyyy')}</h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronLeft /></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-full text-slate-600"><ChevronRight /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
           {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
             <div key={d} className="text-center text-sm font-semibold text-slate-400 py-2 uppercase tracking-wider">{d}</div>
           ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {emptyDays.map((_, i) => <div key={`empty-${i}`} className="h-24 md:h-32 bg-slate-50/50 rounded-xl" />)}
          {daysInMonth.map((day) => {
            const dayTrans = getTransactionsForDay(day);
            const total = dayTrans.reduce((acc, t) => {
                if (t.type === TransactionType.EXPENSE) return acc - t.amount;
                if (t.type === TransactionType.INCOME) return acc + t.amount;
                return acc;
            }, 0);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={clsx(
                  "h-24 md:h-32 rounded-xl border flex flex-col justify-between p-3 transition-all hover:shadow-lg hover:-translate-y-1 relative group overflow-hidden",
                  isSameDay(day, new Date()) ? "bg-white border-brand-500 ring-1 ring-brand-500" : "bg-white border-slate-100 hover:border-brand-200"
                )}
              >
                <div className="flex justify-between w-full items-start">
                    <span className={clsx(
                        "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full", 
                        isSameDay(day, new Date()) ? "bg-brand-600 text-white shadow-md shadow-brand-500/30" : "text-slate-600 group-hover:bg-slate-100"
                    )}>
                    {format(day, 'd')}
                    </span>
                    {dayTrans.length > 0 && (
                        <div className="hidden md:flex gap-1">
                             {dayTrans.slice(0, 3).map((t, i) => (
                                <div key={i} className={clsx("w-2 h-2 rounded-full", t.type === TransactionType.EXPENSE ? "bg-accent-400" : "bg-emerald-400")}></div>
                             ))}
                        </div>
                    )}
                </div>

                {dayTrans.length > 0 ? (
                   <div className="text-right w-full">
                      <div className="text-xs font-bold truncate">
                        <span className={total >= 0 ? "text-emerald-600" : "text-accent-600"}>
                           {total > 0 ? '+' : ''}{total.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium hidden md:block">
                          {dayTrans.length} txn{dayTrans.length > 1 ? 's' : ''}
                      </div>
                   </div>
                ) : (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlusIcon className="text-slate-200" />
                    </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Transactions Overlay Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click handler */}
            <div className="absolute inset-0" onClick={() => setSelectedDay(null)}></div>
            
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] relative z-10">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-brand-600">
                             <CalendarIcon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{format(selectedDay, 'EEEE')}</h3>
                            <p className="text-slate-500 text-sm font-medium">{format(selectedDay, 'MMMM do, yyyy')}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-0 overflow-y-auto bg-slate-50/30 flex-1">
                    {selectedDayTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <CalendarIcon size={32} />
                            </div>
                            <p className="text-slate-500 font-medium">No transactions on this day.</p>
                            <p className="text-slate-400 text-sm mt-1">Enjoy your financial peace!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                             {/* Daily Summary Header */}
                             <div className="bg-white p-4 flex justify-between items-center shadow-sm z-10 sticky top-0">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Total</span>
                                <span className={clsx("font-bold text-lg", 
                                    selectedDayTransactions.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0) >= 0 
                                    ? "text-emerald-600" : "text-accent-600"
                                )}>
                                    Rs. {selectedDayTransactions.reduce((acc, t) => t.type === TransactionType.INCOME ? acc + t.amount : acc - t.amount, 0).toLocaleString()}
                                </span>
                             </div>

                            {selectedDayTransactions.map(t => {
                                const Icon = CategoryIcons[t.category as CategoryType] || CategoryIcons[CategoryType.OTHER];
                                return (
                                <div key={t.id} className="flex justify-between items-center p-5 bg-white hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                                            style={{ backgroundColor: CategoryColors[t.category as CategoryType] || '#94a3b8' }}>
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{t.description || t.category}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">{t.type}</span>
                                                <span className="text-xs text-slate-400">{t.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={clsx("font-bold text-base", t.type === TransactionType.INCOME ? "text-emerald-600" : "text-slate-800")}>
                                            {t.type === TransactionType.INCOME ? '+' : '-'} Rs. {t.amount.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {selectedDayTransactions.length > 0 && (
                     <div className="p-4 bg-white border-t border-slate-100 text-center">
                         <p className="text-xs text-slate-400">Showing {selectedDayTransactions.length} transactions</p>
                     </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);