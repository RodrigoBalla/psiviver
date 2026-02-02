import React, { useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, X } from 'lucide-react';
import PasswordModal from './PasswordModal';

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  day: number;
  gravador?: string;
  onStatusChange: (status: string | null) => void;
  onSavePublicacao: (link: string) => void;
  onRemovePublicacao: () => void;
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
  gravador,
  onStatusChange,
  onSavePublicacao,
  onRemovePublicacao,
}) => {
  const [showRoteiro, setShowRoteiro] = useState(false);
  const [showPublicacao, setShowPublicacao] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showPasswordModalForAdd, setShowPasswordModalForAdd] = useState(false);
  const [showPasswordModalForRemove, setShowPasswordModalForRemove] = useState(false);
  const [pendingLink, setPendingLink] = useState('');

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
    let link = linkInput.trim();
    if (!link) return;

    if (!link.startsWith('http://') && !link.startsWith('https://')) {
      link = 'https://' + link;
    }

    try {
      new URL(link);
      setPendingLink(link);
      setShowPasswordModalForAdd(true);
    } catch {
      alert('Por favor, insira uma URL válida');
    }
  };

  const confirmSaveLink = () => {
    onSavePublicacao(pendingLink);
    setLinkInput('');
    setPendingLink('');
    setShowPublicacao(false);
  };

  const handleRemoveLink = () => {
    setShowPasswordModalForRemove(true);
  };

  const confirmRemoveLink = () => {
    onRemovePublicacao();
  };

  const toggleRoteiro = () => {
    setShowRoteiro(!showRoteiro);
    setShowPublicacao(false);
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
                  {String(day).padStart(2, '0')} de Fevereiro de 2026
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
                    <h3 className="text-lg font-display text-primary mb-4">Roteiro</h3>
                    <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {event.roteiro || (
                        <span className="text-muted-foreground italic">
                          Roteiro ainda não disponível para este evento.
                        </span>
                      )}
                    </div>
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

      {/* Password Modal for Adding Link */}
      <PasswordModal
        open={showPasswordModalForAdd}
        onClose={() => {
          setShowPasswordModalForAdd(false);
          setPendingLink('');
        }}
        onConfirm={confirmSaveLink}
        title="Adicionar Link de Publicação"
        description="Digite a senha de administrador para adicionar o link:"
        confirmLabel="Salvar Link"
      />

      {/* Password Modal for Removing Link */}
      <PasswordModal
        open={showPasswordModalForRemove}
        onClose={() => setShowPasswordModalForRemove(false)}
        onConfirm={confirmRemoveLink}
        title="Remover Link da Publicação"
        description="Digite a senha de administrador para remover o link:"
        confirmLabel="Remover Link"
        variant="destructive"
      />
    </>
  );
};

export default EventModal;
