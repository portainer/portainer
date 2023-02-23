import clsx from 'clsx';

import { Select } from '@@/form-components/ReactSelect';
import { TableHeaderSortIcons } from '@@/datatables/TableHeaderSortIcons';

import { Filter } from './types';
import styles from './SortbySelector.module.css';

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
    <div className="flex items-center justify-end gap-1">
      <Select
        placeholder={placeHolder}
        options={filterOptions}
        onChange={(option) => onChange(option as Filter)}
        isClearable
        value={value}
      />

      <button
        className={clsx(styles.sortButton, '!m-0 h-[34px]')}
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
  );
}
