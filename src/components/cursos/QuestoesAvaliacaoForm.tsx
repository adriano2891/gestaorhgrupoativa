import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Questao {
  id: string;
  pergunta: string;
  tipo: string | null;
  opcoes: unknown;
  resposta_correta: string | null;
  pontuacao: number | null;
  ordem: number | null;
}

interface QuestoesAvaliacaoFormProps {
  avaliacaoId: string;
  tipoAvaliacao: string; // "quiz" ou "prova"
}

const LETRAS = ["A", "B", "C", "D"];

export const QuestoesAvaliacaoForm = ({ avaliacaoId, tipoAvaliacao }: QuestoesAvaliacaoFormProps) => {
  const queryClient = useQueryClient();
  const [showNovaQuestao, setShowNovaQuestao] = useState(true); // Começa aberto por padrão!
  const [expandedQuestoes, setExpandedQuestoes] = useState<Set<string>>(new Set());
  
  // Estado para nova questão - Sempre 4 alternativas para prova
  const defaultAlternativas = [
    { letra: "A", texto: "", correta: false },
    { letra: "B", texto: "", correta: false },
    { letra: "C", texto: "", correta: false },
    { letra: "D", texto: "", correta: false },
  ];

  const [novaQuestao, setNovaQuestao] = useState({
    pergunta: "",
    tipo: "multipla_escolha",
    alternativas: defaultAlternativas,
    resposta_correta: "" as string, // A, B, C ou D
    pontuacao: 10,
  });

  // Reset form quando abre/fecha
  const resetForm = () => {
    setNovaQuestao({
      pergunta: "",
      tipo: "multipla_escolha",
      alternativas: defaultAlternativas.map(a => ({ ...a, texto: "", correta: false })),
      resposta_correta: "",
      pontuacao: 10,
    });
  };

  // Buscar questões existentes
  const { data: questoes, isLoading } = useQuery({
    queryKey: ["perguntas-avaliacao", avaliacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perguntas_avaliacao")
        .select("*")
        .eq("avaliacao_id", avaliacaoId)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      return data as Questao[];
    },
    enabled: !!avaliacaoId,
  });

  // Criar questão
  const createQuestao = useMutation({
    mutationFn: async (questao: {
      pergunta: string;
      tipo: string;
      alternativas: { letra: string; texto: string; correta: boolean }[];
      resposta_correta: string;
      pontuacao: number;
    }) => {
      // Formatar opções para salvar (com flag correta)
      const opcoesFormatadas = questao.alternativas.map(alt => ({
        letra: alt.letra,
        texto: alt.texto,
        correta: alt.letra === questao.resposta_correta
      }));

      // Encontrar o texto da alternativa correta
      const alternativaCorreta = questao.alternativas.find(
        a => a.letra === questao.resposta_correta
      );
      
      const { error } = await supabase
        .from("perguntas_avaliacao")
        .insert({
          avaliacao_id: avaliacaoId,
          pergunta: questao.pergunta,
          tipo: questao.tipo,
          opcoes: opcoesFormatadas,
          resposta_correta: alternativaCorreta?.texto || null,
          pontuacao: questao.pontuacao,
          ordem: (questoes?.length || 0) + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perguntas-avaliacao", avaliacaoId] });
      toast.success("Questão adicionada! Você pode adicionar mais questões abaixo.");
      resetForm();
      // Mantém o formulário aberto para adicionar mais questões
      setShowNovaQuestao(true);
    },
    onError: () => {
      toast.error("Erro ao adicionar questão");
    },
  });

  // Excluir questão
  const deleteQuestao = useMutation({
    mutationFn: async (questaoId: string) => {
      const { error } = await supabase
        .from("perguntas_avaliacao")
        .delete()
        .eq("id", questaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perguntas-avaliacao", avaliacaoId] });
      toast.success("Questão removida");
    },
    onError: () => {
      toast.error("Erro ao remover questão");
    },
  });

  const handleAddQuestao = () => {
    // Validar enunciado
    if (!novaQuestao.pergunta.trim()) {
      toast.error("Digite o enunciado da questão");
      return;
    }

    // Validar que todas as 4 alternativas estão preenchidas
    const alternativasVazias = novaQuestao.alternativas.filter(a => !a.texto.trim());
    if (alternativasVazias.length > 0) {
      toast.error(`Preencha todas as 4 alternativas (${alternativasVazias.map(a => a.letra).join(", ")} vazias)`);
      return;
    }

    // Validar que uma resposta correta foi selecionada
    if (!novaQuestao.resposta_correta) {
      toast.error("Selecione a alternativa correta (A, B, C ou D)");
      return;
    }

    createQuestao.mutate(novaQuestao);
  };

  const handleAlternativaChange = (letra: string, texto: string) => {
    setNovaQuestao(prev => ({
      ...prev,
      alternativas: prev.alternativas.map((alt) => 
        alt.letra === letra ? { ...alt, texto } : alt
      ),
    }));
  };

  const handleCorretaChange = (letra: string) => {
    setNovaQuestao(prev => ({
      ...prev,
      resposta_correta: letra,
      alternativas: prev.alternativas.map((alt) => ({
        ...alt,
        correta: alt.letra === letra,
      })),
    }));
  };

  const toggleQuestao = (id: string) => {
    setExpandedQuestoes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const parseOpcoes = (opcoes: unknown): { letra?: string; texto: string; correta: boolean }[] => {
    if (Array.isArray(opcoes)) {
      return opcoes.map((opt, index) => {
        if (typeof opt === 'object' && opt !== null) {
          const o = opt as Record<string, unknown>;
          return {
            letra: String(o.letra || LETRAS[index] || ""),
            texto: String(o.texto || ""),
            correta: Boolean(o.correta)
          };
        }
        return { letra: LETRAS[index], texto: "", correta: false };
      });
    }
    return [];
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between bg-primary/10 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <div>
            <span className="text-sm font-bold text-primary">
              Questões da Prova ({questoes?.length || 0})
            </span>
            <p className="text-xs text-muted-foreground">
              Cada questão deve ter 4 alternativas (A, B, C, D) com uma resposta correta
            </p>
          </div>
        </div>
        {!showNovaQuestao && (
          <Button 
            size="sm" 
            onClick={() => setShowNovaQuestao(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar Nova Questão
          </Button>
        )}
      </div>

      {/* Formulário para nova questão */}
      {showNovaQuestao && (
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Nova Questão de Múltipla Escolha</span>
            </div>

            <div>
              <Label className="text-sm font-medium">Enunciado da Questão *</Label>
              <Textarea
                placeholder="Digite o enunciado da questão aqui..."
                value={novaQuestao.pergunta}
                onChange={(e) => setNovaQuestao(prev => ({ ...prev, pergunta: e.target.value }))}
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Alternativas *
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Preencha as 4 alternativas e selecione a correta clicando no círculo
              </p>
              
              <RadioGroup 
                value={novaQuestao.resposta_correta}
                onValueChange={handleCorretaChange}
                className="space-y-3"
              >
                {novaQuestao.alternativas.map((alt) => (
                  <div key={alt.letra} className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-2">
                      <RadioGroupItem 
                        value={alt.letra} 
                        id={`alt-${alt.letra}`}
                        className="shrink-0"
                      />
                      <Label 
                        htmlFor={`alt-${alt.letra}`}
                        className={`font-bold w-6 text-center cursor-pointer ${
                          novaQuestao.resposta_correta === alt.letra 
                            ? "text-green-600" 
                            : "text-muted-foreground"
                        }`}
                      >
                        {alt.letra})
                      </Label>
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder={`Digite o texto da alternativa ${alt.letra}`}
                        value={alt.texto}
                        onChange={(e) => handleAlternativaChange(alt.letra, e.target.value)}
                        className={
                          novaQuestao.resposta_correta === alt.letra && alt.texto 
                            ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" 
                            : ""
                        }
                      />
                    </div>
                    {novaQuestao.resposta_correta === alt.letra && alt.texto && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="w-32">
              <Label className="text-sm font-medium">Pontuação</Label>
              <Input
                type="number"
                min={1}
                value={novaQuestao.pontuacao}
                onChange={(e) => setNovaQuestao(prev => ({ ...prev, pontuacao: Number(e.target.value) }))}
                className="mt-1"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Após salvar, você pode adicionar mais questões
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setShowNovaQuestao(false);
                    resetForm();
                  }}
                >
                  Fechar Formulário
                </Button>
                <Button 
                  size="sm"
                  onClick={handleAddQuestao}
                  disabled={createQuestao.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createQuestao.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Salvar e Adicionar Outra
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de questões existentes */}
      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : questoes && questoes.length > 0 ? (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {questoes.map((questao, index) => {
              const opcoes = parseOpcoes(questao.opcoes);
              const isExpanded = expandedQuestoes.has(questao.id);
              
              return (
                <Card key={questao.id} className="overflow-hidden">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleQuestao(questao.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge variant="secondary" className="shrink-0">
                            Q{index + 1}
                          </Badge>
                          <p className="text-sm font-medium truncate">
                            {questao.pergunta}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {questao.pontuacao || 10} pts
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuestao.mutate(questao.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-1 border-t bg-muted/20">
                        <p className="text-sm font-medium mb-3">
                          {questao.pergunta}
                        </p>
                        <div className="space-y-2">
                          {opcoes.map((opcao, i) => (
                            <div 
                              key={i}
                              className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                                opcao.correta 
                                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800" 
                                  : "bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              <span className="font-bold w-6">
                                {opcao.letra || LETRAS[i]})
                              </span>
                              <span className="flex-1">{opcao.texto}</span>
                              {opcao.correta && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  Correta
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground font-medium">Nenhuma questão cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Clique em "Adicionar Questão" para criar questões de múltipla escolha
          </p>
        </div>
      )}
    </div>
  );
};
