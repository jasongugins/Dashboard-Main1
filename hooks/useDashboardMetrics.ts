import { useEffect, useState } from 'react';

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
}

export interface SalesPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface UseDashboardMetricsState {
  metrics: DashboardMetrics | null;
  sales: SalesPoint[];
  loading: boolean;
  error?: string;
}

const DASHBOARD_QUERY = `#graphql
  query DashboardData($clientId: String!, $start: String, $end: String) {
    getDashboardMetrics(input: { clientId: $clientId, startDate: $start, endDate: $end }) {
      totalRevenue
      totalOrders
      averageOrderValue
      totalProducts
    }
    getSalesChartData(input: { clientId: $clientId, startDate: $start, endDate: $end }) {
      date
      revenue
      orders
    }
  }
`;

export const useDashboardMetrics = (clientId: string, startDate?: string, endDate?: string) => {
  const [state, setState] = useState<UseDashboardMetricsState>({
    metrics: null,
    sales: [],
    loading: true,
  });

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;
    const run = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: DASHBOARD_QUERY,
            variables: { clientId, start: startDate, end: endDate },
          }),
        });
        const payload = await response.json();
        if (cancelled) return;

        if (payload.errors?.length) {
          throw new Error(payload.errors.map((e: any) => e.message).join('; '));
        }
        const metrics = payload.data?.getDashboardMetrics;
        const sales = payload.data?.getSalesChartData || [];
        if (!metrics) throw new Error('No metrics returned');

        setState({ metrics, sales, loading: false });
      } catch (error: any) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: error?.message || 'Failed to load metrics' }));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [clientId, startDate, endDate]);

  return state;
};
