import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Upload, Search, Filter, Grid, List, Star, 
  FileText, FolderOpen, Download, MoreVertical, Eye, Trash2, 
  Edit, Clock, Tag, ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDocumentos, useDocumentosCategorias, useMeusFavoritos, useDeleteDocumento, useToggleFavorito, getDocumentoAccessUrl } from "@/hooks/useDocumentos";
import { UploadDocumentoDialog } from "@/components/documentos/UploadDocumentoDialog";
import { CriarCategoriaDialog } from "@/components/documentos/CriarCategoriaDialog";
import { DocumentoDetalhesDialog } from "@/components/documentos/DocumentoDetalhesDialog";
import { EditarDocumentoDialog } from "@/components/documentos/EditarDocumentoDialog";
import { TIPO_LABELS, type Documento, type DocumentoTipo } from "@/types/documentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type SortField = "titulo" | "created_at" | "tipo" | "arquivo_tamanho";
type SortDirection = "asc" | "desc";

const Documentacoes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<string | undefined>();
  const [selectedTipo, setSelectedTipo] = useState<DocumentoTipo | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCategoriaDialog, setShowCategoriaDialog] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const { data: documentos, isLoading } = useDocumentos({
    categoriaId: selectedCategoria,
    search: searchTerm,
    tipo: selectedTipo,
  });
  const { data: categorias } = useDocumentosCategorias();
  const { data: favoritos } = useMeusFavoritos();
  const deleteDocumento = useDeleteDocumento();
  const toggleFavorito = useToggleFavorito();

  const filteredDocumentos = documentos
    ?.filter(doc => {
      if (activeTab === "favoritos") {
        return favoritos?.includes(doc.id);
      }
      if (activeTab === "recentes") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(doc.created_at) > weekAgo;
      }
      return true;
    })
    ?.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "titulo":
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "tipo":
          comparison = a.tipo.localeCompare(b.tipo);
          break;
        case "arquivo_tamanho":
          comparison = (a.arquivo_tamanho || 0) - (b.arquivo_tamanho || 0);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4 text-primary" /> 
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };

  const handleUploadDialogChange = (open: boolean) => {
    setShowUploadDialog(open);
    if (!open) {
      // Após fechar o dialog de upload (upload concluído), muda para modo lista
      setViewMode("list");
      setSortField("created_at");
      setSortDirection("desc");
    }
  };

  const handleDelete = async () => {
    if (deleteDocId) {
      await deleteDocumento.mutateAsync(deleteDocId);
      setDeleteDocId(null);
    }
  };

  const handleToggleFavorito = (doc: Documento) => {
    toggleFavorito.mutate({ 
      documentoId: doc.id, 
      isFavorito: favoritos?.includes(doc.id) || false 
    });
  };

  const handleDownload = async (doc: Documento) => {
    try {
      const url = await getDocumentoAccessUrl(doc.arquivo_url);

      const link = document.createElement('a');
      link.href = url;
      link.download = doc.arquivo_nome;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Download iniciado", description: doc.arquivo_nome });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível baixar o documento";
      toast({ title: "Erro ao baixar documento", description: message, variant: "destructive" });
    }
  };

  const handlePreview = async (doc: Documento) => {
    const newTab = window.open('', '_blank', 'noopener,noreferrer');

    try {
      const url = await getDocumentoAccessUrl(doc.arquivo_url);
      if (newTab) {
        newTab.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      if (newTab) newTab.close();
      const message = error instanceof Error ? error.message : "Não foi possível abrir o documento";
      toast({ title: "Erro ao abrir documento", description: message, variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-black truncate">Documentações</h1>
                <p className="text-[10px] sm:text-xs text-black/70 truncate">Gestão centralizada de documentos</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCategoriaDialog(true)} className="h-8 px-2 sm:px-3 text-xs sm:text-sm text-black hover:bg-black/10">
                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Categoria</span>
              </Button>
              <Button size="sm" onClick={() => setShowUploadDialog(true)} className="h-8 px-2 sm:px-3 text-xs sm:text-sm bg-black hover:bg-black/90 text-white">
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={selectedCategoria || "todas"} onValueChange={(v) => setSelectedCategoria(v === "todas" ? undefined : v)}>
                <SelectTrigger className="flex-1 sm:w-[180px]">
                  <FolderOpen className="h-4 w-4 mr-2 hidden sm:block" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="todas">Todas Categorias</SelectItem>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                        {cat.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTipo || "todos"} onValueChange={(v) => setSelectedTipo(v === "todos" ? undefined : v as DocumentoTipo)}>
                <SelectTrigger className="flex-1 sm:w-[160px]">
                  <Filter className="h-4 w-4 mr-2 hidden sm:block" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1 border rounded-lg p-1 flex-shrink-0">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 sm:mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="todos" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Todos</span> ({documentos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="recentes" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              Recentes
            </TabsTrigger>
            <TabsTrigger value="favoritos" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Favoritos</span> ({favoritos?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className={cn(
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
                  : "space-y-2"
              )}>
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className={viewMode === "grid" ? "h-48 rounded-xl" : "h-16 rounded-lg"} />
                ))}
              </div>
            ) : filteredDocumentos?.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Nenhum documento encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "favoritos" 
                    ? "Marque documentos como favoritos para vê-los aqui" 
                    : "Faça upload do primeiro documento"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocumentos?.map((doc) => (
                  <Card 
                    key={doc.id} 
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="p-3 rounded-lg bg-primary/10 cursor-pointer"
                          onClick={() => setSelectedDocumento(doc)}
                        >
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleFavorito(doc)}
                          >
                            <Star className={cn(
                              "h-4 w-4",
                              favoritos?.includes(doc.id) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                            )} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedDocumento(doc)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingDocumento(doc)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteDocId(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h3 
                        className="font-semibold text-foreground truncate mb-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setSelectedDocumento(doc)}
                      >
                        {doc.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {format(new Date(doc.created_at), "dd MMM yyyy", { locale: ptBR })} • {formatFileSize(doc.arquivo_tamanho)}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {TIPO_LABELS[doc.tipo]}
                        </Badge>
                        {doc.categoria && (
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ borderColor: doc.categoria.cor, color: doc.categoria.cor }}
                          >
                            {doc.categoria.nome}
                          </Badge>
                        )}
                        {doc.versao_atual > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{doc.versao_atual}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Cabeçalho de ordenação */}
                <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <div className="w-10" /> {/* Espaço para ícone */}
                  <button 
                    className="flex-1 min-w-0 flex items-center gap-2 hover:text-foreground transition-colors text-left"
                    onClick={() => handleSort("titulo")}
                  >
                    Nome
                    <SortIcon field="titulo" />
                  </button>
                  <button 
                    className="hidden md:flex items-center gap-2 w-28 hover:text-foreground transition-colors"
                    onClick={() => handleSort("created_at")}
                  >
                    Data
                    <SortIcon field="created_at" />
                  </button>
                  <button 
                    className="hidden sm:flex items-center gap-2 w-24 hover:text-foreground transition-colors"
                    onClick={() => handleSort("tipo")}
                  >
                    Tipo
                    <SortIcon field="tipo" />
                  </button>
                  <button 
                    className="hidden lg:flex items-center gap-2 w-20 hover:text-foreground transition-colors"
                    onClick={() => handleSort("arquivo_tamanho")}
                  >
                    Tamanho
                    <SortIcon field="arquivo_tamanho" />
                  </button>
                  <div className="w-48" /> {/* Espaço para ações */}
                </div>

                {filteredDocumentos?.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedDocumento(doc)}>
                        <h3 className="font-medium truncate hover:text-primary transition-colors">{doc.titulo}</h3>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {format(new Date(doc.created_at), "dd/MM/yyyy")} • {TIPO_LABELS[doc.tipo]}
                        </p>
                      </div>
                      <div className="hidden md:block w-28 text-sm text-muted-foreground">
                        {format(new Date(doc.created_at), "dd/MM/yyyy")}
                      </div>
                      <div className="hidden sm:block w-24">
                        <Badge variant="secondary" className="text-xs">
                          {TIPO_LABELS[doc.tipo]}
                        </Badge>
                      </div>
                      <div className="hidden lg:block w-20 text-sm text-muted-foreground">
                        {formatFileSize(doc.arquivo_tamanho)}
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.categoria && (
                          <Badge 
                            variant="outline" 
                            className="text-xs hidden sm:inline-flex"
                            style={{ borderColor: doc.categoria.cor, color: doc.categoria.cor }}
                          >
                            {doc.categoria.nome}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => setEditingDocumento(doc)}
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleFavorito(doc)}>
                              <Star className={cn(
                                "h-4 w-4 mr-2",
                                favoritos?.includes(doc.id) ? "fill-yellow-500 text-yellow-500" : ""
                              )} />
                              {favoritos?.includes(doc.id) ? "Remover Favorito" : "Favoritar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteDocId(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <UploadDocumentoDialog 
        open={showUploadDialog} 
        onOpenChange={handleUploadDialogChange}
        categorias={categorias || []}
      />
      <CriarCategoriaDialog 
        open={showCategoriaDialog} 
        onOpenChange={setShowCategoriaDialog}
        categorias={categorias || []}
      />
      {selectedDocumento && (
        <DocumentoDetalhesDialog
          documento={selectedDocumento}
          open={!!selectedDocumento}
          onOpenChange={(open) => !open && setSelectedDocumento(null)}
          isFavorito={favoritos?.includes(selectedDocumento.id) || false}
          onToggleFavorito={() => handleToggleFavorito(selectedDocumento)}
        />
      )}
      <EditarDocumentoDialog
        documento={editingDocumento}
        open={!!editingDocumento}
        onOpenChange={(open) => !open && setEditingDocumento(null)}
        categorias={categorias || []}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento e todas as suas versões serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documentacoes;
