
import React, { useMemo, useState } from 'react';
import { GoalSettings } from '../types';
import { Card } from './ui/Card';
import { getISODate, formatCurrency } from '../utils';
import { PieChart, TrendingUp, ChevronLeft, ChevronRight, CheckCircle2, Info, X, Plus, TrendingDown, Target, Menu } from './Icons';

interface YearlyGoalsProps {
  goalSettings: GoalSettings;
  onUpdateSettings: (settings: GoalSettings) => void;
  onOpenMenu: () => void;
}

export const YearlyGoals: React.FC<YearlyGoalsProps> = ({ goalSettings, onUpdateSettings, onOpenMenu }) => {
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [editingDay, setEditingDay] = useState<{ date: Date; dateStr: string } | null>(null);
  
  const [isGoalSaved, setIsGoalSaved] = useState(false);
  const [tempExtra, setTempExtra] = useState('');
  const [tempWithdrawal, setTempWithdrawal] = useState('');

  const daysInMonth = (month: number) => new Date(currentYear, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number) => new Date(currentYear, month, 1).getDay();

  const savingsDates = goalSettings.savingsDates || [];
  const savingsAdjustments = (goalSettings.savingsAdjustments as Record<string, number>) || {};
  const savingsWithdrawals = (goalSettings.savingsWithdrawals as Record<string, number>) || {};

  const handleOpenEdit = (date: Date, dateStr: string) => {
    const isSaved = savingsDates.includes(dateStr);
    const currentExtra = savingsAdjustments[dateStr] || 0;
    const currentWithdrawal = savingsWithdrawals[dateStr] || 0;
    
    setIsGoalSaved(isSaved);
    setTempExtra(currentExtra > 0 ? currentExtra.toString() : '');
    setTempWithdrawal(currentWithdrawal > 0 ? currentWithdrawal.toString() : '');
    setEditingDay({ date, dateStr });
  };

  const handleSaveDay = () => {
    if (!editingDay) return;
    const { dateStr } = editingDay;
    
    let newSavingsDates = [...savingsDates];
    if (isGoalSaved && !newSavingsDates.includes(dateStr)) {
      newSavingsDates.push(dateStr);
    } else if (!isGoalSaved && newSavingsDates.includes(dateStr)) {
      newSavingsDates = newSavingsDates.filter(d => d !== dateStr);
    }

    const extraVal = parseFloat(tempExtra) || 0;
    const newAdjustments = { ...savingsAdjustments };
    if (extraVal > 0) newAdjustments[dateStr] = extraVal; 
    else delete newAdjustments[dateStr];

    const withdrawalVal = parseFloat(tempWithdrawal) || 0;
    const newWithdrawals = { ...savingsWithdrawals };
    if (withdrawalVal > 0) newWithdrawals[dateStr] = withdrawalVal; 
    else delete newWithdrawals[dateStr];

    onUpdateSettings({ 
      ...goalSettings, 
      savingsDates: newSavingsDates,
      savingsAdjustments: newAdjustments, 
      savingsWithdrawals: newWithdrawals 
    });
    
    setEditingDay(null);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const stats = useMemo(() => {
    const baseSaved = savingsDates.length * goalSettings.dailySavingTarget;
    const totalAdjustments = Object.values(savingsAdjustments).reduce((acc, v) => acc + Number(v), 0);
    const totalWithdrawals = Object.values(savingsWithdrawals).reduce((acc, v) => acc + Number(v), 0);
    const totalSaved = baseSaved + totalAdjustments - totalWithdrawals;
    
    const today = new Date();
    const endOfYear = new Date(currentYear, 11, 31);
    const remainingDays = Math.max(0, Math.ceil((endOfYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    return { 
      totalSaved, 
      totalWithdrawals, 
      projectedFinal: totalSaved + (remainingDays * goalSettings.dailySavingTarget) 
    };
  }, [savingsDates, goalSettings.dailySavingTarget, savingsAdjustments, savingsWithdrawals, currentYear]);

  const renderCalendar = (monthIdx: number) => {
    const days = [];
    const totalDays = daysInMonth(monthIdx);
    const startOffset = firstDayOfMonth(monthIdx);
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="w-full aspect-square" />);
    }
    
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(currentYear, monthIdx, d);
      const dateStr = getISODate(date);
      const isMarked = savingsDates.includes(dateStr);
      const extra = savingsAdjustments[dateStr] || 0;
      const withdrawal = savingsWithdrawals[dateStr] || 0;
      const isToday = dateStr === getISODate(new Date());

      days.push(
        <button 
          key={d} 
          onClick={() => handleOpenEdit(date, dateStr)} 
          className={`relative w-full aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-black transition-all border ${
            isMarked ? 'bg-amber-500 border-amber-400 dark:border-transparent text-white shadow-md' : 
            extra > 0 ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 shadow-sm' :
            withdrawal > 0 ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 shadow-sm' :
            'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 dark:text-slate-400'
          } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 scale-105 z-10' : ''}`}
        >
          {d}
          {(extra > 0 || withdrawal > 0 || isMarked) && (
            <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isMarked ? 'bg-white' : (extra > 0 ? 'bg-blue-400' : 'bg-rose-400')}`} />
          )}
        </button>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col gap-3 pb-28 pt-4">
      <header className="px-2 mb-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Reserva Ano</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Segurança financeira</p>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      <div className="px-2">
         <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-4 rounded-[1.75rem] border border-amber-400 dark:border-transparent shadow-xl">
            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] block mb-2">Meta Diária de Reserva</span>
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center text-white"><Target size={18}/></div>
               <div className="flex-1 flex items-baseline gap-1">
                 <span className="text-white text-sm font-black opacity-50">R$</span>
                 <input 
                    type="number" 
                    value={goalSettings.dailySavingTarget || ''} 
                    onChange={(e) => onUpdateSettings({ ...goalSettings, dailySavingTarget: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    className="bg-transparent text-2xl font-black text-white focus:outline-none w-full placeholder:text-white/30 tracking-tighter"
                  />
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-2">
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Guardado</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block tracking-tighter">{formatCurrency(stats.totalSaved)}</span>
         </div>
         <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Projeção Dez</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 block tracking-tighter">{formatCurrency(stats.projectedFinal)}</span>
         </div>
      </div>

      <div className="px-2">
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-4">
               <button onClick={() => setSelectedMonth(p => Math.max(0, p-1))} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 active:scale-90 transition-all"><ChevronLeft size={16}/></button>
               <div className="text-center">
                  <p className="text-[11px] font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][selectedMonth]} {currentYear}
                  </p>
               </div>
               <button onClick={() => setSelectedMonth(p => Math.min(11, p+1))} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 active:scale-90 transition-all"><ChevronRight size={16}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
               {['D','S','T','Q','Q','S','S'].map((d, i) => <div key={i} className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
               {renderCalendar(selectedMonth)}
            </div>
         </div>
      </div>

      {editingDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setEditingDay(null)} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-sm p-6 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ajuste de Reserva</p>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                     {editingDay.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                   </h3>
                 </div>
                 <button onClick={() => setEditingDay(null)} className="p-2 text-slate-400"><X size={20}/></button>
              </div>

              <div className="space-y-5">
                 <button 
                   onClick={() => setIsGoalSaved(!isGoalSaved)}
                   className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${isGoalSaved ? 'bg-amber-500 border-amber-400 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400'}`}
                 >
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isGoalSaved ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          <CheckCircle2 size={18} />
                       </div>
                       <div className="text-left">
                          <p className={`text-[10px] font-black uppercase tracking-tight ${isGoalSaved ? 'text-white/70' : 'text-slate-400'}`}>Guardei a Meta</p>
                          <p className="text-sm font-black leading-none">{formatCurrency(goalSettings.dailySavingTarget)}</p>
                       </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${isGoalSaved ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600'}`}>
                       <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isGoalSaved ? 'left-6' : 'left-1'}`} />
                    </div>
                 </button>

                 <div className="h-[1px] bg-slate-100 dark:bg-slate-800 w-full" />

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                       <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1 flex items-center gap-1"><Plus size={10}/> Extra</span>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300 font-black text-xs">R$</span>
                          <input 
                            type="number" 
                            value={tempExtra} 
                            onChange={e => setTempExtra(e.target.value)} 
                            placeholder="0,00" 
                            className="w-full bg-blue-50 dark:bg-blue-900/10 p-3 pl-8 rounded-xl font-black text-sm focus:outline-none dark:text-white border border-blue-100 dark:border-blue-900/30" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest px-1 flex items-center gap-1"><TrendingDown size={10}/> Retirada</span>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300 font-black text-xs">R$</span>
                          <input 
                            type="number" 
                            value={tempWithdrawal} 
                            onChange={e => setTempWithdrawal(e.target.value)} 
                            placeholder="0,00" 
                            className="w-full bg-rose-50 dark:bg-rose-900/10 p-3 pl-8 rounded-xl font-black text-sm focus:outline-none dark:text-white border border-rose-100 dark:border-rose-900/30" 
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total do dia:</span>
                       <span className="text-base font-black text-slate-900 dark:text-white">
                         {formatCurrency(
                           (isGoalSaved ? goalSettings.dailySavingTarget : 0) + 
                           (parseFloat(tempExtra) || 0) - 
                           (parseFloat(tempWithdrawal) || 0)
                         )}
                       </span>
                    </div>
                 </div>

                 <button 
                   onClick={handleSaveDay}
                   className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all"
                 >
                   Salvar Alterações
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
