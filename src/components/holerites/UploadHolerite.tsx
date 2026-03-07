import { useState } from "react";
import { Upload, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUploadHolerite } from "@/hooks/useHoleritesMutation";

interface UploadHoleriteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Array<{ id: string; name: string }>;
  onUploadSuccess?: () => void;
}

const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const currentYear = new Date().getFullYear();
// Art. 11 CLT: prazo prescricional de 5 anos
const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

export const UploadHolerite = ({
  open,
  onOpenChange,
  employees,
  onUploadSuccess,
}: UploadHoleriteProps) => {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [file, setFile] = useState<File | null>(null);
  const [showCltFields, setShowCltFields] = useState(false);
  
  // CLT fields
  const [inss, setInss] = useState("");
  const [irrf, setIrrf] = useState("");
  const [fgts, setFgts] = useState("");
  const [baseCalculoInss, setBaseCalculoInss] = useState("");
  const [baseCalculoIrrf, setBaseCalculoIrrf] = useState("");
  const [horasExtrasValor, setHorasExtrasValor] = useState("");
  const [adicionalNoturnoValor, setAdicionalNoturnoValor] = useState("");
  const [valeTransporte, setValeTransporte] = useState("");
  const [outrosProventos, setOutrosProventos] = useState("");
  const [outrosDescontos, setOutrosDescontos] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { toast } = useToast();
  const uploadHolerite = useUploadHolerite();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive",
        });
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const resetForm = () => {
    setSelectedEmployee("");
    setSelectedMonth("");
    setFile(null);
    setInss(""); setIrrf(""); setFgts("");
    setBaseCalculoInss(""); setBaseCalculoIrrf("");
    setHorasExtrasValor(""); setAdicionalNoturnoValor("");
    setValeTransporte(""); setOutrosProventos(""); setOutrosDescontos("");
    setObservacoes("");
    setShowCltFields(false);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedMonth || !file) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos e selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadHolerite.mutateAsync({
        userId: selectedEmployee,
        mes: parseInt(selectedMonth),
        ano: parseInt(selectedYear),
        file,
        // CLT extras
        inss: parseFloat(inss) || undefined,
        irrf: parseFloat(irrf) || undefined,
        fgts: parseFloat(fgts) || undefined,
        baseCalculoInss: parseFloat(baseCalculoInss) || undefined,
        baseCalculoIrrf: parseFloat(baseCalculoIrrf) || undefined,
        horasExtrasValor: parseFloat(horasExtrasValor) || undefined,
        adicionalNoturnoValor: parseFloat(adicionalNoturnoValor) || undefined,
        valeTransporte: parseFloat(valeTransporte) || undefined,
        outrosProventos: parseFloat(outrosProventos) || undefined,
        outrosDescontos: parseFloat(outrosDescontos) || undefined,
        observacoes: observacoes || undefined,
      });
      
      resetForm();
      onOpenChange(false);
      onUploadSuccess?.();
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Holerite</DialogTitle>
          <DialogDescription>
            Faça o upload do holerite em formato PDF para um funcionário específico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Funcionário</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={String(index + 1)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("file")?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {file ? file.name : "Selecionar arquivo PDF"}
              </Button>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tamanho máximo: 5MB. Formato: PDF
            </p>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploadHolerite.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={uploadHolerite.isPending}>
            {uploadHolerite.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Holerite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
