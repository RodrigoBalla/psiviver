import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, LoginHistory, PageVisit, ButtonClick } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Users, Clock, MousePointer, History, RefreshCw, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminOnlineUsers } from '@/components/admin/AdminOnlineUsers';
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
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const YELLOW = '#facc15';
const YELLOW_DARK = '#ca8a04';
const YELLOW_LIGHT = '#fef08a';

const Admin = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [buttonClicks, setButtonClicks] = useState<ButtonClick[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/');
      return;
    }
    loadAllData();
  }, [profile, navigate]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadProfiles(),
      loadLoginHistory(),
      loadPageVisits(),
      loadButtonClicks(),
    ]);
    setLoading(false);
  };

  const loadProfiles = async () => {
    // Admins can access full profiles table via RLS
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProfiles(data as Profile[]);
    }
  };

  const loadLoginHistory = async () => {
    const { data, error } = await supabase
      .from('login_history')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(500);
    
    if (!error && data) {
      setLoginHistory(data as LoginHistory[]);
    }
  };

  const loadPageVisits = async () => {
    const { data, error } = await supabase
      .from('page_visits')
      .select('*')
      .order('entered_at', { ascending: false })
      .limit(500);
    
    if (!error && data) {
      setPageVisits(data as PageVisit[]);
    }
  };

  const loadButtonClicks = async () => {
    const { data, error } = await supabase
      .from('button_clicks')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(500);
    
    if (!error && data) {
      setButtonClicks(data as ButtonClick[]);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const getProfileName = (userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.name || 'Usuário desconhecido';
  };

  // Calculate stats
  const totalTimePerUser = pageVisits.reduce((acc, visit) => {
    acc[visit.user_id] = (acc[visit.user_id] || 0) + (visit.duration_seconds || 0);
    return acc;
  }, {} as Record<string, number>);

  const loginCountPerUser = loginHistory.reduce((acc, login) => {
    acc[login.user_id] = (acc[login.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const clicksPerUser = buttonClicks.reduce((acc, click) => {
    acc[click.user_id] = (acc[click.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Chart Data: Time per member
  const timePerMemberData = profiles.map((p) => ({
    name: p.name.split(' ')[0],
    tempo: Math.round((totalTimePerUser[p.user_id] || 0) / 60), // in minutes
    logins: loginCountPerUser[p.user_id] || 0,
    cliques: clicksPerUser[p.user_id] || 0,
  }));

  // Chart Data: Page visits distribution
  const pageVisitsByPath = pageVisits.reduce((acc, visit) => {
    const path = visit.page_path || '/';
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pageVisitsData = Object.entries(pageVisitsByPath)
    .map(([path, count]) => ({
      name: path === '/' ? 'Home' : path.replace('/', '').charAt(0).toUpperCase() + path.slice(2),
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Chart Data: Activity over time (last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'dd/MM');
  });

  const activityData = last7Days.map((dateStr) => {
    const logins = loginHistory.filter((l) => 
      format(new Date(l.login_at), 'dd/MM') === dateStr
    ).length;
    const visits = pageVisits.filter((v) => 
      format(new Date(v.entered_at), 'dd/MM') === dateStr
    ).length;
    return { name: dateStr, logins, visitas: visits };
  });

  // Chart Data: Top clicked buttons
  const buttonClicksByLabel = buttonClicks.reduce((acc, click) => {
    const label = click.button_label || click.button_id;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topButtonsData = Object.entries(buttonClicksByLabel)
    .map(([label, count]) => ({ name: label.slice(0, 15), cliques: count }))
    .sort((a, b) => b.cliques - a.cliques)
    .slice(0, 8);

  const PIE_COLORS = [YELLOW, YELLOW_DARK, YELLOW_LIGHT, '#a16207', '#eab308', '#fde047'];

  const totalTime = Object.values(totalTimePerUser).reduce((a, b) => a + b, 0);
  const avgTimePerUser = profiles.length > 0 ? totalTime / profiles.length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="bg-zinc-900 border-b-2 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-yellow-500 tracking-widest flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                RELATÓRIOS DE MEMBROS
              </h1>
              <p className="text-zinc-400 mt-1">
                Análise completa de atividade e engajamento
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={loadAllData}
                className="bg-yellow-500 text-zinc-900 hover:bg-yellow-400 font-bold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-zinc-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Online Users Card */}
        <div className="mb-8">
          <AdminOnlineUsers profiles={profiles} />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Membros</p>
                  <p className="text-3xl font-bold text-yellow-500">{profiles.length}</p>
                </div>
                <Users className="w-10 h-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Total Logins</p>
                  <p className="text-3xl font-bold text-yellow-500">{loginHistory.length}</p>
                </div>
                <History className="w-10 h-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Tempo Médio</p>
                  <p className="text-3xl font-bold text-yellow-500">{formatDuration(Math.round(avgTimePerUser))}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Interações</p>
                  <p className="text-3xl font-bold text-yellow-500">{buttonClicks.length}</p>
                </div>
                <MousePointer className="w-10 h-10 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Time per Member */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tempo de Visualização por Membro (minutos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timePerMemberData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #facc15', color: '#fff' }}
                      labelStyle={{ color: '#facc15' }}
                    />
                    <Bar dataKey="tempo" fill={YELLOW} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Activity Over Time */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Atividade nos Últimos 7 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                    <YAxis stroke="#a1a1aa" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #facc15', color: '#fff' }}
                      labelStyle={{ color: '#facc15' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="logins" stackId="1" stroke={YELLOW} fill={YELLOW} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="visitas" stackId="2" stroke={YELLOW_LIGHT} fill={YELLOW_LIGHT} fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pages Distribution */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Distribuição de Visitas por Página
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pageVisitsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pageVisitsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #facc15', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Buttons */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-yellow-500 flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                Botões Mais Clicados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topButtonsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #facc15', color: '#fff' }}
                    />
                    <Bar dataKey="cliques" fill={YELLOW_DARK} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Filter */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-yellow-500">Filtrar por Membro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setSelectedUser(null)}
                className={selectedUser === null 
                  ? 'bg-yellow-500 text-zinc-900 hover:bg-yellow-400' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }
              >
                Todos
              </Button>
              {profiles.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  onClick={() => setSelectedUser(p.user_id)}
                  className={selectedUser === p.user_id 
                    ? 'bg-yellow-500 text-zinc-900 hover:bg-yellow-400' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-yellow-500 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Detalhes dos Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableHead className="text-yellow-500">Nome</TableHead>
                    <TableHead className="text-yellow-500">Email</TableHead>
                    <TableHead className="text-yellow-500">Cadastro</TableHead>
                    <TableHead className="text-yellow-500 text-center">Logins</TableHead>
                    <TableHead className="text-yellow-500 text-center">Tempo Total</TableHead>
                    <TableHead className="text-yellow-500 text-center">Cliques</TableHead>
                    <TableHead className="text-yellow-500 text-center">Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles
                    .filter((p) => !selectedUser || p.user_id === selectedUser)
                    .map((p) => (
                      <TableRow key={p.id} className="border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="font-medium text-zinc-100">{p.name}</TableCell>
                        <TableCell className="text-zinc-400">{p.email}</TableCell>
                        <TableCell className="text-zinc-400">{formatDate(p.created_at)}</TableCell>
                        <TableCell className="text-center font-bold text-yellow-500">
                          {loginCountPerUser[p.user_id] || 0}
                        </TableCell>
                        <TableCell className="text-center font-bold text-yellow-500">
                          {formatDuration(totalTimePerUser[p.user_id] || 0)}
                        </TableCell>
                        <TableCell className="text-center font-bold text-yellow-500">
                          {clicksPerUser[p.user_id] || 0}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              p.is_admin
                                ? 'bg-yellow-500 text-zinc-900'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {p.is_admin ? 'Sim' : 'Não'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
