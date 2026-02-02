import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultStories } from '@/data/calendarData';
import { Story } from '@/types/calendar';
import { useTracking } from '@/hooks/useTracking';
import { useAuth } from '@/contexts/AuthContext';

const Stories = () => {
  const [stories, setStories] = useState<Story[]>(defaultStories);
  const { user } = useAuth();
  const { trackButtonClick } = useTracking(user?.id);

  useEffect(() => {
    loadStories();

    // Subscribe to realtime changes for stories
    const storiesChannel = supabase
      .channel('stories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
        },
        (payload) => {
          console.log('Realtime story received:', payload);
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(storiesChannel);
    };
  }, []);

  const loadStories = async () => {
    const { data, error } = await supabase.from('stories').select('*');
    
    if (!error && data && data.length > 0) {
      const updatedStories = defaultStories.map((story) => {
        const dbStory = data.find((s) => s.story_id === story.id);
        return {
          ...story,
          done: dbStory?.done || false,
        };
      });
      setStories(updatedStories);
    } else if (data && data.length === 0) {
      // Initialize stories in database
      const storiesToInsert = defaultStories.map((s) => ({
        story_id: s.id,
        title: s.title,
        description: s.desc,
        done: false,
      }));
      await supabase.from('stories').insert(storiesToInsert);
    }
  };

  const toggleStory = async (storyId: number) => {
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    trackButtonClick(`story-${storyId}`, story.title);

    const newDone = !story.done;
    
    const { error } = await supabase
      .from('stories')
      .update({ done: newDone })
      .eq('story_id', storyId);

    if (!error) {
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, done: newDone } : s))
      );
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border animate-fade-in">
      <h2 className="text-2xl font-display font-bold text-primary uppercase tracking-wider mb-6">
        Pautas para Stories
      </h2>

      <div className="space-y-3">
        {stories.map((story) => (
          <div
            key={story.id}
            onClick={() => toggleStory(story.id)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
              hover:translate-x-1
              ${
                story.done
                  ? 'bg-psiviver-verde border-psiviver-verde'
                  : 'bg-muted border-border hover:bg-muted/80'
              }
            `}
          >
            <div className="flex justify-between items-center mb-2">
              <h3
                className={`font-bold ${
                  story.done ? 'text-white' : 'text-primary'
                }`}
              >
                {story.title}
              </h3>
              <span
                className={`
                  px-3 py-1 rounded-full text-xs font-bold uppercase
                  ${
                    story.done
                      ? 'bg-white text-psiviver-verde'
                      : 'bg-primary text-primary-foreground'
                  }
                `}
              >
                {story.done ? 'Feito' : 'Pendente'}
              </span>
            </div>
            <p className={story.done ? 'text-white/90' : 'text-muted-foreground'}>
              {story.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
