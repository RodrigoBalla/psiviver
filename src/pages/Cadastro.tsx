import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Cadastro = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !phone || !password || !confirmPassword) {
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
    const { error } = await signUp(email, password, name, phone);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: "Erro",
          description: "Este email já está cadastrado. Faça login ou recupere sua senha.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      setRegistrationSuccess(true);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Show success screen after registration
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-animated p-4">
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-primary">
              Verifique seu Email
            </h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Cadastro realizado com sucesso!</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Enviamos um email de verificação para:
              </p>
              <p className="font-medium text-foreground break-all">
                {email}
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Para ativar sua conta, clique no link de confirmação que enviamos para o seu email.
              </p>
              <p>
                <strong className="text-foreground">Importante:</strong> Verifique também a pasta de spam ou lixo eletrônico.
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Após confirmar seu email, você poderá fazer login:
              </p>
              <Link to="/login">
                <Button className="w-full" size="lg">
                  Ir para Login
                </Button>
              </Link>
            </div>
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
            Criar Nova Conta
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-primary font-semibold">
                Nome Completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

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
              <Label htmlFor="phone" className="text-primary font-semibold">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="bg-muted border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary font-semibold">
                Nova Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-primary font-semibold">
                Confirme a Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-muted border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'CADASTRAR'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Entre aqui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
