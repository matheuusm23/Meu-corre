
import React, { useState, useMemo } from 'react';
import { FixedExpense, RecurrenceType, CreditCard, TransactionType } from '../types';
import { formatCurrency, getBillingPeriodRange, getISODate, getFixedExpensesForPeriod, parseDateLocal } from '../utils';
import { Card } from './ui/Card';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, Receipt, ScrollText, Calendar, Repeat, Clock, TrendingUp, TrendingDown, Wallet, Edit2, CreditCard as CardIcon, CheckCircle2, AlertCircle, Info, ShoppingBag, ChevronDown, ChevronUp, PieChart as PieIcon, Menu } from './Icons';
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

const CATEGORY_COLORS: Record<string, string> = {
  'Combustível': '#FF9F0A',
  'Comida': '#FF3B30',
  'Mercado': '#AF52DE',
  'Gastos na rua': '#32D74B',
  'Outros': '#8E8E93',
  'Fixo': '#5856D6',
  'Aluguel': '#007AFF',
  'Lazer': '#FF2D55',
  'Saúde': '#5AC8FA',
  'Internet': '#4CD964',
  'Celular': '#FFCC00',
  'Cartão de Crédito': '#4F46E5'
};

const RANDOM_COLORS = [
  '#FF9500', '#FF3B30', '#4CD964', '#007AFF', '#5856D6', '#FF2D55', 
  '#5AC8FA', '#AF52DE', '#FFCC00', '#8E8E93', '#1D1D1F', '#2C2C2E'
];

