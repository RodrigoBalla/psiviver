import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginHistory, PageVisit, ButtonClick, Profile } from '@/types/calendar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { format, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, FileText, MousePointer, Activity, TrendingUp, Workflow } from 'lucide-react';

const YELLOW = '#facc15';
const YELLOW_DARK = '#ca8a04';
const YELLOW_LIGHT = '#fef08a';
const PIE_COLORS = ['#facc15', '#ca8a04', '#fef08a', '#a16207', '#eab308', '#fde047', '#854d0e'];

interface AdminBehaviorChartsProps {
  filteredData: {
    logins: LoginHistory[];
    visits: PageVisit[];
    clicks: ButtonClick[];
  };
  profiles: Profile[];
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

export const AdminBehaviorCharts: React.FC<AdminBehaviorChartsProps> = ({
  filteredData,
  profiles,
}) => {
  // Time per page chart data
  const timePerPageData = useMemo(() => {
    const timeByPage: Record<string, number> = {};
    filteredData.visits.forEach((visit) => {
      const page = visit.page_path || '/';
      timeByPage[page] = (timeByPage[page] || 0) + (visit.duration_seconds || 0);
    });

    const formatPageName = (pagePath: string): string => {
      if (pagePath === '/') return 'Home';
      if (pagePath.includes('#')) {
        const [path, hash] = pagePath.split('#');
        const basePage = path === '/dashboard' ? 'Dash' : path.replace('/', '').slice(0, 6);
        const tabLabels: Record<string, string> = {
          'calendario': 'Cal',
          'rotina': 'Rot',
          'orientacoes': 'Orient',
          'stories': 'Stories',
        };
        return `${basePage}→${tabLabels[hash] || hash}`;
      }
      return pagePath.replace('/', '').slice(0, 12);
    };

    return Object.entries(timeByPage)
      .map(([page, time]) => ({
        name: formatPageName(page),
        fullName: page,
        tempo: Math.round(time / 60),
        percentage: 0,
      }))
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 8)
      .map((item, _, arr) => {
        const total = arr.reduce((sum, i) => sum + i.tempo, 0);
        return { ...item, percentage: total > 0 ? Math.round((item.tempo / total) * 100) : 0 };
      });
  }, [filteredData.visits]);

  // Tab labels for dashboard
  const TAB_LABELS: Record<string, string> = {
    'calendario': 'Calendário',
    'rotina': 'Rotina',
    'orientacoes': 'Orientações',
    'stories': 'Stories',
  };

  const formatPageName = (pagePath: string): string => {
    if (pagePath === '/') return 'Home';
    
    // Check if it has a hash (tab)
    if (pagePath.includes('#')) {
      const [path, hash] = pagePath.split('#');
      const basePage = path === '/dashboard' ? 'Dashboard' : path.replace('/', '');
      const tabName = TAB_LABELS[hash] || hash;
      return `${basePage} → ${tabName}`;
    }
    
    // Regular pages
    const cleanPath = pagePath.replace('/', '');
    const pageNames: Record<string, string> = {
      'dashboard': 'Dashboard',
      'admin': 'Admin',
      'admin-analytics': 'Analytics',
      'login': 'Login',
      'cadastro': 'Cadastro',
    };
    return pageNames[cleanPath] || cleanPath.slice(0, 15);
  };

