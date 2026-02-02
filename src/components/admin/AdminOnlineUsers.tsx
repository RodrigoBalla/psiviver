import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/calendar';
import { Users, Wifi, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  useEffect(() => {
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];

        Object.entries(state).forEach(([key, presences]) => {
          if (Array.isArray(presences) && presences.length > 0) {
            const presence = presences[0] as {
              user_id?: string;
              name?: string;
              email?: string;
              currentPage?: string;
              onlineSince?: string;
            };
            
            const profile = profiles.find((p) => p.user_id === presence.user_id);
            
            users.push({
              odlerId: presence.user_id || key,
              name: profile?.name || presence.name || 'Anônimo',
              email: profile?.email || presence.email,
              currentPage: presence.currentPage || '/',
              onlineSince: presence.onlineSince || new Date().toISOString(),
            });
          }
        });

        setOnlineUsers(users);
      })
      .subscribe();

    return () => {
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
                      {user.currentPage === '/' ? 'Home' : user.currentPage}
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
