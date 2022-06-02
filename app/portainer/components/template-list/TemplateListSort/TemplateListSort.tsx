import { useEffect, useState } from 'react';

import { Select } from '@/portainer/components/form-components/ReactSelect';

import styles from './TemplateListSort.module.css';

interface Filter {
  label: string;
}

interface Props {
  options: string[];
  onChange: (filterOptions: string) => void;
  onDescending: () => void;
  placeholder: string;
  sortByDescending: boolean;
  sortByButton: boolean;
  value?: string;
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

  const filterOptions: Filter[] = options.map((value) => ({ label: value }));
  const selected = value ? { label: value } : null;

  return (
    <div className={styles.sortByContainer}>
      <div className={styles.sortByElement}>
        <Select
          placeholder={placeholder}
          options={filterOptions}
          onChange={(option) => onChange((option as Filter)?.label)}
          isClearable
          value={selected}
        />
      </div>
      <div className={styles.sortByElement}>
        <button
          className={styles.sortButton}
          type="button"
          disabled={!sortByButton || !value}
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
