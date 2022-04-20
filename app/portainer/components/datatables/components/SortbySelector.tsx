import { useEffect, useState } from 'react';

import { Select } from '@/portainer/components/form-components/ReactSelect';
import { Button } from '@/portainer/components/Button';
import { Filter } from '@/portainer/home/types';

import styles from './SortbySelector.module.css';

interface Props {
  filterOptions: Filter[];
  onChange: (filterOptions: Filter) => void;
  onDescending: () => void;
  placeHolder: string;
  sortByDescending: boolean;
  sortByButton: boolean;
}

export function SortbySelector({
  filterOptions,
  onChange,
  onDescending,
  placeHolder,
  sortByDescending,
  sortByButton,
}: Props) {
  const upIcon = 'fa fa-sort-alpha-up';
  const downIcon = 'fa fa-sort-alpha-down';
  const [iconStyle, setIconStyle] = useState(upIcon);

  useEffect(() => {
    if (sortByDescending) {
      setIconStyle(downIcon);
    } else {
      setIconStyle(upIcon);
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
        />
      </div>
      <div className={styles.sortbyelement}>
        <Button
          size="medium"
          disabled={!sortByButton}
          onClick={(e) => {
            e.preventDefault();
            onDescending();
          }}
        >
          <i className={iconStyle} />
        </Button>
      </div>
    </div>
  );
}
