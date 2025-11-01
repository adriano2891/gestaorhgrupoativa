import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Report {
  id: string;
  name: string;
  icon: LucideIcon;
  category: string;
  description: string;
}

interface ReportSelectorProps {
  reports: Report[];
  onSelectReport: (reportId: string) => void;
}

export const ReportSelector = ({ reports, onSelectReport }: ReportSelectorProps) => {
  const categories = Array.from(new Set(reports.map(r => r.category)));

  return (
    <div className="space-y-8">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-foreground mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {reports
              .filter(r => r.category === category)
              .map(report => {
                const Icon = report.icon;
                return (
                  <Card
                    key={report.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => onSelectReport(report.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-sm font-semibold">
                            {report.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs">
                        {report.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};
