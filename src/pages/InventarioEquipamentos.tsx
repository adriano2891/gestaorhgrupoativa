import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Search, Edit, Trash2, Building2, Home, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  };

  const resetForm = () => {
    setFormData({
      numero_equipamento: "",
      nome_equipamento: "",
      modelo_marca: "",
      cor: "",
      localizacao: "central",
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
        observacoes: equipamento.observacoes || "",
      });
    } else {
      resetForm();
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
    <div className="min-h-screen" style={{ backgroundColor: '#40E0D0' }}>
      {/* Header */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestão de Inventário de Equipamentos</h1>
                <p className="text-white/70 text-sm">Controle de equipamentos da Central e Home Office</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="bg-white text-teal-600 hover:bg-white/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Equipamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingEquipamento ? "Editar Equipamento" : "Cadastrar Equipamento"}
                  </DialogTitle>
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
                    />
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
                      onValueChange={(value: 'central' | 'home_office') => setFormData({ ...formData, localizacao: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="home_office">Home Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
                      {editingEquipamento ? "Salvar" : "Cadastrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-full">
                <Monitor className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Equipamentos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Na Central</p>
                <p className="text-2xl font-bold text-gray-900">{stats.central}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Home Office</p>
                <p className="text-2xl font-bold text-gray-900">{stats.homeOffice}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, nome ou modelo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterLocalizacao} onValueChange={setFilterLocalizacao}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Localização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Localizações</SelectItem>
                  <SelectItem value="central">Central</SelectItem>
                  <SelectItem value="home_office">Home Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Lista de Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : filteredEquipamentos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {search || filterLocalizacao !== "todos" 
                  ? "Nenhum equipamento encontrado com os filtros aplicados."
                  : "Nenhum equipamento cadastrado. Clique em 'Novo Equipamento' para começar."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Modelo/Marca</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipamentos.map((equipamento) => (
                      <TableRow key={equipamento.id}>
                        <TableCell className="font-medium">{equipamento.numero_equipamento}</TableCell>
                        <TableCell>{equipamento.nome_equipamento}</TableCell>
                        <TableCell>{equipamento.modelo_marca || "-"}</TableCell>
                        <TableCell>{equipamento.cor || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              equipamento.localizacao === "central"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-orange-100 text-orange-700 border-orange-200"
                            }
                          >
                            {equipamento.localizacao === "central" ? (
                              <><Building2 className="h-3 w-3 mr-1" />Central</>
                            ) : (
                              <><Home className="h-3 w-3 mr-1" />Home Office</>
                            )}
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
      </div>
    </div>
  );
};

export default InventarioEquipamentos;
