
import React, { useState } from 'react';
import { Trash2, Edit2, LogOut, Settings as SettingsIcon, Moon, Sun, ChevronRight, User, Menu, AlertCircle, Plus, X, CreditCard as CardIcon } from './Icons';
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
  onClearData, userProfile, onUpdateProfile, onLogout, goalSettings, onUpdateSettings, currentTheme, onToggleTheme, creditCards, onAddCard, onUpdateCard, onDeleteCard
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

  return (
    <div className="flex flex-col gap-8 px-5 pt-10">
      <header className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter leading-none dark:text-white">Ajustes</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configurações Gerais</p>
        </div>
      </header>

      {/* Perfil Simplificado */}
      <section className="space-y-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-inner">
              <User size={28} />
            </div>
            <div>
              <p className="text-lg font-black dark:text-white tracking-tight leading-none mb-1.5">{userProfile?.name}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{userProfile?.login}</p>
            </div>
          </div>
          <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl active:scale-90 transition-all">
            <Edit2 size={20} />
          </button>
        </div>
      </section>

      {/* Visual e Tema */}
      <section className="space-y-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center">
              {currentTheme === 'dark' ? <Moon size={24}/> : <Sun size={24}/>}
            </div>
            <div>
              <p className="text-base font-black dark:text-white leading-tight">Modo Escuro</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ativar tema visual</p>
            </div>
          </div>
          <button onClick={onToggleTheme} className={`w-14 h-7 rounded-full transition-all flex items-center px-1.5 ${currentTheme === 'dark' ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
            <div className="w-4 h-4 bg-white rounded-full shadow-md" />
          </button>
        </div>
      </section>

      {/* Cartões e Limites */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Meus Cartões</h3>
          <button onClick={() => setShowCardForm(true)} className="p-2 text-blue-600 active:scale-90 transition-all"><Plus size={20} /></button>
        </div>
        
        <div className="space-y-3">
          {creditCards.map(card => (
            <div key={card.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-7 rounded-lg shadow-sm" style={{ backgroundColor: card.color }} />
                <div>
                  <p className="text-sm font-black dark:text-white tracking-tight">{card.name}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatCurrency(card.limit)}</p>
                </div>
              </div>
              <button onClick={() => onDeleteCard(card.id)} className="p-2 text-rose-300"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </section>

      {/* Sessão e Dados */}
      <section className="space-y-3 pt-4">
        <button onClick={onLogout} className="w-full py-5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-[1.75rem] font-black text-xs border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3 active:scale-95 transition-all">
          <LogOut size={18} /> Sair da Conta
        </button>
        <button onClick={() => setShowClearConfirm(true)} className="w-full py-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-[1.75rem] font-black text-xs border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-3 active:scale-95 transition-all">
          <Trash2 size={18} /> Limpar Todos os Dados
        </button>
      </section>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowClearConfirm(false)} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95">
              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <AlertCircle size={48} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 leading-tight">Apagar tudo?</h3>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Isso removerá permanentemente todos os seus ganhos e metas.</p>
                 <div className="w-full space-y-3">
                    <button onClick={() => { onClearData(); setShowClearConfirm(false); }} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">Sim, Limpar Tudo</button>
                    <button onClick={() => setShowClearConfirm(false)} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm active:scale-95 transition-all">Cancelar</button>
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
                <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome do Cartão" className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl font-black text-sm dark:text-white focus:outline-none border border-slate-100 dark:border-slate-800" />
                <input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)} placeholder="Limite de Crédito" className="w-full bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl font-black text-sm dark:text-white focus:outline-none border border-slate-100 dark:border-slate-800" />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cor do Cartão</label>
                   <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-full h-14 rounded-2xl cursor-pointer bg-transparent border-none" />
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-base shadow-xl active:scale-95 transition-all">Salvar Cartão</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};
