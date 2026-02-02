import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { defaultEvents } from '@/data/calendarData';
import { useToast } from '@/hooks/use-toast';
import { useTracking } from '@/hooks/useTracking';
import { useAuth } from '@/contexts/AuthContext';
import DroppableDayCell from './DroppableDayCell';
import EventModal from './EventModal';
import NewEventModal from './NewEventModal';
import AdminConfirmModal from './AdminConfirmModal';

const statusLabels: Record<string, string> = {
  revisado: 'Revisado',
  producao: 'Em Produção',
  pronto: 'Pronto',
  publicado: 'Publicado',
};

const Calendar = () => {
  const [events, setEvents] = useState<Record<number, CalendarEvent[]>>({});
  const [gravadores, setGravadores] = useState<Record<number, string>>({});
  const [selectedEvent, setSelectedEvent] = useState<{ day: number; index: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [newEventDay, setNewEventDay] = useState<number>(1);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ day: number; index: number } | null>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { trackButtonClick } = useTracking(user?.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Load events from database
  useEffect(() => {
    loadEvents();
    loadGravadores();

    // Subscribe to realtime changes for calendar_events
    const eventsChannel = supabase
      .channel('calendar-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events',
        },
        () => loadEvents()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calendar_events',
        },
        () => loadEvents()
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'calendar_events',
        },
        () => loadEvents()
      )
      .subscribe();

    // Subscribe to realtime changes for calendar_gravadores
    const gravadoresChannel = supabase
      .channel('calendar-gravadores-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_gravadores',
        },
        () => loadGravadores()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(gravadoresChannel);
    };
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase.from('calendar_events').select('*');
    
    if (error) {
      console.error('Error loading events:', error);
      initializeDefaultEvents();
      return;
    }

    if (data && data.length > 0) {
      const groupedEvents: Record<number, CalendarEvent[]> = {};
      data.forEach((event) => {
        if (!groupedEvents[event.day]) {
          groupedEvents[event.day] = [];
        }
        groupedEvents[event.day].push(event as CalendarEvent);
      });
      Object.keys(groupedEvents).forEach((day) => {
        groupedEvents[Number(day)].sort((a, b) => a.event_index - b.event_index);
      });
      setEvents(groupedEvents);
    } else {
      initializeDefaultEvents();
    }
  };

  const initializeDefaultEvents = async () => {
    const eventsToInsert: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>[] = [];
    
    Object.entries(defaultEvents).forEach(([, dayEvents]) => {
      dayEvents.forEach((event) => {
        eventsToInsert.push(event);
      });
    });

    const { error } = await supabase.from('calendar_events').insert(eventsToInsert);
    
    if (error) {
      console.error('Error initializing events:', error);
    }
    
    loadEvents();
  };

  const loadGravadores = async () => {
    const { data, error } = await supabase.from('calendar_gravadores').select('*');
    
    if (!error && data) {
      const gravadoresMap: Record<number, string> = {};
      data.forEach((g) => {
        gravadoresMap[g.day] = g.gravador || '';
      });
      setGravadores(gravadoresMap);
    }
  };

  const updateGravador = async (day: number, value: string) => {
    setGravadores((prev) => ({ ...prev, [day]: value }));
    
    const { error } = await supabase
      .from('calendar_gravadores')
      .upsert({ day, gravador: value }, { onConflict: 'day' });

    if (error) {
      console.error('Error updating gravador:', error);
    }
  };

  const openModal = (day: number, index: number) => {
    trackButtonClick(`event-${day}-${index}`, events[day]?.[index]?.title);
    setSelectedEvent({ day, index });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  const openNewEventModal = (day: number) => {
    setNewEventDay(day);
    setNewEventModalOpen(true);
  };

  const closeNewEventModal = () => {
    setNewEventModalOpen(false);
  };

  const createNewEvent = async (eventData: { platform: string; title: string }) => {
    const day = newEventDay;
    
    // Fetch the current max event_index from the database to avoid conflicts
    const { data: existingEvents, error: fetchError } = await supabase
      .from('calendar_events')
      .select('event_index')
      .eq('day', day)
      .order('event_index', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching events:', fetchError);
      toast({ title: 'Erro', description: 'Erro ao criar evento', variant: 'destructive' });
      return;
    }

    const maxIndex = existingEvents && existingEvents.length > 0 ? existingEvents[0].event_index : -1;
    const eventIndex = maxIndex + 1;

    const newEvent = {
      day,
      event_index: eventIndex,
      platform: eventData.platform,
      title: eventData.title,
      status: null,
    };

    const { data, error } = await supabase
      .from('calendar_events')
      .insert(newEvent)
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      toast({ title: 'Erro', description: 'Erro ao criar evento', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (!newEvents[day]) {
        newEvents[day] = [];
      }
      newEvents[day] = [...newEvents[day], data as CalendarEvent];
      return newEvents;
    });

    toast({ title: 'Sucesso', description: 'Evento criado com sucesso!' });
  };

  const openDeleteModal = (day: number, index: number) => {
    if (!profile?.is_admin) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Apenas administradores podem excluir eventos.', 
        variant: 'destructive' 
      });
      return;
    }
    setEventToDelete({ day, index });
    setDeleteConfirmModalOpen(true);
  };

  const deleteEvent = async () => {
    if (!eventToDelete) return;

    const event = events[eventToDelete.day]?.[eventToDelete.index];
    if (!event || !event.id) return;

    trackButtonClick('delete-event', `Excluir: ${event.title}`);

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', event.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir evento', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[eventToDelete.day]) {
        newEvents[eventToDelete.day] = newEvents[eventToDelete.day].filter((_, i) => i !== eventToDelete.index);
      }
      return newEvents;
    });

    setEventToDelete(null);
    toast({ title: 'Sucesso', description: 'Evento excluído com sucesso!' });
  };

  const updateEventStatus = async (status: string | null) => {
    if (!selectedEvent) return;

    const event = events[selectedEvent.day]?.[selectedEvent.index];
    if (!event || !event.id) return;

    trackButtonClick(`status-${status || 'none'}`, statusLabels[status || ''] || 'Sem Status');

    const { error } = await supabase
      .from('calendar_events')
      .update({ status })
      .eq('id', event.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = {
          ...newEvents[selectedEvent.day][selectedEvent.index],
          status,
        };
      }
      return newEvents;
    });

    toast({ title: 'Sucesso', description: `Status atualizado para ${statusLabels[status || ''] || 'Sem status'}` });
  };

  const savePublicacao = async (link: string) => {
    if (!selectedEvent) return;

    const event = events[selectedEvent.day]?.[selectedEvent.index];
    if (!event || !event.id) return;

    trackButtonClick('save-publicacao', 'Salvar Link Publicação');

    const { error } = await supabase
      .from('calendar_events')
      .update({ publicacao: link })
      .eq('id', event.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar link', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = {
          ...newEvents[selectedEvent.day][selectedEvent.index],
          publicacao: link,
        };
      }
      return newEvents;
    });

    toast({ title: 'Sucesso', description: 'Link salvo com sucesso!' });
  };

  const removePublicacao = async () => {
    if (!selectedEvent) return;

    const event = events[selectedEvent.day]?.[selectedEvent.index];
    if (!event || !event.id) return;

    trackButtonClick('remove-publicacao', 'Remover Link Publicação');

    const { error } = await supabase
      .from('calendar_events')
      .update({ publicacao: null })
      .eq('id', event.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao remover link', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = {
          ...newEvents[selectedEvent.day][selectedEvent.index],
          publicacao: undefined,
        };
      }
      return newEvents;
    });

    toast({ title: 'Sucesso', description: 'Link removido com sucesso!' });
  };

  const saveRoteiro = async (roteiro: string) => {
    if (!selectedEvent) return;

    const event = events[selectedEvent.day]?.[selectedEvent.index];
    if (!event || !event.id) return;

    trackButtonClick('save-roteiro', 'Salvar Roteiro');

    const { error } = await supabase
      .from('calendar_events')
      .update({ roteiro })
      .eq('id', event.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar roteiro', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = {
          ...newEvents[selectedEvent.day][selectedEvent.index],
          roteiro,
        };
      }
      return newEvents;
    });

    toast({ title: 'Sucesso', description: 'Roteiro salvo com sucesso!' });
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const eventData = active.data.current?.event as CalendarEvent | undefined;
    if (eventData) {
      setActiveEvent(eventData);
    }
  };

  // Handle drag end - move event between days
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    
    if (!activeData?.event) return;

    const draggedEvent = activeData.event as CalendarEvent;
    const sourceDay = draggedEvent.day;
    
    // Determine target day
    let targetDay: number;
    
    if (over.id.toString().startsWith('day-')) {
      // Dropped on a day cell
      targetDay = parseInt(over.id.toString().replace('day-', ''));
    } else if (overData?.event) {
      // Dropped on another event
      targetDay = (overData.event as CalendarEvent).day;
    } else {
      return;
    }

    // If same day, just reorder (handled by sortable context)
    if (sourceDay === targetDay) {
      return;
    }

    // Move to different day
    if (!draggedEvent.id) return;

    trackButtonClick('move-event', `Mover: ${draggedEvent.title} para dia ${targetDay}`);

    const targetEvents = events[targetDay] || [];
    const newEventIndex = targetEvents.length;

    // Update in database
    const { error } = await supabase
      .from('calendar_events')
      .update({ 
        day: targetDay, 
        event_index: newEventIndex 
      })
      .eq('id', draggedEvent.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao mover evento', variant: 'destructive' });
      return;
    }

    // Update local state
    setEvents((prev) => {
      const newEvents = { ...prev };
      
      // Remove from source day
      if (newEvents[sourceDay]) {
        newEvents[sourceDay] = newEvents[sourceDay].filter(e => e.id !== draggedEvent.id);
      }
      
      // Add to target day
      if (!newEvents[targetDay]) {
        newEvents[targetDay] = [];
      }
      newEvents[targetDay] = [
        ...newEvents[targetDay],
        { ...draggedEvent, day: targetDay, event_index: newEventIndex }
      ];
      
      return newEvents;
    });

    toast({ 
      title: 'Evento Movido', 
      description: `"${draggedEvent.title}" movido para dia ${String(targetDay).padStart(2, '0')}/02` 
    });
  };

  // Generate calendar grid
  const firstDay = new Date(2026, 1, 1).getDay(); // February 2026
  const daysInMonth = 28;
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getSelectedEventData = () => {
    if (!selectedEvent) return null;
    return events[selectedEvent.day]?.[selectedEvent.index];
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        {/* Calendar container with purple border */}
        <div className="bg-zinc-950 rounded-xl p-4 md:p-5 shadow-2xl border-2 border-purple-600/60">
          {/* Header - Day names */}
          <div className="hidden md:grid grid-cols-7 gap-2 mb-3">
            {dayNames.map((name) => (
              <div
                key={name}
                className="text-center font-bold text-zinc-400 uppercase tracking-widest text-xs py-2"
              >
                {name}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {/* Empty cells for first week alignment */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="hidden md:block min-h-[200px]" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              return (
                <DroppableDayCell
                  key={day}
                  day={day}
                  events={events[day] || []}
                  gravador={gravadores[day] || ''}
                  onGravadorChange={(value) => updateGravador(day, value)}
                  onEventClick={(index) => openModal(day, index)}
                  onAddEvent={() => openNewEventModal(day)}
                  onDeleteEvent={(index) => openDeleteModal(day, index)}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-3 bg-zinc-900 rounded-lg">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Legenda por Status:</div>
            <div className="flex flex-wrap gap-3">
              {[
                { status: 'Sem Status', color: 'bg-zinc-600' },
                { status: 'Revisado', color: 'bg-blue-600' },
                { status: 'Em Produção', color: 'bg-orange-500' },
                { status: 'Pronto', color: 'bg-yellow-400' },
                { status: 'Publicado', color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded ${item.color}`} />
                  <span className="text-xs text-zinc-400">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drag instruction */}
          <div className="mt-3 text-center text-zinc-600 text-xs">
            💡 Arraste os eventos para reorganizar entre dias
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeEvent && (
            <div className="rounded-md p-3 shadow-2xl bg-teal-600 text-white opacity-95 max-w-[180px]">
              <div className="text-[10px] font-bold uppercase mb-1">{activeEvent.platform}</div>
              <div className="text-sm font-semibold">{activeEvent.title}</div>
            </div>
          )}
        </DragOverlay>

        {/* Event Modal */}
        <EventModal
          open={modalOpen}
          onClose={closeModal}
          event={getSelectedEventData()}
          day={selectedEvent?.day || 0}
          gravador={gravadores[selectedEvent?.day || 0]}
          onStatusChange={updateEventStatus}
          onSavePublicacao={savePublicacao}
          onRemovePublicacao={removePublicacao}
          onSaveRoteiro={saveRoteiro}
        />

        {/* New Event Modal */}
        <NewEventModal
          open={newEventModalOpen}
          onClose={closeNewEventModal}
          day={newEventDay}
          onSave={createNewEvent}
        />

        {/* Delete Confirm Modal */}
        <AdminConfirmModal
          open={deleteConfirmModalOpen}
          onClose={() => {
            setDeleteConfirmModalOpen(false);
            setEventToDelete(null);
          }}
          onConfirm={deleteEvent}
          title="Excluir Evento"
          description="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
          confirmLabel="Excluir"
          variant="destructive"
        />
      </div>
    </DndContext>
  );
};

export default Calendar;
