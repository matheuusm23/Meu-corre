
import React, { useState, useMemo, useEffect } from 'react';
import { Card } from './ui/Card';
import { ExpensePieChart } from './ui/PieChart';
import { Transaction, TransactionType, ViewMode, FixedExpense } from '../types';
import { formatCurrency, formatDate, isSameDay, isSameWeek, getBillingPeriodRange, getISODate, getStartOfWeek, parseDateLocal, getFixedExpensesForPeriod } from '../utils';
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
const QUICK_AMOUNTS = [2, 5, 10, 20, 50, 100];

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
  const [showMonthlyHistory, setShowMonthlyHistory] = useState(false);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFabVisible, setIsFabVisible] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getISODate(new Date()));
  const [type, setType] = useState<TransactionType>('income');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsFabVisible(window.scrollY < 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const relevantFixed = useMemo(() => {
    return getFixedExpensesForPeriod(fixedExpenses, startDate, endDate);
  }, [fixedExpenses, startDate, endDate]);

  const balanceComposition = useMemo(() => {
    const manualItems = currentPeriodTransactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: t.date,
      isFixed: false,
      originalTransaction: t
    }));

    const fixedItems = relevantFixed
      .filter(e => e.isPaid)
      .map(e => ({
        id: e.id,
        description: e.title,
        amount: e.amount,
        type: e.type,
        date: e.occurrenceDate,
        isFixed: true,
        originalTransaction: null
      }));

    return [...manualItems, ...fixedItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentPeriodTransactions, relevantFixed]);

  const chartData = useMemo(() => {
    const data = [];
    const startOfWeek = getStartOfWeek(new Date()); 
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      const dayStr = getISODate(current);
      const dailyIncome = transactions
        .filter(t => t.type === 'income' && t.date.startsWith(dayStr))
        .reduce((acc, t) => acc + t.amount, 0);
      data.push({
        date: current,
        dayStr,
        income: dailyIncome,
        label: new Intl.DateTimeFormat('pt-BR', { weekday: 'narrow' }).format(current).slice(0, 1).toUpperCase(),
        fullDay: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(current).slice(0, 3)
      });
    }
    return data;
  }, [transactions]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.income));
    return max > 0 ? max : 100; 
  }, [chartData]);

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

  const monthTotalExpenses = useMemo(() => {
    const manualExpenses = currentPeriodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const paidFixedExpenses = relevantFixed.filter(e => e.type === 'expense' && e.isPaid).reduce((acc, e) => acc + e.amount, 0);
    return manualExpenses + paidFixedExpenses;
  }, [currentPeriodTransactions, relevantFixed]);

  const monthFuelTotal = useMemo(() => {
    let total = 0;
    currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.description.includes(' - ') ? t.description.split(' - ').pop() || '' : (t.description === 'Combustível' ? 'Combustível' : '');
        if (cat === 'Combustível') total += t.amount;
      });
    relevantFixed
      .filter(e => e.type === 'expense' && e.isPaid && (e.category === 'Combustível' || e.title.includes('Combustível')))
      .forEach(e => { total += e.amount; });
    return total;
  }, [currentPeriodTransactions, relevantFixed]);

  const expensePieData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    
    currentPeriodTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        let cat = 'Outros';
        if (t.description.includes(' - ')) {
          const extracted = t.description.split(' - ').pop() || 'Outros';
          if (EXPENSE_CATEGORIES.includes(extracted)) cat = extracted;
        } else if (EXPENSE_CATEGORIES.includes(t.description)) {
          cat = t.description;
        }
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });

    relevantFixed
      .filter(e => e.type === 'expense' && e.isPaid)
      .forEach(e => {
        let cat = 'Outros';
        if (e.category && EXPENSE_CATEGORIES.includes(e.category)) cat = e.category;
        else cat = 'Fixo';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
      });

    return Object.entries(categoryTotals)
      .filter(([_, value]) => value > 0)
      .map(([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label] || CATEGORY_COLORS['Outros']
      }));
  }, [currentPeriodTransactions, relevantFixed]);

  const weeklyHistory = useMemo(() => {
    const groups: Record<string, { 
      weekKey: string,
      weekStart: Date, 
      weekEnd: Date, 
      totalIncome: number, 
      days: Record<string, { 
        income: number, 
        expense: number, 
        transactions: Transaction[] 
      }> 
    }> = {};

    transactions.forEach(t => {
      const tDate = parseDateLocal(t.date);
      const weekStart = getStartOfWeek(tDate);
      const weekKey = weekStart.toISOString().split('T')[0];
      const dayKey = t.date.split('T')[0];

      if (!groups[weekKey]) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        groups[weekKey] = { weekKey, weekStart, weekEnd, totalIncome: 0, days: {} };
      }

      if (!groups[weekKey].days[dayKey]) {
        groups[weekKey].days[dayKey] = { income: 0, expense: 0, transactions: [] };
      }

      if (t.type === 'income') {
        groups[weekKey].totalIncome += t.amount;
        groups[weekKey].days[dayKey].income += t.amount;
      } else {
        groups[weekKey].days[dayKey].expense += t.amount;
      }
      groups[weekKey].days[dayKey].transactions.push(t);
    });

    const sortedGroups = Object.values(groups)
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
      .map(week => ({
        ...week,
        days: Object.entries(week.days)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, data]) => {
            const incomeTransactions = data.transactions.filter(t => t.type === 'income').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const expenseTransactions = data.transactions.filter(t => t.type === 'expense').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            return { 
              date, 
              ...data, 
              incomeTransactions,
              expenseTransactions
            };
          })
      }));

    if (sortedGroups.length > 0 && expandedWeeks.size === 0) {
      setExpandedWeeks(new Set([sortedGroups[0].weekKey]));
    }

    return sortedGroups;
  }, [transactions]);

  const monthlyHistoryData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      // Use the startDay to find the billing cycle associated with this calendar month
      const refDate = new Date(historyYear, i, startDayOfMonth);
      const { startDate: cycStart, endDate: cycEnd } = getBillingPeriodRange(refDate, startDayOfMonth, endDayOfMonth);
      
      const cycleIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
          const tDate = parseDateLocal(t.date);
          return (tDate >= cycStart && tDate <= cycEnd) ? acc + t.amount : acc;
        }, 0);

      return { month: i, total: cycleIncome };
    });
  }, [transactions, historyYear, startDayOfMonth, endDayOfMonth]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    transactions.forEach(t => {
      years.add(parseDateLocal(t.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const toggleWeek = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) newExpanded.delete(weekKey);
    else newExpanded.add(weekKey);
    setExpandedWeeks(newExpanded);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const getTransactionIcon = (t: { description: string, type: string, isFixed?: boolean }) => {
    const text = t.description.toLowerCase();
    if (t.type === 'income') return <Smartphone size={10} />;
    if (text.includes('gasolina') || text.includes('posto') || text.includes('combustível')) return <Fuel size={10} />;
    if (text.includes('comida') || text.includes('almoço') || text.includes('janta') || text.includes('comer') || text.includes('alimentação')) return <Utensils size={10} />;
    if (text.includes('mercado') || text.includes('supermercado') || text.includes('compras')) return <ShoppingBag size={10} />;
    if (text.includes('rua') || text.includes('gastos na rua')) return <MapPin size={10} />;
    if (t.isFixed) return <Receipt size={10} />;
    return <TrendingDown size={10} />;
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      onDeleteTransaction(id);
    }
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

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="flex flex-col gap-2 pb-12">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 dark:from-emerald-950 dark:via-emerald-900 dark:to-teal-900 w-full pt-8 pb-10 px-6 flex flex-col gap-6 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.35)]">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-400/15 rounded-full -mr-32 -mt-32 blur-[80px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-teal-300/10 rounded-full -ml-20 -mb-20 blur-[60px] pointer-events-none" />
        
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
            <span className="text-emerald-100/50 text-[9px] font-black uppercase tracking-[0.25em] drop-shadow-sm">Faturamento Mês</span>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-3xl font-black tracking-tighter drop-shadow-2xl">
                {isBalanceVisible ? formatCurrency(monthGrossIncome) : 'R$ ••••••'}
              </span>
              <button 
                onClick={toggleBalanceVisibility}
                className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg hover:bg-white/20 transition-all active:scale-90"
              >
                {isBalanceVisible ? <EyeOff size={16} className="text-emerald-300" /> : <Eye size={16} className="text-emerald-300" />}
              </button>
            </div>
          </div>
          
          <div 
            onClick={() => setShowBalanceDetails(true)} 
            className="flex flex-col items-end text-right cursor-pointer group active:scale-95 transition-all"
          >
             <div className="bg-white/10 backdrop-blur-[40px] border border-white/30 px-4 py-3.5 rounded-[1.75rem] shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:bg-white/20 transition-all ring-1 ring-white/10">
                <div className="flex items-center justify-end gap-1.5 mb-1 opacity-60">
                   <span className="text-white text-[8px] font-black uppercase tracking-[0.15em] leading-none">Saldo Livre</span>
                   <Info size={10} className="text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-white text-lg font-black leading-none tracking-tight">
                    {isBalanceVisible ? formatCurrency(monthBalance) : '••••••'}
                  </span>
                  <div className="flex items-center gap-1 mt-2 bg-emerald-400/30 px-2 py-0.5 rounded-full border border-emerald-400/30">
                     <span className="text-emerald-50 text-[7px] font-black uppercase tracking-widest">Extrato 🧾</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-2.5 mt-[-20px] relative z-20">
        <div className="px-0.5 mb-0.5">
           <div className="p-5 rounded-[2.25rem] border flex items-center justify-between shadow-xl transition-all hover:translate-y-[-3px] bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 ring-4 ring-emerald-500/5">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center bg-emerald-500 text-white shadow-xl shadow-emerald-500/30">
                    <TrendingUp size={28} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 text-emerald-600/70">Ganhos de Hoje</p>
                    <p className="text-2xl font-black leading-none text-emerald-900 dark:text-emerald-100 tracking-tighter">
                       {formatCurrency(todayStats.income)}
                    </p>
                 </div>
              </div>
              <div className="text-right">
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                       +{formatCurrency(todayStats.income)}
                    </span>
                    <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-800/30">
                       -{formatCurrency(todayStats.expense)}
                    </span>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Card 
            title="Ganhos da Semana" 
            value={formatCurrency(weekBalance)} 
            icon={<TrendingUp size={12} className="text-emerald-500"/>} 
            valueClassName="text-sm" 
            className="shadow-lg border-slate-200/40 dark:border-slate-800 rounded-[1.5rem] p-4" 
          />
          <Card 
            title="Combustível (Ciclo)" 
            value={formatCurrency(monthFuelTotal)} 
            icon={<Fuel size={12} className="text-amber-500" />} 
            onClick={() => onChangeView('fuel-analysis')}
            valueClassName="text-sm" 
            className="shadow-lg border-slate-200/40 dark:border