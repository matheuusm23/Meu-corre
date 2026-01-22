
import React, { useState, useMemo } from 'react';
import { Transaction, PlannedMaintenance, GoalSettings } from '../types';
import { formatCurrency, getBillingPeriodRange, parseDateLocal, getISODate } from '../utils';
import { Menu, Wrench, Plus, Trash2, X, CheckCircle2, TrendingDown, Info, ShoppingBag, Eye, Calendar, Clock, AlertCircle } from './Icons';
import { v4 as uuidv4 } from 'uuid';

interface MaintenanceProps {
  transactions: Transaction[];
  goalSettings: GoalSettings;
  plannedMaintenances: PlannedMaintenance[];
  onUpdatePlanned: (items: PlannedMaintenance[]) => void;
  onOpenMenu: () => void;
}

export const Maintenance: React.FC<MaintenanceProps> = ({
  transactions,
  goalSettings,
  plannedMaintenances,
  onUpdatePlanned,
  onOpenMenu
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newTargetDate, setNewTargetDate] = useState(getISODate(new Date()));

  const currentYear = new Date().getFullYear();

  // Cálculo do Ciclo Atual
  const { startDate, endDate } = useMemo(() => {
    return getBillingPeriodRange(new Date(), goalSettings.startDayOfMonth, goalSettings.endDayOfMonth);
  }, [goalSettings.startDayOfMonth, goalSettings.endDayOfMonth]);

  const totalSpentInCycle = useMemo(() => {
    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const tDate = parseDateLocal(t.date);
        const isMaintenance = t.description.toLowerCase().includes('manutenção');
        return isMaintenance && tDate >= startDate && tDate <= endDate;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, startDate, endDate]);

  // Histórico Anual por Mês
  const yearlyMonthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      monthName: new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(currentYear, i)),
      value: 0
    }));

    transactions.forEach(t => {
      if (t.type === 'expense' && t.description.toLowerCase().includes('manutenção')) {
        const tDate = parseDateLocal(t.date);
        if (tDate.getFullYear() === currentYear) {
          data[tDate.getMonth()].value += t.amount;
        }
      }
    });

    return data;
  }, [transactions, currentYear]);

  const totalPlannedValue = useMemo(() => {
    return plannedMaintenances.reduce((acc, item) => acc + item.estimatedValue, 0);
  }, [plannedMaintenances]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newValue) return;

    const newItem: PlannedMaintenance = {
      id: uuidv4(),
      description: newDesc,
      estimatedValue: parseFloat(newValue) || 0,
      isDone: false,
      targetDate: newTargetDate
    };

    onUpdatePlanned([...plannedMaintenances, newItem].sort((a,b) => (a.targetDate || '').localeCompare(b.targetDate || '')));
    setNewDesc('');
    setNewValue('');
    setNewTargetDate(getISODate(new Date()));
    setShowAddModal(false);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleRemoveItem = (id: string) => {
    onUpdatePlanned(plannedMaintenances.filter(item => item.id !== id));
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const handleToggleDone = (id: string) => {
    onUpdatePlanned(plannedMaintenances.map(item => 
      item.id === id ? { ...item, isDone: !item.isDone } : item
    ));
    if (navigator.vibrate) navigator.vibrate(8);
  };

  return (
    <div className="flex flex-col gap-5 pb-28 pt-4">
      {/* Header CompactO */}
      <header className="px-2 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Manutenção</h1>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1.5 ml-3">Saúde da Moto</p>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* Resumo do Ciclo Atual - Design Aumentado Moderadamente */}
      <section className="px-2">
        <div className="bg-slate-900 dark:bg-white p-6 rounded-[2.5rem] border border-slate-700 dark:border-slate-100 shadow-xl relative overflow-hidden group transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Wrench size={28} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-white/50 dark:text-slate-400 uppercase tracking-[0.25em] mb-1">Gasto no Ciclo</p>
                <h2 className="text-3xl font-black text-white dark:text-slate-900 tracking-tighter leading-none">
                  {formatCurrency(totalSpentInCycle)}
                </h2>
              </div>
            </div>
            
            <button 
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 dark:bg-slate-100 rounded-2xl border border-white/10 dark:border-slate-200 text-emerald-400 dark:text-emerald-600 active:scale-95 transition-all shadow-lg backdrop-blur-md"
              title="Ver Histórico Anual"
            >
              <Eye size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest leading-none">Ver mais</span>
            </button>
          </div>
        </div>
      </section>

      {/* Planejamento Unificado ("Mais Conjunto") */}
      <section className="px-2 space-y-3">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <ShoppingBag size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plano de Reparos</h3>
           </div>
           <button 
             onClick={() => setShowAddModal(true)}
             className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-100/50 dark:border-emerald-800/30 active:scale-95 transition-all"
           >
             <Plus size={10} strokeWidth={3} /> Adicionar
           </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          {plannedMaintenances.length > 0 ? (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {plannedMaintenances.map((item) => (
                <div key={item.id} className={`flex items-center justify-between transition-all ${item.isDone ? 'bg-slate-50/50 dark:bg-slate-950/20 opacity-60' : ''}`}>
                   <div className="flex items-center gap-3 flex-1 min-w-0 p-3.5" onClick={() => handleToggleDone(item.id)}>
                      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all ${item.isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                         {item.isDone ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>
                      <div className="min-w-0">
                         <p className={`text-xs font-black dark:text-white tracking-tight truncate leading-none mb-1 ${item.isDone ? 'line-through opacity-50' : ''}`}>
                           {item.description}
                         </p>
                         <div className="flex items-center gap-2">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                             {formatCurrency(item.estimatedValue)}
                           </span>
                           {item.targetDate && (
                             <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                               <Calendar size={9} />
                               {item.targetDate.split('-').reverse().slice(0,2).join('/')}
                             </div>
                           )}
                         </div>
                      </div>
                   </div>
                   <button onClick={() => handleRemoveItem(item.id)} className="p-3.5 text-rose-300 hover:text-rose-500 transition-colors active:scale-90">
                      <Trash2 size={16} />
                   </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center opacity-40">
               <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <Wrench size={20} className="text-slate-300" />
               </div>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                 Sem planos ativos.
               </p>
            </div>
          )}
          
          {/* Somatória Planejada Embutida na Lista */}
          {plannedMaintenances.length > 0 && (
            <div className="bg-slate-50/50 dark:bg-slate-800/20 p-3.5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Custo Total do Plano</span>
               <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">
                  {formatCurrency(totalPlannedValue)}
               </span>
            </div>
          )}
        </div>
      </section>

      {/* Dicas e Avisos */}
      <div className="px-3 space-y-3">
        {/* Dica Compacta */}
        <div className="bg-indigo-600/5 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
           <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
           <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
             Mantenha o plano atualizado para evitar gastos surpresas com peças de desgaste natural.
           </p>
        </div>

        {/* Aviso de Notificação */}
        <div className="bg-rose-500/5 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-900/30 flex items-start gap-3">
           <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
           <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
             Quando você incluir um planejamento de manutenção iremos sempre te lembrar com o sinal de notificação no menu lateral.
           </p>
        </div>
      </div>

      {/* Modal de Histórico Anual */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowHistoryModal(false)} />
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[75vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Análise Anual</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Gastos Mensais em {currentYear}</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-4">
                 {yearlyMonthlyData.map((data, idx) => (
                   <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                            <Calendar size={14} className="text-slate-400" />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mês {idx + 1}</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white capitalize leading-none">{data.monthName}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-sm font-black tracking-tighter ${data.value > 0 ? 'text-rose-500' : 'text-slate-300'}`}>
                           {formatCurrency(data.value)}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-2 shrink-0">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Acumulado Ano</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                       {formatCurrency(yearlyMonthlyData.reduce((a, b) => a + b.value, 0))}
                    </span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Modal de Adição de Planejamento */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
           <form onSubmit={handleAddItem} className="relative bg-white dark:bg-slate-900 w-full max-sm p-6 rounded-[2.25rem] shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none">Novo Planejamento</h3>
                 <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Manutenção / Peça</label>
                    <input 
                      type="text" 
                      required
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Ex: Troca de relação, Pneu..."
                      className="w-full bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-100 dark:border-slate-700 shadow-inner focus:ring-2 focus:ring-emerald-500/20"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Custo Est.</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            required
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            placeholder="0,00"
                            className="w-full bg-slate-50 dark:bg-slate-800 p-3.5 pl-8 rounded-2xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-100 dark:border-slate-700 shadow-inner focus:ring-2 focus:ring-emerald-500/20"
                          />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Data Limite</label>
                       <input 
                         type="date"
                         required
                         value={newTargetDate}
                         onChange={e => setNewTargetDate(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-100 dark:border-slate-700 shadow-inner focus:ring-2 focus:ring-emerald-500/20"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all mt-4"
                 >
                   Confirmar
                 </button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};
