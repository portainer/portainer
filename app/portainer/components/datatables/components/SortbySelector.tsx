import { useEffect, useState } from 'react';

import { Select } from '@/portainer/components/form-components/ReactSelect';
import { Filter } from '@/portainer/home/types';

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
  const upIcon = 'fa fa-sort-alpha-up';
  const downIcon = 'fa fa-sort-alpha-down';
  const [iconStyle, setIconStyle] = useState(downIcon);

  useEffect(() => {
    if (sortByDescending) {
      setIconStyle(upIcon);
    } else {
      setIconStyle(downIcon);
    }
  }, [sortByDescending]);

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
          className={styles.sortButton}
          type="button"
          disabled={!sortByButton}
          onClick={(e) => {
            e.preventDefault();
            onDescending();
          }}
        >
          <i className={iconStyle} />
        </button>
      </div>
    </div>
  );
}
