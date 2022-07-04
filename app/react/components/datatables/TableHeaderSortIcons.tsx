import clsx from 'clsx';

import SortDownIcon from '@/assets/images/sort-arrow-down.svg?c';
import SortUpIcon from '@/assets/images/sort-arrow-up.svg?c';

import styles from './TableHeaderSortIcons.module.css';

interface Props {
  // sortedAscending and sortedDescending can both be false, showing two muted looking icons
  sortedAscending: boolean;
  sortedDescending: boolean;
}

export function TableHeaderSortIcons({
  sortedAscending,
  sortedDescending,
}: Props) {
  return (
    <div className="flex flex-row no-wrap w-min-max">
      <SortDownIcon
        className={clsx(
          'space-left',
          sortedAscending && styles.activeSortIcon,
          styles.sortIcon
        )}
        aria-hidden="true"
      />
      <SortUpIcon
        className={clsx(
          '-ml-1', // shift closer to SortDownIcon to match the mockup
          sortedDescending && styles.activeSortIcon,
          styles.sortIcon
        )}
        aria-hidden="true"
      />
    </div>
  );
}
