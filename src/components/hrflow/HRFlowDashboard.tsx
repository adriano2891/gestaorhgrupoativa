import { FileText, Users, TrendingUp, Clock, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface HRFlowDashboardProps {
  onNavigate: (tab: 'forms' | 'templates' | 'analytics' | 'ai') => void;
}

const mockData = {
  responsesByDay: [
    { date: 'Seg', count: 12 },
    { date: 'Ter', count: 19 },
    { date: 'Qua', count: 15 },
    { date: 'Qui', count: 28 },
    { date: 'Sex', count: 22 },
    { date: 'Sáb', count: 8 },
    { date: 'Dom', count: 5 },
  ],
  responsesByCategory: [
    { category: 'Clima', count: 45 },
    { category: 'Desempenho', count: 32 },
    { category: 'Onboarding', count: 28 },
    { category: 'Feedback', count: 21 },
    { category: 'Treinamento', count: 15 },
  ]
};

const stats = [
  { label: 'Total de Formulários', value: '12', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { label: 'Respostas este mês', value: '248', icon: Users, color: 'bg-emerald-100 text-emerald-600' },
  { label: 'Taxa de Conclusão', value: '87%', icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
  { label: 'Tempo Médio', value: '4:32', icon: Clock, color: 'bg-amber-100 text-amber-600' },
];

const quickActions = [
  { label: 'Criar Formulário', icon: Plus, action: 'forms' as const },
  { label: 'Usar Template', icon: FileText, action: 'templates' as const },
  { label: 'Ver Analytics', icon: TrendingUp, action: 'analytics' as const },
];

export const HRFlowDashboard = ({ onNavigate }: HRFlowDashboardProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Bem-vindo ao HRFlow Pro</h1>
            <p className="text-blue-100">Transforme processos de RH em fluxos digitais automatizados</p>
          </div>
          <Button 
            onClick={() => onNavigate('ai')}
            className="bg-white text-[#2563eb] hover:bg-blue-50"
          >
            <span className="mr-2">✨</span>
            Criar com IA
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responses Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">Respostas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData.responsesByDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900">Respostas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.responsesByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis dataKey="category" type="category" stroke="#9ca3af" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-gray-900">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => onNavigate(action.action)}
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2563eb] rounded-lg flex items-center justify-center text-white">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">{action.label}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#2563eb] transition-colors" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
