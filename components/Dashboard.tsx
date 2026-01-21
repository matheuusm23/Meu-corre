
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/Card';
import { ExpensePieChart } from './ui/PieChart';
import { Transaction, TransactionType, ViewMode, FixedExpense } from '../types';
import { formatCurrency, formatDate, isSameDay, isSameWeek, getBillingPeriodRange, getISODate, getStartOfWeek, parseDateLocal, getFixedExpensesForPeriod, formatDateFull } from '../utils';
import { Wallet, TrendingUp, TrendingDown, Plus, X, Trash2, Calendar, Fuel, Utensils, Wrench, Home, AlertCircle, Smartphone, ShoppingBag, PieChart as PieIcon, Edit2, Info, Receipt, Clock, ChevronDown, ChevronUp, Eye, EyeOff, MapPin, Menu, BarChart3, ChevronLeft, ChevronRight } from './Icons';
import { Logo } from './ui/Logo';
import { v4 as uuidv4 } from 'uuid';

interface DashboardProps {
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

const CATEGORY_COLORS: Record<string, string> = {
  'Combustível': '#FF9F0A',
  'Comida': '#FF3B30',
  'Mercado': '#AF52DE',
  'Gastos na rua': '#32D74B',
  'Outros': '#8E8E93',
  'Fixo': '#5856D6',
};

export const Dashboard: React.FC<DashboardProps> = ({ 
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
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getISODate(new Date()));
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('');

  const { startDate, endDate } = useMemo(() => 
    getBillingPeriodRange(viewDate, startDayOfMonth, endDayOfMonth), 
  [viewDate, startDayOfMonth, endDayOfMonth]);

  const currentPeriodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseDateLocal(t.date);
      return tDate >= startDate && tDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate]);

  // Agrupamento de transações por dia
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    currentPeriodTransactions.slice(0, 20).forEach(t => {
      const dateStr = t.date.split('T')[0];
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(t);
    });
    return groups;
  }, [currentPeriodTransactions]);

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

  const monthBalance = useMemo(() => {
    const manualBalance = currentPeriodTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const paidFixedExpenses = relevantFixed.filter(e => e.type === 'expense' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    const receivedFixedIncomes = relevantFixed.filter(e => e.type === 'income' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    return manualBalance - paidFixedExpenses + receivedFixedIncomes;
  }, [currentPeriodTransactions, relevantFixed]);

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

  return (
    <div className="flex flex-col gap-2 pb-12">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 dark:from-emerald-950 dark:via-emerald-900 dark:to-teal-900 w-full pt-8 pb-10 px-6 flex flex-col gap-6 shadow-xl">
        <header className="relative flex items-center justify-between z-10">
          <Logo variant="light" />
          <button 
            onClick={onOpenMenu}
            className="p-2.5 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all"
          >
            <Menu size={24} />
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
          <div onClick={() => setShowBalanceDetails(true)} className="cursor-pointer active:scale-95 transition-all">
             <div className="bg-white/10 backdrop-blur-[40px] border border-white/30 px-4 py-3 rounded-[1.75rem] shadow-lg">
                <span className="text-white text-[8px] font-black uppercase tracking-[0.15em] opacity-60">Saldo Livre</span>
                <p className="text-white text-lg font-black leading-none">{isBalanceVisible ? formatCurrency(monthBalance) : '••••'}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-3 mt-[-20px] relative z-20">
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

        <div className="grid grid-cols-2 gap-3">
          <Card 
            title="Ganhos Semana" 
            value={formatCurrency(weekBalance)} 
            icon={<BarChart3 size={14} className="text-emerald-500"/>} 
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

        <div className="flex items-center justify-between px-2 mt-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamentos Recentes</h3>
        </div>

        <div className="space-y-4 pb-24">
          {Object.entries(groupedTransactions).length > 0 ? (
            Object.entries(groupedTransactions).map(([dateStr, txs]) => (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center gap-2 px-2 mt-2 mb-1">
                   <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 dark:bg-slate-950 px-3 rounded-full border border-slate-100 dark:border-slate-800">
                      {isSameDay(parseDateLocal(dateStr), today) ? 'Hoje' :
                       isSameDay(parseDateLocal(dateStr), new Date(new Date().setDate(today.getDate() - 1))) ? 'Ontem' :
                       formatDateFull(dateStr)}
                   </span>
                   <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  {txs.map(t => (
                    <div key={t.id} onClick={() => handleOpenForm(t)} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type === 'income' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        </div>
                        <div>
                          <p className="text-sm font-black dark:text-white leading-tight">{t.description}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center opacity-40">
              <Receipt size={32} className="mx-auto mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sem lançamentos no período</p>
            </div>
          )}
        </div>
      </div>

      {/* Botão flutuante (FAB) padronizado */}
      <button 
        onClick={() => handleOpenForm()} 
        className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-slate-900 dark:bg-white rounded-xl shadow-2xl flex items-center justify-center text-white dark:text-slate-900 active:scale-90 transition-all"
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom border border-slate-200 dark:border-slate-800">
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
                 <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-950 text-2xl p-4 pl-12 rounded-2xl font-black focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800" />
               </div>

               <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (ex: iFood)" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800" />

               <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800">
                    <option value="">Categoria</option>
                    {type === 'income' ? DELIVERY_APPS.map(app => <option key={app} value={app}>{app}</option>) : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
               </div>

               <div className="flex gap-3 pt-2">
                 {editingId && (
                   <button type="button" onClick={() => { onDeleteTransaction(editingId); setShowForm(false); }} className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100"><Trash2 size={24}/></button>
                 )}
                 <button type="submit" className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all">
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
