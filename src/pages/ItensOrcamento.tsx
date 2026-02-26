import { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Package, Upload, X, Image as ImageIcon } from 'lucide-react';
import { QuotesLayout } from '@/components/orcamentos/QuotesLayout';
import { GlassPanel } from '@/components/orcamentos/GlassPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useItensOrcamento, ItemOrcamentoInput } from '@/hooks/useItensOrcamento';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ItemOrcamentoInput>({
    nome: '',
    descricao: '',
    preco_base: 0,
    categoria: '',
    imagem_url: '',
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
      imagem_url: '',
      ativo: true
    });
    setImagePreview(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelectedItem(item.id);
    setFormData({
      nome: item.nome,
      descricao: item.descricao || '',
      preco_base: Number(item.preco_base),
      categoria: item.categoria || '',
      imagem_url: item.imagem_url || '',
      ativo: item.ativo
    });
    setImagePreview(item.imagem_url || null);
    setDialogOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setSelectedItem(id);
    setDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('produtos')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imagem_url: publicUrl });
      setImagePreview(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao enviar imagem: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imagem_url: '' });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('O nome do item é obrigatório.');
      return;
    }

    try {
      if (selectedItem) {
        await updateItem.mutateAsync({ id: selectedItem, ...formData });
      } else {
        await createItem.mutateAsync(formData);
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar item:', error);
    }
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
            className="bg-[#3EE0CF] hover:bg-[#35c9ba] text-black shadow-lg"
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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-600">Imagem</th>
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
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
                      Carregando...
                    </td>
                  </tr>
                ) : filteredItens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-zinc-500">
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
                      <td className="px-6 py-4">
                        {item.imagem_url ? (
                          <img 
                            src={item.imagem_url} 
                            alt={item.nome}
                            className="w-12 h-12 object-cover rounded-lg border border-zinc-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-zinc-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                      </td>
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
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagem do Produto</Label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded-lg border border-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#3EE0CF] hover:bg-[#3EE0CF]/10 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-zinc-400" />
                      <span className="text-xs text-zinc-500 mt-1">Upload</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                    </Button>
                    <p className="text-xs text-zinc-500 mt-2">
                      Formatos: JPG, PNG, GIF. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

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
                className="bg-[#3EE0CF] hover:bg-[#35c9ba] text-black"
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
