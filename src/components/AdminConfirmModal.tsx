import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
}

const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'default',
}) => {
  const { profile } = useAuth();
  const isAdmin = profile?.is_admin === true;

  const handleConfirm = () => {
    if (isAdmin) {
      onConfirm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-primary flex items-center gap-2">
            {isAdmin ? (
              <ShieldCheck className="w-5 h-5 text-green-600" />
            ) : (
              <ShieldX className="w-5 h-5 text-destructive" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {isAdmin ? (
            <>
              <p className="text-muted-foreground">{description}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose}>
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
            </>
          ) : (
            <>
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-destructive font-medium">
                  ⚠️ Acesso Restrito
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Esta ação requer permissões de administrador. Você não tem autorização para executar esta operação.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={onClose}>
                Fechar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminConfirmModal;