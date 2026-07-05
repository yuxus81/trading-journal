import { useQuery } from '@tanstack/react-query';
import { signedUrl } from '@/api/storage';

/** Resolves signed URLs for a set of private storage paths. Returns a path→url map. */
export function useSignedUrls(paths: string[]): Record<string, string> {
  const { data } = useQuery({
    queryKey: ['signedUrls', [...paths].sort()],
    queryFn: async () => {
      const entries = await Promise.all(paths.map(async (p) => [p, await signedUrl(p)] as const));
      return Object.fromEntries(entries) as Record<string, string>;
    },
    enabled: paths.length > 0,
    staleTime: 50 * 60 * 1000, // signed URLs live 60 min; refresh a little before
  });
  return data ?? {};
}
