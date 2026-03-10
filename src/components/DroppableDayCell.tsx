import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CalendarEvent } from '@/types/calendar';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import DraggableEventCard from './DraggableEventCard';

interface DroppableDayCellProps {
  day: number;
  month: number;
  year: number;
  events: CalendarEvent[];
  gravador: string;
  onGravadorChange: (value: string) => void;
  onEventClick: (index: number) => void;
  onAddEvent: () => void;
  onDeleteEvent: (index: number) => void;
  onDuplicateEvent: (index: number) => void;
}

const DroppableDayCell: React.FC<DroppableDayCellProps> = ({
  day,
  month,
  year,
  events,
  gravador,
  onGravadorChange,
  onEventClick,
  onAddEvent,
  onDeleteEvent,
  onDuplicateEvent,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: { day },
  });

  const today = new Date();
  const isToday = today.getDate() === day && today.getMonth() + 1 === month && today.getFullYear() === year;

  const eventIds = events.map((e, idx) => e.id || `event-${day}-${idx}`);

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-zinc-900 rounded-lg min-h-[200px] p-3 flex flex-col transition-all duration-300
        ${isOver ? 'ring-2 ring-primary bg-zinc-800 scale-[1.02]' : ''}
        ${isToday ? 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] bg-gradient-to-br from-purple-900/60 via-purple-800/40 to-emerald-900/50' : ''}
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="font-bold text-base text-teal-400">
          {String(day).padStart(2, '0')}/{String(month).padStart(2, '0')}/26
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAddEvent();
          }}
          className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors opacity-60 hover:opacity-100"
          title="Adicionar novo evento"
          type="button"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <Input
        type="text"
        placeholder="Gravador..."
        value={gravador}
        onChange={(e) => onGravadorChange(e.target.value)}
        className="w-full h-8 text-xs mb-3 bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-500"
      />

      <div className="flex-1 space-y-2">
        <SortableContext items={eventIds} strategy={verticalListSortingStrategy}>
          {events.map((event, index) => (
            <DraggableEventCard
              key={event.id || `event-${day}-${index}`}
              event={event}
              index={index}
              onEventClick={onEventClick}
              onDeleteEvent={onDeleteEvent}
              onDuplicateEvent={onDuplicateEvent}
            />
          ))}
        </SortableContext>
      </div>

      {events.length === 0 && (
        <div className="text-center text-zinc-600 text-xs py-4">
          Arraste eventos para cá
        </div>
      )}
    </div>
  );
};

export default DroppableDayCell;
