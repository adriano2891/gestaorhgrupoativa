import { useState } from "react";
import { Sparkles, Wand2, Loader2, FileText, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FIELD_TYPE_LABELS } from "@/types/hrflow";

interface AIGeneratedForm {
  title: string;
  description: string;
  fields: FormField[];
}

const examplePrompts = [
  "Pesquisa de satisfação pós-treinamento de vendas",
  "Formulário de avaliação de desempenho trimestral",
  "Pesquisa de clima organizacional focada em bem-estar",
  "Checklist de onboarding para área de tecnologia",
  "Entrevista de desligamento com foco em retenção"
];

export const HRFlowAI = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedForm, setGeneratedForm] = useState<AIGeneratedForm | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Digite uma descrição para o formulário");
      return;
    }

    setIsGenerating(true);
    setGeneratedForm(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-hrflow-form', {
        body: { prompt }
      });

      if (error) throw error;

      if (data?.form) {
        setGeneratedForm(data.form);
        toast.success("Formulário gerado com sucesso!");
      }
    } catch (error) {
      console.error("Error generating form:", error);
      toast.error("Erro ao gerar formulário. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJSON = () => {
    if (generatedForm) {
      navigator.clipboard.writeText(JSON.stringify(generatedForm, null, 2));
      setCopied(true);
      toast.success("JSON copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">Criar com IA</h1>
        </div>
        <p className="text-amber-100">
          Descreva o objetivo do seu formulário e deixe a IA criar a estrutura completa para você
        </p>
      </div>

      {/* Input Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">Descreva seu formulário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ex: Crie uma pesquisa de satisfação para avaliar o treinamento de liderança, incluindo perguntas sobre conteúdo, instrutor e aplicabilidade..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 resize-none"
          />
          
          {/* Example Prompts */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Ou tente um destes exemplos:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando formulário...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Gerar Formulário com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-gray-600">A IA está criando seu formulário...</p>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Form Preview */}
      {generatedForm && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Formulário Gerado</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyJSON}>
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? 'Copiado!' : 'Copiar JSON'}
                </Button>
                <Button size="sm" className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  <FileText className="w-4 h-4 mr-1" />
                  Usar Template
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Form Header */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 text-lg">{generatedForm.title}</h3>
                <p className="text-gray-600 mt-1">{generatedForm.description}</p>
              </div>

              {/* Fields Preview */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Campos gerados ({generatedForm.fields.length})
                </p>
                {generatedForm.fields.map((field, index) => (
                  <div 
                    key={field.id || index} 
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <span className="w-6 h-6 bg-[#2563eb] text-white rounded text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{field.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {FIELD_TYPE_LABELS[field.type] || field.type}
                        </Badge>
                        {field.required && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Obrigatório</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
