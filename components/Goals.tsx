
import React, { useState, useMemo } from 'react';
import { GoalSettings, Transaction, FixedExpense } from '../types';
import { formatCurrency, getISODate, getBillingPeriodRange, getFixedExpensesForPeriod, parseDateLocal, isSameDay } from '../utils';
import { Card } from './ui/Card';
import { Target, Calendar as CalIcon, ChevronLeft, ChevronRight, AlertCircle, TrendingUp, TrendingDown, Clock, Info, CheckCircle2, Menu } from './Icons';

interface GoalsProps {
  goalSettings: GoalSettings;
  transactions: Transaction[];
  onUpdateSettings: (settings: GoalSettings) => void;
  fixedExpenses: FixedExpense[];
  onOpenMenu: () => void;
}

export const Goals: React.FC<GoalsProps> = ({ 
  goalSettings, 
  transactions, 
  onUpdateSettings,
  fixedExpenses,
  onOpenMenu
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startDay = goalSettings.startDayOfMonth || 1;
  const endDay = goalSettings.endDayOfMonth;

  const { startDate, endDate } = useMemo(() => 
    getBillingPeriodRange(viewDate, startDay, endDay), 
  [viewDate, startDay, endDay]);

  const { startDate: currentCycleStart, endDate: currentCycleEnd } = useMemo(() => 
    getBillingPeriodRange(today, startDay, endDay), 
  [today, startDay, endDay]);

  const isCurrentCycleView = startDate.getTime() === currentCycleStart.getTime();
  const isFutureView = startDate > currentCycleEnd;

  const relevantFixedItems = useMemo(() => 
    getFixedExpensesForPeriod(fixedExpenses, startDate, endDate),
    [fixedExpenses, startDate, endDate]
  );

  // Déficit Restante: O que falta pagar menos o que falta receber das fixas
  const netBillsGap = useMemo(() => {
    const unpaidExpenses = relevantFixedItems
      .filter(e => e.type === 'expense' && !e.isPaid)
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    const unreceivedIncomes = relevantFixedItems
      .filter(e => e.type === 'income' && !e.isPaid)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return Math.max(0, unpaidExpenses - unreceivedIncomes);
  }, [relevantFixedItems]);

  // Sincronizado com "Saldo Livre" da Dashboard.tsx
  const netWorkProfit = useMemo(() => {
    const currentPeriodTransactions = transactions.filter(t => {
      const tDate = parseDateLocal(t.date);
      return tDate >= startDate && tDate <= endDate;
    });

    const manualBalance = currentPeriodTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const paidFixedExpenses = relevantFixedItems.filter(e => e.type === 'expense' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    const receivedFixedIncomes = relevantFixedItems.filter(e => e.type === 'income' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    
    return manualBalance - paidFixedExpenses + receivedFixedIncomes;
  }, [transactions, relevantFixedItems, startDate, endDate]);

  // "Falta Fazer" = Déficit (o que falta pagar da planilha fixa) - Saldo Livre (dinheiro que já tenho em bolso/manual)
  const remainingToEarn = useMemo(() => {
    return Math.max(0, netBillsGap - netWorkProfit);
  }, [netBillsGap, netWorkProfit]);

  const incomeToday = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income' && isSameDay(parseDateLocal(t.date), today))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, today]);

  // Para a barra de progresso, usamos o total das contas fixas como base 100%
  const totalBillsInPeriod = useMemo(() => {
    return relevantFixedItems
      .filter(e => e.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [relevantFixedItems]);

  const progressPercent = totalBillsInPeriod > 0 
    ? Math.max(0, Math.min(100, ( (totalBillsInPeriod - remainingToEarn) / totalBillsInPeriod) * 100))
    : 100;

  const periodLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
  }, [startDate, endDate]);

  const mainMonthLabel = useMemo(() => {
    const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(midPoint);
  }, [startDate, endDate]);

  const changePeriod = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    const iter = new Date(startDate);
    while (iter <= endDate) {
      days.push(new Date(iter));
      iter.setDate(iter.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const workDaysDetails = useMemo(() => {
    let futureDays = 0; 
    let isTodayWorkDay = false;
    let totalInCycle = 0;

    calendarDays.forEach(date => {
      const dateStr = getISODate(date);
      const isOff = goalSettings.daysOff.includes(dateStr);
      
      if (!isOff) {
        const dTime = new Date(date).setHours(0,0,0,0);
        const tTime = new Date(today).setHours(0,0,0,0);
        
        if (dTime > tTime) futureDays++;
        if (dTime === tTime) isTodayWorkDay = true;
        totalInCycle++; 
      }
    });

    return { futureDays, isTodayWorkDay, totalInCycle };
  }, [calendarDays, goalSettings.daysOff, today]);

  let dailyTargetDisplay = 0;
  let helperText = '';
  let cardVariant: 'default' | 'success' | 'danger' = 'default';

  if (isCurrentCycleView) {
    // Dias de trabalho restantes no ciclo (incluindo hoje se for dia de trampo)
    const remainingWorkDays = workDaysDetails.futureDays + (workDaysDetails.isTodayWorkDay ? 1 : 0);
    
    // Cálculo da meta baseado no Déficit dividido pelos dias que restam para trabalhar
    if (remainingWorkDays > 0) {
      dailyTargetDisplay = remainingToEarn / remainingWorkDays;
      helperText = workDaysDetails.isTodayWorkDay ? `Ganhe R$ ${Math.round(dailyTargetDisplay)} hoje` : `Média p/ os próximos ${workDaysDetails.futureDays} dias`;
    } else {
      dailyTargetDisplay = remainingToEarn;
      helperText = 'Ciclo finalizado!';
    }

    const hitGoalToday = workDaysDetails.isTodayWorkDay && incomeToday >= dailyTargetDisplay;
    if (remainingToEarn === 0) {
      cardVariant = 'success';
      helperText = 'Contas zeradas! Parabéns!';
    } else if (incomeToday > 0) {
      cardVariant = hitGoalToday ? 'success' : 'danger';
    }
    
  } else if (isFutureView) {
    const totalDays = workDaysDetails.totalInCycle;
    dailyTargetDisplay = totalDays > 0 ? netBillsGap / totalDays : 0;
    helperText = `Previsão para ${totalDays} dias`;
  }

  const timeBlocks = useMemo(() => {
    if (!isCurrentCycleView) return [];
    const blocks: { label: string; workingDays: number; value: number; isMain: boolean; rangeText: string }[] = [];
    const iter = new Date(today);
    iter.setHours(0,0,0,0);
    let currentBlockDays = 0;
    let weekIndex = 0;
    let blockStart = new Date(iter);

    const closeBlock = (isFirst: boolean, isTail: boolean, count: number, start: Date, end: Date) => {
      if (count === 0 && !isFirst) return;
      let label = isFirst ? "Esta Semana" : isTail ? "Resto do Ciclo" : `${++weekIndex + 1}ª Semana`;
      blocks.push({
        label,
        workingDays: count,
        value: count * (dailyTargetDisplay || 0),
        isMain: isFirst,
        rangeText: `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}`
      });
    };

    while (iter <= endDate) {
      if (!goalSettings.daysOff.includes(getISODate(iter))) currentBlockDays++;
      if (iter.getDay() === 0 || iter.getTime() === new Date(endDate).setHours(0,0,0,0)) {
        closeBlock(blocks.length === 0, iter.getTime() === new Date(endDate).setHours(0,0,0,0), currentBlockDays, blockStart, new Date(iter));
        const nextStart = new Date(iter); nextStart.setDate(nextStart.getDate() + 1);
        blockStart = new Date(nextStart); currentBlockDays = 0;
      }
      iter.setDate(iter.getDate() + 1);
    }
    return blocks;
  }, [today, endDate, goalSettings.daysOff, dailyTargetDisplay, isCurrentCycleView]);

  const handleDayClick = (date: Date) => {
    const dateStr = getISODate(date);
    if (isCurrentCycleView && date < new Date(new Date().setHours(0,0,0,0))) return;
    const isOff = goalSettings.daysOff.includes(dateStr);
    onUpdateSettings({ ...goalSettings, daysOff: isOff ? goalSettings.daysOff.filter(d => d !== dateStr) : [...goalSettings.daysOff, dateStr] });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="flex flex-col gap-3 pb-28 pt-4">
      <header className="px-2 mb-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Organização</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Estratégia do corre</p>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* SELETOR DE PERÍODO COMPACTO */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg mx-2">
        <button onClick={() => changePeriod(-1)} className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl active:scale-90 transition-all"><ChevronLeft size={16}/></button>
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{mainMonthLabel}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">{periodLabel}</p>
        </div>
        <button onClick={() => changePeriod(1)} className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl active:scale-90 transition-all"><ChevronRight size={16}/></button>
      </div>

      {/* WIDGET DE META DIÁRIA COMPACTO */}
      <div className="px-2">
        <div className={`relative overflow-hidden p-5 rounded-[2rem] border shadow-xl transition-all duration-500 ${
          cardVariant === 'success' ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/10' : 
          cardVariant === 'danger' ? 'bg-rose-600 border-rose-400 shadow-rose-500/20' : 
          'bg-slate-900 border-slate-700 shadow-slate-900/40'
        }`}>
           <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{isFutureView ? "Previsão" : "Meta de Hoje"}</span>
                 {cardVariant === 'success' ? <CheckCircle2 size={18} className="text-white animate-bounce" /> : <Target size={16} className="text-white/40" />}
              </div>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black text-white tracking-tighter drop-shadow-sm">{formatCurrency(dailyTargetDisplay)}</span>
              </div>
              
              {cardVariant === 'success' && remainingToEarn === 0 && (
                <div className="bg-white/20 backdrop-blur-xl px-3 py-2 rounded-xl border border-white/20 animate-in zoom-in-95 duration-500">
                   <p className="text-[11px] font-black text-white tracking-tight leading-none text-center">
                     Parabéns! Bateu a meta! 🏍️
                   </p>
                </div>
              )}

              <div className={`px-3 py-1.5 rounded-xl border inline-flex self-start ${cardVariant === 'success' ? 'bg-emerald-700/30 border-emerald-400/30' : 'bg-white/10 border-white/10 backdrop-blur-md'}`}>
                 <p className="text-[10px] font-black text-white uppercase tracking-tighter opacity-90">{helperText}</p>
              </div>
           </div>
        </div>
      </div>

      {/* CARDS DE PROGRESSO COMPACTOS */}
      <div className="grid grid-cols-2 gap-2 px-2">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-md">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Saldo Livre</span>
           <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tighter mb-2 leading-none">{formatCurrency(netWorkProfit)}</span>
           <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-md">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Falta Fazer</span>
           <span className="text-xl font-black text-slate-900 dark:text-white block tracking-tighter leading-none">{formatCurrency(remainingToEarn)}</span>
           <span className="text-[8px] font-black text-slate-400 uppercase block tracking-tighter mt-1 opacity-80">Meta p/ cobrir fixas</span>
        </div>
      </div>

      {/* TIMELINE COMPACTA */}
      <div className="px-2">
        <div className="bg-indigo-600 p-5 rounded-[2.25rem] border border-indigo-400 shadow-xl shadow-indigo-500/10">
           <h3 className="text-white text-[9px] font-black uppercase tracking-[0.25em] mb-4 flex items-center gap-2 opacity-80">
              <Clock size={14} className="opacity-70" /> Cronograma
           </h3>
           <div className="space-y-4">
              {timeBlocks.map((block, idx) => (
                <div key={idx} className="flex items-center justify-between border-l-2 border-white/20 pl-4 relative">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-white" />
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">{block.label}</p>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-tighter leading-none">{block.workingDays} dias</p>
                  </div>
                  <span className="text-lg font-black text-white tracking-tighter leading-none">{formatCurrency(block.value)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* CALENDÁRIO COMPACTO */}
      <div className="px-2">
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-1">
               <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none">Agenda de Folgas</h3>
               </div>
               <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-400">
                  <CalIcon size={16} />
               </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center mb-3">
               {['D','S','T','Q','Q','S','S'].map((d, i) => (
                 <div key={i} className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{d}</div>
               ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
               {calendarDays.map((date, idx) => {
                 const dateStr = getISODate(date);
                 const isOff = goalSettings.daysOff.includes(dateStr);
                 const isToday = isSameDay(date, today);
                 return (
                   <button 
                     key={idx} 
                     onClick={() => handleDayClick(date)} 
                     className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all relative overflow-hidden active:scale-90 border-2 ${
                       isOff 
                         ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-transparent' 
                         : 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                     } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 scale-[1.05] z-10' : ''}`}
                   >
                     <span className={`text-[11px] font-black tracking-tight ${isOff ? 'opacity-60' : ''}`}>
                       {date.getDate()}
                     </span>
                     {isToday && (
                       <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-blue-500" />
                     )}
                   </button>
                 );
               })}
            </div>
         </div>
      </div>
    </div>
  );
};
