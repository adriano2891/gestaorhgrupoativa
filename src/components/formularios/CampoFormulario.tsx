import { useState } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUpdateFormularioCampo } from "@/hooks/useFormulariosRH";
import { FIELD_TYPE_LABELS, LARGURA_OPTIONS, type FormularioCampo } from "@/types/formularios";

interface CampoFormularioProps {
  campo: FormularioCampo;
  onDelete: () => void;
}

export const CampoFormulario = ({ campo, onDelete }: CampoFormularioProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState(campo.label);
  const [placeholder, setPlaceholder] = useState(campo.placeholder || "");
  const [opcoes, setOpcoes] = useState(campo.opcoes?.join("\n") || "");
  
  const updateCampo = useUpdateFormularioCampo();

  const handleSave = () => {
    updateCampo.mutate({
      id: campo.id,
      formulario_id: campo.formulario_id,
      label,
      placeholder: placeholder || null,
      opcoes: campo.tipo === 'select' ? opcoes.split("\n").filter(o => o.trim()) : null,
    });
  };

  const handleToggleObrigatorio = (checked: boolean) => {
    updateCampo.mutate({
      id: campo.id,
      formulario_id: campo.formulario_id,
      obrigatorio: checked,
    });
  };

  const handleLarguraChange = (value: string) => {
    updateCampo.mutate({
      id: campo.id,
      formulario_id: campo.formulario_id,
      largura: parseInt(value),
    });
  };

  const currentLargura = campo.largura || 100;

  return (
    <Card className="group">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={handleSave}
                  className="font-medium border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                  placeholder="Nome do campo"
                />
                {campo.obrigatorio && (
                  <span className="text-destructive">*</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {FIELD_TYPE_LABELS[campo.tipo]}
                </Badge>
                {currentLargura < 100 && (
                  <Badge variant="outline" className="text-xs">
                    {currentLargura}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CollapsibleContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Texto de exemplo..."
                />
              </div>
              <div>
                <Label>Largura</Label>
                <Select value={String(currentLargura)} onValueChange={handleLarguraChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LARGURA_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <Label>Obrigatório</Label>
                <Switch
                  checked={campo.obrigatorio}
                  onCheckedChange={handleToggleObrigatorio}
                />
              </div>
            </div>

            {campo.tipo === 'select' && (
              <div>
                <Label>Opções (uma por linha)</Label>
                <Textarea
                  value={opcoes}
                  onChange={(e) => setOpcoes(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                  className="min-h-[100px]"
                />
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};