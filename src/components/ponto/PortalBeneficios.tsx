import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Gift } from "lucide-react";
import { PortalBackground } from "./PortalBackground";
import { usePortalAuth } from "./PortalAuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface PortalBeneficiosProps {
  onBack: () => void;
}

const tipoLabels: Record<string, string> = {
  vale_transporte: "Vale-Transporte",
  vale_alimentacao: "Vale-Alimentação",
  vale_refeicao: "Vale-Refeição",
  plano_saude: "Plano de Saúde",
  plano_odontologico: "Plano Odontológico",
};

const isPlanoType = (tipo: string) => tipo === "plano_saude" || tipo === "plano_odontologico";

interface Beneficio {
  id: string;
  tipo: string;
  valor: number;
  desconto_percentual: number | null;
  observacoes: string | null;
  ativo: boolean;
  data_inicio: string;
}

export const PortalBeneficios = ({ onBack }: PortalBeneficiosProps) => {
  const { user } = usePortalAuth();
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("beneficios_funcionario")
          .select("*")
          .eq("user_id", user.id)
          .eq("ativo", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBeneficios(data || []);
      } catch (e) {
        console.error("Erro ao carregar benefícios:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  return (
    <PortalBackground>
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Benefícios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Consulte seus benefícios ativos
              </p>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : beneficios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum benefício cadastrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {beneficios.map((b) => (
                    <Card key={b.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-lg">
                              {tipoLabels[b.tipo] || b.tipo}
                            </p>
                            {isPlanoType(b.tipo) ? (
                              b.observacoes && (
                                <p className="text-sm text-muted-foreground">
                                  Plano: {b.observacoes}
                                </p>
                              )
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                R$ {b.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                {b.desconto_percentual ? ` · Desconto: ${b.desconto_percentual}%` : ""}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-0">
                            Ativo
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalBackground>
  );
};
