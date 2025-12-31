import { useState } from "react";
import { Upload, Palette, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const defaultColors = [
  '#2563eb', '#1d4ed8', '#7c3aed', '#059669', 
  '#dc2626', '#ea580c', '#0891b2', '#4f46e5'
];

export const HRFlowSettings = () => {
  const [branding, setBranding] = useState({
    companyName: 'GRUPO ATIVA',
    logo: '',
    primaryColor: '#2563eb',
    showLgpdBadge: true,
    requireSignature: false
  });

  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Personalize a aparência dos seus formulários</p>
      </div>

      {/* Branding */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Identidade Visual</CardTitle>
          <CardDescription>Configure a marca que aparecerá nos formulários públicos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">Nome da Empresa</Label>
            <Input
              id="companyName"
              value={branding.companyName}
              onChange={(e) => setBranding({ ...branding, companyName: e.target.value })}
              placeholder="Nome da sua empresa"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                {branding.logo ? (
                  <img src={branding.logo} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB</p>
              </div>
            </div>
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label>Cor Primária</Label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBranding({ ...branding, primaryColor: color })}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      branding.primaryColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-400" />
                <Input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-12 h-8 p-0 border-0"
                />
                <span className="text-sm text-gray-500 font-mono">{branding.primaryColor}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Compliance e Segurança</CardTitle>
          <CardDescription>Configure opções de conformidade legal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Selo LGPD</p>
              <p className="text-sm text-gray-500">Exibir selo de conformidade com a LGPD nos formulários</p>
            </div>
            <Switch
              checked={branding.showLgpdBadge}
              onCheckedChange={(checked) => setBranding({ ...branding, showLgpdBadge: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Assinatura Obrigatória</p>
              <p className="text-sm text-gray-500">Exigir assinatura digital em todos os formulários</p>
            </div>
            <Switch
              checked={branding.requireSignature}
              onCheckedChange={(checked) => setBranding({ ...branding, requireSignature: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Visualize como seus formulários aparecerão</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-xl border-2 border-dashed"
            style={{ borderColor: branding.primaryColor + '40' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {branding.companyName.charAt(0)}
              </div>
              <span className="font-semibold text-gray-900">{branding.companyName}</span>
            </div>
            <div className="h-2 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-2 w-1/2 bg-gray-200 rounded mb-4" />
            <div 
              className="h-10 w-32 rounded-lg flex items-center justify-center text-white text-sm"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Enviar
            </div>
            {branding.showLgpdBadge && (
              <div className="mt-4 flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg w-fit">
                <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white">✓</span>
                Conformidade LGPD
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-[#2563eb] hover:bg-[#1d4ed8]">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};
