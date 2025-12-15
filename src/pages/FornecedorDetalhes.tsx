import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Building2, Phone, Mail, MapPin, Calendar, Package, FileText, History, Plus, Trash2, Upload, Download, Image } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  useFornecedor, 
  useEnderecoFornecedor, 
  useItensFornecedor, 
  useDocumentosFornecedor,
  useCreateItemFornecedor,
  useUpdateItemFornecedor,
  useDeleteItemFornecedor,
  useCreateDocumentoFornecedor,
  useDeleteDocumentoFornecedor,
  useHistoricoPrecos,
} from '@/hooks/useFornecedores';
import { TIPO_FORNECEDOR_LABELS, STATUS_FORNECEDOR_LABELS, TIPO_DOCUMENTO_OPTIONS, ItemFornecedor } from '@/types/fornecedores';

export default function FornecedorDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const { data: fornecedor, isLoading } = useFornecedor(id);
  const { data: endereco } = useEnderecoFornecedor(id);
  const { data: itens = [] } = useItensFornecedor(id);
  const { data: documentos = [] } = useDocumentosFornecedor(id);
  
  const createItem = useCreateItemFornecedor();
  const updateItem = useUpdateItemFornecedor();
  const deleteItem = useDeleteItemFornecedor();
  const createDocumento = useCreateDocumentoFornecedor();
  const deleteDocumento = useDeleteDocumentoFornecedor();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemFornecedor | null>(null);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<string | null>(null);

  // Item form state
  const [itemForm, setItemForm] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    valor: '',
    unidade: '',
    prazo_entrega: '',
  });
  const [itemImage, setItemImage] = useState<File | null>(null);

  // Document form state
  const [docForm, setDocForm] = useState({
    tipo_documento: '',
    arquivo: null as File | null,
  });

  const resetItemForm = () => {
    setItemForm({
      nome: '',
      descricao: '',
      categoria: '',
      valor: '',
      unidade: '',
      prazo_entrega: '',
    });
    setItemImage(null);
    setEditingItem(null);
  };

  const handleOpenItemDialog = (item?: ItemFornecedor) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        nome: item.nome,
        descricao: item.descricao || '',
        categoria: item.categoria || '',
        valor: item.valor.toString(),
        unidade: item.unidade || '',
        prazo_entrega: item.prazo_entrega?.toString() || '',
      });
    } else {
      resetItemForm();
    }
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!id) return;

    let imageUrl = editingItem?.imagem_url || null;
    
    if (itemImage) {
      const fileExt = itemImage.name.split('.').pop();
      const fileName = `${id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('fornecedores')
        .upload(fileName, itemImage);
      
      if (uploadError) {
        toast.error('Erro ao fazer upload da imagem');
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('fornecedores')
        .getPublicUrl(fileName);
      
      imageUrl = publicUrl;
    }

    const itemData = {
      fornecedor_id: id,
      nome: itemForm.nome,
      descricao: itemForm.descricao || null,
      categoria: itemForm.categoria || null,
      valor: parseFloat(itemForm.valor) || 0,
      unidade: itemForm.unidade || null,
      prazo_entrega: itemForm.prazo_entrega ? parseInt(itemForm.prazo_entrega) : null,
      imagem_url: imageUrl,
      ativo: true,
    };

    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        fornecedor_id: id,
        updates: itemData,
      });
    } else {
      await createItem.mutateAsync(itemData);
    }

    setItemDialogOpen(false);
    resetItemForm();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return;
    await deleteItem.mutateAsync({ id: itemId, fornecedor_id: id });
  };

  const handleUploadDocument = async () => {
    if (!id || !docForm.arquivo || !docForm.tipo_documento) return;

    const fileExt = docForm.arquivo.name.split('.').pop();
    const fileName = `${id}/docs/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('fornecedores')
      .upload(fileName, docForm.arquivo);
    
    if (uploadError) {
      toast.error('Erro ao fazer upload do documento');
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('fornecedores')
      .getPublicUrl(fileName);

    await createDocumento.mutateAsync({
      fornecedor_id: id,
      tipo_documento: docForm.tipo_documento,
      nome_arquivo: docForm.arquivo.name,
      arquivo_url: publicUrl,
    });

    setDocumentDialogOpen(false);
    setDocForm({ tipo_documento: '', arquivo: null });
  };

  const handleDeleteDocument = async (docId: string, arquivoUrl: string) => {
    if (!id) return;
    await deleteDocumento.mutateAsync({ id: docId, fornecedor_id: id, arquivo_url: arquivoUrl });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (!fornecedor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-500">Fornecedor não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/fornecedores')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                  {fornecedor.nome_fantasia || fornecedor.razao_social}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">{fornecedor.cpf_cnpj}</span>
                  <Badge
                    className={
                      fornecedor.status === 'ativo'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-700'
                    }
                  >
                    {STATUS_FORNECEDOR_LABELS[fornecedor.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate(`/fornecedores/${id}/editar`)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="h-4 w-4" />
                <span>{fornecedor.telefone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{fornecedor.email}</span>
              </div>
              {endereco && (endereco.cidade || endereco.estado) && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span>{[endereco.cidade, endereco.estado].filter(Boolean).join(' - ')}</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Tipo:</span>
                <Badge variant="outline">{TIPO_FORNECEDOR_LABELS[fornecedor.tipo_fornecedor]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Responsável:</span>
                <span className="text-slate-800">{fornecedor.responsavel}</span>
              </div>
              {fornecedor.prazo_medio_entrega && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Prazo Entrega:</span>
                  <span className="text-slate-800">{fornecedor.prazo_medio_entrega} dias</span>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Itens:</span>
                <span className="text-slate-800 font-semibold">{itens.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Documentos:</span>
                <span className="text-slate-800 font-semibold">{documentos.length}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Cadastrado em {format(new Date(fornecedor.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="itens" className="space-y-4">
          <TabsList className="bg-white/80 backdrop-blur">
            <TabsTrigger value="itens" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Itens</span>
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Itens Tab */}
          <TabsContent value="itens">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Produtos / Serviços</CardTitle>
                <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2" onClick={() => handleOpenItemDialog()}>
                      <Plus className="h-4 w-4" />
                      Adicionar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome *</Label>
                        <Input 
                          value={itemForm.nome} 
                          onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })} 
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea 
                          value={itemForm.descricao} 
                          onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })} 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Categoria</Label>
                          <Input 
                            value={itemForm.categoria} 
                            onChange={(e) => setItemForm({ ...itemForm, categoria: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Label>Unidade</Label>
                          <Input 
                            value={itemForm.unidade} 
                            onChange={(e) => setItemForm({ ...itemForm, unidade: e.target.value })} 
                            placeholder="un, kg, m²..."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Valor (R$) *</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={itemForm.valor} 
                            onChange={(e) => setItemForm({ ...itemForm, valor: e.target.value })} 
                          />
                        </div>
                        <div>
                          <Label>Prazo (dias)</Label>
                          <Input 
                            type="number"
                            value={itemForm.prazo_entrega} 
                            onChange={(e) => setItemForm({ ...itemForm, prazo_entrega: e.target.value })} 
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Imagem</Label>
                        <Input 
                          type="file"
                          accept="image/*"
                          onChange={(e) => setItemImage(e.target.files?.[0] || null)} 
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSaveItem}
                          disabled={!itemForm.nome || !itemForm.valor}
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {itens.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum item cadastrado para este fornecedor.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16"></TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead className="hidden md:table-cell">Categoria</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.imagem_url ? (
                                <img 
                                  src={item.imagem_url} 
                                  alt={item.nome}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                                  <Image className="h-5 w-5 text-slate-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{item.nome}</div>
                              {item.descricao && (
                                <div className="text-sm text-slate-500 truncate max-w-xs">{item.descricao}</div>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {item.categoria && <Badge variant="outline">{item.categoria}</Badge>}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              {item.unidade && <div className="text-sm text-slate-500">/{item.unidade}</div>}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleOpenItemDialog(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteItem(item.id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos Tab */}
          <TabsContent value="documentos">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Documentos</CardTitle>
                <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload de Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Tipo de Documento *</Label>
                        <Select 
                          value={docForm.tipo_documento} 
                          onValueChange={(v) => setDocForm({ ...docForm, tipo_documento: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPO_DOCUMENTO_OPTIONS.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Arquivo *</Label>
                        <Input 
                          type="file"
                          onChange={(e) => setDocForm({ ...docForm, arquivo: e.target.files?.[0] || null })} 
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleUploadDocument}
                          disabled={!docForm.tipo_documento || !docForm.arquivo}
                        >
                          Enviar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {documentos.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum documento cadastrado.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documentos.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-500" />
                          <div>
                            <div className="font-medium text-slate-800">{doc.nome_arquivo}</div>
                            <div className="text-sm text-slate-500">
                              {doc.tipo_documento} • {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.arquivo_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDocument(doc.id, doc.arquivo_url)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico Tab */}
          <TabsContent value="historico">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Preços</CardTitle>
              </CardHeader>
              <CardContent>
                {itens.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Nenhum item cadastrado para visualizar histórico.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select 
                      value={selectedItemForHistory || ''} 
                      onValueChange={setSelectedItemForHistory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item para ver o histórico" />
                      </SelectTrigger>
                      <SelectContent>
                        {itens.map((item) => (
                          <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedItemForHistory && (
                      <HistoricoPrecosList itemId={selectedItemForHistory} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function HistoricoPrecosList({ itemId }: { itemId: string }) {
  const { data: historico = [], isLoading } = useHistoricoPrecos(itemId);

  if (isLoading) {
    return <div className="text-center py-4 text-slate-500">Carregando...</div>;
  }

  if (historico.length === 0) {
    return <div className="text-center py-4 text-slate-500">Nenhuma alteração de preço registrada.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Valor Anterior</TableHead>
          <TableHead>Valor Novo</TableHead>
          <TableHead>Variação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {historico.map((h) => {
          const variacao = h.valor_anterior 
            ? ((h.valor_novo - h.valor_anterior) / h.valor_anterior * 100).toFixed(1)
            : null;
          return (
            <TableRow key={h.id}>
              <TableCell>{format(new Date(h.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
              <TableCell>
                {h.valor_anterior 
                  ? `R$ ${h.valor_anterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '-'}
              </TableCell>
              <TableCell className="font-medium">
                R$ {h.valor_novo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                {variacao && (
                  <Badge className={parseFloat(variacao) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                    {parseFloat(variacao) > 0 ? '+' : ''}{variacao}%
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
