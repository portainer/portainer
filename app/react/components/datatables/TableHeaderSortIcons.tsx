import clsx from 'clsx';

import SortDownIcon from './sort-arrow-down.svg?c';
import SortUpIcon from './sort-arrow-up.svg?c';
import styles from './TableHeaderSortIcons.module.css';

interface Props {
  sorted: boolean;
  descending: boolean;
}

export function TableHeaderSortIcons({ sorted, descending }: Props) {
  return (
    <div className="flex flex-row no-wrap w-min-max">
      <SortDownIcon
        className={clsx(
          'space-left',
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
