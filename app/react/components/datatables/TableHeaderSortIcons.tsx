import clsx from 'clsx';

import SortDownIcon from './sort-arrow-down.svg?c';
import SortUpIcon from './sort-arrow-up.svg?c';
import styles from './TableHeaderSortIcons.module.css';

interface Props {
  sorted: boolean;
  descending: boolean;
  className?: string;
}

export function TableHeaderSortIcons({ sorted, descending, className }: Props) {
  return (
    <div className="no-wrap w-min-max flex flex-row align-middle">
      <SortDownIcon
        className={clsx(
          className,
          sorted && !descending && styles.activeSortIcon,
          styles.sortIcon
        )}
        aria-hidden="true"
      />
      <SortUpIcon
        className={clsx(
          '-ml-1', // shift closer to SortDownIcon to match the mockup
          sorted && descending && styles.activeSortIcon,
          styles.sortIcon
        )}
        aria-hidden="true"
      />
    </div>
  );
}
