
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/Card';
import { Transaction, TransactionType, ViewMode, FixedExpense, UserProfile } from '../types';
import { formatCurrency, isSameDay, isSameWeek, getBillingPeriodRange, getISODate, parseDateLocal, getFixedExpensesForPeriod, formatDateFull, getStartOfWeek } from '../utils';
import { TrendingUp, TrendingDown, Plus, X, Trash2, Fuel, Receipt, Eye, EyeOff, Menu, BarChart3, ChevronDown, Clock, Calendar } from './Icons';
import { Logo } from './ui/Logo';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
  userProfile: UserProfile | null;
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  startDayOfMonth: number;
  endDayOfMonth?: number;
  onAddTransaction: (t: Transaction) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onChangeView: (view: ViewMode) => void;
  onOpenMenu: () => void;
}

const DELIVERY_APPS = ['iFood', '99', 'Rappi', 'Lalamove', 'Uber', 'Loggi', 'Borborema', 'Particular'];
const EXPENSE_CATEGORIES = ['Comida', 'Mercado', 'Gastos na rua', 'Combustível', 'Outros'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  userProfile,
  transactions, 
  fixedExpenses,
  startDayOfMonth,
  endDayOfMonth,
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction,
  onChangeView,
  onOpenMenu
}) => {
  const viewDate = useMemo(() => new Date(), []);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  
  const [showForm, setShowForm] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chartVisible, setChartVisible] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getISODate(new Date()));
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setChartVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const { startDate, endDate } = useMemo(() => 
    getBillingPeriodRange(viewDate, startDayOfMonth, endDayOfMonth), 
  [viewDate, startDayOfMonth, endDayOfMonth]);

  const currentPeriodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseDateLocal(t.date);
      return tDate >= startDate && tDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate]);

  const weeklyPerformance = useMemo(() => {
    const weekStart = getStartOfWeek(today);
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return days.map((label, index) => {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + index);
      const dayTransactions = transactions.filter(t => 
        t.type === 'income' && isSameDay(parseDateLocal(t.date), currentDay)
      );
      const total = dayTransactions.reduce((acc, t) => acc + t.amount, 0);
      return { 
        label, 
        value: total, 
        isToday: isSameDay(currentDay, today) 
      };
    });
  }, [transactions, today]);

  const maxDailyValue = useMemo(() => {
    const values = weeklyPerformance.map(d => d.value);
    const max = Math.max(...values);
    return max > 100 ? max * 1.1 : 200;
  }, [weeklyPerformance]);

  const weeklyGroups = useMemo(() => {
    const groups: Record<string, { 
      startDate: Date, 
      income: number, 
      expense: number,
      dailyTransactions: Record<string, Transaction[]> 
    }> = {};

    currentPeriodTransactions.forEach(t => {
      const tDate = parseDateLocal(t.date);
      const weekStart = getStartOfWeek(tDate);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!groups[weekKey]) {
        groups[weekKey] = { 
          startDate: weekStart, 
          income: 0, 
          expense: 0, 
          dailyTransactions: {} 
        };
      }

      groups[weekKey].income += t.type === 'income' ? t.amount : 0;
      groups[weekKey].expense += t.type === 'expense' ? t.amount : 0;

      const dateStr = t.date.split('T')[0];
      if (!groups[weekKey].dailyTransactions[dateStr]) {
        groups[weekKey].dailyTransactions[dateStr] = [];
      }
      groups[weekKey].dailyTransactions[dateStr].push(t);
    });

    return groups;
  }, [currentPeriodTransactions]);

  const sortedWeeks = useMemo(() => Object.keys(weeklyGroups).sort((a, b) => b.localeCompare(a)), [weeklyGroups]);

  const relevantFixed = useMemo(() => {
    return getFixedExpensesForPeriod(fixedExpenses, startDate, endDate);
  }, [fixedExpenses, startDate, endDate]);

  const todayStats = useMemo(() => {
    const dayTransactions = transactions.filter(t => isSameDay(parseDateLocal(t.date), today));
    const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions, today]);

  const weekBalance = useMemo(() => {
    return transactions
      .filter(t => isSameWeek(parseDateLocal(t.date), today) && t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, today]);

  const { settledMonthBalance, todayBalance } = useMemo(() => {
    const settledManual = currentPeriodTransactions
      .filter(t => parseDateLocal(t.date) < today)
      .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    
    const tBalance = currentPeriodTransactions
      .filter(t => isSameDay(parseDateLocal(t.date), today))
      .reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

    const paidFixedExpenses = relevantFixed.filter(e => e.type === 'expense' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    const receivedFixedIncomes = relevantFixed.filter(e => e.type === 'income' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    
    return {
      settledMonthBalance: settledManual - paidFixedExpenses + receivedFixedIncomes,
      todayBalance: tBalance
    };
  }, [currentPeriodTransactions, relevantFixed, today]);

  const monthGrossIncome = useMemo(() => {
    const manualIncomes = currentPeriodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const receivedFixedIncomes = relevantFixed.filter(e => e.type === 'income' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    return manualIncomes + receivedFixedIncomes;
  }, [currentPeriodTransactions, relevantFixed]);

  const monthFuelTotal = useMemo(() => {
    let total = 0;
    currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const desc = t.description.toLowerCase();
        if (desc.includes('combustível') || desc.includes('gasolina') || desc.includes('posto') || desc.includes('etanol')) total += t.amount;
      });
    relevantFixed
      .filter(e => e.type === 'expense' && e.isPaid && (e.category === 'Combustível' || e.title.toLowerCase().includes('combustível')))
      .forEach(e => { total += e.amount; });
    return total;
  }, [currentPeriodTransactions, relevantFixed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    
    let finalDesc = description.trim();
    if (!finalDesc) {
      finalDesc = category || (type === 'income' ? 'Ganho' : 'Gasto');
    } else if (category) {
      finalDesc = `${finalDesc} - ${category}`;
    }

    const transactionData: Transaction = {
      id: editingId || uuidv4(),
      amount: parseFloat(amount),
      description: finalDesc,
      date: date, 
      type,
    };
    if (editingId) onUpdateTransaction(transactionData);
    else onAddTransaction(transactionData);
    setShowForm(false);
  };

  const handleOpenForm = (t?: Transaction | null) => {
    if (t) {
      setEditingId(t.id);
      setAmount(t.amount.toString());
      if (t.description.includes(' - ')) {
        const parts = t.description.split(' - ');
        const cat = parts.pop() || '';
        setCategory(cat);
        setDescription(parts.join(' - '));
      } else {
        setDescription(t.description);
        setCategory('');
      }
      setDate(t.date.split('T')[0]);
      setType(t.type);
    } else {
      setEditingId(null);
      setAmount('');
      setDescription('');
      setDate(getISODate(new Date()));
      setType('income');
      setCategory('');
    }
    setShowForm(true);
  };

  const toggleWeekExpansion = (weekKey: string) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
    if (navigator.vibrate) navigator.vibrate(5);
  };

  return (
    <div className="flex flex-col gap-2 pb-12">
      {/* Banner de Topo Emerald */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 dark:from-emerald-950 dark:via-emerald-900 dark:to-teal-900 w-full pt-8 pb-10 px-6 flex flex-col gap-12 shadow-xl">
        <header className="relative flex items-center justify-between z-10 w-full h-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Bem-vindo</span>
            <p className="text-sm font-black text-white leading-none tracking-tight">Olá, {userProfile?.name || 'Parceiro'}</p>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2">
             <Logo variant="light" showEmoji={false} size="sm" />
          </div>
          <button 
            onClick={onOpenMenu}
            className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all"
          >
            <Menu size={20} />
          </button>
        </header>

        <div className="relative flex items-center justify-between z-10">
          <div className="flex flex-col gap-1">
            <span className="text-emerald-100/50 text-[9px] font-black uppercase tracking-[0.25em]">Faturamento Mês</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-3xl font-black tracking-tighter">
                {isBalanceVisible ? formatCurrency(monthGrossIncome) : 'R$ ••••••'}
              </span>
              <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl text-emerald-300">
                {isBalanceVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="active:scale-95 transition-all">
             <div className="bg-white/10 backdrop-blur-[40px] border border-white/30 px-4 py-3 rounded-[1.75rem] shadow-lg min-w-[130px]">
                <span className="text-white text-[8px] font-black uppercase tracking-[0.15em] opacity-60">Saldo Livre</span>
                <p className="text-white text-lg font-black leading-none">{isBalanceVisible ? formatCurrency(settledMonthBalance) : '••••'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3 mt-[-20px] relative z-20">
        {/* Card de Ganhos do Dia */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-emerald-600/70 mb-0.5">Ganhos de Hoje</p>
              <p className="text-xl font-black dark:text-white">{formatCurrency(todayStats.income)}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30">
               <p className="text-[10px] font-black text-rose-600">-{formatCurrency(todayStats.expense)}</p>
             </div>
          </div>
        </div>

        {/* Cards de Atalhos e Combustível */}
        <div className="grid grid-cols-2 gap-3">
          <Card 
            title="Ganhos Semana" 
            value={formatCurrency(weekBalance)} 
            icon={<TrendingUp size={14} className="text-emerald-500"/>} 
            valueClassName="text-base" 
          />
          <Card 
            title="Combustível" 
            value={formatCurrency(monthFuelTotal)} 
            icon={<Fuel size={14} className="text-amber-500" />} 
            onClick={() => onChangeView('fuel-analysis')}
            valueClassName="text-base" 
            className="border-amber-100 dark:border-amber-900/30"
          />
        </div>

        {/* GRÁFICO COMPACTO DE DESEMPENHO (Agora acima do histórico) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <BarChart3 size={14} className="text-emerald-500" /> Rendimento Semanal
            </h3>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              Total: {formatCurrency(weekBalance)}
            </span>
          </div>

          <div className="flex items-end justify-between h-32 pt-2 gap-2">
            {weeklyPerformance.map((day, idx) => {
              const barHeight = chartVisible ? (day.value / maxDailyValue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group h-full">
                  <div className="relative w-full flex flex-col items-center justify-end h-full">
                    <div className="absolute inset-0 w-full bg-slate-100 dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-inner" />
                    <div 
                      className={`w-full rounded-sm transition-all duration-1000 ease-out relative z-10 shadow-md ${
                        day.isToday 
                          ? 'bg-emerald-500 shadow-emerald-500/30' 
                          : 'bg-slate-500 dark:bg-slate-600 group-hover:bg-emerald-400'
                      }`}
                      style={{ height: `${Math.max(day.value > 0 && chartVisible ? 6 : 0, barHeight)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${day.isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Histórico Semanal (Lista) */}
        <div className="flex items-center justify-between px-2 mt-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={14} /> Histórico Semanal
          </h3>
          <button 
            onClick={() => onChangeView('yearly-summary')}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 active:scale-90 transition-all shadow-sm"
          >
            <BarChart3 size={14} />
          </button>
        </div>

        <div className="space-y-3 mb-24">
          {sortedWeeks.length > 0 ? (
            sortedWeeks.map((weekKey) => {
              const weekData = weeklyGroups[weekKey];
              const isExpanded = !!expandedWeeks[weekKey];
              const weekEndDate = new Date(weekData.startDate);
              weekEndDate.setDate(weekEndDate.getDate() + 6);
              return (
                <div key={weekKey} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-md overflow-hidden transition-all duration-300">
                  <div 
                    onClick={() => toggleWeekExpansion(weekKey)}
                    className={`p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors ${isExpanded ? 'border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                  >
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        {weekData.startDate.getDate()}/{weekData.startDate.getMonth() + 1} - {weekEndDate.getDate()}/{weekEndDate.getMonth() + 1}
                      </p>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {formatCurrency(weekData.income)}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-2 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                      {Object.keys(weekData.dailyTransactions).sort((a,b) => b.localeCompare(a)).map(dayKey => (
                        weekData.dailyTransactions[dayKey].map(t => (
                          <div key={t.id} onClick={() => handleOpenForm(t)} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-[1.25rem] border border-slate-50 dark:border-slate-800/50 active:scale-[0.98] transition-all">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
                                 {t.type === 'income' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                               </div>
                               <p className="text-xs font-black dark:text-white leading-tight">{t.description}</p>
                             </div>
                             <p className={`text-xs font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                               {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                             </p>
                          </div>
                        ))
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center opacity-40 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200">
              <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sem lançamentos</p>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={() => handleOpenForm()} 
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-slate-900 dark:bg-white rounded-xl shadow-2xl flex items-center justify-center text-white dark:text-slate-900 active:scale-90 transition-all"
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-900 w-full max-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black dark:text-white tracking-tighter">{editingId ? 'Editar' : 'Novo'} Lançamento</h3>
              <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500"><X size={20}/></button>
            </div>
            <div className="space-y-4">
               <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex shadow-inner">
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><TrendingUp size={16} /> Ganho</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}><TrendingDown size={16} /> Gasto</button>
               </div>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                 <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-950 text-2xl p-4 pl-12 rounded-2xl font-black focus:outline-none dark:text-white border border-slate-200" />
               </div>
               <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (ex: iFood)" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm dark:text-white focus:outline-none border border-slate-200" />
               <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white border border-slate-200" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white border border-slate-200">
                    <option value="">Categoria</option>
                    {type === 'income' ? DELIVERY_APPS.map(app => <option key={app} value={app}>{app}</option>) : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
               </div>
               <div className="flex gap-3 pt-2">
                 {editingId && (
                   <button type="button" onClick={() => { onDeleteTransaction(editingId!); setShowForm(false); }} className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100"><Trash2 size={24}/></button>
                 )}
                 <button type="submit" className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl">
                    {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                 </button>
               </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
