import { useCallback, useEffect, useMemo, useState } from 'react';

type ShopifyStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ShopifyState {
  status: ShopifyStatus;
  lastSync?: Date;
  shopName?: string;
  domain?: string;
  apiVersion?: string;
  error?: string;
}

interface ShopifyFormState {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
}

interface TestConnectionInput {
  storeDomain: string;
  accessToken: string;
  apiVersion?: string;
}

interface ShopifyHookOptions {
  clientId: string;
  initialDomain?: string;
  initialToken?: string;
  initialApiVersion?: string;
}

const TEST_CONNECTION_MUTATION = `#graphql
  mutation TestShopifyConnection($input: ShopifyCredentialInput!) {
    testShopifyConnection(input: $input) {
      ok
      message
      shopName
      domain
    }
  }
`;

const SYNC_MUTATION = `#graphql
  mutation SyncShopifyData($input: SyncInput!) {
    syncShopifyData(input: $input) {
      ok
      message
      products
      variants
      orders
      lineItems
      hasMore
      lastCursor
    }
  }
`;

export const useShopify = ({
  clientId,
  initialDomain = '',
  initialToken = '',
  initialApiVersion = '2024-10',
}: ShopifyHookOptions) => {
  const [form, setForm] = useState<ShopifyFormState>({
    storeDomain: initialDomain,
    accessToken: initialToken,
    apiVersion: initialApiVersion,
  });

  const [state, setState] = useState<ShopifyState>({
    status: 'disconnected',
    apiVersion: initialApiVersion,
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const isConnected = state.status === 'connected';
  const isConnecting = state.status === 'connecting';

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: undefined, status: prev.status === 'error' ? 'disconnected' : prev.status }));
  }, []);

  const testConnection = useCallback(
    async ({ storeDomain, accessToken, apiVersion }: TestConnectionInput) => {
      setState((prev) => ({ ...prev, status: 'connecting', error: undefined }));

      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: TEST_CONNECTION_MUTATION,
            variables: {
              input: {
                clientId,
                storeDomain,
                accessToken,
                apiVersion,
              },
            },
          }),
        });

        const payload = await response.json();

        if (!payload?.data?.testShopifyConnection?.ok) {
          const message = payload?.data?.testShopifyConnection?.message || payload?.errors?.[0]?.message || 'Connection failed';
          setState((prev) => ({ ...prev, status: 'error', error: message }));
          return;
        }

        const result = payload.data.testShopifyConnection;
        setState({
          status: 'connected',
          shopName: result.shopName,
          domain: result.domain,
          apiVersion,
          lastSync: state.lastSync,
        });
      } catch (error: any) {
        setState((prev) => ({ ...prev, status: 'error', error: error?.message || 'Network error' }));
      }
    },
    [clientId, state.lastSync]
  );

  const syncNow = useCallback(async () => {
    if (!isConnected) return;
    setIsSyncing(true);
    setState((prev) => ({ ...prev, error: undefined }));

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SYNC_MUTATION,
          variables: {
            input: {
              clientId,
            },
          },
        }),
      });

      const payload = await response.json();
      const result = payload?.data?.syncShopifyData;

      if (!result?.ok) {
        const message = result?.message || payload?.errors?.[0]?.message || 'Sync failed';
        setState((prev) => ({ ...prev, error: message }));
        return;
      }

      setState((prev) => ({ ...prev, lastSync: new Date(), status: 'connected' }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error?.message || 'Network error' }));
    } finally {
      setIsSyncing(false);
    }
  }, [clientId, isConnected]);

  const loadExisting = useCallback(async () => {
    // Placeholder: no query endpoint yet. Keep defaults.
    return;
  }, []);

  useEffect(() => {
    loadExisting();
  }, [loadExisting]);

  const updateForm = useCallback(<K extends keyof ShopifyFormState>(key: K, value: ShopifyFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  return useMemo(
    () => ({
      form,
      state,
      isConnected,
      isConnecting,
      isSyncing,
      testConnection: (input: TestConnectionInput) => testConnection(input),
      syncNow,
      resetError,
      updateForm,
    }),
    [form, state, isConnected, isConnecting, isSyncing, testConnection, syncNow, resetError, updateForm]
  );
};

export type UseShopifyReturn = ReturnType<typeof useShopify>;
