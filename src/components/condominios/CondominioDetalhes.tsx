import { useRef } from "react";
import { ArrowLeft, Building2, MapPin, Phone, Mail, User, FileText, Download, Trash2, Plus, Eye, Calendar, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Condominio, STATUS_COLORS, STATUS_LABELS } from "@/types/condominios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface CondominioDetalhesProps {
  condominio: Condominio;
  onBack: () => void;
  onAddDocument: (file: File) => Promise<void>;
  onRemoveDocument: (docId: string) => void;
}

export const CondominioDetalhes = ({ 
  condominio, 
  onBack, 
  onAddDocument, 
  onRemoveDocument 
}: CondominioDetalhesProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }
      try {
        await onAddDocument(file);
        toast.success("Documento adicionado com sucesso!");
      } catch {
        toast.error("Erro ao adicionar documento.");
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownload = (doc: { name: string; url: string }) => {
    const link = document.createElement("a");
    link.href = doc.url;
    link.download = doc.name;
    link.click();
  };

  const handleView = (doc: { url: string; name: string }) => {
    // Se for um data URL (base64), converter para blob para visualização correta
    if (doc.url.startsWith('data:')) {
      try {
        const [header, base64] = doc.url.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        
        // Limpar o blob URL após um tempo para evitar memory leak
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } catch (error) {
        console.error('Erro ao abrir documento:', error);
        toast.error("Erro ao abrir o documento.");
      }
    } else {
      window.open(doc.url, "_blank");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Botão Voltar */}
      <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-800">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Lista
      </Button>

      {/* Header Gigante */}
      <Card className="bg-white border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{condominio.nome}</h1>
                <Badge className={`${STATUS_COLORS[condominio.statusContrato].bg} ${STATUS_COLORS[condominio.statusContrato].text} border-0`}>
                  {STATUS_LABELS[condominio.statusContrato]}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-4 h-4" />
                <span>{condominio.endereco}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {condominio.servicos.map((servico) => (
                  <Badge key={servico} className="bg-blue-100 text-blue-700 border-0">
                    {servico}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Valor do Contrato</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(condominio.valorContrato)}
              </p>
              <p className="text-sm text-slate-400">/mês</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Informações */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contato */}
        <Card className="bg-white border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{condominio.sindico}</span>
            </div>
            <a href={`tel:${condominio.telefone}`} className="flex items-center gap-3 text-blue-600 hover:underline">
              <Phone className="w-4 h-4" />
              <span>{condominio.telefone}</span>
            </a>
            <a href={`mailto:${condominio.email}`} className="flex items-center gap-3 text-blue-600 hover:underline">
              <Mail className="w-4 h-4" />
              <span className="truncate">{condominio.email}</span>
            </a>
          </CardContent>
        </Card>

        {/* Detalhes */}
        <Card className="bg-white border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{condominio.numUnidades || '-'} unidades</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                Início: {condominio.dataInicio ? format(new Date(condominio.dataInicio), "dd/MM/yyyy", { locale: ptBR }) : '-'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 text-sm truncate">ID: {condominio.id.slice(0, 8)}...</span>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="bg-white border-slate-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-700">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 text-sm">
              {condominio.observacoes || 'Nenhuma observação registrada.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Área de Documentos */}
      <Card className="bg-white border-slate-100 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-slate-700">Documentos</CardTitle>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Documento
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
        </CardHeader>
        <CardContent>
          {(!condominio.documents || condominio.documents.length === 0) ? (
            <p className="text-slate-500 text-center py-6">Nenhum documento anexado.</p>
          ) : (
            <div className="space-y-2">
              {condominio.documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(doc.uploadedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleView(doc)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onRemoveDocument(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
