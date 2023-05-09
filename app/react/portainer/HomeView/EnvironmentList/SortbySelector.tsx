import clsx from 'clsx';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';
import { TableHeaderSortIcons } from '@@/datatables/TableHeaderSortIcons';

import { SortType } from '../../environments/queries/useEnvironmentList';

import styles from './SortbySelector.module.css';

interface Props {
  filterOptions: Option<SortType>[];
  onChange: (value: SortType) => void;
  onDescending: () => void;
  placeHolder: string;
  sortByDescending: boolean;
  sortByButton: boolean;
  value?: SortType;
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
        onChange={(option: SortType) => onChange(option || '')}
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
