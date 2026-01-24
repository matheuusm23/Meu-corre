
import React, { useState, useMemo } from 'react';
import { Transaction, FixedExpense, ViewMode } from '../types';
import { formatCurrency, getISODate, parseDateLocal, getFixedExpensesForPeriod } from '../utils';
import { ChevronLeft, Calendar as CalIcon, Fuel, Info, Menu, X, Filter, TrendingDown, Clock, Search, Receipt } from './Icons';

// Added missing FuelAnalysisProps interface definition.
interface FuelAnalysisProps {
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  onChangeView: (view: ViewMode) => void;
  onOpenMenu: () => void;
}

export const FuelAnalysis: React.FC<FuelAnalysisProps> = ({ 
  transactions, 
  fixedExpenses, 
  onChangeView,
  onOpenMenu
}) => {
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return getISODate(d);
  });
  const [endDateStr, setEndDateStr] = useState(() => {
    const d = new Date();
    return getISODate(d);
  });

  const fuelData = useMemo(() => {
    const start = parseDateLocal(startDateStr);
    const end = parseDateLocal(endDateStr);
    end.setHours(23, 59, 59, 999);

    // 1. Filtrar transações manuais de combustível
    const manualFuel = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tDate = parseDateLocal(t.date);
      if (tDate < start || tDate > end) return false;
      
      const desc = t.description.toLowerCase();
      return desc.includes('combustível') || desc.includes('gasolina') || desc.includes('posto') || desc.includes('etanol');
    }).map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date,
      isFixed: false
    }));

    // 2. Filtrar despesas fixas pagas que sejam de combustível no período
    const fixedInPeriod = getFixedExpensesForPeriod(fixedExpenses, start, end);
    const fixedFuel = fixedInPeriod.filter(e => {
      if (e.type !== 'expense' || !e.isPaid) return false;
      const cat = e.category?.toLowerCase() || '';
      const title = e.title?.toLowerCase() || '';
      return cat.includes('combustível') || title.includes('combustível') || title.includes('gasolina');
    }).map(e => ({
      id: e.id,
      description: e.title,
      amount: e.amount,
      date: e.occurrenceDate,
      isFixed: true
    }));

    const combined = [...manualFuel, ...fixedFuel].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = combined.reduce((acc, t) => acc + t.amount, 0);

    return { items: combined, total };
  }, [transactions, fixedExpenses, startDateStr, endDateStr]);

  const setQuickRange = (startDay: number, endDay: number | null) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), startDay);
    const end = endDay 
      ? new Date(now.getFullYear(), now.getMonth(), endDay)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDateStr(getISODate(start));
    setEndDateStr(getISODate(end));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="flex flex-col gap-6 pb-28 pt-4">
      {/* Header Premium */}
      <header className="px-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onChangeView('home')}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <div className="w-1 h-5 bg-amber-500 rounded-full" />
               <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Combustível</h1>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1.5 ml-3">Controle de Consumo</p>
          </div>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Seletor de Período Estratégico */}
      <section className="px-2 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl ring-1 ring-amber-500/5">
          <div className="flex items-center justify-between mb-5">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                   <CalIcon size={16} />
                </div>
                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Selecionar Período</h3>
             </div>
             <Search size={16} className="text-slate-300" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <button 
              onClick={() => setQuickRange(1, 15)}
              className="flex flex-col items-center justify-center gap-1 py-3.5 px-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 active:scale-95 transition-all"
            >
              <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">1ª Quinzena</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Dia 01 ao 15</span>
            </button>
            <button 
              onClick={() => setQuickRange(16, null)}
              className="flex flex-col items-center justify-center gap-1 py-3.5 px-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 active:scale-95 transition-all"
            >
              <span className="text-[10px] font-black text-slate-900 dark:text-white leading-none">2ª Quinzena</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Dia 16 ao Fim</span>
            </button>
            <button 
              onClick={() => setQuickRange(1, null)}
              className="flex flex-col items-center justify-center gap-1 py-3.5 px-2 bg-amber-500 rounded-2xl border border-amber-400 dark:border-transparent shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-white"
            >
              <span className="text-[10px] font-black leading-none">Mês Atual</span>
              <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter">Inteiro</span>
            </button>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 mb-6" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Início</label>
              <div className="relative group">
                <CalIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <input 
                  type="date" 
                  value={startDateStr} 
                  onChange={e => setStartDateStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 p-4 pl-11 rounded-2xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Término</label>
              <div className="relative group">
                <CalIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                <input 
                  type="date" 
                  value={endDateStr} 
                  onChange={e => setEndDateStr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 p-4 pl-11 rounded-2xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner de Resultado Visual */}
      <section className="px-2">
        <div className="bg-slate-900 dark:bg-white p-8 rounded-[3rem] border border-slate-800 dark:border-transparent shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition-transform duration-1000" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-amber-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-amber-500/30">
              <Fuel size={32} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-black text-white/50 dark:text-slate-400 uppercase tracking-[0.3em] mb-2">Total no Período</p>
            <h2 className="text-5xl font-black text-white dark:text-slate-900 tracking-tighter leading-none mb-1">
              {formatCurrency(fuelData.total)}
            </h2>
            <div className="mt-6 flex items-center gap-3">
               <div className="flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-slate-100 rounded-full border border-white/10 dark:border-slate-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <p className="text-[10px] font-black text-white dark:text-slate-600 uppercase tracking-widest leading-none">
                    {fuelData.items.length} Lançamentos
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Abastecimentos Cronológica */}
      <section className="px-2 space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Histórico Detalhado</h3>
          </div>
          <TrendingDown size={14} className="text-rose-400" />
        </div>

        <div className="space-y-3">
          {fuelData.items.length > 0 ? (
            fuelData.items.map(item => (
              <div key={item.id + item.date} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-lg flex items-center justify-between group transition-all hover:translate-y-[-2px] active:scale-[0.98]">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border transition-colors duration-300 ${
                    item.isFixed 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 border-indigo-100/50' 
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-100/50'
                  }`}>
                    {item.isFixed ? <Receipt size={22} /> : <Fuel size={22} />}
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2">
                       <CalIcon size={10} className="text-slate-400" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                         {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {item.isFixed && <span className="ml-1 text-indigo-500/70">(Fixo)</span>}
                       </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-rose-600 dark:text-rose-500 tracking-tighter">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Fuel size={40} className="text-slate-300" />
               </div>
               <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Nenhum gasto encontrado</p>
            </div>
          )}
        </div>
      </section>

      {/* Dica de Especialista */}
      <div className="px-3 pb-8">
        <div className="bg-white dark:bg-slate-900 p-7 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/50 shadow-sm">
            <Info size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-[0.2em] mb-2">Dica do Meu Corre</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed tracking-tight">
              Filtrar por <span className="font-black text-slate-900 dark:text-white">quinzena</span> ajuda você a entender se o seu consumo está dentro do planejado para o mês todo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
