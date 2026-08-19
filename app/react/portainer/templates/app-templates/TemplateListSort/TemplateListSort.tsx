import clsx from 'clsx';

import { TableHeaderSortIcons } from '@@/datatables/TableHeaderSortIcons';
import { PortainerSelect } from '@@/form-components/PortainerSelect';

import styles from './TemplateListSort.module.css';

interface Props {
  options: ReadonlyArray<string>;
  onChange: (value: { id: string; desc: boolean } | undefined) => void;
  placeholder?: string;
  value: { id: string; desc: boolean } | undefined;
}

export function TemplateListSort({
  options,
  onChange,
  placeholder,
  value,
}: Props) {
  return (
    <div className={styles.sortByContainer}>
      <div className={styles.sortByElement}>
        <PortainerSelect
          placeholder={placeholder}
          options={options.map((id) => ({ label: id, value: id }))}
          onChange={(id) =>
            onChange(id ? { id, desc: value?.desc ?? false } : undefined)
          }
          bindToBody
          value={value?.id ?? null}
          isClearable
          data-cy="app-templates-sortby-selector"
        />
      </div>
      <div className={styles.sortByElement}>
        <button
          className={clsx(styles.sortButton, 'h-[34px]')}
          type="button"
          disabled={!value?.id}
          onClick={(e) => {
            e.preventDefault();
            onChange(value ? { id: value.id, desc: !value.desc } : undefined);
          }}
        >
          <TableHeaderSortIcons
            sorted={!!value}
            descending={value?.desc ?? false}
          />
        </button>
      </div>
    </div>
  );
}
