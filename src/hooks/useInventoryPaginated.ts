import useSWRInfinite from 'swr/infinite';
import { Equipo } from '@/types';
import axios from 'axios';

interface InventoryPage {
  data: Equipo[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

const fetcher = (url: string) => axios.get<InventoryPage>(url).then(r => r.data);

export function useInventoryPaginated() {
  const getKey = (pageIndex: number, previousPageData: InventoryPage | null) => {
    if (previousPageData && previousPageData.data.length === 0) return null; // no more
    return `/api/inventory?page=${pageIndex + 1}&pageSize=${PAGE_SIZE}`;
  };

  const { data, error, isLoading, size, setSize, mutate, isValidating } = useSWRInfinite<InventoryPage>(getKey, fetcher, {
    revalidateFirstPage: false,
    onErrorRetry: (err, key, cfg, revalidate, { retryCount }) => {
      if (err?.response?.status === 404) return; // no retry for 404
      if (retryCount >= 3) return;
      const timeout = Math.min(1000 * 2 ** retryCount, 8000); // exponencial backoff hasta 8s
      setTimeout(() => {
        revalidate({ retryCount: retryCount + 1 });
      }, timeout);
    }
  });

  const inventory = data ? data.flatMap(d => d.data) : [];
  const total = data && data[0] ? data[0].total : 0;
  const hasMore = inventory.length < total;

  const loadMore = () => setSize(size + 1);

  const refresh = () => mutate();

  return { inventory, isLoading, isError: error, loadMore, hasMore, mutateInventory: refresh, isValidating };
} 