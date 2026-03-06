/**
 * AFD - Arquivo Fonte de Dados (Portaria 671/2021)
 * ACJEF - Arquivo de Controle de Jornada para Efeitos Fiscais
 * 
 * Utilities for generating labor audit-compliant export files.
 */

interface RegistroPontoExport {
  id: string;
  user_id: string;
  data: string;
  entrada?: string;
  saida?: string;
  saida_almoco?: string;
  retorno_almoco?: string;
  saida_pausa_1?: string;
  retorno_pausa_1?: string;
  saida_pausa_2?: string;
  retorno_pausa_2?: string;
  total_horas?: string;
  horas_extras?: string;
  hash_registro?: string;
  hash_anterior?: string;
  ip_address?: string;
  user_agent?: string;
  geolocation?: string;
  origem?: string;
}

interface FuncionarioExport {
  id: string;
  nome: string;
  cpf?: string;
  cargo?: string;
  departamento?: string;
  data_admissao?: string;
}

const pad = (n: number | string, len: number): string => String(n).padStart(len, '0');
const padRight = (s: string, len: number): string => s.substring(0, len).padEnd(len, ' ');

const formatDateAFD = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return `${pad(d.getDate(), 2)}${pad(d.getMonth() + 1, 2)}${d.getFullYear()}`;
};

const formatTimeAFD = (timestamp: string | null | undefined): string => {
  if (!timestamp) return '0000';
  const d = new Date(timestamp);
  return `${pad(d.getHours(), 2)}${pad(d.getMinutes(), 2)}`;
};

/**
 * Generate AFD (Arquivo Fonte de Dados) export
 * Format: sequential lines with employee registrations
 */
export const generateAFD = (
  registros: RegistroPontoExport[],
  funcionarios: FuncionarioExport[],
  empresaCNPJ: string = '00000000000000',
  empresaRazaoSocial: string = 'GRUPO ATIVA ADMINISTRADORA'
): string => {
  const lines: string[] = [];
  const funcMap = new Map(funcionarios.map(f => [f.id, f]));
  let nsr = 1;

  // Header (type 1)
  lines.push(
    `${pad(nsr++, 9)}` +  // NSR
    `1` +                    // Type
    `2` +                    // REP-A type
    `${padRight(empresaCNPJ, 14)}` +
    `${padRight(empresaRazaoSocial, 150)}` +
    `${padRight('REP-A GRUPO ATIVA', 17)}` +
    `${formatDateAFD(new Date().toISOString().split('T')[0])}`
  );

  // Registration lines (type 3)
  registros.forEach(reg => {
    const func = funcMap.get(reg.user_id);
    const cpf = func?.cpf?.replace(/\D/g, '') || '00000000000';

    // Each timestamp is a separate AFD entry
    const marcacoes = [
      { tipo: 'E', hora: reg.entrada },
      { tipo: 'SP1', hora: reg.saida_pausa_1 },
      { tipo: 'RP1', hora: reg.retorno_pausa_1 },
      { tipo: 'SA', hora: reg.saida_almoco },
      { tipo: 'RA', hora: reg.retorno_almoco },
      { tipo: 'SP2', hora: reg.saida_pausa_2 },
      { tipo: 'RP2', hora: reg.retorno_pausa_2 },
      { tipo: 'S', hora: reg.saida },
    ].filter(m => m.hora);

    marcacoes.forEach(m => {
      lines.push(
        `${pad(nsr++, 9)}` +          // NSR
        `3` +                            // Type (marcação)
        `${formatDateAFD(reg.data)}` +   // Date
        `${formatTimeAFD(m.hora)}` +     // Time
        `${padRight(cpf, 11)}` +         // CPF
        `${padRight(func?.nome || '', 52)}` +
        `${padRight(m.tipo, 3)}`         // Tipo marcação
      );
    });
  });

  // Trailer (type 9)
  lines.push(
    `${pad(nsr, 9)}` +
    `9` +
    `${pad(nsr - 1, 9)}`  // Total de registros
  );

  return lines.join('\n');
};

/**
 * Generate ACJEF (Arquivo de Controle de Jornada para Efeitos Fiscais)
 */
export const generateACJEF = (
  registros: RegistroPontoExport[],
  funcionarios: FuncionarioExport[],
  empresaCNPJ: string = '00000000000000',
  empresaRazaoSocial: string = 'GRUPO ATIVA ADMINISTRADORA'
): string => {
  const lines: string[] = [];
  const funcMap = new Map(funcionarios.map(f => [f.id, f]));
  let seq = 1;

  // Header
  lines.push(
    `${pad(seq++, 9)}` +
    `1` +
    `${padRight(empresaCNPJ, 14)}` +
    `${padRight(empresaRazaoSocial, 150)}` +
    `ACJEF` +
    `${formatDateAFD(new Date().toISOString().split('T')[0])}`
  );

  // Group by employee
  const byEmployee = new Map<string, RegistroPontoExport[]>();
  registros.forEach(r => {
    if (!byEmployee.has(r.user_id)) byEmployee.set(r.user_id, []);
    byEmployee.get(r.user_id)!.push(r);
  });

  byEmployee.forEach((regs, userId) => {
    const func = funcMap.get(userId);
    const cpf = func?.cpf?.replace(/\D/g, '') || '00000000000';

    regs.sort((a, b) => a.data.localeCompare(b.data));

    regs.forEach(reg => {
      const parseInterval = (interval: string | null | undefined): number => {
        if (!interval) return 0;
        const match = interval.match(/(\d+):(\d+)/);
        if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
        return 0;
      };

      lines.push(
        `${pad(seq++, 9)}` +
        `4` +                              // Type (detalhe jornada)
        `${padRight(cpf, 11)}` +
        `${padRight(func?.nome || '', 52)}` +
        `${formatDateAFD(reg.data)}` +
        `${formatTimeAFD(reg.entrada)}` +
        `${formatTimeAFD(reg.saida_almoco)}` +
        `${formatTimeAFD(reg.retorno_almoco)}` +
        `${formatTimeAFD(reg.saida)}` +
        `${pad(parseInterval(reg.total_horas), 4)}` +
        `${pad(parseInterval(reg.horas_extras), 4)}`
      );
    });
  });

  // Trailer
  lines.push(
    `${pad(seq, 9)}` +
    `9` +
    `${pad(seq - 1, 9)}`
  );

  return lines.join('\n');
};

/**
 * Download text as file
 */
export const downloadTextFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};
