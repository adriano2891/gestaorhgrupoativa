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
      <h2
        className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide uppercase"
        style={{ fontFamily: 'Arial, sans-serif', color: '#19b2b0' }}
      >
        Relatórios de Funcionários
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {reports.map((report, idx) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 text-left group overflow-hidden flex flex-col h-full min-h-[160px]"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: '#3ee0cf' }} />

              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative flex flex-col flex-1 p-4 sm:p-5 pl-5 sm:pl-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4
                    className="font-bold text-sm sm:text-base leading-tight group-hover:text-primary transition-colors"
                    style={{ fontFamily: 'Arial, sans-serif', color: '#19b2b0' }}
                  >
                    {report.name}
                  </h4>
                </div>

                {/* Description */}
                <p
                  className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400 leading-relaxed flex-1"
                  style={{ fontFamily: 'Arial, sans-serif' }}
                >
                  {report.description}
                </p>

                {/* "Ver relatório" always visible at bottom */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-muted/30">
                  <span
                    className="text-xs font-semibold text-primary group-hover:underline"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  >
                    Ver relatório
                  </span>
                  <svg className="w-3.5 h-3.5 text-primary group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
