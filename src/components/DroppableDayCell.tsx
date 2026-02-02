import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CalendarEvent } from '@/types/calendar';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import DraggableEventCard from './DraggableEventCard';

interface DroppableDayCellProps {
  day: number;
  events: CalendarEvent[];
  gravador: string;
  onGravadorChange: (value: string) => void;
  onEventClick: (index: number) => void;
  onAddEvent: () => void;
  onDeleteEvent: (index: number) => void;
}

const DroppableDayCell: React.FC<DroppableDayCellProps> = ({
  day,
  events,
  gravador,
  onGravadorChange,
  onEventClick,
  onAddEvent,
  onDeleteEvent,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day}`,
    data: {
      day,
    },
  });

  const eventIds = events.map((e, idx) => e.id || `event-${day}-${idx}`);

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-muted rounded-lg min-h-[180px] p-4 border-2 transition-all duration-300
        ${isOver ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-transparent hover:border-primary/50'}
        hover:-translate-y-1
      `}
    >
      <div className="flex justify-between items-start mb-3">
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
        className="w-full h-8 text-xs mb-3 bg-card/50 border-primary/30"
      />

      <SortableContext items={eventIds} strategy={verticalListSortingStrategy}>
        {events.map((event, index) => (
          <DraggableEventCard
            key={event.id || `event-${day}-${index}`}
            event={event}
            index={index}
            onEventClick={onEventClick}
            onDeleteEvent={onDeleteEvent}
          />
        ))}
      </SortableContext>

      {events.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4 opacity-50">
          Arraste eventos para cá
        </div>
      )}
    </div>
  );
};

export default DroppableDayCell;
