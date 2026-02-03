
import React, { useState, useMemo } from 'react';
import { FixedExpense, RecurrenceType, CreditCard, TransactionType } from '../types';
import { formatCurrency, getBillingPeriodRange, getISODate, getFixedExpensesForPeriod, parseDateLocal } from '../utils';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, ScrollText, TrendingUp, TrendingDown, Edit2, CreditCard as CardIcon, CheckCircle2, PieChart as PieIcon, Menu, Clock, Receipt } from './Icons';
import { ExpensePieChart } from './ui/PieChart';
import { v4 as uuidv4 } from 'uuid';

interface FixedExpensesProps {
  fixedExpenses: FixedExpense[];
  creditCards: CreditCard[];
  startDayOfMonth: number;
  endDayOfMonth?: number;
  onAddExpense: (e: FixedExpense) => void;
  onUpdateExpense: (e: FixedExpense) => void;
  onDeleteExpense: (id: string) => void;
  onOpenMenu: () => void;
}

export const FixedExpenses: React.FC<FixedExpensesProps> = ({
  fixedExpenses, creditCards, startDayOfMonth, endDayOfMonth, onAddExpense, onUpdateExpense, onDeleteExpense, onOpenMenu
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [isCardExpense, setIsCardExpense] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);

  const { startDate, endDate } = useMemo(() => getBillingPeriodRange(viewDate, startDayOfMonth, endDayOfMonth), [viewDate, startDayOfMonth, endDayOfMonth]);
  const activeItems = useMemo(() => getFixedExpensesForPeriod(fixedExpenses, startDate, endDate), [fixedExpenses, startDate, endDate]);
  
  const stats = useMemo(() => {
    const expenses = activeItems.filter(i => i.type === 'expense');
    const incomes = activeItems.filter(i => i.type === 'income');
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    return { totalExpenses, totalIncomes, balance: totalIncomes - totalExpenses };
  }, [activeItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    const finalTitle = title.trim() || (type === 'income' ? 'Ganho Fixo' : 'Gasto Fixo');
    const expenseData: FixedExpense = {
      id: editingId || uuidv4(), title: finalTitle, amount: parseFloat(amount), category: finalTitle, type, recurrence, startDate: formDate,
      cardId: isCardExpense ? selectedCardId : undefined, paidDates: [], excludedDates: []
    };
    if (editingId) onUpdateExpense(expenseData); else onAddExpense(expenseData);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ScrollText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none dark:text-white">Contas Fixas</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão Recorrente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChartModal(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 active:scale-90 transition-all shadow-sm">
            <PieIcon size={20} />
          </button>
          <button onClick={onOpenMenu} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Resumo Financeiro Compacto */}
      <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
        <div className="grid grid-cols-2 gap-6 relative z-10">
          <div>
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">Total Contas</p>
            <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(stats.totalExpenses)}</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1.5">Ganhos Fixos</p>
            <p className="text-xl font-black text-emerald-400 tracking-tighter">{formatCurrency(stats.totalIncomes)}</p>
          </div>
        </div>
        <div className="h-[1px] bg-white/10 my-4" />
        <div className="flex justify-between items-center relative z-10">
          <p className="text-xs font-black text-white/60">Saldo de Fixas</p>
          <p className={`text-xl font-black tracking-tighter ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(stats.balance)}
          </p>
        </div>
      </div>

      {/* Calendário de Navegação Compacto */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400"><ChevronLeft size={16}/></button>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] dark:text-white">
          {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate)}
        </span>
        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400"><ChevronRight size={16}/></button>
      </div>

      {/* Lista de Contas Compacta */}
      <div className="space-y-3">
        {activeItems.length > 0 ? (
          activeItems.map(item => (
            <div key={`${item.id}-${item.occurrenceDate}`} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.type === 'income' ? <TrendingUp size={18} /> : <Receipt size={18} />}
                </div>
                <div>
                  <p className="text-xs font-black dark:text-white leading-tight">{item.title}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vence dia {new Date(item.occurrenceDate).getDate()}</p>
                </div>
              </div>
              <p className={`text-sm font-black ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
              </p>
            </div>
          ))
        ) : (
          <div className="py-14 text-center opacity-30 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
            <ScrollText size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[9px] font-black uppercase tracking-[0.2em]">Sem contas este mês</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setEditingId(null); setTitle(''); setAmount(''); setFormDate(getISODate(new Date())); setShowForm(true); }}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white dark:border-slate-950"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {showChartModal && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowChartModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom border-t border-slate-100 dark:border-slate-800 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black dark:text-white tracking-tighter">Análise de Gastos</h3>
              <button onClick={() => setShowChartModal(false)} className="p-2.5 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-full"><X size={20}/></button>
            </div>
            <ExpensePieChart data={activeItems.filter(i => i.type === 'expense').map(i => ({ label: i.title, value: i.amount, color: '#3b82f6' }))} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-black dark:text-white tracking-tighter mb-6">Nova Conta Fixa</h3>
            <div className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>Ganho</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Gasto</button>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-950 p-5 pl-14 rounded-2xl font-black text-2xl border border-slate-200 dark:border-slate-800 focus:border-blue-500 transition-all outline-none" />
              </div>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="O que é? (ex: Aluguel)" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm border border-slate-200 dark:border-slate-800 outline-none" />
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-xs border border-slate-200 dark:border-slate-800 outline-none" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-base shadow-xl active:scale-95 transition-all">Confirmar Conta</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
