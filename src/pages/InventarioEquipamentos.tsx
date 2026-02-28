import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, Building2, Home, Monitor, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useInventarioEquipamentos, Equipamento, EquipamentoInput } from "@/hooks/useInventarioEquipamentos";

const InventarioEquipamentos = () => {
  const navigate = useNavigate();
  const { equipamentos, isLoading, createEquipamento, updateEquipamento, deleteEquipamento } = useInventarioEquipamentos();
  
  const [search, setSearch] = useState("");
  const [filterLocalizacao, setFilterLocalizacao] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null);
  
  const [formData, setFormData] = useState<EquipamentoInput>({
    numero_equipamento: "",
    nome_equipamento: "",
    modelo_marca: "",
    cor: "",
    localizacao: "central",
    detalhe_localizacao: "",
    observacoes: "",
  });

  const filteredEquipamentos = equipamentos.filter((eq) => {
    const matchesSearch = 
      eq.numero_equipamento.toLowerCase().includes(search.toLowerCase()) ||
      eq.nome_equipamento.toLowerCase().includes(search.toLowerCase()) ||
      (eq.modelo_marca?.toLowerCase().includes(search.toLowerCase()) ?? false);
    
    const matchesLocalizacao = filterLocalizacao === "todos" || eq.localizacao === filterLocalizacao;
    
    return matchesSearch && matchesLocalizacao;
  });

  const stats = {
    total: equipamentos.length,
    central: equipamentos.filter(e => e.localizacao === "central").length,
    homeOffice: equipamentos.filter(e => e.localizacao === "home_office").length,
    cliente: equipamentos.filter(e => e.localizacao === "cliente").length,
  };

  const generateNextNumber = () => {
    const numbers = equipamentos
      .map(eq => {
        const match = eq.numero_equipamento.match(/EQ-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    return `EQ-${String(nextNumber).padStart(3, '0')}`;
  };

  const resetForm = (autoNumber?: string) => {
    setFormData({
      numero_equipamento: autoNumber || "",
      nome_equipamento: "",
      modelo_marca: "",
      cor: "",
      localizacao: "central",
      detalhe_localizacao: "",
      observacoes: "",
    });
    setEditingEquipamento(null);
  };

  const handleOpenDialog = (equipamento?: Equipamento) => {
    if (equipamento) {
      setEditingEquipamento(equipamento);
      setFormData({
        numero_equipamento: equipamento.numero_equipamento,
        nome_equipamento: equipamento.nome_equipamento,
        modelo_marca: equipamento.modelo_marca || "",
        cor: equipamento.cor || "",
        localizacao: equipamento.localizacao,
        detalhe_localizacao: equipamento.detalhe_localizacao || "",
        observacoes: equipamento.observacoes || "",
      });
    } else {
      const nextNumber = generateNextNumber();
      resetForm(nextNumber);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEquipamento) {
      await updateEquipamento.mutateAsync({ id: editingEquipamento.id, ...formData });
    } else {
      await createEquipamento.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteEquipamento.mutateAsync(id);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#3EE0CF] shadow-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:py-0 sm:h-16 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <BackButton to="/dashboard" variant="light" className="text-black hover:bg-black/10" />
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-black truncate">Gestão de Inventário</h1>
                <p className="text-[10px] sm:text-xs text-black/70 truncate">Controle de equipamentos</p>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-black hover:bg-black/90 text-white">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Novo Equipamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {editingEquipamento ? "Editar Equipamento" : "Cadastrar Equipamento"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingEquipamento ? "Edite as informações do equipamento." : "Preencha os dados para cadastrar um novo equipamento."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número do Equipamento *</Label>
                    <Input
                      id="numero"
                      value={formData.numero_equipamento}
                      onChange={(e) => setFormData({ ...formData, numero_equipamento: e.target.value })}
                      placeholder="Ex: EQ-001"
                      required
                      readOnly={!editingEquipamento}
                      className={!editingEquipamento ? "bg-gray-100 cursor-not-allowed" : ""}
                    />
                    {!editingEquipamento && (
                      <p className="text-xs text-gray-500">Gerado automaticamente</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Equipamento *</Label>
                    <Input
                      id="nome"
                      value={formData.nome_equipamento}
                      onChange={(e) => setFormData({ ...formData, nome_equipamento: e.target.value })}
                      placeholder="Ex: Notebook Dell"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo / Marca</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo_marca || ""}
                      onChange={(e) => setFormData({ ...formData, modelo_marca: e.target.value })}
                      placeholder="Ex: Dell Latitude 5420"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cor">Cor</Label>
                    <Input
                      id="cor"
                      value={formData.cor || ""}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      placeholder="Ex: Preto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="localizacao">Localização *</Label>
                    <Select
                      value={formData.localizacao}
                      onValueChange={(value: 'central' | 'home_office' | 'cliente') => setFormData({ ...formData, localizacao: value, detalhe_localizacao: value === 'central' ? '' : formData.detalhe_localizacao })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="home_office">Home Office</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.localizacao === 'home_office' || formData.localizacao === 'cliente') && (
                    <div className="space-y-2">
                      <Label htmlFor="detalhe_localizacao">
                        {formData.localizacao === 'home_office' ? 'Qual Home Office?' : 'Qual Cliente?'} *
                      </Label>
                      <Input
                        id="detalhe_localizacao"
                        value={formData.detalhe_localizacao || ""}
                        onChange={(e) => setFormData({ ...formData, detalhe_localizacao: e.target.value })}
                        placeholder={formData.localizacao === 'home_office' ? 'Ex: João Silva' : 'Ex: Condomínio Aurora'}
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes || ""}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Observações adicionais..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-black hover:bg-black/90 text-white">
                      {editingEquipamento ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-[#3EE0CF]/20 rounded-full flex-shrink-0">
                <Monitor className="h-5 w-5 text-[#3EE0CF]" />
              </div>
              <div>
                <p className="text-sm text-black/60">Total</p>
                <p className="text-2xl font-bold text-black">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-[#3EE0CF]/20 rounded-full flex-shrink-0">
                <Building2 className="h-5 w-5 text-[#3EE0CF]" />
              </div>
              <div>
                <p className="text-sm text-black/60">Central</p>
                <p className="text-2xl font-bold text-black">{stats.central}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-[#3EE0CF]/20 rounded-full flex-shrink-0">
                <Home className="h-5 w-5 text-[#3EE0CF]" />
              </div>
              <div>
                <p className="text-sm text-black/60">Home Office</p>
                <p className="text-2xl font-bold text-black">{stats.homeOffice}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-2 border-[#3EE0CF] shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-[#3EE0CF]/20 rounded-full flex-shrink-0">
                <Users className="h-5 w-5 text-[#3EE0CF]" />
              </div>
              <div>
                <p className="text-sm text-black/60">Cliente</p>
                <p className="text-2xl font-bold text-black">{stats.cliente}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <Select value={filterLocalizacao} onValueChange={setFilterLocalizacao}>
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Localizações</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="home_office">Home Office</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-base sm:text-lg">Lista de Equipamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 md:p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm">Carregando...</div>
            ) : filteredEquipamentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm px-4">
                {search || filterLocalizacao !== "todos" 
                  ? "Nenhum equipamento encontrado."
                  : "Nenhum equipamento cadastrado."}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-0">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Número</TableHead>
                      <TableHead className="text-xs sm:text-sm">Nome</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Modelo</TableHead>
                      <TableHead className="text-xs sm:text-sm hidden md:table-cell">Cor</TableHead>
                      <TableHead className="text-xs sm:text-sm">Local</TableHead>
                      <TableHead className="text-xs sm:text-sm text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipamentos.map((equipamento) => (
                      <TableRow key={equipamento.id}>
                        <TableCell className="font-medium text-xs sm:text-sm">{equipamento.numero_equipamento}</TableCell>
                        <TableCell className="text-xs sm:text-sm">{equipamento.nome_equipamento}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{equipamento.modelo_marca || "-"}</TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell">{equipamento.cor || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={`text-[10px] sm:text-xs ${
                              equipamento.localizacao === "central"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : equipamento.localizacao === "home_office"
                                ? "bg-orange-100 text-orange-700 border-orange-200"
                                : "bg-purple-100 text-purple-700 border-purple-200"
                            }`}
                          >
                            <span className="flex flex-col items-start">
                              <span>
                                {equipamento.localizacao === "central" ? "Central" 
                                  : equipamento.localizacao === "home_office" ? "Home Office" 
                                  : "Cliente"}
                              </span>
                              {equipamento.detalhe_localizacao && (
                                <span className="font-normal">
                                  {equipamento.detalhe_localizacao}
                                </span>
                              )}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(equipamento)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o equipamento "{equipamento.nome_equipamento}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(equipamento.id)}
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
      </main>
    </div>
  );
};

export default InventarioEquipamentos;
