import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/calendar';
import { Users, Wifi, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// The currentPage now comes already formatted from useOnlinePresence
// Just pass through or handle edge cases
const formatPagePath = (path: string): string => {
  if (!path || path === '/') return '/home';
  return path;
};

interface OnlineUser {
  odlerId: string;
  name: string;
  email?: string;
  currentPage?: string;
  onlineSince: string;
}

interface AdminOnlineUsersProps {
  profiles: Profile[];
}

export const AdminOnlineUsers: React.FC<AdminOnlineUsersProps> = ({ profiles }) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel('presence-room', {
      config: {
        broadcast: { self: true },
        presence: { key: 'presence-key' },
      },
    });
    
    channelRef.current = channel;

    const handlePresenceSync = () => {
      const state = channel.presenceState();
      console.log('[AdminOnlineUsers] Presence sync:', JSON.stringify(state));
      
      const users: OnlineUser[] = [];
      const seenUserIds = new Set<string>();

      Object.values(state).forEach((presences) => {
        if (Array.isArray(presences)) {
          presences.forEach((presence: any) => {
            const userId = presence.user_id;
            if (!userId || seenUserIds.has(userId)) return;
            seenUserIds.add(userId);
            
            const profile = profiles.find((p) => p.user_id === userId);
            
            users.push({
              odlerId: userId,
              name: profile?.name || presence.name || 'Anônimo',
              email: profile?.email || presence.email,
              currentPage: presence.currentPage || '/',
              onlineSince: presence.onlineSince || new Date().toISOString(),
            });
          });
        }
      });

      console.log('[AdminOnlineUsers] Users online:', users.length);
      setOnlineUsers(users);
    };

    channel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'join' }, () => handlePresenceSync())
      .on('presence', { event: 'leave' }, () => handlePresenceSync())
      .subscribe((status) => {
        console.log('[AdminOnlineUsers] Channel status:', status);
      });

    return () => {
      console.log('[AdminOnlineUsers] Removing channel');
      supabase.removeChannel(channel);
    };
  }, [profiles]);

  return (
    <Card className="bg-zinc-950 border border-green-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-green-500 flex items-center gap-2 text-base">
          <div className="relative">
            <Users className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          Usuários Online Agora
          <Badge variant="outline" className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
            {onlineUsers.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            <Wifi className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum usuário online no momento</p>
            <p className="text-xs mt-1">Os usuários aparecerão aqui quando acessarem o app</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {onlineUsers.map((user, index) => (
                <div
                  key={user.odlerId + index}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-green-500/10 hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
                    </div>
                    <div>
                      <p className="text-zinc-100 font-medium text-sm">{user.name}</p>
                      {user.email && (
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs bg-zinc-800 text-zinc-300 border-zinc-700 mb-1">
                      {formatPagePath(user.currentPage || '/')}
                    </Badge>
                    <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(user.onlineSince), { 
                        addSuffix: false, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
