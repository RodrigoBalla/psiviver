import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Profile, LoginHistory, PageVisit, ButtonClick } from '@/types/calendar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminOverviewCards } from '@/components/admin/AdminOverviewCards';
import { AdminBehaviorCharts } from '@/components/admin/AdminBehaviorCharts';
import { AdminUserAnalysis } from '@/components/admin/AdminUserAnalysis';
import { RefreshCw } from 'lucide-react';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';

export interface AdminFiltersState {
  dateRange: { from: Date | undefined; to: Date | undefined };
  selectedUser: string | null;
  selectedPage: string | null;
  showMostActive: boolean;
}

const AdminAnalytics = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [pageVisits, setPageVisits] = useState<PageVisit[]>([]);
  const [buttonClicks, setButtonClicks] = useState<ButtonClick[]>([]);
  
  const [filters, setFilters] = useState<AdminFiltersState>({
    dateRange: { from: subDays(new Date(), 30), to: new Date() },
    selectedUser: null,
    selectedPage: null,
    showMostActive: false,
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!profile?.is_admin) {
      navigate('/');
      return;
    }
    loadAllData();
  }, [profile, authLoading, navigate]);

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
      .from('profiles_masked')
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
      .limit(1000);
    
    if (!error && data) {
      setLoginHistory(data as LoginHistory[]);
    }
  };

  const loadPageVisits = async () => {
    const { data, error } = await supabase
      .from('page_visits')
      .select('*')
      .order('entered_at', { ascending: false })
      .limit(1000);
    
    if (!error && data) {
      setPageVisits(data as PageVisit[]);
    }
  };

  const loadButtonClicks = async () => {
    const { data, error } = await supabase
      .from('button_clicks')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(1000);
    
    if (!error && data) {
      setButtonClicks(data as ButtonClick[]);
    }
  };

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    const filterByDate = <T extends { [key: string]: any }>(
      items: T[],
      dateField: string
    ): T[] => {
      if (!filters.dateRange.from || !filters.dateRange.to) return items;
      
      return items.filter((item) => {
        const itemDate = parseISO(item[dateField]);
        return isWithinInterval(itemDate, {
          start: filters.dateRange.from!,
          end: filters.dateRange.to!,
        });
      });
    };

    const filterByUser = <T extends { user_id: string }>(items: T[]): T[] => {
      if (!filters.selectedUser) return items;
      return items.filter((item) => item.user_id === filters.selectedUser);
    };

    const filterByPage = <T extends { page_path?: string }>(items: T[]): T[] => {
      if (!filters.selectedPage) return items;
      return items.filter((item) => item.page_path === filters.selectedPage);
    };

    let filteredLogins = filterByDate(loginHistory, 'login_at');
    filteredLogins = filterByUser(filteredLogins);

    let filteredVisits = filterByDate(pageVisits, 'entered_at');
    filteredVisits = filterByUser(filteredVisits);
    filteredVisits = filterByPage(filteredVisits);

    let filteredClicks = filterByDate(buttonClicks, 'clicked_at');
    filteredClicks = filterByUser(filteredClicks);
    filteredClicks = filterByPage(filteredClicks);

    return {
      logins: filteredLogins,
      visits: filteredVisits,
      clicks: filteredClicks,
    };
  }, [loginHistory, pageVisits, buttonClicks, filters]);

  // Get unique pages for filter
  const uniquePages = useMemo(() => {
    const pages = new Set(pageVisits.map((v) => v.page_path));
    return Array.from(pages).sort();
  }, [pageVisits]);

  // Calculate most active users
  const userActivityRanking = useMemo(() => {
    const activity: Record<string, { logins: number; time: number; clicks: number }> = {};
    
    filteredData.logins.forEach((login) => {
      if (!activity[login.user_id]) {
        activity[login.user_id] = { logins: 0, time: 0, clicks: 0 };
      }
      activity[login.user_id].logins += 1;
    });

    filteredData.visits.forEach((visit) => {
      if (!activity[visit.user_id]) {
        activity[visit.user_id] = { logins: 0, time: 0, clicks: 0 };
      }
      activity[visit.user_id].time += visit.duration_seconds || 0;
    });

    filteredData.clicks.forEach((click) => {
      if (!activity[click.user_id]) {
        activity[click.user_id] = { logins: 0, time: 0, clicks: 0 };
      }
      activity[click.user_id].clicks += 1;
    });

    return Object.entries(activity)
      .map(([userId, stats]) => ({
        userId,
        name: profiles.find((p) => p.user_id === userId)?.name || 'Desconhecido',
        ...stats,
        score: stats.logins * 10 + stats.time / 60 + stats.clicks * 2,
      }))
      .sort((a, b) => b.score - a.score);
  }, [filteredData, profiles]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <AdminHeader onRefresh={loadAllData} />
      
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <AdminFilters
          filters={filters}
          setFilters={setFilters}
          profiles={profiles}
          uniquePages={uniquePages}
          userActivityRanking={userActivityRanking}
        />

        <AdminOverviewCards
          profiles={profiles}
          filteredData={filteredData}
          userActivityRanking={userActivityRanking}
        />

        <AdminBehaviorCharts
          filteredData={filteredData}
          profiles={profiles}
        />

        <AdminUserAnalysis
          profiles={profiles}
          filteredData={filteredData}
          selectedUser={filters.selectedUser}
          setSelectedUser={(userId) => setFilters({ ...filters, selectedUser: userId })}
        />
      </main>
    </div>
  );
};

export default AdminAnalytics;
