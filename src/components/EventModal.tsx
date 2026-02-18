import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, X, Pencil, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdminConfirmModal from './AdminConfirmModal';

const monthNames: Record<number, string> = {
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
};

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  day: number;
  month: number;
  gravador?: string;
  onStatusChange: (status: string | null) => void;
  onSavePublicacao: (link: string) => void;
  onRemovePublicacao: () => void;
  onSaveRoteiro: (roteiro: string) => void;
}

const statusLabels: Record<string, string> = {
  revisado: 'Revisado',
  producao: 'Em Produção',
  pronto: 'Pronto',
  publicado: 'Publicado',
};

const EventModal: React.FC<EventModalProps> = ({
  open,
  onClose,
  event,
  day,
  month,
  gravador,
  onStatusChange,
  onSavePublicacao,
  onRemovePublicacao,
  onSaveRoteiro,
}) => {
  const [showRoteiro, setShowRoteiro] = useState(false);
  const [showPublicacao, setShowPublicacao] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showConfirmModalForAdd, setShowConfirmModalForAdd] = useState(false);
  const [showConfirmModalForRemove, setShowConfirmModalForRemove] = useState(false);
  const [pendingLink, setPendingLink] = useState('');
  const [isEditingRoteiro, setIsEditingRoteiro] = useState(false);
  const [roteiroInput, setRoteiroInput] = useState('');
  const { profile } = useAuth();
  const { toast } = useToast();

  // Reset editing state when modal closes or event changes
  useEffect(() => {
    if (!open) {
      setIsEditingRoteiro(false);
      setShowRoteiro(false);
      setShowPublicacao(false);
    }
  }, [open]);

  useEffect(() => {
    if (event) {
      setRoteiroInput(event.roteiro || '');
    }
  }, [event]);

  if (!event) return null;

  const handleViewPublicacao = () => {
    if (event.publicacao) {
      window.open(event.publicacao, '_blank');
    } else {
      setShowPublicacao(!showPublicacao);
      setShowRoteiro(false);
    }
  };

  const handleSaveLink = () => {
    // Check admin status before proceeding
    if (!profile?.is_admin) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Apenas administradores podem adicionar links de publicação.', 
        variant: 'destructive' 
      });
      return;
    }

    let link = linkInput.trim();
    if (!link) return;

    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      link = 'https://' + link;
    }

    try {
      new URL(link);
      setPendingLink(link);
      setShowConfirmModalForAdd(true);
    } catch {
      toast({ 
        title: 'URL Inválida', 
        description: 'Por favor, insira uma URL válida', 
        variant: 'destructive' 
      });
    }
  };

  const confirmSaveLink = () => {
    onSavePublicacao(pendingLink);
    setLinkInput('');
    setPendingLink('');
    setShowPublicacao(false);
  };

  const handleRemoveLink = () => {
    // Check admin status before proceeding
    if (!profile?.is_admin) {
      toast({ 
        title: 'Acesso Negado', 
        description: 'Apenas administradores podem remover links de publicação.', 
        variant: 'destructive' 
      });
      return;
    }
    setShowConfirmModalForRemove(true);
  };

  const confirmRemoveLink = () => {
    onRemovePublicacao();
  };

  const toggleRoteiro = () => {
    setShowRoteiro(!showRoteiro);
    setShowPublicacao(false);
    if (!showRoteiro) {
      setIsEditingRoteiro(false);
      setRoteiroInput(event.roteiro || '');
    }
  };

  const handleEditRoteiro = () => {
    setIsEditingRoteiro(true);
    setRoteiroInput(event.roteiro || '');
  };

  const handleSaveRoteiro = () => {
    onSaveRoteiro(roteiroInput);
    setIsEditingRoteiro(false);
  };

  const handleCancelEditRoteiro = () => {
    setIsEditingRoteiro(false);
    setRoteiroInput(event.roteiro || '');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-primary">
              {event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col md:flex-row gap-6 max-h-[70vh]">
            {/* Left side - Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2 text-sm">
                <p>
                  <strong className="text-primary">Data:</strong>{' '}
                  {String(day).padStart(2, '0')} de {monthNames[month] || 'Fevereiro'} de 2026
                </p>
                <p>
                  <strong className="text-primary">Plataforma:</strong> {event.platform}
                </p>
                <p>
                  <strong className="text-primary">Status Atual:</strong>{' '}
                  {event.status ? statusLabels[event.status] : 'Sem status definido'}
                </p>
                {gravador && (
                  <p>
                    <strong className="text-primary">Gravador:</strong> {gravador}
                  </p>
                )}
              </div>

              {/* Status buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusChange(null)}
                  className="bg-white text-zinc-900 hover:bg-gray-100"
                >
                  Sem Status
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatusChange('revisado')}
                  className="bg-psiviver-azul text-white hover:bg-psiviver-azul/80"
                >
                  Revisado
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatusChange('producao')}
                  className="bg-psiviver-laranja text-white hover:bg-psiviver-laranja/80"
                >
                  Em Produção
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatusChange('pronto')}
                  className="bg-psiviver-amarelo text-foreground hover:bg-psiviver-amarelo-escuro"
                >
                  Pronto
                </Button>
                <Button
                  size="sm"
                  onClick={() => onStatusChange('publicado')}
                  className="bg-psiviver-verde text-white hover:bg-psiviver-verde/80"
                >
                  Publicado
                </Button>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={toggleRoteiro}
                >
                  {showRoteiro ? '❌ Fechar Roteiro' : '📄 Ver Roteiro'}
                </Button>
                <div className="relative">
                  <Button
                    variant="secondary"
                    className="w-full bg-psiviver-azul text-white hover:bg-psiviver-azul/80"
                    onClick={handleViewPublicacao}
                  >
                    {event.publicacao ? '🎬 Ver Publicação' : showPublicacao ? '❌ Fechar' : '🎬 Adicionar Publicação'}
                  </Button>
                  {event.publicacao && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLink();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Content */}
            {(showRoteiro || showPublicacao) && (
              <ScrollArea className="flex-1 border-l border-border pl-6 max-h-[60vh]">
                {showRoteiro && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-display text-primary">Roteiro</h3>
                      {!isEditingRoteiro ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleEditRoteiro}
                          className="gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEditRoteiro}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveRoteiro}
                            className="gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Salvar
                          </Button>
                        </div>
                      )}
                    </div>
                    {isEditingRoteiro ? (
                      <Textarea
                        value={roteiroInput}
                        onChange={(e) => setRoteiroInput(e.target.value)}
                        placeholder="Digite o roteiro aqui..."
                        className="min-h-[300px] bg-muted"
                      />
                    ) : (
                      <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {event.roteiro || (
                          <span className="text-muted-foreground italic">
                            Roteiro ainda não disponível para este evento. Clique em "Editar" para adicionar.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {showPublicacao && !event.publicacao && (
                  <div>
                    <h3 className="text-lg font-display text-primary mb-4">Adicionar Publicação</h3>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Adicione o link da publicação (requer senha de admin):
                      </p>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        className="bg-muted"
                      />
                      <Button onClick={handleSaveLink} className="w-full">
                        🔐 Salvar Link
                      </Button>
                    </div>
                  </div>
                )}

                {showPublicacao && event.publicacao && (
                  <div>
                    <h3 className="text-lg font-display text-primary mb-4">Publicação</h3>
                    <a
                      href={event.publicacao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-4 bg-muted rounded-lg border border-border text-primary hover:bg-muted/80 transition-colors break-all"
                    >
                      <ExternalLink className="w-5 h-5 flex-shrink-0" />
                      {event.publicacao}
                    </a>
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Modal for Adding Link */}
      <AdminConfirmModal
        open={showConfirmModalForAdd}
        onClose={() => {
          setShowConfirmModalForAdd(false);
          setPendingLink('');
        }}
        onConfirm={confirmSaveLink}
        title="Adicionar Link de Publicação"
        description="Tem certeza que deseja adicionar este link de publicação?"
        confirmLabel="Salvar Link"
      />

      {/* Confirm Modal for Removing Link */}
      <AdminConfirmModal
        open={showConfirmModalForRemove}
        onClose={() => setShowConfirmModalForRemove(false)}
        onConfirm={confirmRemoveLink}
        title="Remover Link da Publicação"
        description="Tem certeza que deseja remover este link de publicação?"
        confirmLabel="Remover Link"
        variant="destructive"
      />
    </>
  );
};

export default EventModal;
