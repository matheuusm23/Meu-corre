
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, FixedExpense, ViewMode } from '../types';
import { formatCurrency, getBillingPeriodRange, parseDateLocal, formatDateFull, isSameDay } from '../utils';
// Added ChevronDown to the imported icons
import { ChevronLeft, ChevronDown, TrendingUp, TrendingDown, Clock, Receipt, Menu, X, Trash2, Plus } from './Icons';
import { Logo } from './ui/Logo';
import { getISODate } from '../utils';
import { v4 as uuidv4 } from 'uuid';

interface FullHistoryProps {
  transactions: Transaction[];
  fixedExpenses: FixedExpense[];
  startDayOfMonth: number;
  endDayOfMonth?: number;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onChangeView: (view: ViewMode) => void;
  onOpenMenu: () => void;
}

const DELIVERY_APPS = ['iFood', '99', 'Rappi', 'Lalamove', 'Uber', 'Loggi', 'Borborema', 'Particular'];
const EXPENSE_CATEGORIES = ['Comida', 'Mercado', 'Gastos na rua', 'Combustível', 'Outros'];

export const FullHistory: React.FC<FullHistoryProps> = ({ 
  transactions, 
  fixedExpenses,
  startDayOfMonth,
  endDayOfMonth,
  onUpdateTransaction,
  onDeleteTransaction,
  onChangeView,
  onOpenMenu
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getISODate(new Date()));
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { startDate, endDate } = useMemo(() => 
    getBillingPeriodRange(new Date(), startDayOfMonth, endDayOfMonth), 
  [startDayOfMonth, endDayOfMonth]);

  const currentPeriodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseDateLocal(t.date);
      return tDate >= startDate && tDate <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, startDate, endDate]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { transactions: Transaction[], income: number, expense: number }> = {};
    currentPeriodTransactions.forEach(t => {
      const dateStr = t.date.split('T')[0];
      if (!groups[dateStr]) {
        groups[dateStr] = { transactions: [], income: 0, expense: 0 };
      }
      groups[dateStr].transactions.push(t);
      if (t.type === 'income') groups[dateStr].income += t.amount;
      else groups[dateStr].expense += t.amount;
    });
    return groups;
  }, [currentPeriodTransactions]);

  const sortedDates = useMemo(() => Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a)), [groupedTransactions]);

  const stats = useMemo(() => {
    const income = currentPeriodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = currentPeriodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [currentPeriodTransactions]);

  const toggleDayExpansion = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  const handleOpenForm = (t: Transaction) => {
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
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !editingId) return;
    
    let finalDesc = description.trim();
    if (!finalDesc) {
      finalDesc = category || (type === 'income' ? 'Ganho' : 'Gasto');
    } else if (category) {
      finalDesc = `${finalDesc} - ${category}`;
    }

    const transactionData: Transaction = {
      id: editingId,
      amount: parseFloat(amount),
      description: finalDesc,
      date: date, 
      type,
    };
    onUpdateTransaction(transactionData);
    setShowForm(false);
  };

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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Histórico</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Ciclo Atual</p>
          </div>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Summary Card */}
      <div className="px-2">
         <div className="bg-slate-900 dark:bg-white p-6 rounded-[2.5rem] border border-slate-700 dark:border-slate-100 shadow-xl flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[10px] font-black text-white/40 dark:text-slate-400 uppercase tracking-widest">Saldo do Período</p>
               <p className="text-3xl font-black text-white dark:text-slate-900 tracking-tighter">{formatCurrency(stats.balance)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp size={12} />
                  <span className="text-[10px] font-black">{formatCurrency(stats.income)}</span>
               </div>
               <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/20">
                  <TrendingDown size={12} />
                  <span className="text-[10px] font-black">{formatCurrency(stats.expense)}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="px-2 space-y-3">
        {sortedDates.length > 0 ? (
          sortedDates.map((dateStr) => {
            const dayData = groupedTransactions[dateStr];
            const isExpanded = !!expandedDays[dateStr];
            const isTodayDay = isSameDay(parseDateLocal(dateStr), today);
            
            return (
              <div key={dateStr} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-md overflow-hidden transition-all duration-300">
                <div 
                  onClick={() => toggleDayExpansion(dateStr)}
                  className={`p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors ${isExpanded ? 'border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30' : ''}`}
                >
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      {isTodayDay ? 'Hoje' : formatDateFull(dateStr)}
                    </p>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(dayData.income - dayData.expense)}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-2 space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    {dayData.transactions.map(t => (
                      <div key={t.id} onClick={() => handleOpenForm(t)} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-50 dark:border-slate-800/50 active:scale-[0.98] transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'}`}>
                            {t.type === 'income' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                          </div>
                          <p className="text-xs font-black dark:text-white leading-tight">{t.description}</p>
                        </div>
                        <p className={`text-xs font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center opacity-40 bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
            <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest">Histórico vazio no ciclo</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black dark:text-white tracking-tighter">Editar Lançamento</h3>
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

               <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800" />

               <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white focus:outline-none border border-slate-200 dark:border-slate-800">
                    <option value="">Categoria</option>
                    {type === 'income' ? DELIVERY_APPS.map(app => <option key={app} value={app}>{app}</option>) : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
               </div>

               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={() => { onDeleteTransaction(editingId!); setShowForm(false); }} className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100"><Trash2 size={24}/></button>
                 <button type="submit" className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all">
                    Salvar Alterações
                 </button>
               </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
