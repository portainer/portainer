import clsx from 'clsx';

import { TableHeaderSortIcons } from '@@/datatables/TableHeaderSortIcons';

import { TemplateListDropdown } from '../TemplateListDropdown';

import styles from './TemplateListSort.module.css';

interface Props {
  options: string[];
  onChange: (value: string | null) => void;
  onDescending: () => void;
  placeholder?: string;
  sortByDescending: boolean;
  sortByButton: boolean;
  value: string;
}

export function TemplateListSort({
  options,
  onChange,
  onDescending,
  placeholder,
  sortByDescending,
  sortByButton,
  value,
}: Props) {
  return (
    <div className={styles.sortByContainer}>
      <div className={styles.sortByElement}>
        <TemplateListDropdown
          placeholder={placeholder}
          options={options}
          onChange={onChange}
          value={value}
        />
      </div>
      <div className={styles.sortByElement}>
        <button
          className={clsx(styles.sortButton, 'h-[34px]')}
          type="button"
          disabled={!sortByButton || !value}
          onClick={(e) => {
            e.preventDefault();
            onDescending();
          }}
        >
          <TableHeaderSortIcons
            sorted={sortByButton && !!value}
            descending={sortByDescending}
          />
        </button>
      </div>
    </div>
  );
}
