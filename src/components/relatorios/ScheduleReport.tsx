import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail } from "lucide-react";

interface ScheduleReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportTitle: string;
}

export const ScheduleReport = ({ open, onOpenChange, reportTitle }: ScheduleReportProps) => {
  const { toast } = useToast();
  const [frequency, setFrequency] = useState("daily");
  const [nextRun, setNextRun] = useState("");
  const [recipients, setRecipients] = useState("");

  const handleSchedule = () => {
    // Salvar no localStorage
    const schedules = JSON.parse(localStorage.getItem('scheduledReports') || '[]');
    schedules.push({
      id: Date.now(),
      reportTitle,
      frequency,
      nextRun,
      recipients: recipients.split(',').map(e => e.trim()),
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('scheduledReports', JSON.stringify(schedules));

    toast({
      title: "Relatório agendado",
      description: `O relatório será gerado ${getFrequencyText(frequency)}`,
    });

    onOpenChange(false);
  };

  const getFrequencyText = (freq: string) => {
    const texts: Record<string, string> = {
      daily: "diariamente",
      weekly: "semanalmente",
      monthly: "mensalmente",
      quarterly: "trimestralmente"
    };
    return texts[freq] || freq;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Agendar Relatório
          </DialogTitle>
          <DialogDescription>
            Configure o agendamento automático para: {reportTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequência</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="next-run">Próxima Execução</Label>
            <Input
              id="next-run"
              type="datetime-local"
              value={nextRun}
              onChange={(e) => setNextRun(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipients" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Destinatários
            </Label>
            <Input
              id="recipients"
              placeholder="email1@empresa.com, email2@empresa.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separe múltiplos emails com vírgula
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule}>
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
