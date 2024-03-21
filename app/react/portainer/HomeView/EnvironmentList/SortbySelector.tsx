import clsx from 'clsx';

import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { TableHeaderSortIcons } from '@@/datatables/TableHeaderSortIcons';

import {
  SortOptions,
  SortType,
} from '../../environments/queries/useEnvironmentList';

import styles from './SortbySelector.module.css';

export type ListSortType = Exclude<SortType, 'LastCheckIn' | 'EdgeID'>;

const sortByOptions = SortOptions.filter(
  (v): v is ListSortType => !['LastCheckIn', 'EdgeID'].includes(v)
).map((v) => ({
  value: v,
  label: v,
}));

interface Props {
  onChange: (value: ListSortType) => void;
  onDescending: () => void;
  placeHolder: string;
  sortByDescending: boolean;
  sortByButton: boolean;
  value?: ListSortType;
}

export function SortbySelector({
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
        options={sortByOptions}
        onChange={(option: ListSortType) => onChange(option)}
        isClearable
        value={value}
        data-cy="home-view-sortby-selector"
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
