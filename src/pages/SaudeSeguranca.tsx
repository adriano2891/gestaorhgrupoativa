import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/ui/back-button";
import { Shield, Stethoscope, HardHat, AlertTriangle, Users, HeartPulse, FileCheck } from "lucide-react";
import { ASOTab } from "@/components/sst/ASOTab";
import { EPITab } from "@/components/sst/EPITab";
import { CATTab } from "@/components/sst/CATTab";
import { CIPATab } from "@/components/sst/CIPATab";
import { AfastamentosTab } from "@/components/sst/AfastamentosTab";
import { AlertasVencimentoSST } from "@/components/sst/AlertasVencimentoSST";
import { DocumentosSSTValidadeCard } from "@/components/sst/DocumentosSSTValidadeCard";

const SaudeSeguranca = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton to="/gestao-rh" />
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Saúde e Segurança do Trabalho</h1>
            <p className="text-sm text-muted-foreground">NR-5 (CIPA) · NR-6 (EPI) · NR-7 (ASO/PCMSO) · Lei 8.213/91 (CAT) · Afastamentos</p>
          </div>
        </div>
      </div>

      <AlertasVencimentoSST />
      <DocumentosSSTValidadeCard />

      <Tabs defaultValue="aso" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="aso" className="gap-1 text-xs sm:text-sm">
            <Stethoscope className="h-4 w-4" />
            <span className="hidden sm:inline">ASO</span>
            <span className="sm:hidden">ASO</span>
          </TabsTrigger>
          <TabsTrigger value="epi" className="gap-1 text-xs sm:text-sm">
            <HardHat className="h-4 w-4" />
            <span className="hidden sm:inline">EPI</span>
            <span className="sm:hidden">EPI</span>
          </TabsTrigger>
          <TabsTrigger value="cat" className="gap-1 text-xs sm:text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">CAT</span>
            <span className="sm:hidden">CAT</span>
          </TabsTrigger>
          <TabsTrigger value="cipa" className="gap-1 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">CIPA</span>
            <span className="sm:hidden">CIPA</span>
          </TabsTrigger>
          <TabsTrigger value="afastamentos" className="gap-1 text-xs sm:text-sm">
            <HeartPulse className="h-4 w-4" />
            <span className="hidden sm:inline">Afastamentos</span>
            <span className="sm:hidden">Afast.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aso"><ASOTab /></TabsContent>
        <TabsContent value="epi"><EPITab /></TabsContent>
        <TabsContent value="cat"><CATTab /></TabsContent>
        <TabsContent value="cipa"><CIPATab /></TabsContent>
        <TabsContent value="afastamentos"><AfastamentosTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SaudeSeguranca;
