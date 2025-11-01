import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparativoChartProps {
  title: string;
  description: string;
  data: any[];
}

export const ComparativoChart = ({
  title,
  description,
  data,
}: ComparativoChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="departamento" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="custo"
              fill="hsl(var(--primary))"
              name="Custo (R$)"
            />
            <Bar
              dataKey="funcionarios"
              fill="hsl(var(--chart-2))"
              name="Funcionários"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
