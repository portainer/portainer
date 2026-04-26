import clsx from 'clsx';

const PAGE_SIZE_OPTIONS = [1, 10, 25, 50, 100] as const;

interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (page: number) => void;
}

export function SortableListPagerInfo({
  page,
  pageSize,
  totalCount,
  onPageSizeChange,
  onPageChange,
}: Props) {
  if (totalCount === 0) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className="flex items-center gap-3">
      <span>
        Showing{' '}
        <strong>
          {start}–{end}
        </strong>{' '}
        of <strong>{totalCount}</strong>
      </span>

      <select
        className={clsx(
          'rounded border border-solid border-gray-4 bg-transparent px-2 py-1',
          'text-xs text-gray-7 th-highcontrast:text-gray-4 th-dark:border-gray-7 th-dark:text-gray-4',
          'cursor-pointer focus:outline-none'
        )}
        value={pageSize}
        onChange={(e) => {
          onPageSizeChange(Number(e.target.value));
          onPageChange(0);
        }}
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
