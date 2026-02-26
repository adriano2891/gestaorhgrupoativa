import { useState, useEffect } from "react";
import { Search, UserPlus, Download, Eye, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useCandidatosRealtime } from "@/hooks/useRealtimeUpdates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const candidateSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail deve ter no máximo 255 caracteres"),
  phone: z.string().trim().min(1, "Telefone é obrigatório").max(20, "Telefone deve ter no máximo 20 caracteres"),
  position: z.string().trim().min(1, "Cargo desejado é obrigatório").max(100, "Cargo deve ter no máximo 100 caracteres"),
  experience: z.string().trim().min(1, "Experiência é obrigatória").max(50, "Experiência deve ter no máximo 50 caracteres"),
  status: z.enum(["disponivel", "em-processo", "contratado"]),
});

type Candidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  skills: string[];
  experience: string;
  status: "disponivel" | "em-processo" | "contratado";
  applied_date: string;
  resume_url: string | null;
};

const BancoTalentos = () => {
  const { toast } = useToast();
  useCandidatosRealtime();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [currentResumeUrl, setCurrentResumeUrl] = useState<string | null>(null);
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(false);
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [skillsInput, setSkillsInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    experience: "",
    status: "disponivel" as const,
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('applied_date', { ascending: false });

      if (error) {
        console.error('Erro ao buscar candidatos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os candidatos.",
          variant: "destructive",
        });
        setCandidates([]);
      } else {
        setCandidates((data as unknown as Candidate[]) || []);
      }
    } catch (error) {
      console.error('Erro inesperado ao buscar candidatos:', error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "Todos" || candidate.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      disponivel: "Disponível",
      "em-processo": "Em Processo",
      contratado: "Contratado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      disponivel: "default",
      "em-processo": "secondary",
      contratado: "outline",
    };
    return variants[status as keyof typeof variants] || "default";
  };

  const handleAddCandidate = () => {
    setNewCandidate({
      name: "",
      email: "",
      phone: "",
      position: "",
      experience: "",
      status: "disponivel",
    });
    setSkillsInput("");
    setResumeFile(null);
    setValidationErrors({});
    setIsAddDialogOpen(true);
  };

  const updateNewCandidate = (field: string, value: string) => {
    setNewCandidate({ ...newCandidate, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: "" });
    }
  };

  const handleSaveNewCandidate = async () => {
    try {
      // Validar dados
      candidateSchema.parse(newCandidate);

      let resumeUrl = null;

      // Upload do currículo se fornecido
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile);

        if (uploadError) throw uploadError;

        // Salvar apenas o path do arquivo, não URL assinada (que expira)
        resumeUrl = fileName;
      }

      // Processar habilidades
      const skills = skillsInput
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      // Inserir candidato no banco
      const { error: insertError } = await supabase
        .from('candidates')
        .insert({
          ...newCandidate,
          skills,
          resume_url: resumeUrl,
        });

      if (insertError) throw insertError;

      toast({
        title: "Candidato adicionado",
        description: "O candidato foi cadastrado com sucesso.",
      });

      setIsAddDialogOpen(false);
      fetchCandidates();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        (error as any).issues?.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros no formulário.",
          variant: "destructive",
        });
      } else {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Erro ao adicionar candidato:', errorMsg, error);
        toast({
          title: "Erro",
          description: `Não foi possível adicionar o candidato: ${errorMsg}`,
          variant: "destructive",
        });
      }
    }
  };

  const extractPathFromUrl = (url: string) => {
    // Se já é apenas o nome do arquivo (novo formato), retornar direto
    if (!url.startsWith('http')) return url;
    
    try {
      const parsed = new URL(url);
      // Remove query params (tokens, etc.)
      const pathname = parsed.pathname;
      
      // Try to extract path after /resumes/
      const markers = ['/object/public/resumes/', '/object/sign/resumes/', '/resumes/'];
      for (const marker of markers) {
        const idx = pathname.indexOf(marker);
        if (idx !== -1) return decodeURIComponent(pathname.substring(idx + marker.length));
      }
    } catch {}
    
    // Fallback: try simple string matching without query params
    const urlWithoutQuery = url.split('?')[0];
    const alt = "/resumes/";
    const idx = urlWithoutQuery.lastIndexOf(alt);
    if (idx !== -1) return urlWithoutQuery.substring(idx + alt.length);
    
    return url;
  };

  const handleViewResume = async (resumeUrl: string | null) => {
    if (!resumeUrl) {
      toast({
        title: "Currículo não disponível",
        description: "Este candidato não possui currículo cadastrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsResumeDialogOpen(true);
      setIsResumeLoading(true);
      setCurrentResumeUrl(resumeUrl);

      const path = extractPathFromUrl(resumeUrl);
      const ext = path.split('.').pop()?.toLowerCase();

      // Apenas PDFs podem ser pré-visualizados com segurança no navegador
      if (ext !== 'pdf') {
        setResumeBlobUrl(null);
        return; // mostrará mensagem de fallback no modal
      }

      const { data, error } = await (supabase as any).storage
        .from('resumes')
        .download(path);

      if (error) throw error;

      let blob = data as Blob;
      if (!blob.type || blob.type === 'application/octet-stream') {
        // força o MIME correto para o viewer do navegador
        const ab = await blob.arrayBuffer();
        blob = new Blob([ab], { type: 'application/pdf' });
      }

      const blobUrl = URL.createObjectURL(blob);
      setResumeBlobUrl(blobUrl);
    } catch (error) {
      console.error('Erro ao carregar currículo:', error);
      toast({
        title: "Erro ao abrir currículo",
        description: "Clique em 'Abrir em Nova Aba' para visualizar.",
        variant: "destructive",
      });
    } finally {
      setIsResumeLoading(false);
    }
  };

  const handleDownloadResume = async (resumeUrl: string | null, candidateName: string) => {
    if (!resumeUrl) {
      toast({
        title: "Currículo não disponível",
        description: "Este candidato não possui currículo cadastrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const path = extractPathFromUrl(resumeUrl);
      const { data, error } = await (supabase as any).storage
        .from('resumes')
        .download(path);
      if (error) throw error;

      const ext = path.split('.').pop()?.toLowerCase();
      const url = window.URL.createObjectURL(data as Blob);
      const a = document.createElement('a');
      a.href = url;
      const base = `curriculo-${candidateName.replace(/\s+/g, '-')}`;
      a.download = ext ? `${base}.${ext}` : base;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: "O currículo está sendo baixado.",
      });
    } catch (error) {
      console.error('Erro ao baixar currículo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o currículo.",
        variant: "destructive",
      });
    }
  };

  const openResumeInNewTab = async () => {
    try {
      if (resumeBlobUrl) {
        window.open(resumeBlobUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (!currentResumeUrl) return;
      setIsResumeLoading(true);
      const path = extractPathFromUrl(currentResumeUrl);
      const ext = path.split('.').pop()?.toLowerCase();
      const { data, error } = await (supabase as any).storage
        .from('resumes')
        .download(path);
      if (error) throw error;

      let blob = data as Blob;
      if (ext === 'pdf' && (!blob.type || blob.type === 'application/octet-stream')) {
        const ab = await blob.arrayBuffer();
        blob = new Blob([ab], { type: 'application/pdf' });
      }
      const url = URL.createObjectURL(blob);
      setResumeBlobUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Erro ao abrir em nova aba:', e);
      toast({
        title: 'Não foi possível abrir o documento',
        description: 'Tente realizar o download do arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsResumeLoading(false);
    }
  };

  const handleDelete = (candidateId: string) => {
    setDeletingCandidateId(candidateId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCandidateId) return;

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', deletingCandidateId);

      if (error) throw error;

      toast({
        title: "Candidato excluído",
        description: "O candidato foi removido com sucesso.",
      });

      setIsDeleteDialogOpen(false);
      setDeletingCandidateId(null);
      fetchCandidates();
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o candidato.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      <BackButton to="/gestao-rh" variant="light" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: '#000000' }}>
            Banco de Talentos
          </h1>
          <p className="mt-1 text-xs sm:text-sm md:text-base font-bold" style={{ color: '#000000' }}>
            Gerencie candidatos e processos seletivos
          </p>
        </div>
        <Button onClick={handleAddCandidate} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="sm:inline">Adicionar Candidato</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg">Candidatos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredCandidates.length} candidato(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar candidato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em-processo">Em Processo</SelectItem>
                  <SelectItem value="contratado">Contratado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-muted-foreground text-sm sm:text-base">Carregando candidatos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredCandidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">
                            {getInitials(candidate.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-base sm:text-lg truncate">
                            {candidate.name}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm truncate">{candidate.position}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(candidate.status) as any} className="self-start flex-shrink-0 text-xs">
                        {getStatusLabel(candidate.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">E-mail: </span>
                        <span className="font-medium">{candidate.email}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Telefone: </span>
                        <span className="font-medium">{candidate.phone}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Experiência:{" "}
                        </span>
                        <span className="font-medium">{candidate.experience}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Candidatura:{" "}
                        </span>
                        <span className="font-medium">
                          {new Date(candidate.applied_date).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                    </div>

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Habilidades:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleViewResume(candidate.resume_url)}
                        disabled={!candidate.resume_url}
                        title={!candidate.resume_url ? "Currículo não cadastrado" : "Visualizar currículo"}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {candidate.resume_url ? "Ver Currículo" : "Sem Currículo"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadResume(candidate.resume_url, candidate.name)}
                        disabled={!candidate.resume_url}
                        title={!candidate.resume_url ? "Currículo não cadastrado" : "Baixar currículo"}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(candidate.id)}
                        title="Excluir candidato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && filteredCandidates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum candidato encontrado com os filtros selecionados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar Candidato */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Candidato</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo candidato
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={newCandidate.name}
                onChange={(e) => updateNewCandidate('name', e.target.value)}
                className={validationErrors.name ? "border-destructive" : ""}
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={newCandidate.email}
                onChange={(e) => updateNewCandidate('email', e.target.value)}
                className={validationErrors.email ? "border-destructive" : ""}
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={newCandidate.phone}
                onChange={(e) => updateNewCandidate('phone', e.target.value)}
                placeholder="(11) 98765-4321"
                className={validationErrors.phone ? "border-destructive" : ""}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="position">Cargo Desejado *</Label>
              <Input
                id="position"
                value={newCandidate.position}
                onChange={(e) => updateNewCandidate('position', e.target.value)}
                className={validationErrors.position ? "border-destructive" : ""}
              />
              {validationErrors.position && (
                <p className="text-sm text-destructive">{validationErrors.position}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="experience">Experiência *</Label>
              <Input
                id="experience"
                value={newCandidate.experience}
                onChange={(e) => updateNewCandidate('experience', e.target.value)}
                placeholder="Ex: 5 anos"
                className={validationErrors.experience ? "border-destructive" : ""}
              />
              {validationErrors.experience && (
                <p className="text-sm text-destructive">{validationErrors.experience}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skills">Habilidades</Label>
              <Textarea
                id="skills"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Separe as habilidades por vírgula (ex: React, Node.js, TypeScript)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Digite as habilidades separadas por vírgula
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newCandidate.status}
                onValueChange={(value) => updateNewCandidate('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em-processo">Em Processo</SelectItem>
                  <SelectItem value="contratado">Contratado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resume">Currículo (PDF)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {resumeFile && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {resumeFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, DOC, DOCX
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNewCandidate}>Adicionar Candidato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este candidato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Visualização de Currículo */}
      <Dialog open={isResumeDialogOpen} onOpenChange={(open) => {
        setIsResumeDialogOpen(open);
        if (!open && resumeBlobUrl) {
          URL.revokeObjectURL(resumeBlobUrl);
          setResumeBlobUrl(null);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Visualizar Currículo</DialogTitle>
            <DialogDescription>
              Currículo do candidato
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[70vh]">
            {isResumeLoading ? (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Carregando currículo...
              </div>
            ) : resumeBlobUrl ? (
              <object
                data={resumeBlobUrl}
                type="application/pdf"
                className="w-full h-full border rounded"
              >
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-center px-6">
                  Visualização embutida indisponível. Use "Abrir em Nova Aba".
                </div>
              </object>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-center px-6">
                Não foi possível exibir o documento aqui. Use "Abrir em Nova Aba".
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResumeDialogOpen(false)}>
              Fechar
            </Button>
            {currentResumeUrl && (
              <Button onClick={openResumeInNewTab}>
                Abrir em Nova Aba
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BancoTalentos;
