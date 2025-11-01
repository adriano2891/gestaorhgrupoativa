import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock } from "lucide-react";

interface TabelaPontoDiaProps {
  registro: any;
  loading: boolean;
}

export const TabelaPontoDia = ({ registro, loading }: TabelaPontoDiaProps) => {
  const formatHora = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return "-";
    
    const matches = interval.match(/(\d+):(\d+):(\d+)/);
    if (!matches) return interval;
    
    const hours = parseInt(matches[1]);
    const minutes = parseInt(matches[2]);
    
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Registro de Hoje</CardTitle>
        </div>
        <CardDescription>
          Horários registrados no dia atual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Entrada</TableHead>
                <TableHead className="whitespace-nowrap">Saída P1</TableHead>
                <TableHead className="whitespace-nowrap">Retorno P1</TableHead>
                <TableHead className="whitespace-nowrap">Saída Almoço</TableHead>
                <TableHead className="whitespace-nowrap">Retorno Almoço</TableHead>
                <TableHead className="whitespace-nowrap">Saída P2</TableHead>
                <TableHead className="whitespace-nowrap">Retorno P2</TableHead>
                <TableHead className="whitespace-nowrap">Saída</TableHead>
                <TableHead className="whitespace-nowrap">Início HE</TableHead>
                <TableHead className="whitespace-nowrap">Fim HE</TableHead>
                <TableHead className="whitespace-nowrap font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  {formatHora(registro?.entrada)}
                </TableCell>
                <TableCell>{formatHora(registro?.saida_pausa_1)}</TableCell>
                <TableCell>{formatHora(registro?.retorno_pausa_1)}</TableCell>
                <TableCell>{formatHora(registro?.saida_almoco)}</TableCell>
                <TableCell>{formatHora(registro?.retorno_almoco)}</TableCell>
                <TableCell>{formatHora(registro?.saida_pausa_2)}</TableCell>
                <TableCell>{formatHora(registro?.retorno_pausa_2)}</TableCell>
                <TableCell className="font-medium">
                  {formatHora(registro?.saida)}
                </TableCell>
                <TableCell>{formatHora(registro?.inicio_he)}</TableCell>
                <TableCell>{formatHora(registro?.fim_he)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="default" className="font-bold">
                      {formatInterval(registro?.total_horas)}
                    </Badge>
                    {registro?.horas_extras && registro.horas_extras !== "00:00:00" && (
                      <Badge variant="secondary" className="block w-fit">
                        HE: {formatInterval(registro.horas_extras)}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {!registro && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum registro de ponto para hoje. Clique em "Entrada" para começar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
