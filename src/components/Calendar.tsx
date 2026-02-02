import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { defaultEvents } from '@/data/calendarData';
import { useToast } from '@/hooks/use-toast';
import { useTracking } from '@/hooks/useTracking';
import { useAuth } from '@/contexts/AuthContext';
import CalendarDayCell from './CalendarDayCell';
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
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { trackButtonClick } = useTracking(user?.id);

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
        (payload) => {
          console.log('Realtime INSERT event:', payload);
          loadEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calendar_events',
        },
        (payload) => {
          console.log('Realtime UPDATE event:', payload);
          loadEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'calendar_events',
        },
        (payload) => {
          console.log('Realtime DELETE event:', payload);
          loadEvents();
        }
      )
      .subscribe((status, err) => {
        console.log('Events channel status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to calendar_events realtime');
        }
      });

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
        (payload) => {
          console.log('Realtime gravador received:', payload);
          loadGravadores();
        }
      )
      .subscribe((status, err) => {
        console.log('Gravadores channel status:', status, err);
      });

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(gravadoresChannel);
    };
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase.from('calendar_events').select('*');
    
    if (error) {
      console.error('Error loading events:', error);
      // Use default events if database is empty
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
      // Sort events by event_index within each day
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
    const existingEvents = events[day] || [];
    const eventIndex = existingEvents.length;

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
    // Check if user is admin before opening delete modal
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

  // Generate calendar grid
  const firstDay = new Date(2026, 1, 1).getDay(); // February 2026
  const daysInMonth = 28;
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getSelectedEventData = () => {
    if (!selectedEvent) return null;
    return events[selectedEvent.day]?.[selectedEvent.index];
  };

  return (
    <div>
      <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
        {/* Header */}
        <div className="hidden md:grid grid-cols-7 gap-4 mb-4">
          {dayNames.map((name) => (
            <div
              key={name}
              className="text-center font-bold text-primary uppercase tracking-wider text-sm py-3"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="hidden md:block min-h-[140px] opacity-30" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            return (
              <CalendarDayCell
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
        <div className="mt-8 p-4 bg-muted rounded-lg flex flex-wrap gap-4">
          {[
            { status: null, label: 'Sem Status', color: 'bg-white' },
            { status: 'revisado', label: 'Revisado', color: 'bg-psiviver-azul' },
            { status: 'producao', label: 'Em Produção', color: 'bg-psiviver-laranja' },
            { status: 'pronto', label: 'Pronto', color: 'bg-psiviver-amarelo' },
            { status: 'publicado', label: 'Publicado', color: 'bg-psiviver-verde' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded ${item.color}`} />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

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
  );
};

export default Calendar;
