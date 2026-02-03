
import React, { useState, useMemo } from 'react';
import { GoalSettings, Transaction, FixedExpense } from '../types';
import { formatCurrency, getBillingPeriodRange, parseDateLocal } from '../utils';
import { Target, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3 } from './Icons';

interface GoalsProps {
  goalSettings: GoalSettings;
  transactions: Transaction[];
  onUpdateSettings: (settings: GoalSettings) => void;
  fixedExpenses: FixedExpense[];
  onOpenMenu: () => void;
}

export const Goals: React.FC<GoalsProps> = ({ goalSettings, transactions, onUpdateSettings, fixedExpenses }) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  const { startDate, endDate } = useMemo(() => 
    getBillingPeriodRange(viewDate, goalSettings.startDayOfMonth, goalSettings.endDayOfMonth), 
  [viewDate, goalSettings.startDayOfMonth, goalSettings.endDayOfMonth]);

  const currentPeriodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseDateLocal(t.date);
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  const incomeTotal = useMemo(() => 
    currentPeriodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
  [currentPeriodTransactions]);

  const expenseTotal = useMemo(() => 
    currentPeriodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
  [currentPeriodTransactions]);

  const currentGoal = 3000; // Exemplo

  return (
    <div className="flex flex-col gap-8 px-5 pt-10">
      <header className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
          <Target size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter leading-none dark:text-white">Metas do Corre</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estratégia de Trabalho</p>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-8">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all"><ChevronLeft size={20}/></button>
          <div className="text-center">
             <p className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
               {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate)}
             </p>
          </div>
          <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all"><ChevronRight size={20}/></button>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800/30">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest mb-1.5">Total Faturado</p>
                <p className="text-4xl font-black text-blue-600 tracking-tighter leading-none">{formatCurrency(incomeTotal)}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <TrendingUp size={28} />
              </div>
            </div>
            
            <div className="w-full bg-blue-100 dark:bg-blue-900/30 h-4 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (incomeTotal / currentGoal) * 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-3 px-1">
              <span className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest">Meta: {formatCurrency(currentGoal)}</span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{Math.round((incomeTotal / currentGoal) * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gastos no Período</p>
              <div className="flex items-center justify-center gap-2">
                <TrendingDown size={14} className="text-rose-500" />
                <p className="text-lg font-black text-rose-500 tracking-tighter">{formatCurrency(expenseTotal)}</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Lucro Limpo</p>
              <div className="flex items-center justify-center gap-2">
                <BarChart3 size={14} className="text-emerald-600" />
                <p className="text-lg font-black text-emerald-600 tracking-tighter">{formatCurrency(incomeTotal - expenseTotal)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
