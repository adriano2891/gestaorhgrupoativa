import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado para nova questão - 4 alternativas fixas (A, B, C, D)
  const [novaQuestao, setNovaQuestao] = useState({
    pergunta: "",
    altA: "",
    altB: "",
    altC: "",
    altD: "",
    correta: "" as string, // "A", "B", "C" ou "D"
    pontuacao: 10,
  });

  // Reset form - limpa todos os campos
  const resetForm = () => {
    setNovaQuestao({
      pergunta: "",
      altA: "",
      altB: "",
      altC: "",
      altD: "",
      correta: "",
      pontuacao: 10,
    });
    setErrorMessage(null);
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
    mutationFn: async () => {
      // Formatar opções para salvar no banco
      const opcoesFormatadas = [
        { letra: "A", texto: novaQuestao.altA, correta: novaQuestao.correta === "A" },
        { letra: "B", texto: novaQuestao.altB, correta: novaQuestao.correta === "B" },
        { letra: "C", texto: novaQuestao.altC, correta: novaQuestao.correta === "C" },
        { letra: "D", texto: novaQuestao.altD, correta: novaQuestao.correta === "D" },
      ];

      const { error } = await supabase
        .from("perguntas_avaliacao")
        .insert({
          avaliacao_id: avaliacaoId,
          pergunta: novaQuestao.pergunta,
          tipo: "multipla_escolha",
          opcoes: opcoesFormatadas,
          resposta_correta: novaQuestao.correta, // Salva a LETRA (A, B, C ou D)
          pontuacao: novaQuestao.pontuacao,
          ordem: (questoes?.length || 0) + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perguntas-avaliacao", avaliacaoId] });
      toast.success("Pergunta adicionada à prova!");
      resetForm();
      // Foca no campo de pergunta para adicionar próxima
      setTimeout(() => {
        document.getElementById("questionText")?.focus();
      }, 100);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar questão: ${error.message}`);
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
    setErrorMessage(null);

    // 1. Validar enunciado
    if (!novaQuestao.pergunta.trim()) {
      setErrorMessage("Por favor, preencha o enunciado da pergunta.");
      return;
    }

    // 2. Validar todas as alternativas
    if (!novaQuestao.altA.trim() || !novaQuestao.altB.trim() || 
        !novaQuestao.altC.trim() || !novaQuestao.altD.trim()) {
      setErrorMessage("Por favor, preencha todas as 4 alternativas (A, B, C e D).");
      return;
    }

    // 3. Validar resposta correta selecionada
    if (!novaQuestao.correta) {
      setErrorMessage("Por favor, selecione qual das 4 alternativas é a correta.");
      return;
    }

    createQuestao.mutate();
  };

  const parseOpcoes = (opcoes: unknown): { letra: string; texto: string; correta: boolean }[] => {
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
    <div className="space-y-6 mt-4">
      {/* Mensagem de erro */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Formulário para nova questão - SEMPRE VISÍVEL */}
      <Card className="border-2 border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Pergunta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enunciado da pergunta */}
          <div>
            <Label htmlFor="questionText" className="text-sm font-semibold">
              Enunciado da Pergunta:
            </Label>
            <Textarea
              id="questionText"
              placeholder="Digite a pergunta aqui..."
              value={novaQuestao.pergunta}
              onChange={(e) => setNovaQuestao(prev => ({ ...prev, pergunta: e.target.value }))}
              rows={3}
              className="mt-1 resize-y"
            />
          </div>

          {/* Alternativas */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="font-semibold mb-4">Alternativas e Resposta Correta:</p>
            
            <div className="space-y-3">
              {/* Alternativa A */}
              <div className="flex items-center gap-3">
                <span className="font-bold w-6 text-center">A)</span>
                <Input
                  placeholder="Texto da alternativa A"
                  value={novaQuestao.altA}
                  onChange={(e) => setNovaQuestao(prev => ({ ...prev, altA: e.target.value }))}
                  className={`flex-1 ${novaQuestao.correta === "A" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                />
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={novaQuestao.correta === "A"}
                    onChange={() => setNovaQuestao(prev => ({ ...prev, correta: "A" }))}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className={`text-sm ${novaQuestao.correta === "A" ? "text-green-600 font-medium" : ""}`}>
                    Correta
                  </span>
                </label>
              </div>

              {/* Alternativa B */}
              <div className="flex items-center gap-3">
                <span className="font-bold w-6 text-center">B)</span>
                <Input
                  placeholder="Texto da alternativa B"
                  value={novaQuestao.altB}
                  onChange={(e) => setNovaQuestao(prev => ({ ...prev, altB: e.target.value }))}
                  className={`flex-1 ${novaQuestao.correta === "B" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                />
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={novaQuestao.correta === "B"}
                    onChange={() => setNovaQuestao(prev => ({ ...prev, correta: "B" }))}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className={`text-sm ${novaQuestao.correta === "B" ? "text-green-600 font-medium" : ""}`}>
                    Correta
                  </span>
                </label>
              </div>

              {/* Alternativa C */}
              <div className="flex items-center gap-3">
                <span className="font-bold w-6 text-center">C)</span>
                <Input
                  placeholder="Texto da alternativa C"
                  value={novaQuestao.altC}
                  onChange={(e) => setNovaQuestao(prev => ({ ...prev, altC: e.target.value }))}
                  className={`flex-1 ${novaQuestao.correta === "C" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                />
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={novaQuestao.correta === "C"}
                    onChange={() => setNovaQuestao(prev => ({ ...prev, correta: "C" }))}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className={`text-sm ${novaQuestao.correta === "C" ? "text-green-600 font-medium" : ""}`}>
                    Correta
                  </span>
                </label>
              </div>

              {/* Alternativa D */}
              <div className="flex items-center gap-3">
                <span className="font-bold w-6 text-center">D)</span>
                <Input
                  placeholder="Texto da alternativa D"
                  value={novaQuestao.altD}
                  onChange={(e) => setNovaQuestao(prev => ({ ...prev, altD: e.target.value }))}
                  className={`flex-1 ${novaQuestao.correta === "D" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                />
                <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={novaQuestao.correta === "D"}
                    onChange={() => setNovaQuestao(prev => ({ ...prev, correta: "D" }))}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className={`text-sm ${novaQuestao.correta === "D" ? "text-green-600 font-medium" : ""}`}>
                    Correta
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Botão Adicionar */}
          <Button
            onClick={handleAddQuestao}
            disabled={createQuestao.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {createQuestao.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Adicionar Pergunta à Prova
          </Button>
        </CardContent>
      </Card>

      {/* Área de Revisão - Lista de Perguntas Adicionadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Perguntas Adicionadas ({questoes?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : questoes && questoes.length > 0 ? (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-4">
                {questoes.map((questao, index) => {
                  const opcoes = parseOpcoes(questao.opcoes);
                  
                  return (
                    <div 
                      key={questao.id} 
                      className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="font-semibold">
                          {index + 1}. {questao.pergunta}
                        </h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteQuestao.mutate(questao.id)}
                          disabled={deleteQuestao.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <ul className="space-y-1.5 pl-1">
                        {opcoes.map((opcao) => (
                          <li 
                            key={opcao.letra}
                            className={`flex items-center gap-2 text-sm ${
                              opcao.correta 
                                ? "text-green-600 dark:text-green-400 font-medium" 
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="font-bold w-5">{opcao.letra})</span>
                            <span>{opcao.texto}</span>
                            {opcao.correta && (
                              <CheckCircle2 className="h-4 w-4 ml-1" />
                            )}
                          </li>
                        ))}
                      </ul>
                      
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {questao.pontuacao || 10} pts
                        </Badge>
                        <span className="ml-2">
                          Resposta correta: <strong>Alternativa {questao.resposta_correta}</strong>
                        </span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="italic">Nenhuma pergunta adicionada ainda.</p>
              <p className="text-sm mt-1">Preencha o formulário acima e clique em "Adicionar Pergunta à Prova".</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
