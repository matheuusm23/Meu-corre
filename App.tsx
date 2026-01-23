
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Auth state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Analytics: Track screen changes
  useEffect(() => {
    analyticsPromise.then(analytics => {
      if (analytics) {
        logEvent(analytics, 'screen_view', {
          firebase_screen: currentView,
          firebase_screen_class: 'App'
        });
      }
    });
  }, [currentView]);

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
  const [plannedMaintenances, setPlannedMaintenances] = useState<PlannedMaintenance[]>([]);
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
    if (!isLoggedIn) return; // Only load data if logged in
    
    const prefix = auth.currentUser?.uid || 'default';
    const savedTx = localStorage.getItem(`${prefix}_transactions`);
    const savedGoals = localStorage.getItem(`${prefix}_goalSettings`);
    const savedFixed = localStorage.getItem(`${prefix}_fixedExpenses`);
    const savedCards = localStorage.getItem(`${prefix}_creditCards`);
    const savedSchedule = localStorage.getItem(`${prefix}_workSchedule`);
    const savedMaintenance = localStorage.getItem(`${prefix}_plannedMaintenances`);
    
    if (savedTx) setTransactions(JSON.parse(savedTx)); else setTransactions([]);
    if (savedFixed) setFixedExpenses(JSON.parse(savedFixed)); else setFixedExpenses([]);
    if (savedCards) setCreditCards(JSON.parse(savedCards)); else setCreditCards([]);
    if (savedMaintenance) setPlannedMaintenances(JSON.parse(savedMaintenance)); else setPlannedMaintenances([]);
    
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
    } else {
      setWorkSchedule(DEFAULT_SCHEDULE);
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
    } else {
      setGoalSettings({
        monthlyGoal: 3000, 
        monthlyGoals: {}, 
        daysOff: [],
        startDayOfMonth: 1,
        dailySavingTarget: 0,
        savingsDates: [],
        savingsAdjustments: {},
        savingsWithdrawals: {}
      });
    }
  }, [isLoggedIn]);

  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_transactions`, JSON.stringify(transactions)); 
  }, [transactions, isLoggedIn]);
  
  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_goalSettings`, JSON.stringify(goalSettings)); 
  }, [goalSettings, isLoggedIn]);
  
  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_fixedExpenses`, JSON.stringify(fixedExpenses)); 
  }, [fixedExpenses, isLoggedIn]);
  
  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_creditCards`, JSON.stringify(creditCards)); 
  }, [creditCards, isLoggedIn]);
  
  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_workSchedule`, JSON.stringify(workSchedule)); 
  }, [workSchedule, isLoggedIn]);
  
  useEffect(() => { 
    if (!isLoggedIn) return;
    const prefix = auth.currentUser?.uid || 'default';
    localStorage.setItem(`${prefix}_plannedMaintenances`, JSON.stringify(plannedMaintenances)); 
  }, [plannedMaintenances, isLoggedIn]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const hasPendingMaintenance = useMemo(() => {
    return plannedMaintenances.some(m => !m.isDone);
  }, [plannedMaintenances]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsLoggedIn(false);
      setUserProfile(null);
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
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
    const prefix = auth.currentUser?.uid || 'default';
    setTransactions([]);
    setFixedExpenses([]);
    setCreditCards([]);
    setPlannedMaintenances([]);
    setWorkSchedule(DEFAULT_SCHEDULE);
    setGoalSettings({ monthlyGoal: 0, monthlyGoals: {}, daysOff: [], startDayOfMonth: 1, dailySavingTarget: 0, savingsDates: [], savingsAdjustments: {}, savingsWithdrawals: {} });
    
    localStorage.removeItem(`${prefix}_transactions`);
    localStorage.removeItem(`${prefix}_goalSettings`);
    localStorage.removeItem(`${prefix}_fixedExpenses`);
    localStorage.removeItem(`${prefix}_creditCards`);
    localStorage.removeItem(`${prefix}_workSchedule`);
    localStorage.removeItem(`${prefix}_plannedMaintenances`);
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

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Carregando corre...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} existingProfile={null} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-500/30 transition-colors duration-300" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        hasPendingMaintenance={hasPendingMaintenance}
      />
      <main className="max-w-lg mx-auto min-h-screen">
        {currentView === 'home' && <Dashboard userProfile={userProfile} transactions={transactions} fixedExpenses={fixedExpenses} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} />}
        {currentView === 'goals' && <div className="px-4"><Goals goalSettings={goalSettings} transactions={transactions} onUpdateSettings={setGoalSettings} fixedExpenses={fixedExpenses} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'yearly-goals' && <div className="px-4"><YearlyGoals goalSettings={goalSettings} onUpdateSettings={setGoalSettings} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'schedule' && <div className="px-4"><WorkScheduleComp workSchedule={workSchedule} onUpdateSchedule={setWorkSchedule} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'fixed-expenses' && <div className="px-4"><FixedExpenses fixedExpenses={fixedExpenses} creditCards={creditCards} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onAddExpense={handleAddFixedExpense} onUpdateExpense={handleUpdateFixedExpense} onDeleteExpense={handleDeleteFixedExpense} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'maintenance' && <div className="px-4"><Maintenance transactions={transactions} goalSettings={goalSettings} plannedMaintenances={plannedMaintenances} onUpdatePlanned={setPlannedMaintenances} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'settings' && <div className="px-4"><Settings onClearData={handleClearData} userProfile={userProfile} onUpdateProfile={setUserProfile} onLogout={handleLogout} goalSettings={goalSettings} onUpdateSettings={setGoalSettings} currentTheme={theme} onToggleTheme={toggleTheme} transactions={transactions} creditCards={creditCards} onAddCard={handleAddCard} onUpdateCard={handleUpdateCard} onDeleteCard={handleDeleteCard} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'fuel-analysis' && <div className="px-4"><FuelAnalysis transactions={transactions} fixedExpenses={fixedExpenses} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'full-history' && <div className="px-4"><FullHistory transactions={transactions} fixedExpenses={fixedExpenses} startDayOfMonth={goalSettings.startDayOfMonth} endDayOfMonth={goalSettings.endDayOfMonth} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} /></div>}
        {currentView === 'yearly-summary' && <div className="px-4"><YearlySummary transactions={transactions} onChangeView={setCurrentView} onOpenMenu={toggleSidebar} /></div>}
      </main>
    </div>
  );
};

export default App;
