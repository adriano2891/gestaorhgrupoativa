import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ReportViewerProps {
  reportType: string;
  data: any;
}

export const ReportViewer = ({ reportType, data }: ReportViewerProps) => {
  const renderSummary = () => {
    if (!data.summary || Object.keys(data.summary).length === 0) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {Object.entries(data.summary).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">{value as string}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCharts = () => {
    if (!data.charts || data.charts.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {data.charts.map((chart: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {chart.type === "line" ? (
                  <LineChart data={chart.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={Object.keys(chart.data[0])[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                ) : (
                  <BarChart data={chart.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={Object.keys(chart.data[0])[0]} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valor" fill="#8884d8" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderTable = () => {
    if (!data.details || data.details.length === 0) return null;

    const columns = Object.keys(data.details[0]);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col} className="capitalize">
                      {col.replace(/([A-Z])/g, " $1").trim()}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    {columns.map(col => (
                      <TableCell key={col}>{row[col]}</TableCell>
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
    <div className="space-y-6">
      {renderSummary()}
      {renderCharts()}
      {renderTable()}
    </div>
  );
};
