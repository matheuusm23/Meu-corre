
import React from 'react';
import { Home, Target, Settings, ScrollText, PieChart, X, Clock, Wrench, AlertCircle } from '../Icons';
import { ViewMode } from '../../types';
import { Logo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  hasPendingMaintenance?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onChangeView, hasPendingMaintenance }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'goals', icon: Target, label: 'Trabalho' },
    { id: 'fixed-expenses', icon: ScrollText, label: 'Contas Fixas' },
    { id: 'yearly-goals', icon: PieChart, label: 'Reserva Ano' },
    { id: 'maintenance', icon: Wrench, label: 'Manutenção' },
    { id: 'schedule', icon: Clock, label: 'Cronograma' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  const handleNavClick = (view: ViewMode) => {
    onChangeView(view);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 z-[101] w-64 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out border-l border-slate-100 dark:border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <Logo size="sm" />
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            <p className="px-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Menu</p>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              const showMaintenanceAlert = item.id === 'maintenance' && hasPendingMaintenance;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300 group relative ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center relative ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-emerald-500'}`}>
                    <Icon size={18} />
                    {showMaintenanceAlert && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                        <span className="text-[10px] font-black text-white leading-none">!</span>
                      </div>
                    )}
                  </div>
                  <div className="text-left flex items-center gap-2">
                    <p className="text-sm font-black tracking-tight leading-none">{item.label}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
                🏍️ Meu Corre v2.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
