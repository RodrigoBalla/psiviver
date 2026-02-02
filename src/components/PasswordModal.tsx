import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

interface PasswordModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
}

const ADMIN_PASSWORD = 'PSIVIVER2026';

const PasswordModal: React.FC<PasswordModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'default',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (password === ADMIN_PASSWORD) {
      onConfirm();
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-primary flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-muted-foreground">
            {description}
          </p>
          <Input
            type="password"
            placeholder="Senha de administrador..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            className={`bg-muted ${error ? 'border-destructive animate-shake' : ''}`}
          />
          {error && (
            <p className="text-destructive text-sm animate-fade-in">
              ❌ Senha incorreta, verifique e tente novamente.
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant={variant}
              className="flex-1"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModal;
