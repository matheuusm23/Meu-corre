
import React, { useState, useMemo } from 'react';
import { GoalSettings, Transaction, FixedExpense } from '../types';
import { formatCurrency, getBillingPeriodRange, parseDateLocal, getFixedExpensesForPeriod, getISODate } from '../utils';
// Fixed: Added missing Info icon import from Icons component
import { Target, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, Menu, Calendar, Clock, AlertCircle, Info } from './Icons';

interface GoalsProps {
  goalSettings: GoalSettings;
  transactions: Transaction[];
  onUpdateSettings: (settings: GoalSettings) => void;
  fixedExpenses: FixedExpense[];
  onOpenMenu: () => void;
}

export const Goals: React.FC<GoalsProps> = ({ goalSettings, transactions, onUpdateSettings, fixedExpenses, onOpenMenu }) => {
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

  // Total feito (ganhos manuais) no ciclo atual
  const incomeTotal = useMemo(() => 
    currentPeriodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
  [currentPeriodTransactions]);

  // Meta de contas fixas: Total de despesas fixas menos os ganhos fixos
  const netFixedGoal = useMemo(() => {
    const relevantFixed = getFixedExpensesForPeriod(fixedExpenses, startDate, endDate);
    const expenses = relevantFixed.filter(e => e.type === 'expense').reduce((acc, e) => acc + e.amount, 0);
    const incomes = relevantFixed.filter(e => e.type === 'income').reduce((acc, e) => acc + e.amount, 0);
    // O valor que o trabalho manual precisa cobrir é o que sobra das dívidas após os ganhos fixos
    return Math.max(0, expenses - incomes);
  }, [fixedExpenses, startDate, endDate]);

  const remainingToGoal = Math.max(0, netFixedGoal - incomeTotal);
  const progressPercent = netFixedGoal > 0 ? Math.min(100, (incomeTotal / netFixedGoal) * 100) : 0;

  // Calendário do ciclo
  const daysInCycle = useMemo(() => {
    const days = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const workDays = goalSettings.workDays || [];

  const toggleWorkDay = (dateStr: string) => {
    let newWorkDays = [...workDays];
    if (newWorkDays.includes(dateStr)) {
      newWorkDays = newWorkDays.filter(d => d !== dateStr);
    } else {
      newWorkDays.push(dateStr);
    }
    onUpdateSettings({ ...goalSettings, workDays: newWorkDays });
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const currentCycleWorkDays = useMemo(() => {
    return daysInCycle.filter(d => workDays.includes(getISODate(d)));
  }, [daysInCycle, workDays]);

  const dailyTargetNeeded = useMemo(() => {
    if (currentCycleWorkDays.length === 0) return 0;
    return netFixedGoal / currentCycleWorkDays.length;
  }, [netFixedGoal, currentCycleWorkDays]);

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Target size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none dark:text-white">Trabalho</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Metas e Escala</p>
          </div>
        </div>
        <button onClick={onOpenMenu} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
          <Menu size={22} />
        </button>
      </header>

      {/* Resumo Financeiro da Meta de Contas Fixas */}
      <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Já Feito</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">{formatCurrency(incomeTotal)}</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Meta Líquida</p>
            <p className="text-lg font-black text-blue-400 tracking-tighter">{formatCurrency(netFixedGoal)}</p>
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
              {progressPercent < 100 ? `Faltam ${formatCurrency(remainingToGoal)}` : 'Meta Batida! 🚀'}
            </span>
            <span className="text-[9px] font-black text-white uppercase tracking-widest">{Math.round(progressPercent)}%</span>
          </div>
        </div>
      </div>

      {/* Cálculo da Diária Baseada na Escala */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <BarChart3 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sua Diária Necessária</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
              {formatCurrency(dailyTargetNeeded)} / dia
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4">
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Escala Selecionada</p>
            <p className="text-sm font-black text-slate-700 dark:text-slate-300">
              {currentCycleWorkDays.length} dias de trampo no ciclo
            </p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1 text-right">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Falta Pagar</p>
             <p className="text-sm font-black text-blue-600">{formatCurrency(netFixedGoal)}</p>
          </div>
        </div>
      </div>

      {/* Calendário do Ciclo de Faturamento */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" />
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Escala do Ciclo</h3>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1.5 text-slate-400"><ChevronLeft size={18}/></button>
            <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white">
               {new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(startDate)} - {new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(endDate)}
            </p>
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1.5 text-slate-400"><ChevronRight size={18}/></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
           {daysInCycle.map((day) => {
             const dateStr = getISODate(day);
             const isWorking = workDays.includes(dateStr);
             const isToday = getISODate(new Date()) === dateStr;
             
             return (
               <button
                 key={dateStr}
                 onClick={() => toggleWorkDay(dateStr)}
                 className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative border ${
                   isWorking 
                     ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                     : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                 } ${isToday ? 'ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-slate-950 scale-105 z-10' : ''}`}
               >
                 <span className="text-[10px] font-black">{day.getDate()}</span>
                 {isWorking && <div className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />}
               </button>
             );
           })}
        </div>

        <div className="mt-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30">
           <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
           <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
             Selecione os dias que você pretende trabalhar no calendário acima para calcularmos quanto você precisa faturar por dia para pagar o que sobra das suas <span className="font-black text-blue-600">contas fixas</span> após descontar seus ganhos fixos.
           </p>
        </div>
      </div>
    </div>
  );
};
