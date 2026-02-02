import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setValidSession(!!session);
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos!",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem!",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
      toast({
        title: "Sucesso!",
        description: "Sua senha foi alterada com sucesso!",
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  if (!validSession && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-animated p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              Link de recuperação inválido ou expirado.
            </p>
            <Button className="mt-4" onClick={() => navigate('/recuperar-senha')}>
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-animated p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <h1 className="text-3xl font-display font-bold text-primary animate-glow tracking-widest">
            PSIVIVER
          </h1>
          <p className="text-muted-foreground mt-2">
            Redefinir Senha
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-psiviver-verde flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Senha alterada com sucesso!
              </h2>
              <p className="text-muted-foreground">
                Você será redirecionado para a página de login em instantes...
              </p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-card border-2 border-primary flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-primary font-semibold">
                    Nova Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-primary font-semibold">
                    Confirme a Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-muted border-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'SALVAR NOVA SENHA'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
