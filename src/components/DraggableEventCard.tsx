import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarEvent } from '@/types/calendar';
import { Trash2, GripVertical } from 'lucide-react';

interface DraggableEventCardProps {
  event: CalendarEvent;
  index: number;
  onEventClick: (index: number) => void;
  onDeleteEvent: (index: number) => void;
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

const DraggableEventCard: React.FC<DraggableEventCardProps> = ({
  event,
  index,
  onEventClick,
  onDeleteEvent,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: event.id || `event-${event.day}-${index}`,
    data: {
      event,
      index,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-md p-3 mb-3 cursor-pointer transition-all duration-300
        hover:shadow-lg relative group
        ${event.status ? statusClasses[event.status] : 'bg-white text-zinc-900'}
        ${isDragging ? 'opacity-50 shadow-2xl scale-105 z-50' : 'hover:scale-[1.02]'}
      `}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 w-6 h-6 rounded flex items-center justify-center cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
        title="Arraste para mover"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div onClick={() => onEventClick(index)} className="pl-6 pr-6">
        <div className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mb-2 bg-black/20">
          {event.platform}
        </div>
        <div className="text-sm font-semibold leading-relaxed">{event.title}</div>
        {event.status && (
          <div className="text-xs font-bold uppercase mt-2 opacity-90 tracking-wide">
            {statusLabels[event.status]}
          </div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteEvent(index);
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
        title="Excluir evento"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export default DraggableEventCard;
