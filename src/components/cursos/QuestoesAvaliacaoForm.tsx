import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  CheckCircle2, 
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp
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

export const QuestoesAvaliacaoForm = ({ avaliacaoId, tipoAvaliacao }: QuestoesAvaliacaoFormProps) => {
  const queryClient = useQueryClient();
  const [showNovaQuestao, setShowNovaQuestao] = useState(false);
  const [expandedQuestoes, setExpandedQuestoes] = useState<Set<string>>(new Set());
  
  // Estado para nova questão - Quiz: 3 alternativas, Prova: 4 alternativas fixas
  const defaultAlternativas = tipoAvaliacao === "quiz" 
    ? [
        { texto: "", correta: true },
        { texto: "", correta: false },
        { texto: "", correta: false },
      ]
    : [
        { texto: "", correta: true },
        { texto: "", correta: false },
        { texto: "", correta: false },
        { texto: "", correta: false },
      ];

  const [novaQuestao, setNovaQuestao] = useState({
    pergunta: "",
    tipo: "multipla_escolha",
    alternativas: defaultAlternativas,
    pontuacao: 10,
  });
  
  // Reset alternativas quando tipo muda
  useEffect(() => {
    setNovaQuestao(prev => ({
      ...prev,
      alternativas: defaultAlternativas
    }));
  }, [tipoAvaliacao]);

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
      alternativas: { texto: string; correta: boolean }[];
      pontuacao: number;
    }) => {
      // Encontrar alternativa correta
      const alternativaCorreta = questao.alternativas.find(a => a.correta);
      
      const { error } = await supabase
        .from("perguntas_avaliacao")
        .insert({
          avaliacao_id: avaliacaoId,
          pergunta: questao.pergunta,
          tipo: questao.tipo,
          opcoes: questao.alternativas,
          resposta_correta: alternativaCorreta?.texto || null,
          pontuacao: questao.pontuacao,
          ordem: (questoes?.length || 0) + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perguntas-avaliacao", avaliacaoId] });
      toast.success("Questão adicionada com sucesso!");
      setShowNovaQuestao(false);
      setNovaQuestao({
        pergunta: "",
        tipo: "multipla_escolha",
        alternativas: defaultAlternativas,
        pontuacao: 10,
      });
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
    if (!novaQuestao.pergunta.trim()) {
      toast.error("Digite o enunciado da questão");
      return;
    }

    const alternativasPreenchidas = novaQuestao.alternativas.filter(a => a.texto.trim());
    
    // Para prova, exigir exatamente 4 alternativas preenchidas
    if (tipoAvaliacao === "prova") {
      if (alternativasPreenchidas.length !== 4) {
        toast.error("Preencha todas as 4 alternativas");
        return;
      }
    } else {
      // Para quiz, exigir pelo menos 2
      if (alternativasPreenchidas.length < 2) {
        toast.error("Preencha pelo menos 2 alternativas");
        return;
      }
    }

    const temCorreta = novaQuestao.alternativas.some(a => a.correta && a.texto.trim());
    if (!temCorreta) {
      toast.error("Marque uma alternativa como correta");
      return;
    }

    createQuestao.mutate(novaQuestao);
  };

  const handleAlternativaChange = (index: number, texto: string) => {
    setNovaQuestao(prev => ({
      ...prev,
      alternativas: prev.alternativas.map((alt, i) => 
        i === index ? { ...alt, texto } : alt
      ),
    }));
  };

  const handleCorretaChange = (index: number) => {
    setNovaQuestao(prev => ({
      ...prev,
      alternativas: prev.alternativas.map((alt, i) => ({
        ...alt,
        correta: i === index,
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

  const parseOpcoes = (opcoes: unknown): { texto: string; correta: boolean }[] => {
    if (Array.isArray(opcoes)) {
      return opcoes as { texto: string; correta: boolean }[];
    }
    return [];
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Questões ({questoes?.length || 0})
          </span>
          <Badge variant="outline" className="text-xs">
            {tipoAvaliacao === "quiz" ? "3 alternativas" : "4 alternativas obrigatórias"}
          </Badge>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setShowNovaQuestao(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Questão
        </Button>
      </div>

      {/* Formulário para nova questão */}
      {showNovaQuestao && (
        <Card className="border-dashed border-primary/50 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label>Enunciado da Questão *</Label>
              <Textarea
                placeholder="Digite o enunciado da questão..."
                value={novaQuestao.pergunta}
                onChange={(e) => setNovaQuestao(prev => ({ ...prev, pergunta: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-2 block">
                Alternativas {tipoAvaliacao === "quiz" ? "(3 opções)" : "(4 opções obrigatórias)"} *
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                {tipoAvaliacao === "prova" 
                  ? "Preencha todas as 4 alternativas e marque a correta"
                  : "Marque a alternativa correta clicando no círculo"
                }
              </p>
              
              <RadioGroup 
                value={novaQuestao.alternativas.findIndex(a => a.correta).toString()}
                onValueChange={(v) => handleCorretaChange(parseInt(v))}
                className="space-y-2"
              >
                {novaQuestao.alternativas.map((alt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <RadioGroupItem value={index.toString()} id={`alt-${index}`} />
                    <Input
                      placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                      value={alt.texto}
                      onChange={(e) => handleAlternativaChange(index, e.target.value)}
                      className={alt.correta && alt.texto ? "border-green-500 bg-green-50/50" : ""}
                    />
                    {alt.correta && alt.texto && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                  </div>
                ))}
              </RadioGroup>

              {/* Para prova, não permitir adicionar mais alternativas - sempre 4 fixas */}
            </div>

            <div className="w-32">
              <Label>Pontuação</Label>
              <Input
                type="number"
                min={1}
                value={novaQuestao.pontuacao}
                onChange={(e) => setNovaQuestao(prev => ({ ...prev, pontuacao: Number(e.target.value) }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowNovaQuestao(false);
                  setNovaQuestao({
                    pergunta: "",
                    tipo: "multipla_escolha",
                    alternativas: defaultAlternativas,
                    pontuacao: 10,
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                size="sm"
                onClick={handleAddQuestao}
                disabled={createQuestao.isPending}
              >
                {createQuestao.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Salvar Questão
              </Button>
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
        <ScrollArea className="max-h-[300px]">
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
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary" className="shrink-0">
                            Q{index + 1}
                          </Badge>
                          <p className="text-sm font-medium line-clamp-1">
                            {questao.pergunta}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                      <div className="px-3 pb-3 pt-1 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          {questao.pergunta}
                        </p>
                        <div className="space-y-1 ml-2">
                          {opcoes.map((opcao, i) => (
                            <div 
                              key={i}
                              className={`flex items-center gap-2 text-sm p-1.5 rounded ${
                                opcao.correta 
                                  ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" 
                                  : "text-muted-foreground"
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + i)})
                              </span>
                              <span>{opcao.texto}</span>
                              {opcao.correta && (
                                <CheckCircle2 className="h-3 w-3 ml-auto" />
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
        <div className="text-center py-4 text-muted-foreground text-sm">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma questão cadastrada</p>
          <p className="text-xs">Adicione questões para esta avaliação</p>
        </div>
      )}
    </div>
  );
};
