export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
        </div>
        <div className="w-16 h-6 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
    </div>
  )
}