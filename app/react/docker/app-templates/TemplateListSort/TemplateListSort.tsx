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
  const upIcon = 'fa fa-sort-alpha-up';
  const downIcon = 'fa fa-sort-alpha-down';
  const iconStyle = sortByDescending ? upIcon : downIcon;

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
