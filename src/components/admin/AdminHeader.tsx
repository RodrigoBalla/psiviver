import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminHeaderProps {
  onRefresh: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin-login');
  };

  return (
    <header className="bg-black border-b-2 border-yellow-500 sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Shield className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-500 tracking-wide flex items-center gap-3">
                <BarChart3 className="w-7 h-7 hidden md:block" />
                Painel Administrativo – Métricas de Usuário
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Análise avançada de comportamento e engajamento em tempo real
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={onRefresh}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar Dados
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
