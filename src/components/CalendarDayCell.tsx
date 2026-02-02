import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface CalendarDayCellProps {
  day: number;
  events: CalendarEvent[];
  gravador: string;
  onGravadorChange: (value: string) => void;
  onEventClick: (index: number) => void;
  onAddEvent: () => void;
}

const statusClasses: Record<string, string> = {
  revisado: 'bg-psiviver-azul text-white',
  producao: 'bg-psiviver-laranja text-white',
  pronto: 'bg-psiviver-amarelo text-foreground',
  publicado: 'bg-psiviver-verde text-white',
};

const statusLabels: Record<string, string> = {
  revisado: 'Revisado',
  producao: 'Em Produção',
  pronto: 'Pronto',
  publicado: 'Publicado',
};

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  events,
  gravador,
  onGravadorChange,
  onEventClick,
  onAddEvent,
}) => {
  return (
    <div className="bg-muted rounded-lg min-h-[140px] p-3 border-2 border-transparent hover:border-primary transition-all duration-300 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-lg text-primary">
          {String(day).padStart(2, '0')}/02/26
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddEvent();
          }}
          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
          title="Adicionar novo evento"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <Input
        type="text"
        placeholder="Gravador..."
        value={gravador}
        onChange={(e) => onGravadorChange(e.target.value)}
        className="w-full h-8 text-xs mb-2 bg-card/50 border-primary/30"
      />

      {events.map((event, index) => (
        <div
          key={index}
          onClick={() => onEventClick(index)}
          className={`
            rounded-md p-2 mb-2 cursor-pointer transition-all duration-300
            hover:scale-[1.02] hover:shadow-lg
            ${event.status ? statusClasses[event.status] : 'bg-white text-zinc-900'}
          `}
        >
          <div className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mb-1 bg-black/20">
            {event.platform}
          </div>
          <div className="text-sm font-semibold">{event.title}</div>
          {event.status && (
            <div className="text-xs font-bold uppercase mt-1 opacity-90 tracking-wide">
              {statusLabels[event.status]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CalendarDayCell;
