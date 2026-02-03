
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/Card';
import { Transaction, TransactionType, ViewMode, FixedExpense, UserProfile } from '../types';
import { formatCurrency, isSameDay, isSameWeek, getBillingPeriodRange, getISODate, parseDateLocal, getFixedExpensesForPeriod, formatDateFull, getStartOfWeek } from '../utils';
import { TrendingUp, TrendingDown, Plus, X, Trash2, Fuel, Receipt, Eye, EyeOff, Menu, BarChart3, ChevronDown, Clock, Home } from './Icons';
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
const EXPENSE_CATEGORIES = ['Manutenção', 'Combustível', 'Comida', 'Mercado', 'Gastos na rua', 'Outros'];

export const Dashboard: React.FC<DashboardProps> = ({ 
  userProfile, transactions, fixedExpenses, startDayOfMonth, endDayOfMonth, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onChangeView, onOpenMenu
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getISODate(new Date()));
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('');

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
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

  const monthGrossIncome = useMemo(() => {
    const manualIncomes = currentPeriodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const relevantFixed = getFixedExpensesForPeriod(fixedExpenses, startDate, endDate);
    const receivedFixedIncomes = relevantFixed.filter(e => e.type === 'income' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    return manualIncomes + receivedFixedIncomes;
  }, [currentPeriodTransactions, fixedExpenses, startDate, endDate]);

  const todayStats = useMemo(() => {
    const dayTransactions = transactions.filter(t => isSameDay(parseDateLocal(t.date), today));
    const income = dayTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = dayTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense };
  }, [transactions, today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    let finalDesc = description.trim() || (type === 'income' ? 'Ganho' : 'Gasto');
    if (category) finalDesc = `${finalDesc} - ${category}`;
    const transactionData: Transaction = { id: editingId || uuidv4(), amount: parseFloat(amount), description: finalDesc, date: date, type };
    if (editingId) onUpdateTransaction(transactionData); else onAddTransaction(transactionData);
    setShowForm(false);
  };

  const handleOpenForm = (t?: Transaction | null) => {
    if (t) {
      setEditingId(t.id);
      setAmount(t.amount.toString());
      if (t.description.includes(' - ')) {
        const [desc, cat] = t.description.split(' - ');
        setDescription(desc);
        setCategory(cat);
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
    <div className="flex flex-col min-h-screen">
      {/* Header Corporativo Blue */}
      <div className="relative overflow-hidden bg-blue-600 dark:bg-slate-900 w-full pt-8 pb-14 px-6 flex flex-col gap-12 shadow-xl">
        <header className="relative flex items-center justify-between z-10 w-full">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Bem-vindo</span>
            <p className="text-sm font-black text-white leading-none tracking-tight">Olá, {userProfile?.name || 'Parceiro'}</p>
          </div>
          <button onClick={onOpenMenu} className="p-2 rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 active:scale-90 transition-all">
            <Menu size={20} />
          </button>
        </header>

        <div className="relative flex items-center justify-between z-10">
          <div className="flex flex-col gap-1">
            <span className="text-blue-100/50 text-[9px] font-black uppercase tracking-[0.2em]">Faturamento Mês</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-3xl font-black tracking-tighter">
                {isBalanceVisible ? formatCurrency(monthGrossIncome) : 'R$ ••••••'}
              </span>
              <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl text-blue-300">
                {isBalanceVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 rounded-t-[2.5rem] mt-[-30px] pt-8 px-4 flex flex-col gap-3 relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-24">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2.25rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-blue-600/70 mb-0.5">Ganhos de Hoje</p>
              <p className="text-xl font-black dark:text-white">{formatCurrency(todayStats.income)}</p>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30">
               <p className="text-[10px] font-black text-rose-600">-{formatCurrency(todayStats.expense)}</p>
             </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-1">
            <Clock size={16} className="text-slate-400" />
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Atividades Recentes</h3>
          </div>
          
          {currentPeriodTransactions.length > 0 ? (
            currentPeriodTransactions.slice(0, 10).map(t => (
              <div key={t.id} onClick={() => handleOpenForm(t)} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'income' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                  </div>
                  <div>
                    <p className="text-xs font-black dark:text-white leading-tight">{t.description}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <p className={`text-sm font-black ${t.type === 'income' ? 'text-blue-600' : 'text-rose-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="py-12 text-center opacity-30">
              <Receipt size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sem lançamentos</p>
            </div>
          )}
        </div>
      </div>

      <button onClick={() => handleOpenForm()} className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all border border-blue-500/50">
        <Plus size={28} strokeWidth={3} />
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
                  <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><TrendingUp size={16} /> Ganho</button>
                  <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}><TrendingDown size={16} /> Gasto</button>
               </div>
               <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                 <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-white border border-slate-200 dark:bg-slate-950 text-2xl p-4 pl-12 rounded-2xl font-black focus:border-blue-500 outline-none dark:text-white transition-all" />
               </div>
               <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (ex: iFood)" className="w-full bg-white border border-slate-200 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm dark:text-white focus:border-blue-500 outline-none transition-all" />
               <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-white border border-slate-200 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white outline-none" />
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white border border-slate-200 dark:bg-slate-950 p-4 rounded-xl font-black text-xs dark:text-white outline-none">
                    <option value="">Categoria</option>
                    {type === 'income' ? DELIVERY_APPS.map(app => <option key={app} value={app}>{app}</option>) : EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
               </div>
               <div className="flex gap-3 pt-2">
                 {editingId && (
                   <button type="button" onClick={() => { onDeleteTransaction(editingId!); setShowForm(false); }} className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100"><Trash2 size={24}/></button>
                 )}
                 <button type="submit" className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all">
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
