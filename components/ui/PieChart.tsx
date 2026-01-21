import React from 'react';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
}

export const ExpensePieChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 mb-4 flex items-center justify-center">
           <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Sem Gastos</span>
        </div>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Layout semi-círculo (180 graus) para atender ao pedido de "metade"
  const internalSize = 240; 
  const center = internalSize / 2;
  const radius = 90;
  const thickness = 35;
  
  // No semi-círculo, a circunferência é PI * R
  const circumference = Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-[2/1] max-w-[280px] mb-6 overflow-hidden">
        <svg viewBox={`0 0 ${internalSize} ${internalSize / 2}`} className="w-full h-full">
          {sortedData.map((item, i) => {
            const percent = item.value / total;
            // Stroke dasharray format: "dash gap"
            // No semi-círculo, desenhamos de 0 a 100% de PI*R
            const dashArray = `${percent * circumference} ${circumference * 2}`;
            const dashOffset = -accumulatedPercent * circumference;
            
            accumulatedPercent += percent;

            return (
              <circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                // Rotacionamos -180 para começar da esquerda
                transform={`rotate(-180 ${center} ${center})`}
                className="transition-all duration-1000 ease-in-out"
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        
        {/* Info Central na Base do Semi-Círculo */}
        <div className="absolute bottom-2 inset-x-0 flex flex-col items-center justify-center pointer-events-none">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Gasto Total</p>
           <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total)}
           </p>
        </div>
      </div>

      {/* Legenda com Porcentagens Individuais e Cores Sólidas */}
      <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
        {sortedData.map((item) => {
          const individualPercent = Math.round((item.value / total) * 100);
          return (
            <div key={item.label} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate">{item.label}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                 <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(item.value)}
                 </span>
                 <span className="text-[11px] font-black text-slate-500 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                    {individualPercent}%
                 </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};