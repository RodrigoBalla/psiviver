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

// Status-based colors
const statusColors: Record<string, string> = {
  'revisado': 'bg-blue-600 text-white',
  'producao': 'bg-orange-500 text-white',
  'pronto': 'bg-yellow-400 text-zinc-900',
  'publicado': 'bg-green-500 text-white',
};

const defaultColor = 'bg-zinc-600 text-white'; // Sem status

const statusLabels: Record<string, string> = {
  revisado: 'REVISADO',
  producao: 'EM PRODUÇÃO',
  pronto: 'PRONTO',
  publicado: 'PUBLICADO',
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

  const cardColor = event.status ? statusColors[event.status] || defaultColor : defaultColor;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        rounded-md p-2.5 cursor-pointer transition-all duration-200
        relative group ${cardColor}
        ${isDragging ? 'opacity-50 shadow-2xl scale-105 z-50' : 'hover:brightness-110'}
      `}
    >
      {/* Drag handle - visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 w-5 h-5 rounded flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
        title="Arraste para mover"
      >
        <GripVertical className="w-3 h-3" />
      </div>

      <div onClick={() => onEventClick(index)} className="space-y-1">
        {/* Platform badge */}
        <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-black/20">
          {event.platform}
        </div>
        
        {/* Title */}
        <div className="text-sm font-medium leading-snug pr-5">
          {event.title}
        </div>
        
        {/* Status label */}
        {event.status && (
          <div className="text-[10px] font-bold uppercase tracking-wide mt-1 opacity-80">
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
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        title="Excluir evento"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

export default DraggableEventCard;
