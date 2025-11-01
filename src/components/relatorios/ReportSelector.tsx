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
      {categories.map((category, idx) => (
        <div 
          key={category}
          className="animate-fade-in"
          style={{ animationDelay: `${idx * 0.1}s` }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="h-1 w-12 bg-white/40 rounded-full"></div>
            <h3 className="text-xl font-bold text-white tracking-wide">{category}</h3>
            <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports
              .filter(r => r.category === category)
              .map((report, reportIdx) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report.id)}
                    className="relative bg-white rounded-xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 text-left group overflow-hidden"
                    style={{ animationDelay: `${(idx * 0.1) + (reportIdx * 0.05)}s` }}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-destructive/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                            <Icon className="h-6 w-6 text-destructive group-hover:text-destructive transition-colors" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 pt-1">
                          <h4 className="font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors text-base leading-tight">
                            {report.name}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                      
                      {/* Arrow indicator */}
                      <div className="flex items-center justify-end gap-2 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <span className="text-xs font-semibold">Ver relatório</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
