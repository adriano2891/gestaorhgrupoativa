import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, Clock, Target, AlertCircle, CheckCircle2, DollarSign, Percent, CreditCard, Building2, Receipt, Wallet, HeartPulse, Bus, UserMinus, FileText, Briefcase, CircleDollarSign, BadgeDollarSign, Landmark, ShieldCheck, CalendarDays, Banknote, PiggyBank, Filter, Search, X } from "lucide-react";

interface ReportViewerProps {
  reportType: string;
  data: any;
}

// Cor padrão para gráficos de barras (Torre): #4cdecf
const BAR_CHART_COLOR = "#4cdecf";

const CHART_COLORS = [
  BAR_CHART_COLOR,
  "hsl(var(--destructive))",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const PIE_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export const ReportViewer = ({ reportType, data }: ReportViewerProps) => {
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusColor = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (key.toLowerCase().includes("presença") || key.toLowerCase().includes("retenção") || key.toLowerCase().includes("eficiência")) {
      if (numValue >= 90) return "text-green-600 bg-green-50";
      if (numValue >= 70) return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
    }
    if (key.toLowerCase().includes("absenteísmo")) {
      if (numValue <= 3) return "text-green-600 bg-green-50";
      if (numValue <= 6) return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
    }
    return "text-primary bg-primary/10";
  };

  const getItemIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes("período") || k.includes("periodo")) return CalendarDays;
    if (k.includes("pagamento")) return Users;
    if (k.includes("proventos") || k.includes("bruto")) return Banknote;
    if (k.includes("horas extras")) return Clock;
    if (k.includes("noturno")) return Clock;
    if (k.includes("dsr") || k.includes("reflexo")) return FileText;
    if (k.includes("inss")) return ShieldCheck;
    if (k.includes("irrf")) return Landmark;
    if (k.includes("fgts")) return PiggyBank;
    if (k.includes("vt") || k.includes("transporte")) return Bus;
    if (k.includes("saúde") || k.includes("saude")) return HeartPulse;
    if (k.includes("odonto")) return HeartPulse;
    if (k.includes("faltas")) return UserMinus;
    if (k.includes("desconto")) return Receipt;
    if (k.includes("líquida") || k.includes("liquida")) return Wallet;
    if (k.includes("encargos")) return Building2;
    if (k.includes("custo")) return CircleDollarSign;
    return DollarSign;
  };

  const categorizeItems = (items: [string, unknown][]) => {
    const rendaKeys = ["período", "periodo", "pagamento", "proventos", "horas extras", "noturno", "dsr", "reflexo"];
    const descontoKeys = ["inss", "irrf", "fgts", "vt", "transporte", "saúde", "saude", "odonto", "faltas", "desconto"];
    const resultadoKeys = ["líquida", "liquida", "encargos", "custo"];

    const matchGroup = (key: string, groupKeys: string[]) => {
      const k = key.toLowerCase();
      return groupKeys.some(gk => k.includes(gk));
    };

    const renda = items.filter(([k]) => matchGroup(k, rendaKeys));
    const descontos = items.filter(([k]) => matchGroup(k, descontoKeys));
    const resultado = items.filter(([k]) => matchGroup(k, resultadoKeys));

    // Items that don't match any group
    const categorized = new Set([...renda, ...descontos, ...resultado].map(([k]) => k));
    const outros = items.filter(([k]) => !categorized.has(k));

    return { renda, descontos, resultado, outros };
  };

  const renderSummaryCard = (key: string, value: unknown, isHighlighted: boolean = false) => {
    const Icon = getItemIcon(key);
    if (isHighlighted) {
      return (
        <div key={key} className="bg-card rounded-xl border-2 border-primary/40 p-3 sm:p-4 flex items-start justify-between gap-2 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-3 h-3 text-primary" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">
                {key}
              </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-primary leading-tight">
              {value as string}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div key={key} className="flex items-center gap-2 py-1.5 px-1">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary/70" />
        </div>
        <span className="text-xs sm:text-sm text-foreground/80 flex-1 truncate">{key}</span>
        <span className="text-xs sm:text-sm font-bold text-foreground whitespace-nowrap">{value as string}</span>
      </div>
    );
  };

  const renderColumn = (title: string, items: [string, unknown][], highlightKeys: string[]) => {
    if (items.length === 0) return null;
    const highlighted = items.filter(([k]) => highlightKeys.some(hk => k.toLowerCase().includes(hk)));
    const regular = items.filter(([k]) => !highlightKeys.some(hk => k.toLowerCase().includes(hk)));

    return (
      <div className="flex flex-col gap-2">
        <h4 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.15em]">
          {title}
        </h4>
        {highlighted.map(([k, v]) => renderSummaryCard(k, v, true))}
        <div className="flex flex-col">
          {regular.map(([k, v]) => renderSummaryCard(k, v, false))}
        </div>
      </div>
    );
  };

  const renderEnhancedSummary = () => {
    if (!data.summary || Object.keys(data.summary).length === 0) return null;

    const summaryItems = Object.entries(data.summary);
    const { renda, descontos, resultado, outros } = categorizeItems(summaryItems);
    const hasGroups = renda.length > 0 || descontos.length > 0 || resultado.length > 0;

    // If items can be grouped into financial categories, use 3-column layout
    if (hasGroups) {
      // Find period item for header
      const periodItem = summaryItems.find(([k]) => k.toLowerCase().includes("período") || k.toLowerCase().includes("periodo"));
      const pagamentosItem = summaryItems.find(([k]) => k.toLowerCase().includes("pagamento"));

      return (
        <div className="mb-6 sm:mb-8">
          {/* Header with period info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            {periodItem && (
              <div className="bg-card rounded-xl border-2 border-primary/40 px-4 py-3 inline-flex flex-col shadow-sm">
                <span className="text-[9px] font-bold text-foreground uppercase tracking-[0.2em]">PERÍODO</span>
                <span className="text-base sm:text-lg font-bold text-primary">{periodItem[1] as string}</span>
              </div>
            )}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                SUMÁRIO FINANCEIRO
              </h3>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5">
                {periodItem && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-primary/60" />
                    {periodItem[1] as string}
                  </span>
                )}
                {pagamentosItem && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary/60" />
                    Pagamentos: {pagamentosItem[1] as string}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3-column grouped layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {renderColumn("RENDA E GANHOS", renda.filter(([k]) => {
              const kl = k.toLowerCase();
              return !kl.includes("período") && !kl.includes("periodo") && !kl.includes("pagamento");
            }), ["proventos", "bruto"])}
            {renderColumn("DESCONTOS", descontos, ["total desconto", "total descontos"])}
            {renderColumn("RESULTADO LÍQUIDO E CUSTO", resultado, ["líquida", "liquida", "custo"])}
          </div>

          {/* Uncategorized items */}
          {outros.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {outros.map(([k, v]) => (
                <div key={k} className="bg-card rounded-lg border border-border border-l-[3px] border-l-primary px-3 py-3 min-h-[70px]">
                  <p className="text-[9px] font-semibold text-foreground/80 uppercase tracking-[0.25em]">{k}</p>
                  <p className="mt-1 text-base font-bold text-primary">{v as string}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Fallback: generic grid for non-financial reports
    return (
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Resumo Executivo
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {summaryItems.map(([key, value], index) => (
            <div
              key={key}
              className="bg-card rounded-lg border border-border border-l-[3px] border-l-primary px-3 py-3 sm:px-3.5 sm:py-3.5 min-h-[84px] flex items-start justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] font-semibold text-foreground/80 uppercase tracking-[0.28em] leading-tight">
                  {key}
                </p>
                <p className="mt-1 text-base sm:text-lg font-bold text-primary break-words leading-tight">
                  {value as string}
                </p>
              </div>
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
                  {index === 0 ? <Users className="w-3 h-3 text-primary/50" /> :
                   index === 1 ? <Clock className="w-3 h-3 text-primary/50" /> :
                   <CheckCircle2 className="w-3 h-3 text-primary/50" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-border">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name || 'Valor'}:</span>
              <span className="font-medium text-foreground">
                {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderEnhancedCharts = () => {
    if (!data.charts || data.charts.length === 0) return null;

    return (
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Análise Gráfica
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {data.charts.filter((chart: any) => chart.data && chart.data.length > 0).map((chart: any, index: number) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  {chart.type === 'pie' ? <Target className="w-4 h-4 text-primary" /> :
                   chart.type === 'line' ? <TrendingUp className="w-4 h-4 text-primary" /> :
                   <BarChart className="w-4 h-4 text-primary" />}
                  <span className="truncate">{chart.title}</span>
                </CardTitle>
                {chart.description && (
                  <CardDescription className="text-xs sm:text-sm mt-1">{chart.description}</CardDescription>
                )}
              </CardHeader>
                <CardContent className="p-3 sm:p-4 md:pt-6">
                  <div id={`report-chart-${index}`} data-chart-index={index} className="-mx-2 sm:mx-0">
                    <ResponsiveContainer width="100%" height={240} minWidth={280}>
                      {chart.type === "line" ? (
                        <AreaChart data={chart.data}>
                          <defs>
                            <linearGradient id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey={Object.keys(chart.data[0])[0]} 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke={CHART_COLORS[0]}
                        strokeWidth={3}
                        fill={`url(#colorGradient${index})`}
                        name="Valor"
                        dot={{ fill: CHART_COLORS[0], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  ) : chart.type === "pie" ? (
                    <PieChart>
                      <Pie
                        data={chart.data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        innerRadius={35}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey={Object.keys(chart.data[0])[0]}
                        label={({ cx, cy, midAngle, outerRadius, percent }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 18;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontFamily="Arial, Helvetica, sans-serif">
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                      >
                        {chart.data.map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                        formatter={(value) => <span className="text-xs sm:text-sm text-foreground">{value}</span>}
                      />
                    </PieChart>
                  ) : chart.type === "radar" ? (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chart.data}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey={Object.keys(chart.data[0])[0]} 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Radar
                        name="Valor"
                        dataKey="valor"
                        stroke={CHART_COLORS[0]}
                        fill={CHART_COLORS[0]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </RadarChart>
                  ) : chart.type === "composed" ? (
                    <ComposedChart data={chart.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey={Object.keys(chart.data[0])[0]}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="valor" fill={CHART_COLORS[0]} name="Valor" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="meta" stroke={CHART_COLORS[1]} strokeWidth={2} name="Meta" />
                    </ComposedChart>
                  ) : (
                    <BarChart data={chart.data}>
                      <defs>
                        <linearGradient id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BAR_CHART_COLOR} stopOpacity={1}/>
                          <stop offset="100%" stopColor={BAR_CHART_COLOR} stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey={Object.keys(chart.data[0])[0]} 
                        tick={{ fontSize: 10, fontFamily: 'Arial, Helvetica, sans-serif', fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        angle={-30}
                        textAnchor="end"
                        height={50}
                        interval={0}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                      />
                      <Bar 
                        dataKey="valor" 
                        fill={`url(#barGradient${index})`}
                        name={chart.dataName || "Valor"}
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                      />
                      {chart.data[0]?.meta !== undefined && (
                        <Bar 
                          dataKey="meta" 
                          fill={CHART_COLORS[1]}
                          name="Meta"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                          opacity={0.6}
                        />
                      )}
                    </BarChart>
                  )}
                    </ResponsiveContainer>
                  </div>
                  {chart.insight && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-muted-foreground">{chart.insight}</p>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderEnhancedTable = () => {
    if (!data.details || data.details.length === 0) return null;

    const columns = Object.keys(data.details[0]);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Dados Detalhados
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {data.details.length} registro{data.details.length !== 1 ? 's' : ''} encontrado{data.details.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-[10px] sm:text-xs self-start sm:self-auto">
              Atualizado agora
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {columns.map(col => (
                    <TableHead key={col} className="font-semibold text-foreground capitalize whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4">
                      {col.replace(/([A-Z])/g, " $1").trim()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map((row: any, idx: number) => (
                  <TableRow 
                    key={idx} 
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {columns.map(col => (
                      <TableCell key={col} className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        {col.toLowerCase().includes('status') ? (
                          <Badge 
                            variant={
                              String(row[col]).toLowerCase().includes('ativo') ? 'default' : 
                              String(row[col]).toLowerCase().includes('pendente') ? 'secondary' : 'outline'
                            }
                            className="text-[10px] sm:text-xs"
                          >
                            {row[col]}
                          </Badge>
                        ) : col.toLowerCase().includes('taxa') || col.toLowerCase().includes('percentual') ? (
                          <span className={`font-medium ${
                            parseFloat(row[col]) > 80 ? 'text-green-600' : 
                            parseFloat(row[col]) > 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {row[col]}
                          </span>
                        ) : (
                          <span className="text-foreground">{row[col]}</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const hasContent = (data.summary && Object.keys(data.summary).length > 0) || 
                     (data.details && data.details.length > 0) || 
                     (data.charts && data.charts.length > 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
        <span>Relatório gerado em {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
      </div>
      {!hasContent ? (
        <Card className="p-6 sm:p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-base sm:text-lg font-semibold text-foreground">Nenhum dado encontrado</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Não foram encontrados registros para os filtros selecionados. Verifique se há funcionários cadastrados no módulo de Funcionários.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {renderEnhancedSummary()}
          {renderEnhancedCharts()}
          {renderEnhancedTable()}
        </>
      )}
    </div>
  );
};