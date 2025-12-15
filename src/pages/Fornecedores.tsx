import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Phone, Mail, MoreHorizontal, Pencil, Trash2, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFornecedores, useDeleteFornecedor } from '@/hooks/useFornecedores';
import { TIPO_FORNECEDOR_LABELS, STATUS_FORNECEDOR_LABELS } from '@/types/fornecedores';

export default function Fornecedores() {
  const navigate = useNavigate();
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const deleteFornecedor = useDeleteFornecedor();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredFornecedores = fornecedores.filter((f) => {
    const matchesSearch = 
      f.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      f.cpf_cnpj.includes(searchTerm);
    
    const matchesTipo = tipoFilter === 'todos' || f.tipo_fornecedor === tipoFilter;
    const matchesStatus = statusFilter === 'todos' || f.status === statusFilter;
    
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const handleDelete = (id: string) => {
    deleteFornecedor.mutate(id);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#3EE0CF] rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-black hover:bg-black/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-black">Fornecedores</h1>
              <p className="text-black/70 text-sm">Gerencie seus fornecedores e produtos</p>
            </div>
          </div>
          <Button onClick={() => navigate('/fornecedores/novo')} className="gap-2 bg-black hover:bg-black/90 text-white">
            <Plus className="h-4 w-4" />
            Adicionar Fornecedor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-black">{fornecedores.length}</div>
              <div className="text-sm text-black/60">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#3EE0CF]">
                {fornecedores.filter(f => f.status === 'ativo').length}
              </div>
              <div className="text-sm text-black/60">Ativos</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-black">
                {fornecedores.filter(f => f.tipo_fornecedor === 'produto' || f.tipo_fornecedor === 'ambos').length}
              </div>
              <div className="text-sm text-black/60">Produtos</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-black">
                {fornecedores.filter(f => f.tipo_fornecedor === 'servico' || f.tipo_fornecedor === 'ambos').length}
              </div>
              <div className="text-sm text-black/60">Serviços</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-black/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                <Input
                  placeholder="Buscar por nome, CNPJ/CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-black/20 focus:border-[#3EE0CF] focus:ring-[#3EE0CF]"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full sm:w-40 border-black/20">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="servico">Serviço</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 border-black/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white border border-black/10 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-black/60">Carregando...</div>
            ) : filteredFornecedores.length === 0 ? (
              <div className="p-8 text-center text-black/60">
                {searchTerm || tipoFilter !== 'todos' || statusFilter !== 'todos'
                  ? 'Nenhum fornecedor encontrado com os filtros aplicados.'
                  : 'Nenhum fornecedor cadastrado. Clique em "Adicionar Fornecedor" para começar.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#3EE0CF]/10 border-b border-[#3EE0CF]/30">
                      <TableHead className="text-black font-semibold">Fornecedor</TableHead>
                      <TableHead className="hidden md:table-cell text-black font-semibold">Tipo</TableHead>
                      <TableHead className="hidden lg:table-cell text-black font-semibold">Contato</TableHead>
                      <TableHead className="text-black font-semibold">Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFornecedores.map((fornecedor) => (
                      <TableRow key={fornecedor.id} className="cursor-pointer hover:bg-[#3EE0CF]/5 border-b border-black/5">
                        <TableCell onClick={() => navigate(`/fornecedores/${fornecedor.id}`)}>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#3EE0CF]/20 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-[#3EE0CF]" />
                            </div>
                            <div>
                              <div className="font-medium text-black">
                                {fornecedor.nome_fantasia || fornecedor.razao_social}
                              </div>
                              <div className="text-sm text-black/60">{fornecedor.cpf_cnpj}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="border-black/20 text-black">
                            {TIPO_FORNECEDOR_LABELS[fornecedor.tipo_fornecedor]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-black/70">
                              <Phone className="h-3 w-3" />
                              {fornecedor.telefone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-black/70">
                              <Mail className="h-3 w-3" />
                              {fornecedor.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              fornecedor.status === 'ativo'
                                ? 'bg-[#3EE0CF] text-black hover:bg-[#3EE0CF]/90'
                                : 'bg-black/10 text-black hover:bg-black/20'
                            }
                          >
                            {STATUS_FORNECEDOR_LABELS[fornecedor.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-[#3EE0CF]/10">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-black/10">
                              <DropdownMenuItem onClick={() => navigate(`/fornecedores/${fornecedor.id}`)} className="hover:bg-[#3EE0CF]/10">
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/fornecedores/${fornecedor.id}/editar`)} className="hover:bg-[#3EE0CF]/10">
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-black">Excluir fornecedor?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-black/60">
                                      Esta ação não pode ser desfeita. Todos os itens e documentos vinculados também serão excluídos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-black/20">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(fornecedor.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
