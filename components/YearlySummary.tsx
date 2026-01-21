
import React, { useMemo } from 'react';
import { Transaction, ViewMode } from '../types';
import { formatCurrency, parseDateLocal } from '../utils';
import { ChevronLeft, TrendingUp, BarChart3, Menu } from './Icons';

interface YearlySummaryProps {
  transactions: Transaction[];
  onChangeView: (view: ViewMode) => void;
  onOpenMenu: () => void;
}

export const YearlySummary: React.FC<YearlySummaryProps> = ({ 
  transactions, 
  onChangeView,
  onOpenMenu
}) => {
  const currentYear = new Date().getFullYear();

  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      monthName: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(currentYear, i)),
      grossValue: 0,
    }));

    transactions.forEach(t => {
      const tDate = parseDateLocal(t.date);
      if (tDate.getFullYear() === currentYear && t.type === 'income') {
        data[tDate.getMonth()].grossValue += t.amount;
      }
    });

    return data;
  }, [transactions, currentYear]);

  const totalYear = useMemo(() => monthlyData.reduce((acc, m) => acc + m.grossValue, 0), [monthlyData]);

  return (
    <div className="flex flex-col gap-6 pb-28 pt-4">
      <header className="px-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onChangeView('home')}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Faturamento</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{currentYear}</p>
          </div>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Resumo Anual */}
      <div className="px-2">
         <div className="bg-slate-900 dark:bg-white p-6 rounded-[2.5rem] border border-slate-700 dark:border-slate-100 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-white/40 dark:text-slate-400 uppercase tracking-widest">Bruto Anual</p>
               <p className="text-3xl font-black text-white dark:text-slate-900 tracking-tighter">{formatCurrency(totalYear)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
               <TrendingUp size={24} />
            </div>
         </div>
      </div>

      <div className="px-2 space-y-3">
        <div className="flex items-center gap-2 px-3 mb-2">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Meses</h3>
        </div>
        
        <div className="grid gap-2">
          {monthlyData.map((data, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Mês {idx + 1}</p>
                <p className="text-base font-black text-slate-900 dark:text-white capitalize">{data.monthName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-600 tracking-tighter">{formatCurrency(data.grossValue)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
