import clsx from 'clsx';

import { Select } from '@@/form-components/ReactSelect';

import { Filter } from './types';
import styles from './SortbySelector.module.css';
import { TableHeaderSortIcons } from './TableHeaderSortIcons';

interface Props {
  filterOptions: Filter[];
  onChange: (filterOptions: Filter) => void;
  onDescending: () => void;
  placeHolder: string;
  sortByDescending: boolean;
  sortByButton: boolean;
  value?: Filter;
}

export function SortbySelector({
  filterOptions,
  onChange,
  onDescending,
  placeHolder,
  sortByDescending,
  sortByButton,
  value,
}: Props) {
  const sorted = sortByButton && !!value;
  return (
    <div className={styles.sortByContainer}>
      <div className={styles.sortByElement}>
        <Select
          placeholder={placeHolder}
          options={filterOptions}
          onChange={(option) => onChange(option as Filter)}
          isClearable
          value={value}
        />
      </div>
      <div className={styles.sortByElement}>
        <button
          className={clsx(styles.sortButton, 'h-[34px]')}
          type="button"
          disabled={!sorted}
          onClick={(e) => {
            e.preventDefault();
            onDescending();
          }}
        >
          <TableHeaderSortIcons sorted={sorted} descending={sortByDescending} />
        </button>
      </div>
    </div>
  );
}
