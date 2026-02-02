import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Profile, LoginHistory, PageVisit, ButtonClick } from '@/types/calendar';
import { User, Clock, MousePointer, FileText, Calendar, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

const YELLOW = '#facc15';

interface AdminUserAnalysisProps {
  profiles: Profile[];
  filteredData: {
    logins: LoginHistory[];
    visits: PageVisit[];
    clicks: ButtonClick[];
  };
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-yellow-500 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-yellow-500 font-bold text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-zinc-100 text-sm">
            {entry.name}: <span className="font-bold text-yellow-400">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminUserAnalysis: React.FC<AdminUserAnalysisProps> = ({
  profiles,
  filteredData,
  selectedUser,
  setSelectedUser,
}) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  // User ranking with stats
  const userRanking = useMemo(() => {
    const stats: Record<string, {
      logins: number;
      totalTime: number;
      clicks: number;
      pages: Set<string>;
      lastAccess: string | null;
      sessions: number;
    }> = {};

    profiles.forEach((p) => {
      stats[p.user_id] = {
        logins: 0,
        totalTime: 0,
        clicks: 0,
        pages: new Set(),
        lastAccess: null,
        sessions: 0,
      };
    });

    filteredData.logins.forEach((login) => {
      if (stats[login.user_id]) {
        stats[login.user_id].logins++;
        if (!stats[login.user_id].lastAccess || login.login_at > stats[login.user_id].lastAccess!) {
          stats[login.user_id].lastAccess = login.login_at;
        }
        stats[login.user_id].sessions++;
      }
    });

    filteredData.visits.forEach((visit) => {
      if (stats[visit.user_id]) {
        stats[visit.user_id].totalTime += visit.duration_seconds || 0;
        stats[visit.user_id].pages.add(visit.page_path);
      }
    });

    filteredData.clicks.forEach((click) => {
      if (stats[click.user_id]) {
        stats[click.user_id].clicks++;
      }
    });

    return profiles.map((p) => {
      const userStats = stats[p.user_id] || { logins: 0, totalTime: 0, clicks: 0, pages: new Set(), lastAccess: null, sessions: 0 };
      const frequency = userStats.logins;
      let status: 'ativo' | 'recorrente' | 'inativo' = 'inativo';
      
      if (frequency >= 5) status = 'ativo';
      else if (frequency >= 2) status = 'recorrente';

      return {
        ...p,
        logins: userStats.logins,
        totalTime: userStats.totalTime,
        clicks: userStats.clicks,
        pagesViewed: userStats.pages.size,
        lastAccess: userStats.lastAccess,
        sessions: userStats.sessions,
        frequency,
        status,
      };
    }).sort((a, b) => b.logins - a.logins);
  }, [profiles, filteredData]);

  // Selected user details
  const selectedUserDetails = useMemo(() => {
    if (!selectedUser) return null;

    const profile = profiles.find((p) => p.user_id === selectedUser);
    if (!profile) return null;

    const userLogins = filteredData.logins.filter((l) => l.user_id === selectedUser);
    const userVisits = filteredData.visits.filter((v) => v.user_id === selectedUser);
    const userClicks = filteredData.clicks.filter((c) => c.user_id === selectedUser);

    // Time per page for this user
    const timeByPage: Record<string, number> = {};
    userVisits.forEach((visit) => {
      timeByPage[visit.page_path] = (timeByPage[visit.page_path] || 0) + (visit.duration_seconds || 0);
    });

    const timePerPageData = Object.entries(timeByPage)
      .map(([page, time]) => ({
        name: page === '/' ? 'Home' : page.slice(1, 12),
        tempo: Math.round(time / 60),
      }))
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 5);

    // Sessions over time
    const sessionsByDay: Record<string, number> = {};
    userLogins.forEach((login) => {
      const day = format(new Date(login.login_at), 'dd/MM');
      sessionsByDay[day] = (sessionsByDay[day] || 0) + 1;
    });

    const sessionsData = Object.entries(sessionsByDay)
      .map(([day, count]) => ({ name: day, sessões: count }))
      .slice(-7);

    const totalTime = userVisits.reduce((sum, v) => sum + (v.duration_seconds || 0), 0);
    const avgSessionTime = userLogins.length > 0 ? totalTime / userLogins.length : 0;

    return {
      profile,
      logins: userLogins,
      visits: userVisits,
      clicks: userClicks,
      totalTime,
      avgSessionTime,
      timePerPageData,
      sessionsData,
      uniquePages: new Set(userVisits.map((v) => v.page_path)).size,
    };
  }, [selectedUser, profiles, filteredData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'recorrente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* User Ranking Table */}
      <Card className="bg-zinc-950 border border-yellow-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5" />
            Ranking de Usuários (Clique para detalhes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-yellow-500 text-xs">#</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Usuário</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Acessos</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Tempo Total</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Cliques</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Páginas</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Último Acesso</TableHead>
                  <TableHead className="text-yellow-500 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRanking.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={`border-zinc-800 cursor-pointer transition-colors ${
                      selectedUser === user.user_id
                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                        : 'hover:bg-zinc-900'
                    }`}
                    onClick={() => setSelectedUser(user.user_id)}
                  >
                    <TableCell className="text-zinc-400 font-bold">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-zinc-100 font-medium">
                      {user.name}
                    </TableCell>
                    <TableCell className="text-yellow-400 font-bold">
                      {user.logins}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {formatDuration(user.totalTime)}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {user.clicks}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {user.pagesViewed}
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {user.lastAccess ? formatDate(user.lastAccess) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(user.status)} text-xs`}>
                        {user.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected User Details */}
      {selectedUserDetails && (
        <Card className="bg-zinc-950 border-2 border-yellow-500/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-yellow-500 flex items-center gap-2 text-lg">
                <User className="w-6 h-6" />
                Análise Individual: {selectedUserDetails.profile.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-zinc-400 hover:text-yellow-500"
              >
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-zinc-400 uppercase">Total de Acessos</p>
                <p className="text-2xl font-bold text-yellow-500">{selectedUserDetails.logins.length}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-zinc-400 uppercase">Tempo Total</p>
                <p className="text-2xl font-bold text-yellow-400">{formatDuration(selectedUserDetails.totalTime)}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-zinc-400 uppercase">Tempo/Sessão</p>
                <p className="text-2xl font-bold text-yellow-300">{formatDuration(selectedUserDetails.avgSessionTime)}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-zinc-400 uppercase">Cliques</p>
                <p className="text-2xl font-bold text-yellow-500">{selectedUserDetails.clicks.length}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-zinc-400 uppercase">Páginas Únicas</p>
                <p className="text-2xl font-bold text-yellow-400">{selectedUserDetails.uniquePages}</p>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-zinc-400 uppercase">Frequência</p>
                <p className="text-2xl font-bold text-yellow-300">
                  {selectedUserDetails.logins.length > 5 ? 'Alta' : selectedUserDetails.logins.length > 2 ? 'Média' : 'Baixa'}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-500 font-bold text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tempo por Página (min)
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedUserDetails.timePerPageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="tempo" fill={YELLOW} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-500 font-bold text-sm mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Sessões por Dia
                </h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedUserDetails.sessionsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="sessões" stroke={YELLOW} strokeWidth={2} dot={{ fill: YELLOW }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Activity Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Logins */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-500 font-bold text-sm mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Últimos Acessos
                </h4>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-yellow-500 text-xs">Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUserDetails.logins.slice(0, 10).map((login) => (
                        <TableRow key={login.id} className="border-zinc-800">
                          <TableCell className="text-zinc-300 text-sm">
                            {formatDate(login.login_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Recent Clicks */}
              <div className="bg-zinc-900 rounded-lg p-4 border border-yellow-500/20">
                <h4 className="text-yellow-500 font-bold text-sm mb-4 flex items-center gap-2">
                  <MousePointer className="w-4 h-4" />
                  Últimos Cliques
                </h4>
                <ScrollArea className="h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-yellow-500 text-xs">Botão</TableHead>
                        <TableHead className="text-yellow-500 text-xs">Página</TableHead>
                        <TableHead className="text-yellow-500 text-xs">Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUserDetails.clicks.slice(0, 10).map((click) => (
                        <TableRow key={click.id} className="border-zinc-800">
                          <TableCell className="text-zinc-300 text-xs truncate max-w-[100px]">
                            {click.button_label || click.button_id}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-xs">
                            {click.page_path}
                          </TableCell>
                          <TableCell className="text-zinc-500 text-xs">
                            {format(new Date(click.clicked_at), 'HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
