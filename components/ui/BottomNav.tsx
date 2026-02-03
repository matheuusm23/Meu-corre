
import React from 'react';
import { Home, Target, ScrollText, PieChart, Wrench, Clock, Settings } from '../Icons';
import { ViewMode } from '../../types';

interface BottomNavProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  hasPendingMaintenance?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, hasPendingMaintenance }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'goals', icon: Target, label: 'Metas' },
    { id: 'fixed-expenses', icon: ScrollText, label: 'Fixas' },
    { id: 'yearly-goals', icon: PieChart, label: 'Reserva' },
    { id: 'maintenance', icon: Wrench, label: 'Moto' },
    { id: 'schedule', icon: Clock, label: 'Agenda' },
    { id: 'settings', icon: Settings, label: 'Ajustes' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-900 pb-safe">
      <div className="max-w-lg mx-auto px-2 flex justify-between items-center h-20">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          const showMaintenanceAlert = item.id === 'maintenance' && hasPendingMaintenance;

          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-90"
            >
              <div className={`relative p-2.5 rounded-[1rem] transition-all duration-300 ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {showMaintenanceAlert && (
                  <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-950" />
                )}
              </div>
              <span className={`text-[8px] font-black mt-1.5 tracking-tight uppercase ${isActive ? 'text-blue-600 opacity-100' : 'text-slate-400 opacity-60'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
