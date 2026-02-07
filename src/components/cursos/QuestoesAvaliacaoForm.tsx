import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle,
  Loader2,
  AlertCircle,
  Eye
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
  tipoAvaliacao: string;
}

const LETRAS = ["A", "B", "C", "D"];

export const QuestoesAvaliacaoForm = ({ avaliacaoId, tipoAvaliacao }: QuestoesAvaliacaoFormProps) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const [novaQuestao, setNovaQuestao] = useState({
    pergunta: "",
    altA: "",
    altB: "",
    altC: "",
    altD: "",
    correta: "" as string,
    pontuacao: 10,
  });

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

  // Auto-scroll to last question when list updates
  const prevCount = useRef(0);
  useEffect(() => {
    if (questoes && questoes.length > prevCount.current) {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    prevCount.current = questoes?.length || 0;
  }, [questoes?.length]);

  const createQuestao = useMutation({
    mutationFn: async () => {
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
          resposta_correta: novaQuestao.correta,
          pontuacao: novaQuestao.pontuacao,
          ordem: (questoes?.length || 0) + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perguntas-avaliacao", avaliacaoId] });
      toast.success("Pergunta adicionada à prova!");
      resetForm();
      setTimeout(() => {
        document.getElementById("questionText")?.focus();
      }, 100);
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar questão: ${error.message}`);
    },
  });

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

    if (!novaQuestao.pergunta.trim()) {
      setErrorMessage("Por favor, preencha o enunciado da pergunta.");
      return;
    }

    if (!novaQuestao.altA.trim() || !novaQuestao.altB.trim() || 
        !novaQuestao.altC.trim() || !novaQuestao.altD.trim()) {
      setErrorMessage("Por favor, preencha todas as 4 alternativas (A, B, C e D).");
      return;
    }

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
    <div className="space-y-4 mt-2 pb-4">
      {/* Error message */}
      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-xs">{errorMessage}</span>
        </div>
      )}

      {/* Preview da prova completa — mostrado primeiro */}
      <Card className="border-primary/30">
        <CardHeader className="pb-2 py-2 px-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Preview da Prova ({questoes?.length || 0} questões)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : questoes && questoes.length > 0 ? (
            <div className="space-y-3">
              {questoes.map((questao, index) => {
                const opcoes = parseOpcoes(questao.opcoes);
                
                return (
                  <div 
                    key={questao.id} 
                    className="bg-muted/50 p-3 rounded-lg border-l-4 border-primary"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm">
                        {index + 1}. {questao.pergunta}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteQuestao.mutate(questao.id)}
                        disabled={deleteQuestao.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    
                    <ul className="space-y-1 pl-1">
                      {opcoes.map((opcao) => (
                        <li 
                          key={opcao.letra}
                          className={`flex items-center gap-2 text-xs ${
                            opcao.correta 
                              ? "text-green-600 dark:text-green-400 font-medium" 
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="font-bold w-4">{opcao.letra})</span>
                          <span>{opcao.texto}</span>
                          {opcao.correta && (
                            <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                          )}
                        </li>
                      ))}
                    </ul>
                    
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {questao.pontuacao || 10} pts
                      </Badge>
                      <span className="ml-1">
                        Correta: <strong>{questao.resposta_correta}</strong>
                      </span>
                    </p>
                  </div>
                );
              })}
              <div ref={listEndRef} />
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <p className="italic">Nenhuma pergunta adicionada ainda.</p>
              <p className="text-xs mt-1">Use o formulário abaixo para adicionar questões.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulário para nova questão */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Nova Pergunta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0">
          <div>
            <Label htmlFor="questionText" className="text-xs font-semibold">
              Enunciado:
            </Label>
            <Textarea
              id="questionText"
              placeholder="Digite a pergunta aqui..."
              value={novaQuestao.pergunta}
              onChange={(e) => setNovaQuestao(prev => ({ ...prev, pergunta: e.target.value }))}
              rows={2}
              className="mt-1 resize-y text-sm"
            />
          </div>

          <div className="bg-muted/50 p-2 rounded-lg border">
            <p className="font-semibold text-xs mb-2">Alternativas (marque a correta):</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["A", "B", "C", "D"] as const).map((letra) => {
                const altKey = `alt${letra}` as "altA" | "altB" | "altC" | "altD";
                return (
                  <div key={letra} className="flex items-center gap-2">
                    <label className="flex items-center gap-1 cursor-pointer shrink-0">
                      <input
                        type="radio"
                        name={`correctAnswer-${avaliacaoId}`}
                        checked={novaQuestao.correta === letra}
                        onChange={() => setNovaQuestao(prev => ({ ...prev, correta: letra }))}
                        className="w-3.5 h-3.5 accent-green-600"
                      />
                      <span className={`font-bold text-sm ${novaQuestao.correta === letra ? "text-green-600" : ""}`}>{letra})</span>
                    </label>
                    <Input
                      placeholder={`Alternativa ${letra}`}
                      value={novaQuestao[altKey]}
                      onChange={(e) => setNovaQuestao(prev => ({ ...prev, [altKey]: e.target.value }))}
                      className={`flex-1 h-8 text-sm ${novaQuestao.correta === letra ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleAddQuestao}
            disabled={createQuestao.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="default"
          >
            {createQuestao.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Adicionar Pergunta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
