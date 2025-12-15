import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuotes } from '@/contexts/QuotesContext';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import logoAtiva from '@/assets/logo-ativa.png';

export default function OrcamentosPublic() {
  const { publicId } = useParams();
  const { getQuoteByPublicId, signQuote } = useQuotes();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  const quote = publicId ? getQuoteByPublicId(publicId) : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!signerName.trim()) {
      toast.error('Digite seu nome completo');
      return;
    }
    if (!hasSignature) {
      toast.error('Faça sua assinatura no campo abaixo');
      return;
    }
    if (!quote) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Cliente</p>
              <p className="font-semibold text-zinc-800">{quote.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Válido até</p>
              <p className="font-semibold text-zinc-800">
                {format(quote.validUntil, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
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
              <span className="text-[#006fee]">{formatCurrency(quote.financials.total)}</span>
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
                    Desenhe sua assinatura no campo abaixo usando o mouse ou o dedo
                  </p>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="w-full border border-zinc-300 rounded-lg cursor-crosshair bg-white touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearSignature}
                    className="mt-2"
                  >
                    Limpar assinatura
                  </Button>
                </div>

                <Button
                  onClick={handleSign}
                  className="w-full bg-[#006fee] hover:bg-[#0058c4] text-white py-6 text-lg"
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

        <p className="text-center text-white/80 text-sm">
          © {new Date().getFullYear()} Grupo Ativa • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
