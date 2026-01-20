import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Trophy,
  ArrowRight,
  Loader2,
  Award,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AvaliacaoCurso } from "@/hooks/useAvaliacoesCurso";

interface OpcaoQuestao {
  letra?: string;
  texto: string;
  correta: boolean;
}

interface Questao {
  id: string;
  pergunta: string;
  tipo: string | null;
  opcoes: OpcaoQuestao[];
  resposta_correta: string | null;
  pontuacao: number | null;
  ordem: number | null;
}

interface AvaliacaoPlayerProps {
  avaliacao: AvaliacaoCurso;
  cursoId: string;
  onComplete: (aprovado: boolean) => void;
  onClose: () => void;
}

const TEMPO_POR_QUESTAO = 120; // 2 minutos em segundos

export const AvaliacaoPlayer = ({ 
  avaliacao, 
  cursoId, 
  onComplete, 
  onClose 
}: AvaliacaoPlayerProps) => {
  const queryClient = useQueryClient();
  const [currentQuestaoIndex, setCurrentQuestaoIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [tempoRestante, setTempoRestante] = useState(TEMPO_POR_QUESTAO);
  const [provaIniciada, setProvaIniciada] = useState(false);
  const [provaFinalizada, setProvaFinalizada] = useState(false);
  const [resultado, setResultado] = useState<{
    total: number;
    corretas: number;
    incorretas: number;
    aprovado: boolean;
    nota: number;
  } | null>(null);
  const [tentativaId, setTentativaId] = useState<string | null>(null);
  
  // Buscar questões da avaliação
  const { data: questoes, isLoading: loadingQuestoes } = useQuery({
    queryKey: ["perguntas-avaliacao", avaliacao.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perguntas_avaliacao")
        .select("*")
        .eq("avaliacao_id", avaliacao.id)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      
      const LETRAS = ["A", "B", "C", "D"];
      
      // Parse opcoes for each question
      return (data || []).map(q => {
        let parsedOpcoes: OpcaoQuestao[] = [];
        if (Array.isArray(q.opcoes)) {
          parsedOpcoes = q.opcoes.map((opt: unknown, index: number) => {
            if (typeof opt === 'object' && opt !== null) {
              const o = opt as Record<string, unknown>;
              return {
                letra: String(o.letra || LETRAS[index] || ""),
                texto: String(o.texto || ''),
                correta: Boolean(o.correta)
              };
            }
            return { letra: LETRAS[index], texto: '', correta: false };
          });
        }
        return {
          id: q.id,
          pergunta: q.pergunta,
          tipo: q.tipo,
          opcoes: parsedOpcoes,
          resposta_correta: q.resposta_correta,
          pontuacao: q.pontuacao,
          ordem: q.ordem
        } as Questao;
      });
    },
  });

  // Verificar se pode fazer nova tentativa (24h após reprovação)
  const { data: ultimaTentativa, isLoading: loadingTentativa } = useQuery({
    queryKey: ["ultima-tentativa", avaliacao.id],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from("tentativas_avaliacao")
        .select("*")
        .eq("avaliacao_id", avaliacao.id)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Verificar se está bloqueado (reprovado nas últimas 24h)
  const verificarBloqueio = useCallback(() => {
    if (!ultimaTentativa) return { bloqueado: false, tempoRestanteBloqueio: 0 };
    
    if (ultimaTentativa.aprovado) return { bloqueado: false, tempoRestanteBloqueio: 0 };
    
    const dataUltimaTentativa = new Date(ultimaTentativa.created_at);
    const agora = new Date();
    const diffMs = agora.getTime() - dataUltimaTentativa.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    
    if (diffHoras < 24) {
      const horasRestantes = Math.ceil(24 - diffHoras);
      return { bloqueado: true, tempoRestanteBloqueio: horasRestantes };
    }
    
    return { bloqueado: false, tempoRestanteBloqueio: 0 };
  }, [ultimaTentativa]);

  const { bloqueado, tempoRestanteBloqueio } = verificarBloqueio();

  // Criar nova tentativa
  const criarTentativa = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("tentativas_avaliacao")
        .insert({
          avaliacao_id: avaliacao.id,
          user_id: user.user.id,
          data_inicio: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setTentativaId(data.id);
    },
  });

  // Finalizar tentativa
  const finalizarTentativa = useMutation({
    mutationFn: async (params: {
      tentativaId: string;
      respostas: Record<string, string>;
      nota: number;
      aprovado: boolean;
      tempoGasto: number;
    }) => {
      const { error } = await supabase
        .from("tentativas_avaliacao")
        .update({
          respostas: params.respostas,
          nota: params.nota,
          aprovado: params.aprovado,
          tempo_gasto: params.tempoGasto,
          data_conclusao: new Date().toISOString(),
        })
        .eq("id", params.tentativaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tentativas-usuario", cursoId] });
      queryClient.invalidateQueries({ queryKey: ["verificar-conclusao-avaliacoes", cursoId] });
      queryClient.invalidateQueries({ queryKey: ["ultima-tentativa", avaliacao.id] });
    },
  });

  // Timer por questão
  useEffect(() => {
    if (!provaIniciada || provaFinalizada || !questoes) return;

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          // Tempo esgotado - avançar para próxima questão
          handleProximaQuestao(true);
          return TEMPO_POR_QUESTAO;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [provaIniciada, provaFinalizada, currentQuestaoIndex, questoes]);

  // Reset timer quando muda de questão
  useEffect(() => {
    setTempoRestante(TEMPO_POR_QUESTAO);
  }, [currentQuestaoIndex]);

  const handleIniciarProva = async () => {
    if (bloqueado) {
      toast.error("Prova bloqueada", {
        description: `Aguarde ${tempoRestanteBloqueio} hora(s) para realizar nova tentativa.`
      });
      return;
    }

    await criarTentativa.mutateAsync();
    setProvaIniciada(true);
    setTempoRestante(TEMPO_POR_QUESTAO);
  };

  const handleSelecionarResposta = (questaoId: string, resposta: string) => {
    setRespostas(prev => ({
      ...prev,
      [questaoId]: resposta
    }));
  };

  const handleProximaQuestao = useCallback((tempoEsgotado: boolean = false) => {
    if (!questoes) return;

    const questaoAtual = questoes[currentQuestaoIndex];
    
    // Se tempo esgotou e não respondeu, marcar questão como não respondida
    if (tempoEsgotado && !respostas[questaoAtual.id]) {
      toast.warning("Tempo esgotado!", {
        description: "A questão foi marcada como incorreta."
      });
    }

    // Verificar se é a última questão
    if (currentQuestaoIndex >= questoes.length - 1) {
      finalizarProva();
    } else {
      setCurrentQuestaoIndex(prev => prev + 1);
    }
  }, [questoes, currentQuestaoIndex, respostas]);

  const finalizarProva = async () => {
    if (!questoes || !tentativaId) return;

    setProvaFinalizada(true);

    // Calcular resultado
    let corretas = 0;
    let totalPontos = 0;
    let pontosObtidos = 0;

    questoes.forEach(questao => {
      const pontos = questao.pontuacao || 10;
      totalPontos += pontos;
      
      const respostaUsuario = respostas[questao.id];
      // A resposta correta agora é salva como LETRA (A, B, C, D)
      // Também suporta o formato antigo (texto da alternativa) para retrocompatibilidade
      const letraCorreta = questao.resposta_correta;
      const opcaoCorreta = questao.opcoes.find(o => o.correta);
      
      // Verifica se a resposta do usuário é a letra correta OU o texto da alternativa correta
      const isCorreta = respostaUsuario && (
        respostaUsuario === letraCorreta || 
        respostaUsuario === opcaoCorreta?.texto ||
        respostaUsuario === opcaoCorreta?.letra
      );
      
      if (isCorreta) {
        corretas++;
        pontosObtidos += pontos;
      }
    });

    const nota = Math.round((pontosObtidos / totalPontos) * 100);
    const aprovado = nota >= 70; // 70% para aprovação

    const resultadoFinal = {
      total: questoes.length,
      corretas,
      incorretas: questoes.length - corretas,
      aprovado,
      nota
    };

    setResultado(resultadoFinal);

    // Salvar resultado
    await finalizarTentativa.mutateAsync({
      tentativaId,
      respostas,
      nota,
      aprovado,
      tempoGasto: Math.round((questoes.length * TEMPO_POR_QUESTAO - tempoRestante) / 60)
    });

    onComplete(aprovado);
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTempoColor = () => {
    if (tempoRestante <= 30) return "text-red-500";
    if (tempoRestante <= 60) return "text-yellow-500";
    return "text-foreground";
  };

  if (loadingQuestoes || loadingTentativa) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando avaliação...</p>
        </CardContent>
      </Card>
    );
  }

  if (!questoes || questoes.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Avaliação sem questões</p>
          <p className="text-muted-foreground mt-2">
            Esta avaliação ainda não possui questões configuradas.
          </p>
          <Button className="mt-4" onClick={onClose}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tela de bloqueio
  if (bloqueado && !provaIniciada) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl font-bold text-foreground">Prova Bloqueada</p>
          <p className="text-muted-foreground mt-2">
            Você foi reprovado(a) na última tentativa.
          </p>
          <p className="text-muted-foreground mt-1">
            Uma nova tentativa será liberada em <strong>{tempoRestanteBloqueio} hora(s)</strong>.
          </p>
          <Button className="mt-6" variant="outline" onClick={onClose}>
            Voltar ao Curso
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tela inicial
  if (!provaIniciada) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{avaliacao.titulo}</CardTitle>
          <CardDescription>{avaliacao.descricao}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{questoes.length}</p>
              <p className="text-sm text-muted-foreground">Questões</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">2 min</p>
              <p className="text-sm text-muted-foreground">Por questão</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              Regras da Prova
            </h4>
            <ul className="mt-2 space-y-1 text-sm text-yellow-600 dark:text-yellow-300">
              <li>• Cada questão tem um tempo limite de <strong>2 minutos</strong></li>
              <li>• Se o tempo esgotar, a questão será marcada como <strong>incorreta</strong></li>
              <li>• <strong>Não é possível voltar</strong> para questões anteriores</li>
              <li>• Nota mínima para aprovação: <strong>70%</strong></li>
              <li>• Se reprovado, nova tentativa após <strong>24 horas</strong></li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
            <Button 
              size="lg" 
              onClick={handleIniciarProva}
              disabled={criarTentativa.isPending}
            >
              {criarTentativa.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Iniciar Prova
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tela de resultado
  if (provaFinalizada && resultado) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-12 text-center space-y-6">
          {resultado.aprovado ? (
            <>
              <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center">
                <Trophy className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">Aprovado!</p>
                <p className="text-muted-foreground mt-2">
                  Parabéns! Você foi aprovado(a) na avaliação.
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 inline-block">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Award className="h-5 w-5" />
                  <span className="font-medium">
                    Seu certificado estará disponível em breve no portal.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">Reprovado</p>
                <p className="text-muted-foreground mt-2">
                  Infelizmente você não atingiu a nota mínima.
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 inline-block">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">
                    Uma nova tentativa será liberada em 24 horas.
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{resultado.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{resultado.corretas}</p>
              <p className="text-xs text-muted-foreground">Corretas</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{resultado.incorretas}</p>
              <p className="text-xs text-muted-foreground">Incorretas</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-4xl font-bold">{resultado.nota}%</p>
            <p className="text-sm text-muted-foreground">Nota Final</p>
          </div>

          <Button onClick={onClose} size="lg">
            Voltar ao Curso
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tela da prova em andamento
  const questaoAtual = questoes[currentQuestaoIndex];
  const progressoProva = ((currentQuestaoIndex + 1) / questoes.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-base px-3 py-1">
            Questão {currentQuestaoIndex + 1} de {questoes.length}
          </Badge>
          <div className={`flex items-center gap-2 font-mono text-xl ${getTempoColor()}`}>
            <Clock className="h-5 w-5" />
            {formatarTempo(tempoRestante)}
          </div>
        </div>
        <Progress value={progressoProva} className="mt-3" />
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <p className="text-lg font-medium leading-relaxed">
            {questaoAtual.pergunta}
          </p>
        </div>

        <RadioGroup
          value={respostas[questaoAtual.id] || ""}
          onValueChange={(value) => handleSelecionarResposta(questaoAtual.id, value)}
          className="space-y-3"
        >
          {questaoAtual.opcoes.map((opcao, index) => {
            const letra = opcao.letra || String.fromCharCode(65 + index);
            return (
              <div 
                key={index} 
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                  respostas[questaoAtual.id] === opcao.texto 
                    ? "border-primary bg-primary/5" 
                    : "border-border"
                }`}
                onClick={() => handleSelecionarResposta(questaoAtual.id, opcao.texto)}
              >
                <RadioGroupItem value={opcao.texto} id={`opcao-${index}`} />
                <Label 
                  htmlFor={`opcao-${index}`} 
                  className="flex-1 cursor-pointer text-base"
                >
                  <span className="font-bold mr-2 text-primary">
                    {letra})
                  </span>
                  {opcao.texto}
                </Label>
              </div>
            );
          })}
        </RadioGroup>

        <div className="flex justify-end pt-4">
          <Button 
            size="lg"
            onClick={() => handleProximaQuestao(false)}
            disabled={!respostas[questaoAtual.id]}
          >
            {currentQuestaoIndex >= questoes.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalizar Prova
              </>
            ) : (
              <>
                Próxima Questão
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          ⚠️ Não é possível voltar para questões anteriores
        </p>
      </CardContent>
    </Card>
  );
};
