import { useState } from "react";
import { Calendar, Clock, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mockTimeRecords = [
  {
    id: "1",
    employeeName: "João Silva",
    date: "2025-10-30",
    checkIn: "08:45",
    lunchOut: "12:00",
    lunchIn: "13:00",
    checkOut: "18:15",
    totalHours: "8h 30min",
    status: "completo" as const,
  },
  {
    id: "2",
    employeeName: "Maria Santos",
    date: "2025-10-30",
    checkIn: "08:50",
    lunchOut: "12:15",
    lunchIn: "13:15",
    checkOut: "18:00",
    totalHours: "8h 00min",
    status: "completo" as const,
  },
  {
    id: "3",
    employeeName: "Pedro Oliveira",
    date: "2025-10-30",
    checkIn: "09:10",
    lunchOut: "12:30",
    lunchIn: "13:30",
    checkOut: "-",
    totalHours: "-",
    status: "em-andamento" as const,
  },
  {
    id: "4",
    employeeName: "Ana Costa",
    date: "2025-10-30",
    checkIn: "-",
    lunchOut: "-",
    lunchIn: "-",
    checkOut: "-",
    totalHours: "-",
    status: "ausente" as const,
  },
  {
    id: "5",
    employeeName: "Carlos Ferreira",
    date: "2025-10-30",
    checkIn: "08:55",
    lunchOut: "12:00",
    lunchIn: "13:00",
    checkOut: "18:10",
    totalHours: "8h 15min",
    status: "completo" as const,
  },
];

const FolhaPonto = () => {
  const [selectedDate, setSelectedDate] = useState("2025-10-30");
  const [selectedStatus, setSelectedStatus] = useState("Todos");

  const filteredRecords = mockTimeRecords.filter((record) => {
    const matchesStatus =
      selectedStatus === "Todos" || record.status === selectedStatus;
    return matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      completo: "Completo",
      "em-andamento": "Em Andamento",
      ausente: "Ausente",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    const variants = {
      completo: "default",
      "em-andamento": "secondary",
      ausente: "destructive",
    };
    return variants[status as keyof typeof variants] || "default";
  };

  const stats = [
    {
      title: "Presentes",
      value: "3",
      description: "Funcionários no momento",
      icon: "👥",
    },
    {
      title: "Ausentes",
      value: "1",
      description: "Sem registro hoje",
      icon: "❌",
    },
    {
      title: "Média de Horas",
      value: "8h 15min",
      description: "Tempo médio trabalhado",
      icon: "⏱️",
    },
    {
      title: "Horas Extras",
      value: "2h 30min",
      description: "Total do dia",
      icon: "⚡",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">
            Folha de Ponto
          </h1>
          <p className="text-primary-foreground/80 mt-1">
            Controle de ponto e horas trabalhadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Registros de Ponto</CardTitle>
              <CardDescription>
                {filteredRecords.length} registro(s) encontrado(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {new Date(selectedDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="completo">Completo</SelectItem>
                  <SelectItem value="em-andamento">Em Andamento</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída Almoço</TableHead>
                <TableHead>Retorno Almoço</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(record.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {record.employeeName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {record.checkIn}
                    </div>
                  </TableCell>
                  <TableCell>{record.lunchOut}</TableCell>
                  <TableCell>{record.lunchIn}</TableCell>
                  <TableCell>{record.checkOut}</TableCell>
                  <TableCell>
                    <span className="font-medium">{record.totalHours}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status) as any}>
                      {getStatusLabel(record.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum registro encontrado com os filtros selecionados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FolhaPonto;
