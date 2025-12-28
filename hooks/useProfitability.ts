import { useEffect, useState } from 'react';

export type ProfitMetrics = {
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
};

export type SkuPerformance = {
  productId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number;
};

interface UseProfitabilityState {
  metrics: ProfitMetrics | null;
  skus: SkuPerformance[];
  loading: boolean;
  error?: string;
}

const PROFIT_QUERY = `#graphql
  query Profitability($clientId: String!, $start: String, $end: String, $sortBy: String, $sortDir: String) {
    getProfitMetrics(input: { clientId: $clientId, startDate: $start, endDate: $end }) {
      revenue
      cost
      profit
      marginPct
    }
    getSkuPerformance(input: { clientId: $clientId, startDate: $start, endDate: $end, sortBy: $sortBy, sortDir: $sortDir }) {
      productId
      name
      unitsSold
      revenue
      cost
      profit
      marginPct
    }
  }
`;

export const useProfitability = (
  clientId: string,
  startDate?: string,
  endDate?: string,
  sortBy?: string,
  sortDir?: string
) => {
  const [state, setState] = useState<UseProfitabilityState>({ metrics: null, skus: [], loading: true });

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const run = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      try {
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: PROFIT_QUERY,
            variables: { clientId, start: startDate, end: endDate, sortBy, sortDir },
          }),
        });
        const payload = await res.json();
        if (cancelled) return;
        if (payload.errors?.length) {
          throw new Error(payload.errors.map((e: any) => e.message).join('; '));
        }
        const metrics = payload.data?.getProfitMetrics;
        const skus = payload.data?.getSkuPerformance || [];
        if (!metrics) throw new Error('No metrics returned');
        setState({ metrics, skus, loading: false });
      } catch (error: any) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: error?.message || 'Failed to load profitability' }));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [clientId, startDate, endDate, sortBy, sortDir]);

  return state;
};
