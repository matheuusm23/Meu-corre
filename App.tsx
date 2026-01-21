
import React, { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { Goals } from './components/Goals';
import { Settings } from './components/Settings';
import { FixedExpenses } from './components/FixedExpenses';
import { YearlyGoals } from './components/YearlyGoals';
import { WorkSchedule as WorkScheduleComp } from './components/WorkSchedule';
import { FuelAnalysis } from './components/FuelAnalysis';
import { FullHistory } from './components/FullHistory';
import { YearlySummary } from './components/YearlySummary';
import { Sidebar } from './components/ui/Sidebar';
import { Transaction, GoalSettings, ViewMode, FixedExpense, CreditCard, WorkSchedule } from './types';
import { v4 as uuidv4 } from 'uuid';

type Theme = 'light' | 'dark';

const DEFAULT_SCHEDULE: WorkSchedule = {
  'segunda': { isWorkDay: true, shifts: [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }] },
  'terça': { isWorkDay: true, shifts: [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }] },
  'quarta': { isWorkDay: true, shifts: [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }] },
  'quinta': { isWorkDay: true, shifts: [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }] },
  'sexta': { isWorkDay: true, shifts: [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }] },
  'sábado': { isWorkDay: true, shifts: [{ id: uuidv4(), startTime: '09:00', endTime: '14:00', location: '' }] },
  'domingo': { isWorkDay: false, shifts: [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }] },
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const touchStartRef = useRef<number | null>(null);
  const swipeThreshold = 50;
  const edgeThreshold = 40;

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(DEFAULT_SCHEDULE);
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    monthlyGoal: 3000, 
    monthlyGoals: {}, 
    daysOff: [],
    startDayOfMonth: 1,
    dailySavingTarget: 0,
    savingsDates: [],
    savingsAdjustments: {},
    savingsWithdrawals: {}
  });

  useEffect(() => {
    const savedTx = localStorage.getItem('transactions');
    const savedGoals = localStorage.getItem('goalSettings');
    const savedFixed = localStorage.getItem('fixedExpenses');
    const savedCards = localStorage.getItem('creditCards');
    const savedSchedule = localStorage.getItem('workSchedule');
    
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedFixed) setFixedExpenses(JSON.parse(savedFixed));
    if (savedCards) setCreditCards(JSON.parse(savedCards));
    
    if (savedSchedule) {
      const parsed: any = JSON.parse(savedSchedule);
      const migratedSchedule: WorkSchedule = { ...DEFAULT_SCHEDULE };
      Object.keys(parsed).forEach(day => {
        if (parsed[day].shifts) {
          migratedSchedule[day] = parsed[day];
        } else if (parsed[day].startTime) {
          migratedSchedule[day] = {
            isWorkDay: parsed[day].isWorkDay,
            shifts: [{ 
              id: uuidv4(), 
              startTime: parsed[day].startTime, 
              endTime: parsed[day].endTime, 
              location: parsed[day].location || '' 
            }]
          };
        }
      });
      setWorkSchedule(migratedSchedule);
    }

    if (savedGoals) {
      const parsed = JSON.parse(savedGoals);
      setGoalSettings({
        ...parsed,
        monthlyGoals: parsed.monthlyGoals || {}, 
        startDayOfMonth: parsed.startDayOfMonth || 1,
        dailySavingTarget: parsed.dailySavingTarget || 0,
        savingsDates: parsed.savingsDates || [],
        savingsAdjustments: parsed.savingsAdjustments || {},
        savingsWithdrawals: parsed.savingsWithdrawals || {}
      });
    }
  }, []);

  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('goalSettings', JSON.stringify(goalSettings)); }, [goalSettings]);
  useEffect(() => { localStorage.setItem('fixedExpenses', JSON.stringify(fixedExpenses)); }, [fixedExpenses]);
  useEffect(() => { localStorage.setItem('creditCards', JSON.stringify(creditCards)); }, [creditCards]);
  useEffect(() => { localStorage.setItem('workSchedule', JSON.stringify(workSchedule)); }, [workSchedule]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleAddTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const handleUpdateTransaction = (updatedT: Transaction) => setTransactions(prev => prev.map(t => t.id === updatedT.id ? updatedT : t));
  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const handleAddFixedExpense = (e: FixedExpense) => setFixedExpenses(prev => [...prev, e]);
  const handleUpdateFixedExpense = (updated: FixedExpense) => setFixedExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
  const handleDeleteFixedExpense = (id: string) => setFixedExpenses(prev => prev.filter(e => e.id !== id));
  const handleAddCard = (card: CreditCard) => setCreditCards(prev => [...prev, card]);
  const handleUpdateCard = (updatedCard: CreditCard) => setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  const handleDeleteCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
    setFixedExpenses(prev => prev.map(e => e.cardId === id ? { ...e, cardId: undefined } : e));
  };

  const handleClearData = () => {
    setTransactions([]);
    setFixedExpenses([]);
    setCreditCards([]);
    setWorkSchedule(DEFAULT_SCHEDULE);
    setGoalSettings({ monthlyGoal: 0, monthlyGoals: {}, daysOff: [], startDayOfMonth: 1, dailySavingTarget: 0, savingsDates: [], savingsAdjustments: {}, savingsWithdrawals: {} });
    localStorage.clear();
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const onTouchStart = (e: React.TouchEvent) => {
    const touchX = e.touches[0].clientX;
    if (!isSidebarOpen && touchX > window.innerWidth - edgeThreshold) touchStartRef.current = touchX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const currentTouchX = e.touches[0].clientX;
    const diff = touchStartRef.current - currentTouchX;
    if (diff > swipeThreshold) {
      setIsSidebarOpen(true);
      touchStartRef.current = null;
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const onTouchEnd = () => { touchStartRef.current = null; };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-500/30 transition-colors duration-300" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onChangeView={setCurrentView} />
      <main className="max-w-lg mx-auto min-h-screen">
        {currentView === 'home' && <Dashboard transactions={transactions} fixedExpenses={fixedExpenses} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} />}
        {currentView === 'goals' && <div className="px-4"><Goals goalSettings={goalSettings} transactions={transactions} onUpdateSettings={setGoalSettings} fixedExpenses={fixedExpenses} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'yearly-goals' && <div className="px-4"><YearlyGoals goalSettings={goalSettings} onUpdateSettings={setGoalSettings} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'schedule' && <div className="px-4"><WorkScheduleComp workSchedule={workSchedule} onUpdateSchedule={setWorkSchedule} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'fixed-expenses' && <div className="px-4"><FixedExpenses fixedExpenses={fixedExpenses} creditCards={creditCards} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onAddExpense={handleAddFixedExpense} onUpdateExpense={handleUpdateFixedExpense} onDeleteExpense={handleDeleteFixedExpense} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'settings' && <div className="px-4"><Settings onClearData={handleClearData} goalSettings={goalSettings} onUpdateSettings={setGoalSettings} currentTheme={theme} onToggleTheme={toggleTheme} transactions={transactions} creditCards={creditCards} onAddCard={handleAddCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'fuel-analysis' && <div className="px-4"><FuelAnalysis transactions={transactions} fixedExpenses={fixedExpenses} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'full-history' && <div className="px-4"><FullHistory transactions={transactions} fixedExpenses={fixedExpenses} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'yearly-summary' && <div className="px-4"><YearlySummary transactions={transactions} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} /></div>}
      </main>
    </div>
  );
};

export default App;
