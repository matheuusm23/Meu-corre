
import React from 'react';
import { Home, Target, Settings, ScrollText, PieChart, X, Clock } from '../Icons';
import { ViewMode } from '../../types';
import { Logo } from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onChangeView }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Início', desc: 'Dashboard e Resumo' },
    { id: 'goals', icon: Target, label: 'Trabalho', desc: 'Organização e Metas Diárias' },
    { id: 'schedule', icon: Clock, label: 'Cronograma', desc: 'Sua Agenda de Trabalho' },
    { id: 'fixed-expenses', icon: ScrollText, label: 'Contas Fixas', desc: 'Gastos Recorrentes' },
    { id: 'yearly-goals', icon: PieChart, label: 'Reserva Ano', desc: 'Economias e Metas Longas' },
    { id: 'settings', icon: Settings, label: 'Ajustes', desc: 'Configurações do App' },
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
        className={`fixed top-0 right-0 bottom-0 z-[101] w-72 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out border-l border-slate-100 dark:border-slate-800 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <Logo />
            <button 
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Navegação</p>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-emerald-500'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black tracking-tight leading-none mb-1">{item.label}</p>
                    <p className={`text-[9px] font-bold opacity-60 leading-none truncate w-32 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">
                🏍️ Meu Corre v2.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
