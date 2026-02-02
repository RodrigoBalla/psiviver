import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
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
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-animated p-4 relative">
      {/* Admin Button */}
      <Link 
        to="/admin" 
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm border border-border rounded-lg text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-lg"
      >
        <Shield className="w-4 h-4" />
        <span className="text-sm font-semibold">Admin</span>
      </Link>

      <Card className={`w-full max-w-md animate-fade-in ${shake ? 'animate-shake' : ''}`}>
        <CardHeader className="text-center">
          <h1 className="text-3xl font-display font-bold text-primary animate-glow tracking-widest">
            PSIVIVER
          </h1>
          <p className="text-muted-foreground mt-2">
            Calendário Editorial - Acesso Restrito
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary font-semibold">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'ENTRAR'}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-muted-foreground">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-primary font-semibold hover:underline">
                Crie aqui
              </Link>
            </p>
            <p className="text-muted-foreground">
              Esqueceu a senha?{' '}
              <Link to="/recuperar-senha" className="text-primary font-semibold hover:underline">
                Recuperar senha
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