  // Most accessed pages
  const pagesAccessData = useMemo(() => {
    const accessByPage: Record<string, number> = {};
    filteredData.visits.forEach((visit) => {
      const page = visit.page_path || '/';
      accessByPage[page] = (accessByPage[page] || 0) + 1;
    });

    const total = Object.values(accessByPage).reduce((sum, count) => sum + count, 0);

    return Object.entries(accessByPage)
      .map(([page, count]) => ({
        name: formatPageName(page),
        fullPath: page,
        value: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredData.visits]);

  // Top clicked buttons
  const topButtonsData = useMemo(() => {
    const clicksByButton: Record<string, number> = {};
    filteredData.clicks.forEach((click) => {
      const label = click.button_label || click.button_id;
      clicksByButton[label] = (clicksByButton[label] || 0) + 1;
    });

    const total = Object.values(clicksByButton).reduce((sum, count) => sum + count, 0);

    return Object.entries(clicksByButton)
      .map(([label, count]) => ({
        name: label.slice(0, 20),
        cliques: count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.cliques - a.cliques)
      .slice(0, 8);
  }, [filteredData.clicks]);

  // Activity by hour
  const activityByHourData = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    
    filteredData.logins.forEach((login) => {
      const hour = getHours(new Date(login.login_at));
      hourCounts[hour]++;
    });

    filteredData.visits.forEach((visit) => {
      const hour = getHours(new Date(visit.entered_at));
      hourCounts[hour]++;
    });

    return hourCounts.map((count, hour) => ({
      name: `${hour}h`,
      atividade: count,
    }));
  }, [filteredData]);

  // Activity over last 7 days
  const activityOverTimeData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return format(date, 'dd/MM', { locale: ptBR });
    });

    return last7Days.map((dateStr) => {
      const logins = filteredData.logins.filter(
        (l) => format(new Date(l.login_at), 'dd/MM', { locale: ptBR }) === dateStr
      ).length;
      const visits = filteredData.visits.filter(
        (v) => format(new Date(v.entered_at), 'dd/MM', { locale: ptBR }) === dateStr
      ).length;
      const clicks = filteredData.clicks.filter(
        (c) => format(new Date(c.clicked_at), 'dd/MM', { locale: ptBR }) === dateStr
      ).length;

      return { name: dateStr, logins, visitas: visits, cliques: clicks };
    });
  }, [filteredData]);

  // Navigation flow data
  const navigationFlowData = useMemo(() => {
    const flows: Record<string, number> = {};
    const sortedVisits = [...filteredData.visits].sort(
      (a, b) => new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime()
    );

    // Group by user and session
    const userSessions: Record<string, PageVisit[]> = {};
    sortedVisits.forEach((visit) => {
      if (!userSessions[visit.user_id]) {
        userSessions[visit.user_id] = [];
      }
      userSessions[visit.user_id].push(visit);
    });

    Object.values(userSessions).forEach((visits) => {
      for (let i = 0; i < visits.length - 1; i++) {
        const from = visits[i].page_path === '/' ? 'Home' : visits[i].page_path.slice(1);
        const to = visits[i + 1].page_path === '/' ? 'Home' : visits[i + 1].page_path.slice(1);
        const flow = `${from} → ${to}`;
        flows[flow] = (flows[flow] || 0) + 1;
      }
    });

    return Object.entries(flows)
      .map(([flow, count]) => ({ name: flow.slice(0, 25), fluxo: count }))
      .sort((a, b) => b.fluxo - a.fluxo)
      .slice(0, 6);
  }, [filteredData.visits]);

  return (
    <div className="space-y-6 mb-6">
      {/* Row 1: Time per page + Most accessed pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-950 border border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
              <Clock className="w-5 h-5" />
              Tempo de Permanência por Página (min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timePerPageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tempo" fill={YELLOW} radius={[0, 4, 4, 0]}>
                    {timePerPageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {timePerPageData.slice(0, 4).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400">{item.name}</span>
                      <span className="text-yellow-500">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
              <FileText className="w-5 h-5" />
              Páginas Mais Acessadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pagesAccessData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {pagesAccessData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pagesAccessData.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-zinc-400 truncate">{item.name}</span>
                  <span className="text-yellow-500 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Top buttons + Activity by hour */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-950 border border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
              <MousePointer className="w-5 h-5" />
              Cliques Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topButtonsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cliques" fill={YELLOW_DARK} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
              <Activity className="w-5 h-5" />
              Horários de Maior Atividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityByHourData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="atividade"
                    stroke={YELLOW}
                    fill={YELLOW}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Activity over time + Navigation flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-950 border border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5" />
              Atividade nos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="logins" stroke={YELLOW} strokeWidth={2} dot={{ fill: YELLOW }} />
                  <Line type="monotone" dataKey="visitas" stroke={YELLOW_LIGHT} strokeWidth={2} dot={{ fill: YELLOW_LIGHT }} />
                  <Line type="monotone" dataKey="cliques" stroke={YELLOW_DARK} strokeWidth={2} dot={{ fill: YELLOW_DARK }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-500 flex items-center gap-2 text-base">
              <Workflow className="w-5 h-5" />
              Sequência de Navegação Comum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={navigationFlowData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" stroke="#71717a" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={10} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="fluxo" fill={YELLOW_LIGHT} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
