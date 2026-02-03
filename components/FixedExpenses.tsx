
import React, { useState, useMemo } from 'react';
import { FixedExpense, RecurrenceType, CreditCard, TransactionType } from '../types';
import { formatCurrency, getBillingPeriodRange, getISODate, getFixedExpensesForPeriod, parseDateLocal } from '../utils';
// Added Receipt to the import list
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
  fixedExpenses, creditCards, startDayOfMonth, endDayOfMonth, onAddExpense, onUpdateExpense, onDeleteExpense
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
    <div className="flex flex-col gap-8 px-5 pt-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <ScrollText size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter leading-none dark:text-white">Contas Fixas</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestão Recorrente</p>
          </div>
        </div>
        <button onClick={() => setShowChartModal(true)} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 active:scale-90 transition-all shadow-sm">
          <PieIcon size={22} />
        </button>
      </header>

      {/* Resumo Financeiro Clean */}
      <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="grid grid-cols-2 gap-8 relative z-10">
          <div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Total Contas</p>
            <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(stats.totalExpenses)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Ganhos Fixos</p>
            <p className="text-2xl font-black text-emerald-400 tracking-tighter">{formatCurrency(stats.totalIncomes)}</p>
          </div>
        </div>
        <div className="h-[1px] bg-white/10 my-6" />
        <div className="flex justify-between items-center relative z-10">
          <p className="text-sm font-black text-white/60">Saldo de Fixas</p>
          <p className={`text-2xl font-black tracking-tighter ${stats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(stats.balance)}
          </p>
        </div>
      </div>

      {/* Calendário de Navegação */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><ChevronLeft size={18}/></button>
        <span className="text-[11px] font-black uppercase tracking-[0.2em] dark:text-white">
          {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewDate)}
        </span>
        <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400"><ChevronRight size={18}/></button>
      </div>

      {/* Lista de Contas */}
      <div className="space-y-4">
        {activeItems.length > 0 ? (
          activeItems.map(item => (
            <div key={`${item.id}-${item.occurrenceDate}`} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.type === 'income' ? <TrendingUp size={20} /> : <Receipt size={20} />}
                </div>
                <div>
                  <p className="text-sm font-black dark:text-white leading-tight">{item.title}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Vence dia {new Date(item.occurrenceDate).getDate()}</p>
                </div>
              </div>
              <p className={`text-base font-black ${item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
              </p>
            </div>
          ))
        ) : (
          <div className="py-20 text-center opacity-30 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
            <ScrollText size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sem contas este mês</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => { setEditingId(null); setTitle(''); setAmount(''); setFormDate(getISODate(new Date())); setShowForm(true); }}
        className="fixed bottom-24 right-6 z-40 w-16 h-16 bg-blue-600 rounded-2xl shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white dark:border-slate-950"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {showChartModal && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowChartModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom border-t border-slate-100 dark:border-slate-800 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black dark:text-white tracking-tighter">Análise de Gastos</h3>
              <button onClick={() => setShowChartModal(false)} className="p-3 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-full"><X size={24}/></button>
            </div>
            <ExpensePieChart data={activeItems.filter(i => i.type === 'expense').map(i => ({ label: i.title, value: i.amount, color: '#3b82f6' }))} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[3rem] p-10 shadow-2xl animate-in slide-in-from-bottom border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-2xl font-black dark:text-white tracking-tighter mb-8">Nova Conta Fixa</h3>
            <div className="space-y-6">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-[12px] font-black transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>Ganho</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-[12px] font-black transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Gasto</button>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl">R$</span>
                <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-950 p-6 pl-16 rounded-[1.5rem] font-black text-3xl border border-slate-200 dark:border-slate-800 focus:border-blue-500 transition-all outline-none" />
              </div>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="O que é? (ex: Aluguel)" className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-[1.5rem] font-black text-base border border-slate-200 dark:border-slate-800 outline-none" />
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-[1.5rem] font-black text-sm border border-slate-200 dark:border-slate-800 outline-none" />
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Confirmar Conta</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};