import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Condominio, CondoStatus, SERVICOS_DISPONIVEIS } from "@/types/condominios";
import { toast } from "sonner";

interface CondominioFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Condominio, 'id' | 'updatedAt' | 'documents'>) => void;
  condominio?: Condominio | null;
}

const initialState = {
  nome: "",
  endereco: "",
  numUnidades: "",
  sindico: "",
  telefone: "",
  email: "",
  servicos: [] as string[],
  statusContrato: "ativo" as CondoStatus,
  dataInicio: "",
  valorContrato: "",
  observacoes: ""
};

export const CondominioForm = ({ open, onClose, onSave, condominio }: CondominioFormProps) => {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (condominio) {
      setForm({
        nome: condominio.nome,
        endereco: condominio.endereco,
        numUnidades: condominio.numUnidades || "",
        sindico: condominio.sindico,
        telefone: condominio.telefone,
        email: condominio.email,
        servicos: condominio.servicos,
        statusContrato: condominio.statusContrato,
        dataInicio: condominio.dataInicio,
        valorContrato: condominio.valorContrato,
        observacoes: condominio.observacoes
      });
    } else {
      setForm(initialState);
    }
  }, [condominio, open]);

  const toggleServico = (servico: string) => {
    setForm(prev => ({
      ...prev,
      servicos: prev.servicos.includes(servico)
        ? prev.servicos.filter(s => s !== servico)
        : [...prev.servicos, servico]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome || !form.endereco || !form.sindico || !form.telefone || !form.email) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    onSave(form);
    onClose();
    toast.success(condominio ? "Condomínio atualizado!" : "Condomínio cadastrado!");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800">
            {condominio ? "Editar Condomínio" : "Novo Condomínio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Condomínio *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Edifício Solar"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sindico">Síndico *</Label>
              <Input
                id="sindico"
                value={form.sindico}
                onChange={(e) => setForm({ ...form, sindico: e.target.value })}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              placeholder="Logradouro completo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numUnidades">Nº de Unidades</Label>
              <Input
                id="numUnidades"
                value={form.numUnidades}
                onChange={(e) => setForm({ ...form, numUnidades: e.target.value })}
                placeholder="Ex: 50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contato@email.com"
              />
            </div>
          </div>

          {/* Dados do Contrato */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-slate-700 mb-4">Dados do Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={form.statusContrato} 
                  onValueChange={(v) => setForm({ ...form, statusContrato: v as CondoStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorContrato">Valor Mensal (R$)</Label>
                <Input
                  id="valorContrato"
                  value={form.valorContrato}
                  onChange={(e) => setForm({ ...form, valorContrato: e.target.value })}
                  placeholder="5000.00"
                />
              </div>
            </div>
          </div>

          {/* Serviços */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-slate-700 mb-4">Serviços Contratados</h3>
            <div className="flex flex-wrap gap-2">
              {SERVICOS_DISPONIVEIS.map((servico) => (
                <Button
                  key={servico}
                  type="button"
                  variant={form.servicos.includes(servico) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleServico(servico)}
                  className={form.servicos.includes(servico) ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {servico}
                </Button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Anotações adicionais..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {condominio ? "Salvar Alterações" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
