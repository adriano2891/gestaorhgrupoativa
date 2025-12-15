import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useItensOrcamento, ItemOrcamentoInput } from '@/hooks/useItensOrcamento';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function ItensOrcamento() {
  const { itens, isLoading, createItem, updateItem, deleteItem } = useItensOrcamento();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [formData, setFormData] = useState<ItemOrcamentoInput>({
    nome: '',
    descricao: '',
    preco_base: 0,
    categoria: '',
    ativo: true
  });

  const filteredItens = itens.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setFormData({
      nome: '',
      descricao: '',
      preco_base: 0,
      categoria: '',
      ativo: true
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item.id);
    setFormData({
      nome: item.nome,
      descricao: item.descricao || '',
      preco_base: Number(item.preco_base),
      categoria: item.categoria || '',
      ativo: item.ativo
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setSelectedItem(id);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItem) {
      await updateItem.mutateAsync({ id: selectedItem, ...formData });
    } else {
      await createItem.mutateAsync(formData);
    }
    
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      await deleteItem.mutateAsync(selectedItem);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <QuotesLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Cadastro de Itens</h1>
            <p className="text-white/80">Gerencie os itens disponíveis para orçamentos</p>
          </div>
          <Button 
            onClick={handleOpenCreate}
            className="bg-[#006fee] hover:bg-[#0058c4] text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>

        {/* Search */}
        <GlassPanel className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-zinc-200"
            />
          </div>
        </GlassPanel>

        {/* Items Table */}
        <GlassPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Nome</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Descrição</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Categoria</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-zinc-600">Preço Base</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-zinc-600">Status</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-zinc-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredItens.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="w-12 h-12 text-zinc-300" />
                        <p>Nenhum item cadastrado ainda. Clique em "Novo Item" para começar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItens.map((item, index) => (
                    <tr 
                      key={item.id}
                      className={`border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-zinc-50/30'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-zinc-800">{item.nome}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600 max-w-xs truncate">
                        {item.descricao || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{item.categoria || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-800">
                        {formatCurrency(Number(item.preco_base))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.ativo ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(item.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do item"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do item"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_base">Preço Base (R$) *</Label>
                  <Input
                    id="preco_base"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.preco_base}
                    onChange={(e) => setFormData({ ...formData, preco_base: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Serviços, Produtos"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="ativo">Item ativo</Label>
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-[#006fee] hover:bg-[#0058c4]"
                disabled={createItem.isPending || updateItem.isPending}
              >
                {selectedItem ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </QuotesLayout>
  );
}
