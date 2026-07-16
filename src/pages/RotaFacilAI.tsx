import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Camera,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CloudRain,
  DollarSign,
  FileSpreadsheet,
  Fingerprint,
  Fuel,
  Gauge,
  Headphones,
  Import,
  LocateFixed,
  Map,
  MessageCircle,
  Navigation,
  PackageCheck,
  PanelsTopLeft,
  QrCode,
  RadioTower,
  Route,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Truck,
  Upload,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const defaultAddresses = `Maria Souza - Rua Augusta, 1500 - Consolação - Pedido #8491 - 11 98888-1010
João Lima - Av. Paulista, 900 - Bela Vista - Pedido #8492 - 11 97777-2020
Mercado Bom Preço - Rua Vergueiro, 2300 - Vila Mariana - Pedido #8493
Ana Pereira - Rua Heitor Penteado, 1188 - Pinheiros - Prioridade alta
Clínica Centro - Av. Ibirapuera, 3103 - Moema - Entregar até 15h`;

const routeSeed = [
  { eta: "09:18", distance: "2,1 km", status: "Prioridade", savings: "-6 min" },
  { eta: "09:37", distance: "3,4 km", status: "Em rota", savings: "-4 min" },
  { eta: "10:05", distance: "5,0 km", status: "Pendente", savings: "-9 min" },
  { eta: "10:42", distance: "6,8 km", status: "Pendente", savings: "-7 min" },
  { eta: "11:16", distance: "4,9 km", status: "Agendado", savings: "-5 min" },
];

const capabilities = [
  { icon: Import, title: "Importação inteligente", text: "Excel, CSV, copiar/colar e foto de listas impressas com OCR para criar entregas automaticamente." },
  { icon: Route, title: "Otimização em 1 clique", text: "GPS atual, Google Directions, trânsito, prioridades, janelas de horário e restrições do veículo." },
  { icon: Bot, title: "IA operacional", text: "Gemini/OpenAI para detectar endereços, limpar planilhas, reagrupar entregas e sugerir nova sequência." },
  { icon: PackageCheck, title: "Comprovantes completos", text: "Foto, assinatura digital, recebedor, observações, horário, GPS e evidências de cliente ausente." },
  { icon: MessageCircle, title: "WhatsApp automático", text: "Mensagens personalizáveis: saiu para entrega, entregador próximo, concluída ou reagendada." },
  { icon: BarChart3, title: "Financeiro e rentabilidade", text: "Receita, combustível, pedágios, manutenção, lucro líquido e gráficos diários, semanais e mensais." },
];

const dayStats = [
  { label: "Pendentes", value: "18", icon: Clock3 },
  { label: "Concluídas", value: "42", icon: CheckCircle2 },
  { label: "Distância", value: "86 km", icon: Gauge },
  { label: "Economia", value: "R$ 74", icon: Fuel },
];

const financeStats = [
  { label: "Faturamento do dia", value: "R$ 612,00" },
  { label: "Gastos estimados", value: "R$ 138,50" },
  { label: "Lucro líquido", value: "R$ 473,50" },
];

const operatingModes = [
  { icon: Truck, title: "Modo Transportadora", text: "Múltiplos motoristas, distribuição automática, equipes e monitoramento em tempo real." },
  { icon: Car, title: "Modo Marketplace", text: "Importa planilhas de marketplaces, detecta pedido, cliente, endereço e cria rotas instantâneas." },
  { icon: Headphones, title: "Modo Técnico Externo", text: "Troca entrega por atendimento para internet, assistência, instalações e manutenção de campo." },
];

const plans = [
  { name: "Gratuito", price: "R$ 0", perks: ["20 entregas por rota", "Histórico de 7 dias", "Otimização básica", "PWA Web"] },
  { name: "Profissional", price: "R$ 49", featured: true, perks: ["Rotas ilimitadas", "IA avançada", "OCR de etiquetas", "Financeiro e relatórios"] },
  { name: "Empresa", price: "Sob consulta", perks: ["Multiusuários", "Painel web admin", "API", "Gestão de equipes"] },
];

const architecture = ["Flutter Android/iOS/Web", "Firebase Authentication", "Cloud Firestore", "Cloud Functions", "Google Maps SDK", "Directions + Places APIs", "Riverpod", "Clean Architecture"];

type Stop = {
  name: string;
  address: string;
  eta: string;
  distance: string;
  status: string;
  savings: string;
};

const parseStops = (raw: string): Stop[] => {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [namePart, ...addressParts] = line.split(" - ");
    const seed = routeSeed[index % routeSeed.length];
    return {
      name: namePart || `Entrega ${index + 1}`,
      address: addressParts.join(" · ") || line,
      ...seed,
    };
  });
};

