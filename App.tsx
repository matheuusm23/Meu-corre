
import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard';
import { Goals } from './components/Goals';
import { Settings } from './components/Settings';
import { FixedExpenses } from './components/FixedExpenses';
import { YearlyGoals } from './components/YearlyGoals';
import { WorkSchedule as WorkScheduleComp } from './components/WorkSchedule';
import { FuelAnalysis } from './components/FuelAnalysis';
import { FullHistory } from './components/FullHistory';
import { YearlySummary } from './components/YearlySummary';
import { Maintenance } from './components/Maintenance';
import { Auth } from './components/Auth';
import { Sidebar } from './components/ui/Sidebar';
import { Transaction, GoalSettings, ViewMode, FixedExpense, CreditCard, WorkSchedule, UserProfile, PlannedMaintenance } from './types';
import { v4 as uuidv4 } from 'uuid';
import { auth, analyticsPromise } from './lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { logEvent } from "firebase/analytics";

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sync auth state with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserProfile({
          name: user.displayName || 'Parceiro',
          login: user.email || ''
        });
        setIsLoggedIn(true);
      } else {
        setUserProfile(null);
        setIsLoggedIn(false);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Theme Logic: Default to Light, Persist User Choice
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return 'light'; // Abre automático no moto claro
    }
    return 'light';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(DEFAULT_SCHEDULE);
  const [plannedMaintenances, setPlannedMaintenances] = useState<PlannedMaintenance[]>([]);
  const [goalSettings, setGoalSettings] = useState<GoalSettings>({
    monthlyGoal: 3000, 
    monthlyGoals: {}, 
    daysOff: [],
    workDays: [], // Inicializa workDays
    startDayOfMonth: 1,
    dailySavingTarget: 0,
    savingsDates: [],
    savingsAdjustments: {},
    savingsWithdrawals: {}
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    const savedTx = localStorage.getItem(`${prefix}_transactions`);
    const savedGoals = localStorage.getItem(`${prefix}_goalSettings`);
    const savedFixed = localStorage.getItem(`${prefix}_fixedExpenses`);
    const savedCards = localStorage.getItem(`${prefix}_creditCards`);
    const savedSchedule = localStorage.getItem(`${prefix}_workSchedule`);
    const savedMaintenance = localStorage.getItem(`${prefix}_plannedMaintenances`);
    
    if (savedTx) setTransactions(JSON.parse(savedTx));
    if (savedFixed) setFixedExpenses(JSON.parse(savedFixed));
    if (savedCards) setCreditCards(JSON.parse(savedCards));
    if (savedMaintenance) setPlannedMaintenances(JSON.parse(savedMaintenance));
    if (savedSchedule) setWorkSchedule(JSON.parse(savedSchedule));
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      // Garantir que workDays exista
      if (!parsedGoals.workDays) parsedGoals.workDays = [];
      setGoalSettings(parsedGoals);
    }
  }, [isLoggedIn]);

  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_transactions`, JSON.stringify(transactions)); 
    localStorage.setItem(`${prefix}_goalSettings`, JSON.stringify(goalSettings)); 
    localStorage.setItem(`${prefix}_fixedExpenses`, JSON.stringify(fixedExpenses)); 
    localStorage.setItem(`${prefix}_creditCards`, JSON.stringify(creditCards)); 
    localStorage.setItem(`${prefix}_workSchedule`, JSON.stringify(workSchedule)); 
    localStorage.setItem(`${prefix}_plannedMaintenances`, JSON.stringify(plannedMaintenances));
  }, [transactions, goalSettings, fixedExpenses, creditCards, workSchedule, plannedMaintenances, isLoggedIn]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const hasPendingMaintenance = useMemo(() => plannedMaintenances.some(m => !m.isDone), [plannedMaintenances]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
  };

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
    setPlannedMaintenances([]);
    setWorkSchedule(DEFAULT_SCHEDULE);
    setGoalSettings({ monthlyGoal: 0, monthlyGoals: {}, daysOff: [], workDays: [], startDayOfMonth: 1, dailySavingTarget: 0, savingsDates: [], savingsAdjustments: {}, savingsWithdrawals: {} });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isLoggedIn) return <Auth onLogin={() => setIsLoggedIn(true)} existingProfile={null} />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <main className="max-w-lg mx-auto min-h-screen">
        {currentView === 'home' && <Dashboard userProfile={userProfile} transactions={transactions} fixedExpenses={fixedExpenses} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onChangeView={setCurrentView} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'goals' && <Goals goalSettings={goalSettings} transactions={transactions} onUpdateSettings={setGoalSettings} fixedExpenses={fixedExpenses} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'yearly-goals' && <YearlyGoals goalSettings={goalSettings} onUpdateSettings={setGoalSettings} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'schedule' && <WorkScheduleComp workSchedule={workSchedule} onUpdateSchedule={setWorkSchedule} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'fixed-expenses' && <FixedExpenses fixedExpenses={fixedExpenses} creditCards={creditCards} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onAddExpense={handleAddFixedExpense} onUpdateExpense={handleUpdateFixedExpense} onDeleteExpense={handleDeleteFixedExpense} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'maintenance' && <Maintenance transactions={transactions} goalSettings={goalSettings} plannedMaintenances={plannedMaintenances} onUpdatePlanned={setPlannedMaintenances} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'settings' && <Settings onClearData={handleClearData} userProfile={userProfile} onUpdateProfile={setUserProfile} onLogout={handleLogout} goalSettings={goalSettings} onUpdateSettings={setGoalSettings} currentTheme={theme} onToggleTheme={toggleTheme} transactions={transactions} creditCards={creditCards} onAddCard={handleAddCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'fuel-analysis' && <FuelAnalysis transactions={transactions} fixedExpenses={fixedExpenses} onChangeView={setCurrentView} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'full-history' && <FullHistory transactions={transactions} fixedExpenses={fixedExpenses} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onChangeView={setCurrentView} onOpenMenu={() => setIsSidebarOpen(true)} />}
        {currentView === 'yearly-summary' && <YearlySummary transactions={transactions} onChangeView={setCurrentView} onOpenMenu={() => setIsSidebarOpen(true)} />}
      </main>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView} 
        onChangeView={setCurrentView}
        hasPendingMaintenance={hasPendingMaintenance}
      />
    </div>
  );
};

export default App;
