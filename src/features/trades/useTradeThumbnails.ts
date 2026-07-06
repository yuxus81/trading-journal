import { useQuery } from '@tanstack/react-query';
import { listFirstImagePaths } from '@/api/tradeImages';
import { useSignedUrls } from './useSignedUrls';

/** Resolves a trade_id → thumbnail URL map for a set of trades in as few requests as possible. */
export function useTradeThumbnails(tradeIds: string[]): Record<string, string> {
  const sortedIds = [...tradeIds].sort();
  const { data: pathMap } = useQuery({
    queryKey: ['tradeImages', 'first', sortedIds],
    queryFn: () => listFirstImagePaths(sortedIds),
    enabled: sortedIds.length > 0,
  });

  const paths = Object.values(pathMap ?? {});
  const urlMap = useSignedUrls(paths);

  const result: Record<string, string> = {};
  for (const [tradeId, path] of Object.entries(pathMap ?? {})) {
    const url = urlMap[path];
    if (url) result[tradeId] = url;
  }
  return result;
}
