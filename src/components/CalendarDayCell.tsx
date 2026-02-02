import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Input } from '@/components/ui/input';

interface CalendarDayCellProps {
  day: number;
  events: CalendarEvent[];
  gravador: string;
  onGravadorChange: (value: string) => void;
  onEventClick: (index: number) => void;
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
}) => {
  return (
    <div className="bg-muted rounded-lg min-h-[140px] p-3 border-2 border-transparent hover:border-primary transition-all duration-300 hover:-translate-y-1">
      <div className="font-bold text-lg mb-2 text-primary">
        {String(day).padStart(2, '0')}/02/26
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
            ${event.status ? statusClasses[event.status] : 'bg-white text-foreground'}
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
