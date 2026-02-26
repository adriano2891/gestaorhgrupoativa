import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Building2, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClientesOrcamentos, ClienteOrcamentoInput } from '@/hooks/useClientesOrcamentos';
import { toast } from 'sonner';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function OrcamentosClienteForm() {
  const navigate = useNavigate();
  const { addCliente } = useClientesOrcamentos();

  const [formData, setFormData] = useState<ClienteOrcamentoInput>({
    nome_condominio: '',
    nome_sindico: '',
    email: '',
    telefone: '',
    numero_unidades: undefined,
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof ClienteOrcamentoInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{0,3})/, '$1-$2').trim();
  };

  const handlePhoneChange = (value: string) => {
    handleChange('telefone', formatPhone(value));
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    handleChange('cep', formatted);

    // Auto-fill address from CEP
    const numbers = value.replace(/\D/g, '');
    if (numbers.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const validateForm = () => {
    if (!formData.nome_condominio.trim()) {
      toast.error('Nome do Condomínio é obrigatório');
      return false;
    }
    if (!formData.nome_sindico.trim()) {
      toast.error('Nome do Síndico é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('E-mail é obrigatório');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('E-mail inválido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsSubmitting(false);
      toast.error('Tempo esgotado ao salvar. Verifique sua conexão e tente novamente.');
    }, 15000);

    try {
      // Clean empty strings to null for optional fields
      const cleanedData: ClienteOrcamentoInput = {
        nome_condominio: formData.nome_condominio.trim(),
        nome_sindico: formData.nome_sindico.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone || undefined,
        cep: formData.cep || undefined,
        rua: formData.rua || undefined,
        numero: formData.numero || undefined,
        complemento: formData.complemento || undefined,
        bairro: formData.bairro || undefined,
        cidade: formData.cidade || undefined,
        estado: formData.estado || undefined,
        numero_unidades: formData.numero_unidades || undefined,
        observacoes: formData.observacoes || undefined,
      };

      console.log('Saving client data:', cleanedData);
      const savedClient = await addCliente.mutateAsync(cleanedData);
      clearTimeout(timeout);
      console.log('Client saved successfully:', savedClient);
      
      if (savedClient?.id) {
        navigate('/orcamentos/novo', { state: { selectedClientId: savedClient.id } });
      } else {
        toast.error('Cliente salvo mas ID não retornado. Tente novamente.');
      }
    } catch (error: any) {
      clearTimeout(timeout);
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente: ' + (error?.message || 'Tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <QuotesLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton 
            to="/orcamentos/novo" 
            variant="light" 
            className="text-white hover:bg-white/10" 
          />
          <div>
            <h1 className="text-2xl font-bold text-white">Cadastrar Cliente</h1>
            <p className="text-white/80">Preencha os dados do novo cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Data */}
            <div className="space-y-6">
              <GlassPanel className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-[#3EE0CF]" />
                  <h2 className="text-lg font-semibold text-zinc-800">Dados Básicos</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_condominio">Nome do Condomínio *</Label>
                    <Input
                      id="nome_condominio"
                      value={formData.nome_condominio}
                      onChange={(e) => handleChange('nome_condominio', e.target.value)}
                      className="mt-1 bg-white"
                      placeholder="Ex: Condomínio Residencial Solar"
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nome_sindico">Síndico Responsável *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="nome_sindico"
                        value={formData.nome_sindico}
                        onChange={(e) => handleChange('nome_sindico', e.target.value)}
                        className="pl-10 bg-white"
                        placeholder="Nome completo do síndico responsável"
                        maxLength={150}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="numero_unidades">Número de Unidades</Label>
                    <Input
                      id="numero_unidades"
                      type="number"
                      value={formData.numero_unidades || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        numero_unidades: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      className="mt-1 bg-white"
                      placeholder="Ex: 120"
                      min={1}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="pl-10 bg-white"
                        placeholder="email@exemplo.com"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="pl-10 bg-white"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Additional Info */}
              <GlassPanel className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-[#3EE0CF]" />
                  <h2 className="text-lg font-semibold text-zinc-800">Informações Adicionais</h2>
                </div>
                
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    className="mt-1 bg-white"
                    rows={4}
                    placeholder="Informações adicionais sobre o cliente..."
                    maxLength={1000}
                  />
                </div>
              </GlassPanel>
            </div>

            {/* Right Column - Address */}
            <div className="space-y-6">
              <GlassPanel className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-[#3EE0CF]" />
                  <h2 className="text-lg font-semibold text-zinc-800">Endereço</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="mt-1 bg-white"
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Digite o CEP para preencher automaticamente
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="rua">Rua / Avenida</Label>
                      <Input
                        id="rua"
                        value={formData.rua}
                        onChange={(e) => handleChange('rua', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="Nome da rua"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        value={formData.numero}
                        onChange={(e) => handleChange('numero', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="000"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.complemento}
                      onChange={(e) => handleChange('complemento', e.target.value)}
                      className="mt-1 bg-white"
                      placeholder="Bloco, Apartamento, Sala..."
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={formData.bairro}
                      onChange={(e) => handleChange('bairro', e.target.value)}
                      className="mt-1 bg-white"
                      placeholder="Nome do bairro"
                      maxLength={100}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleChange('cidade', e.target.value)}
                        className="mt-1 bg-white"
                        placeholder="Nome da cidade"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">Estado</Label>
                      <Select 
                        value={formData.estado} 
                        onValueChange={(value) => handleChange('estado', value)}
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BRASIL.map(uf => (
                            <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* Action Buttons */}
              <GlassPanel className="p-6">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/orcamentos/novo')}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#3EE0CF] hover:bg-[#35c9ba] text-black"
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                  </Button>
                </div>
              </GlassPanel>
            </div>
          </div>
        </form>
      </div>
    </QuotesLayout>
  );
}
