import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuotes } from '@/contexts/QuotesContext';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, FileText, Upload, X, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import logoAtiva from '@/assets/logo-ativa.png';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MIN_WIDTH = 100;
const MIN_HEIGHT = 50;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 400;

export default function OrcamentosPublic() {
  const { publicId } = useParams();
  const { getQuoteByPublicId, signQuote } = useQuotes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [signerName, setSignerName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const quote = publicId ? getQuoteByPublicId(publicId) : undefined;

  const validateAndProcessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        reject('Formato inválido. Use PNG ou JPG.');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        reject('Arquivo muito grande. Máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          // Validate dimensions
          if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
            reject(`Imagem muito pequena. Mínimo ${MIN_WIDTH}x${MIN_HEIGHT}px.`);
            return;
          }

          // Resize if too large
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject('Erro ao processar imagem.');
            return;
          }

          // Fill white background (for transparency)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject('Erro ao carregar imagem.');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject('Erro ao ler arquivo.');
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    try {
      const dataUrl = await validateAndProcessImage(file);
      setSignatureDataUrl(dataUrl);
      toast.success('Assinatura carregada com sucesso!');
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsValidating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearSignature = () => {
    setSignatureDataUrl(null);
  };

  const handleSign = () => {
    if (!signerName.trim()) {
      toast.error('Digite seu nome completo');
      return;
    }
    if (!signatureDataUrl) {
      toast.error('Faça upload da sua assinatura');
      return;
    }
    if (!quote) return;

    signQuote(quote.id, signerName, signatureDataUrl);
    toast.success('Orçamento assinado com sucesso!');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#3ee0cf' }}>
        <GlassPanel className="p-12 text-center">
          <p className="text-zinc-500">Orçamento não encontrado ou link inválido</p>
        </GlassPanel>
      </div>
    );
  }

  const isSigned = quote.status === 'assinado';

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#3ee0cf' }}>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Public Notice */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow">Orçamento público</h1>
          <p className="text-sm text-white/80 mt-1">Não possui validade como comprovante jurídico</p>
        </div>

        {/* Header */}
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between">
            <img src={logoAtiva} alt="Logo" className="h-16" />
            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-800">{quote.publicId}</p>
              <p className="text-sm text-zinc-500">Versão {quote.version}</p>
            </div>
          </div>
        </GlassPanel>

        {/* Client Info */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">Dados do Cliente</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-sm text-zinc-500">Nome do Condomínio</p>
                <p className="font-semibold text-zinc-800">{quote.clientName}</p>
              </div>
              {quote.clientCnpj && (
                <div>
                  <p className="text-sm text-zinc-500">CNPJ</p>
                  <p className="font-semibold text-zinc-800">{quote.clientCnpj}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-zinc-500 mb-1">Síndico Responsável:</p>
                <p className="font-semibold text-zinc-800 text-base">{quote.clientSindico || '-'}</p>
              </div>
            </div>
            <div className="space-y-2">
              {quote.clientPhone && (
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Telefone:</p>
                  <p className="font-semibold text-zinc-800">{quote.clientPhone}</p>
                </div>
              )}
              {quote.clientEmail && (
                <div>
                  <p className="text-sm text-zinc-500">E-mail</p>
                  <p className="font-semibold text-zinc-800">{quote.clientEmail}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-zinc-500">Válido até</p>
                <p className="font-semibold text-zinc-800">
                  {format(quote.validUntil, "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
          {quote.clientAddress && (
            <div className="mt-4">
              <p className="text-sm text-zinc-500">Endereço</p>
              <p className="font-semibold text-zinc-800">{quote.clientAddress}</p>
            </div>
          )}
        </GlassPanel>

        {/* Items */}
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Itens do Orçamento
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200">
                <tr className="text-left text-sm text-zinc-500">
                  <th className="pb-3">Item</th>
                  <th className="pb-3 text-center">Qtd</th>
                  <th className="pb-3 text-right">Valor Un.</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-zinc-50' : ''}>
                    <td className="py-3 px-2">
                      <p className="font-medium text-zinc-800">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.description}</p>
                    </td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 pt-4 border-t border-zinc-200 space-y-2">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.financials.subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Impostos ({quote.financials.taxRate}%)</span>
              <span>{formatCurrency(quote.financials.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-[#3EE0CF]">{formatCurrency(quote.financials.total)}</span>
            </div>
          </div>
        </GlassPanel>

        {/* Signature Section */}
        <GlassPanel className="p-6">
          {isSigned ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-600 mb-2">Orçamento Aprovado!</h2>
              <p className="text-zinc-600">
                Assinado por <strong>{quote.signature?.name}</strong> em{' '}
                {quote.signature && format(quote.signature.signedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              <div className="mt-6 flex justify-center">
                <img 
                  src={quote.signature?.dataUrl} 
                  alt="Assinatura" 
                  className="h-24 border border-zinc-200 rounded-lg bg-white p-2"
                />
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-zinc-800 mb-4">Aceite do Orçamento</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signerName">Nome Completo *</Label>
                  <Input
                    id="signerName"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="mt-1 bg-white"
                  />
                </div>

                <div>
                  <Label>Assinatura *</Label>
                  <p className="text-xs text-zinc-500 mb-2">
                    Faça upload de uma imagem da sua assinatura (PNG ou JPG, máx. 2MB)
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {signatureDataUrl ? (
                    <div className="relative border border-zinc-300 rounded-lg bg-white p-4">
                      <img 
                        src={signatureDataUrl} 
                        alt="Pré-visualização da assinatura" 
                        className="max-h-32 mx-auto"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSignature}
                        className="absolute top-2 right-2 h-8 w-8 text-zinc-500 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#3EE0CF] hover:bg-zinc-50 transition-colors"
                    >
                      {isValidating ? (
                        <div className="text-zinc-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3EE0CF] mx-auto mb-2" />
                          <p>Processando...</p>
                        </div>
                      ) : (
                        <>
                          <Image className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                          <p className="text-zinc-600 font-medium">Clique para fazer upload</p>
                          <p className="text-xs text-zinc-400 mt-1">PNG ou JPG • Máx. 2MB</p>
                        </>
                      )}
                    </div>
                  )}

                  {signatureDataUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Trocar assinatura
                    </Button>
                  )}
                </div>

                <Button
                  onClick={handleSign}
                  className="w-full bg-[#3EE0CF] hover:bg-[#35c9ba] text-black py-6 text-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Assinar e Aprovar Orçamento
                </Button>
              </div>
            </>
          )}
        </GlassPanel>

        {quote.observations && (
          <GlassPanel className="p-6">
            <h2 className="text-sm font-semibold text-zinc-600 mb-2">Observações</h2>
            <p className="text-zinc-700">{quote.observations}</p>
          </GlassPanel>
        )}

      </div>
    </div>
  );
}
