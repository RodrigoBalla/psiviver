import React, { useState, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const MONTHS = [
  { value: 2, label: 'Fevereiro', days: 28, year: 2026 },
  { value: 3, label: 'Março', days: 31, year: 2026 },
  { value: 4, label: 'Abril', days: 30, year: 2026 },
  { value: 5, label: 'Maio', days: 31, year: 2026 },
];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(2);
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
      activationConstraint: { distance: 8 },
    })
  );

  const monthInfo = MONTHS.find((m) => m.value === currentMonth)!;

  // Load events from database
  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('month', currentMonth);

    if (error) {
      console.error('Error loading events:', error);
      if (currentMonth === 2) initializeDefaultEvents();
      return;
    }

    if (data && data.length > 0) {
      const groupedEvents: Record<number, CalendarEvent[]> = {};
      data.forEach((event) => {
        if (!groupedEvents[event.day]) groupedEvents[event.day] = [];
        groupedEvents[event.day].push(event as CalendarEvent);
      });
      Object.keys(groupedEvents).forEach((day) => {
        groupedEvents[Number(day)].sort((a, b) => a.event_index - b.event_index);
      });
      setEvents(groupedEvents);
    } else {
      if (currentMonth === 2) {
        initializeDefaultEvents();
      } else {
        setEvents({});
      }
    }
  }, [currentMonth]);

  const loadGravadores = useCallback(async () => {
    const query = supabase
      .from('calendar_gravadores')
      .select('*') as any;
    const { data, error } = await query.eq('month', currentMonth);

    if (!error && data) {
      const gravadoresMap: Record<number, string> = {};
      data.forEach((g) => {
        gravadoresMap[g.day] = g.gravador || '';
      });
      setGravadores(gravadoresMap);
    } else {
      setGravadores({});
    }
  }, [currentMonth]);

  useEffect(() => {
    loadEvents();
    loadGravadores();

    const eventsChannel = supabase
      .channel(`calendar-events-realtime-${currentMonth}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => loadEvents())
      .subscribe();

    const gravadoresChannel = supabase
      .channel(`calendar-gravadores-realtime-${currentMonth}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_gravadores' }, () => loadGravadores())
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(gravadoresChannel);
    };
  }, [currentMonth, loadEvents, loadGravadores]);

  const initializeDefaultEvents = async () => {
    const eventsToInsert: any[] = [];
    Object.entries(defaultEvents).forEach(([, dayEvents]) => {
      dayEvents.forEach((event) => {
        eventsToInsert.push({ ...event, month: 2 });
      });
    });

    const { error } = await supabase.from('calendar_events').insert(eventsToInsert);
    if (error) console.error('Error initializing events:', error);
    loadEvents();
  };

  const updateGravador = async (day: number, value: string) => {
    setGravadores((prev) => ({ ...prev, [day]: value }));
    const { error } = await supabase
      .from('calendar_gravadores')
      .upsert({ day, month: currentMonth, gravador: value }, { onConflict: 'day,month' });
    if (error) console.error('Error updating gravador:', error);
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

  const closeNewEventModal = () => setNewEventModalOpen(false);

  const createNewEvent = async (eventData: { platform: string; title: string }) => {
    const day = newEventDay;
    const query = supabase
      .from('calendar_events')
      .select('event_index')
      .eq('day', day) as any;
    const { data: existingEvents, error: fetchError } = await query
      .eq('month', currentMonth)
      .order('event_index', { ascending: false })
      .limit(1);

    if (fetchError) {
      toast({ title: 'Erro', description: 'Erro ao criar evento', variant: 'destructive' });
      return;
    }

    const maxIndex = existingEvents && existingEvents.length > 0 ? existingEvents[0].event_index : -1;
    const newEvent = {
      day,
      month: currentMonth,
      event_index: maxIndex + 1,
      platform: eventData.platform,
      title: eventData.title,
      status: null,
    };

    const { data, error } = await supabase.from('calendar_events').insert(newEvent).select().single();
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao criar evento', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (!newEvents[day]) newEvents[day] = [];
      newEvents[day] = [...newEvents[day], data as CalendarEvent];
      return newEvents;
    });
    toast({ title: 'Sucesso', description: 'Evento criado com sucesso!' });
  };

  const duplicateEvent = async (day: number, index: number) => {
    const event = events[day]?.[index];
    if (!event) return;

    trackButtonClick('duplicate-event', `Duplicar: ${event.title}`);

    const dupQuery = supabase
      .from('calendar_events')
      .select('event_index')
      .eq('day', day) as any;
    const { data: existingEvents } = await dupQuery
      .eq('month', currentMonth)
      .order('event_index', { ascending: false })
      .limit(1);

    const maxIndex = existingEvents && existingEvents.length > 0 ? existingEvents[0].event_index : -1;

    const newEvent = {
      day,
      month: currentMonth,
      event_index: maxIndex + 1,
      platform: event.platform,
      title: event.title,
      status: event.status,
      roteiro: event.roteiro || null,
      publicacao: null,
    };

    const { data, error } = await supabase.from('calendar_events').insert(newEvent).select().single();
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao duplicar evento', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (!newEvents[day]) newEvents[day] = [];
      newEvents[day] = [...newEvents[day], data as CalendarEvent];
      return newEvents;
    });
    toast({ title: 'Sucesso', description: `Evento "${event.title}" duplicado!` });
  };

  const openDeleteModal = (day: number, index: number) => {
    if (!profile?.is_admin) {
      toast({ title: 'Acesso Negado', description: 'Apenas administradores podem excluir eventos.', variant: 'destructive' });
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
    const { error } = await supabase.from('calendar_events').delete().eq('id', event.id);
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
    const { error } = await supabase.from('calendar_events').update({ status }).eq('id', event.id);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = { ...newEvents[selectedEvent.day][selectedEvent.index], status };
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
    const { error } = await supabase.from('calendar_events').update({ publicacao: link }).eq('id', event.id);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar link', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = { ...newEvents[selectedEvent.day][selectedEvent.index], publicacao: link };
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
    const { error } = await supabase.from('calendar_events').update({ publicacao: null }).eq('id', event.id);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao remover link', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = { ...newEvents[selectedEvent.day][selectedEvent.index], publicacao: undefined };
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
    const { error } = await supabase.from('calendar_events').update({ roteiro }).eq('id', event.id);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar roteiro', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[selectedEvent.day]) {
        newEvents[selectedEvent.day] = [...newEvents[selectedEvent.day]];
        newEvents[selectedEvent.day][selectedEvent.index] = { ...newEvents[selectedEvent.day][selectedEvent.index], roteiro };
      }
      return newEvents;
    });
    toast({ title: 'Sucesso', description: 'Roteiro salvo com sucesso!' });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current?.event as CalendarEvent | undefined;
    if (eventData) setActiveEvent(eventData);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (!activeData?.event) return;

    const draggedEvent = activeData.event as CalendarEvent;
    const sourceDay = draggedEvent.day;

    let targetDay: number;
    if (over.id.toString().startsWith('day-')) {
      targetDay = parseInt(over.id.toString().replace('day-', ''));
    } else if (overData?.event) {
      targetDay = (overData.event as CalendarEvent).day;
    } else {
      return;
    }

    if (sourceDay === targetDay) return;
    if (!draggedEvent.id) return;

    trackButtonClick('move-event', `Mover: ${draggedEvent.title} para dia ${targetDay}`);
    const targetEvents = events[targetDay] || [];
    const newEventIndex = targetEvents.length;

    const { error } = await supabase
      .from('calendar_events')
      .update({ day: targetDay, event_index: newEventIndex })
      .eq('id', draggedEvent.id);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao mover evento', variant: 'destructive' });
      return;
    }

    setEvents((prev) => {
      const newEvents = { ...prev };
      if (newEvents[sourceDay]) {
        newEvents[sourceDay] = newEvents[sourceDay].filter((e) => e.id !== draggedEvent.id);
      }
      if (!newEvents[targetDay]) newEvents[targetDay] = [];
      newEvents[targetDay] = [...newEvents[targetDay], { ...draggedEvent, day: targetDay, event_index: newEventIndex }];
      return newEvents;
    });

    toast({
      title: 'Evento Movido',
      description: `"${draggedEvent.title}" movido para dia ${String(targetDay).padStart(2, '0')}/${String(currentMonth).padStart(2, '0')}`,
    });
  };

  // Calendar grid calculations
  const firstDay = new Date(2026, currentMonth - 1, 1).getDay();
  const daysInMonth = monthInfo.days;

  const getSelectedEventData = () => {
    if (!selectedEvent) return null;
    return events[selectedEvent.day]?.[selectedEvent.index];
  };

  return (
    <div>
      {/* Month Tabs */}
      <Tabs
        value={String(currentMonth)}
        onValueChange={(v) => setCurrentMonth(Number(v))}
        className="mb-4"
      >
        <TabsList className="bg-zinc-900 border border-purple-600/40">
          {MONTHS.map((m) => (
            <TabsTrigger
              key={m.value}
              value={String(m.value)}
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-zinc-400"
            >
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div>
          <div className="bg-zinc-950 rounded-xl p-4 md:p-5 shadow-2xl border-2 border-purple-600/60">
            {/* Header - Day names */}
            <div className="hidden md:grid grid-cols-7 gap-2 mb-3">
              {dayNames.map((name) => (
                <div key={name} className="text-center font-bold text-zinc-400 uppercase tracking-widest text-xs py-2">
                  {name}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="hidden md:block min-h-[200px]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <DroppableDayCell
                    key={day}
                    day={day}
                    month={currentMonth}
                    events={events[day] || []}
                    gravador={gravadores[day] || ''}
                    onGravadorChange={(value) => updateGravador(day, value)}
                    onEventClick={(index) => openModal(day, index)}
                    onAddEvent={() => openNewEventModal(day)}
                    onDeleteEvent={(index) => openDeleteModal(day, index)}
                    onDuplicateEvent={(index) => duplicateEvent(day, index)}
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
            month={currentMonth}
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
            month={currentMonth}
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
    </div>
  );
};

export default Calendar;
