import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useHolerites } from "@/hooks/useHolerites";
import { useEnviarHolerite } from "@/hooks/useLogsEnvioHolerites";

interface SendHoleriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: {
    id: string;
    nome: string;
    email?: string;
  };
}

export const SendHoleriteDialog = ({ open, onOpenChange, employee }: SendHoleriteDialogProps) => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  const { data: holerites, isLoading: loadingHolerites } = useHolerites(employee.id);
  const enviarHolerite = useEnviarHolerite();

  const handleSend = async () => {
    if (!selectedMonth || !selectedYear) {
      return;
    }

    const holerite = holerites?.find(
      (h) => h.mes === parseInt(selectedMonth) && h.ano === parseInt(selectedYear)
    );

    if (!holerite) {
      return;
    }

    await enviarHolerite.mutateAsync({
      holerite_id: holerite.id,
      user_id: employee.id,
    });

    onOpenChange(false);
  };

  // Extrair meses e anos disponíveis
  const availableMonths = Array.from(new Set(holerites?.map((h) => h.mes) || [])).sort((a, b) => b - a);
  const availableYears = Array.from(new Set(holerites?.map((h) => h.ano) || [])).sort((a, b) => b - a);

  const getMesNome = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes - 1];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Holerite por E-mail</DialogTitle>
          <DialogDescription>
            Selecione o mês e ano do holerite que deseja enviar para {employee.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!employee.email && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm text-destructive">
              ⚠️ Este colaborador não possui e-mail cadastrado. Atualize o cadastro antes de enviar.
            </div>
          )}

          {loadingHolerites ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : holerites && holerites.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Mês</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!selectedYear}>
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths
                      .filter((month) =>
                        holerites.some((h) => h.mes === month && h.ano === parseInt(selectedYear))
                      )
                      .map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMesNome(month)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMonth && selectedYear && (
                <div className="bg-muted rounded-md p-3 text-sm">
                  <p className="font-medium mb-1">Detalhes do envio:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Será enviado para: <strong>{employee.email || "E-mail não cadastrado"}</strong></li>
                    <li>• O PDF será protegido com os 6 primeiros dígitos do CPF</li>
                    <li>• O envio será registrado no histórico</li>
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum holerite encontrado para este colaborador.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              !employee.email ||
              !selectedMonth ||
              !selectedYear ||
              enviarHolerite.isPending ||
              loadingHolerites
            }
          >
            {enviarHolerite.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar E-mail
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
