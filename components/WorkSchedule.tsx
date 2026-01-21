
import React, { useState } from 'react';
import { WorkSchedule as WorkScheduleType, WorkDay, Shift } from '../types';
import { Menu, AlertCircle, Info, MapPin, Plus, Trash2, Calendar, Clock, ChevronRight, CheckCircle2 } from './Icons';
import { v4 as uuidv4 } from 'uuid';

interface WorkScheduleProps {
  workSchedule: WorkScheduleType;
  onUpdateSchedule: (schedule: WorkScheduleType) => void;
  onOpenMenu: () => void;
}

const WEEK_DAYS = [
  { key: 'segunda', label: 'Seg', full: 'Segunda-feira' },
  { key: 'terça', label: 'Ter', full: 'Terça-feira' },
  { key: 'quarta', label: 'Qua', full: 'Quarta-feira' },
  { key: 'quinta', label: 'Qui', full: 'Quinta-feira' },
  { key: 'sexta', label: 'Sex', full: 'Sexta-feira' },
  { key: 'sábado', label: 'Sáb', full: 'Sábado' },
  { key: 'domingo', label: 'Dom', full: 'Domingo' },
];

export const WorkSchedule: React.FC<WorkScheduleProps> = ({ workSchedule, onUpdateSchedule, onOpenMenu }) => {
  const [activeDay, setActiveDay] = useState<string>(() => {
    const today = new Date().getDay(); // 0 (Dom) to 6 (Sab)
    const map = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return map[today];
  });

  const handleUpdateDay = (day: string, updates: Partial<WorkDay>) => {
    onUpdateSchedule({
      ...workSchedule,
      [day]: { ...workSchedule[day], ...updates }
    });
  };

  const addShift = (day: string) => {
    const currentShifts = workSchedule[day].shifts || [];
    const newShift: Shift = { id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' };
    handleUpdateDay(day, { shifts: [...currentShifts, newShift], isWorkDay: true });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const removeShift = (day: string, shiftId: string) => {
    const currentShifts = workSchedule[day].shifts || [];
    const newShifts = currentShifts.filter(s => s.id !== shiftId);
    handleUpdateDay(day, { 
      shifts: newShifts,
      isWorkDay: newShifts.length > 0 ? workSchedule[day].isWorkDay : false
    });
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const updateShift = (day: string, shiftId: string, updates: Partial<Shift>) => {
    const newShifts = workSchedule[day].shifts.map(s => 
      s.id === shiftId ? { ...s, ...updates } : s
    );
    handleUpdateDay(day, { shifts: newShifts });
  };

  const currentDayData = workSchedule[activeDay];
  const activeDayInfo = WEEK_DAYS.find(d => d.key === activeDay)!;

  return (
    <div className="flex flex-col gap-6 pb-28 pt-4">
      {/* Header */}
      <header className="px-2 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Cronograma</h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 ml-3.5">Minha Rotina Semanal</p>
        </div>
        <button 
          onClick={onOpenMenu}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-90 transition-all"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Week Calendar Bar */}
      <section className="px-2">
        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex justify-between items-center overflow-hidden">
          {WEEK_DAYS.map((day) => {
            const isActive = activeDay === day.key;
            const isWorking = workSchedule[day.key].isWorkDay;
            return (
              <button
                key={day.key}
                onClick={() => {
                  setActiveDay(day.key);
                  if (navigator.vibrate) navigator.vibrate(8);
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-3xl transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-110 z-10' 
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-60' : ''}`}>{day.label}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-white dark:bg-slate-900 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Day Detail Card */}
      <section className="px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`p-6 rounded-[3rem] border transition-all duration-500 ${
          currentDayData.isWorkDay 
            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]' 
            : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-lg transition-all duration-500 ${
                currentDayData.isWorkDay 
                  ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                {activeDayInfo.label}
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{activeDayInfo.full}</h2>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className={`w-2 h-2 rounded-full ${currentDayData.isWorkDay ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                   <p className={`text-[10px] font-black uppercase tracking-widest ${currentDayData.isWorkDay ? 'text-emerald-500' : 'text-slate-400'}`}>
                     {currentDayData.isWorkDay ? 'Dia Ativo' : 'Folga'}
                   </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                const nextState = !currentDayData.isWorkDay;
                const newShifts = (nextState && (!currentDayData.shifts || currentDayData.shifts.length === 0)) 
                  ? [{ id: uuidv4(), startTime: '08:00', endTime: '18:00', location: '' }]
                  : currentDayData.shifts;
                handleUpdateDay(activeDay, { isWorkDay: nextState, shifts: newShifts });
              }}
              className={`w-14 h-8 rounded-full transition-all flex items-center px-1 border-2 ${currentDayData.isWorkDay ? 'bg-emerald-500 border-emerald-400 justify-end shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 justify-start'}`}
            >
              <div className={`w-5.5 h-5.5 rounded-full shadow-md transition-all ${currentDayData.isWorkDay ? 'bg-white' : 'bg-slate-400 dark:bg-slate-600'}`} />
            </button>
          </div>

          {currentDayData.isWorkDay ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Turnos do Dia</h3>
                 <button 
                    onClick={() => addShift(activeDay)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-100/50 dark:border-emerald-800/30 active:scale-95 transition-all"
                 >
                    <Plus size={12} strokeWidth={3} /> Adicionar
                 </button>
              </div>

              {currentDayData.shifts.length > 0 ? (
                currentDayData.shifts.map((shift, idx) => {
                  const isOvernight = shift.startTime > shift.endTime;
                  return (
                    <div key={shift.id} className="relative p-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-[2.25rem] border border-slate-100/50 dark:border-slate-700/30 shadow-inner group">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-slate-400">
                              <Clock size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Horário {idx + 1}</span>
                           </div>
                           {currentDayData.shifts.length > 1 && (
                             <button onClick={() => removeShift(activeDay, shift.id)} className="text-rose-400 p-1"><Trash2 size={16}/></button>
                           )}
                        </div>

                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <input 
                              type="time" 
                              value={shift.startTime}
                              onChange={e => updateShift(activeDay, shift.id, { startTime: e.target.value })}
                              className="bg-transparent font-black text-lg text-slate-900 dark:text-white focus:outline-none w-full text-center py-2"
                           />
                           <div className="w-[2px] h-6 bg-slate-100 dark:bg-slate-800" />
                           <input 
                              type="time" 
                              value={shift.endTime}
                              onChange={e => updateShift(activeDay, shift.id, { endTime: e.target.value })}
                              className={`bg-transparent font-black text-lg focus:outline-none w-full text-center py-2 ${isOvernight ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}
                           />
                        </div>

                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                            <MapPin size={18} />
                          </div>
                          <input 
                            type="text"
                            placeholder="Local de Base / Início"
                            value={shift.location || ''}
                            onChange={e => updateShift(activeDay, shift.id, { location: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 p-4 pl-12 rounded-2xl font-black text-xs text-slate-900 dark:text-white focus:outline-none border border-slate-200 dark:border-slate-700 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          />
                        </div>
                        
                        {isOvernight && (
                          <div className="flex items-center gap-2 pl-2 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50/50 dark:bg-amber-900/10 py-2 px-4 rounded-xl">
                            <AlertCircle size={14} strokeWidth={3} /> Vira a madrugada
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-40">
                   <Clock size={40} className="mx-auto mb-2 text-slate-300" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Nenhum turno definido</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                  <Calendar size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Folga Merecida</h3>
               <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[200px] mt-2 leading-relaxed">
                 Aproveite para descansar e recarregar as energias para o próximo corre!
               </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Info Card */}
      <div className="px-3 pb-8">
        <div className="bg-indigo-600 p-8 rounded-[3rem] border border-indigo-400 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Info size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black text-indigo-100 uppercase tracking-[0.2em] mb-2 opacity-80">Dica de Produtividade</p>
              <p className="text-sm font-black text-white leading-relaxed tracking-tight">
                Manter uma rotina organizada ajuda você a atingir suas metas diárias com até 30% mais eficiência. Use o cronograma a seu favor!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
