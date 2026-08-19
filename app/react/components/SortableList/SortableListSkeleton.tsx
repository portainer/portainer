const ROWS = [
  { primary: 'w-2/5', secondary: 'w-16' },
  { primary: 'w-3/5', secondary: 'w-20' },
  { primary: 'w-1/3', secondary: 'w-14' },
  { primary: 'w-1/2', secondary: 'w-16' },
  { primary: 'w-2/5', secondary: 'w-12' },
];

export function SortableListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => {
        const { primary, secondary } = ROWS[i % ROWS.length];
        return (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-solid border-gray-3 px-5 py-3 th-dark:border-gray-8"
          >
            <div
              className={`h-4 rounded bg-gray-3 ${primary} th-dark:bg-gray-8`}
            />
            <div
              className={`h-4 rounded bg-gray-2 ${secondary} th-dark:bg-gray-9`}
            />
          </div>
        );
      })}
    </div>
  );
}
