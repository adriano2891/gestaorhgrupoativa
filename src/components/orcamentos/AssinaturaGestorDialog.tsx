import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AssinaturaGestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSign: (signatureDataUrl: string) => void;
  signerName: string;
}

export function AssinaturaGestorDialog({
  open,
  onOpenChange,
  onSign,
  signerName,
}: AssinaturaGestorDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG ou PNG.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSign = async () => {
    if (!preview) {
      toast.error('Faça o upload da sua assinatura primeiro.');
      return;
    }

    setIsSubmitting(true);
    try {
      onSign(preview);
      toast.success('Orçamento assinado com sucesso!');
      handleClose();
    } catch {
      toast.error('Erro ao assinar o orçamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setFileName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Assinar Orçamento
          </DialogTitle>
          <DialogDescription>
            Faça o upload da imagem da sua assinatura (JPG ou PNG) para assinar este orçamento.
            Após a assinatura, o documento será bloqueado para edição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <strong>Responsável:</strong> {signerName}
          </div>

          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            {preview ? (
              <div className="space-y-3">
                <img
                  src={preview}
                  alt="Preview da assinatura"
                  className="max-h-24 mx-auto border rounded bg-white p-2"
                />
                <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
                  <FileImage className="w-4 h-4" />
                  {fileName}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setFileName('');
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-zinc-400" />
                <p className="text-sm font-medium text-zinc-700">
                  Clique para fazer upload da assinatura
                </p>
                <p className="text-xs text-zinc-500">JPG ou PNG • Máx. 5MB</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSign}
            disabled={!preview || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? 'Assinando...' : 'Assinar Orçamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
