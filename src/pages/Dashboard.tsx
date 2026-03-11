import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTracking } from '@/hooks/useTracking';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Calendar, List, Lightbulb, Video, Shield, FileText } from 'lucide-react';
import CalendarComponent from '@/components/Calendar';
import Rotina from '@/components/Rotina';
import Stories from '@/components/Stories';
import Orientacoes from '@/components/Orientacoes';

const TAB_NAMES = ['calendario', 'rotina', 'stories', 'orientacoes', 'relatorios'] as const;
type TabName = typeof TAB_NAMES[number];

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  
  // Get initial tab from hash or default to 'calendario'
  const getTabFromHash = (): TabName => {
    const hash = location.hash.replace('#', '');
    if (TAB_NAMES.includes(hash as TabName)) {
      return hash as TabName;
    }
    return 'calendario';
  };

  const [activeTab, setActiveTab] = useState<TabName>(getTabFromHash);
  const { trackButtonClick } = useTracking(user?.id);

  // Sync tab with URL hash on mount and when hash changes
  useEffect(() => {
    const tabFromHash = getTabFromHash();
    if (tabFromHash !== activeTab) {
      setActiveTab(tabFromHash);
    }
  }, [location.hash]);

  // Map tab to display path for tracking
  const TAB_TO_PATH: Record<TabName, string> = {
    'calendario': '/calendário',
    'rotina': '/rotina',
    'stories': '/pautasstories',
    'orientacoes': '/Orientações',
    'relatorios': '/Relatórios',
  };

  // Update hash when tab changes
  const handleTabChange = (value: string) => {
    const tab = value as TabName;
    trackButtonClick(`tab-${tab}`, tab);
    setActiveTab(tab);
    // Update URL hash without navigation
    window.history.replaceState(null, '', `${location.pathname}#${tab}`);
    // Dispatch custom event with the tab path for presence tracking
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tabPath: TAB_TO_PATH[tab] } 
    }));
  };

  const handleLogout = async () => {
    trackButtonClick('logout', 'Sair');
    await signOut();
    navigate('/login');
  };

  const goToAdmin = () => {
    trackButtonClick('admin', 'Painel Administrativo');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-card to-accent border-b-2 border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary tracking-widest animate-glow">
                PSIVIVER
              </h1>
              <p className="text-muted-foreground">
                Calendário Editorial - 2026
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profile?.is_admin && (
                <Button
                  variant="outline"
                  onClick={goToAdmin}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="bg-card/50 border border-border">
              <TabsTrigger
                value="calendario"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendário
              </TabsTrigger>
              <TabsTrigger
                value="rotina"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <List className="w-4 h-4 mr-2" />
                Rotina
              </TabsTrigger>
              <TabsTrigger
                value="stories"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Pautas Stories
              </TabsTrigger>
              <TabsTrigger
                value="orientacoes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Video className="w-4 h-4 mr-2" />
                Orientações
              </TabsTrigger>
              <TabsTrigger
                value="relatorios"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <FileText className="w-4 h-4 mr-2" />
                Relatórios
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsContent value="calendario" className="mt-0">
            <CalendarComponent />
          </TabsContent>
          <TabsContent value="rotina" className="mt-0">
            <Rotina />
          </TabsContent>
          <TabsContent value="stories" className="mt-0">
            <Stories />
          </TabsContent>
          <TabsContent value="orientacoes" className="mt-0">
            <Orientacoes />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;