import { useState, useCallback, useRef } from 'react';

interface UseInfiniteScrollProps {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasMore,
  loadMore,
  threshold = 100
}: UseInfiniteScrollProps) => {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            setLoading(true);
            loadMore().finally(() => setLoading(false));
          }
        },
        { rootMargin: `${threshold}px` }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore, threshold]
  );

  return { lastElementRef, loading };
};