import { QueryClient, QueryCache } from '@tanstack/react-query'
import toast from 'react-hot-toast'

// Shared query client. Defaults chosen for a social/campus app where data
// (feed posts, notifications, chat) changes often but not so often that
// every single remount needs a fresh network round-trip — staleTime gives
// pages a real caching/dedup benefit (the whole point of adopting
// react-query) without serving obviously-stale data.
export const queryClient = new QueryClient({
  // GLOBAL ERROR HANDLING: every page migrated to react-query so far
  // (Feed, Notifications, Notes) had a "failed to load" toast in its old
  // hand-rolled fetch function's catch block. useQuery/useInfiniteQuery
  // don't have that same catch-block shape, and it's easy to quietly drop
  // this on every single page migrated one-by-one — which is exactly
  // what happened for the first three before this was added. A single
  // handler here covers every current and future query automatically,
  // instead of relying on remembering to re-add it per page.
  //
  // Only toasts when the query has no data at all — a genuine hard
  // failure with nothing to show — not on every background refetch
  // failure where perfectly good stale data is still on screen. Toasting
  // on every failed background refetch (e.g. one flaky request while a
  // user is mid-scroll, silently retried a moment later) would be
  // needlessly noisy for something the person may never even notice.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data === undefined) {
        toast.error('Failed to load. Please try again.')
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s: data is "fresh enough" to reuse without refetching
      retry: 1, // one retry on failure, not react-query's default of 3 — avoid hammering a genuinely-down endpoint
      refetchOnWindowFocus: true, // keep feed/notifications reasonably current when returning to the tab
    },
  },
})