const RotaFacilAI = () => {
  const [addressList, setAddressList] = useState(defaultAddresses);
  const [optimized, setOptimized] = useState(false);
  const stops = useMemo(() => parseStops(addressList), [addressList]);
  const optimizedStops = optimized
    ? [...stops].sort((a, b) => {
        const priorityA = a.status === "Prioridade" ? -1 : 1;
        const priorityB = b.status === "Prioridade" ? -1 : 1;
        return priorityA - priorityB || a.distance.localeCompare(b.distance);
      })
    : stops;

  const totalStops = optimizedStops.length;
  const progress = optimized ? 82 : 34;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative border-b border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.35),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_32%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)]">
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <nav className="mb-12 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400 text-slate-950 shadow-2xl shadow-teal-400/30">
                  <Route className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-lg font-black tracking-tight">Rota Fácil AI</p>
                  <p className="text-xs uppercase tracking-[0.28em] text-teal-200">Logística inteligente</p>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm text-slate-200 backdrop-blur md:flex">
                <span className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950">Web</span>
                <span className="px-4 py-2">Android</span>
                <span className="px-4 py-2">iOS</span>
              </div>
            </nav>

            <Badge className="mb-6 w-fit border-teal-300/40 bg-teal-300/10 px-4 py-2 text-teal-100 hover:bg-teal-300/10">
              <Sparkles className="mr-2 h-4 w-4" /> Rota automática em 1 clique, pronta em menos de 30 segundos
            </Badge>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
              Transforme endereços soltos em rotas lucrativas com IA.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Um SaaS profissional para entregadores autônomos, motoboys, motoristas, transportadoras, distribuidores,
              técnicos externos e operações brasileiras que precisam reduzir tempo, combustível e custo por entrega.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-14 rounded-2xl bg-teal-400 px-8 text-base font-bold text-slate-950 hover:bg-teal-300" onClick={() => setOptimized(true)}>
                <Zap className="mr-2 h-5 w-5" /> Otimizar rota agora
              </Button>
              <Button size="lg" variant="outline" className="h-14 rounded-2xl border-white/20 bg-white/10 px-8 text-base font-bold text-white hover:bg-white/20 hover:text-white">
                <PanelsTopLeft className="mr-2 h-5 w-5" /> Ver painel web admin
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {dayStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                  <Icon className="mb-3 h-5 w-5 text-teal-200" />
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px] lg:max-w-none">
            <div className="absolute -left-8 top-12 hidden rounded-3xl border border-emerald-300/30 bg-emerald-300/15 p-4 shadow-2xl backdrop-blur xl:block">
              <p className="text-sm font-semibold text-emerald-100">Economia prevista</p>
              <p className="text-3xl font-black">18 min</p>
            </div>
            <Card className="border-white/10 bg-slate-900/80 text-white shadow-2xl shadow-teal-950/40 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">Central de rota</CardTitle>
                    <CardDescription className="text-slate-300">Cole, importe, otimize e navegue.</CardDescription>
                  </div>
                  <Badge className="bg-emerald-400 text-emerald-950 hover:bg-emerald-400"><RadioTower className="mr-1 h-3 w-3" />Ao vivo</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <Textarea
                  value={addressList}
                  onChange={(event) => setAddressList(event.target.value)}
                  className="min-h-40 resize-none rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-400"
                  placeholder="Cole aqui nomes, endereços, telefones e pedidos..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel/CSV
                  </Button>
                  <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                    <Camera className="mr-2 h-4 w-4" /> OCR etiqueta
                  </Button>
                </div>
                <Button className="h-14 w-full rounded-2xl bg-teal-400 py-6 text-base font-black text-slate-950 hover:bg-teal-300" onClick={() => setOptimized(true)}>
                  <LocateFixed className="mr-2 h-5 w-5" /> Otimizar Rota ({totalStops} paradas)
                </Button>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-slate-300">Processo em 30 segundos</span>
                    <span className="font-bold text-teal-200">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[.78fr_1.22fr] lg:px-8">
        <Card className="border-white/10 bg-white/[0.04] text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-teal-300" /> Mapa interativo</CardTitle>
            <CardDescription className="text-slate-300">Simulação de Google Maps SDK com entregas numeradas, rota, risco e clima.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,184,166,.12),transparent_45%),radial-gradient(circle_at_65%_20%,rgba(250,204,21,.18),transparent_20%),radial-gradient(circle_at_25%_78%,rgba(59,130,246,.18),transparent_24%)]" />
              <div className="absolute inset-6 rounded-[1.5rem] border border-dashed border-white/10" />
              <div className="absolute left-[17%] top-[18%] h-[64%] w-[58%] rotate-12 rounded-full border-[10px] border-teal-300/70 border-l-transparent border-t-transparent" />
              <div className="absolute left-[18%] top-[18%] rounded-2xl bg-teal-400 px-3 py-2 font-black text-slate-950 shadow-lg">Você</div>
              {optimizedStops.slice(0, 5).map((stop, index) => (
                <div
                  key={`${stop.name}-${index}`}
                  className="absolute flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-950 bg-white font-black text-slate-950 shadow-2xl"
                  style={{ left: `${30 + (index % 2) * 34 + index * 3}%`, top: `${24 + index * 12}%` }}
                >
                  {index + 1}
                </div>
              ))}
              <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/10 bg-slate-950/85 p-4 backdrop-blur">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="text-xl font-black">22,2 km</p><p className="text-xs text-slate-400">Distância</p></div>
                  <div><p className="text-xl font-black">1h58</p><p className="text-xs text-slate-400">Tempo total</p></div>
                  <div><p className="text-xl font-black">R$ 31</p><p className="text-xs text-slate-400">Combustível</p></div>
                </div>
              </div>
              <Badge className="absolute right-5 top-5 bg-amber-300 text-amber-950 hover:bg-amber-300"><ShieldAlert className="mr-1 h-3 w-3" /> Área de risco</Badge>
              <Badge className="absolute right-5 top-16 bg-sky-300 text-sky-950 hover:bg-sky-300"><CloudRain className="mr-1 h-3 w-3" /> Chuva em 35 min</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-teal-300" /> Sequência otimizada</CardTitle>
                <CardDescription className="text-slate-300">Prioridades, trânsito em tempo real e horários agendados considerados.</CardDescription>
              </div>
              <Button className="rounded-2xl bg-teal-400 font-bold text-slate-950 hover:bg-teal-300"><Navigation className="mr-2 h-4 w-4" /> Iniciar rota</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {optimizedStops.map((stop, index) => (
                <div key={`${stop.name}-${stop.eta}`} className="grid gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-400 text-lg font-black text-slate-950">{index + 1}</div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{stop.name}</p>
                      <Badge variant="outline" className="border-white/15 text-slate-200">{stop.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{stop.address}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-300 md:text-right">
                    <span>{stop.eta}</span>
                    <span>{stop.distance}</span>
                    <span className="font-bold text-emerald-300">{stop.savings}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            {financeStats.map((item) => (
              <Card key={item.label} className="border-white/10 bg-white/[0.04] text-white">
                <CardContent className="p-5">
                  <DollarSign className="mb-3 h-5 w-5 text-emerald-300" />
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-black">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge className="mb-3 bg-teal-300 text-teal-950 hover:bg-teal-300">Plataforma SaaS completa</Badge>
            <h2 className="text-3xl font-black md:text-5xl">Tudo que a operação precisa no mesmo fluxo.</h2>
          </div>
          <p className="max-w-2xl text-slate-300">Da importação ao comprovante, do painel administrativo aos relatórios PDF/Excel, com arquitetura modular para escalar de um entregador a uma frota.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="border-white/10 bg-white/[0.04] text-white transition hover:-translate-y-1 hover:bg-white/[0.07]">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-300/15 text-teal-200"><Icon className="h-6 w-6" /></div>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="text-slate-300">{text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Tabs defaultValue="proof" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-3xl bg-white/10 p-2 md:grid-cols-4">
            <TabsTrigger value="proof" className="rounded-2xl py-3 data-[state=active]:bg-teal-400 data-[state=active]:text-slate-950">Comprovante</TabsTrigger>
            <TabsTrigger value="tracking" className="rounded-2xl py-3 data-[state=active]:bg-teal-400 data-[state=active]:text-slate-950">Rastreamento</TabsTrigger>
            <TabsTrigger value="admin" className="rounded-2xl py-3 data-[state=active]:bg-teal-400 data-[state=active]:text-slate-950">Admin web</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-2xl py-3 data-[state=active]:bg-teal-400 data-[state=active]:text-slate-950">IA tempo real</TabsTrigger>
          </TabsList>
          <TabsContent value="proof" className="mt-6">
            <FeaturePanel icon={Fingerprint} title="Comprovante de entrega com validade operacional" text="Registre foto, assinatura digital, nome do recebedor, observação, data, hora e GPS. Se o cliente estiver ausente, capture evidências do local e gere relatório automático." chips={["Foto", "Assinatura", "GPS", "Cliente ausente"]} />
          </TabsContent>
          <TabsContent value="tracking" className="mt-6">
            <FeaturePanel icon={QrCode} title="Link de rastreamento compartilhável" text="Crie um link para o cliente acompanhar o entregador no mapa e receber estimativas como: seu pedido está a 10 minutos de distância." chips={["Mapa ao vivo", "ETA", "WhatsApp", "Privacidade"]} />
          </TabsContent>
          <TabsContent value="admin" className="mt-6">
            <FeaturePanel icon={Users} title="Painel web para empresas e transportadoras" text="Veja entregadores online, localização em tempo real, criação de rotas, redistribuição de entregas, indicadores, exportações PDF/Excel e controle de equipes." chips={["Multiusuários", "Frotas", "Relatórios", "API"]} />
          </TabsContent>
          <TabsContent value="ai" className="mt-6">
            <FeaturePanel icon={AlertTriangle} title="Reorganização inteligente em tempo real" text="A IA monitora trânsito, acidentes, bloqueios e chuvas para sugerir: nova sequência recomendada. Economia estimada de 18 minutos." chips={["Trânsito", "Bloqueios", "Chuva", "Recalcular"]} />
          </TabsContent>
        </Tabs>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {operatingModes.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] text-white">
            <CardHeader>
              <Icon className="mb-4 h-8 w-8 text-teal-300" />
              <CardTitle>{title}</CardTitle>
              <CardDescription className="text-slate-300">{text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-teal-300" /> Arquitetura prevista</CardTitle>
              <CardDescription className="text-slate-300">Base técnica para Android, iOS e Web com escalabilidade SaaS.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {architecture.map((item) => <Badge key={item} variant="outline" className="rounded-full border-white/15 px-3 py-2 text-slate-200">{item}</Badge>)}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-teal-400 text-slate-950">
            <CardHeader>
              <CardTitle className="text-3xl font-black">Fluxo principal validado</CardTitle>
              <CardDescription className="text-slate-800">Abrir app → inserir/importar entregas → otimizar → navegar → registrar comprovantes → acompanhar lucro.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {["Detectar endereços", "Calcular sequência", "Iniciar navegação"].map((step, index) => (
                <div key={step} className="rounded-3xl bg-slate-950 p-4 text-white">
                  <p className="text-sm text-teal-200">Etapa {index + 1}</p>
                  <p className="mt-1 font-black">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-3xl font-black md:text-5xl">Planos de assinatura</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative border-white/10 text-white ${plan.featured ? "bg-teal-400 text-slate-950" : "bg-white/[0.04]"}`}>
              {plan.featured && <Badge className="absolute right-5 top-5 bg-slate-950 text-white hover:bg-slate-950">Mais escolhido</Badge>}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-4xl font-black">{plan.price}<span className="text-base font-semibold opacity-70">/mês</span></p>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.perks.map((perk) => (
                  <div key={perk} className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> <span>{perk}</span></div>
                ))}
                <Button className={`mt-4 w-full rounded-2xl ${plan.featured ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-white text-slate-950 hover:bg-slate-100"}`}>Começar agora</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 text-center text-slate-400">
        <p className="font-semibold text-white">Rota Fácil AI — logística inteligente para a realidade brasileira.</p>
        <p className="mt-2">Projetado para ser simples como colar uma lista e poderoso como uma torre de controle.</p>
      </footer>
    </main>
  );
};

const FeaturePanel = ({
  icon: Icon,
  title,
  text,
  chips,
}: {
  icon: typeof Route;
  title: string;
  text: string;
  chips: string[];
}) => (
  <Card className="overflow-hidden border-white/10 bg-white/[0.04] text-white">
    <CardContent className="grid gap-8 p-6 md:grid-cols-[.85fr_1.15fr] md:p-8">
      <div>
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-300/15 text-teal-200"><Icon className="h-7 w-7" /></div>
        <h3 className="text-3xl font-black">{title}</h3>
        <p className="mt-4 text-lg leading-8 text-slate-300">{text}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {chips.map((chip) => <Badge key={chip} className="bg-white/10 text-white hover:bg-white/10">{chip}</Badge>)}
        </div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-black">Atendimento #8491</p>
            <p className="text-sm text-slate-400">Rua Augusta, 1500</p>
          </div>
          <Badge className="bg-emerald-400 text-emerald-950 hover:bg-emerald-400">Concluído</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input className="rounded-2xl border-white/10 bg-white/5 text-white" value="Carlos Recebedor" readOnly />
          <Input className="rounded-2xl border-white/10 bg-white/5 text-white" value="13/06/2026 10:42" readOnly />
          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-slate-300"><Upload className="mr-2 h-5 w-5" /> Foto</div>
          <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-slate-300"><WalletCards className="mr-2 h-5 w-5" /> Assinatura</div>
        </div>
        <Button className="mt-4 w-full rounded-2xl bg-teal-400 font-bold text-slate-950 hover:bg-teal-300">Salvar e avançar <ChevronRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </CardContent>
  </Card>
);

export default RotaFacilAI;