export const FixedExpenses: React.FC<FixedExpensesProps> = ({
  fixedExpenses,
  creditCards,
  startDayOfMonth,
  endDayOfMonth,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onOpenMenu
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  
  // Modais e Estados de Ação
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: (FixedExpense & { occurrenceDate: string }) | null }>({ isOpen: false, item: null });

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [formDate, setFormDate] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [installments, setInstallments] = useState('12');
  const [isCardExpense, setIsCardExpense] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | undefined>(undefined);

  const { startDate, endDate } = useMemo(() => getBillingPeriodRange(viewDate, startDayOfMonth, endDayOfMonth), [viewDate, startDayOfMonth, endDayOfMonth]);
  const activeItems = useMemo(() => getFixedExpensesForPeriod(fixedExpenses, startDate, endDate), [fixedExpenses, startDate, endDate]);
  
  // Dados para o Gráfico de Pizza das Fixas
  const fixedPieData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    activeItems.filter(i => i.type === 'expense').forEach(item => {
      const label = item.cardId ? 'Cartão de Crédito' : (item.title || item.category || 'Outros');
      dataMap[label] = (dataMap[label] || 0) + item.amount;
    });

    return Object.entries(dataMap).map(([label, value], idx) => ({
      label,
      value,
      color: CATEGORY_COLORS[label] || RANDOM_COLORS[idx % RANDOM_COLORS.length]
    }));
  }, [activeItems]);

  const stats = useMemo(() => {
    const expenses = activeItems.filter(i => i.type === 'expense');
    const incomes = activeItems.filter(i => i.type === 'income');
    
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    
    const unpaidExpenses = expenses
      .filter(i => !i.isPaid)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const unreceivedIncomes = incomes
      .filter(i => !i.isPaid)
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    const gap = unpaidExpenses - unreceivedIncomes;
    
    return {
      totalExpenses,
      totalIncomes,
      remainingToPay: unpaidExpenses,
      gap: Math.max(0, gap),
      isSurplus: gap < 0,
      surplus: Math.abs(Math.min(0, gap))
    };
  }, [activeItems]);

  const invoiceByCard = useMemo(() => {
    const totals: Record<string, number> = {};
    activeItems.forEach(item => { if (item.cardId && item.type === 'expense') totals[item.cardId] = (totals[item.cardId] || 0) + item.amount; });
    return totals;
  }, [activeItems]);

  const handleTogglePaid = (item: FixedExpense & { occurrenceDate: string, isPaid: boolean }) => {
    const currentItem = fixedExpenses.find(f => f.id === item.id);
    if (!currentItem) return;
    const updatedPaidDates = item.isPaid ? currentItem.paidDates?.filter(d => d !== item.occurrenceDate) : [...(currentItem.paidDates || []), item.occurrenceDate];
    onUpdateExpense({ ...currentItem, paidDates: updatedPaidDates });
  };

  const handleEditItem = (item: FixedExpense & { occurrenceDate: string, isPaid: boolean }) => {
    setEditingId(item.id);
    setEditingOccurrenceDate(item.occurrenceDate);
    setTitle(item.title);
    setAmount(item.amount.toString());
    setType(item.type);
    setRecurrence(item.recurrence);
    // Para edição local, mantemos a data da ocorrência como referência se for split
    setFormDate(item.startDate);
    setIsCardExpense(!!item.cardId);
    setSelectedCardId(item.cardId);
    setCategory(item.category || '');
    setShowForm(true);
  };

  const handleConfirmDeleteAll = () => {
    if (deleteModal.item) {
      onDeleteExpense(deleteModal.item.id);
      setDeleteModal({ isOpen: false, item: null });
    }
  };

  const handleConfirmDeleteSingle = () => {
    if (deleteModal.item) {
      const currentItem = fixedExpenses.find(f => f.id === deleteModal.item?.id);
      if (currentItem) {
        const newExcluded = [...(currentItem.excludedDates || []), deleteModal.item.occurrenceDate];
        onUpdateExpense({ ...currentItem, excludedDates: newExcluded });
      }
      setDeleteModal({ isOpen: false, item: null });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    const finalTitle = title.trim() || (type === 'income' ? 'Ganho Fixo' : 'Gasto Fixo');
    
    const expenseData: FixedExpense = {
      id: editingId || uuidv4(), 
      title: finalTitle, 
      amount: parseFloat(amount), 
      category: category || finalTitle,
      type, 
      recurrence, 
      startDate: formDate, 
      installments: recurrence === 'installments' ? parseInt(installments) : undefined,
      excludedDates: editingId ? fixedExpenses.find(f => f.id === editingId)?.excludedDates : [],
      paidDates: editingId ? fixedExpenses.find(f => f.id === editingId)?.paidDates : [],
      cardId: isCardExpense ? selectedCardId : undefined
    };

    if (editingId) {
      const original = fixedExpenses.find(f => f.id === editingId);
      // REGRA: Se for recorrente e estivermos editando, transformamos esta ocorrência em ÚNICA (SPLIT)
      // para não afetar outros meses, conforme solicitado pelo usuário.
      if (original && original.recurrence !== 'single' && editingOccurrenceDate) {
        const isCurrentlyPaid = original.paidDates?.includes(editingOccurrenceDate);
        
        // 1. Criar a nova versão única para este mês
        const localVersion: FixedExpense = {
          ...expenseData,
          id: uuidv4(),
          recurrence: 'single',
          startDate: editingOccurrenceDate,
          paidDates: isCurrentlyPaid ? [editingOccurrenceDate] : [],
          excludedDates: [],
          installments: undefined // registros únicos não tem parcelas
        };

        // 2. Excluir esta data da série original
        onUpdateExpense({
          ...original,
          excludedDates: [...(original.excludedDates || []), editingOccurrenceDate]
        });

        // 3. Adicionar a versão local
        onAddExpense(localVersion);
      } else {
        // Se já era 'single', apenas atualiza
        onUpdateExpense(expenseData);
      }
    } else {
      onAddExpense(expenseData);
    }

    setShowForm(false);
    setEditingId(null);
    setEditingOccurrenceDate(null);
  };

  const renderList = (items: (FixedExpense & { currentInstallment: number | null, occurrenceDate: string, isPaid: boolean })[]) => {
    const incomes = items.filter(i => i.type === 'income');
    const expenses = items.filter(i => i.type === 'expense');

    return (
      <div className="space-y-4">
        {incomes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 mb-1">
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em]">Ganhos Fixos</span>
              <div className="h-[1px] flex-1 bg-emerald-500/10" />
            </div>
            {incomes.map(item => renderItem(item))}
          </div>
        )}

        {expenses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 mb-1">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-[0.3em]">Gastos Fixos</span>
              <div className="h-[1px] flex-1 bg-rose-400/10" />
            </div>
            {expenses.map(item => renderItem(item))}
          </div>
        )}
      </div>
    );
  };

  const renderItem = (item: (FixedExpense & { currentInstallment: number | null, occurrenceDate: string, isPaid: boolean })) => {
    const isExpense = item.type === 'expense';
    const isPaid = item.isPaid;
    
    return (
      <div 
        key={`${item.id}-${item.occurrenceDate}`} 
        className={`p-3 border rounded-2xl flex items-center justify-between group transition-all duration-300 shadow-sm active:scale-[0.99] ${
          isPaid 
            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/40 shadow-[0_4px_12px_rgba(16,185,129,0.1)]' 
            : (isExpense ? 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/30 shadow-[0_4px_12px_rgba(244,63,94,0.05)]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800')
        }`}
      >
         <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleEditItem(item)}>
            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
              isPaid 
                ? 'bg-emerald-500 text-white shadow-md' 
                : (!isExpense ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 shadow-inner')
            }`}>
               {isPaid ? <CheckCircle2 size={16} /> : (!isExpense ? <TrendingUp size={16} /> : <Receipt size={16} />)}
            </div>
            <div className="min-w-0">
               <p className={`text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 ${isPaid ? 'text-emerald-600/70' : (isExpense ? 'text-rose-400' : 'text-slate-400')}`}>
                 {item.recurrence === 'installments' ? `Parcela ${item.currentInstallment}/${item.installments}` : (!isExpense ? 'Ganho Fixo' : 'Gasto Fixo')}
               </p>
               <p className={`font-black text-sm truncate tracking-tight leading-none ${isPaid ? 'text-emerald-900 dark:text-emerald-100' : (isExpense ? 'text-rose-900 dark:text-rose-100' : 'text-slate-900 dark:text-white')}`}>
                 {item.title}
               </p>
            </div>
         </div>
         
         <div className="flex items-center gap-2 pl-2 shrink-0">
            <span className={`font-black text-sm tracking-tighter ${!isExpense || isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(item.amount)}
            </span>
            
            <div className="flex items-center gap-1 ml-1">
              <button 
                onClick={() => handleEditItem(item)}
                className={`p-1.5 transition-colors ${isPaid ? 'text-emerald-400 hover:text-emerald-600' : (isExpense ? 'text-rose-300 hover:text-rose-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200')}`}
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => setDeleteModal({ isOpen: true, item })}
                className={`p-1.5 transition-colors ${isPaid ? 'text-emerald-300' : 'text-rose-400 hover:text-rose-600'}`}
              >
                <Trash2 size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleTogglePaid(item); }} 
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ml-1 border-2 ${
                  isPaid 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                    : (isExpense ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800/40 text-rose-200' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-300')
                }`}
              >
                 <CheckCircle2 size={14} />
              </button>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3 pb-28 pt-4">
      <header className="px-2 mb-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Fixas</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Recorrentes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Gráfico</span>
            <button 
              onClick={() => setShowChartModal(true)}
              className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-slate-500 active:scale-90 transition-all"
            >
              <PieIcon size={20} />
            </button>
          </div>
          <button 
            onClick={onOpenMenu}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* BANNER DE RESUMO ANALÍTICO */}
      <div className="px-2">
         <div className="bg-slate-900 dark:bg-white p-5 rounded-[2.5rem] border border-slate-700 dark:border-slate-100 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-2 gap-4 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shadow-inner"><TrendingDown size={18}/></div>
                  <div>
                     <p className="text-[8px] font-black text-white/40 dark:text-slate-400 uppercase tracking-widest mb-0.5">Total Contas</p>
                     <p className="text-sm font-black text-white dark:text-slate-900 tracking-tighter">{formatCurrency(stats.totalExpenses)}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-inner"><TrendingUp size={18}/></div>
                  <div>
                     <p className="text-[8px] font-black text-white/40 dark:text-slate-400 uppercase tracking-widest mb-0.5">Ganhos Fixos</p>
                     <p className="text-sm font-black text-white dark:text-slate-900 tracking-tighter">{formatCurrency(stats.totalIncomes)}</p>
                  </div>
               </div>
            </div>

            <div className="h-[1px] bg-white/10 dark:bg-slate-200 my-4 w-full" />

            <div className="flex items-center justify-between relative z-10">
               <div>
                  <p className="text-[9px] font-black text-white/60 dark:text-slate-400 uppercase tracking-[0.25em] mb-1">
                    {stats.isSurplus ? 'Sobra Fixa' : 'Déficit do Mês'}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-black tracking-tighter ${stats.isSurplus ? 'text-emerald-400' : 'text-white dark:text-slate-900'}`}>
                      {formatCurrency(stats.isSurplus ? stats.surplus : stats.gap)}
                    </p>
                  </div>
               </div>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${stats.isSurplus ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  {stats.isSurplus ? <CheckCircle2 size={24}/> : <AlertCircle size={24}/>}
               </div>
            </div>
         </div>
      </div>

      {creditCards.length > 0 && (
        <div className="px-2 space-y-2 mt-1">
           <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Cartões</h3>
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-0.5">
              {creditCards.map(card => (
                <div key={card.id} className="shrink-0 w-40 h-24 p-4 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden active:scale-95 transition-transform" style={{ backgroundColor: card.color }}>
                   <div className="flex justify-between items-start relative z-10">
                      <p className="text-[8px] font-black text-white uppercase truncate w-20 tracking-tighter">{card.name}</p>
                      <CardIcon size={14} className="text-white/40" />
                   </div>
                   <div className="relative z-10">
                      <p className="text-[7px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Total Fatura</p>
                      <p className="text-lg font-black text-white tracking-tighter leading-none">{formatCurrency(invoiceByCard[card.id] || 0)}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="px-2 space-y-3 mt-1">
         <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-md">
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()-1)))} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg"><ChevronLeft size={16}/></button>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][viewDate.getMonth()]} {viewDate.getFullYear()}</p>
            </div>
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth()+1)))} className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg"><ChevronRight size={16}/></button>
         </div>

         {activeItems.length > 0 ? (
           <div className="space-y-2">
              {renderList(activeItems.filter(i => !i.cardId))}
              
              {activeItems.filter(i => !!i.cardId).length > 0 && (
                <div className="mt-4 space-y-2">
                   <div onClick={() => setIsCardsExpanded(!isCardsExpanded)} className="p-4 bg-indigo-600 rounded-[1.75rem] flex items-center justify-between cursor-pointer shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-white"><CardIcon size={16}/></div>
                        <div>
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Cartão</p>
                          <p className="text-base font-black text-white tracking-tighter leading-none mt-0.5">{formatCurrency(activeItems.filter(i => !!i.cardId).reduce((a,c)=>a+c.amount,0))}</p>
                        </div>
                      </div>
                      <div className="text-white/40">{isCardsExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</div>
                   </div>
                   {isCardsExpanded && renderList(activeItems.filter(i => !!i.cardId))}
                </div>
              )}
           </div>
         ) : (
           <div className="text-center py-12 text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200">
              <Receipt size={24} className="mx-auto mb-2 opacity-10" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Sem registros</p>
           </div>
         )}
      </div>

      <button onClick={() => { setEditingId(null); setEditingOccurrenceDate(null); setTitle(''); setAmount(''); setShowForm(true); }} className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-slate-900 dark:bg-white rounded-xl shadow-2xl flex items-center justify-center text-white dark:text-slate-900 active:scale-90 transition-all"><Plus size={24} strokeWidth={3} /></button>

      {/* MODAL DO GRÁFICO DE FIXAS */}
      {showChartModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl" onClick={() => setShowChartModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-sm rounded-[3.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div>
                 <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">Análise de Fixas</h3>
                 <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Visão detalhada por conta</p>
              </div>
              <button onClick={() => setShowChartModal(false)} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-slate-500 active:scale-90 transition-transform"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar pb-8">
              <ExpensePieChart data={fixedPieData} />
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 mt-auto shrink-0">
               <div className="bg-slate-900 dark:bg-white p-7 rounded-[3rem] flex justify-between items-center shadow-2xl scale-[1.04]">
                  <div>
                    <span className="text-[12px] font-black text-white/50 dark:text-slate-400 uppercase tracking-[0.2em]">Total Gastos Fixos</span>
                  </div>
                  <span className="text-3xl font-black text-white dark:text-slate-900 tracking-tighter">{formatCurrency(stats.totalExpenses)}</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setDeleteModal({ isOpen: false, item: null })} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-[2rem] shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Excluir Conta</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium leading-tight">Como deseja remover este lançamento fixo?</p>
              
              <div className="space-y-3">
                 <button 
                   onClick={handleConfirmDeleteSingle}
                   className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm active:scale-[0.98] transition-all"
                 >
                   Apenas este mês
                 </button>
                 <button 
                   onClick={handleConfirmDeleteAll}
                   className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                 >
                   Toda a recorrência (Série)
                 </button>
                 <button 
                   onClick={() => setDeleteModal({ isOpen: false, item: null })}
                   className="w-full py-4 bg-transparent text-slate-400 font-black text-sm"
                 >
                   Cancelar
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* FORM MODAL COMPACTO */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowForm(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-sm rounded-[2rem] p-5 shadow-2xl animate-in slide-in-from-bottom border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black dark:text-white leading-none tracking-tighter">{editingId ? 'Editar' : 'Nova'} Conta Fixa</h3>
              <button onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-full text-slate-500 active:scale-90 transition-transform"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex shadow-inner">
                <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><TrendingUp size={16} /> Ganho</button>
                <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}><TrendingDown size={16} /> Gasto</button>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">R$</span>
                  <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="w-full bg-slate-50 dark:bg-slate-950 text-2xl p-4 pl-12 rounded-2xl font-black focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800" />
                </div>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da conta" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800" />
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Primeiro Vencimento</span>
                      <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl font-black text-xs focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800" />
                   </div>
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Recorrência</span>
                      <select value={recurrence} onChange={e => setRecurrence(e.target.value as RecurrenceType)} className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl font-black text-xs focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800">
                        <option value="monthly">Mensal</option>
                        <option value="installments">Parcelado</option>
                        <option value="single">Única</option>
                      </select>
                   </div>
                </div>

                {recurrence === 'installments' && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Total de Parcelas</span>
                    <input type="number" value={installments} onChange={e => setInstallments(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800" />
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                   <input type="checkbox" id="isCard" checked={isCardExpense} onChange={e => setIsCardExpense(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                   <label htmlFor="isCard" className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">Pagar no Cartão de Crédito</label>
                </div>

                {isCardExpense && (
                  <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-black text-sm focus:outline-none dark:text-white border border-slate-200 dark:border-slate-800">
                    <option value="">Selecione um cartão</option>
                    {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <button type="submit" className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-xl active:scale-[0.98] transition-all ${type === 'income' ? 'bg-emerald-600' : 'bg-slate-900 dark:bg-white dark:text-slate-900'}`}>
                {editingId ? 'Salvar Alterações' : 'Criar Conta Fixa'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
