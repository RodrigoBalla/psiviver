import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos!",
        variant: "destructive",
      });
    } else {
      navigate('/admin-analytics');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-zinc-950">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(234,179,8,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(234,179,8,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Back to Login Button */}
      <Link 
        to="/login" 
        className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-zinc-900/80 backdrop-blur-sm border border-yellow-500/30 rounded-lg text-yellow-500 hover:bg-yellow-500 hover:text-zinc-950 transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-semibold">Voltar</span>
      </Link>

      <Card className={`w-full max-w-md animate-fade-in border-yellow-500/30 bg-zinc-900/90 backdrop-blur-sm ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-zinc-950" />
          </div>
          <h1 className="text-3xl font-display font-bold text-yellow-500 tracking-widest">
            ADMIN
          </h1>
          <p className="text-zinc-400 mt-2">
            Área Restrita - Painel Administrativo
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-yellow-500 font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-yellow-500 focus:ring-yellow-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-yellow-500 font-semibold">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha de administrador"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-yellow-500 focus:ring-yellow-500/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6 bg-yellow-500 text-zinc-950 hover:bg-yellow-400 font-bold"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'ACESSAR PAINEL'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              Acesso exclusivo para administradores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
