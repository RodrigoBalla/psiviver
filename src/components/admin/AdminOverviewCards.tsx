import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, History, MousePointer, TrendingUp, Activity, Timer, BarChart3 } from 'lucide-react';
import { Profile, LoginHistory, PageVisit, ButtonClick } from '@/types/calendar';

interface AdminOverviewCardsProps {
  profiles: Profile[];
  filteredData: {
    logins: LoginHistory[];
    visits: PageVisit[];
    clicks: ButtonClick[];
  };
  userActivityRanking: Array<{
    userId: string;
    name: string;
    logins: number;
    time: number;
    clicks: number;
    score: number;
  }>;
}

export const AdminOverviewCards: React.FC<AdminOverviewCardsProps> = ({
  profiles,
  filteredData,
  userActivityRanking,
}) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const stats = useMemo(() => {
    // Total time per user
    const totalTimePerUser: Record<string, number> = {};
    filteredData.visits.forEach((visit) => {
      totalTimePerUser[visit.user_id] = (totalTimePerUser[visit.user_id] || 0) + (visit.duration_seconds || 0);
    });

    const totalTime = Object.values(totalTimePerUser).reduce((a, b) => a + b, 0);
    const activeUsers = Object.keys(totalTimePerUser).length;
    const avgTimePerUser = activeUsers > 0 ? totalTime / activeUsers : 0;
    const avgSessionTime = filteredData.visits.length > 0
      ? filteredData.visits.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / filteredData.visits.length
      : 0;

    // Recurrence rate - users with more than 1 login
    const loginCountPerUser: Record<string, number> = {};
    filteredData.logins.forEach((login) => {
      loginCountPerUser[login.user_id] = (loginCountPerUser[login.user_id] || 0) + 1;
    });
    const totalUsersWithLogins = Object.keys(loginCountPerUser).length;
    const recurringUsers = Object.values(loginCountPerUser).filter((count) => count > 1).length;
    const recurrenceRate = totalUsersWithLogins > 0 ? (recurringUsers / totalUsersWithLogins) * 100 : 0;

    // Engagement rate - based on clicks per visit
    const engagementRate = filteredData.visits.length > 0
      ? Math.min(100, (filteredData.clicks.length / filteredData.visits.length) * 50)
      : 0;

    const topUser = userActivityRanking[0];

    return {
      totalAccesses: filteredData.logins.length,
      avgTimePerUser: formatDuration(avgTimePerUser),
      avgSessionTime: formatDuration(avgSessionTime),
      totalInteractions: filteredData.clicks.length,
      recurrenceRate: Math.round(recurrenceRate),
      engagementRate: Math.round(engagementRate),
      activeUsers,
      topUser: topUser?.name || '-',
    };
  }, [filteredData, userActivityRanking]);

  const cards = [
    {
      title: 'Total de Acessos',
      value: stats.totalAccesses,
      icon: History,
      color: 'text-yellow-500',
    },
    {
      title: 'Tempo Médio/Usuário',
      value: stats.avgTimePerUser,
      icon: Clock,
      color: 'text-yellow-400',
    },
    {
      title: 'Tempo Médio/Sessão',
      value: stats.avgSessionTime,
      icon: Timer,
      color: 'text-yellow-300',
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      icon: Users,
      color: 'text-yellow-500',
    },
    {
      title: 'Interações Totais',
      value: stats.totalInteractions,
      icon: MousePointer,
      color: 'text-yellow-400',
    },
    {
      title: 'Taxa de Recorrência',
      value: `${stats.recurrenceRate}%`,
      icon: TrendingUp,
      color: 'text-yellow-300',
      progress: stats.recurrenceRate,
    },
    {
      title: 'Taxa de Engajamento',
      value: `${stats.engagementRate}%`,
      icon: Activity,
      color: 'text-yellow-500',
      progress: stats.engagementRate,
    },
    {
      title: 'Usuário Mais Ativo',
      value: stats.topUser,
      icon: BarChart3,
      color: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="bg-zinc-950 border border-yellow-500/20 hover:border-yellow-500/50 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide leading-tight">
                  {card.title}
                </p>
                <card.icon className={`w-4 h-4 ${card.color} opacity-60`} />
              </div>
              <p className={`text-lg md:text-xl font-bold ${card.color} truncate`}>
                {card.value}
              </p>
              {card.progress !== undefined && (
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all duration-500"
                    style={{ width: `${card.progress}%` }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
