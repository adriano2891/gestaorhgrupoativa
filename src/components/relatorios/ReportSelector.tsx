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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {reports.map((report, idx) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => onSelectReport(report.id)}
              className="relative overflow-hidden rounded-2xl border-[2.5px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 text-left group flex flex-col h-full min-h-[170px]"
              style={{
                animationDelay: `${idx * 0.04}s`,
                background: 'linear-gradient(135deg, hsl(174 40% 92%) 0%, hsl(174 35% 88%) 50%, hsl(174 30% 85%) 100%)',
                borderColor: 'hsl(174 50% 55%)',
              }}
            >
              {/* Geometric pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 15% 85%, hsl(174 50% 40%) 1px, transparent 1px),
                    radial-gradient(circle at 85% 25%, hsl(174 50% 60%) 1.5px, transparent 1.5px),
                    radial-gradient(circle at 75% 75%, hsl(174 50% 50%) 1px, transparent 1px)
                  `,
                  backgroundSize: '60px 60px, 80px 80px, 50px 50px',
                }}
              />

              {/* Subtle glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative flex flex-col flex-1 p-5 sm:p-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: 'hsl(174 30% 82%)' }}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: 'hsl(174 60% 30%)' }} />
                  </div>
                  <h4
                    className="font-bold text-sm sm:text-base leading-tight"
                    style={{ fontFamily: 'Arial, sans-serif', color: 'hsl(174 60% 25%)' }}
                  >
                    {report.name}
                  </h4>
                </div>

                {/* Description */}
                <p
                  className="text-xs sm:text-sm leading-relaxed flex-1"
                  style={{ fontFamily: 'Arial, sans-serif', color: 'hsl(174 20% 35%)' }}
                >
                  {report.description}
                </p>

                {/* "Ver relatório" at bottom right */}
                <div className="flex items-center justify-end gap-1.5 mt-4">
                  <span
                    className="text-xs sm:text-sm font-semibold group-hover:underline"
                    style={{ fontFamily: 'Arial, sans-serif', color: 'hsl(174 60% 30%)' }}
                  >
                    Ver relatório
                  </span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" style={{ color: 'hsl(174 60% 30%)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
