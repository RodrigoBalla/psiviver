import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Filter, Users, FileText, TrendingUp, X } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Profile } from '@/types/calendar';
import { AdminFiltersState } from '@/pages/AdminAnalytics';

interface AdminFiltersProps {
  filters: AdminFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<AdminFiltersState>>;
  profiles: Profile[];
  uniquePages: string[];
  userActivityRanking: Array<{ userId: string; name: string; score: number }>;
}

export const AdminFilters: React.FC<AdminFiltersProps> = ({
  filters,
  setFilters,
  profiles,
  uniquePages,
  userActivityRanking,
}) => {
  const clearFilters = () => {
    setFilters({
      dateRange: { from: subDays(new Date(), 30), to: new Date() },
      selectedUser: null,
      selectedPage: null,
      showMostActive: false,
    });
  };

  const hasActiveFilters = filters.selectedUser || filters.selectedPage || filters.showMostActive;

  return (
    <Card className="bg-zinc-950 border border-yellow-500/30 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-yellow-500" />
          <h3 className="text-yellow-500 font-bold text-lg">Filtros</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-zinc-400 hover:text-yellow-500"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              Intervalo de Datas
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:border-yellow-500"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-yellow-500" />
                  {filters.dateRange.from && filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                      {format(filters.dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                    </>
                  ) : (
                    <span>Selecione o período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                  onSelect={(range) =>
                    setFilters({
                      ...filters,
                      dateRange: { from: range?.from, to: range?.to },
                    })
                  }
                  locale={ptBR}
                  className="bg-zinc-900 text-zinc-100"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1">
              <Users className="w-3 h-3" />
              Usuário
            </label>
            <Select
              value={filters.selectedUser || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, selectedUser: value === 'all' ? null : value })
              }
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-yellow-500">
                <SelectValue placeholder="Todos os usuários" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all" className="text-zinc-100 focus:bg-yellow-500/20">
                  Todos os usuários
                </SelectItem>
                {profiles.map((p) => (
                  <SelectItem
                    key={p.user_id}
                    value={p.user_id}
                    className="text-zinc-100 focus:bg-yellow-500/20"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Filter */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Página Específica
            </label>
            <Select
              value={filters.selectedPage || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, selectedPage: value === 'all' ? null : value })
              }
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-yellow-500">
                <SelectValue placeholder="Todas as páginas" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all" className="text-zinc-100 focus:bg-yellow-500/20">
                  Todas as páginas
                </SelectItem>
                {uniquePages.map((page) => (
                  <SelectItem
                    key={page}
                    value={page}
                    className="text-zinc-100 focus:bg-yellow-500/20"
                  >
                    {page === '/' ? 'Home (/)' : page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Most Active Filter */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Usuários Mais Ativos
            </label>
            <Select
              value={filters.showMostActive ? 'top5' : 'all'}
              onValueChange={(value) => {
                if (value === 'top5') {
                  const top5Ids = userActivityRanking.slice(0, 5).map((u) => u.userId);
                  setFilters({
                    ...filters,
                    showMostActive: true,
                    selectedUser: top5Ids[0] || null,
                  });
                } else {
                  setFilters({ ...filters, showMostActive: false });
                }
              }}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-yellow-500">
                <SelectValue placeholder="Filtrar por atividade" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="all" className="text-zinc-100 focus:bg-yellow-500/20">
                  Todos
                </SelectItem>
                <SelectItem value="top5" className="text-zinc-100 focus:bg-yellow-500/20">
                  Top 5 Mais Ativos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
