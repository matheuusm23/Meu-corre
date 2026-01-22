
import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Trash2, Calendar, Edit2, Lock, X, Users, User, LogOut, Activity, BarChart3, Smartphone, ChevronRight, CreditCard as CardIcon, Plus, CheckCircle2, Clock, Home, Info, Menu, AlertCircle } from './Icons';
import { GoalSettings, Transaction, CreditCard, UserProfile } from '../types';
import { getISODate, formatCurrency, getBillingPeriodRange } from '../utils';
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
  onClearData, userProfile, onUpdateProfile, onLogout, goalSettings, onUpdateSettings, currentTheme, onToggleTheme, transactions, creditCards, onAddCard, onUpdateCard, onDeleteCard, onOpenMenu
}) => {
  const [showCardForm, setShowCardForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardColor, setCardColor] = useState('#3b82f6');

  // Perfil state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(userProfile?.name || '');
  const [profileLogin, setProfileLogin] = useState(userProfile?.login || '');
  const [profilePassword, setProfilePassword] = useState(userProfile?.password || '');

  const resetCardForm = () => { setCardName(''); setCardLimit(''); setEditingCardId(null); setShowCardForm(false); };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName) return;
    const cardData: CreditCard = { id: editingCardId || uuidv4(), name: cardName, color: cardColor, limit: parseFloat(cardLimit) || 0 };
    if (editingCardId) onUpdateCard(cardData); else onAddCard(cardData);
    resetCardForm();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: profileName,
      login: profileLogin,
      password: profilePassword
    });
    setIsEditingProfile(false);
  };

  const handleConfirmClear = () => {
    onClearData();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col gap-5 pb-28 pt-4 px-2">
      <header className="px-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Ajustes</h1>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Configurações</p>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* SEÇÃO PERFIL */}
      <section className="px-1">
         <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Seu Perfil</h3>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-md space-y-4">
            {isEditingProfile ? (
               <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Completo</span>
                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border-none shadow-inner" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Login</span>
                    <input type="text" value={profileLogin} onChange={e => setProfileLogin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border-none shadow-inner" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Nova Senha</span>
                    <input type="password" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border-none shadow-inner" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg">Salvar Perfil</button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-black text-xs">Cancelar</button>
                  </div>
               </form>
            ) : (
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <User size={24} />
                     </div>
                     <div>
                        <p className="text-sm font-black dark:text-white tracking-tight leading-none mb-1">{userProfile?.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{userProfile?.login}</p>
                     </div>
                  </div>
                  <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg">
                    <Edit2 size={16} />
                  </button>
               </div>
            )}
         </div>
      </section>

      {/* SEÇÃO APARÊNCIA COMPACTA */}
      <section className="px-1">
         <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Visual</h3>
         <div className="bg-white dark:bg-slate-900 p-4.5 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><Activity size={20}/></div>
               <div>
                  <p className="text-sm font-black dark:text-white leading-tight">Modo Escuro</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Economia de bateria</p>
               </div>
            </div>
            <button onClick={onToggleTheme} className={`w-12 h-6 rounded-full transition-all flex items-center px-1 ${currentTheme === 'dark' ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'}`}>
               <div className="w-4 h-4 bg-white rounded-full" />
            </button>
         </div>
      </section>

      {/* SEÇÃO CICLO COMPACTA */}
      <section className="px-1">
         <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Ciclo</h3>
         <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-md space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest px-1">Início</span>
                  <select value={goalSettings.startDayOfMonth} onChange={e => onUpdateSettings({...goalSettings, startDayOfMonth: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border-none">
                     {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>Dia {d}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase block tracking-widest px-1">Fim</span>
                  <select value={goalSettings.endDayOfMonth || 'auto'} onChange={e => onUpdateSettings({...goalSettings, endDayOfMonth: e.target.value === 'auto' ? undefined : parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border-none">
                     <option value="auto">Auto</option>
                     {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>Dia {d}</option>)}
                  </select>
               </div>
            </div>
         </div>
      </section>

      {/* SEÇÃO CARTÕES COMPACTA */}
      <section className="px-1">
         <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2">Cartões</h3>
         <div className="space-y-2">
            {creditCards.map(card => (
               <div key={card.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-7 rounded-lg shadow-md flex items-center justify-center text-white/50" style={{backgroundColor: card.color}}><CardIcon size={18}/></div>
                     <div>
                        <p className="text-sm font-black dark:text-white tracking-tight leading-none mb-1">{card.name}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{card.limit > 0 ? `Limite: ${formatCurrency(card.limit)}` : 'S/ Limite'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button onClick={() => { setEditingCardId(card.id); setCardName(card.name); setCardLimit(card.limit.toString()); setCardColor(card.color); setShowCardForm(true); }} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg"><Edit2 size={14}/></button>
                     <button onClick={() => onDeleteCard(card.id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg"><Trash2 size={14}/></button>
                  </div>
               </div>
            ))}
            <button onClick={() => setShowCardForm(true)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-xs shadow-xl flex items-center justify-center gap-2">
               <Plus size={16} strokeWidth={3} /> Novo Cartão
            </button>
         </div>
      </section>

      {/* SEÇÃO SESSÃO */}
      <section className="px-1 mt-2 flex flex-col gap-3">
         <button onClick={onLogout} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 shadow-sm">
            <LogOut size={16} /> Sair da Conta
         </button>
         <button onClick={() => setShowClearConfirm(true)} className="w-full py-4 bg-rose-50 text-rose-600 dark:bg-rose-950/20 rounded-[1.5rem] font-black text-xs border border-rose-100 dark:border-rose-900 flex items-center justify-center gap-2 shadow-sm">
            <Trash2 size={16} /> Limpar Todos os Dados
         </button>
      </section>

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowClearConfirm(false)} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <AlertCircle size={48} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-3 leading-tight">
                    Tem certeza absoluta?
                 </h3>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    Esta ação irá <span className="text-rose-600 font-black">apagar permanentemente</span> todos os seus ganhos, metas, cartões e configurações. Não há como desfazer!
                 </p>
                 <div className="w-full space-y-3">
                    <button 
                       onClick={handleConfirmClear}
                       className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all"
                    >
                       Sim, Limpar Tudo
                    </button>
                    <button 
                       onClick={() => setShowClearConfirm(false)}
                       className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm active:scale-[0.98] transition-all"
                    >
                       Cancelar e Manter Dados
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {showCardForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={resetCardForm} />
          <form onSubmit={handleAddCardSubmit} className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{editingCardId ? 'Editar' : 'Novo'} Cartão</h3>
                <button type="button" onClick={resetCardForm} className="p-2 text-slate-400"><X size={20}/></button>
             </div>
             <div className="space-y-4">
                <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Nome do Cartão (ex: Nubank)" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-black text-sm dark:text-white focus:outline-none border border-slate-100 dark:border-slate-700 shadow-inner" />
                <input type="number" value={cardLimit} onChange={e => setCardLimit(e.target.value)} placeholder="Limite (opcional)" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl font-black text-sm dark:text-white focus:outline-none border border-slate-100 dark:border-slate-700 shadow-inner" />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cor de Destaque</label>
                   <input type="color" value={cardColor} onChange={e => setCardColor(e.target.value)} className="w-full h-12 rounded-xl cursor-pointer bg-transparent border-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all">
                   Salvar Cartão
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};
