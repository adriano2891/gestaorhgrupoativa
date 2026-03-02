import { useState, useRef } from "react";
import { ArrowLeft, Save, Eye, Download, Plus, GripVertical, Trash2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HRFlowForm, FormField, HRFlowFieldType, FIELD_TYPE_LABELS, CATEGORY_LABELS, FormCategory, WIDTH_OPTIONS } from "@/types/hrflow";
import { FormTemplate } from "@/types/hrflow";
import { cn } from "@/lib/utils";

interface HRFlowFormBuilderProps {
  form?: HRFlowForm | null;
  template?: FormTemplate | null;
  onClose: () => void;
  readOnly?: boolean;
}

const defaultField: Omit<FormField, 'id'> = {
  type: 'text',
  label: 'Novo Campo',
  required: false,
};

export const HRFlowFormBuilder = ({ form, template, onClose, readOnly = false }: HRFlowFormBuilderProps) => {
  const [title, setTitle] = useState(form?.title || template?.title || 'Novo Formulário');
  const [description, setDescription] = useState(form?.description || template?.description || '');
  const [category, setCategory] = useState<FormCategory>(form?.category || template?.category as FormCategory || 'outros');
  const [fields, setFields] = useState<FormField[]>(form?.fields || template?.fields || []);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const addField = (type: HRFlowFieldType) => {
    const newField: FormField = {
      ...defaultField,
      id: `field_${Date.now()}`,
      type,
      label: FIELD_TYPE_LABELS[type],
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Add a slight delay to allow the drag image to be created
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);
    
    setFields(newFields);
    setDraggedIndex(null);
    setDragOverIndex(null);
    toast.success("Campo reordenado!");
  };

  const handleSave = () => {
    toast.success("Formulário salvo com sucesso!");
    onClose();
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = title;
    window.print();
    document.title = originalTitle;
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  return (
    <div className="animate-fade-in">
      {/* Header - hidden on print */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Editor de Formulário</h1>
            <p className="text-sm text-muted-foreground">Arraste campos para organizar</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button className="bg-primary hover:bg-primary-dark text-primary-foreground" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Field Palette - hidden on print */}
        <div className="col-span-3 no-print">
          <Card className="border-0 shadow-sm sticky top-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3">Campos</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FIELD_TYPE_LABELS) as HRFlowFieldType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => addField(type)}
                    className="p-2 text-xs text-left bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-colors border border-transparent hover:border-primary/20"
                  >
                    {FIELD_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas (A4 Preview) - 210mm x 297mm */}
        <div className="col-span-6 print:col-span-12">
          <div className="flex justify-center">
            <Card className="a4-canvas print-container border shadow-lg bg-white w-[210mm] min-h-[297mm] print:shadow-none print:border-0 print:w-full">
              <CardContent className="p-[20mm] print:p-0">
                {/* Form Header */}
                <div className="mb-6 pb-6 border-b border-border print-title">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold border-0 p-0 focus-visible:ring-0 mb-2 bg-transparent print:border-0"
                    placeholder="Título do Formulário"
                  />
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-0 p-0 resize-none focus-visible:ring-0 text-muted-foreground bg-transparent print:border-0"
                    placeholder="Descrição do formulário..."
                    rows={2}
                  />
                </div>

                {/* Fields */}
                {fields.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground no-print">
                    <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Clique nos campos à esquerda para adicionar</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {fields.map((field, index) => {
                      const w = field.width || 100;
                      const widthClass = w === 100 ? 'w-full' 
                        : w === 50 ? 'w-full sm:w-[calc(50%-0.5rem)]' 
                        : w === 33 ? 'w-full sm:w-[calc(33.333%-0.667rem)]' 
                        : 'w-full sm:w-[calc(25%-0.75rem)]';
                      return (
                      <div
                        key={field.id}
                        className={widthClass}
                      >
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all cursor-pointer print-field print:border print:border-border print:rounded-none print:cursor-default",
                          selectedFieldId === field.id
                            ? 'border-primary bg-primary/5'
                            : 'border-transparent hover:border-border bg-muted/50',
                          draggedIndex === index && 'opacity-50',
                          dragOverIndex === index && draggedIndex !== index && 'border-primary border-dashed'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-muted transition-colors no-print"
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-foreground">{field.label}</span>
                              {field.required && <Badge variant="destructive" className="text-xs">*</Badge>}
                            </div>
                            <Badge variant="secondary" className="text-xs no-print">
                              {FIELD_TYPE_LABELS[field.type]}
                            </Badge>
                            {/* Print-friendly input representation */}
                            <div className="hidden print:block mt-2">
                              {field.type === 'textarea' ? (
                                <div className="print-input min-h-[60pt] border border-border rounded" />
                              ) : field.type === 'checkbox' || field.type === 'radio' ? (
                                <div className="space-y-1">
                                  {(field.options || ['Opção 1', 'Opção 2']).map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <div className="print-checkbox w-3 h-3 border border-foreground rounded-sm" />
                                      <span className="text-sm">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : field.type === 'signature' ? (
                                <div className="print-signature border-b border-foreground h-[40pt] mt-4" />
                              ) : (
                                <div className="print-input h-[24pt] border border-border rounded" />
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive no-print"
                            onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Properties Panel - hidden on print */}
        <div className="col-span-3 no-print">
          <Card className="border-0 shadow-sm sticky top-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Propriedades
              </h3>

              {selectedField ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Rótulo</Label>
                    <Input
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={selectedField.placeholder || ''}
                      onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                    <div className="flex items-center justify-between">
                     <Label className="text-xs">Obrigatório</Label>
                     <Switch
                       checked={selectedField.required}
                       onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                     />
                   </div>
                   <div>
                     <Label className="text-xs">Largura</Label>
                     <Select 
                       value={String(selectedField.width || 100)} 
                       onValueChange={(v) => updateField(selectedField.id, { width: parseInt(v) })}
                     >
                       <SelectTrigger className="mt-1">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {WIDTH_OPTIONS.map(opt => (
                           <SelectItem key={opt.value} value={String(opt.value)}>
                             {opt.label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                  {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                    <div>
                      <Label className="text-xs">Opções (uma por linha)</Label>
                      <Textarea
                        value={selectedField.options?.join('\n') || ''}
                        onChange={(e) => updateField(selectedField.id, { options: e.target.value.split('\n').filter(Boolean) })}
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Selecione um campo para editar suas propriedades
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-border">
                <Label className="text-xs">Categoria</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as FormCategory)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
