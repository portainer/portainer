import clsx from 'clsx';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';
import { TableHeaderSortIcons } from '@@/datatables/TableHeaderSortIcons';

import styles from './SortbySelector.module.css';

interface Props {
  filterOptions: Option<string>[];
  onChange: (value: string) => void;
  onDescending: () => void;
  placeHolder: string;
  sortByDescending: boolean;
  sortByButton: boolean;
  value: string;
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
      <PortainerSelect
        placeholder={placeHolder}
        options={filterOptions}
        onChange={(option) => onChange(option || '')}
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
