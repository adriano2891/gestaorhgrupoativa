import { useQuery } from "@tanstack/react-query";

export interface Holerite {
  id: string;
  user_id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  descontos: number;
  salario_liquido: number;
  arquivo_url: string | null;
  created_at: string;
  updated_at?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getAccessToken = (): string | null => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
    const storageKey = `sb-${projectId}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw)?.access_token || null;
  } catch { return null; }
};

const restGet = async (path: string) => {
  const token = getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`REST ${res.status}`);
  return res.json();
};

export const useHolerites = (userId?: string) => {
  return useQuery({
    queryKey: ["holerites", userId || "all"],
    queryFn: async () => {
      try {
        if (userId) {
          const data: Holerite[] = await restGet(
            `holerites?select=*&user_id=eq.${userId}&order=ano.desc,mes.desc`
          );
          return (data || []) as Holerite[];
        }

        // Admin: fetch all holerites
        const allHolerites: Holerite[] = await restGet(
          `holerites?select=*&order=ano.desc,mes.desc`
        );

        if (!allHolerites || allHolerites.length === 0) return [] as Holerite[];

        // Filter by active employees
        const uniqueUserIds = [...new Set(allHolerites.map(h => h.user_id))];
        const idsParam = uniqueUserIds.map(id => `"${id}"`).join(',');
        const profiles: any[] = await restGet(
          `profiles?select=id,status&id=in.(${idsParam})`
        );

        const activeIds = new Set(
          (profiles || [])
            .filter(p => p.status !== 'demitido' && p.status !== 'pediu_demissao')
            .map(p => p.id)
        );

        return allHolerites.filter(h => activeIds.has(h.user_id)) as Holerite[];
      } catch (e) {
        console.error("Erro em useHolerites:", e);
        return [] as Holerite[];
      }
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};

export const useHoleriteByMesAno = (userId: string, mes: number, ano: number) => {
  return useQuery({
    queryKey: ["holerite", userId, mes, ano],
    queryFn: async () => {
      try {
        const data: Holerite[] = await restGet(
          `holerites?select=*&user_id=eq.${userId}&mes=eq.${mes}&ano=eq.${ano}&limit=1`
        );
        return (data && data.length > 0 ? data[0] : null) as Holerite | null;
      } catch (e) {
        console.error("Erro em useHoleriteByMesAno:", e);
        return null;
      }
    },
    enabled: !!userId && !!mes && !!ano,
  });
};
