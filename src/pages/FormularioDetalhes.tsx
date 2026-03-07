import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Save, Send, Trash2, GripVertical, Settings, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFormularioDetails,
  useFormularioCampos,
  useUpdateFormulario,
  useAddFormularioCampo,
  useDeleteFormularioCampo,
  useFormularioAtribuicoes,
} from "@/hooks/useFormulariosRH";
import { CATEGORY_LABELS, STATUS_LABELS, FIELD_TYPE_LABELS, type FormFieldType, type FormStatus } from "@/types/formularios";
import { CampoFormulario } from "@/components/formularios/CampoFormulario";
import { AtribuirFormularioDialog } from "@/components/formularios/AtribuirFormularioDialog";

const FormularioDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: formulario, isLoading: loadingForm } = useFormularioDetails(id);
  const { data: campos, isLoading: loadingCampos } = useFormularioCampos(id);
  const { data: atribuicoes } = useFormularioAtribuicoes(id);
  const updateFormulario = useUpdateFormulario();
  const addCampo = useAddFormularioCampo();
  const deleteCampo = useDeleteFormularioCampo();

  const [showAtribuirDialog, setShowAtribuirDialog] = useState(false);

  const handleStatusChange = async (status: FormStatus) => {
    if (!id) return;
    try {
      await updateFormulario.mutateAsync({ id, status });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  if (loadingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  if (!formulario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground">Formulário não encontrado</h2>
          <Button variant="link" onClick={() => navigate("/formularios-rh")}>
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BackButton to="/formularios-rh" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">{formulario.titulo}</h1>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[formulario.categoria]}</Badge>
                  <Badge variant="secondary" className="text-xs">{STATUS_LABELS[formulario.status]}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {formulario.status === 'rascunho' && (
                <Button variant="outline" size="sm" onClick={() => handleStatusChange('pendente_aprovacao')}>
                  <Send className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Enviar para Aprovação</span>
                </Button>
              )}
              {formulario.status === 'aprovado' && (
                <Button size="sm" onClick={() => handleStatusChange('publicado')}>
                  Publicar
                </Button>
              )}
              {formulario.status === 'publicado' && (
                <Button size="sm" onClick={() => setShowAtribuirDialog(true)}>
                  <Users className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Atribuir</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="h-[64px] sm:h-[72px]" />

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="campos" className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto flex">
            <TabsTrigger value="campos" className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden xs:inline">Campos</span> ({campos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="atribuicoes" className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden xs:inline">Atribuições</span> ({atribuicoes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden xs:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Campos Tab */}
          <TabsContent value="campos">
            <div className="space-y-4">
              {/* Add Field - Grid of buttons */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="justify-start h-auto py-2 px-3 text-xs"
                        disabled={addCampo.isPending}
                        onClick={async () => {
                          if (!id) return;
                          try {
                            await addCampo.mutateAsync({
                              formulario_id: id,
                              label: label,
                              tipo: key as FormFieldType,
                              ordem: (campos?.length || 0) + 1,
                            });
                          } catch (error) {
                            console.error("Erro ao adicionar campo:", error);
                          }
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Fields List */}
              {loadingCampos ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : campos?.length === 0 ? (
                <Card className="py-12">
                  <CardContent className="text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhum campo adicionado ainda</p>
                    <p className="text-sm text-muted-foreground">Adicione campos usando o seletor acima</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {campos?.map((campo) => {
                    const largura = campo.largura || 100;
                    const widthClass = largura === 100 ? 'w-full' 
                      : largura === 50 ? 'w-full sm:w-[calc(50%-0.375rem)]' 
                      : largura === 33 ? 'w-full sm:w-[calc(33.333%-0.5rem)]' 
                      : 'w-full sm:w-[calc(25%-0.5625rem)]';
                    return (
                      <div key={campo.id} className={widthClass}>
                        <CampoFormulario 
                          campo={campo} 
                          onDelete={() => deleteCampo.mutate({ id: campo.id, formulario_id: campo.formulario_id })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Atribuições Tab */}
          <TabsContent value="atribuicoes">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">Colaboradores Atribuídos</CardTitle>
                <Button size="sm" onClick={() => setShowAtribuirDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Atribuir
                </Button>
              </CardHeader>
              <CardContent>
                {atribuicoes?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Nenhuma atribuição ainda</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {atribuicoes?.map((atribuicao) => (
                      <div key={atribuicao.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{atribuicao.profiles?.nome}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{atribuicao.profiles?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={atribuicao.status === 'concluido' ? 'default' : 'secondary'} className="text-xs">
                            {atribuicao.status}
                          </Badge>
                          {atribuicao.assinado && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 text-xs">
                              Assinado
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações Tab */}
          <TabsContent value="configuracoes">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Formulário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label>Título</Label>
                    <Input 
                      defaultValue={formulario.titulo}
                      onBlur={(e) => updateFormulario.mutate({ id: formulario.id, titulo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea 
                      defaultValue={formulario.descricao || ""}
                      onBlur={(e) => updateFormulario.mutate({ id: formulario.id, descricao: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Departamento Destino</Label>
                    <Input 
                      defaultValue={formulario.departamento_destino || ""}
                      onBlur={(e) => updateFormulario.mutate({ id: formulario.id, departamento_destino: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Requer Assinatura</Label>
                      <p className="text-sm text-muted-foreground">Colaboradores precisam assinar o formulário</p>
                    </div>
                    <Switch 
                      checked={formulario.requer_assinatura}
                      onCheckedChange={(checked) => updateFormulario.mutate({ id: formulario.id, requer_assinatura: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Template</Label>
                      <p className="text-sm text-muted-foreground">Usar como modelo para novos formulários</p>
                    </div>
                    <Switch 
                      checked={formulario.is_template}
                      onCheckedChange={(checked) => updateFormulario.mutate({ id: formulario.id, is_template: checked })}
                    />
                  </div>
                </div>

                {formulario.status !== 'arquivado' && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleStatusChange('arquivado')}
                    >
                      Arquivar Formulário
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AtribuirFormularioDialog 
        open={showAtribuirDialog} 
        onOpenChange={setShowAtribuirDialog}
        formularioId={id!}
      />
    </div>
  );
};

export default FormularioDetalhes;
