import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewEventModalProps {
  open: boolean;
  onClose: () => void;
  day: number;
  onSave: (event: { platform: string; title: string }) => void;
}

const platforms = [
  'Instagram',
  'YouTube',
  'TikTok',
  'Facebook',
  'LinkedIn',
  'Twitter/X',
  'Blog',
  'Podcast',
  'Newsletter',
  'Outro',
];

const NewEventModal: React.FC<NewEventModalProps> = ({
  open,
  onClose,
  day,
  onSave,
}) => {
  const [platform, setPlatform] = useState('');
  const [title, setTitle] = useState('');

  const handleSave = () => {
    if (!platform || !title.trim()) return;
    onSave({ platform, title: title.trim() });
    setPlatform('');
    setTitle('');
    onClose();
  };

  const handleClose = () => {
    setPlatform('');
    setTitle('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display text-primary">
            ➕ Novo Evento - Dia {String(day).padStart(2, '0')}/02/26
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform" className="bg-muted">
                <SelectValue placeholder="Selecione a plataforma..." />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título do Evento</Label>
            <Input
              id="title"
              placeholder="Ex: Post sobre ansiedade..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={!platform || !title.trim()}
            >
              💾 Salvar Evento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewEventModal;
