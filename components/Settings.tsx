
import React, { useState } from 'react';
import { Trash2, Edit2, LogOut, Settings as SettingsIcon, Moon, Sun, ChevronRight, User, Menu, AlertCircle, Plus, X, CreditCard as CardIcon, Calendar, Clock } from './Icons';
import { GoalSettings, Transaction, CreditCard, UserProfile } from '../types';
import { formatCurrency } from '../utils';
import { v4 as uuidv4 } from 'uuid';

interface SettingsProps {
  onClearData: () => void;
  userProfile: UserProfile | null;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  goalSettings: GoalSettings;
  onUpdateSettings: (settings: GoalSettings) => void;
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  transactions: Transaction[];
  creditCards: CreditCard[];
  onAddCard: (card: CreditCard) => void;
  onUpdateCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  onOpenMenu: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onClearData, userProfile, onUpdateProfile, onLogout, goalSettings, onUpdateSettings, currentTheme, onToggleTheme, creditCards, onAddCard, onUpdateCard, onDeleteCard, onOpenMenu
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardColor, setCardColor] = useState('#3b82f6');

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName) return;
    const cardData: CreditCard = { id: editingCardId || uuidv4(), name: cardName, color: cardColor, limit: parseFloat(cardLimit) || 0 };
    if (editingCardId) onUpdateCard(cardData); else onAddCard(cardData);
    setShowCardForm(false);
    setCardName('');
    setCardLimit('');
    setEditingCardId(null);
  };

  const handleUpdateCycleStart = (day: number) => {
    onUpdateSettings({ ...goalSettings, startDayOfMonth: day });
  };

  const handleUpdateCycleEnd = (dayStr: string) => {
    const day = dayStr === "" ? undefined : parseInt(dayStr);
    onUpdateSettings({ ...goalSettings, endDayOfMonth: day });
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-28">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none dark:text-white">Ajustes</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurações Gerais</p>
          </div>
        </div>
        <button onClick={onOpenMenu} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all">
          <Menu size={22} />
        </button>
      </header>

      {/* Perfil Simplificado Compacto */}
      <section className="space-y-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <p className="text-base font-black dark:text-white tracking-tight leading-none mb-1">{userProfile?.name}</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{userProfile?.login}</p>
            </div>
          </div>
          <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg active:scale-90 transition-all">
            <Edit2 size={18} />
          </button>
        </div>
      </section>

      {/* Configuração do Ciclo de Faturamento */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Ciclo de Faturamento</h3>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black dark:text-white leading-tight">Período Mensal</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 leading-relaxed">Defina quando seu mês financeiro começa e termina para os cálculos de metas.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Dia de Início</label>
              <select 
                value={goalSettings.startDayOfMonth} 
                onChange={(e) => handleUpdateCycleStart(parseInt(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl font-black text-xs dark:text-white border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>Dia {day}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Dia de Término</label>
              <select 
                value={goalSettings.endDayOfMonth ?? ""} 
                onChange={(e) => handleUpdateCycleEnd(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl font-black text-xs dark:text-white border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Automático</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>Dia {day}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100/50 dark:border-blue-800/30">
            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-normal">
              O modo <span className="font-bold text-blue-600">Automático</span> encerra o ciclo exatamente um dia antes do próximo início.
            </p>
          </div>
        </div>
      </section>

      {/* Visual e Tema Compacto */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Aparência</h3>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center">
              {currentTheme === 'dark' ? <Moon size={20}/> : <Sun size={20}/>}
            </div>
            <div>
              <p className="text-sm font-black dark:text-white leading-tight">Modo Escuro</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ativar tema visual</p>
            </div>
          </div>
          <button onClick={onToggleTheme} className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${currentTheme === 'dark' ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
          </button>
        </div>
      </section>

      {/* Cartões e Limites Compacto */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Meus Cartões</h3>
          <button onClick={() => setShowCardForm(true)} className="p-1.5 text-blue-600 active:scale-90 transition-all"><Plus size={18} /></button>
        </div>
        
        <div className="space-y-2">
          {creditCards.length > 0 ? creditCards.map(card => (
            <div key={card.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-6 rounded-md shadow-sm" style={{ backgroundColor: card.color }} />
                <div>
                  <p className="text-xs font-black dark:text-white tracking-tight">{card.name}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{formatCurrency(card.limit)}</p>
                </div>
              </div>
              <button onClick={() => onDeleteCard(card.id)} className="p-2 text-rose-300"><Trash2 size={16}/></button>
            </div>
          )) : (
            <div className="py-4 text-center opacity-30">
              <p className="text-[9px] font-black uppercase tracking-widest">Nenhum cartão</p>
            </div>
          )}
        </div>
      </section>

      {/* Sessão e Dados Compacto */}
      <section className="space-y-2 pt-2">
        <button onClick={onLogout} className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[11px] border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <LogOut size={16} /> Sair da Conta
        </button>
        <button onClick={() => setShowClearConfirm(true)} className="w-full py-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl font-black text-[11px] border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Trash2 size={16} /> Limpar Todos os Dados
        </button>
      </section>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowClearConfirm(false)} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
                    <AlertCircle size={32} />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter mb-3 leading-tight">Apagar tudo?</h3>
                 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Isso removerá permanentemente todos os seus ganhos e metas.</p>
                 <div className="w-full space-y-2">
                    <button onClick={() => { onClearData(); setShowClearConfirm(false); }} className="w-full py-4 bg-rose-600 text-white rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">Sim, Limpar Tudo</button>
                    <button onClick={() => setShowClearConfirm(false)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm active:scale-95 transition-all">Cancelar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showCardForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowCardForm(false)} />
          <form onSubmit={handleAddCardSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black dark:text-white tracking-tighter">Novo Cartão</h3>
                <button type="button" onClick={() => setShowCardForm(false)} className="p-2 text-slate-400"><X size={24}/></button>
             </div>
             <div className="space-y-4">
                <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome do Cartão" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-sm dark:text-white focus:outline-none border border-slate-100 dark:border-slate-800" />
                <input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)} placeholder="Limite de Crédito" className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-black text-sm dark:text-white focus:outline-none border border-slate-100 dark:border-slate-800" />
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cor do Cartão</label>
                   <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black text-base shadow-xl active:scale-95 transition-all">Salvar Cartão</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};
