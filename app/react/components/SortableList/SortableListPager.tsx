import { SortableListPagerInfo } from './SortableListPagerInfo';
import { SortableListPagerNav } from './SortableListPagerNav';

interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function SortableListPager({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  return (
    <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-7 th-highcontrast:text-gray-4 th-dark:text-gray-4">
      <SortableListPagerInfo
        page={safePage}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        onPageChange={onPageChange}
      />
      <SortableListPagerNav
        safePage={safePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
