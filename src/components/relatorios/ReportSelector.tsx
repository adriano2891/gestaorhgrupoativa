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
    <div className="space-y-6">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-white mb-4 px-2">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports
              .filter(r => r.category === category)
              .map(report => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="bg-white rounded-lg p-4 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/20 transition-colors">
                        <Icon className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {report.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};
