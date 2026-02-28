import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { TrendingUp, TrendingDown, Minus, Users, Clock, Target, AlertCircle, CheckCircle2 } from "lucide-react";

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

  const renderEnhancedSummary = () => {
    if (!data.summary || Object.keys(data.summary).length === 0) return null;

    const summaryItems = Object.entries(data.summary);
    const gridCols = summaryItems.length <= 2 ? "grid-cols-1 sm:grid-cols-2" :
                     summaryItems.length <= 3 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : 
                     summaryItems.length <= 4 ? "grid-cols-2 lg:grid-cols-4" : 
                     "grid-cols-2 md:grid-cols-3 xl:grid-cols-6";

    return (
      <div className="mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Resumo Executivo
        </h3>
        <div className={`grid ${gridCols} gap-2 sm:gap-3 md:gap-4`}>
          {summaryItems.map(([key, value], index) => {
            const colorClass = getStatusColor(key, String(value));
            return (
              <Card key={key} className="overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider break-words">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                      <p className={`text-base sm:text-lg md:text-xl font-bold ${colorClass.split(' ')[0]} group-hover:scale-105 transition-transform break-words`}>
                        {value as string}
                      </p>
                    </div>
                    <div className={`p-1.5 sm:p-2 rounded-full ${colorClass} flex-shrink-0`}>
                      {index === 0 ? <Users className="w-3 h-3 sm:w-4 sm:h-4" /> :
                       index === 1 ? <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> :
                       <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
                  <div id={`report-chart-${index}`} data-chart-index={index}>
                    <ResponsiveContainer width="100%" height={280}>
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
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="valor"
                        nameKey={Object.keys(chart.data[0])[0]}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {chart.data.map((entry: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
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
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        angle={-20}
                        textAnchor="end"
                        height={60}
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
          <div className="overflow-x-auto">
            <Table>
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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
        <span>Relatório gerado em {new Date(data.generatedAt).toLocaleString('pt-BR')}</span>
      </div>
      {renderEnhancedSummary()}
      {renderEnhancedCharts()}
      {renderEnhancedTable()}
    </div>
  );
};