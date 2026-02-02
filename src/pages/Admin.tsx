import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, LoginHistory, PageVisit, ButtonClick } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Users, Clock, MousePointer, History, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const getProfileEmail = (userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.email || '-';
  };

  const filteredLoginHistory = selectedUser
    ? loginHistory.filter((l) => l.user_id === selectedUser)
    : loginHistory;

  const filteredPageVisits = selectedUser
    ? pageVisits.filter((p) => p.user_id === selectedUser)
    : pageVisits;

  const filteredButtonClicks = selectedUser
    ? buttonClicks.filter((b) => b.user_id === selectedUser)
    : buttonClicks;

  // Calculate stats
  const totalTimePerUser = pageVisits.reduce((acc, visit) => {
    acc[visit.user_id] = (acc[visit.user_id] || 0) + visit.duration_seconds;
    return acc;
  }, {} as Record<string, number>);

  const loginCountPerUser = loginHistory.reduce((acc, login) => {
    acc[login.user_id] = (acc[login.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-card to-accent border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary tracking-widest">
                PAINEL ADMINISTRATIVO
              </h1>
              <p className="text-muted-foreground">
                Relatórios de acesso e atividade dos membros
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={loadAllData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Total de Membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{profiles.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <History className="w-4 h-4 mr-2" />
                Total de Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{loginHistory.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Visitas a Páginas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{pageVisits.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <MousePointer className="w-4 h-4 mr-2" />
                Cliques em Botões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{buttonClicks.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter by user */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-display text-primary">
              Filtrar por Membro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedUser === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Todos
              </Button>
              {profiles.map((p) => (
                <Button
                  key={p.id}
                  variant={selectedUser === p.user_id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedUser(p.user_id)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="members">
          <TabsList className="mb-4">
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="logins">
              <History className="w-4 h-4 mr-2" />
              Histórico de Login
            </TabsTrigger>
            <TabsTrigger value="pages">
              <Clock className="w-4 h-4 mr-2" />
              Tempo por Página
            </TabsTrigger>
            <TabsTrigger value="clicks">
              <MousePointer className="w-4 h-4 mr-2" />
              Cliques em Botões
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Membros Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead>Total de Logins</TableHead>
                        <TableHead>Tempo Total</TableHead>
                        <TableHead>Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{p.phone || '-'}</TableCell>
                          <TableCell>{formatDate(p.created_at)}</TableCell>
                          <TableCell>{loginCountPerUser[p.user_id] || 0}</TableCell>
                          <TableCell>
                            {formatDuration(totalTimePerUser[p.user_id] || 0)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                p.is_admin
                                  ? 'bg-psiviver-verde text-white'
                                  : 'bg-muted text-muted-foreground'
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
          </TabsContent>

          {/* Login History Tab */}
          <TabsContent value="logins">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Login</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Logout</TableHead>
                        <TableHead>Navegador</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoginHistory.map((login) => (
                        <TableRow key={login.id}>
                          <TableCell className="font-medium">
                            {getProfileName(login.user_id)}
                          </TableCell>
                          <TableCell>{getProfileEmail(login.user_id)}</TableCell>
                          <TableCell>{formatDate(login.login_at)}</TableCell>
                          <TableCell>
                            {login.logout_at ? formatDate(login.logout_at) : '-'}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {login.user_agent || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Page Visits Tab */}
          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle>Tempo de Permanência por Página</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Página</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Saída</TableHead>
                        <TableHead>Duração</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPageVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-medium">
                            {getProfileName(visit.user_id)}
                          </TableCell>
                          <TableCell>{visit.page_path}</TableCell>
                          <TableCell>{formatDate(visit.entered_at)}</TableCell>
                          <TableCell>
                            {visit.left_at ? formatDate(visit.left_at) : 'Ativo'}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {formatDuration(visit.duration_seconds)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Button Clicks Tab */}
          <TabsContent value="clicks">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Cliques em Botões</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Membro</TableHead>
                        <TableHead>Botão ID</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Página</TableHead>
                        <TableHead>Data/Hora</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredButtonClicks.map((click) => (
                        <TableRow key={click.id}>
                          <TableCell className="font-medium">
                            {getProfileName(click.user_id)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {click.button_id}
                          </TableCell>
                          <TableCell>{click.button_label || '-'}</TableCell>
                          <TableCell>{click.page_path}</TableCell>
                          <TableCell>{formatDate(click.clicked_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
