import { useState, useEffect, useCallback } from 'react';
import { Condominio, CondoDocument } from '@/types/condominios';

const STORAGE_KEY = 'condominios';

const generateId = () => crypto.randomUUID();

export const useCondominios = () => {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCondominios(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar condominios:', e);
      }
    }
    setLoading(false);
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(condominios));
    }
  }, [condominios, loading]);

  const addCondominio = useCallback((data: Omit<Condominio, 'id' | 'updatedAt'>) => {
    const newCondo: Condominio = {
      ...data,
      id: generateId(),
      updatedAt: new Date().toISOString(),
      documents: []
    };
    setCondominios(prev => [...prev, newCondo]);
    return newCondo;
  }, []);

  const updateCondominio = useCallback((id: string, data: Partial<Condominio>) => {
    setCondominios(prev => prev.map(c => 
      c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
    ));
  }, []);

  const deleteCondominio = useCallback((id: string) => {
    setCondominios(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCondominio = useCallback((id: string) => {
    return condominios.find(c => c.id === id);
  }, [condominios]);

  const addDocument = useCallback((condoId: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const doc: CondoDocument = {
          id: generateId(),
          name: file.name,
          url: reader.result as string,
          uploadedAt: new Date().toISOString()
        };
        setCondominios(prev => prev.map(c => 
          c.id === condoId 
            ? { ...c, documents: [...(c.documents || []), doc], updatedAt: new Date().toISOString() }
            : c
        ));
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const removeDocument = useCallback((condoId: string, docId: string) => {
    setCondominios(prev => prev.map(c => 
      c.id === condoId 
        ? { 
            ...c, 
            documents: (c.documents || []).filter(d => d.id !== docId),
            updatedAt: new Date().toISOString()
          }
        : c
    ));
  }, []);

  // Métricas
  const metricas = {
    total: condominios.length,
    ativos: condominios.filter(c => c.statusContrato === 'ativo').length,
    suspensos: condominios.filter(c => c.statusContrato === 'suspenso').length,
    finalizados: condominios.filter(c => c.statusContrato === 'finalizado').length,
    valorTotal: condominios
      .filter(c => c.statusContrato === 'ativo')
      .reduce((acc, c) => {
        const valor = parseFloat(c.valorContrato.replace(/[^\d,.-]/g, '').replace(',', '.'));
        return acc + (isNaN(valor) ? 0 : valor);
      }, 0)
  };

  // Últimos 5 atualizados
  const recentes = [...condominios]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return {
    condominios,
    loading,
    metricas,
    recentes,
    addCondominio,
    updateCondominio,
    deleteCondominio,
    getCondominio,
    addDocument,
    removeDocument
  };
};
